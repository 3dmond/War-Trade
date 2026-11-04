const { WarEraService } = require('../services/wareraApi.js');
const api = new WarEraService();

const IN_GAME_COMMODITY_RATES = {
  lead: 0.1032,
  petroleum: 0.0997,
  coca: 0.1099,
  mysteriousPlant: 0.1099,
  iron: 0.1116,
  cookedFish: 0.0992,
  heavyAmmo: 0.0748,
  steel: 0.0800,
  oil: 0.1057,
  fish: 0.1034,
  ammo: 0.0758,
  cocain: 0.0771,
  pill: 0.0771,
  bread: 0.0948,
  concrete: 0.0883,
  steak: 0.0940,
  lightAmmo: 0.1029,
  paper: 0.1075,
  grain: 0.0764,
  limestone: 0.0942,
  wood: 0.1033,
  livestock: 0.0768,
  scraps: 0.2287
};

async function testExactMatch() {
  const myEmps = await api.callTrpc('employee.getMyEmployees', {});
  console.log(`Total employees: ${myEmps.length}`);

  // Group by itemCode
  const byItem = {};
  let totalWages = 0;

  for (const emp of myEmps) {
    const item = emp.estimate?.itemCode || 'steel';
    const prod = (emp.estimate?.production || 0) * 24;
    const wage = (emp.estimate?.wage || 0) * 24;
    totalWages += wage;

    if (!byItem[item]) {
      byItem[item] = { dailyPp: 0, dailyWage: 0, count: 0 };
    }
    byItem[item].dailyPp += prod;
    byItem[item].dailyWage += wage;
    byItem[item].count++;
  }

  console.log('\n--- In-Game Breakdown Check ---');
  let totalRevenue = 0;
  for (const [item, data] of Object.entries(byItem)) {
    const rate = IN_GAME_COMMODITY_RATES[item] || 0.09566;
    const rev = data.dailyPp * rate;
    totalRevenue += rev;
    console.log(`${item.padEnd(16)}: ${data.dailyPp.toFixed(2).padStart(7)} PP * ${rate} = ${rev.toFixed(2).padStart(6)} BTC`);
  }

  const profit = totalRevenue - totalWages;
  console.log(`\nTotal Revenue: ${totalRevenue.toFixed(2)} BTC/day`);
  console.log(`Total Payroll: -${totalWages.toFixed(2)} BTC/day (In-game: -124.04)`);
  console.log(`Total Profit:  +${profit.toFixed(2)} BTC/day (In-game: +140.37)`);
}

testExactMatch().catch(console.error);
