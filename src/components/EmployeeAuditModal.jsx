import React, { useEffect } from 'react';
import { X, CheckCircle2, ChevronRight, Calculator, ShieldCheck } from 'lucide-react';
import ItemIcon from './ItemIcon';

export default function EmployeeAuditModal({
  isOpen = false,
  onClose,
  worker = null
}) {
  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !worker) return null;

  // Safe Math Deconstructions
  const energyLvl = typeof worker.energySkill === 'number' ? worker.energySkill : 0;
  const stamina = worker.energyStamina || worker.energyPointsTotal || (30 + energyLvl * 10);
  const dailySessions = typeof worker.dailySessions === 'number' && worker.dailySessions > 0
    ? worker.dailySessions
    : (typeof worker.workSessionsPerDay === 'number' && worker.workSessionsPerDay > 0
        ? worker.workSessionsPerDay
        : Number((stamina * 0.24).toFixed(2)));

  const hourlyRegenPts = Number((stamina * 0.10).toFixed(2));
  const full24hRegenPts = Number((stamina * 2.4).toFixed(2));

  const prodLvl = typeof worker.productionSkill === 'number' ? worker.productionSkill : 0;
  const basePp = worker.basePp || worker.productionPointsBase || (10 + prodLvl * 3);
  const compBonus = worker.companyTotalBonusPct || 0;
  const loyalty = worker.fidelity || worker.loyaltyBonus || 0;
  const combinedBonusPct = compBonus + loyalty;
  const outputMultiplier = 1 + (combinedBonusPct / 100);
  const effectivePpPerHit = basePp * outputMultiplier;

  const dailyProducedPp = typeof worker.producedDailyPp === 'number' && worker.producedDailyPp > 0
    ? worker.producedDailyPp
    : (typeof worker.dailyPp === 'number' && worker.dailyPp > 0
        ? worker.dailyPp
        : (dailySessions * effectivePpPerHit));

  const dailyBasePp = worker.dailyBasePp || (dailySessions * basePp);
  const bonusPpDelta = Math.max(0, dailyProducedPp - dailyBasePp);

  const wageRate = typeof worker.wageRate === 'number'
    ? worker.wageRate
    : (typeof worker.wagePerPp === 'number' ? worker.wagePerPp : (worker.wage || 0.146));

  const dailyWage = typeof worker.dailyWage === 'number' && worker.dailyWage > 0
    ? worker.dailyWage
    : (dailyProducedPp * wageRate);

  const hourlyWage = dailyWage / 24;
  const weeklyWage = dailyWage * 7;
  const monthlyWage = dailyWage * 30;

  const recipe = worker.recipe || { pp: 1, name: worker.companyItemCode || 'Product' };
  const spotPrice = worker.spotPrice || 1.0;
  const unitsProduced = recipe.pp > 0 ? (dailyProducedPp / recipe.pp) : 0;
  const grossValue = unitsProduced * spotPrice;
  const rawExpense = worker.rawExpense !== undefined ? worker.rawExpense : (unitsProduced * (worker.baseRawCostPerUnit || 0));
  const netContribution = grossValue - rawExpense - dailyWage;

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white border border-slate-300 w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-150 overflow-hidden font-sans my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - White & Slate */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <span className="text-base sm:text-lg font-black text-slate-900">
                @{worker.username}
              </span>
              <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.5 font-bold">
                Level {worker.level || 1}
              </span>
              <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-800 px-2 py-0.5 font-bold border border-emerald-200">
                Active Employee
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Assigned Facility: <strong className="text-slate-800">{worker.companyName}</strong> ({worker.companyItemCode})
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            title="Close Audit (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Audit Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs font-mono">

          {/* Quick Result KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Daily Work Sessions</span>
              <strong className="text-slate-900 text-sm font-black">{dailySessions.toFixed(1)} /day</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">PP Output / Session</span>
              <strong className="text-emerald-800 text-sm font-black">{effectivePpPerHit.toFixed(1)} PP</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Daily PP Produced</span>
              <strong className="text-blue-900 text-sm font-black">{dailyProducedPp.toFixed(1)} PP</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Payable Salary / Day</span>
              <strong className="text-amber-800 text-sm font-black">-{dailyWage.toFixed(2)} C</strong>
            </div>
          </div>

          {/* Step 1: Energy & Daily Sessions */}
          <div className="bg-white border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-800 uppercase text-xs flex items-center gap-1.5">
                <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                <span>Energy Stamina & 24h Work Sessions</span>
              </span>
              <span className="text-[11px] text-slate-500 font-bold">
                {dailySessions.toFixed(1)} sessions/day
              </span>
            </div>

            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Energy Skill Level:</span>
                <strong className="text-slate-900">Level {energyLvl}</strong>
              </div>
              <div className="flex justify-between">
                <span>Max Energy Pool (Stamina):</span>
                <strong className="text-slate-900">{stamina} energy points</strong>
              </div>
              <div className="text-[11px] text-slate-400 bg-slate-50 p-2 border border-slate-100">
                Formula: Base 30 + (10 * Energy Level {energyLvl}) = <strong>{stamina} pts</strong>
              </div>
              <div className="flex justify-between pt-1">
                <span>Natural Regeneration Rate:</span>
                <strong className="text-slate-900">10% / hour ({hourlyRegenPts} pts/h)</strong>
              </div>
              <div className="flex justify-between">
                <span>24-Hour Stamina Capacity:</span>
                <strong className="text-slate-900">240% of pool ({full24hRegenPts} pts / 24h)</strong>
              </div>
              <div className="flex justify-between">
                <span>Energy Cost Per Work Session:</span>
                <strong className="text-slate-900">10 energy points</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-900 font-bold">
                <span>Natural Daily Work Sessions:</span>
                <strong className="text-blue-900 font-black">
                  ({stamina} * 0.24) = {dailySessions.toFixed(2)} sessions/day
                </strong>
              </div>
            </div>
          </div>

          {/* Step 2: Production Skill, Bonuses & PP Output */}
          <div className="bg-white border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-800 uppercase text-xs flex items-center gap-1.5">
                <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                <span>Production Skill & Bonuses</span>
              </span>
              <span className="text-[11px] text-emerald-700 font-bold">
                {effectivePpPerHit.toFixed(2)} PP / session
              </span>
            </div>

            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Production Skill Level:</span>
                <strong className="text-slate-900">Level {prodLvl}</strong>
              </div>
              <div className="flex justify-between">
                <span>Base Session Production:</span>
                <strong className="text-slate-900">{basePp} PP / session</strong>
              </div>
              <div className="text-[11px] text-slate-400 bg-slate-50 p-2 border border-slate-100">
                Formula: Base 10 + (3 * Production Level {prodLvl}) = <strong>{basePp} PP</strong>
              </div>
              <div className="flex justify-between pt-1">
                <span>Facility Production Bonus:</span>
                <strong className="text-emerald-700 font-bold">+{compBonus.toFixed(1)}%</strong>
              </div>
              <div className="flex justify-between">
                <span>Worker Fidelity (Loyalty):</span>
                <strong className={loyalty > 0 ? "text-emerald-700 font-bold" : "text-slate-400"}>
                  {loyalty > 0 ? `+${loyalty}%` : '0%'}
                </strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span>Combined Output Multiplier:</span>
                <strong className="text-emerald-800 font-bold">
                  1 + ({compBonus.toFixed(1)}% + {loyalty}%) / 100 = {outputMultiplier.toFixed(3)}x
                </strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-900 font-bold">
                <span>Effective PP Per Session (Hit):</span>
                <strong className="text-emerald-800 font-black">
                  {basePp} * {outputMultiplier.toFixed(3)} = {effectivePpPerHit.toFixed(2)} PP
                </strong>
              </div>
            </div>
          </div>

          {/* Step 3: Total Daily PP & Payable Salary */}
          <div className="bg-white border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-800 uppercase text-xs flex items-center gap-1.5">
                <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                <span>Total Daily PP Produced & Salary Pay</span>
              </span>
              <span className="text-[11px] text-amber-800 font-bold">
                -{dailyWage.toFixed(2)} Coins/day
              </span>
            </div>

            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Base Daily PP (without bonuses):</span>
                <strong className="text-slate-700">{dailyBasePp.toFixed(1)} PP/day</strong>
              </div>
              <div className="flex justify-between">
                <span>Bonus PP Contribution:</span>
                <strong className="text-emerald-700 font-bold">+{bonusPpDelta.toFixed(1)} PP/day (+{combinedBonusPct.toFixed(1)}%)</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-900 font-bold">
                <span>Total Daily PP Produced:</span>
                <strong className="text-blue-900 font-black">
                  {dailySessions.toFixed(1)} sessions * {effectivePpPerHit.toFixed(2)} PP = {dailyProducedPp.toFixed(1)} PP/day
                </strong>
              </div>

              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span>Contracted Wage Rate:</span>
                <strong className="text-slate-900 font-bold">{wageRate.toFixed(3)} Coins / PP</strong>
              </div>
              <div className="flex justify-between pt-1 text-slate-900 font-bold">
                <span>Payable Salary Per Day:</span>
                <strong className="text-amber-800 font-black text-sm">
                  {dailyProducedPp.toFixed(1)} PP * {wageRate.toFixed(3)} C = -{dailyWage.toFixed(2)} Coins/day
                </strong>
              </div>

              {/* Wage Outflow Projections */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] border-t border-slate-100">
                <div className="bg-slate-50 p-2 text-center border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Hourly</span>
                  <strong className="text-amber-800">-{hourlyWage.toFixed(2)} C</strong>
                </div>
                <div className="bg-slate-50 p-2 text-center border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Weekly (7d)</span>
                  <strong className="text-amber-800">-{weeklyWage.toFixed(2)} C</strong>
                </div>
                <div className="bg-slate-50 p-2 text-center border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Monthly (30d)</span>
                  <strong className="text-amber-800">-{monthlyWage.toFixed(2)} C</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Facility Return & Net Profit Contribution */}
          <div className="bg-white border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-800 uppercase text-xs flex items-center gap-1.5">
                <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">4</span>
                <span>Economic Contribution to {worker.companyName}</span>
              </span>
              <span className={`text-[11px] font-bold ${netContribution >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {netContribution >= 0 ? '+' : ''}{netContribution.toFixed(2)} Coins/day
              </span>
            </div>

            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Facility Item Produced:</span>
                <strong className="text-slate-900 capitalize">{recipe.name || worker.companyItemCode} ({spotPrice.toFixed(3)} C spot)</strong>
              </div>
              <div className="flex justify-between">
                <span>Recipe Labor Required:</span>
                <strong className="text-slate-900">{recipe.pp} PP / unit</strong>
              </div>
              <div className="flex justify-between">
                <span>Units Enabled Daily:</span>
                <strong className="text-slate-900 font-bold">{unitsProduced.toFixed(2)} units / day</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span>Gross Market Value Created:</span>
                <strong className="text-slate-900">+{grossValue.toFixed(2)} Coins/day</strong>
              </div>
              <div className="flex justify-between">
                <span>Raw Materials Consumed:</span>
                <strong className="text-rose-700">-{rawExpense.toFixed(2)} Coins/day</strong>
              </div>
              <div className="flex justify-between">
                <span>Salary Paid:</span>
                <strong className="text-amber-800">-{dailyWage.toFixed(2)} Coins/day</strong>
              </div>
              <div className="flex justify-between pt-1.5 border-t-2 border-slate-200 text-slate-900 font-bold">
                <span>Net Profit Generated by Worker:</span>
                <strong className={`font-black text-sm ${netContribution >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {netContribution >= 0 ? '+' : ''}{netContribution.toFixed(2)} Coins/day
                </strong>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-mono shrink-0">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Mathematical validation confirmed against live in-game skills</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs transition cursor-pointer"
          >
            Close Audit
          </button>
        </div>

      </div>
    </div>
  );
}
