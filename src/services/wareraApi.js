// WarEra tRPC API Client

const DEFAULT_TOKEN = 'wae_7152c6d478d157069e449cf27f377458bafc5133686f8c222252af4b8828f09e';

// Fallback baseline prices in case of network downtime
export const FALLBACK_PRICES = {
  grain: 0.078,
  limestone: 0.084,
  iron: 0.091,
  lead: 0.109,
  petroleum: 0.089,
  mysteriousPlant: 0.081,
  livestock: 1.554,
  fish: 3.729,
  wood: 0.100,
  steel: 1.725,
  concrete: 1.703,
  oil: 0.192,
  bread: 1.913,
  steak: 3.959,
  cookedFish: 8.607,
  lightAmmo: 0.202,
  ammo: 0.831,
  heavyAmmo: 3.627,
  pill: 38.68,
  paper: 0.213,
  case1: 3.69,
  case2: 23.67,
  woodenCase: 6.51
};

// Live in-game allowed wage statistics fallback (from workOffer.getWageStats)
export const FALLBACK_WAGE_STATS = {
  allowedRange: {
    min: 0.117,
    max: 0.176,
    average: 0.1462876611051946
  },
  topOffer: 0.169,
  topEligibleOffer: 0.155
};

export class WarEraService {
  constructor(token = null) {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('warera_token') : null;
    this.token = token || saved || DEFAULT_TOKEN;
  }

