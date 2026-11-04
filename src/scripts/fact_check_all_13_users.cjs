const { WarEraService } = require('../services/wareraApi.js');
const api = new WarEraService();

const users = [
  'Manfredi',
  'Garang',
  'Rippedpants',
  'Digerati',
  'Maltduck',
  'Benesum',
  'Mahinda',
  'Cartmeymey',
  'Corruption',
  'Abbadon',
  'Root',
  'Sultan',
  'Psyduck'
];

const IN_GAME_COMMODITY_RATES = {
  steel: 0.0800,
  cocain: 0.0771,
  pill: 0.0771,
  ammo: 0.0758,
  coca: 0.1099,
  mysteriousPlant: 0.1099,
  petroleum: 0.0997,
  lead: 0.1032,
  cookedFish: 0.0992,
  iron: 0.1116,
  heavyAmmo: 0.0748,
  fish: 0.1034,
  oil: 0.1057,
  lightAmmo: 0.1029,
  bread: 0.0948,
  grain: 0.0764,
  limestone: 0.0942,
  concrete: 0.0883,
  wood: 0.1033,
  paper: 0.1075,
  steak: 0.0940,
  livestock: 0.0768,
  scraps: 0.2287
};

async function checkUser(uName) {
  try {
    const dossier = await api.resolveUserFull(uName);
    const userId = dossier.user?._id;
    const companies = dossier.companies || [];

    let totalDailyPp = 0;
    let totalGrossRevenue = 0;
    let totalWorkerWages = 0;
    let totalManagerCost = 0;
    let totalEmps = 0;
    let totalManagers = 0;

    const companyBreakdowns = [];

    for (const comp of companies) {
      const compId = comp.id || comp._id;
      const item = comp.itemCode || 'steel';
      const rate = IN_GAME_COMMODITY_RATES[item] || 0.09566;

      // Check manager for company
      let managerDoc = null;
      try {
        managerDoc = await api.callTrpc('manager.getByCompanyId', { companyId: compId });
      } catch (e) {}

      // Check roster hourly data if available
      let roster = null;
      try {
        roster = await api.callTrpc('employee.getCompanyRoster', { companyId: compId });
      } catch (e) {}

      const emps = (roster?.employees && roster.employees.length > 0) ? roster.employees : (comp.employees || []);
      const hourlyWage = roster?.hourly?.wageCost ?? emps.reduce((s, e) => s + (e.estimate?.wage ?? e.wage ?? 0), 0);
      const hourlyProd = roster?.hourly?.production ?? emps.reduce((s, e) => s + (e.estimate?.production ?? e.hourlyOutputPp ?? 0), 0);
      const hourlyManager = roster?.hourly?.managerCost ?? (managerDoc?.wage || managerDoc?.salary || 0);

      const dailyPp = hourlyProd * 24;
      const dailyWorkerPay = hourlyWage * 24;
      const dailyManagerPay = hourlyManager * 24;
      const dailyRev = dailyPp * rate;
      const dailyProfit = dailyRev - dailyWorkerPay - dailyManagerPay;

      totalDailyPp += dailyPp;
      totalGrossRevenue += dailyRev;
      totalWorkerWages += dailyWorkerPay;
      totalManagerCost += dailyManagerPay;
      totalEmps += emps.length;
      if (managerDoc || hourlyManager > 0) totalManagers++;

      companyBreakdowns.push({
        name: comp.name,
        item,
        rate,
        emps: emps.length,
        hasManager: !!managerDoc || hourlyManager > 0,
        managerPay: dailyManagerPay,
        dailyPp,
        dailyRev,
        dailyWorkerPay,
        dailyProfit
      });
    }

    const netProfit = totalGrossRevenue - totalWorkerWages - totalManagerCost;

    return {
      username: uName,
      userId,
      level: dossier.user?.leveling?.level,
      companiesCount: companies.length,
      employeesCount: totalEmps,
      managersCount: totalManagers,
      totalDailyPp,
      totalGrossRevenue,
      totalWorkerWages,
      totalManagerCost,
      netProfit,
      companyBreakdowns
    };
  } catch (err) {
    return {
      username: uName,
      error: err.message
    };
  }
}

async function runAll() {
  console.log(`Starting fact-check of all ${users.length} profiles...\n`);
  const results = [];
  for (const u of users) {
    console.log(`Checking [${u}]...`);
    const res = await checkUser(u);
    results.push(res);
    if (res.error) {
      console.log(`  -> ERROR: ${res.error}\n`);
    } else {
      console.log(`  -> Facilities: ${res.companiesCount} | Emps: ${res.employeesCount} | Managers: ${res.managersCount}`);
      console.log(`  -> Daily PP: ${res.totalDailyPp.toFixed(1)} PP/d`);
      console.log(`  -> Revenue: +${res.totalGrossRevenue.toFixed(2)} BTC/d`);
      console.log(`  -> Worker Salaries: -${res.totalWorkerWages.toFixed(2)} BTC/d`);
      console.log(`  -> Manager Pay: -${res.totalManagerCost.toFixed(2)} BTC/d`);
      console.log(`  -> Net Daily Profit: +${res.netProfit.toFixed(2)} BTC/d\n`);
    }
  }

  console.log('================ FINAL SUMMARY TABLE ================');
  console.log('Username'.padEnd(14) + ' | ' +
              'Co'.padStart(3) + ' | ' +
              'Wk/Mg'.padStart(6) + ' | ' +
              'Daily PP'.padStart(9) + ' | ' +
              'Gross Rev'.padStart(11) + ' | ' +
              'Worker Pay'.padStart(11) + ' | ' +
              'Manager Pay'.padStart(12) + ' | ' +
              'Net Profit'.padStart(12));
  console.log('-'.repeat(90));

  for (const r of results) {
    if (r.error) {
      console.log(`${r.username.padEnd(14)} | ERROR: ${r.error}`);
    } else {
      console.log(
        `${r.username.padEnd(14)} | ` +
        `${String(r.companiesCount).padStart(3)} | ` +
        `${(r.employeesCount + '/' + r.managersCount).padStart(6)} | ` +
        `${r.totalDailyPp.toFixed(1).padStart(9)} | ` +
        `+${r.totalGrossRevenue.toFixed(2).padStart(10)} | ` +
        `-${r.totalWorkerWages.toFixed(2).padStart(10)} | ` +
        `-${r.totalManagerCost.toFixed(2).padStart(11)} | ` +
        `+${r.netProfit.toFixed(2).padStart(11)} BTC/d`
      );
    }
  }
}

runAll().catch(console.error);
