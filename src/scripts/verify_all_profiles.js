import { WarEraService } from '../services/wareraApi.js';
import { calculatePortfolioOverview, mapCompanyFromDossier } from '../data/marketMath.js';

const api = new WarEraService();

const users = [
  { name: 'Manfredi', id: '691ff46099b6f95d035759ad' },
  { name: 'Garang', id: '692b1d8c7c6ffcfbe26095ab' },
  { name: 'Rippedpants', id: '6918ed84d9075fc1db9936b3' },
  { name: 'Digerati', id: '691922d050d80e15bc34be24' },
  { name: 'Maltduck', id: '698f25f04896c296324489a0' },
  { name: 'Benesum', id: '6980baba164c1577a1bc18a1' },
  { name: 'Mahinda', id: '681cd9a75a84696e459c1fe7' }
];

async function runVerification() {
  console.log('Fetching live prices...');
  const prices = await api.getPrices();
  console.log('Starting full pipeline verification across all 7 user profiles...\n');

  const summary = [];

  for (const u of users) {
    try {
      const dossier = await api.resolveUserFull(u.id);
      const mappedCompanies = (dossier.companies || []).map((c, idx) => mapCompanyFromDossier(c, idx, dossier.user));
      const overview = calculatePortfolioOverview({ companies: mappedCompanies, prices });

      const totalComps = mappedCompanies.length;
      const totalEmps = overview.totals.totalEmployees;
      const dailyPp = overview.totals.totalCompanyProducedPp.toFixed(1);
      const dailyGross = overview.totals.totalBaseGrossRevenue.toFixed(2);
      const dailyWages = overview.totals.totalBaseLaborExpense.toFixed(2);
      const dailyProfit = overview.totals.totalBaseNetProfit.toFixed(2);

      summary.push({
        User: u.name,
        Companies: totalComps,
        Employees: totalEmps,
        'Daily Output (PP)': dailyPp,
        'Daily Revenue (BTC)': dailyGross,
        'Daily Wages (BTC)': dailyWages,
        'Base Daily Profit (BTC)': dailyProfit
      });

      console.log(`[PASS] ${u.name}: ${totalComps} companies, ${totalEmps} employees -> Revenue: ${dailyGross} BTC, Wages: ${dailyWages} BTC, Base Daily Profit: ${dailyProfit} BTC/day`);
    } catch (err) {
      console.error(`[FAIL] ${u.name}:`, err.message);
    }
  }

  console.log('\n================ FINAL AUDIT VERIFICATION SUMMARY ================');
  console.table(summary);
}

runVerification();
