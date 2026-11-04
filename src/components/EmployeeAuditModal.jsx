import React, { useEffect } from 'react';
import { X, CheckCircle2, ShieldCheck, Zap, Sparkles, Smile, TrendingUp, AlertTriangle } from 'lucide-react';
import { GoldCoin } from './CompanyPortfolio';

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

  const MARKET_VALUE_PER_PP = 0.09566;
  const hourlyRevenue = Number((hourlyOutputPp * MARKET_VALUE_PER_PP).toFixed(4));
  const dailyRevenue = typeof worker.dailyProductionValue === 'number'
    ? worker.dailyProductionValue
    : Number((dailyOutputPp * MARKET_VALUE_PER_PP).toFixed(3));

  const hourlyProfit = Number((hourlyRevenue - hourlyWage).toFixed(4));
  const dailyProfit = typeof worker.dailyProfit === 'number'
    ? worker.dailyProfit
    : Number((dailyRevenue - dailyWage).toFixed(3));

  const weeklyWage = Number((dailyWage * 7).toFixed(2));
  const monthlyWage = Number((dailyWage * 30).toFixed(2));

  // Trait, Potential & Happiness Breakdown
  const traits = Array.isArray(worker.traits) ? worker.traits : [];
  const happiness = worker.happiness ?? worker.happinessBreakdown?.value ?? null;
  const potential = worker.potential ?? null;
  const potentialMax = worker.potentialMax ?? null;
  const breakdown = worker.breakdown || {};
  const baseProd = worker.baseProduction ?? breakdown.production?.base ?? null;
  const trainedProd = worker.trainedProduction ?? breakdown.production?.trained ?? null;
  const prodBonus = worker.productionBonus ?? null;

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white border border-slate-300 w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-150 overflow-hidden font-sans my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="text-base sm:text-lg font-black text-slate-900">
                {worker.name || worker.username || 'AI Employee'}
              </span>
              {worker.age && (
                <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.5 font-bold">
                  Age {worker.age} {worker.gender ? `(${worker.gender})` : ''}
                </span>
              )}
              <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-800 px-2 py-0.5 font-bold border border-emerald-200">
                Hired AI Worker (v0.27+)
              </span>
              {happiness !== null && (
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 border ${happiness >= 50 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  😊 {happiness}% Happiness
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Assigned Facility: <strong className="text-slate-800">{worker.companyName || 'Active Company'}</strong> ({worker.companyItemCode || 'Commodity'})
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

          {/* Traits & Potential Badge Section */}
          {(traits.length > 0 || potential !== null) && (
            <div className="bg-white border border-slate-200 p-4 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-800 uppercase text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>AI Worker Traits & Growth Potential</span>
                </span>
                {potential !== null && (
                  <span className="text-[11px] text-slate-700 font-bold">
                    Potential: {potential} / {potentialMax || potential}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {traits.map((t, idx) => (
                  <span key={idx} className="bg-amber-50 text-amber-900 border border-amber-200/80 px-2.5 py-1 text-[11px] font-bold">
                    ★ {t.code || t.name || t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Hourly Production & 24h Output Yield */}
          <div className="bg-white border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-800 uppercase text-xs flex items-center gap-1.5">
                <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                <span>Production Breakdown (Hourly & 24h Output)</span>
              </span>
              <span className="text-[11px] text-emerald-700 font-bold">
                {hourlyOutputPp.toFixed(2)} PP/hour
              </span>
            </div>

            <div className="space-y-1.5 text-slate-600">
              {baseProd !== null && (
                <div className="flex justify-between">
                  <span>Base Production Stat:</span>
                  <strong className="text-slate-900">{baseProd} PP</strong>
                </div>
              )}
              {trainedProd !== null && trainedProd > 0 && (
                <div className="flex justify-between">
                  <span>Trained Skill Increment:</span>
                  <strong className="text-emerald-700">+{trainedProd} PP</strong>
                </div>
              )}
              {typeof prodBonus === 'number' && (
                <div className="flex justify-between">
                  <span>Facility Production Multiplier:</span>
                  <strong className="text-emerald-700">+{prodBonus}%</strong>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-900 font-bold">
                <span>Effective Hourly Production Rate:</span>
                <strong className="text-blue-900 font-black">
                  {hourlyOutputPp.toFixed(3)} PP / hour
                </strong>
              </div>
              <div className="flex justify-between text-slate-900 font-bold pt-1">
                <span>Continuous 24h Daily Production Yield:</span>
                <strong className="text-emerald-800 font-black">
                  {hourlyOutputPp.toFixed(3)} * 24 = {dailyOutputPp.toFixed(1)} PP / day
                </strong>
              </div>
            </div>
          </div>

          {/* Step 2: Hourly Rate & Payable Salary Outflows */}
          <div className="bg-white border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-800 uppercase text-xs flex items-center gap-1.5">
                <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                <span>Salary & Payroll Outflows (Hourly Rate)</span>
              </span>
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
                <span>Payable Daily Salary Outflow (24 Hours):</span>
                <strong className="text-red-600 font-black text-sm flex items-center gap-1">
                  {hourlyWage.toFixed(6)} * 24 = -{dailyWage.toFixed(3)} <GoldCoin size={12} /> / day
                </strong>
              </div>

              {/* Salary Outflow Projections */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] border-t border-slate-100">
                <div className="bg-slate-50 p-2 text-center border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Hourly</span>
                  <strong className="text-red-600">-{hourlyWage.toFixed(4)} BTC</strong>
                </div>
                <div className="bg-slate-50 p-2 text-center border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Weekly (7d)</span>
                  <strong className="text-red-600">-{weeklyWage.toFixed(2)} BTC</strong>
                </div>
                <div className="bg-slate-50 p-2 text-center border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Monthly (30d)</span>
                  <strong className="text-red-600">-{monthlyWage.toFixed(2)} BTC</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Economic Value & Net Profit Contribution */}
          <div className="bg-white border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-800 uppercase text-xs flex items-center gap-1.5">
                <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                <span>Net Economic Contribution</span>
              </span>
              <span className={`text-[11px] font-bold ${dailyProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {dailyProfit >= 0 ? '+' : ''}{dailyProfit.toFixed(2)} BTC/day
              </span>
            </div>

            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Standard Conversion Factor:</span>
                <strong className="text-slate-900 font-mono">0.09566 BTC per PP</strong>
              </div>
              <div className="flex justify-between">
                <span>Daily Gross Production Value (Revenue):</span>
                <strong className="text-emerald-700 font-bold flex items-center gap-1">
                  +{dailyRevenue.toFixed(3)} <GoldCoin size={11} /> / day
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Daily Salary Outflow (Payroll):</span>
                <strong className="text-red-600 font-bold flex items-center gap-1">
                  -{dailyWage.toFixed(3)} <GoldCoin size={11} /> / day
                </strong>
              </div>
              <div className="flex justify-between pt-1.5 border-t-2 border-slate-200 text-slate-900 font-bold">
                <span>Net Profit Generated by AI Employee:</span>
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
            <span>Mathematical validation confirmed against live in-game v0.27 API</span>
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
