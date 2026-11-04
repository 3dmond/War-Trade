const { WarEraService } = require('../services/wareraApi.js');
const api = new WarEraService();
const users = ['Manfredi', 'Garang', 'Rippedpants', 'Digerati', 'Maltduck', 'Benesum', 'Mahinda'];

const RATES = {
  lead: 0.1032, petroleum: 0.0997, coca: 0.1099, mysteriousPlant: 0.1099,
  iron: 0.1116, cookedFish: 0.0992, heavyAmmo: 0.0748, steel: 0.0800,
  oil: 0.1057, fish: 0.1034, ammo: 0.0758, cocain: 0.0771, pill: 0.0771,
  bread: 0.0948, concrete: 0.0883, steak: 0.0940, lightAmmo: 0.1029, paper: 0.1075,
  grain: 0.0764, limestone: 0.0942, wood: 0.1033, livestock: 0.0768, scraps: 0.2287
};

async function checkAll() {
  for (const uName of users) {
    try {
      const dossier = await api.resolveUserFull(uName);
      let totalDailyPp = 0;
      let totalRev = 0;
      let totalWages = 0;
      let empCount = 0;
      for (const comp of dossier.companies || []) {
        for (const emp of comp.employees || []) {
          empCount++;
          const item = comp.itemCode || 'steel';
          const rate = RATES[item] || 0.09566;
          const p = (emp.hourlyOutputPp || 0) * 24;
          const w = (emp.wage || emp.hourlyWage || 0) * 24;
          totalDailyPp += p;
          totalWages += w;
          totalRev += p * rate;
        }
      }
      console.log(`User: ${uName.padEnd(12)} | Companies: ${String(dossier.companies?.length || 0).padStart(2)} | Emps: ${String(empCount).padStart(2)} | PP/d: ${totalDailyPp.toFixed(1).padStart(7)} | Rev: +${totalRev.toFixed(2).padStart(7)} | Wage: -${totalWages.toFixed(2).padStart(7)} | Profit: +${(totalRev - totalWages).toFixed(2).padStart(7)} BTC/d`);
    } catch (e) {
      console.error(`User: ${uName} FAILED:`, e.message);
    }
  }
}
checkAll();
