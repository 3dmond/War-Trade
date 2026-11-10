// WarEra tRPC API Client — updated for v0.27+ employee system
import { getItemValuePerPp } from '../data/marketMath.js';
import { resolveCountry, registerCountry, getCountryFlag, getCountryName } from '../data/wareraCountries.js';

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

// NOTE: workOffer endpoints were removed in v0.27+. Wages are now calculated from
// employee stats: (baseProduction + trainedProduction) / 4 * marketValue * wageExpectation

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
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
          'x-api-key': this.token,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (!res.ok) {
        if (res.status === 429) {
          // Rate-limited: wait briefly and retry once
          await new Promise(r => setTimeout(r, 600));
          const retryRes = await fetch(requestUrl, {
            method: 'GET',
            cache: 'no-store',
            headers: {
              'Accept': 'application/json',
              'x-api-key': this.token,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          });
          if (retryRes.ok) {
            const retryData = await retryRes.json();
            return retryData.result?.data;
          }
        }
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
        this.lastPrices = data;
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

  async searchUsers(query) {
    try {
      const data = await this.callTrpc('search.searchUsers', { searchText: query });
      return Array.isArray(data) ? data : (data?.userIds || []);
    } catch (e) {
      return [];
    }
  }

  async getCountryById(countryId) {
    if (!countryId) return null;
    const staticResolved = resolveCountry(countryId);
    if (staticResolved && staticResolved.code !== 'HQ') {
      return {
        _id: staticResolved.id || countryId,
        name: staticResolved.name,
        code: staticResolved.code.toLowerCase()
      };
    }
    if (this._countryCache && this._countryCache.has(countryId)) {
      return this._countryCache.get(countryId);
    }
    try {
      const data = await this.callTrpc('country.getCountryById', { countryId });
      if (data) {
        registerCountry(data);
        if (!this._countryCache) this._countryCache = new Map();
        this._countryCache.set(countryId, data);
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  async getAllCountries() {
    try {
      const data = await this.callTrpc('country.getAllCountries', {});
      if (Array.isArray(data)) {
        if (!this._countryCache) this._countryCache = new Map();
        data.forEach(c => {
          registerCountry(c);
          if (c._id) this._countryCache.set(c._id, c);
        });
      }
      return data;
    } catch (e) {
      console.warn('Failed to fetch all countries:', e.message);
      return null;
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

  async getCompanyEmployees(companyId) {
    if (!companyId) return [];
    try {
      const data = await this.callTrpc('employee.getCompanyEmployees', { companyId });
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn(`Failed to fetch employees for company ${companyId}:`, e.message);
      return [];
    }
  }

  async getMyEmployees() {
    try {
      const data = await this.callTrpc('employee.getMyEmployees', {});
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn('Failed to fetch my employees:', e.message);
      return [];
    }
  }

  async getCompanyById(companyId) {
    try {
      return await this.callTrpc('company.getById', { companyId });
    } catch (e) {
      return null;
    }
  }

  /**
   * Enriches employee objects from the v0.27+ live game API.
   * Dynamic in-game conversion based on commodity recipe margins & market spot pricing.
   * Profit = Production Value - Salary
   */
  enrichEmployees(rawEmployees = [], companyContext = {}, prices = {}) {
    if (!Array.isArray(rawEmployees) || rawEmployees.length === 0) return [];
    const itemCode = companyContext.itemCode || 'steel';
    const effectivePrices = (prices && Object.keys(prices).length > 0) ? prices : (this.lastPrices || {});
    const ratePerPp = getItemValuePerPp(itemCode, effectivePrices);

    return rawEmployees.map((e, idx) => {
      const hourlyWage = typeof e.wage === 'number' ? e.wage : (typeof e.estimate?.wage === 'number' ? e.estimate.wage : (typeof e.salary === 'number' ? e.salary : 0));
      const hourlyOutputPp = typeof e.estimate?.production === 'number' ? e.estimate.production : 0;
      const dailyOutputPp = hourlyOutputPp * 24;
      const dailyWage = hourlyWage * 24;
      const dailyProductionValue = dailyOutputPp * ratePerPp;
      const dailyProfit = dailyProductionValue - dailyWage;

      const baseProd = e.base?.production ?? e.baseProduction ?? 0;
      const trainedProd = e.trained?.production ?? e.trainedProduction ?? 0;
      const luck = (e.base?.luck ?? 0) + (e.trained?.luck ?? 0);
      const resp = (e.base?.responsibility ?? 0) + (e.trained?.responsibility ?? 0);

      // Resolve exact worker country and flag from real nationality MongoDB ObjectId
      const rawNat = e.nationality || e.country || e.countryCode || e.nationalityCode || null;
      const countryResolved = resolveCountry(rawNat);
      const workerCountryCode = countryResolved?.code && countryResolved.code !== 'HQ' ? countryResolved.code : null;
      const workerCountryName = countryResolved?.name && countryResolved.code !== 'HQ' ? countryResolved.name : null;
      const flagEmoji = countryResolved?.flag || (workerCountryCode ? getCountryFlag(workerCountryCode) : '🌐');

      return {
        id: e._id || `emp-${idx}`,
        _id: e._id,
        name: e.name || `Employee #${idx + 1}`,
        username: e.name || `Employee #${idx + 1}`,
        gender: e.gender || 'male',
        age: typeof e.age === 'number' ? e.age : 30,
        avatarUrl: null,
        level: null,

        // Production & Stats
        baseProduction: baseProd,
        trainedProduction: trainedProd,
        luck,
        responsibility: resp,
        traits: Array.isArray(e.traits) ? e.traits : [],
        potential: typeof e.potential === 'number' ? e.potential : null,
        potentialMax: typeof e.potentialMax === 'number' ? e.potentialMax : null,
        wageExpectation: typeof e.wageExpectation === 'number' ? e.wageExpectation : 1.0,

        // Compensation & Financials
        wage: hourlyWage,
        salary: hourlyWage,               // BTC/hr
        dailyWage,                        // BTC/day
        dailySalary: dailyWage,
        hourlyOutputPp,                   // PP/hr
        dailyOutputPp,                    // PP/day
        dailyProductionValue,             // BTC/day
        dailyProfit,                      // BTC/day
        ratePerPp,                        // BTC/PP

        // Status & Morale
        happiness: typeof e.happinessBreakdown?.value === 'number' ? e.happinessBreakdown.value : (typeof e.happiness === 'number' ? e.happiness : 50),
        happinessBreakdown: e.happinessBreakdown || null,
        productionBonus: typeof e.productionBonus?.total === 'number' ? e.productionBonus.total : (typeof e.productionBonus === 'number' ? e.productionBonus : 0),
        productionBonusData: e.productionBonus || null,
        breakdown: e.breakdown || null,
        tool: e.toolItem || null,
        toolItem: e.toolItem || null,
        toolStatus: e.toolStatus || null,
        specializations: e.specializations || {},
        eventModifiers: e.eventModifiers || [],
        trainingHistory: e.trainingHistory || [],
        nationality: rawNat,
        nationalityId: typeof rawNat === 'string' && rawNat.length === 24 ? rawNat : (countryResolved?.id || null),
        countryCode: workerCountryCode,
        countryName: workerCountryName,
        nationalityCode: workerCountryCode,
        nationalityName: workerCountryName,
        flagEmoji,

        // Context
        companyId: companyContext.id || e.company || null,
        companyName: companyContext.name || null,
        companyItemCode: companyContext.itemCode || null,
        companyDisabled: Boolean(e.companyDisabled || e._raw?.companyDisabled || companyContext.disabled || companyContext.isDisabled || companyContext.disabledAt),
        isCompanyDisabled: Boolean(e.companyDisabled || e._raw?.companyDisabled || companyContext.disabled || companyContext.isDisabled || companyContext.disabledAt),
        _raw: e
      };
    });
  }

  async getRegionById(regionId) {
    try {
      return await this.callTrpc('region.getById', { regionId });
    } catch (e) {
      return null;
    }
  }


  // workOffer.getById removed in v0.27 — work offers replaced by embedded employee system

  async getCompanyProductionBonus(companyId) {
    try {
      const data = await this.callTrpc('company.getProductionBonus', { companyId });
      return data || null;
    } catch (e) {
      console.warn(`Failed to fetch production bonus for ${companyId}:`, e.message);
      return null;
    }
  }

  async getCompanyFull(companyId, ownerUser = null) {
    try {
      const comp = await this.getCompanyById(companyId);
      if (!comp) return null;

      // v0.27+: fetch actual company employees and manager in parallel
      const [rawEmployees, regionData, productionBonusData, managerDoc] = await Promise.all([
        this.getCompanyEmployees(companyId),
        comp.region ? this.getRegionById(comp.region) : null,
        this.getCompanyProductionBonus(companyId),
        this.callTrpc('manager.getByCompanyId', { companyId }).catch(() => null)
      ]);

      const isCompanyDocDisabled = Boolean(
        comp.disabledAt ||
        comp._raw?.disabledAt ||
        comp.disabled === true ||
        comp.isDisabled === true ||
        comp.companyDisabled === true ||
        comp.isClosed === true ||
        comp.isInactive === true ||
        comp.paused === true ||
        comp.isPaused === true ||
        comp.active === false ||
        comp.isActive === false ||
        comp.enabled === false ||
        comp.status === 'disabled' ||
        comp.status === 'inactive' ||
        comp.status === 'closed' ||
        comp.status === 'paused' ||
        (Array.isArray(rawEmployees) && rawEmployees.some(e => e.companyDisabled === true || e._raw?.companyDisabled === true))
      );

      const employees = this.enrichEmployees(
        rawEmployees, 
        { 
          id: companyId, 
          name: comp.name, 
          itemCode: comp.itemCode,
          disabled: isCompanyDocDisabled,
          isDisabled: isCompanyDocDisabled,
          disabledAt: comp.disabledAt || null
        }, 
        this.lastPrices || {}
      );

      let owner = ownerUser;
      if (!owner && comp.user) {
        owner = await this.getUserLite(comp.user);
      }

      // Resolve manager user profile details (username, avatar, country, level)
      let managerUser = null;
      let managerCountryData = null;
      if (managerDoc?.user) {
        managerUser = await this.getUserLite(managerDoc.user).catch(() => null);
        if (managerUser?.country) {
          managerCountryData = await this.getCountryById(managerUser.country).catch(() => null);
        }
      }

      const totalBonusPct = typeof productionBonusData?.total === 'number'
        ? productionBonusData.total
        : undefined;

      const countryId = regionData?.country || comp.country;
      const countryData = countryId ? await this.getCountryById(countryId) : null;
      // v0.27+: country taxes shape is { income, market, manager } (manager replaced selfWork)
      const incomeTaxPct = typeof countryData?.taxes?.income === 'number' ? countryData.taxes.income : 9.0;
      const managerTaxPct = typeof countryData?.taxes?.manager === 'number' ? countryData.taxes.manager : 0;
      const breakRoomLevel = comp.activeUpgradeLevels?.breakRoom ?? 0;

      const manager = managerDoc ? {
        id: managerDoc._id,
        userId: managerDoc.user,
        username: managerUser?.username || 'Hired Manager',
        name: managerUser?.username || 'Hired Manager',
        avatarUrl: managerUser?.avatarUrl || null,
        level: managerUser?.leveling?.level || null,
        countryCode: managerCountryData?.code?.toUpperCase() || (typeof managerUser?.country === 'string' && managerUser.country.length === 2 ? managerUser.country.toUpperCase() : null),
        countryName: managerCountryData?.name || null,
        managementLevel: managerDoc.managementLevel || managerUser?.skills?.management?.level || 1,
        managementValue: managerUser?.skills?.management?.value || (managerDoc.managementLevel ? managerDoc.managementLevel + 1 : 1),
        hourlyWage: managerDoc.hourlyWage || 0,
        dailyWage: (managerDoc.hourlyWage || 0) * 24,
        productionBonusPercent: managerDoc.productionBonusPercent || (managerDoc.managementLevel ? managerDoc.managementLevel * 2 : 0),
        isInactive: managerDoc.isInactive || false
      } : null;
      const managerPay = manager?.dailyWage || 0;

      return {
        ...comp,
        id: comp._id,
        breakRoomLevel,
        maxEmployees: Math.min(breakRoomLevel, 3),
        employees: employees || [],
        workers: employees || [],   // alias for compat
        workerCount: (employees || []).length,
        manager,
        managerPay,
        hasManager: !!manager,
        regionName: regionData?.name || 'Regional Sector',
        countryCode: regionData?.countryCode?.toUpperCase() || 'HQ',
        mainCity: regionData?.mainCity || '',
        regionData: regionData || null,
        countryData: countryData || null,
        countryTaxes: countryData?.taxes || { income: 9, market: 1, manager: 0 },
        incomeTaxPct,
        managerTaxPct,
        productionBonusData: productionBonusData || null,
        productionBonus: totalBonusPct,
        totalBonusPct: totalBonusPct,
        strategicBonus: productionBonusData?.strategicBonus ?? 0,
        depositBonusPct: productionBonusData?.depositBonus ?? 0,
        ethicBonusPct: productionBonusData?.ethicSpecializationBonus ?? 0,
        countryBonusPct: productionBonusData?.strategicBonus ?? 0,
        hasDepositBonus: (productionBonusData?.depositBonus ?? 0) > 0,
        ownerUsername: owner?.username || 'Unknown',
        ownerId: owner?._id || comp.user,
        ownerAvatarUrl: owner?.avatarUrl || null,
        isRealGameCompany: true,
        disabled: isCompanyDocDisabled,
        isDisabled: isCompanyDocDisabled,
        companyDisabled: isCompanyDocDisabled,
        isCompanyDisabled: isCompanyDocDisabled,
        disabledAt: comp.disabledAt || null
      };
    } catch (e) {
      console.warn(`Failed to fetch full company details for ${companyId}:`, e.message);
      return null;
    }
  }

  async getUserCompanies(userId, ownerUser = null) {
    try {
      const allCompanyIds = [];
      let cursor = undefined;
      while (true) {
        const res = await this.callTrpc('company.getCompanies', { userId, cursor });
        if (!res || !Array.isArray(res.items)) break;
        allCompanyIds.push(...res.items);
        if (!res.nextCursor) break;
        cursor = res.nextCursor;
      }

      if (allCompanyIds.length === 0) return [];
      
      // Fetch full company details (employees now retrieved via employee.getCompanyEmployees)
      const companies = [];
      const batchSize = 4;
      for (let i = 0; i < allCompanyIds.length; i += batchSize) {
        const batch = allCompanyIds.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(cid => this.getCompanyFull(cid, ownerUser))
        );
        companies.push(...batchResults.filter(Boolean));
      }
      return companies;
    } catch (e) {
      console.warn('Failed to fetch user companies:', e.message);
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

  // getWageStats(), getWorkOffersPaginated(), getWorkersByUser() all removed in v0.27+
  // Wages and worker data are now handled via the embedded employee system

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

    // Check 1: WarEra URL match: .../user/68373ebe842134b2efcfd795, .../company/..., or direct 24-hex ID
    const urlMatch = input.match(/[a-f\d]{24}/i);
    if (urlMatch) {
      const hexId = urlMatch[0];
      const maybeUser = await this.getUserById(hexId);
      if (maybeUser) {
        userId = hexId;
      } else {
        const maybeComp = await this.getCompanyById(hexId);
        if (maybeComp?.user) {
          userId = maybeComp.user;
        } else {
          userId = hexId;
        }
      }
    }

    // Check 2: If no 24-hex ID found in input, search by username across both user search endpoints
    if (!userId) {
      const cleanInput = input.replace(/^@/, '').trim();
      const [usersList, anythingRes] = await Promise.all([
        this.searchUsers(cleanInput),
        this.search(cleanInput)
      ]);

      let candidateIds = Array.from(new Set([
        ...(Array.isArray(usersList) ? usersList : []),
        ...(Array.isArray(anythingRes?.userIds) ? anythingRes.userIds : [])
      ]));

      // Fallback: try search without punctuation/spaces, typo permutations, or substring
      if (candidateIds.length === 0) {
        const variants = new Set();
        const stripped = cleanInput.replace(/[^a-zA-Z0-9]/g, '');
        if (stripped && stripped !== cleanInput) variants.add(stripped);
        // Common single-letter typos like double vs single consonants (e.g. Abbadon -> Abaddon)
        variants.add(cleanInput.replace(/([a-zA-Z])\1/g, '$1'));
        variants.add(cleanInput.replace(/bb/g, 'b').replace(/d/g, 'dd'));
        if (cleanInput.length >= 4) {
          variants.add(cleanInput.slice(0, 4));
        }

        for (const variant of variants) {
          if (!variant || variant === cleanInput) continue;
          try {
            const [altUsers, altAny] = await Promise.all([
              this.searchUsers(variant),
              this.search(variant)
            ]);
            const newIds = [
              ...(Array.isArray(altUsers) ? altUsers : []),
              ...(Array.isArray(altAny?.userIds) ? altAny.userIds : [])
            ];
            if (newIds.length > 0) {
              candidateIds = Array.from(new Set([...candidateIds, ...newIds]));
              break;
            }
          } catch (e) {}
        }
      }

      if (candidateIds.length === 0) {
        throw new Error(`No players found matching "${input}". Check the spelling or paste your profile link directly.`);
      }

      // Fetch candidate usernames to match exact or best match
      const candidates = await Promise.all(
        candidateIds.slice(0, 15).map(id => this.getUserLite(id))
      );
      const valid = candidates.filter(Boolean);
      
      const cleanTarget = cleanInput.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      valid.sort((a, b) => {
        const aName = a.username || '';
        const bName = b.username || '';
        const aClean = aName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const bClean = bName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const aExact = aName.toLowerCase() === cleanInput.toLowerCase() ? 10 : (aClean === cleanTarget ? 8 : (aClean.startsWith(cleanTarget) ? 4 : 0));
        const bExact = bName.toLowerCase() === cleanInput.toLowerCase() ? 10 : (bClean === cleanTarget ? 8 : (bClean.startsWith(cleanTarget) ? 4 : 0));
        if (aExact !== bExact) return bExact - aExact;
        return (b.leveling?.level || 0) - (a.leveling?.level || 0);
      });
      userId = valid[0]?._id || candidateIds[0];
    }

    // Fetch user profile and equipment in parallel
    const [userProfile, equipment] = await Promise.all([
      this.getUserById(userId),
      this.getUserEquipment(userId),
    ]);

    if (!userProfile) {
      throw new Error(`User with ID ${userId} was not found on WarEra.`);
    }

    // Resolve user country (citizenship), home region and current location
    try {
      const [homeRegionData, currentLocationData, userCountryData] = await Promise.all([
        userProfile.region ? this.getRegionById(userProfile.region) : null,
        userProfile.location ? this.getRegionById(userProfile.location) : null,
        userProfile.country ? this.getCountryById(userProfile.country) : null
      ]);

      if (userCountryData) {
        userProfile.countryData = userCountryData;
        userProfile.countryName = userCountryData.name;
        userProfile.countryCode = userCountryData.code?.toUpperCase();
      }
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
      console.warn('Failed to resolve user regions and country:', e.message);
    }

    // Fetch all user companies — workers embedded in company docs (v0.27+)
    const companies = await this.getUserCompanies(userId, userProfile);

    // Ensure all companies have complete owner metadata
    const enrichedCompanies = (companies || []).map(comp => ({
      ...comp,
      ownerUsername: comp.ownerUsername || userProfile.username,
      ownerId: comp.ownerId || userProfile._id,
      ownerAvatarUrl: comp.ownerAvatarUrl || userProfile.avatarUrl || null,
      isRealGameCompany: true
    }));

    const totalEmployees = enrichedCompanies.reduce((sum, c) => sum + (c.employees?.length || 0), 0);

    return {
      user: userProfile,
      companies: enrichedCompanies,
      equipment: equipment || null,
      totalWorkers: totalEmployees,
    };
  }
}

export const api = new WarEraService();
