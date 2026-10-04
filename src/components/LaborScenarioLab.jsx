import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Coins, 
  Factory, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Sliders, 
  Sparkles, 
  HelpCircle,
  Building, 
  Check, 
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { RECIPES } from '../data/gameData';
import { calculateLaborEconomics } from '../data/marketMath';

export default function LaborScenarioLab({ prices = {}, initialItemCode = 'ammo' }) {
  // Scenario Inputs
  const [selectedItemCode, setSelectedItemCode] = useState(initialItemCode);
  const [workerSkillLevel, setWorkerSkillLevel] = useState(3);
  const [workFrequency, setWorkFrequency] = useState(2);
  const [workerSlots, setWorkerSlots] = useState(2);
  const [wagePerPp, setWagePerPp] = useState(0.146);
  const [isSelfWorking, setIsSelfWorking] = useState(false);
  const [hasDeposit, setHasDeposit] = useState(true);
  const [countryBonus, setCountryBonus] = useState(5.5);
  const [taxRate, setTaxRate] = useState(3.0);

  const [selectedBuildId, setSelectedBuildId] = useState('artisan');

  const recipe = useMemo(() => {
    return RECIPES.find(r => r.id === selectedItemCode) || RECIPES[0];
  }, [selectedItemCode]);

  const spotPrice = prices[selectedItemCode] || 1.0;

  const unitRawCost = useMemo(() => {
    if (!recipe.inputs || recipe.inputs.length === 0) return 0;
    let cost = 0;
    recipe.inputs.forEach(inp => {
      cost += (prices[inp.id] || 0) * inp.qty;
    });
    return cost;
  }, [recipe, prices]);

  const scenario = useMemo(() => {
    return calculateLaborEconomics({
      recipePp: recipe.pp,
      workerSkillLevel,
      wagePerPp,
      workFrequencyPerDay: workFrequency,
      workerSlots,
      salePrice: spotPrice,
      inputCost: unitRawCost,
      taxRate,
      depositBonus: hasDeposit,
      countryBonus,
      isSelfWorking
    });
  }, [recipe, workerSkillLevel, wagePerPp, workFrequency, workerSlots, spotPrice, unitRawCost, taxRate, hasDeposit, countryBonus, isSelfWorking]);

  const breakEvenWagePerPp = useMemo(() => {
    if (scenario.totalDailyPp <= 0) return 0;
    const netRevenue = scenario.netRevenue;
    const rawCost = scenario.totalRawExpense;
    const maxLaborBudget = Math.max(0, netRevenue - rawCost);
    return maxLaborBudget / scenario.totalDailyPp;
  }, [scenario]);

  const economicBuilds = [
    {
      id: 'artisan',
      title: 'Solo Artisan / Self-Crafter',
      subtitle: 'Zero Wage Overhead • Max Margin',
      tagline: 'Leverages personal Entrepreneurship stamina to craft high-margin goods with zero employee wage overhead.',
      recommendedItems: ['heavyAmmo', 'pill', 'cookedFish'],
      primarySkills: [
        { name: 'Entrepreneurship', level: 10, note: 'Max self-working stamina (100 energy pool)' },
        { name: 'Production', level: 10, note: '37 PP per work click (3.7x base output)' },
        { name: 'Energy Bar', level: 8, note: 'Enables multiple daily shifts' }
      ],
      pros: ['100% of profit retained', 'No employee management needed', 'Thrives in any region'],
      cons: ['Output capped by personal energy regen', 'Cannot scale to 24 slots']
    },
    {
      id: 'conglomerate',
      title: 'Industrial Conglomerate',
      subtitle: 'Mass Labor Scale • High Volume',
      tagline: 'Operates 10 companies with 24 hired worker slots, negotiating volume production wages to dominate market supply.',
      recommendedItems: ['ammo', 'bread', 'concrete', 'steel'],
      primarySkills: [
        { name: 'Companies', level: 10, note: 'Own up to 10 companies simultaneously' },
        { name: 'Management', level: 10, note: 'Unlocks 24 total worker slots' },
        { name: 'Energy Bar', level: 6, note: 'Active company maintenance' }
      ],
      pros: ['Massive daily unit volume', 'Dominates global spot liquidity', 'Tremendous aggregate cashflow'],
      cons: ['High wage expense sensitivity', 'Requires monitoring worker attendance']
    },
    {
      id: 'engine',
      title: 'Automated Engine Baron',
      subtitle: 'Passive 24/7 Automation • Zero Labor',
      tagline: 'Invests heavily in Automated Engine upgrades (Levels 5-7) to generate non-stop revenue day and night.',
      recommendedItems: ['steel', 'concrete', 'ammo'],
      primarySkills: [
        { name: 'Companies', level: 8, note: 'Own 8 automated facilities' },
        { name: 'Production', level: 4, note: 'Baseline facility optimization' },
        { name: 'Energy Bar', level: 4, note: 'Passive check-ins' }
      ],
      pros: ['Generates passive coin while offline', 'Zero wage expense', 'Never misses a work shift'],
      cons: ['Requires significant steel capital investment for upgrades']
    },
    {
      id: 'rawDeposit',
      title: 'Raw Deposit Sovereign',
      subtitle: 'Natural Resource Dominance',
      tagline: 'Extracts primary raw inputs in high-deposit regions (Lead, Petroleum, Limestone) to feed hungry factories.',
      recommendedItems: ['lead', 'petroleum', 'limestone', 'iron'],
      primarySkills: [
        { name: 'Companies', level: 7, note: 'Resource extraction hubs' },
        { name: 'Production', level: 9, note: 'Maximum raw extraction per click' },
        { name: 'Entrepreneurship', level: 7, note: 'Self-harvesting' }
      ],
      pros: ['Zero ingredient costs', 'Guaranteed war demand from munitions crafters', 'Deflation proof'],
      cons: ['Lower unit prices than processed goods']
    }
  ];

  const activeBuild = economicBuilds.find(b => b.id === selectedBuildId) || economicBuilds[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-2">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
          Labor & Scenario Lab
        </h1>
        <p className="text-sm text-slate-500 mt-1 font-normal">
          Simulate hired worker skill sets, production point yields, wage structures, and tailored economic builds.
        </p>
      </div>

      {/* Main Two-Column Scenario Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 7 Cols: Interactive Scenario Controls */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 space-y-6 shadow-sm">
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-sans">Labor & Facility Parameters</h2>
              <p className="text-xs text-slate-500 mt-0.5">Customize worker capability, wage rates, and work frequency</p>
            </div>

            {/* Target Commodity selector */}
            <select
              value={selectedItemCode}
              onChange={(e) => setSelectedItemCode(e.target.value)}
              className="bg-slate-100 text-slate-900 font-mono text-xs rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer font-medium"
            >
              {RECIPES.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} (${(prices[r.id] || 0).toFixed(3)})
                </option>
              ))}
            </select>
          </div>

          {/* Work Mode Toggle: Hired Worker vs Self-Working */}
          <div className="flex bg-slate-100 rounded-xl p-1 text-xs font-mono">
            <button
              onClick={() => setIsSelfWorking(false)}
              className={`flex-1 py-2 rounded-lg transition font-medium ${
                !isSelfWorking
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hired Labor (Wage Paid)
            </button>
            <button
              onClick={() => setIsSelfWorking(true)}
              className={`flex-1 py-2 rounded-lg transition font-medium ${
                isSelfWorking
                  ? 'bg-amber-500 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Self-Working (Stamina)
            </button>
          </div>

          {/* Sliders Grid */}
          <div className="space-y-5 text-xs font-mono">
            
            {/* Worker Skill Set */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-700 font-sans font-medium">Worker Production Skill:</span>
                <span className="text-amber-700 font-bold font-mono">
                  Level {workerSkillLevel} ({scenario.ppPerSession} PP/session)
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={workerSkillLevel}
                onChange={(e) => setWorkerSkillLevel(Number(e.target.value))}
                className="w-full accent-amber-600 bg-slate-200 h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Lv 1 (10 PP novice)</span>
                <span>Lv 5 (22 PP trained)</span>
                <span>Lv 10 (37 PP master)</span>
              </div>
            </div>

            {/* Work Frequency */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-700 font-sans font-medium">Work Frequency per Day:</span>
                <span className="text-slate-900 font-bold font-mono">
                  {workFrequency}x sessions/day ({workFrequency * 10} energy)
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={workFrequency}
                onChange={(e) => setWorkFrequency(Number(e.target.value))}
                className="w-full accent-slate-800 bg-slate-200 h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>1x (Casual)</span>
                <span>2x (Standard active)</span>
                <span>3x (High stamina)</span>
                <span>4x (Hardcore)</span>
              </div>
            </div>

            {/* Workforce Slots */}
            {!isSelfWorking && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-sans font-medium">Workers Employed:</span>
                  <span className="text-slate-900 font-bold font-mono">
                    {workerSlots} {workerSlots === 1 ? 'Worker' : 'Workers'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="1"
                  value={workerSlots}
                  onChange={(e) => setWorkerSlots(Number(e.target.value))}
                  className="w-full accent-slate-800 bg-slate-200 h-1.5 rounded-lg cursor-pointer"
                />
              </div>
            )}

            {/* Wage Per PP */}
            {!isSelfWorking && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-sans font-medium">Wage Rate Paid:</span>
                  <span className="text-slate-900 font-bold font-mono">
                    ${wagePerPp.toFixed(3)} / PP (${(wagePerPp * scenario.ppPerSession).toFixed(3)}/session)
                  </span>
                </div>
                <input
                  type="range"
                  min="0.117"
                  max="0.176"
                  step="0.001"
                  value={wagePerPp}
                  onChange={(e) => setWagePerPp(Number(e.target.value))}
                  className="w-full accent-amber-600 bg-slate-200 h-1.5 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>$0.117 (Min)</span>
                  <span className="text-amber-600 font-bold">$0.146 (Avg)</span>
                  <span>$0.176 (Max)</span>
                </div>
              </div>
            )}

            {/* Environmental Bonuses */}
            <div className="pt-2 grid grid-cols-2 gap-3">
              <button
                onClick={() => setHasDeposit(!hasDeposit)}
                className={`p-3 rounded-xl text-left transition ${
                  hasDeposit
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                    : 'bg-slate-50 text-slate-500'
                }`}
              >
                <div className="text-[10px] uppercase font-mono font-bold">Regional Deposit</div>
                <div className="text-xs font-bold mt-0.5">{hasDeposit ? '+30% Deposit Active' : 'No Deposit (Base)'}</div>
              </button>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="flex justify-between text-[10px] uppercase font-mono text-slate-500">
                  <span>Country Bonus</span>
                  <span className="text-slate-900 font-bold">+{countryBonus}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={countryBonus}
                  onChange={(e) => setCountryBonus(Number(e.target.value))}
                  className="w-full accent-slate-800 bg-slate-200 h-1 rounded-lg cursor-pointer"
                />
              </div>
            </div>

          </div>

        </div>

        {/* Right 5 Cols: Live Financial Statement */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 space-y-5 font-mono text-xs shadow-sm">
          
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 font-sans">Scenario Financial Statement</h3>
            <span className="text-[11px] text-slate-400">24H Projection</span>
          </div>

          {/* Big Profit Hero */}
          <div className="p-4 bg-slate-50 rounded-xl space-y-1 text-center">
            <span className="text-xs text-slate-500 uppercase font-sans font-medium">Projected Net Daily Profit</span>
            <div className={`text-4xl font-extrabold ${scenario.netDailyProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {scenario.netDailyProfit >= 0 ? '+' : ''}${scenario.netDailyProfit.toFixed(2)}
            </div>
            <div className="text-xs text-slate-600 pt-1">
              Net Margin: <strong className={scenario.marginPercent >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                {scenario.marginPercent >= 0 ? '+' : ''}{scenario.marginPercent.toFixed(1)}%
              </strong>
            </div>
          </div>

          {/* Line item breakdown */}
          <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Daily Output:</span>
              <span className="text-slate-900 font-semibold">{scenario.unitsProducedPerDay.toFixed(1)} {recipe.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total Effective PP:</span>
              <span className="text-slate-900">{scenario.effectiveDailyPp.toFixed(0)} PP/day</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Gross Sales Revenue:</span>
              <span className="text-slate-900 font-semibold">${scenario.grossRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Market Tax ({taxRate}%):</span>
              <span className="text-rose-700">-${(scenario.grossRevenue * taxRate / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Raw Inputs:</span>
              <span className="text-rose-700">-${scenario.totalRawExpense.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Labor Wages:</span>
              <span className="text-rose-700">
                {isSelfWorking ? '$0.00 (Self-work)' : `-$${scenario.totalLaborExpense.toFixed(2)}`}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold text-sm">
              <span className="text-slate-900 font-sans">Net Cashflow:</span>
              <span className={scenario.netDailyProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                ${scenario.netDailyProfit.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Strategic Insights */}
          <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5 text-[11px] text-slate-600">
            <div className="flex justify-between">
              <span>Break-Even Wage Limit:</span>
              <span className="text-slate-900 font-bold">${breakEvenWagePerPp.toFixed(3)}/PP</span>
            </div>
            <div className="flex justify-between">
              <span>Return per Worker:</span>
              <span className="text-emerald-700 font-bold">+${scenario.profitPerWorker.toFixed(2)}/worker</span>
            </div>
            <p className="text-[10px] text-slate-400 pt-1 leading-relaxed">
              If wage exceeds ${breakEvenWagePerPp.toFixed(3)}/PP, operating this line becomes unprofitable at current spot market prices.
            </p>
          </div>

        </div>

      </div>

      {/* Economic Builds Section */}
      <div className="bg-white rounded-2xl p-6 space-y-6 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 font-sans">
            Specialized Economic Builds
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pre-tested skill distributions and operational strategies for maximum market yield.
          </p>
        </div>

        {/* Build Selector Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {economicBuilds.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBuildId(b.id)}
              className={`p-4 rounded-xl text-left transition ${
                selectedBuildId === b.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
              }`}
            >
              <div className={`text-[10px] uppercase font-mono font-bold ${
                selectedBuildId === b.id ? 'text-amber-400' : 'text-amber-700'
              }`}>
                {b.subtitle}
              </div>
              <div className="text-xs font-bold mt-1 font-sans">{b.title}</div>
            </button>
          ))}
        </div>

        {/* Selected Build Blueprint */}
        <div className="p-5 bg-slate-50 rounded-xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-sans">{activeBuild.title}</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{activeBuild.tagline}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activeBuild.primarySkills.map((sk) => (
              <div key={sk.name} className="p-3 bg-white rounded-lg space-y-1 text-xs font-mono shadow-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-900">{sk.name}</span>
                  <span className="text-amber-700 font-bold">Lvl {sk.level}</span>
                </div>
                <div className="text-[10px] text-slate-500">{sk.note}</div>
              </div>
            ))}
          </div>

          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <span className="text-[10px] text-emerald-800 uppercase font-bold block mb-1">Key Strengths</span>
              <ul className="space-y-1 text-slate-700 text-[11px]">
                {activeBuild.pros.map((p, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="text-emerald-700 font-bold">✓</span> {p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Target Commodities</span>
              <div className="flex flex-wrap gap-1.5">
                {activeBuild.recommendedItems.map(item => (
                  <span key={item} className="px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200 text-[10px] font-medium">
                    {item.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