  setToken(newToken) {
    this.token = newToken;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('warera_token', newToken);
    }
  }

  getToken() {
    return this.token;
  }

  async callTrpc(endpoint, queryObj = {}) {
    const inputEncoded = encodeURIComponent(JSON.stringify(queryObj));
    const isBrowser = typeof window !== 'undefined';
    const requestUrl = isBrowser ? `/api/warera/${endpoint}?input=${inputEncoded}` : `https://api2.warera.io/trpc/${endpoint}?input=${inputEncoded}`;

    try {
      const res = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'x-api-key': this.token
        }
      });

      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message || 'Unknown RPC error');
      }

      return data.result?.data;
    } catch (err) {
      console.warn(`[WarEraService] Error calling ${endpoint}:`, err.message);
      // Fallback direct request in case proxy is unavailable
      try {
        const directUrl = `https://api2.warera.io/trpc/${endpoint}?input=${inputEncoded}`;
        const directRes = await fetch(directUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'x-api-key': this.token
          }
        });
        if (directRes.ok) {
          const directData = await directRes.json();
          return directData.result?.data;
        }
      } catch (fallbackErr) {
        // Direct request also failed (expected if CORS blocks direct browser fetch)
      }
      throw err;
    }
  }

  async getPrices() {
    try {
      const data = await this.callTrpc('itemTrading.getPrices', {});
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        // Normalize alias pairs so both naming conventions resolve perfectly
        if (data.coca !== undefined && data.mysteriousPlant === undefined) {
          data.mysteriousPlant = data.coca;
        }
        if (data.cocain !== undefined && data.pill === undefined) {
          data.pill = data.cocain;
        }
        if (data.pill !== undefined && data.cocain === undefined) {
          data.cocain = data.pill;
        }
        if (data.mysteriousPlant !== undefined && data.coca === undefined) {
          data.coca = data.mysteriousPlant;
        }

        // Record persistent live price tick for historical chart integration
        this.recordPriceTick(data);
        return data;
      }
      return FALLBACK_PRICES;
    } catch (e) {
      console.info('Using fallback market prices:', e.message);
      return FALLBACK_PRICES;
    }
  }

  async getTopOrders(itemCodes = []) {
    try {
      const data = await this.callTrpc('tradingOrder.getTopOrdersPerItemCode', { itemCodes });
      if (data && typeof data === 'object') {
        // Normalize alias pairs so both conventions resolve
        if (data.coca && !data.mysteriousPlant) {
          data.mysteriousPlant = data.coca;
        }
        if (data.cocain && !data.pill) {
          data.pill = data.cocain;
        }
        if (data.pill && !data.cocain) {
          data.cocain = data.pill;
        }
        if (data.mysteriousPlant && !data.coca) {
          data.coca = data.mysteriousPlant;
        }
        return data;
      }
      return {};
    } catch (e) {
      console.warn('Failed to fetch top orders:', e.message);
      return {};
    }
  }

  async getItemTrading(itemCode) {
    try {
      const realCode = (itemCode === 'mysteriousPlant') ? 'coca' : (itemCode === 'pill') ? 'cocain' : itemCode;
      const data = await this.callTrpc('itemTrading.getItemTrading', { itemCode: realCode });
      return data;
    } catch (e) {
      console.warn(`Failed to fetch trading data for ${itemCode}:`, e.message);
      return null;
    }
  }

  async getItemTopOrders(itemCode) {
    try {
      const realCode = (itemCode === 'mysteriousPlant') ? 'coca' : (itemCode === 'pill') ? 'cocain' : itemCode;
      const data = await this.callTrpc('tradingOrder.getTopOrders', { itemCode: realCode });
      return data;
    } catch (e) {
      console.warn(`Failed to fetch orders for ${itemCode}:`, e.message);
      return null;
    }
  }

  async getTransactions({ itemCode, limit = 50, cursor = undefined, transactionType = 'trading' } = {}) {
    try {
      const realCode = (itemCode === 'mysteriousPlant') ? 'coca' : (itemCode === 'pill') ? 'cocain' : itemCode;
      const params = { transactionType, limit };
      if (realCode) params.itemCode = realCode;
      if (cursor) params.cursor = cursor;
      const data = await this.callTrpc('transaction.getPaginatedTransactions', params);
      return data;
    } catch (e) {
      console.warn(`Failed to fetch transactions for ${itemCode}:`, e.message);
      return null;
    }
  }

  async get24hPriceChanges(itemCodes = []) {
    const changes = {};
    if (!itemCodes || itemCodes.length === 0) return changes;
    
    const cacheKey = 'warera_24h_price_changes';
    const now = Date.now();
    try {
      const cached = typeof localStorage !== 'undefined' ? localStorage.getItem(cacheKey) : null;
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (now - timestamp < 60000 && data && Object.keys(data).length > 0) {
          return data;
        }
      }
    } catch {}

    const uniqueCodes = [...new Set(itemCodes)];
    await Promise.all(uniqueCodes.map(async code => {
      try {
        const realCode = (code === 'mysteriousPlant') ? 'coca' : (code === 'pill') ? 'cocain' : code;
        const data = await this.getItemTrading(realCode);
        const vals = data?.values || [];
        if (vals.length >= 2) {
          const today = vals[vals.length - 1]?.avgValue || data?.currentValue;
          const yesterday = vals[vals.length - 2]?.avgValue;
          if (typeof today === 'number' && typeof yesterday === 'number' && yesterday > 0) {
            const changePct = ((today - yesterday) / yesterday) * 100;
            const changeDiff = today - yesterday;
            const entry = {
              today,
              yesterday,
              changePct,
              changeDiff
            };
            changes[code] = entry;
            if (code === 'coca') changes.mysteriousPlant = entry;
            if (code === 'cocain') changes.pill = entry;
            if (code === 'pill') changes.cocain = entry;
            if (code === 'mysteriousPlant') changes.coca = entry;
          }
        }
      } catch (e) {}
    }));

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: now, data: changes }));
      }
    } catch {}

    return changes;
  }


  recordPriceTick(pricesObj) {
    if (typeof localStorage === 'undefined') return;
    try {
      const nowSec = Math.floor(Date.now() / 1000);
      const saved = localStorage.getItem('warera_price_ticks');
      const ticks = saved ? JSON.parse(saved) : [];
      
      // Avoid duplicate ticks within the same 30 seconds
      if (ticks.length > 0 && (nowSec - ticks[ticks.length - 1].time) < 30) {
        ticks[ticks.length - 1] = { time: nowSec, prices: pricesObj };
      } else {
        ticks.push({ time: nowSec, prices: pricesObj });
      }

      // Keep up to 1500 historical ticks
      if (ticks.length > 1500) {
        ticks.splice(0, ticks.length - 1500);
      }
      localStorage.setItem('warera_price_ticks', JSON.stringify(ticks));
    } catch (err) {
      // Storage full or private browsing
    }
  }

  getPriceTicks() {
    if (typeof localStorage === 'undefined') return [];
    try {
      const saved = localStorage.getItem('warera_price_ticks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  async getActiveBattles() {
    try {
      const data = await this.callTrpc('battle.getBattles', { isActive: true, limit: 15 });
      return data?.items || [];
    } catch (e) {
      console.warn('Failed to fetch active battles:', e);
      return [];
    }
  }

  async getLiveBattleData(battleId, roundNumber = undefined) {
    try {
      const params = { battleId };
      if (roundNumber !== undefined) params.roundNumber = roundNumber;
      return await this.callTrpc('battle.getLiveBattleData', params);
    } catch (e) {
      return null;
    }
  }

  async search(query) {
    try {
      const data = await this.callTrpc('search.searchAnything', { searchText: query });
      return data || {};
    } catch (e) {
      return {};
    }
  }

  async getUserLite(userId) {
    if (!userId) return null;
    if (this._userLiteCache && this._userLiteCache.has(userId)) {
      return this._userLiteCache.get(userId);
    }
    try {
      const data = await this.callTrpc('user.getUserLite', { userId });
      if (data) {
        if (!this._userLiteCache) this._userLiteCache = new Map();
        this._userLiteCache.set(userId, data);
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  async getUserById(userId) {
    try {
      return await this.callTrpc('user.getUserById', { userId });
    } catch (e) {
      return null;
    }
  }

  async getCompanyById(companyId) {
    try {
      return await this.callTrpc('company.getById', { companyId });
    } catch (e) {
      return null;
    }
  }

  async enrichWorkersList(workers = []) {
    return await Promise.all(workers.map(async (w, idx) => {
      let workerUser = null;
      if (w.user) {
        workerUser = await this.getUserLite(w.user);
      }
      const prodLevel = typeof workerUser?.skills?.production?.level === 'number' 
        ? workerUser.skills.production.level 
        : 0;
      const prodTotal = workerUser?.skills?.production?.value 
        || workerUser?.skills?.production?.total 
        || (10 + prodLevel * 3);

      const energyLevel = typeof workerUser?.skills?.energy?.level === 'number' 
        ? workerUser.skills.energy.level 
        : (typeof workerUser?.skills?.stamina?.level === 'number' ? workerUser.skills.stamina.level : 0);
      const energyTotal = workerUser?.skills?.energy?.value 
        || workerUser?.skills?.energy?.total 
        || (30 + energyLevel * 10);

      // Natural 24h energy regeneration capacity:
      // In WarEra, energy regenerates at 10% per hour = 2.4 * max stamina per 24 hours.
      // Each work session costs 10 energy points => daily sessions = 0.24 * energyTotal
      const dailySessions = Number((energyTotal * 0.24).toFixed(2));
      const contractedWage = typeof w.wage === 'number' ? w.wage : 0.146;
      const loyalty = typeof w.fidelity === 'number' ? w.fidelity : 0;

      return {
        id: w._id || `w-${idx}`,
        userId: w.user,
        username: workerUser?.username || `Worker #${idx + 1}`,
        avatarUrl: workerUser?.avatarUrl || null,
        level: workerUser?.leveling?.level || 1,
        productionSkill: prodLevel,
        productionPointsBase: prodTotal,
        energySkill: energyLevel,
        energyPointsTotal: energyTotal,
        dailySessions,
        workSessionsPerDay: dailySessions,
        loyaltyBonus: loyalty,
        fidelity: loyalty,
        wage: contractedWage,
        wagePerPp: contractedWage,
        joinedAt: w.joinedAt,
        employer: w.employer,
        companyId: w.company,
        isRealPlayer: true
      };
    }));
  }

  async getCompanyWorkers(companyId) {
    try {
      const res = await this.callTrpc('worker.getWorkers', { companyId });
      const workers = res?.workers || [];
      return await this.enrichWorkersList(workers);
    } catch (e) {
      console.warn(`Failed to fetch workers for company ${companyId}:`, e.message);
      return [];
    }
  }

  async getRegionById(regionId) {
    try {
      return await this.callTrpc('region.getById', { regionId });
    } catch (e) {
      return null;
    }
  }

  async getWorkOfferById(workOfferId) {
    try {
      return await this.callTrpc('workOffer.getById', { workOfferId });
    } catch (e) {
      return null;
    }
  }

  async getCompanyProductionBonus(companyId) {
    try {
      const data = await this.callTrpc('company.getProductionBonus', { companyId });
      return data || null;
    } catch (e) {
      console.warn(`Failed to fetch production bonus for ${companyId}:`, e.message);
      return null;
    }
  }

  async getCompanyFull(companyId, ownerUser = null, preloadedWorkers = null) {
    try {
      const comp = await this.getCompanyById(companyId);
      if (!comp) return null;

      const [workers, regionData, workOfferData, productionBonusData] = await Promise.all([
        preloadedWorkers ? this.enrichWorkersList(preloadedWorkers) : this.getCompanyWorkers(companyId),
        comp.region ? this.getRegionById(comp.region) : null,
        comp.workOffer ? this.getWorkOfferById(comp.workOffer) : null,
        this.getCompanyProductionBonus(companyId)
      ]);

      let owner = ownerUser;
      if (!owner && comp.user) {
        owner = await this.getUserLite(comp.user);
      }

      const totalBonusPct = typeof productionBonusData?.total === 'number'
        ? productionBonusData.total
        : undefined;

      return {
        ...comp,
        id: comp._id,
        workers: workers || [],
        workerCount: (workers || []).length,
        regionName: regionData?.name || 'Regional Sector',
        countryCode: regionData?.countryCode?.toUpperCase() || 'HQ',
        mainCity: regionData?.mainCity || '',
        regionData: regionData || null,
        workOfferData: workOfferData || null,
        productionBonusData: productionBonusData || null,
        productionBonus: totalBonusPct,
        totalBonusPct: totalBonusPct,
        strategicBonus: productionBonusData?.strategicBonus ?? 0,
        depositBonusPct: productionBonusData?.depositBonus ?? 0,
        ethicBonusPct: productionBonusData?.ethicSpecializationBonus ?? 0,
        countryBonusPct: productionBonusData?.strategicBonus ?? 5.5,
        hasDepositBonus: (productionBonusData?.depositBonus ?? 0) > 0,
        ownerUsername: owner?.username || 'Unknown',
        ownerId: owner?._id || comp.user,
        ownerAvatarUrl: owner?.avatarUrl || null,
        isRealGameCompany: true
      };
    } catch (e) {
      console.warn(`Failed to fetch full company details for ${companyId}:`, e.message);
      return null;
    }
  }

  async getUserCompanies(userId, ownerUser = null, workersMap = null) {
    try {
      const res = await this.callTrpc('company.getCompanies', { userId, perPage: 100 });
      const companyIds = res?.items || [];
      if (companyIds.length === 0) return [];
      
      // Fetch full company details, real live workers, region info, and work offer for each
      const companies = await Promise.all(
        companyIds.slice(0, 50).map(async (cid) => {
          const preloaded = workersMap ? (workersMap.get(cid.toString()) || workersMap.get(cid) || null) : null;
          return await this.getCompanyFull(cid, ownerUser, preloaded);
        })
      );
      return companies.filter(Boolean);
    } catch (e) {
      return [];
    }
  }

  async getUserEquipment(userId) {
    try {
      return await this.callTrpc('inventory.fetchCurrentEquipment', { userId });
    } catch (e) {
      return null;
    }
  }

  async getTotalWorkers(userId) {
    try {
      return await this.callTrpc('worker.getTotalWorkersCount', { userId }) || 0;
    } catch (e) {
      return 0;
    }
  }

  async getWageStats() {
    try {
      const data = await this.callTrpc('workOffer.getWageStats', {});
      if (data && data.allowedRange) {
        return data;
      }
      return FALLBACK_WAGE_STATS;
    } catch (e) {
      console.warn('Failed to fetch live wage stats:', e.message);
      return FALLBACK_WAGE_STATS;
    }
  }

  async getWorkOffersPaginated(params = { limit: 20 }) {
    try {
      const data = await this.callTrpc('workOffer.getWorkOffersPaginated', params);
      return data || null;
    } catch (e) {
      console.warn('Failed to fetch live work offers:', e.message);
      return null;
    }
  }

  async getWorkersByUser(userId) {
    try {
      const res = await this.callTrpc('worker.getWorkers', { userId });
      return res?.workersPerCompany || [];
    } catch (e) {
      console.warn('Failed to fetch workers by user:', e.message);
      return [];
    }
  }

  /**
   * Universal User Resolver:
   * Accepts:
   *  1. Direct 24-hex MongoDB user ID (e.g. 68373ebe842134b2efcfd795)
   *  2. WarEra profile URL (e.g. https://app.warera.io/user/68373ebe842134b2efcfd795 or /profile/...)
   *  3. Username string (e.g. -DonPelayo- or DonPelayo, case-insensitive, fuzzy or partial)
   * 
   * Returns a complete Dossier containing:
   *  - user profile (level, xp, skills, stats, rankings, military rank, wealth, dates)
   *  - all owned companies with live production PP, upgrade levels (storage, automatedEngine)
   *  - equipped weapons & armor with stats & durability
   *  - total workers employed and real assigned employees per company
   */
  async resolveUserFull(input) {
    if (!input || typeof input !== 'string') {
      throw new Error('Please enter a valid username, user ID, or profile link.');
    }

    input = input.trim();
    let userId = null;

    // Check 1: WarEra URL match: .../user/68373ebe842134b2efcfd795 or .../profile/...
    const urlMatch = input.match(/[a-f\d]{24}/i);
    if (urlMatch) {
      userId = urlMatch[0];
    }

    // Check 2: If no 24-hex ID found in input, search by username
    if (!userId) {
      const searchRes = await this.search(input);
      const userIds = searchRes?.userIds || [];
      if (userIds.length === 0) {
        throw new Error(`No players found matching "${input}". Check the spelling or paste your profile link directly.`);
      }

      // Fetch candidate usernames to match exact or best match
      const candidates = await Promise.all(
        userIds.slice(0, 10).map(id => this.getUserLite(id))
      );
      const valid = candidates.filter(Boolean);
      
      const cleanInput = input.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      valid.sort((a, b) => {
        const aClean = (a.username || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const bClean = (b.username || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const aExact = a.username?.toLowerCase() === input.toLowerCase() ? 3 : (aClean === cleanInput ? 2 : 0);
        const bExact = b.username?.toLowerCase() === input.toLowerCase() ? 3 : (bClean === cleanInput ? 2 : 0);
        if (aExact !== bExact) return bExact - aExact;
        return (b.leveling?.level || 0) - (a.leveling?.level || 0);
      });
      userId = valid[0]?._id || userIds[0];
    }

    // Fetch user profile, equipment, totalWorkers, wageStats, and all workers grouped by company in parallel
    const [userProfile, equipment, totalWorkers, wageStats, workersPerCompanyData] = await Promise.all([
      this.getUserById(userId),
      this.getUserEquipment(userId),
      this.getTotalWorkers(userId),
      this.getWageStats(),
      this.getWorkersByUser(userId)
    ]);

    if (!userProfile) {
      throw new Error(`User with ID ${userId} was not found on WarEra.`);
    }

    // Build company-to-workers map for instant, zero-failure worker assignment
    const workersMap = new Map();
    if (Array.isArray(workersPerCompanyData)) {
      workersPerCompanyData.forEach(item => {
        const cId = item.company?._id || item.company;
        if (cId) {
          workersMap.set(cId.toString(), item.workers || []);
        }
      });
    }

    // Resolve home region and current location
    try {
      const [homeRegionData, currentLocationData] = await Promise.all([
        userProfile.region ? this.getRegionById(userProfile.region) : null,
        userProfile.location ? this.getRegionById(userProfile.location) : null
      ]);

      if (homeRegionData) {
        userProfile.homeRegionData = homeRegionData;
        userProfile.homeRegionName = homeRegionData.name;
        userProfile.homeCountryCode = homeRegionData.countryCode?.toUpperCase();
        userProfile.homeCity = homeRegionData.mainCity;
      }
      if (currentLocationData) {
        userProfile.currentLocationData = currentLocationData;
        userProfile.currentLocationName = currentLocationData.name;
        userProfile.currentCountryCode = currentLocationData.countryCode?.toUpperCase();
        userProfile.currentCity = currentLocationData.mainCity;
      }
    } catch (e) {
      console.warn('Failed to resolve user regions:', e.message);
    }

    // Fetch all user companies with preloaded workers map for 100% accuracy
    const companies = await this.getUserCompanies(userId, userProfile, workersMap);

    // Ensure all companies have complete owner metadata and region information
    const enrichedCompanies = (companies || []).map(comp => ({
      ...comp,
      ownerUsername: comp.ownerUsername || userProfile.username,
      ownerId: comp.ownerId || userProfile._id,
      ownerAvatarUrl: comp.ownerAvatarUrl || userProfile.avatarUrl || null,
      isRealGameCompany: true
    }));

    const actualWorkersCount = enrichedCompanies.reduce((sum, c) => sum + (c.workers?.length || 0), 0);
    const finalTotalWorkers = Math.max(actualWorkersCount, totalWorkers || 0);

    return {
      user: userProfile,
      companies: enrichedCompanies,
      equipment: equipment || null,
      totalWorkers: finalTotalWorkers,
      wageStats: wageStats || FALLBACK_WAGE_STATS
    };
  }
}

export const api = new WarEraService();
