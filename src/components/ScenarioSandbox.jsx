import React, { useState, useMemo } from 'react';
import { 
  FlaskConical, 
  Swords, 
  Building2, 
  BTC, 
  Zap, 
  ShieldAlert, 
  Percent, 
  Calculator,
  ArrowRight,
  Sparkles,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { ENGINE_UPGRADE_TIERS } from '../data/gameData';

export default function ScenarioSandbox({ prices }) {
  const [activeScenario, setActiveScenario] = useState('combat');

  // Scenario 1: Expansion vs Engine Upgrade
  const concretePrice = prices.concrete || 1.703;
  const steelPrice = prices.steel || 1.725;
  const [newCompanyTargetItem, setNewCompanyTargetItem] = useState('steel');
  const [selectedEngineTier, setSelectedEngineTier] = useState(4); // Lvl 4 = 4 PP/h

  // Scenario 2: Combat Simulator Controls
  const [combatHits, setCombatHits] = useState(100);
  const [combatBaseAttack, setCombatBaseAttack] = useState(240);
  const [combatPrecision, setCombatPrecision] = useState(85); // %
  const [combatCritChance, setCombatCritChance] = useState(30); // %
  const [combatCritDamage, setCombatCritDamage] = useState(180); // %
  const [combatArmor, setCombatArmor] = useState(28); // %
  const [combatDodge, setCombatDodge] = useState(16); // %
  const [combatLootChance, setCombatLootChance] = useState(15); // %
  const [ammoType, setAmmoType] = useState('ammo'); // 'none', 'lightAmmo', 'ammo', 'heavyAmmo'
  const [useCombatPill, setUseCombatPill] = useState(true); // +80% damage for 1 hunger

  // Scenario 3: Wage & Tax Sensitivity Controls
  const [wagePerPp, setWagePerPp] = useState(0.146);
  const [ppSessionAmount, setPpSessionAmount] = useState(25); // PP generated per work session
  const [incomeTaxRate, setIncomeTaxRate] = useState(10); // %
  const [regionResistancePoints, setRegionResistancePoints] = useState(20); // Resistance points

  // Math for Scenario 1: New Company (100 Concrete) vs Engine Upgrade
  const expansionAnalysis = useMemo(() => {
    const newCompanyCost = 100 * concretePrice;
    
    // Sum steel for engine upgrade up to selected tier
    let engineSteel = 0;
    for (let l = 2; l <= selectedEngineTier; l++) {
      const t = ENGINE_UPGRADE_TIERS.find(x => x.level === l);
      if (t) engineSteel += t.steel;
    }
    const engineCost = engineSteel * steelPrice;

    // Daily PP generation:
    // New company gives an extra storage container + lets you employ more workers / self-work (e.g. 50-100 PP/day)
    // Automated engine gives fixed 24h output:
    const tierDef = ENGINE_UPGRADE_TIERS.find(t => t.level === selectedEngineTier) || ENGINE_UPGRADE_TIERS[1];
    const engineDailyPp = tierDef.ppPerHour * 24;

    const valuePerPp = Math.max(0.02, (prices[newCompanyTargetItem] || 1) * 0.05);
    const engineDailyRevenue = engineDailyPp * valuePerPp;
    const enginePaybackDays = engineDailyRevenue > 0 ? (engineCost / engineDailyRevenue).toFixed(1) : '∞';

    return {
      newCompanyCost,
      engineSteel,
      engineCost,
      engineDailyPp,
      engineDailyRevenue,
      enginePaybackDays
    };
  }, [concretePrice, steelPrice, selectedEngineTier, prices, newCompanyTargetItem]);

  // Math for Scenario 2: Combat Simulator
  const combatSimulation = useMemo(() => {
    let hitsAttempted = combatHits;
    
    // Ammo cost per hit
    let ammoCostPerHit = 0;
    let ammoBonusDamage = 0;
    if (ammoType === 'lightAmmo') {
      ammoCostPerHit = prices.lightAmmo || 0.202;
      ammoBonusDamage = 20;
    } else if (ammoType === 'ammo') {
      ammoCostPerHit = prices.ammo || 0.862;
      ammoBonusDamage = 50;
    } else if (ammoType === 'heavyAmmo') {
      ammoCostPerHit = prices.heavyAmmo || 3.627;
      ammoBonusDamage = 120;
    }

    // Pill buff (+80% base attack for 1 hunger)
    const pillMultiplier = useCombatPill ? 1.8 : 1.0;
    const pillCost = useCombatPill ? (prices.pill || 38.68) / 10 : 0; // Cost amortized across combat batch

    // Effective attack
    const precisionRate = Math.min(1.0, combatPrecision / 100);
    const overflowBonus = Math.max(0, (combatPrecision - 100) / 100);
    const effectiveBaseAttack = (combatBaseAttack + ammoBonusDamage) * pillMultiplier * (1 + overflowBonus);

    // Probability breakdown:
    // Misses deal 50% damage
    const missRate = 1 - precisionRate;
    const normalCritRate = (combatCritChance / 100);

    const normalHitDamage = effectiveBaseAttack;
    const critHitDamage = effectiveBaseAttack * (1 + (combatCritDamage / 100));
    const missHitDamage = effectiveBaseAttack * 0.5;

    // Average damage per attempted hit
    const avgDamagePerHit = (precisionRate * (1 - normalCritRate) * normalHitDamage) +
                            (precisionRate * normalCritRate * critHitDamage) +
                            (missRate * missHitDamage);

    const totalDamageDealt = avgDamagePerHit * hitsAttempted;

    // Health lost: 10 base, mitigated by armor (cap 90% = min 1 HP), dodges take 0 HP
    const dodgeRate = Math.min(0.40, combatDodge / 100);
    const effectiveArmor = Math.min(0.90, combatArmor / 100);
    const hpPerHit = Math.max(1, 10 * (1 - effectiveArmor));
    const actualHitsSuffered = hitsAttempted * (1 - dodgeRate);
    const totalHealthLost = actualHitsSuffered * hpPerHit;
    const dodgedHitsCount = hitsAttempted * dodgeRate;

    // Durability wear estimate (each non-dodged hit wears armor; all hits wear weapon)
    const durabilityWearCoins = hitsAttempted * 0.15; 

    // Ammo total cost
    const totalAmmoCost = hitsAttempted * ammoCostPerHit;

    // Loot drops: Case (+1% per loot chance), Elite Case (+0.01% per loot chance)
    const caseDropRate = (combatLootChance / 100);
    const eliteCaseDropRate = (combatLootChance * 0.0001);

    const expectedCases = hitsAttempted * caseDropRate;
    const expectedEliteCases = hitsAttempted * eliteCaseDropRate;

    const caseValue = prices.case1 || 3.69;
    const eliteCaseValue = prices.case2 || 23.67;
    const totalLootValue = (expectedCases * caseValue) + (expectedEliteCases * eliteCaseValue);

    const totalExpenditure = totalAmmoCost + pillCost + durabilityWearCoins;
    const netCampaignBalance = totalLootValue - totalExpenditure;

    return {
      totalDamageDealt,
      avgDamagePerHit,
      totalHealthLost,
      dodgedHitsCount,
      totalAmmoCost,
      totalExpenditure,
      expectedCases,
      expectedEliteCases,
      totalLootValue,
      netCampaignBalance
    };
  }, [
    combatHits,
    combatBaseAttack,
    combatPrecision,
    combatCritChance,
    combatCritDamage,
    combatArmor,
    combatDodge,
    combatLootChance,
    ammoType,
    useCombatPill,
    prices
  ]);

  // Math for Scenario 3: Wage & Resistance Hijack
  const wageTaxAnalysis = useMemo(() => {
    const grossWage = ppSessionAmount * wagePerPp;
    
    // Normal country income tax
    const totalTaxAmount = grossWage * (incomeTaxRate / 100);
    
    // Resistance hijacking: 0.5% per point of resistance siphoned to native occupied country
    const resistanceHijackPct = Math.min(100, regionResistancePoints * 0.5); // % of tax hijacked
    const hijackedAmount = totalTaxAmount * (resistanceHijackPct / 100);
    const stateKeptTax = totalTaxAmount - hijackedAmount;

    const workerNetWage = grossWage - totalTaxAmount;

    return {
      grossWage,
      totalTaxAmount,
      hijackedAmount,
      stateKeptTax,
      resistanceHijackPct,
      workerNetWage
    };
  }, [ppSessionAmount, wagePerPp, incomeTaxRate, regionResistancePoints]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Scenario Navigation */}
      <div className="bg-[#0f1523] border border-[#1b253b] rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#182033] pb-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-cyan-400" />
              DECISION & SCENARIO SIMULATION SANDBOX
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Simulate complex game decisions before committing BTC, steel, concrete, or stamina.
            </p>
          </div>

          {/* Scenario Mode Switcher */}
          <div className="flex space-x-1.5 font-mono text-xs overflow-x-auto">
            <button
              onClick={() => setActiveScenario('combat')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeScenario === 'combat'
                  ? 'bg-red-600 text-white font-bold'
                  : 'bg-[#141d2f] text-slate-400 hover:text-white'
              }`}
            >
              ⚔️ Combat & Loot ROI
            </button>
            <button
              onClick={() => setActiveScenario('expansion')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeScenario === 'expansion'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'bg-[#141d2f] text-slate-400 hover:text-white'
              }`}
            >
              🏭 Company vs Engine ROI
            </button>
            <button
              onClick={() => setActiveScenario('wages')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeScenario === 'wages'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-[#141d2f] text-slate-400 hover:text-white'
              }`}
            >
              Wage & Tax Siphoning
            </button>
          </div>
        </div>
      </div>

      {/* SCENARIO 1: COMBAT & LOOT ROI */}
      {activeScenario === 'combat' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Controls */}
            <div className="bg-[#0f1523] border border-[#1b253b] rounded-xl p-5 shadow-lg space-y-4 font-mono text-xs">
              <h3 className="text-sm font-bold text-red-400 border-b border-[#182033] pb-2 flex items-center gap-2">
                <Swords className="w-4 h-4 text-red-400" />
                COMBAT CAMPAIGN PARAMETERS
              </h3>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-400">Hits to Simulate:</label>
                  <span className="text-white font-bold">{combatHits} Hits</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={combatHits}
                  onChange={(e) => setCombatHits(parseInt(e.target.value))}
                  className="w-full accent-red-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Ammunition Type:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'none', label: 'No Ammo (Free)' },
                    { id: 'lightAmmo', label: 'Light Ammo (+20)' },
                    { id: 'ammo', label: 'Standard (+50)' },
                    { id: 'heavyAmmo', label: 'Heavy (+120)' },
                  ].map(a => (
                    <button
                      key={a.id}
                      onClick={() => setAmmoType(a.id)}
                      className={`p-1.5 rounded text-[11px] font-semibold border transition ${
                        ammoType === a.id
                          ? 'bg-red-950/80 border-red-500 text-red-200'
                          : 'bg-[#121826] border-[#1e283d] text-slate-400'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#121826] rounded-lg border border-[#1e283d]">
                <div>
                  <span className="text-white font-bold block">Combat Pill Buff (+80% Attack)</span>
                  <span className="text-[10px] text-slate-400">Costs 1 Hunger + Pill item</span>
                </div>
                <button
                  onClick={() => setUseCombatPill(!useCombatPill)}
                  className={`px-3 py-1 rounded text-[11px] font-bold ${
                    useCombatPill ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {useCombatPill ? 'ACTIVE' : 'OFF'}
                </button>
              </div>

              {/* Combat Stat Sliders */}
              <div className="space-y-3 pt-2 border-t border-[#182033]">
                <div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Base Attack:</span>
                    <span className="text-white font-bold">{combatBaseAttack}</span>
                  </div>
                  <input
                    type="range" min="100" max="600" step="10"
                    value={combatBaseAttack}
                    onChange={(e) => setCombatBaseAttack(parseInt(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Precision %:</span>
                    <span className="text-white font-bold">{combatPrecision}%</span>
                  </div>
                  <input
                    type="range" min="50" max="130"
                    value={combatPrecision}
                    onChange={(e) => setCombatPrecision(parseInt(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Armor Mitigation %:</span>
                    <span className="text-white font-bold">{combatArmor}%</span>
                  </div>
                  <input
                    type="range" min="0" max="90"
                    value={combatArmor}
                    onChange={(e) => setCombatArmor(parseInt(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Loot Chance %:</span>
                    <span className="text-white font-bold">{combatLootChance}%</span>
                  </div>
                  <input
                    type="range" min="5" max="30"
                    value={combatLootChance}
                    onChange={(e) => setCombatLootChance(parseInt(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Simulation Results */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Primary Output Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
                <div className="bg-[#0f1523] border border-red-500/40 p-4 rounded-xl shadow-lg">
                  <span className="text-[11px] text-red-400 uppercase font-semibold block">Total Damage Delivered</span>
                  <span className="text-2xl font-bold text-white block mt-1">
                    {combatSimulation.totalDamageDealt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Avg ~{combatSimulation.avgDamagePerHit.toFixed(0)} damage/hit
                  </span>
                </div>

                <div className="bg-[#0f1523] border border-cyan-500/40 p-4 rounded-xl shadow-lg">
                  <span className="text-[11px] text-cyan-400 uppercase font-semibold block">Health Consumed</span>
                  <span className="text-2xl font-bold text-white block mt-1">
                    -{combatSimulation.totalHealthLost.toFixed(0)} HP
                  </span>
                  <span className="text-[10px] text-emerald-400 mt-1 block">
                    {combatSimulation.dodgedHitsCount.toFixed(0)} hits dodged (0 HP loss)
                  </span>
                </div>

                <div className="bg-[#0f1523] border border-amber-500/40 p-4 rounded-xl shadow-lg">
                  <span className="text-[11px] text-amber-400 uppercase font-semibold block">Expected Case Drops</span>
                  <span className="text-2xl font-bold text-white block mt-1">
                    {combatSimulation.expectedCases.toFixed(1)} Cases
                  </span>
                  <span className="text-[10px] text-purple-300 mt-1 block">
                    +{combatSimulation.expectedEliteCases.toFixed(3)} Elite Cases
                  </span>
                </div>
              </div>

              {/* Economic Balance of the Battle Campaign */}
              <div className="bg-[#0f1523] border border-[#1b253b] rounded-xl p-5 shadow-lg font-mono">
                <h4 className="text-xs font-bold text-slate-300 uppercase border-b border-[#182033] pb-2 mb-3">
                  FINANCIAL BALANCE OF {combatHits} HITS
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2 bg-[#121826] p-3 rounded-lg border border-[#1a2335]">
                    <span className="text-[11px] text-slate-400 font-bold block mb-1">CAMPAIGN COSTS:</span>
                    <div className="flex justify-between text-slate-300">
                      <span>Ammo Consumed:</span>
                      <span className="text-red-400">-{combatSimulation.totalAmmoCost.toFixed(2)} BTC</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Estimated Wear & Tear:</span>
                      <span className="text-red-400">-{(combatHits * 0.15).toFixed(2)} BTC</span>
                    </div>
                    <div className="flex justify-between text-white font-bold pt-1 border-t border-[#1a2335]">
                      <span>Total Expenditure:</span>
                      <span className="text-red-400">-{combatSimulation.totalExpenditure.toFixed(2)} BTC</span>
                    </div>
                  </div>

                  <div className="space-y-2 bg-[#121826] p-3 rounded-lg border border-[#1a2335]">
                    <span className="text-[11px] text-slate-400 font-bold block mb-1">LOOT & DROP REVENUE:</span>
                    <div className="flex justify-between text-slate-300">
                      <span>Cases Market Value:</span>
                      <span className="text-emerald-400">+{combatSimulation.totalLootValue.toFixed(2)} BTC</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Case Spot Price:</span>
                      <span className="text-slate-400">{(prices.case1 || 3.69).toFixed(2)} BTC / unit</span>
                    </div>
                    <div className="flex justify-between text-white font-bold pt-1 border-t border-[#1a2335]">
                      <span>Net Combat Balance:</span>
                      <span className={combatSimulation.netCampaignBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {combatSimulation.netCampaignBalance >= 0 ? '+' : ''}{combatSimulation.netCampaignBalance.toFixed(2)} BTC
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-cyan-950/20 border border-cyan-800/40 text-xs text-cyan-300 flex items-start space-x-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Tactical Insight:</strong> With high Loot Chance ({combatLootChance}%) and Dodge ({combatDodge}%), you can turn fighting into a profitable business by selling dropped cases on the Trading Market to fund all ammo and repairs!
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* SCENARIO 2: EXPANSION VS ENGINE UPGRADE */}
      {activeScenario === 'expansion' && (
        <div className="bg-[#0f1523] border border-[#1b253b] rounded-xl p-5 shadow-lg space-y-6 font-mono">
          <div className="border-b border-[#182033] pb-3">
            <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              CAPITAL ALLOCATION: NEW COMPANY (100 CONCRETE) VS AUTOMATED ENGINE
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Should you spend capital creating another company (100 Concrete), or upgrade an existing Automated Engine with Steel?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Option A: New Company */}
            <div className="bg-[#121826] border border-[#1a2335] rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-[#1f2b45] pb-2">
                <span className="font-bold text-white text-sm">OPTION A: BUILD NEW COMPANY</span>
                <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/40 text-[10px]">
                  NEW ENTITY
                </span>
              </div>
              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between">
                  <span>Concrete Required:</span>
                  <span className="text-white font-bold">100x Concrete</span>
                </div>
                <div className="flex justify-between">
                  <span>Concrete Spot Price:</span>
                  <span className="text-slate-400">{concretePrice.toFixed(3)} BTC</span>
                </div>
                <div className="flex justify-between text-amber-400 font-bold border-t border-[#1f2b45] pt-1">
                  <span>Total Capital Required:</span>
                  <span>{expansionAnalysis.newCompanyCost.toFixed(1)} BTC</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed pt-2">
                Unlocks an additional company slot, allowing you to produce an entirely separate commodity line, hire more workers, or utilize your daily self-work Entrepreneurship.
              </p>
            </div>

            {/* Option B: Engine Upgrade */}
            <div className="bg-[#121826] border border-[#1a2335] rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-[#1f2b45] pb-2">
                <span className="font-bold text-white text-sm">OPTION B: UPGRADE ENGINE TO LV {selectedEngineTier}</span>
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/40 text-[10px]">
                  PASSIVE 24/7
                </span>
              </div>
              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between">
                  <span>Steel Required:</span>
                  <span className="text-white font-bold">{expansionAnalysis.engineSteel}x Steel</span>
                </div>
                <div className="flex justify-between">
                  <span>Steel Spot Price:</span>
                  <span className="text-slate-400">{steelPrice.toFixed(3)} BTC</span>
                </div>
                <div className="flex justify-between text-amber-400 font-bold border-t border-[#1f2b45] pt-1">
                  <span>Total Capital Required:</span>
                  <span>{expansionAnalysis.engineCost.toFixed(1)} BTC</span>
                </div>
                <div className="flex justify-between text-cyan-300">
                  <span>Passive PP Produced / Day:</span>
                  <span>+{expansionAnalysis.engineDailyPp} PP/day</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Estimated Payback Time:</span>
                  <span>{expansionAnalysis.enginePaybackDays} Days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCENARIO 3: WAGE & TAX SIPHONING */}
      {activeScenario === 'wages' && (
        <div className="bg-[#0f1523] border border-[#1b253b] rounded-xl p-5 shadow-lg space-y-6 font-mono text-xs">
          <div className="border-b border-[#182033] pb-3">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              WAGE, INCOME TAX & OCCUPIED RESISTANCE SIPHONING
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Simulates how national income tax and occupied regional resistance affect worker wages and state revenue.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 bg-[#121826] p-4 rounded-xl border border-[#1a2335]">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-400">Offered Wage per PP:</label>
                  <span className="text-white font-bold">{wagePerPp.toFixed(3)} BTC/PP</span>
                </div>
                <input
                  type="range" min="0.117" max="0.176" step="0.001"
                  value={wagePerPp}
                  onChange={(e) => setWagePerPp(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-400">PP per Session:</label>
                  <span className="text-white font-bold">{ppSessionAmount} PP</span>
                </div>
                <input
                  type="range" min="10" max="40" step="1"
                  value={ppSessionAmount}
                  onChange={(e) => setPpSessionAmount(parseInt(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-400">National Income Tax Rate:</label>
                  <span className="text-white font-bold">{incomeTaxRate}%</span>
                </div>
                <input
                  type="range" min="0" max="30" step="1"
                  value={incomeTaxRate}
                  onChange={(e) => setIncomeTaxRate(parseInt(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-400">Occupied Region Resistance Bar:</label>
                  <span className="text-white font-bold">{regionResistancePoints} Pts</span>
                </div>
                <input
                  type="range" min="0" max="60" step="1"
                  value={regionResistancePoints}
                  onChange={(e) => setRegionResistancePoints(parseInt(e.target.value))}
                  className="w-full accent-red-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">Each resistance pt hijacks 0.5% of income tax</p>
              </div>
            </div>

            {/* Results breakdown */}
            <div className="bg-[#121826] p-4 rounded-xl border border-[#1a2335] space-y-3">
              <span className="text-[11px] text-slate-400 font-bold block mb-1">WORK SESSION FINANCIAL BREAKDOWN:</span>
              <div className="flex justify-between text-slate-300">
                <span>Gross Wage Paid by Company Owner:</span>
                <span className="text-white font-bold">{wageTaxAnalysis.grossWage.toFixed(4)} BTC</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Total Income Tax Deducted:</span>
                <span className="text-red-400">-{wageTaxAnalysis.totalTaxAmount.toFixed(4)} BTC</span>
              </div>
              <div className="flex justify-between text-slate-300 pl-4 border-l border-[#1f2b45]">
                <span>State Treasury Receives:</span>
                <span className="text-emerald-400">+{wageTaxAnalysis.stateKeptTax.toFixed(4)} BTC</span>
              </div>
              <div className="flex justify-between text-slate-300 pl-4 border-l border-[#1f2b45]">
                <span>Resistance Hijacked ({wageTaxAnalysis.resistanceHijackPct}%):</span>
                <span className="text-red-400">+{wageTaxAnalysis.hijackedAmount.toFixed(4)} BTC</span>
              </div>
              <div className="flex justify-between text-white font-bold pt-2 border-t border-[#1f2b45] text-sm">
                <span>Worker Take-Home Pay:</span>
                <span className="text-cyan-400">+{wageTaxAnalysis.workerNetWage.toFixed(4)} BTC</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
