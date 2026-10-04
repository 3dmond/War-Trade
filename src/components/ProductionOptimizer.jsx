import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Coins, 
  Layers, 
  Zap, 
  Settings2, 
  AlertCircle, 
  CheckCircle2, 
  Factory, 
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { RECIPES, ENGINE_UPGRADE_TIERS, STORAGE_UPGRADE_TIERS } from '../data/gameData';

export default function ProductionOptimizer({ prices, onRefreshPrices, isRefreshing, userLevel = 1 }) {
  // Simulator Controls
  const [levelFilter, setLevelFilter] = useState(userLevel || 5);
  const [hasDeposit, setHasDeposit] = useState(true); // +30% region deposit bonus
  const [countryBonus, setCountryBonus] = useState(5.5); // % from strategic resources
  const [workMode, setWorkMode] = useState('self'); // 'self' (Entrepreneurship) or 'hired' (Energy)
  const [workerWagePerPp, setWorkerWagePerPp] = useState(0.146); // Coins per PP paid to worker
  const [marketTaxRate, setMarketTaxRate] = useState(3.0); // % sales/market tax
  const [userProductionSkill, setUserProductionSkill] = useState(16); // PP per click (base 10 + skill)

  // Engine ROI Calculator state
  const [engineCurrentLevel, setEngineCurrentLevel] = useState(1);
  const [engineTargetLevel, setEngineTargetLevel] = useState(4);

  // Compute total production multiplier
  // Regional deposit = +30%, country strategic resources = countryBonus%
  const productionMultiplier = useMemo(() => {
    let mult = 1.0;
    if (hasDeposit) mult += 0.30;
    mult += (countryBonus / 100);
    return mult;
  }, [hasDeposit, countryBonus]);

  // Analyze all recipes
  const analyzedRecipes = useMemo(() => {
    return RECIPES.map((recipe) => {
      const salePrice = prices[recipe.id] || 0;
      const netSalePrice = salePrice * (1 - marketTaxRate / 100);

      // Calculate cost of raw inputs
      let ingredientCost = 0;
      if (recipe.inputs && recipe.inputs.length > 0) {
        recipe.inputs.forEach((inp) => {
          const inputPrice = prices[inp.id] || 0;
          ingredientCost += inputPrice * inp.qty;
        });
      }

      // Production Point economics
      const basePpNeeded = recipe.pp;
      // With bonus multiplier, effective PP required is reduced, or yield per PP is increased
      const effectivePpCost = basePpNeeded / productionMultiplier;

      // Labor / Wage cost
      let laborCost = 0;
      if (workMode === 'hired') {
        laborCost = basePpNeeded * workerWagePerPp;
      }

      const totalCost = ingredientCost + laborCost;
      const netProfitPerUnit = netSalePrice - totalCost;
      const netProfitPerPp = basePpNeeded > 0 ? (netProfitPerUnit / basePpNeeded) : 0;
      
      // Profit per standard work session (10 energy / entrepreneurship = produces userProductionSkill PP)
      const unitsPerSession = userProductionSkill / basePpNeeded;
      const profitPerSession = unitsPerSession * netProfitPerUnit;

      const marginPercent = salePrice > 0 ? ((netProfitPerUnit / salePrice) * 100) : 0;

      // Automated Engine 24h passive revenue for this item
      // At Engine Lvl 1 (1 PP/h) = 24 PP/day
      const unitsPerDayAt1Pph = (24 * productionMultiplier) / basePpNeeded;
      const passiveProfitPerDay1Pph = unitsPerDayAt1Pph * netProfitPerUnit;

      const isLevelUnlocked = recipe.minLevel <= levelFilter;

      return {
        ...recipe,
        salePrice,
        ingredientCost,
        totalCost,
        netProfitPerUnit,
        netProfitPerPp,
        profitPerSession,
        marginPercent,
        passiveProfitPerDay1Pph,
        isLevelUnlocked
      };
    }).sort((a, b) => b.netProfitPerPp - a.netProfitPerPp);
  }, [prices, productionMultiplier, workMode, workerWagePerPp, marketTaxRate, userProductionSkill, levelFilter]);

  // Top profitable unlocked items
  const unlockedRecipes = analyzedRecipes.filter(r => r.isLevelUnlocked);
  const bestProfitPerPp = unlockedRecipes[0] || analyzedRecipes[0];
  const bestPerSession = [...unlockedRecipes].sort((a, b) => b.profitPerSession - a.profitPerSession)[0] || analyzedRecipes[0];
  const highestMargin = [...unlockedRecipes].sort((a, b) => b.marginPercent - a.marginPercent)[0] || analyzedRecipes[0];

  // Engine Upgrade ROI Math
  const engineRoi = useMemo(() => {
    const currentTier = ENGINE_UPGRADE_TIERS.find(t => t.level === engineCurrentLevel) || ENGINE_UPGRADE_TIERS[0];
    const targetTier = ENGINE_UPGRADE_TIERS.find(t => t.level === engineTargetLevel) || ENGINE_UPGRADE_TIERS[1];
    
    // Sum steel cost between current and target
    let totalSteelNeeded = 0;
    for (let l = engineCurrentLevel + 1; l <= engineTargetLevel; l++) {
      const tier = ENGINE_UPGRADE_TIERS.find(t => t.level === l);
      if (tier) totalSteelNeeded += tier.steel;
    }

    const steelPrice = prices.steel || 1.725;
    const upgradeCostInCoins = totalSteelNeeded * steelPrice;

    const extraPpHour = Math.max(0, targetTier.ppPerHour - currentTier.ppPerHour);
    const extraPpPerDay = extraPpHour * 24 * productionMultiplier;

    // Value of 1 PP based on best current unlocked craftable
    const ppValue = Math.max(0.01, bestProfitPerPp?.netProfitPerPp || 0.05);
    const dailyExtraIncome = extraPpPerDay * ppValue;
    const paybackDays = dailyExtraIncome > 0 ? (upgradeCostInCoins / dailyExtraIncome).toFixed(1) : '∞';

    return {
      totalSteelNeeded,
      upgradeCostInCoins,
      extraPpPerDay,
      dailyExtraIncome,
      paybackDays
    };
  }, [engineCurrentLevel, engineTargetLevel, prices.steel, productionMultiplier, bestProfitPerPp]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Tactical Overview */}
      <div className="bg-[#0f1523] border border-[#1b253b] rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#182033] pb-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              PRODUCTION PROFITABILITY & ROI MATRIX
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Real-time net margin analyzer. Tells you exactly what to craft for maximum coin return per stamina click.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRefreshPrices}
              disabled={isRefreshing}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-[#141d2f] hover:bg-[#1b2740] border border-cyan-800/40 text-cyan-300 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'PULLING PRICES...' : 'SYNC PRICES'}</span>
            </button>
          </div>
        </div>

        {/* Tactical Recommendation Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Best Profit Per PP */}
          <div className="p-3.5 rounded-lg bg-gradient-to-br from-[#121c2e] to-[#0c1320] border border-cyan-500/30">
            <div className="flex items-center justify-between text-xs text-cyan-400 font-mono font-semibold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                MAX PROFIT / PP
              </span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] font-bold">TOP PICK</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-base font-bold text-white">{bestProfitPerPp?.name}</span>
              <span className="text-sm font-mono font-bold text-emerald-400">
                +{bestProfitPerPp?.netProfitPerPp.toFixed(4)} <span className="text-[10px] text-slate-400">Coins/PP</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Yields <strong className="text-white">+{bestProfitPerPp?.profitPerSession.toFixed(2)} Coins</strong> per 10 Stamina work session.
            </p>
          </div>

          {/* Highest Session Value */}
          <div className="p-3.5 rounded-lg bg-gradient-to-br from-[#121c2e] to-[#0c1320] border border-amber-500/30">
            <div className="flex items-center justify-between text-xs text-amber-400 font-mono font-semibold">
              <span className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                MAX COINS / SESSION
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 text-[10px] font-bold">HEAVY GAIN</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-base font-bold text-white">{bestPerSession?.name}</span>
              <span className="text-sm font-mono font-bold text-emerald-400">
                +{bestPerSession?.profitPerSession.toFixed(2)} <span className="text-[10px] text-slate-400">Coins</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Sale spot price: <strong className="text-white">{bestPerSession?.salePrice.toFixed(3)}</strong> Coins/unit.
            </p>
          </div>

          {/* Highest Margin */}
          <div className="p-3.5 rounded-lg bg-gradient-to-br from-[#121c2e] to-[#0c1320] border border-purple-500/30">
            <div className="flex items-center justify-between text-xs text-purple-400 font-mono font-semibold">
              <span className="flex items-center gap-1.5">
                <ArrowUpRight className="w-3.5 h-3.5 text-purple-400" />
                HIGHEST PROFIT MARGIN
              </span>
              <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 text-[10px] font-bold">EFFICIENCY</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-base font-bold text-white">{highestMargin?.name}</span>
              <span className="text-sm font-mono font-bold text-purple-300">
                {highestMargin?.marginPercent.toFixed(1)}% <span className="text-[10px] text-slate-400">Margin</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Low input cost, high capital protection against market price drops.
            </p>
          </div>
        </div>
      </div>

      {/* Simulator Controls & Assumptions */}
      <div className="bg-[#0f1523] border border-[#1b253b] rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#182033] pb-3 mb-4">
          <h3 className="text-sm font-bold text-slate-200 font-mono flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-cyan-400" />
            SIMULATOR ENVIRONMENT CONTROLS
          </h3>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-800/40 px-2 py-0.5 rounded">
            TOTAL BONUS: +{((productionMultiplier - 1) * 100).toFixed(1)}% PP Output
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          
          {/* Level Filter */}
          <div className="bg-[#121826] p-3 rounded-lg border border-[#1a2335]">
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-400">Your Character Level:</label>
              <span className="text-white font-bold text-sm">{levelFilter}</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={levelFilter}
              onChange={(e) => setLevelFilter(parseInt(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">Filters out recipes above level</p>
          </div>

          {/* Regional Deposit Bonus (+30%) */}
          <div className="bg-[#121826] p-3 rounded-lg border border-[#1a2335] flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <label className="text-slate-400">Region Deposit (+30%):</label>
              <button
                onClick={() => setHasDeposit(!hasDeposit)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                  hasDeposit ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {hasDeposit ? 'ACTIVE (+30%)' : 'NONE (+0%)'}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Active if company is built in resource-deposit region</p>
          </div>

          {/* Country Strategic Bonus */}
          <div className="bg-[#121826] p-3 rounded-lg border border-[#1a2335]">
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-400">Country Strategic Bonus:</label>
              <span className="text-white font-bold">+{countryBonus}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={countryBonus}
              onChange={(e) => setCountryBonus(parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">From Uranium, Lithium, Diamonds, Gold, Coal</p>
          </div>

          {/* Work Mode */}
          <div className="bg-[#121826] p-3 rounded-lg border border-[#1a2335] flex flex-col justify-between">
            <label className="text-slate-400 mb-1">Production Work Mode:</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setWorkMode('self')}
                className={`py-1 text-[11px] rounded font-bold transition ${
                  workMode === 'self' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Self-Work
              </button>
              <button
                onClick={() => setWorkMode('hired')}
                className={`py-1 text-[11px] rounded font-bold transition ${
                  workMode === 'hired' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Hired Workers
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {workMode === 'self' ? 'Free (uses Entrepreneurship)' : `Wage: ${workerWagePerPp} Coins/PP`}
            </p>
          </div>

        </div>
      </div>

      {/* Production Profit Table */}
      <div className="bg-[#0f1523] border border-[#1b253b] rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-[#182033] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 font-mono">
            <Factory className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">ALL CRAFTABLE ITEMS (SORTED BY NET PROFIT / PP)</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Showing {unlockedRecipes.length} of {RECIPES.length} recipes available for Level {levelFilter}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#111726] text-slate-400 border-b border-[#1b253b] uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Item & Category</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3 text-right">Market Price</th>
                <th className="py-3 px-3 text-right">Input Costs</th>
                <th className="py-3 px-3 text-right">Net Profit / Unit</th>
                <th className="py-3 px-3 text-right text-cyan-300">Profit / PP</th>
                <th className="py-3 px-3 text-right text-emerald-400">Profit / 10 Stamina</th>
                <th className="py-3 px-3 text-right">Margin</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#151c2d]">
              {analyzedRecipes.map((item, idx) => {
                const isTop = idx === 0 && item.isLevelUnlocked;
                const isProfitable = item.netProfitPerUnit > 0;
                
                return (
                  <tr 
                    key={item.id}
                    className={`hover:bg-[#131b2b] transition ${
                      !item.isLevelUnlocked ? 'opacity-40 bg-[#0a0d14]' : isTop ? 'bg-cyan-950/20' : ''
                    }`}
                  >
                    {/* Name & Recipe */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {isTop && <span className="text-amber-400 text-xs">★</span>}
                        <div>
                          <span className="font-bold text-white text-xs">{item.name}</span>
                          <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                            <span>{item.category}</span>
                            <span>•</span>
                            <span>{item.pp} PP base</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Type badge */}
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.type === 'raw' ? 'bg-blue-950/80 text-blue-300 border border-blue-800/40' : 'bg-purple-950/80 text-purple-300 border border-purple-800/40'
                      }`}>
                        {item.type.toUpperCase()}
                      </span>
                    </td>

                    {/* Market Sale Price */}
                    <td className="py-3 px-3 text-right font-medium text-slate-200">
                      {item.salePrice.toFixed(3)}
                    </td>

                    {/* Inputs */}
                    <td className="py-3 px-3 text-right text-slate-400">
                      {item.ingredientCost > 0 ? (
                        <span>{item.ingredientCost.toFixed(3)}</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Net Profit per Unit */}
                    <td className={`py-3 px-3 text-right font-bold ${isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
                      {item.netProfitPerUnit > 0 ? '+' : ''}{item.netProfitPerUnit.toFixed(3)}
                    </td>

                    {/* Net Profit per PP */}
                    <td className="py-3 px-3 text-right font-bold text-cyan-300 text-sm">
                      {item.netProfitPerPp > 0 ? '+' : ''}{item.netProfitPerPp.toFixed(4)}
                    </td>

                    {/* Profit per 10 Stamina */}
                    <td className="py-3 px-3 text-right font-bold text-emerald-400">
                      +{item.profitPerSession.toFixed(2)}
                    </td>

                    {/* Margin % */}
                    <td className="py-3 px-3 text-right">
                      <span className={`text-xs font-semibold ${item.marginPercent > 30 ? 'text-emerald-400' : item.marginPercent > 10 ? 'text-amber-400' : 'text-red-400'}`}>
                        {item.marginPercent.toFixed(1)}%
                      </span>
                    </td>

                    {/* Unlocked / Locked */}
                    <td className="py-3 px-4 text-center">
                      {item.isLevelUnlocked ? (
                        <span className="inline-flex items-center text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                          UNLOCKED
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] text-amber-400 font-semibold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                          REQ LV {item.minLevel}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Automated Engine & Storage Upgrade ROI Calculator */}
      <div className="bg-[#0f1523] border border-[#1b253b] rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#182033] pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white font-mono">AUTOMATED ENGINE UPGRADE ROI CALCULATOR</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Steel Spot Price: <strong className="text-white">{(prices.steel || 1.725).toFixed(3)} Coins</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4 font-mono text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Current Engine Level:</label>
              <select
                value={engineCurrentLevel}
                onChange={(e) => setEngineCurrentLevel(parseInt(e.target.value))}
                className="w-full bg-[#121826] border border-[#1e283d] rounded p-2 text-white"
              >
                {[1, 2, 3, 4, 5, 6].map(lvl => (
                  <option key={lvl} value={lvl}>Level {lvl} ({lvl} PP/h)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Target Engine Level:</label>
              <select
                value={engineTargetLevel}
                onChange={(e) => setEngineTargetLevel(parseInt(e.target.value))}
                className="w-full bg-[#121826] border border-[#1e283d] rounded p-2 text-white"
              >
                {[2, 3, 4, 5, 6, 7].filter(l => l > engineCurrentLevel).map(lvl => (
                  <option key={lvl} value={lvl}>Level {lvl} ({lvl} PP/h)</option>
                ))}
              </select>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Automated Engines run 24/7 without consuming Energy or Entrepreneurship. All upgrades can be downgraded later with an 80% refund.
            </p>
          </div>

          {/* Upgrade Metrics */}
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[#121826] border border-[#1a2335] rounded-lg">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Steel Required</span>
              <span className="text-lg font-bold text-white font-mono">{engineRoi.totalSteelNeeded}x</span>
              <span className="text-[10px] text-slate-500 block mt-1">Steel ingots</span>
            </div>

            <div className="p-3 bg-[#121826] border border-[#1a2335] rounded-lg">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Total Cost</span>
              <span className="text-lg font-bold text-amber-400 font-mono">
                {engineRoi.upgradeCostInCoins.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Coins</span>
            </div>

            <div className="p-3 bg-[#121826] border border-[#1a2335] rounded-lg">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Extra Yield</span>
              <span className="text-lg font-bold text-cyan-400 font-mono">
                +{engineRoi.extraPpPerDay.toFixed(0)} PP
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Per day (24h)</span>
            </div>

            <div className="p-3 bg-gradient-to-br from-cyan-950/40 to-[#121826] border border-cyan-800/40 rounded-lg">
              <span className="text-[10px] text-cyan-300 uppercase font-mono block font-bold">Payback Period</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">
                {engineRoi.paybackDays} Days
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">To 100% break even</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
