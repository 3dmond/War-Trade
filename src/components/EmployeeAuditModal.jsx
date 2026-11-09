import React, { useEffect } from 'react';
import { X, CheckCircle2, ShieldCheck, Zap, Sparkles, Smile, TrendingUp, AlertTriangle, Users, Wrench } from 'lucide-react';
import { GoldCoin } from './CompanyPortfolio';
import { getTraitInfo } from '../data/employeeTraits';
import { getItemValuePerPp } from '../data/marketMath';
import { getCompanyTheme } from '../data/companyThemes';

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

  // v0.27+ AI Worker Production & Hourly Wage Metrics
  const hourlyOutputPp = typeof worker.hourlyOutputPp === 'number'
    ? worker.hourlyOutputPp
    : (typeof worker.estimate?.production === 'number' ? worker.estimate.production : (worker.dailyOutputPp ? worker.dailyOutputPp / 24 : 0));

  const hourlyWage = typeof worker.hourlyWage === 'number'
    ? worker.hourlyWage
    : (typeof worker.wage === 'number'
        ? worker.wage
        : (typeof worker.salary === 'number'
            ? worker.salary
            : (typeof worker.estimate?.wage === 'number' ? worker.estimate.wage : 0)));

  const dailyOutputPp = typeof worker.dailyOutputPp === 'number'
    ? worker.dailyOutputPp
    : Number((hourlyOutputPp * 24).toFixed(2));

  const dailyWage = typeof worker.dailyWage === 'number'
    ? worker.dailyWage
    : Number((hourlyWage * 24).toFixed(3));

  const itemCode = worker.companyItemCode || worker.estimate?.itemCode || 'steel';
  const theme = getCompanyTheme(itemCode);
  const ratePerPp = typeof worker.ratePerPp === 'number' ? worker.ratePerPp : getItemValuePerPp(itemCode);

  const hourlyRevenue = Number((hourlyOutputPp * ratePerPp).toFixed(4));
  const dailyRevenue = typeof worker.dailyProductionValue === 'number'
    ? worker.dailyProductionValue
    : Number((dailyOutputPp * ratePerPp).toFixed(3));

  const hourlyProfit = Number((hourlyRevenue - hourlyWage).toFixed(4));
  const dailyProfit = typeof worker.dailyProfit === 'number'
    ? worker.dailyProfit
    : Number((dailyRevenue - dailyWage).toFixed(3));

  const weeklyWage = Number((dailyWage * 7).toFixed(2));
  const monthlyWage = Number((dailyWage * 30).toFixed(2));

  // Trait, Potential & Happiness Breakdown
  const traits = Array.isArray(worker.traits) ? worker.traits : [];
  const happinessBreakdown = worker.happinessBreakdown || worker._raw?.happinessBreakdown || null;
  const happiness = typeof happinessBreakdown?.value === 'number'
    ? happinessBreakdown.value
    : (worker.happiness ?? 50);

  const potential = worker.potential ?? worker._raw?.potential ?? null;
  const potentialMax = worker.potentialMax ?? worker._raw?.potentialMax ?? null;

  const breakdown = worker.breakdown || worker._raw?.breakdown || {};
  const prodBreakdown = breakdown.production || null;
  const luckBreakdown = breakdown.luck || null;
  const respBreakdown = breakdown.responsibility || null;

  const baseProd = worker.baseProduction ?? prodBreakdown?.base ?? null;
  const trainedProd = worker.trainedProduction ?? prodBreakdown?.trained ?? null;

  // Production bonus breakdown (Management, Core region, Happiness, Tool, Specialization)
  const prodBonusObj = worker.productionBonusData || worker.productionBonus || worker._raw?.productionBonus || null;
  const prodBonusTotal = typeof prodBonusObj?.total === 'number'
    ? prodBonusObj.total
    : (typeof worker.productionBonus === 'number' ? worker.productionBonus : null);
  const prodBonusContributions = Array.isArray(prodBonusObj?.contributions) ? prodBonusObj.contributions : [];

  // Tool Item details
  const toolItem = worker.toolItem || worker.tool || worker._raw?.toolItem || null;
  const toolStatus = worker.toolStatus || worker._raw?.toolStatus || null;

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className={`bg-white border-2 ${theme.modalBorder} w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-150 overflow-hidden font-sans my-auto rounded-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Product Theme Accent Strip */}
        <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: theme.accentColor }} />

        {/* Header with Product Theme Gradient Wash */}
        <div className={`p-4 sm:p-5 ${theme.modalHeader} flex items-center justify-between shrink-0`}>
          <div className="space-y-1">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="text-base sm:text-lg font-black text-slate-900">
                {worker.name || worker.username || 'AI Employee'}
              </span>
              {worker.age && (
                <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.5 font-bold rounded">
                  Age {worker.age} {worker.gender ? `(${worker.gender})` : ''}
                </span>
              )}
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 font-bold rounded ${theme.modalPill}`}>
                {itemCode} • {theme.label}
              </span>
              {happiness !== null && (
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 border rounded ${happiness >= 50 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  😊 {happiness}% Happiness
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Assigned Facility: <strong className="text-slate-800">{worker.companyName || 'Active Company'}</strong> ({itemCode} • {ratePerPp} BTC/PP)
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer rounded-lg"
            title="Close Audit (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Audit Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs font-mono">

          {/* Quick Result KPI Bar */}
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 ${theme.modalKpiBg} p-3 rounded-xl`}>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Hourly Salary</span>
              <strong className="text-red-600 text-sm font-black flex items-center gap-1">
                -{hourlyWage.toFixed(4)} <GoldCoin size={12} />
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Hourly Yield</span>
              <strong className="text-blue-900 text-sm font-black">{hourlyOutputPp.toFixed(2)} PP/h</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Daily Output</span>
              <strong className="text-emerald-800 text-sm font-black">{dailyOutputPp.toFixed(1)} PP/day</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Daily Net Profit</span>
              <strong className={`text-sm font-black flex items-center gap-1 ${dailyProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {dailyProfit >= 0 ? '+' : ''}{dailyProfit.toFixed(2)} <GoldCoin size={12} />
              </strong>
            </div>
          </div>

          {/* Traits & Worker Links Section */}
          {traits.length > 0 && (
            <div className="bg-white border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-800 uppercase text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Employee Traits & Coworker Synergies</span>
                </span>
                {potential !== null && (
                  <span className="text-[11px] text-slate-700 font-bold bg-slate-100 px-2 py-0.5">
                    Growth Potential: {potential} / {potentialMax || potential}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {traits.map((t, idx) => {
                  const info = getTraitInfo(t.code || t);
                  return (
                    <div 
                      key={idx} 
                      className={`p-2.5 border flex flex-col justify-between space-y-1.5 ${info.isCoworkerLinked ? 'bg-amber-50/60 border-amber-300' : 'bg-slate-50 border-slate-200'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                          <span className="text-sm">{info.icon}</span>
                          <span>{info.name}</span>
                        </div>
                        {info.isCoworkerLinked ? (
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 bg-amber-200/80 text-amber-900 flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" /> Coworker Link
                          </span>
                        ) : (
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 bg-slate-200 text-slate-700">
                            Solo
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 font-sans leading-tight">
                        {info.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tool Item & Equipment Card (if assigned) */}
          {toolItem && (
            <div className="bg-white border border-slate-200 p-4 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-800 uppercase text-xs flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-sky-600" />
                  <span>Equipped Tool Hardware</span>
                </span>
                <span className="text-[10px] font-bold text-sky-700 uppercase bg-sky-50 px-2 py-0.5 border border-sky-200">
                  {toolItem.code || 'Tool'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Durability State</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 bg-slate-200 h-2 overflow-hidden">
                      <div 
                        className="bg-sky-600 h-full" 
                        style={{ width: `${Math.min(100, Math.max(0, (toolItem.state / (toolItem.maxState || 100)) * 100))}%` }}
                      />
                    </div>
                    <strong className="text-slate-900 font-mono text-[11px]">
                      {toolItem.state?.toFixed(1) || 100} / {toolItem.maxState || 100}
                    </strong>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Skill Multiplier</span>
                  <strong className="text-emerald-700 font-bold block mt-0.5">
                    +{toolItem.skills?.production ?? toolStatus?.bonusPercent ?? 0}% Production
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Production Bonus Breakdown (Management, Core region, Happiness, Tool) */}
          <div className="bg-white border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="font-bold text-slate-800 uppercase text-xs block">Production Bonus Breakdown</span>
                <span className="text-[10px] text-slate-500 font-sans">Every percent that scales what their Production banks, added together</span>
              </div>
              <span className="text-sm font-black text-emerald-700">
                +{prodBonusTotal ?? 0}%
              </span>
            </div>

            <div className="space-y-1.5 text-slate-700">
              {prodBonusContributions.length > 0 ? (
                prodBonusContributions.map((c, i) => (
                  <div key={i} className="flex justify-between items-center py-0.5">
                    <span className="capitalize">{c.source === 'coreRegion' ? 'Core region' : c.source}:</span>
                    <strong className={c.percent >= 0 ? 'text-emerald-700' : 'text-red-600'}>
                      {c.percent >= 0 ? `+${c.percent}%` : `${c.percent}%`}
                    </strong>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-[11px]">No active bonus contributions.</div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-bold text-slate-900">
                <span>Total Production Bonus:</span>
                <strong className="text-emerald-800 font-black text-sm">
                  +{prodBonusTotal ?? 0}%
                </strong>
              </div>
            </div>
          </div>

          {/* Production Stat Breakdown */}
          {prodBreakdown && (
            <div className="bg-white border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-800 uppercase text-xs">Production Stat Breakdown</span>
                <span className="text-sm font-black text-slate-900">
                  Total: {prodBreakdown.total ?? 0}
                </span>
              </div>

              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between items-center">
                  <span>Base Stat:</span>
                  <strong className="text-slate-900">{prodBreakdown.base ?? 0}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span>Trained Skill:</span>
                  <strong className="text-emerald-700">+{prodBreakdown.trained ?? 0}</strong>
                </div>
                {Array.isArray(prodBreakdown.contributions) && prodBreakdown.contributions.map((c, i) => (
                  <div key={i} className="flex justify-between items-center text-slate-600">
                    <span className="capitalize">{c.code}:</span>
                    <strong className="text-blue-700">
                      +{c.delta}{c.percent ? '%' : ''}
                    </strong>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-bold text-slate-900">
                  <span>Calculated Total Production:</span>
                  <strong className="text-blue-900 font-black text-sm">
                    {prodBreakdown.total ?? 0}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Happiness Breakdown */}
          {happinessBreakdown && (
            <div className="bg-white border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-800 uppercase text-xs">Happiness & Retention Breakdown</span>
                <span className={`text-sm font-black ${happiness >= 50 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {happiness}%
                </span>
              </div>

              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between items-center">
                  <span>Base Happiness:</span>
                  <strong className="text-slate-900">{happinessBreakdown.base ?? 50}</strong>
                </div>
                {Array.isArray(happinessBreakdown.contributions) && happinessBreakdown.contributions.map((c, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="capitalize">{c.reason === 'incomeTax' ? 'Income tax' : (c.reason === 'recentlyMoved' ? 'Recently moved' : c.reason)}:</span>
                    <strong className={c.delta >= 0 ? 'text-emerald-700' : 'text-red-600'}>
                      {c.delta >= 0 ? `+${c.delta}` : `${c.delta}`}
                    </strong>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-bold text-slate-900">
                  <span>Effective Morale Value:</span>
                  <strong className={happiness >= 50 ? 'text-emerald-800 font-black' : 'text-amber-800 font-black'}>
                    {happiness}% ({happinessBreakdown.quitChance ? `${happinessBreakdown.quitChance}% quit chance` : '0% quit chance'})
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Salary & Financials */}
          <div className="bg-white border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-800 uppercase text-xs">Hourly Salary & Daily Payroll Outflow</span>
              <span className="text-[11px] text-red-600 font-bold">
                -{dailyWage.toFixed(3)} BTC/day
              </span>
            </div>

            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Contracted Hourly Salary:</span>
                <strong className="text-slate-900 font-bold flex items-center gap-1">
                  {hourlyWage.toFixed(6)} <GoldCoin size={11} /> / hour
                </strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-900 font-bold">
                <span>Daily Payroll Outflow (24h continuous):</span>
                <strong className="text-red-600 font-black text-sm flex items-center gap-1">
                  {hourlyWage.toFixed(6)} * 24 = -{dailyWage.toFixed(3)} <GoldCoin size={12} /> / day
                </strong>
              </div>
            </div>
          </div>

          {/* Step 3: Economic Profit & Conversion */}
          <div className="bg-white border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-800 uppercase text-xs">Estimated Profit Contribution</span>
              <span className={`text-[11px] font-bold ${dailyProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {dailyProfit >= 0 ? '+' : ''}{dailyProfit.toFixed(2)} BTC/day
              </span>
            </div>

            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Commodity Net Value per PP:</span>
                <strong className="text-slate-900 font-mono">{ratePerPp.toFixed(4)} BTC / PP ({itemCode})</strong>
              </div>
              <div className="flex justify-between">
                <span>Daily Gross Production Value:</span>
                <strong className="text-emerald-700 font-bold flex items-center gap-1">
                  +{dailyRevenue.toFixed(3)} <GoldCoin size={11} /> / day
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Daily Payroll Outflow:</span>
                <strong className="text-red-600 font-bold flex items-center gap-1">
                  -{dailyWage.toFixed(3)} <GoldCoin size={11} /> / day
                </strong>
              </div>
              <div className="flex justify-between pt-1.5 border-t-2 border-slate-200 text-slate-900 font-bold">
                <span>Net In-Game Daily Profit:</span>
                <strong className={`font-black text-sm flex items-center gap-1 ${dailyProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {dailyProfit >= 0 ? '+' : ''}{dailyProfit.toFixed(3)} <GoldCoin size={13} /> / day
                </strong>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-mono shrink-0">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Exact match with in-game Estimated Profit breakdown</span>
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
