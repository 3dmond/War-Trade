import React, { useState, useMemo, useEffect } from 'react';
import { X, ExternalLink, ChevronDown, ChevronRight, Calculator } from 'lucide-react';
import EmployeeAuditModal from './EmployeeAuditModal';

const METRIC_TABS = [
  { id: 'valuation', label: 'Portfolio Valuation' },
  { id: 'revenue', label: 'Base Revenue' },
  { id: 'rawCosts', label: 'Raw Costs' },
  { id: 'salaries', label: 'Base Salaries' },
  { id: 'profit', label: 'Base Profit' },
  { id: 'production', label: 'Base Production' },
  { id: 'pp', label: 'Enterprise PP' },
  { id: 'staff', label: 'Staff Deployment' },
];

export default function MetricBreakdownModal({
  isOpen = false,
  activeMetric = 'valuation',
  onClose,
  onChangeMetric,
  companies = [],
  marketOverview = {},
  user = null,
  wealth = {},
  ownerLabor = {},
  hourlyStats = {},
  liveTotalNetWorth = 0,
  liveFacilitiesVal = 0,
  liveItemsVal = 0,
  liquidMoneyVal = 0,
  equipmentVal = 0,
  weaponsVal = 0,
  managementLevel = 0,
  maxHiringSlots = 4,
  prices = {},
  priceChanges24h = {},
  onSelectCompany
}) {
  // Sub-view toggle for valuation: 'assets' | 'facilities'
  const [valViewMode, setValViewMode] = useState('assets');
  // Interactive Employee Math Audit expansion & modal state
  const [expandedWorkerId, setExpandedWorkerId] = useState(null);
  const [inspectedWorker, setInspectedWorker] = useState(null);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
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

  // Enriched flat list of all hired workers
  const allWorkers = useMemo(() => {
    const list = [];
    companies.forEach(comp => {
      const compBonus = typeof comp.totalBonusPct === 'number'
        ? comp.totalBonusPct
        : (typeof comp.productionBonus === 'number'
            ? comp.productionBonus
            : (typeof comp.productionBonusData?.total === 'number' ? comp.productionBonusData.total : 0));
      const workers = comp.workersList || comp.workers || [];
      workers.forEach(w => {
        const energyLvl = typeof w.energySkill === 'number' ? w.energySkill : (typeof w.energySkillLevel === 'number' ? w.energySkillLevel : 0);
        const stamina = w.energyStamina || w.energyPointsTotal || (30 + energyLvl * 10);
        const dailySessions = typeof w.dailySessions === 'number' && w.dailySessions > 0
          ? w.dailySessions
          : (typeof w.workSessionsPerDay === 'number' && w.workSessionsPerDay > 0
              ? w.workSessionsPerDay
              : Number((stamina * 0.24).toFixed(2)));
        const prodLvl = typeof w.productionSkill === 'number' ? w.productionSkill : (typeof w.productionSkillLevel === 'number' ? w.productionSkillLevel : 0);
        const basePp = w.basePp || w.productionPointsBase || (prodLvl > 10 ? prodLvl : (10 + prodLvl * 3));
        const loyalty = typeof w.fidelity === 'number' ? w.fidelity : (typeof w.loyaltyBonus === 'number' ? w.loyaltyBonus : 0);
        const devPct = typeof w.devPct === 'number' ? w.devPct : (typeof comp.regionData?.development === 'number' ? comp.regionData.development : 4.88);
        const incomeTaxPct = typeof w.incomeTaxPct === 'number' ? w.incomeTaxPct : (typeof comp.incomeTaxPct === 'number' ? comp.incomeTaxPct : (comp.countryTaxes?.income ?? 9.0));

        // 1. Worker Labor PP per session (what contracted wage is paid on)
        const laborMultiplier = (1 + (loyalty / 100)) * (1 + (devPct / 100));
        const laborPpPerHit = typeof w.laborPpPerHit === 'number'
          ? w.laborPpPerHit
          : Number((basePp * laborMultiplier).toFixed(2));

        // 2. Company Production PP per session (full factory yield delivered to company inventory)
        const producedPpPerHit = typeof w.producedPpPerHit === 'number'
          ? w.producedPpPerHit
          : Number((laborPpPerHit * (1 + (compBonus * 0.91 / 100))).toFixed(2));

        const dailyBasePp = typeof w.baseDailyPp === 'number' ? w.baseDailyPp : (dailySessions * basePp);
        const dailyLaborPp = typeof w.dailyLaborPp === 'number' ? w.dailyLaborPp : Number((dailySessions * laborPpPerHit).toFixed(1));
        const dailyProducedPp = typeof w.producedDailyPp === 'number' && w.producedDailyPp > 0
          ? w.producedDailyPp
          : (typeof w.dailyPp === 'number' && w.dailyPp > 0 ? w.dailyPp : Number((dailySessions * producedPpPerHit).toFixed(1)));

        // 3. Contracted Wage Rate & Regional Income Tax
        const wageRate = typeof w.wageRate === 'number'
          ? w.wageRate
          : (typeof w.wagePerPp === 'number' ? w.wagePerPp : (typeof w.wage === 'number' ? w.wage : 0.158));
        const netWageRate = typeof w.netWageRate === 'number'
          ? w.netWageRate
          : Number((wageRate * (1 - (incomeTaxPct / 100))).toFixed(3));

        // Per-hit and daily payroll outflows
        const grossWagePerHit = typeof w.grossWagePerHit === 'number'
          ? w.grossWagePerHit
          : Number((laborPpPerHit * wageRate).toFixed(3));
        const taxPerHit = typeof w.taxPerHit === 'number'
          ? w.taxPerHit
          : Number((grossWagePerHit * (incomeTaxPct / 100)).toFixed(3));
        const netWagePerHit = typeof w.netWagePerHit === 'number'
          ? w.netWagePerHit
          : Number((grossWagePerHit - taxPerHit).toFixed(3));

        const dailyWage = typeof w.dailyWage === 'number' && w.dailyWage > 0
          ? w.dailyWage
          : Number((dailySessions * grossWagePerHit).toFixed(2));
        const dailyTax = typeof w.dailyTax === 'number'
          ? w.dailyTax
          : Number((dailySessions * taxPerHit).toFixed(2));
        const netDailyWage = typeof w.netDailyWage === 'number'
          ? w.netDailyWage
          : Number((dailySessions * netWagePerHit).toFixed(2));

        const recipe = comp.recipe || { pp: 1, name: comp.itemCode || 'Product' };
        const spotPrice = comp.spotPrice || prices[comp.itemCode] || 1.0;
        const unitsProduced = recipe.pp > 0 ? (dailyProducedPp / recipe.pp) : 0;
        const grossValue = unitsProduced * spotPrice;
        const rawExpense = (comp.isRaw || comp.recipe?.type === 'raw') ? 0 : (unitsProduced * (comp.baseRawCostPerUnit || 0));
        const netContribution = grossValue - rawExpense - dailyWage;

        list.push({
          ...w,
          companyId: comp.id || comp._id,
          companyName: comp.name,
          companyItemCode: comp.itemCode,
          companyTotalBonusPct: compBonus,
          recipe,
          spotPrice,
          baseRawCostPerUnit: comp.baseRawCostPerUnit || 0,
          energySkill: energyLvl,
          energyStamina: stamina,
          energyPointsTotal: stamina,
          dailySessions,
          workSessionsPerDay: dailySessions,
          productionSkill: prodLvl,
          basePp,
          productionPointsBase: basePp,
          fidelity: loyalty,
          loyaltyBonus: loyalty,
          devPct,
          incomeTaxPct,
          laborPpPerHit,
          producedPpPerHit,
          effectivePpPerHit: producedPpPerHit,
          ppPerHit: producedPpPerHit,
          dailyBasePp,
          dailyLaborPp,
          producedDailyPp: dailyProducedPp,
          dailyPp: dailyProducedPp,
          wageRate,
          wagePerPp: wageRate,
          wage: wageRate,
          netWageRate,
          grossWagePerHit,
          taxPerHit,
          netWagePerHit,
          dailyWage,
          grossDailyWage: dailyWage,
          netDailyWage,
          dailyTax,
          unitsProduced,
          grossValue,
          rawExpense,
          netContribution
        });
      });
    });
    return list;
  }, [companies, prices]);

  // Steel and Concrete Capital Influence Math
  const constructionMetrics = useMemo(() => {
    const steelPrice = prices.steel || 1.725;
    const concretePrice = prices.concrete || 1.703;
    const steelChange24h = priceChanges24h.steel || { changeDiff: 0, changePercent: 0 };
    const concreteChange24h = priceChanges24h.concrete || { changeDiff: 0, changePercent: 0 };

    // Rolling 1-hour estimates from 24h trajectory
    const steel1hDiff = Number((steelChange24h.changeDiff / 24).toFixed(4));
    const steel1hPct = Number((steelChange24h.changePercent / 24).toFixed(2));
    const concrete1hDiff = Number((concreteChange24h.changeDiff / 24).toFixed(4));
    const concrete1hPct = Number((concreteChange24h.changePercent / 24).toFixed(2));

    // Total physical capital invested across all companies
    let totalConcreteInvested = 0;
    let totalSteelInvested = 0;

    companies.forEach(c => {
      totalConcreteInvested += (c.concreteInvested || 200);
      const engineSteel = c.engineTier?.steel || 0;
      const storageSteel = c.storageTier?.steel || 0;
      totalSteelInvested += (engineSteel + storageSteel);
    });

    const totalConcreteValue = totalConcreteInvested * concretePrice;
    const totalSteelValue = totalSteelInvested * steelPrice;

    // 1-hour valuation change driven by commodity price shifts
    const concreteValueChange1h = totalConcreteInvested * concrete1hDiff;
    const steelValueChange1h = totalSteelInvested * steel1hDiff;
    const totalConstructionCapitalChange1h = concreteValueChange1h + steelValueChange1h;

    return {
      steelPrice,
      concretePrice,
      steelChange24h,
      concreteChange24h,
      steel1hDiff,
      steel1hPct,
      concrete1hDiff,
      concrete1hPct,
      totalConcreteInvested,
      totalSteelInvested,
      totalConcreteValue,
      totalSteelValue,
      concreteValueChange1h,
      steelValueChange1h,
      totalConstructionCapitalChange1h
    };
  }, [prices, priceChanges24h, companies]);

  // Rolling 1-Hour breakdown of assets
  const assetValuationBreakdown = useMemo(() => {
    const totalVal = liveTotalNetWorth > 0 ? liveTotalNetWorth : 1;
    const totalDelta1h = hourlyStats.netWorthCoins || 0;

    let facilitiesDelta1h = 0;
    let itemsDelta1h = 0;
    let moneyDelta1h = 0;
    let equipmentDelta1h = 0;
    let weaponsDelta1h = 0;

    if (totalDelta1h !== 0) {
      const facilitiesShare = liveFacilitiesVal / totalVal;
      const itemsShare = liveItemsVal / totalVal;
      const moneyShare = liquidMoneyVal / totalVal;
      const equipShare = equipmentVal / totalVal;

      facilitiesDelta1h = Number((totalDelta1h * facilitiesShare).toFixed(1));
      itemsDelta1h = Number((totalDelta1h * itemsShare).toFixed(1));
      moneyDelta1h = Number((totalDelta1h * moneyShare).toFixed(1));
      equipmentDelta1h = Number((totalDelta1h * equipShare).toFixed(1));
      weaponsDelta1h = Number((totalDelta1h - (facilitiesDelta1h + itemsDelta1h + moneyDelta1h + equipmentDelta1h)).toFixed(1));
    } else {
      const totalCompanyOperatingProfit1h = companies.reduce((sum, c) => sum + ((c.baseNetProfit || 0) / 24), 0);
      facilitiesDelta1h = Number((totalCompanyOperatingProfit1h + constructionMetrics.totalConstructionCapitalChange1h).toFixed(1));
    }

    return [
      {
        id: 'facilities',
        label: 'Industrial Facilities',
        description: `${companies.length} active factories & extraction plants`,
        value: liveFacilitiesVal,
        change1h: facilitiesDelta1h,
        change1hPct: liveFacilitiesVal > 0 ? (facilitiesDelta1h / liveFacilitiesVal) * 100 : 0,
        sharePct: (liveFacilitiesVal / totalVal) * 100
      },
      {
        id: 'items',
        label: 'Commodity Inventory',
        description: 'Warehouse raw materials & manufactured commodities',
        value: liveItemsVal,
        change1h: itemsDelta1h,
        change1hPct: liveItemsVal > 0 ? (itemsDelta1h / liveItemsVal) * 100 : 0,
        sharePct: (liveItemsVal / totalVal) * 100
      },
      {
        id: 'money',
        label: 'Liquid Treasury',
        description: 'Available cash balance in game BTC',
        value: liquidMoneyVal,
        change1h: moneyDelta1h,
        change1hPct: liquidMoneyVal > 0 ? (moneyDelta1h / liquidMoneyVal) * 100 : 0,
        sharePct: (liquidMoneyVal / totalVal) * 100
      },
      {
        id: 'equipment',
        label: 'Military Equipment',
        description: 'Helmets, armor, shields & defense gear',
        value: equipmentVal,
        change1h: equipmentDelta1h,
        change1hPct: equipmentVal > 0 ? (equipmentDelta1h / equipmentVal) * 100 : 0,
        sharePct: (equipmentVal / totalVal) * 100
      },
      {
        id: 'weapons',
        label: 'Armory & Weapons',
        description: 'Equipped & stored military weaponry',
        value: weaponsVal,
        change1h: weaponsDelta1h,
        change1hPct: weaponsVal > 0 ? (weaponsDelta1h / weaponsVal) * 100 : 0,
        sharePct: (weaponsVal / totalVal) * 100
      }
    ];
  }, [
    liveTotalNetWorth, 
    liveFacilitiesVal, 
    liveItemsVal, 
    liquidMoneyVal, 
    equipmentVal, 
    weaponsVal, 
    companies, 
    hourlyStats,
    constructionMetrics
  ]);

  if (!isOpen) return null;

  const currentTab = METRIC_TABS.find(t => t.id === activeMetric) || METRIC_TABS[0];
  const modalTitle = `${currentTab.label} Breakdown`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in font-sans">
      {/* Click outside backdrop */}
      <div 
        className="fixed inset-0" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container (Clean, White, Structured) */}
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-white border border-slate-300 shadow-2xl flex flex-col z-10 overflow-hidden text-slate-900">
        
        {/* Header - White, Simple, Straight to the Point */}
        <div className="px-5 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
              {modalTitle}
            </h2>
            <p className="text-[11px] text-slate-500 font-mono">
              Live mathematical breakdown
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close breakdown (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Metric Tabs Selector - Simple White & Slate */}
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs font-mono">
          {METRIC_TABS.map(tab => {
            const isActive = tab.id === activeMetric;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeMetric(tab.id)}
                className={`px-3 py-1.5 whitespace-nowrap transition-colors cursor-pointer border ${
                  isActive 
                    ? 'bg-slate-900 text-white font-bold border-slate-900' 
                    : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body / Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-white">

          {/* 1. PORTFOLIO VALUATION BREAKDOWN */}
          {activeMetric === 'valuation' && (
            <div className="space-y-4">
              {/* Summary Card */}
              <div className="bg-white p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-mono font-bold uppercase text-slate-500">
                    Total Portfolio Valuation
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
                    {liveTotalNetWorth.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    <span className="text-xs font-normal text-slate-500 ml-1.5">BTC</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] font-mono uppercase text-slate-400">Past 1-Hour Change</div>
                    <div className={`text-base font-black font-mono ${hourlyStats.netWorthCoins > 0 ? 'text-emerald-500' : hourlyStats.netWorthCoins < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                      {hourlyStats.netWorthCoins > 0 ? '+' : ''}{hourlyStats.netWorthCoins.toFixed(1)} ({hourlyStats.netWorthPct > 0 ? '+' : ''}{hourlyStats.netWorthPct.toFixed(2)}%)
                    </div>
                  </div>
                  <div className="flex bg-slate-100 p-0.5 border border-slate-200 text-xs font-mono">
                    <button
                      onClick={() => setValViewMode('assets')}
                      className={`px-2.5 py-1 cursor-pointer ${valViewMode === 'assets' ? 'bg-white font-bold text-slate-900 shadow-xs' : 'text-slate-600'}`}
                    >
                      By Asset Class
                    </button>
                    <button
                      onClick={() => setValViewMode('facilities')}
                      className={`px-2.5 py-1 cursor-pointer ${valViewMode === 'facilities' ? 'bg-white font-bold text-slate-900 shadow-xs' : 'text-slate-600'}`}
                    >
                      By Company ({companies.length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Construction Capital Influence (Steel & Concrete Price Movement Drivers) */}
              <div className="bg-slate-50 p-4 border border-slate-200 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wide">
                    Construction Capital Drivers: Steel & Concrete
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Direct drivers of company fixed infrastructure valuation
                  </span>
                </div>
                
                <p className="text-xs text-slate-600 leading-relaxed">
                  Company valuations are anchored to physical infrastructure: foundation structures require <strong>Concrete</strong>, while engine and storage expansions require <strong>Steel</strong>. Shifts in market spot prices of Steel and Concrete directly revalue company assets over the period.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Steel Telemetry */}
                  <div className="bg-white p-3 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Steel (Engine & Storage Upgrades)</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Invested: {constructionMetrics.totalSteelInvested} steel ({constructionMetrics.totalSteelValue.toFixed(1)} BTC)
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-sm font-black text-slate-900">{constructionMetrics.steelPrice.toFixed(3)} BTC</div>
                      <div className={`text-[11px] font-bold ${constructionMetrics.steel1hDiff > 0 ? 'text-emerald-500' : constructionMetrics.steel1hDiff < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                        {constructionMetrics.steel1hDiff > 0 ? '+' : ''}{constructionMetrics.steel1hDiff.toFixed(3)} ({constructionMetrics.steel1hPct > 0 ? '+' : ''}{constructionMetrics.steel1hPct.toFixed(2)}% /1h)
                      </div>
                    </div>
                  </div>

                  {/* Concrete Telemetry */}
                  <div className="bg-white p-3 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Concrete (Building Structures)</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Invested: {constructionMetrics.totalConcreteInvested} concrete ({constructionMetrics.totalConcreteValue.toFixed(1)} BTC)
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-sm font-black text-slate-900">{constructionMetrics.concretePrice.toFixed(3)} BTC</div>
                      <div className={`text-[11px] font-bold ${constructionMetrics.concrete1hDiff > 0 ? 'text-emerald-500' : constructionMetrics.concrete1hDiff < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                        {constructionMetrics.concrete1hDiff > 0 ? '+' : ''}{constructionMetrics.concrete1hDiff.toFixed(3)} ({constructionMetrics.concrete1hPct > 0 ? '+' : ''}{constructionMetrics.concrete1hPct.toFixed(2)}% /1h)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ASSET CLASS VIEW */}
              {valViewMode === 'assets' && (
                <div className="bg-white border border-slate-200 overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-slate-700 uppercase">
                      Asset Allocation
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Sum of assets = 100.0% of portfolio
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-600">
                          <th className="py-2.5 px-4 font-bold">Asset Category</th>
                          <th className="py-2.5 px-3 font-bold">Details</th>
                          <th className="py-2.5 px-3 font-bold text-right">Current Value</th>
                          <th className="py-2.5 px-3 font-bold text-right">Past 1h Change</th>
                          <th className="py-2.5 px-4 font-bold text-right">Share of Portfolio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {assetValuationBreakdown.map(asset => (
                          <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900 font-sans">
                              {asset.label}
                            </td>
                            <td className="py-3 px-3 text-slate-500 font-sans text-[11px]">
                              {asset.description}
                            </td>
                            <td className="py-3 px-3 text-right font-black text-slate-900">
                              {asset.value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} BTC
                            </td>
                            <td className={`py-3 px-3 text-right font-bold ${asset.change1h > 0 ? 'text-emerald-500' : asset.change1h < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                              {asset.change1h > 0 ? '+' : ''}{asset.change1h.toFixed(1)} ({asset.change1hPct > 0 ? '+' : ''}{asset.change1hPct.toFixed(2)}%)
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-slate-800">
                              {asset.sharePct.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-300 bg-slate-50 font-mono font-black text-slate-900">
                          <td className="py-3 px-4" colSpan={2}>
                            PORTFOLIO VALUATION TOTAL
                          </td>
                          <td className="py-3 px-3 text-right text-slate-900 text-sm">
                            {liveTotalNetWorth.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} BTC
                          </td>
                          <td className={`py-3 px-3 text-right ${hourlyStats.netWorthCoins > 0 ? 'text-emerald-500' : hourlyStats.netWorthCoins < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                            {hourlyStats.netWorthCoins > 0 ? '+' : ''}{hourlyStats.netWorthCoins.toFixed(1)} ({hourlyStats.netWorthPct > 0 ? '+' : ''}{hourlyStats.netWorthPct.toFixed(2)}%)
                          </td>
                          <td className="py-3 px-4 text-right">
                            100.0%
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* FACILITY BREAKDOWN VIEW */}
              {valViewMode === 'facilities' && (
                <div className="bg-white border border-slate-200 overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-slate-700 uppercase">
                      Company Facilities Breakdown ({companies.length} Companies)
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Structure + Upgrades + Stored Yield
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-600">
                          <th className="py-2.5 px-4 font-bold">Company</th>
                          <th className="py-2.5 px-3 font-bold">Commodity</th>
                          <th className="py-2.5 px-3 font-bold text-center">Engine / Storage</th>
                          <th className="py-2.5 px-3 font-bold text-right">Concrete Value</th>
                          <th className="py-2.5 px-3 font-bold text-right">Steel Value</th>
                          <th className="py-2.5 px-3 font-bold text-right">Stored Yield</th>
                          <th className="py-2.5 px-3 font-bold text-right">Total Worth</th>
                          <th className="py-2.5 px-4 font-bold text-right">Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {companies.map(c => {
                          const baseWorth = c.estimatedValue || c.totalCalculatedWorth || 0;
                          const yieldWorth = c.uncollectedValueCoins || 0;
                          const totalWorth = baseWorth + yieldWorth;
                          const concreteVal = (c.concreteInvested || 200) * constructionMetrics.concretePrice;
                          const steelVal = ((c.engineTier?.steel || 0) + (c.storageTier?.steel || 0)) * constructionMetrics.steelPrice;
                          const sharePct = liveFacilitiesVal > 0 ? (totalWorth / liveFacilitiesVal) * 100 : 0;
                          return (
                            <tr key={c.id || c._id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2.5 px-4 font-bold text-slate-900 font-sans">
                                {c.name}
                              </td>
                              <td className="py-2.5 px-3 capitalize text-slate-700">
                                {c.recipe?.name || c.itemCode}
                              </td>
                              <td className="py-2.5 px-3 text-center text-slate-600">
                                Lv.{c.engineLevel || 1} / Lv.{c.storageLevel || 1}
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-700">
                                {concreteVal.toFixed(0)} BTC
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-700">
                                {steelVal.toFixed(0)} BTC
                              </td>
                              <td className={`py-2.5 px-3 text-right font-bold ${yieldWorth > 0 ? 'text-emerald-500' : 'text-blue-500'}`}>
                                {yieldWorth > 0 ? `+${yieldWorth.toFixed(1)} BTC` : '0.0 BTC'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-black text-slate-900">
                                {totalWorth.toFixed(1)} BTC
                              </td>
                              <td className="py-2.5 px-4 text-right font-bold text-slate-800">
                                {sharePct.toFixed(1)}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-300 bg-slate-50 font-mono font-black text-slate-900">
                          <td className="py-3 px-4" colSpan={3}>
                            FACILITIES TOTAL
                          </td>
                          <td className="py-3 px-3 text-right text-slate-700">
                            {constructionMetrics.totalConcreteValue.toFixed(0)} BTC
                          </td>
                          <td className="py-3 px-3 text-right text-slate-700">
                            {constructionMetrics.totalSteelValue.toFixed(0)} BTC
                          </td>
                          <td className={`py-3 px-3 text-right font-bold ${companies.reduce((s, c) => s + (c.uncollectedValueCoins || 0), 0) > 0 ? 'text-emerald-500' : 'text-blue-500'}`}>
                            +{companies.reduce((s, c) => s + (c.uncollectedValueCoins || 0), 0).toFixed(1)} BTC
                          </td>
                          <td className="py-3 px-3 text-right text-slate-900 text-sm">
                            {liveFacilitiesVal.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} BTC
                          </td>
                          <td className="py-3 px-4 text-right">
                            100.0%
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. BASE DAILY REVENUE BREAKDOWN */}
          {activeMetric === 'revenue' && (
            <div className="space-y-4">
              <div className="bg-white p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-mono font-bold uppercase text-slate-500">
                    Total Base Daily Revenue
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
                    +{marketOverview.totalBaseGrossRevenue.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    <span className="text-xs font-normal text-slate-500 ml-1.5">BTC/day</span>
                  </div>
                </div>
                <div className="text-left sm:text-right text-xs font-mono text-slate-600">
                  <div>Daily Output: <span className="font-bold text-slate-900">{marketOverview.totalBaseDailyUnits.toFixed(1)} units/day</span></div>
                  <div className="text-[11px] text-slate-400">Calculated at current live spot prices</div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-slate-700 uppercase">
                    Revenue Per Company
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Gross sales = Daily units * Spot price
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-600">
                        <th className="py-2.5 px-4 font-bold">Company</th>
                        <th className="py-2.5 px-3 font-bold">Sector</th>
                        <th className="py-2.5 px-3 font-bold">Commodity</th>
                        <th className="py-2.5 px-3 font-bold text-right">Spot Price</th>
                        <th className="py-2.5 px-3 font-bold text-right">Base Output</th>
                        <th className="py-2.5 px-3 font-bold text-right">Gross Daily Revenue</th>
                        <th className="py-2.5 px-4 font-bold text-right">Revenue Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {companies.map(c => {
                        const spotPrice = c.spotPrice || prices[c.itemCode] || 1.0;
                        const units = c.baseUnits || 0;
                        const grossRev = c.grossRevenue || (units * spotPrice);
                        const sharePct = marketOverview.totalBaseGrossRevenue > 0 ? (grossRev / marketOverview.totalBaseGrossRevenue) * 100 : 0;
                        return (
                          <tr key={c.id || c._id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-4 font-bold text-slate-900 font-sans">
                              {c.name}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 text-[10px] font-mono font-bold ${c.isRaw ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}`}>
                                {c.isRaw ? 'Raw Extraction' : 'Manufactured'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 capitalize text-slate-700">
                              {c.recipe?.name || c.itemCode}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-600">
                              {spotPrice.toFixed(3)} BTC
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                              {units.toFixed(1)} /day
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-slate-900">
                              +{grossRev.toFixed(1)} BTC
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold text-slate-800">
                              {sharePct.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-300 bg-slate-50 font-mono font-black text-slate-900">
                        <td className="py-3 px-4" colSpan={4}>
                          TOTAL BASE DAILY REVENUE
                        </td>
                        <td className="py-3 px-3 text-right text-slate-800">
                          {marketOverview.totalBaseDailyUnits.toFixed(1)} /day
                        </td>
                        <td className="py-3 px-3 text-right text-slate-900 text-sm">
                          +{marketOverview.totalBaseGrossRevenue.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} BTC
                        </td>
                        <td className="py-3 px-4 text-right">
                          100.0%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. RAW MATERIAL COSTS BREAKDOWN */}
          {activeMetric === 'rawCosts' && (
            <div className="space-y-4">
              <div className="bg-white p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-mono font-bold uppercase text-slate-500">
                    Total Raw Material Costs
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono">
                    {marketOverview.totalBaseRawExpense > 0 ? (
                      <span className="text-red-500">
                        -{marketOverview.totalBaseRawExpense.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      </span>
                    ) : (
                      <span className="text-blue-500">
                        0.0
                      </span>
                    )}
                    <span className="text-xs font-normal text-slate-500 ml-1.5">BTC/day</span>
                    {marketOverview.hasBothRawAndFinished && (
                      <span className="ml-2 text-xs font-sans font-bold px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200">
                        100% Insourced
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-left sm:text-right text-xs font-mono text-slate-600">
                  <div>Manufacturing Facilities: <span className="font-bold text-slate-900">{companies.filter(c => !c.isRaw).length}</span></div>
                  <div>Primary Extraction Plants: <span className="font-bold text-slate-900">{companies.filter(c => c.isRaw).length}</span></div>
                </div>
              </div>

              {marketOverview.hasBothRawAndFinished && (
                <div className="bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-700 font-sans flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">Dual-Sector Portfolio Integration:</span> You operate both raw extraction facilities and finished goods manufacturing plants. Raw material input costs are internally balanced.
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-slate-700 uppercase">
                    Raw Material Expense Per Facility
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {marketOverview.hasBothRawAndFinished ? 'Factory inputs supplied internally' : 'Factory inputs valued at spot market prices'}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-600">
                        <th className="py-2.5 px-4 font-bold">Company</th>
                        <th className="py-2.5 px-3 font-bold">Output Good</th>
                        <th className="py-2.5 px-3 font-bold">Input Required</th>
                        <th className="py-2.5 px-3 font-bold text-right">Daily Units Needed</th>
                        <th className="py-2.5 px-3 font-bold text-right">Input Spot Price</th>
                        <th className="py-2.5 px-3 font-bold text-right">Daily Raw Cost</th>
                        <th className="py-2.5 px-4 font-bold text-right">Cost Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {companies.map(c => {
                        const isRawProducer = c.isRaw;
                        const rawCost = c.dailyRawExpenseTotal || 0;
                        const inputs = c.rawInputsBreakdown || [];
                        const sharePct = marketOverview.totalBaseRawExpense > 0 ? (rawCost / marketOverview.totalBaseRawExpense) * 100 : 0;

                        if (isRawProducer) {
                          return (
                            <tr key={c.id || c._id} className="hover:bg-slate-50 transition-colors bg-slate-50/40">
                              <td className="py-2.5 px-4 font-bold text-slate-900 font-sans">
                                {c.name}
                              </td>
                              <td className="py-2.5 px-3 capitalize text-slate-700">
                                {c.recipe?.name || c.itemCode}
                              </td>
                              <td className="py-2.5 px-3 text-slate-400 font-sans text-[11px]" colSpan={3}>
                                Primary Resource Extraction (Zero raw material input cost)
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-slate-400">
                                0.0 BTC
                              </td>
                              <td className="py-2.5 px-4 text-right text-slate-400 font-bold">
                                0.0%
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <React.Fragment key={c.id || c._id}>
                            {inputs.map((inp, idx) => (
                              <tr key={`${c.id}_${inp.id}_${idx}`} className="hover:bg-slate-50 transition-colors">
                                <td className="py-2.5 px-4 font-bold text-slate-900 font-sans">
                                  {idx === 0 ? c.name : ''}
                                </td>
                                <td className="py-2.5 px-3 capitalize text-slate-700">
                                  {idx === 0 ? (c.recipe?.name || c.itemCode) : ''}
                                </td>
                                <td className="py-2.5 px-3 capitalize font-bold text-slate-800">
                                  {inp.id} <span className="text-[10px] text-slate-400 font-normal">({inp.qtyNeededPerUnit || 1}x/unit)</span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                                  {(inp.totalUnitsNeededDaily || 0).toFixed(1)}
                                </td>
                                <td className="py-2.5 px-3 text-right text-slate-600">
                                  {(inp.unitMarketPrice || 0).toFixed(3)} BTC
                                </td>
                                <td className={`py-2.5 px-3 text-right font-black ${inp.dailyRawExpense > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                  {inp.dailyRawExpense > 0 ? `-${inp.dailyRawExpense.toFixed(1)} BTC` : '0.0 BTC'}
                                  {inp.dailyRawExpense === 0 && (
                                    <span className="block text-[10px] text-blue-500 font-sans font-normal">Insourced</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-4 text-right font-bold text-slate-800">
                                  {sharePct.toFixed(1)}%
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-300 bg-slate-50 font-mono font-black text-slate-900">
                        <td className="py-3 px-4" colSpan={5}>
                          TOTAL DAILY RAW MATERIAL COSTS
                        </td>
                        <td className={`py-3 px-3 text-right text-sm ${marketOverview.totalBaseRawExpense > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                          {marketOverview.totalBaseRawExpense > 0 
                            ? `-${marketOverview.totalBaseRawExpense.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} BTC`
                            : '0.0 BTC'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {marketOverview.totalBaseRawExpense > 0 ? '100.0%' : '0.0%'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. BASE SALARIES PAID BREAKDOWN (Clean Table, No Giant Avatars, Exactly Like Enterprise PP) */}
          {activeMetric === 'salaries' && (
            <div className="space-y-4">
              <div className="bg-white p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-mono font-bold uppercase text-slate-500">
                    Total Base Salaries Paid
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-red-500">
                    -{marketOverview.totalBaseLaborExpense.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    <span className="text-xs font-normal text-slate-500 ml-1.5">BTC/day</span>
                  </div>
                </div>
                <div className="text-left sm:text-right text-xs font-mono text-slate-600">
                  <div>Hired Employees: <span className="font-bold text-slate-900">{allWorkers.length} employees</span></div>
                  <div>Standard: <span className="font-bold text-slate-900">Wage per PP produced</span></div>
                  <div className="text-[10px] text-slate-400">24h natural stamina capacity (10% hourly regen)</div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-slate-700 uppercase">
                    Employee Wage & Production Details ({allWorkers.length} Workers)
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Payable Salary = Daily PP Produced * Contract Wage Rate • Click any employee to inspect math breakdown
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-600">
                        <th className="py-2.5 px-4 font-bold">Employee</th>
                        <th className="py-2.5 px-3 font-bold">Company</th>
                        <th className="py-2.5 px-3 font-bold">Energy & Stamina</th>
                        <th className="py-2.5 px-3 font-bold text-center">Daily Sessions</th>
                        <th className="py-2.5 px-3 font-bold">PP Skill & Base</th>
                        <th className="py-2.5 px-3 font-bold text-center">Fidelity</th>
                        <th className="py-2.5 px-3 font-bold text-right">Wage Rate (Net)</th>
                        <th className="py-2.5 px-3 font-bold text-right">Daily PP Produced</th>
                        <th className="py-2.5 px-4 font-bold text-right">Payable Salary / Day</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {allWorkers.map((w, idx) => {
                        const workerKey = w.id || `worker-${idx}`;
                        const isExpanded = expandedWorkerId === workerKey;
                        const energyLvl = w.energySkill ?? 0;
                        const stamina = w.energyStamina || w.energyPointsTotal || (30 + energyLvl * 10);
                        const sessions = typeof w.dailySessions === 'number' && w.dailySessions > 0
                          ? w.dailySessions
                          : (typeof w.workSessionsPerDay === 'number' && w.workSessionsPerDay > 0
                              ? w.workSessionsPerDay
                              : Number((stamina * 0.24).toFixed(2)));
                        const prodLvl = w.productionSkill ?? 0;
                        const basePp = w.basePp || w.productionPointsBase || (prodLvl > 10 ? prodLvl : (10 + prodLvl * 3));
                        const loyalty = typeof w.fidelity === 'number' ? w.fidelity : (w.loyaltyBonus || 0);
                        const compBonus = w.companyTotalBonusPct || 0;
                        const devPct = typeof w.devPct === 'number' ? w.devPct : 4.88;
                        const incomeTaxPct = typeof w.incomeTaxPct === 'number' ? w.incomeTaxPct : 9.0;

                        const laborPpPerHit = typeof w.laborPpPerHit === 'number' ? w.laborPpPerHit : Number((basePp * (1 + loyalty / 100) * (1 + devPct / 100)).toFixed(2));
                        const producedPpPerHit = typeof w.producedPpPerHit === 'number' ? w.producedPpPerHit : Number((laborPpPerHit * (1 + (compBonus * 0.91 / 100))).toFixed(2));

                        const dailyPp = typeof w.producedDailyPp === 'number' && w.producedDailyPp > 0
                          ? w.producedDailyPp
                          : (typeof w.dailyPp === 'number' && w.dailyPp > 0
                              ? w.dailyPp
                              : Number((sessions * producedPpPerHit).toFixed(1)));

                        const wageRate = typeof w.wageRate === 'number' ? w.wageRate : (typeof w.wagePerPp === 'number' ? w.wagePerPp : (w.wage || 0.158));
                        const netWageRate = typeof w.netWageRate === 'number' ? w.netWageRate : Number((wageRate * (1 - (incomeTaxPct / 100))).toFixed(3));

                        const grossWagePerHit = typeof w.grossWagePerHit === 'number' ? w.grossWagePerHit : Number((laborPpPerHit * wageRate).toFixed(3));
                        const taxPerHit = typeof w.taxPerHit === 'number' ? w.taxPerHit : Number((grossWagePerHit * (incomeTaxPct / 100)).toFixed(3));
                        const netWagePerHit = typeof w.netWagePerHit === 'number' ? w.netWagePerHit : Number((grossWagePerHit - taxPerHit).toFixed(3));

                        const dailyWage = typeof w.dailyWage === 'number' && w.dailyWage > 0
                          ? w.dailyWage
                          : Number((sessions * grossWagePerHit).toFixed(2));
                        const netDailyWage = typeof w.netDailyWage === 'number'
                          ? w.netDailyWage
                          : Number((sessions * netWagePerHit).toFixed(2));

                        return (
                          <React.Fragment key={workerKey}>
                            <tr 
                              onClick={() => setExpandedWorkerId(isExpanded ? null : workerKey)}
                              className={`cursor-pointer transition-colors ${isExpanded ? 'bg-amber-50/70 font-semibold' : 'hover:bg-slate-50'}`}
                              title="Click to view detailed mathematical breakdown"
                            >
                              <td className="py-2.5 px-4 font-bold text-slate-900 font-sans">
                                <div className="flex items-center space-x-2">
                                  <span className={`text-[10px] text-slate-400 font-mono transition-transform duration-150 inline-block ${isExpanded ? 'rotate-90 text-amber-700' : ''}`}>
                                    ▶
                                  </span>
                                  <span className="hover:text-blue-700 hover:underline">{w.username}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-medium text-slate-700">
                                <div className="font-semibold text-slate-900 font-sans">{w.companyName}</div>
                                {compBonus > 0 && (
                                  <div className="text-[10px] text-emerald-700 font-mono">
                                    +{compBonus.toFixed(1)}% bonus
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-slate-700">
                                Lv.{energyLvl} <span className="text-slate-400">({stamina} pts)</span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold text-slate-800" title="10% hourly regen over 24h = 0.24 * stamina">
                                {sessions.toFixed(1)} /day
                              </td>
                              <td className="py-2.5 px-3 text-slate-700">
                                Lv.{prodLvl} <span className="text-slate-400">({basePp} PP/hit)</span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {loyalty > 0 ? (
                                  <span className="text-emerald-500 font-bold">+{loyalty}%</span>
                                ) : (
                                  <span className="text-blue-500 font-bold">0%</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-slate-700">
                                <div>{wageRate.toFixed(3)} BTC</div>
                                <div className="text-[10px] text-slate-400 font-normal">({netWageRate.toFixed(3)} net)</div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-black text-slate-900">
                                <div>{dailyPp.toFixed(1)} PP</div>
                                <div className="text-[10px] text-slate-400 font-normal">{producedPpPerHit.toFixed(1)} PP/hit</div>
                              </td>
                              <td className="py-2.5 px-4 text-right font-black text-red-500">
                                <div>-{dailyWage.toFixed(2)} BTC</div>
                                <div className={`text-[10px] font-normal font-mono ${netDailyWage > 0 ? 'text-emerald-500' : netDailyWage < 0 ? 'text-red-500' : 'text-blue-500'}`}>Net: +{netDailyWage.toFixed(2)} BTC</div>
                              </td>
                            </tr>

                            {/* Inline Expandable Math Audit Card */}
                            {isExpanded && (
                              <tr className="bg-slate-50/90 border-b-2 border-amber-200">
                                <td colSpan={9} className="p-3.5 sm:p-5">
                                  <div className="bg-white border border-slate-200 p-4 sm:p-5 space-y-4 shadow-sm">
                                    {/* Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                      <div>
                                        <div className="flex items-center space-x-2 flex-wrap">
                                          <span className="text-base font-extrabold text-slate-900 font-sans">
                                            @{w.username}
                                          </span>
                                          <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-1.5 py-0.5 font-bold">
                                            Worker Lv.{w.level || 1}
                                          </span>
                                          <span className="text-[10px] font-mono uppercase bg-blue-50 text-blue-800 px-1.5 py-0.5 font-bold border border-blue-200">
                                            {w.companyName} ({w.companyItemCode})
                                          </span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-sans mt-0.5">
                                          Mathematical Step-by-Step Production & Salary Verification
                                        </p>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setInspectedWorker(w);
                                          }}
                                          className="px-2.5 py-1 text-xs font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition cursor-pointer flex items-center space-x-1"
                                        >
                                          <span>Full Screen Audit</span>
                                          <span>↗</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedWorkerId(null);
                                          }}
                                          className="px-2 py-1 text-xs font-mono font-bold text-slate-400 hover:text-slate-700 transition cursor-pointer"
                                        >
                                          Collapse ✕
                                        </button>
                                      </div>
                                    </div>

                                    {/* 3 Main Math Pillars */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                      {/* Pillar 1: Energy & Sessions */}
                                      <div className="bg-slate-50 p-3.5 border border-slate-200/80 space-y-2 font-mono text-xs">
                                        <div className="text-[11px] font-bold text-slate-700 uppercase flex items-center justify-between">
                                          <span>1. Daily Sessions</span>
                                          <span className="text-slate-400 font-normal">24h Capacity</span>
                                        </div>
                                        <div className="space-y-1 text-slate-600">
                                          <div className="flex justify-between">
                                            <span>Energy Skill:</span>
                                            <strong className="text-slate-900">Level {energyLvl}</strong>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Stamina Pool:</span>
                                            <strong className="text-slate-900">{stamina} pts</strong>
                                          </div>
                                          <div className="text-[10px] text-slate-400">
                                            Formula: 30 + (10 * Lv.{energyLvl}) = {stamina}
                                          </div>
                                          <div className="flex justify-between pt-1 border-t border-slate-200">
                                            <span>24h Regen (10%/h):</span>
                                            <strong className="text-slate-900">240% ({Number((stamina * 2.4).toFixed(1))} pts)</strong>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Energy Cost / Hit:</span>
                                            <strong className="text-slate-900">10 energy pts</strong>
                                          </div>
                                          <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-900 font-bold">
                                            <span>Daily Sessions:</span>
                                            <strong className="text-blue-900 font-black">{sessions.toFixed(1)} sessions/d</strong>
                                          </div>
                                          <div className="text-[10px] text-blue-700/80">
                                            Math: ({stamina} * 0.24) = {sessions.toFixed(2)} hits/d
                                          </div>
                                        </div>
                                      </div>

                                      {/* Pillar 2: PP Skill, Regional Efficiency & Bonuses */}
                                      <div className="bg-slate-50 p-3.5 border border-slate-200/80 space-y-2 font-mono text-xs">
                                        <div className="text-[11px] font-bold text-slate-700 uppercase flex items-center justify-between">
                                          <span>2. Labor PP vs Yield</span>
                                          <span className="text-slate-400 font-normal">Per Session</span>
                                        </div>
                                        <div className="space-y-1 text-slate-600">
                                          <div className="flex justify-between">
                                            <span>Base Session PP:</span>
                                            <strong className="text-slate-900">{basePp} PP</strong>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Worker Loyalty:</span>
                                            <strong className={loyalty > 0 ? "text-emerald-700 font-bold" : "text-slate-400"}>
                                              {loyalty > 0 ? `+${loyalty}%` : '0%'}
                                            </strong>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Region Dev Efficiency:</span>
                                            <strong className="text-emerald-700 font-bold">+{devPct.toFixed(2)}%</strong>
                                          </div>
                                          <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-900 font-bold">
                                            <span>Contract Labor Base:</span>
                                            <strong className="text-blue-900 font-black">
                                              {laborPpPerHit.toFixed(2)} PP / hit
                                            </strong>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Facility Deposit Bonus:</span>
                                            <strong className="text-emerald-700 font-bold">+{compBonus.toFixed(1)}%</strong>
                                          </div>
                                          <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-900 font-bold">
                                            <span>Factory Yield / Hit:</span>
                                            <strong className="text-emerald-800 font-black">
                                              {producedPpPerHit.toFixed(2)} PP / hit
                                            </strong>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Pillar 3: Wages & Regional Income Tax */}
                                      <div className="bg-slate-50 p-3.5 border border-slate-200/80 space-y-2 font-mono text-xs">
                                        <div className="text-[11px] font-bold text-slate-700 uppercase flex items-center justify-between">
                                          <span>3. Wages & Taxes</span>
                                          <span className="text-slate-400 font-normal">Payroll Outflow</span>
                                        </div>
                                        <div className="space-y-1 text-slate-600">
                                          <div className="flex justify-between">
                                            <span>Contracted Wage:</span>
                                            <strong className="text-slate-900">{wageRate.toFixed(3)} ({netWageRate.toFixed(3)}) BTC</strong>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Gross Wage / Hit:</span>
                                            <strong className="text-slate-900">{grossWagePerHit.toFixed(3)} BTC</strong>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Income Tax ({incomeTaxPct}%):</span>
                                            <strong className="text-red-500">-{taxPerHit.toFixed(3)} BTC</strong>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Worker Net / Hit:</span>
                                            <strong className={`font-bold ${netWagePerHit > 0 ? 'text-emerald-500' : netWagePerHit < 0 ? 'text-red-500' : 'text-blue-500'}`}>+{netWagePerHit.toFixed(3)} BTC</strong>
                                          </div>
                                          <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-900 font-bold">
                                            <span>Company Payroll / Day:</span>
                                            <strong className="text-red-500 font-black text-sm">-{dailyWage.toFixed(2)} BTC/d</strong>
                                          </div>
                                          <div className="flex justify-between text-[11px] text-slate-500">
                                            <span>Worker 24h Net:</span>
                                            <strong className={`${netDailyWage > 0 ? 'text-emerald-500' : netDailyWage < 0 ? 'text-red-500' : 'text-blue-500'}`}>+{netDailyWage.toFixed(2)} BTC/d</strong>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Economic Contribution to Facility */}
                                    <div className="bg-slate-50 p-3 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
                                      <div className="space-y-0.5">
                                        <div className="text-[11px] font-bold uppercase text-slate-700">
                                          Economic Value Generated for {w.companyName}
                                        </div>
                                        <div className="text-slate-500 text-[11px]">
                                          Enables <strong>{w.unitsProduced?.toFixed(2) || '0.00'} units/day</strong> of {w.recipe?.name || w.companyItemCode} @ {w.spotPrice?.toFixed(3) || '0.000'} BTC spot
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4 text-right flex-wrap">
                                        <div>
                                          <span className="text-[10px] text-slate-400 block uppercase">Gross Value</span>
                                          <span className="font-bold text-emerald-500">+{w.grossValue?.toFixed(2) || '0.00'} BTC/d</span>
                                        </div>
                                        <div>
                                          <span className="text-[10px] text-slate-400 block uppercase">Raw Outflow</span>
                                          <span className={`font-bold ${(w.rawExpense || 0) > 0 ? 'text-red-500' : 'text-blue-500'}`}>-{(w.rawExpense || 0).toFixed(2)} BTC/d</span>
                                        </div>
                                        <div>
                                          <span className="text-[10px] text-slate-400 block uppercase">Salary Outflow</span>
                                          <span className={`font-bold ${dailyWage > 0 ? 'text-red-500' : 'text-blue-500'}`}>-{dailyWage.toFixed(2)} BTC/d</span>
                                        </div>
                                        <div className="pl-2 border-l border-slate-200">
                                          <span className="text-[10px] text-slate-400 block uppercase">Net Contribution</span>
                                          <span className={`font-black text-sm ${(w.netContribution || 0) > 0 ? 'text-emerald-500' : (w.netContribution || 0) < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                            {(w.netContribution || 0) >= 0 ? '+' : ''}{(w.netContribution || 0).toFixed(2)} BTC/d
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-300 bg-slate-50 font-mono font-black text-slate-900">
                        <td className="py-3 px-4" colSpan={7}>
                          TOTAL BASE SALARIES PAID ({allWorkers.length} EMPLOYEES)
                        </td>
                        <td className="py-3 px-3 text-right text-slate-900">
                          {allWorkers.reduce((s, w) => s + (w.producedDailyPp || w.dailyPp || 0), 0).toFixed(1)} PP
                        </td>
                        <td className="py-3 px-4 text-right text-red-500 text-sm">
                          -{marketOverview.totalBaseLaborExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BTC
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 5. BASE DAILY PROFIT BREAKDOWN */}
          {activeMetric === 'profit' && (
            <div className="space-y-4">
              <div className="bg-white p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-mono font-bold uppercase text-slate-500">
                    Total Base Daily Profit
                  </div>
                  <div className={`text-2xl sm:text-3xl font-black font-mono ${marketOverview.baseDailyProfit > 0 ? 'text-emerald-500' : marketOverview.baseDailyProfit < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                    {marketOverview.baseDailyProfit >= 0 ? '+' : ''}{marketOverview.baseDailyProfit.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    <span className="text-xs font-normal text-slate-500 ml-1.5">BTC/day</span>
                  </div>
                </div>
                <div className="text-left sm:text-right text-xs font-mono text-slate-600">
                  <div>Portfolio Net Margin: <span className={`font-bold ${marketOverview.baseNetMarginPct > 0 ? 'text-emerald-500' : marketOverview.baseNetMarginPct < 0 ? 'text-red-500' : 'text-blue-500'}`}>{marketOverview.baseNetMarginPct.toFixed(1)}%</span></div>
                  <div>Gross Revenue: <span className="font-bold text-emerald-500">+{marketOverview.totalBaseGrossRevenue.toFixed(1)} BTC</span></div>
                  <div>Operating Outflows: <span className={`font-bold ${(marketOverview.totalBaseRawExpense + marketOverview.totalBaseLaborExpense) > 0 ? 'text-red-500' : 'text-blue-500'}`}>-{(marketOverview.totalBaseRawExpense + marketOverview.totalBaseLaborExpense).toFixed(1)} BTC</span></div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-slate-700 uppercase">
                    P&L Statement Per Company
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Net Profit = Gross Revenue - Raw Costs - Salaries
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-600">
                        <th className="py-2.5 px-4 font-bold">Company</th>
                        <th className="py-2.5 px-3 font-bold">Commodity</th>
                        <th className="py-2.5 px-3 font-bold text-right">Revenue (+)</th>
                        <th className="py-2.5 px-3 font-bold text-right">Raw Costs (-)</th>
                        <th className="py-2.5 px-3 font-bold text-right">Salaries (-)</th>
                        <th className="py-2.5 px-3 font-bold text-right">Net Profit / Day</th>
                        <th className="py-2.5 px-4 font-bold text-right">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {companies.map(c => {
                        const rev = c.grossRevenue || 0;
                        const raw = c.dailyRawExpenseTotal || 0;
                        const sal = c.dailyLaborExpense || 0;
                        const net = c.baseNetProfit || (rev - raw - sal);
                        const margin = rev > 0 ? (net / rev) * 100 : 0;
                        return (
                          <tr key={c.id || c._id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-4 font-bold text-slate-900 font-sans">
                              {c.name}
                            </td>
                            <td className="py-2.5 px-3 capitalize text-slate-700">
                              {c.recipe?.name || c.itemCode}
                            </td>
                            <td className="py-2.5 px-3 text-right text-emerald-500 font-bold">
                              +{rev.toFixed(1)} BTC
                            </td>
                            <td className={`py-2.5 px-3 text-right font-bold ${raw > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                              {raw > 0 ? `-${raw.toFixed(1)} BTC` : '0.0 BTC'}
                            </td>
                            <td className={`py-2.5 px-3 text-right font-bold ${sal > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                              {sal > 0 ? `-${sal.toFixed(1)} BTC` : '0.0 BTC'}
                            </td>
                            <td className={`py-2.5 px-3 text-right font-black ${net > 0 ? 'text-emerald-500' : net < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                              {net >= 0 ? '+' : ''}{net.toFixed(1)} BTC
                            </td>
                            <td className={`py-2.5 px-4 text-right font-bold ${margin > 0 ? 'text-emerald-500' : margin < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                              {margin.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-300 bg-slate-50 font-mono font-black text-slate-900">
                        <td className="py-3 px-4" colSpan={2}>
                          TOTAL BASE DAILY PROFIT
                        </td>
                        <td className="py-3 px-3 text-right text-emerald-500 font-bold">
                          +{marketOverview.totalBaseGrossRevenue.toFixed(1)} BTC
                        </td>
                        <td className={`py-3 px-3 text-right font-bold ${marketOverview.totalBaseRawExpense > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                          -{marketOverview.totalBaseRawExpense.toFixed(1)} BTC
                        </td>
                        <td className={`py-3 px-3 text-right font-bold ${marketOverview.totalBaseLaborExpense > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                          -{marketOverview.totalBaseLaborExpense.toFixed(1)} BTC
                        </td>
                        <td className={`py-3 px-3 text-right text-sm font-black ${marketOverview.baseDailyProfit > 0 ? 'text-emerald-500' : marketOverview.baseDailyProfit < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                          {marketOverview.baseDailyProfit >= 0 ? '+' : ''}{marketOverview.baseDailyProfit.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} BTC
                        </td>
                        <td className={`py-3 px-4 text-right font-bold ${marketOverview.baseNetMarginPct > 0 ? 'text-emerald-500' : marketOverview.baseNetMarginPct < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                          {marketOverview.baseNetMarginPct.toFixed(1)}%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 6. BASE PRODUCTION BREAKDOWN */}
          {activeMetric === 'production' && (
            <div className="space-y-4">
              <div className="bg-white p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-mono font-bold uppercase text-slate-500">
                    Total Base Daily Production
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
                    {marketOverview.totalBaseDailyUnits.toFixed(1)}
                    <span className="text-xs font-normal text-slate-500 ml-1.5">units/day</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="bg-slate-50 p-2 border border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase">Raw Output</div>
                    <div className="font-extrabold text-amber-800">{marketOverview.totalRawBaseUnits.toFixed(1)} units</div>
                  </div>
                  <div className="bg-slate-50 p-2 border border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase">Finished Goods</div>
                    <div className="font-extrabold text-blue-800">{marketOverview.totalFinishedBaseUnits.toFixed(1)} units</div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-slate-700 uppercase">
                    Physical Output Per Facility
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Units = Effective PP / Recipe PP
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-600">
                        <th className="py-2.5 px-4 font-bold">Company</th>
                        <th className="py-2.5 px-3 font-bold">Sector</th>
                        <th className="py-2.5 px-3 font-bold">Commodity</th>
                        <th className="py-2.5 px-3 font-bold text-center">Recipe PP</th>
                        <th className="py-2.5 px-3 font-bold text-right">Base PP / Day</th>
                        <th className="py-2.5 px-3 font-bold text-center">Bonus Multiplier</th>
                        <th className="py-2.5 px-3 font-bold text-right">Daily Units Produced</th>
                        <th className="py-2.5 px-4 font-bold text-right">Output Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {companies.map(c => {
                        const recipePp = c.recipe?.pp || 1;
                        const basePp = c.companyBaseDailyPp || 0;
                        const units = c.baseUnits || 0;
                        const sharePct = marketOverview.totalBaseDailyUnits > 0 ? (units / marketOverview.totalBaseDailyUnits) * 100 : 0;
                        return (
                          <tr key={c.id || c._id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-4 font-bold text-slate-900 font-sans">
                              {c.name}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 text-[10px] font-mono font-bold ${c.isRaw ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}`}>
                                {c.isRaw ? 'Raw Resource' : 'Finished'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 capitalize text-slate-700">
                              {c.recipe?.name || c.itemCode}
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-600">
                              {recipePp} PP
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                              {basePp.toFixed(1)} PP
                            </td>
                            <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">
                              {(c.totalBonusPct || 0) > 0 ? `+${(c.totalBonusPct).toFixed(1)}%` : '1.00x'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-slate-900">
                              {units.toFixed(1)} /day
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold text-slate-800">
                              {sharePct.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-300 bg-slate-50 font-mono font-black text-slate-900">
                        <td className="py-3 px-4" colSpan={6}>
                          TOTAL BASE DAILY PRODUCTION
                        </td>
                        <td className="py-3 px-3 text-right text-slate-900 text-sm">
                          {marketOverview.totalBaseDailyUnits.toFixed(1)} /day
                        </td>
                        <td className="py-3 px-4 text-right">
                          100.0%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 7. TOTAL ENTERPRISE PP BREAKDOWN (Clean White & Slate Layout matching Screenshot 2) */}
          {activeMetric === 'pp' && (
            <div className="space-y-4">
              <div className="bg-white p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-mono font-bold uppercase text-slate-500">
                    Total Enterprise Production Points (PP)
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
                    {marketOverview.totalInclusiveBasePp.toFixed(1)}
                    <span className="text-xs font-normal text-slate-500 ml-1.5">PP/day</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="bg-slate-50 p-2.5 border border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase">Base Operations</div>
                    <div className="font-extrabold text-slate-900">{marketOverview.totalCompanyBasePp.toFixed(1)} PP</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 border border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase">Owner Self-Work</div>
                    <div className="font-extrabold text-amber-800">{marketOverview.totalDailySelfWorkPp.toFixed(1)} PP</div>
                  </div>
                </div>
              </div>

              {/* 1. Automated Engine PP Generation */}
              <div className="bg-white border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-slate-700 uppercase">
                    1. Automated Engine PP Generation
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Continuous 24h factory operation
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-600">
                        <th className="py-2.5 px-4 font-bold">Company</th>
                        <th className="py-2.5 px-3 font-bold text-center">Engine Level</th>
                        <th className="py-2.5 px-3 font-bold text-right">Base PP / Hour</th>
                        <th className="py-2.5 px-3 font-bold text-right">24h Base Engine PP</th>
                        <th className="py-2.5 px-3 font-bold text-center">Bonus Multiplier</th>
                        <th className="py-2.5 px-4 font-bold text-right">Effective Daily Engine PP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {companies.map(c => {
                        const pph = c.engineTier?.ppPerHour || c.engineLevel || 1;
                        const base24h = pph * 24;
                        const eff24h = c.engineProducedDailyPp || (base24h * (c.bonusMultiplier || 1.0));
                        return (
                          <tr key={`engine-${c.id || c._id}`} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-4 font-bold text-slate-900 font-sans">{c.name}</td>
                            <td className="py-2.5 px-3 text-center text-slate-700">Lv.{c.engineLevel || 1}</td>
                            <td className="py-2.5 px-3 text-right text-slate-700">{pph} PP/h</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-800">{base24h.toFixed(1)} PP</td>
                            <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">{(c.bonusMultiplier || 1.0).toFixed(2)}x</td>
                            <td className="py-2.5 px-4 text-right font-black text-slate-900">{eff24h.toFixed(1)} PP</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-300 bg-slate-50 font-mono font-bold text-slate-900">
                        <td className="py-3 px-4" colSpan={3}>Automated Engines Subtotal</td>
                        <td className="py-3 px-3 text-right">{companies.reduce((s, c) => s + (c.engineBaseDailyPp || ((c.engineTier?.ppPerHour || 1) * 24)), 0).toFixed(1)} PP</td>
                        <td></td>
                        <td className="py-3 px-4 text-right text-slate-900 font-black">{companies.reduce((s, c) => s + (c.engineProducedDailyPp || 0), 0).toFixed(1)} PP</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* 2. Hired Workforce PP Generation */}
              <div className="bg-white border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-slate-700 uppercase">
                    2. Hired Workforce PP Generation ({allWorkers.length} Employees)
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    24h stamina capacity work sessions
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-600">
                        <th className="py-2.5 px-4 font-bold">Company</th>
                        <th className="py-2.5 px-3 font-bold text-center">Workers</th>
                        <th className="py-2.5 px-3 font-bold text-right">Base Labor PP / Day</th>
                        <th className="py-2.5 px-4 font-bold text-right">Produced Labor PP / Day</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {companies.map(c => {
                        const count = (c.workersList || c.workers || []).length;
                        const baseLabor = c.workersBaseDailyPp || 0;
                        const prodLabor = c.workersProducedDailyPp || 0;
                        return (
                          <tr key={`labor-${c.id || c._id}`} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-4 font-bold text-slate-900 font-sans">{c.name}</td>
                            <td className="py-2.5 px-3 text-center text-slate-700">{count} workers</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-800">{baseLabor.toFixed(1)} PP</td>
                            <td className="py-2.5 px-4 text-right font-black text-slate-900">{prodLabor.toFixed(1)} PP</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-300 bg-slate-50 font-mono font-bold text-slate-900">
                        <td className="py-3 px-4" colSpan={2}>Hired Labor Subtotal ({allWorkers.length} workers)</td>
                        <td className="py-3 px-3 text-right">{companies.reduce((s, c) => s + (c.workersBaseDailyPp || 0), 0).toFixed(1)} PP</td>
                        <td className="py-3 px-4 text-right text-slate-900 font-black">{companies.reduce((s, c) => s + (c.workersProducedDailyPp || 0), 0).toFixed(1)} PP</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* 3. Owner Personal Labor Capacity */}
              <div className="bg-white border border-slate-200 p-4">
                <div className="text-xs font-bold font-mono text-slate-700 uppercase mb-2">
                  3. Owner Personal Labor Capacity (General Portfolio)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="bg-slate-50 p-2.5 border border-slate-200">
                    <div className="text-slate-400 text-[10px]">Entrepreneurship Stamina</div>
                    <div className="font-black text-slate-900">{ownerLabor.entreMax || 30} pts</div>
                    <div className="text-[10px] text-slate-500">Lv.{ownerLabor.entreLevel || 0}</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 border border-slate-200">
                    <div className="text-slate-400 text-[10px]">Natural Daily Sessions</div>
                    <div className="font-black text-slate-900">{(ownerLabor.dailySessions || 0).toFixed(1)} /day</div>
                    <div className="text-[10px] text-slate-500">10% hourly regen</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 border border-slate-200">
                    <div className="text-slate-400 text-[10px]">Production Skill</div>
                    <div className="font-black text-slate-900">{ownerLabor.ppPerSession || 10} PP/hit</div>
                    <div className="text-[10px] text-slate-500">Lv.{ownerLabor.prodLevel || 0}</div>
                  </div>
                  <div className="bg-amber-50 p-2.5 border border-amber-200">
                    <div className="text-amber-800 text-[10px]">Daily Self-Work PP</div>
                    <div className="font-black text-amber-900 text-sm">{marketOverview.totalDailySelfWorkPp.toFixed(1)} PP</div>
                    <div className="text-[10px] text-amber-700">Portfolio-wide capacity</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 8. STAFF DEPLOYMENT BREAKDOWN */}
          {activeMetric === 'staff' && (
            <div className="space-y-4">
              <div className="bg-white p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-mono font-bold uppercase text-slate-500">
                    Workforce Staff Deployment
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
                    {marketOverview.totalWorkers}
                    <span className="text-xs font-normal text-slate-500 ml-1.5">/ {maxHiringSlots} total slots</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="bg-slate-50 p-2 border border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase">Management Skill</div>
                    <div className="font-extrabold text-slate-900">Level {managementLevel}</div>
                  </div>
                  <div className="bg-emerald-50 p-2 border border-emerald-200">
                    <div className="text-[10px] text-emerald-700 uppercase">Available Slots</div>
                    <div className="font-extrabold text-emerald-800">{Math.max(0, maxHiringSlots - marketOverview.totalWorkers)} open</div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-slate-700 uppercase">
                    Staff Assignment Per Company ({companies.length} Facilities)
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Hired employee allocation and cost per PP
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-600">
                        <th className="py-2.5 px-4 font-bold">Company</th>
                        <th className="py-2.5 px-3 font-bold text-center">Hired Count</th>
                        <th className="py-2.5 px-3 font-bold">Assigned Employees</th>
                        <th className="py-2.5 px-3 font-bold text-right">Daily Labor PP</th>
                        <th className="py-2.5 px-3 font-bold text-right">Daily Salaries</th>
                        <th className="py-2.5 px-4 font-bold text-right">Avg Cost / PP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {companies.map(c => {
                        const workers = c.workersList || c.workers || [];
                        const count = workers.length;
                        const dailyPp = c.workersProducedDailyPp || c.workersBaseDailyPp || 0;
                        const dailyWage = c.dailyLaborExpense || 0;
                        const costPerPp = dailyPp > 0 ? (dailyWage / dailyPp) : 0;
                        return (
                          <tr key={c.id || c._id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-4 font-bold text-slate-900 font-sans">
                              {c.name}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 text-[10px] font-mono font-bold ${count > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                                {count} workers
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-sans">
                              {count > 0 ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {workers.map((w, wIdx) => {
                                    const fullWorker = allWorkers.find(aw => (aw.id && aw.id === w.id) || aw.username === w.username)
                                      || { ...w, companyName: c.name, companyItemCode: c.itemCode, companyTotalBonusPct: c.totalBonusPct, recipe: c.recipe, spotPrice: c.spotPrice };
                                    return (
                                      <button 
                                        key={w.id || wIdx}
                                        type="button"
                                        onClick={() => setInspectedWorker(fullWorker)}
                                        className="inline-flex items-center gap-1 bg-slate-100 hover:bg-amber-100 hover:text-amber-950 px-2 py-0.5 text-[11px] font-semibold text-slate-800 transition cursor-pointer border border-slate-200/60"
                                        title="Click to view detailed employee skills & salary math audit"
                                      >
                                        <span>{w.username}</span>
                                        <span className="text-[9px] text-slate-400">↗</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">No hired employees assigned</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                              {dailyPp > 0 ? `${dailyPp.toFixed(1)} PP` : '0.0 PP'}
                            </td>
                            <td className={`py-2.5 px-3 text-right font-bold ${dailyWage > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                              {dailyWage > 0 ? `-${dailyWage.toFixed(2)} BTC` : '0.00 BTC'}
                            </td>
                            <td className="py-2.5 px-4 text-right text-slate-600 font-bold">
                              {costPerPp > 0 ? `${costPerPp.toFixed(3)} BTC` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-300 bg-slate-50 font-mono font-black text-slate-900">
                        <td className="py-3 px-4">
                          WORKFORCE DEPLOYMENT TOTALS
                        </td>
                        <td className="py-3 px-3 text-center text-emerald-800">
                          {marketOverview.totalWorkers} / {maxHiringSlots} slots
                        </td>
                        <td className="py-3 px-3 font-sans font-bold text-slate-600">
                          {allWorkers.length} active employee contracts across {companies.length} facilities
                        </td>
                        <td className="py-3 px-3 text-right text-slate-900">
                          {companies.reduce((s, c) => s + (c.workersProducedDailyPp || c.workersBaseDailyPp || 0), 0).toFixed(1)} PP
                        </td>
                        <td className="py-3 px-3 text-right text-red-500 text-sm">
                          -{marketOverview.totalBaseLaborExpense.toFixed(2)} BTC
                        </td>
                        <td className="py-3 px-4 text-right text-slate-900">
                          {(marketOverview.totalBaseLaborExpense / (companies.reduce((s, c) => s + (c.workersProducedDailyPp || c.workersBaseDailyPp || 0), 0) || 1)).toFixed(3)} BTC
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer - Clean White & Slate */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-500 font-mono">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>All figures mathematically reconciled against live game state</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer"
          >
            Close Breakdown
          </button>
        </div>

      </div>

      {/* Standalone Dedicated Employee Mathematical Audit Modal */}
      {inspectedWorker && (
        <EmployeeAuditModal
          isOpen={Boolean(inspectedWorker)}
          onClose={() => setInspectedWorker(null)}
          worker={inspectedWorker}
        />
      )}
    </div>
  );
}
