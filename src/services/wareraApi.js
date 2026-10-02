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
    // Use the Vite proxy path which injects x-api-key and bypasses CORS
    const proxyUrl = `/api/warera/${endpoint}?input=${inputEncoded}`;

    try {
      const res = await fetch(proxyUrl, {
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
    try {
      return await this.callTrpc('user.getUserLite', { userId });
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

  async getUserCompanies(userId) {
    try {
      const res = await this.callTrpc('company.getCompanies', { userId, perPage: 100 });
      const companyIds = res?.items || [];
      if (companyIds.length === 0) return [];
      
      // Fetch full company details for each
      const companies = await Promise.all(
        companyIds.slice(0, 30).map(async (cid) => {
          return await this.getCompanyById(cid);
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
   *  - total workers employed
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
        userIds.slice(0, 6).map(id => this.getUserLite(id))
      );
      const valid = candidates.filter(Boolean);
      
      const exactMatch = valid.find(c => c.username?.toLowerCase() === input.toLowerCase());
      userId = exactMatch?._id || valid[0]?._id || userIds[0];
    }

    // Now pull everything in parallel!
    const [userProfile, companies, equipment, totalWorkers] = await Promise.all([
      this.getUserById(userId),
      this.getUserCompanies(userId),
      this.getUserEquipment(userId),
      this.getTotalWorkers(userId)
    ]);

    if (!userProfile) {
      throw new Error(`User with ID ${userId} was not found on WarEra.`);
    }

    return {
      user: userProfile,
      companies: companies || [],
      equipment: equipment || null,
      totalWorkers: totalWorkers || 0
    };
  }
}

export const api = new WarEraService();
