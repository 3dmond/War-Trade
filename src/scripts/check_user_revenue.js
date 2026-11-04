// Revised script to compute daily revenue per user by aggregating all owned companies
// Utilises WarEraService (src/services/wareraApi.js)

import { WarEraService } from '../services/wareraApi.js';

const usernames = [
  'Manfredi',
  'Garang',
  'Rippedpants',
  'Digerati',
  'Maltduck',
  'Benesum',
  'Mahinda',
];

const api = new WarEraService();

async function resolveUserId(username) {
  // Use the dedicated searchUsers endpoint – returns an array of matching IDs
  const ids = await api.searchUsers(username);
  return ids && ids.length > 0 ? ids[0] : null;
}

async function fetchAllCompanies() {
  // Retrieve a sizeable batch of companies; the API supports pagination via cursor.
  const all = [];
  let cursor = undefined;
  // We'll request up to 2000 companies (should be enough for the test set).
  for (let i = 0; i < 20; i++) {
    const res = await api.callTrpc('company.getCompanies', { cursor, limit: 100 });
    if (!res || !Array.isArray(res.items)) break;
    all.push(...res.items);
    if (!res.nextCursor) break;
    cursor = res.nextCursor;
  }
  return all;
}

function computeDailyRevenue(companies) {
  return companies.reduce((sum, c) => {
    const prod = typeof c.production === 'number' ? c.production : 0;
    return sum + prod * 24;
  }, 0);
}

(async () => {
  console.log('Loading all companies...');
  const allCompanies = await fetchAllCompanies();
  console.log(`Loaded ${allCompanies.length} companies.`);

  for (const name of usernames) {
    try {
      const uid = await resolveUserId(name);
      if (!uid) {
        console.log(`${name}: could not resolve user ID`);
        continue;
      }
      const owned = allCompanies.filter(c => (c.ownerId || c.owner) === uid);
      const daily = computeDailyRevenue(owned);
      console.log(`${name}: daily revenue = ${daily.toFixed(2)} BTC (companies owned: ${owned.length})`);
    } catch (e) {
      console.error(`${name}: error – ${e.message}`);
    }
  }
})();
