import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  ChevronDown, 
  ChevronRight, 
  Calculator,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  ArrowRight,
  Factory,
  Layers,
  ShieldAlert,
  Bot
} from 'lucide-react';
import EmployeeAuditModal from './EmployeeAuditModal';
import { getCompanyTheme } from '../data/companyThemes';
import { RECIPES } from '../data/gameData';
import { isCompanyDisabled } from '../data/marketMath';

const RAW_MATERIAL_NAMES = {
  grain: 'Grain',
  limestone: 'Limestone',
  iron: 'Iron',
  lead: 'Lead',
  petroleum: 'Petroleum',
  coca: 'Coca Plant',
  mysteriousPlant: 'Mysterious Plant',
  livestock: 'Livestock',
  fish: 'Fish',
  wood: 'Wood',
  scraps: 'Scraps'
};

function getCompanyRawInputs(c) {
  if (c.recipe?.inputs && c.recipe.inputs.length > 0) {
    return c.recipe.inputs;
  }
  const itemCode = c.itemCode || c.recipe?.id;
  const found = RECIPES.find(r => r.id === itemCode);
  if (found?.inputs && found.inputs.length > 0) {
    return found.inputs;
  }
  const fallbackInputs = {
    bread: [{ id: 'grain', qty: 10 }],
    steak: [{ id: 'livestock', qty: 1 }],
    cookedFish: [{ id: 'fish', qty: 1 }],
    concrete: [{ id: 'limestone', qty: 10 }],
    steel: [{ id: 'iron', qty: 10 }],
    oil: [{ id: 'petroleum', qty: 1 }],
    lightAmmo: [{ id: 'lead', qty: 1 }],
    smallAmmo: [{ id: 'lead', qty: 1 }],
    ammo: [{ id: 'lead', qty: 4 }],
    mediumAmmo: [{ id: 'lead', qty: 4 }],
    heavyAmmo: [{ id: 'lead', qty: 16 }],
    pill: [{ id: 'coca', qty: 200 }],
    cocain: [{ id: 'coca', qty: 200 }],
    paper: [{ id: 'wood', qty: 1 }]
  };
  return fallbackInputs[itemCode] || [];
}

function getRawMaterialPrice(rawId, prices = {}) {
  if (typeof prices[rawId] === 'number' && prices[rawId] > 0) return prices[rawId];
  if (rawId === 'coca' && typeof prices.mysteriousPlant === 'number' && prices.mysteriousPlant > 0) return prices.mysteriousPlant;
  if (rawId === 'mysteriousPlant' && typeof prices.coca === 'number' && prices.coca > 0) return prices.coca;
  const fallbacks = {
    iron: 0.088,
    limestone: 0.089,
    grain: 0.055,
    livestock: 2.10,
    fish: 3.73,
    lead: 0.11,
    petroleum: 0.089,
    wood: 0.10,
    scraps: 0.05,
    coca: 0.081,
    mysteriousPlant: 0.081
  };
  return fallbacks[rawId] || 0.10;
}

const METRIC_TABS = [
  { id: 'valuation', label: 'Portfolio Valuation' },
  { id: 'revenue', label: 'Base Revenue' },
  { id: 'rawCosts', label: 'Raw Costs' },
  { id: 'rawSupply', label: 'Raw Material Supply' },
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
  // Interactive Employee Math Audit expansion & modal state
  const [expandedWorkerId, setExpandedWorkerId] = useState(null);
  const [inspectedWorker, setInspectedWorker] = useState(null);
  const [expandedProfitCompanyId, setExpandedProfitCompanyId] = useState(null);

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
      const workers = comp.workersList || comp.workers || comp.employees || [];
      const disabled = isCompanyDisabled(comp);
      workers.forEach((w, wIdx) => {
        const hourlyOutputPp = typeof w.hourlyOutputPp === 'number'
          ? w.hourlyOutputPp
          : (typeof w.estimate?.production === 'number' ? w.estimate.production : (w.dailyOutputPp ? w.dailyOutputPp / 24 : 0));

        const hourlyWage = typeof w.hourlyWage === 'number'
          ? w.hourlyWage
          : (typeof w.wage === 'number'
              ? w.wage
              : (typeof w.salary === 'number'
                  ? w.salary
                  : (typeof w.estimate?.wage === 'number' ? w.estimate.wage : 0)));

        const dailyProducedPp = typeof w.dailyOutputPp === 'number'
          ? w.dailyOutputPp
          : Number((hourlyOutputPp * 24).toFixed(2));

        const dailyWage = typeof w.dailyWage === 'number'
          ? w.dailyWage
          : Number((hourlyWage * 24).toFixed(3));

        const MARKET_VALUE_PER_PP = 0.09566;
        const dailyProductionValue = typeof w.dailyProductionValue === 'number'
          ? w.dailyProductionValue
          : Number((dailyProducedPp * MARKET_VALUE_PER_PP).toFixed(3));

        const dailyProfit = typeof w.dailyProfit === 'number'
          ? w.dailyProfit
          : Number((dailyProductionValue - dailyWage).toFixed(3));

        const recipe = comp.recipe || { pp: 1, name: comp.itemCode || 'Product' };
        const spotPrice = comp.spotPrice || prices[comp.itemCode] || 1.0;
        const unitsProduced = recipe.pp > 0 ? (dailyProducedPp / recipe.pp) : 0;
        const grossValue = dailyProductionValue;
        const rawExpense = 0;
        const netContribution = dailyProfit;

        list.push({
          ...w,
          id: w.id || w._id || `emp-${comp.id || comp._id}-${wIdx}`,
          name: w.name || w.username || `AI Employee #${wIdx + 1}`,
          username: w.username || w.name || `AI Employee #${wIdx + 1}`,
          companyId: comp.id || comp._id,
          companyName: comp.name,
          companyItemCode: comp.itemCode,
          companyTotalBonusPct: compBonus,
          company: comp,
          companyDisabled: disabled || Boolean(w.companyDisabled || w._raw?.companyDisabled),
          isCompanyDisabled: disabled || Boolean(w.isCompanyDisabled || w._raw?.companyDisabled),
          isRaw: comp.isRaw,
          recipe,
          spotPrice,
          baseRawCostPerUnit: 0,
          hourlyOutputPp,
          hourlyWage,
          wage: hourlyWage,
          salary: hourlyWage,
          wageRate: hourlyWage,
          netWageRate: hourlyWage,
          dailyOutputPp: dailyProducedPp,
          producedDailyPp: dailyProducedPp,
          dailyPp: dailyProducedPp,
          dailyWage,
          grossDailyWage: dailyWage,
          netDailyWage: dailyWage,
          dailyTax: 0,
          dailyProductionValue,
          dailyProfit,
          unitsProduced,
          grossValue,
          rawExpense,
          netContribution
        });
      });
    });
    return list;
  }, [companies, prices]);

  // Flat list of all hired managers
  const allManagers = useMemo(() => {
    const list = [];
    companies.forEach(comp => {
      const disabled = isCompanyDisabled(comp);
      if (comp.manager || comp.hasManager || (typeof comp.managerPay === 'number' && comp.managerPay > 0)) {
        const m = comp.manager || {};
        const hourlyWage = typeof m.hourlyWage === 'number'
          ? m.hourlyWage
          : (typeof comp.managerPay === 'number' && comp.managerPay > 0 ? comp.managerPay / 24 : 0);
        const dailyWage = typeof m.dailyWage === 'number'
          ? m.dailyWage
          : (typeof comp.managerPay === 'number' ? comp.managerPay : (hourlyWage * 24));
        list.push({
          id: m.id || `mgr-${comp.id || comp._id}`,
          companyId: comp.id || comp._id,
          companyName: comp.name || 'Company',
          itemCode: comp.itemCode,
          company: comp,
          companyDisabled: disabled,
          isCompanyDisabled: disabled,
          isRaw: comp.isRaw,
          managementLevel: m.managementLevel || 1,
          productionBonusPercent: m.productionBonusPercent || 0,
          hourlyWage,
          dailyWage,
          isInactive: !!m.isInactive
        });
      }
    });
    return list;
  }, [companies]);

  // Active employees & managers strictly excluding disabled facilities
  const activeWorkers = useMemo(() => {
    return allWorkers.filter(w => !isCompanyDisabled(w.company) && !w.companyDisabled && !w.isCompanyDisabled);
  }, [allWorkers]);

  const activeManagers = useMemo(() => {
    return allManagers.filter(m => !isCompanyDisabled(m.company) && !m.companyDisabled && !m.isCompanyDisabled);
  }, [allManagers]);

  // Steel and Concrete Capital Influence Math
  const constructionMetrics = useMemo(() => {
    const steelPrice = prices.steel || 1.725;
    const concretePrice = prices.concrete || 1.703;
    const steelChange24h = priceChanges24h.steel || {};
    const concreteChange24h = priceChanges24h.concrete || {};

    // Support both changePct (from wareraApi) and changePercent with finite fallbacks
    const rawSteelPct = steelChange24h.changePct ?? steelChange24h.changePercent ?? 0;
    const rawSteelDiff = steelChange24h.changeDiff ?? 0;
    const steel1hPct = Number.isFinite(rawSteelPct) ? Number((rawSteelPct / 24).toFixed(2)) : 0;
    const steel1hDiff = Number.isFinite(rawSteelDiff) ? Number((rawSteelDiff / 24).toFixed(4)) : 0;

    const rawConcretePct = concreteChange24h.changePct ?? concreteChange24h.changePercent ?? 0;
    const rawConcreteDiff = concreteChange24h.changeDiff ?? 0;
    const concrete1hPct = Number.isFinite(rawConcretePct) ? Number((rawConcretePct / 24).toFixed(2)) : 0;
    const concrete1hDiff = Number.isFinite(rawConcreteDiff) ? Number((rawConcreteDiff / 24).toFixed(4)) : 0;

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
      const totalCompanyOperatingProfit1h = companies.filter(c => !isCompanyDisabled(c)).reduce((sum, c) => sum + ((c.baseNetProfit || 0) / 24), 0);
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

  // Manufacturing companies raw material expenses breakdown
  const rawCostsBreakdown = useMemo(() => {
    const items = [];
    let totalDailyExpense = 0;
    let totalRawUnits = 0;

    companies.forEach(c => {
      const isRaw = c.isRaw === true || c.recipe?.type === 'raw';
      const inputs = getCompanyRawInputs(c);
      const disabled = isCompanyDisabled(c);
      if (isRaw || inputs.length === 0) return; // Do not list raw companies

      const unitsProduced = c.baseUnits !== undefined ? c.baseUnits : (c.unitsPerDay || 0);
      const theme = getCompanyTheme(c);

      inputs.forEach((inp, inpIdx) => {
        const qtyPerUnit = inp.qty || 1;
        const rawUnitsNeeded = unitsProduced * qtyPerUnit;
        const rawPrice = getRawMaterialPrice(inp.id, prices);
        const dailyRawCost = rawUnitsNeeded * rawPrice;

        // Sum operational ability across active companies only
        if (!disabled) {
          totalDailyExpense += dailyRawCost;
          totalRawUnits += rawUnitsNeeded;
        }

        items.push({
          companyId: c.id || c._id,
          companyName: c.name,
          disabled,
          theme,
          itemCode: c.itemCode,
          outputName: c.recipe?.name || c.itemCode,
          unitsProduced,
          rawId: inp.id,
          rawName: RAW_MATERIAL_NAMES[inp.id] || inp.id,
          qtyPerUnit,
          rawUnitsNeeded,
          rawPrice,
          dailyRawCost
        });
      });
    });

    return {
      items,
      totalDailyExpense,
      totalRawUnits,
      mfgCount: new Set(items.filter(i => !i.disabled).map(i => i.companyId)).size
    };
  }, [companies, prices]);

  // Exhaustive Raw Material Supply, Demand, Deficit & Bottleneck Analysis
  const rawSupplyAnalysis = useMemo(() => {
    const rawSupplyMap = {};
    const rawDemandMap = {};

    const ALL_RAW_CODES = [
      'iron',
      'limestone',
      'grain',
      'lead',
      'petroleum',
      'wood',
      'fish',
      'livestock',
      'coca',
      'mysteriousPlant',
      'scraps'
    ];

    ALL_RAW_CODES.forEach(code => {
      rawSupplyMap[code] = { totalUnits: 0, facilities: [] };
      rawDemandMap[code] = { totalUnits: 0, consumers: [] };
    });

    // 1. Gather all raw material supply from player's active extraction facilities (excluding disabled)
    companies.forEach(c => {
      if (isCompanyDisabled(c)) return;
      const isRaw = c.isRaw === true || c.recipe?.type === 'raw' || ALL_RAW_CODES.includes(c.itemCode);
      const units = c.baseUnits !== undefined ? c.baseUnits : (c.unitsPerDay || 0);

      if (isRaw) {
        const rawCode = c.itemCode;
        if (!rawSupplyMap[rawCode]) {
          rawSupplyMap[rawCode] = { totalUnits: 0, facilities: [] };
        }
        rawSupplyMap[rawCode].totalUnits += units;
        rawSupplyMap[rawCode].facilities.push({
          id: c.id || c._id,
          name: c.name,
          units,
          itemCode: c.itemCode,
          theme: getCompanyTheme(c)
        });
      }
    });

    // 2. Gather all raw material demand from player's active manufacturing facilities (excluding disabled)
    companies.forEach(c => {
      if (isCompanyDisabled(c)) return;
      const isRaw = c.isRaw === true || c.recipe?.type === 'raw';
      const inputs = getCompanyRawInputs(c);
      if (isRaw || inputs.length === 0) return;

      const finishedUnits = c.baseUnits !== undefined ? c.baseUnits : (c.unitsPerDay || 0);
      const finishedSpotPrice = c.spotPrice || prices[c.itemCode] || 1.0;
      const theme = getCompanyTheme(c);

      inputs.forEach(inp => {
        const rawCode = inp.id;
        const qtyPerUnit = inp.qty || 1;
        const rawNeeded = finishedUnits * qtyPerUnit;

        if (!rawDemandMap[rawCode]) {
          rawDemandMap[rawCode] = { totalUnits: 0, consumers: [] };
        }
        rawDemandMap[rawCode].totalUnits += rawNeeded;
        rawDemandMap[rawCode].consumers.push({
          companyId: c.id || c._id,
          companyName: c.name,
          theme,
          finishedCode: c.itemCode,
          finishedName: c.recipe?.name || c.itemCode,
          finishedUnits,
          finishedSpotPrice,
          qtyPerUnit,
          rawNeeded
        });
      });
    });

    // 3. Balance and Deficit calculations per commodity
    const commodityRows = [];
    let totalDeficitCostDaily = 0;
    let totalSurplusValueDaily = 0;
    let totalLostRevenueDaily = 0;
    let totalNetValueAddLostDaily = 0;
    let totalDemandUnitsAll = 0;
    let totalCoveredUnitsAll = 0;

    const activeRawCodes = ALL_RAW_CODES.filter(code => {
      const s = rawSupplyMap[code]?.totalUnits || 0;
      const d = rawDemandMap[code]?.totalUnits || 0;
      return s > 0 || d > 0;
    });

    activeRawCodes.forEach(rawCode => {
      const supply = rawSupplyMap[rawCode]?.totalUnits || 0;
      const demand = rawDemandMap[rawCode]?.totalUnits || 0;
      const balance = supply - demand;
      const isDeficit = balance < -0.001;
      const isSurplus = balance > 0.001;
      const isBalanced = Math.abs(balance) <= 0.001;

      const deficitUnits = isDeficit ? Math.abs(balance) : 0;
      const surplusUnits = isSurplus ? balance : 0;
      const rawPrice = getRawMaterialPrice(rawCode, prices);
      const deficitCost = deficitUnits * rawPrice;
      const surplusValue = surplusUnits * rawPrice;

      const coveragePct = demand > 0 ? Math.min(100, (supply / demand) * 100) : (supply > 0 ? 100 : 0);
      const coveredUnits = Math.min(supply, demand);

      totalDemandUnitsAll += demand;
      totalCoveredUnitsAll += coveredUnits;
      totalDeficitCostDaily += deficitCost;
      totalSurplusValueDaily += surplusValue;

      // Downstream Finished Goods Bottleneck Analysis
      const consumers = rawDemandMap[rawCode]?.consumers || [];
      let bottleneckFinishedName = '—';
      let unproducedFinishedUnits = 0;
      let lostRevenue = 0;

      if (consumers.length > 0 && isDeficit) {
        const deficitFraction = demand > 0 ? (deficitUnits / demand) : 0;
        consumers.forEach(consumer => {
          const consumerUnproduced = consumer.finishedUnits * deficitFraction;
          const consumerLostRev = consumerUnproduced * consumer.finishedSpotPrice;
          unproducedFinishedUnits += consumerUnproduced;
          lostRevenue += consumerLostRev;
        });
        bottleneckFinishedName = consumers.map(c => c.finishedName).filter((v, i, a) => a.indexOf(v) === i).join(', ');
      } else if (consumers.length > 0) {
        bottleneckFinishedName = consumers.map(c => c.finishedName).filter((v, i, a) => a.indexOf(v) === i).join(', ');
      }

      const netValueAddLost = Math.max(0, lostRevenue - deficitCost);
      totalLostRevenueDaily += lostRevenue;
      totalNetValueAddLostDaily += netValueAddLost;

      commodityRows.push({
        rawCode,
        rawName: RAW_MATERIAL_NAMES[rawCode] || rawCode,
        rawPrice,
        supply,
        demand,
        balance,
        isDeficit,
        isSurplus,
        isBalanced,
        deficitUnits,
        surplusUnits,
        deficitCost,
        surplusValue,
        coveragePct,
        consumers,
        producers: rawSupplyMap[rawCode]?.facilities || [],
        bottleneckFinishedName,
        unproducedFinishedUnits,
        lostRevenue,
        netValueAddLost,
        roiOfProcurement: deficitCost > 0 ? (netValueAddLost / deficitCost) * 100 : 0
      });
    });

    commodityRows.sort((a, b) => {
      if (a.isDeficit && !b.isDeficit) return -1;
      if (!a.isDeficit && b.isDeficit) return 1;
      if (a.isDeficit && b.isDeficit) return b.deficitCost - a.deficitCost;
      return b.surplusValue - a.surplusValue;
    });

    const overallSelfSufficiencyPct = totalDemandUnitsAll > 0 
      ? (totalCoveredUnitsAll / totalDemandUnitsAll) * 100 
      : 100;

    const deficitCount = commodityRows.filter(r => r.isDeficit).length;
    const surplusCount = commodityRows.filter(r => r.isSurplus).length;
    const balancedCount = commodityRows.filter(r => r.isBalanced).length;

    return {
      commodityRows,
      totalDeficitCostDaily,
      totalSurplusValueDaily,
      totalLostRevenueDaily,
      totalNetValueAddLostDaily,
      totalDemandUnitsAll,
      totalCoveredUnitsAll,
      overallSelfSufficiencyPct,
      deficitCount,
      surplusCount,
      balancedCount
    };
  }, [companies, prices]);

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
                <div className="text-right">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Past 1-Hour Change</div>
                  <div className={`text-base font-black font-mono ${hourlyStats.netWorthCoins > 0 ? 'text-emerald-500' : hourlyStats.netWorthCoins < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                    {hourlyStats.netWorthCoins > 0 ? '+' : ''}{hourlyStats.netWorthCoins.toFixed(1)} ({hourlyStats.netWorthPct > 0 ? '+' : ''}{hourlyStats.netWorthPct.toFixed(2)}%)
                  </div>
                </div>
              </div>

              {/* Construction Capital Drivers */}
              <div className="bg-slate-50 p-4 border border-slate-200">
                <div className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wide mb-3">
                  Construction Capital Drivers:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Steel */}
                  <div className="bg-white p-3.5 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="font-semibold text-slate-700">Steel (Engine & Storage Upgrades):</span>
                      <span className="font-mono font-bold text-slate-900">{constructionMetrics.totalSteelInvested.toLocaleString()} units</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-600">Current Steel Price:</span>
                      <span className="font-mono font-semibold text-slate-900">{constructionMetrics.steelPrice.toFixed(3)} BTC</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-600">Hourly Change in Price:</span>
                      <span className={`font-mono font-bold ${constructionMetrics.steel1hPct > 0 ? 'text-emerald-600' : constructionMetrics.steel1hPct < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                        {constructionMetrics.steel1hPct > 0 ? '+' : ''}{constructionMetrics.steel1hPct.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="font-semibold text-slate-700">Invested:</span>
                      <span className="font-mono font-black text-slate-900">{constructionMetrics.totalSteelValue.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} BTC</span>
                    </div>
                  </div>

                  {/* Concrete */}
                  <div className="bg-white p-3.5 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="font-semibold text-slate-700">Concrete (Building Structures):</span>
                      <span className="font-mono font-bold text-slate-900">{constructionMetrics.totalConcreteInvested.toLocaleString()} units</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-600">Current Concrete Price:</span>
                      <span className="font-mono font-semibold text-slate-900">{constructionMetrics.concretePrice.toFixed(3)} BTC</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-600">Hourly Change in Price:</span>
                      <span className={`font-mono font-bold ${constructionMetrics.concrete1hPct > 0 ? 'text-emerald-600' : constructionMetrics.concrete1hPct < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                        {constructionMetrics.concrete1hPct > 0 ? '+' : ''}{constructionMetrics.concrete1hPct.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="font-semibold text-slate-700">Invested:</span>
                      <span className="font-mono font-black text-slate-900">{constructionMetrics.totalConcreteValue.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} BTC</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Asset Valuation Breakdown */}
              <div className="bg-white border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-slate-700 uppercase">
                    Asset Valuation Breakdown
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
                  <div className={`text-2xl sm:text-3xl font-black font-mono ${
                    marketOverview.totalBaseGrossRevenue > 0 ? 'text-emerald-600' : marketOverview.totalBaseGrossRevenue < 0 ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {marketOverview.totalBaseGrossRevenue > 0 ? '+' : ''}{marketOverview.totalBaseGrossRevenue.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
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
                        <th className="py-2.5 px-3 font-bold">Commodity</th>
                        <th className="py-2.5 px-3 font-bold text-right">Spot Price (BTC)</th>
                        <th className="py-2.5 px-3 font-bold text-right">Base Output</th>
                        <th className="py-2.5 px-3 font-bold text-right">Gross Daily Revenue (/day)</th>
                        <th className="py-2.5 px-4 font-bold text-right">Revenue Share</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {companies.map(c => {
                        const theme = getCompanyTheme(c);
                        const disabled = isCompanyDisabled(c);
                        const spotPrice = c.spotPrice || prices[c.itemCode] || 1.0;
                        const units = disabled ? 0 : (c.baseUnits || 0);
                        const grossRev = disabled ? 0 : (c.grossRevenue || (units * spotPrice));
                        // Operational revenue share excludes disabled facilities
                        const sharePct = !disabled && marketOverview.totalBaseGrossRevenue > 0 ? (grossRev / marketOverview.totalBaseGrossRevenue) * 100 : 0;
                        const revColor = grossRev > 0 ? 'text-emerald-600' : grossRev < 0 ? 'text-red-600' : 'text-blue-600';
                        return (
                          <tr key={c.id || c._id} className={`transition-colors ${disabled ? 'opacity-60 saturate-40 bg-slate-100/90 text-slate-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]' : theme.rowGradient}`}>
                            <td className="py-2.5 px-4 font-bold text-slate-900 font-sans">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {disabled && <span className="text-xs shrink-0 select-none" title="Company Disabled">💔</span>}
                                <span>{c.name}</span>
                                {disabled && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-200 border border-slate-300 text-slate-800 text-[9px] font-mono font-bold uppercase rounded shrink-0 shadow-2xs" title="Company Disabled">
                                    <span>💔</span>
                                    <span>Disabled</span>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold shadow-xs ${theme.pillTag}`}>
                                {c.recipe?.name || c.itemCode}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-600">
                              {spotPrice.toFixed(3)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                              {disabled ? '0.0 /day' : `${units.toFixed(1)} /day`}
                            </td>
                            <td className={`py-2.5 px-3 text-right font-black ${revColor}`}>
                              {disabled ? '0.0' : (grossRev > 0 ? `+${grossRev.toFixed(1)}` : grossRev < 0 ? grossRev.toFixed(1) : '0.0')}
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold text-slate-800">
                              {disabled ? (
                                <span className="text-slate-400 font-mono text-[11px]" title="Disabled company excluded from operational revenue share">0.0%</span>
                              ) : (
                                `${sharePct.toFixed(1)}%`
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-300 bg-slate-50 font-mono font-black text-slate-900">
                        <td className="py-3 px-4" colSpan={3}>
                          TOTAL BASE DAILY REVENUE
                        </td>
                        <td className="py-3 px-3 text-right text-slate-800">
                          {marketOverview.totalBaseDailyUnits.toFixed(1)} /day
                        </td>
                        <td className={`py-3 px-3 text-right text-sm ${
                          marketOverview.totalBaseGrossRevenue > 0 ? 'text-emerald-600' : marketOverview.totalBaseGrossRevenue < 0 ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {marketOverview.totalBaseGrossRevenue > 0 ? '+' : ''}{marketOverview.totalBaseGrossRevenue.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
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
                    {rawCostsBreakdown.totalDailyExpense > 0 ? (
                      <span className="text-red-500">
                        -{rawCostsBreakdown.totalDailyExpense.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      </span>
                    ) : (
                      <span className="text-blue-500">
                        0.0
                      </span>
                    )}
                    <span className="text-xs font-normal text-slate-500 ml-1.5">BTC/day</span>
                  </div>
                </div>
                <div className="text-left sm:text-right text-xs font-mono text-slate-600">
                  <div>Manufacturing Facilities: <span className="font-bold text-slate-900">{rawCostsBreakdown.mfgCount}</span></div>
                  <div>Daily Raw Demand: <span className="font-bold text-slate-900">{rawCostsBreakdown.totalRawUnits.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} units/d</span></div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-slate-700 uppercase">
                    Raw Material Expense Per Facility
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Manufacturing facilities only ({rawCostsBreakdown.items.length} active streams)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-600">
                        <th className="py-2.5 px-4 font-bold">Company</th>
                        <th className="py-2.5 px-3 font-bold">Output Good</th>
                        <th className="py-2.5 px-3 font-bold text-right">Units / Day</th>
                        <th className="py-2.5 px-3 font-bold">Raw Material Needed</th>
                        <th className="py-2.5 px-3 font-bold text-right">Raw Units Needed</th>
                        <th className="py-2.5 px-3 font-bold text-right">Raw Spot Price</th>
                        <th className="py-2.5 px-3 font-bold text-right">Daily Raw Cost</th>
                        <th className="py-2.5 px-4 font-bold text-right">Cost Share</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {rawCostsBreakdown.items.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                            No manufacturing facilities with raw material requirements found.
                          </td>
                        </tr>
                      ) : (
                        rawCostsBreakdown.items.map((item, idx) => {
                          const costSharePct = !item.disabled && rawCostsBreakdown.totalDailyExpense > 0
                            ? (item.dailyRawCost / rawCostsBreakdown.totalDailyExpense) * 100
                            : 0;

                          return (
                            <tr key={`${item.companyId}_${item.rawId}_${idx}`} className={`transition-colors ${item.disabled ? 'opacity-60 saturate-40 bg-slate-100/90 text-slate-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]' : item.theme.rowGradient}`}>
                              <td className="py-2.5 px-4 font-bold text-slate-900 font-sans">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {item.disabled && <span className="text-xs shrink-0 select-none" title="Company Disabled">💔</span>}
                                  <span>{item.companyName}</span>
                                  {item.disabled && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-200 border border-slate-300 text-slate-800 text-[9px] font-mono font-bold uppercase rounded shrink-0 shadow-2xs" title="Company Disabled">
                                      <span>💔</span>
                                      <span>Disabled</span>
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 capitalize text-slate-700">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${item.theme.pillTag}`}>
                                  {item.outputName}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                                {item.disabled ? '0.0' : item.unitsProduced.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">units/d</span>
                              </td>
                              <td className="py-2.5 px-3 capitalize font-bold text-slate-800">
                                {item.rawName} <span className="text-[10px] text-slate-400 font-normal">({item.qtyPerUnit}x/unit)</span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                                {item.disabled ? '0.0' : item.rawUnitsNeeded.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-700">
                                {item.rawPrice.toFixed(3)} BTC
                              </td>
                              <td className="py-2.5 px-3 text-right font-black text-rose-600">
                                {item.disabled ? '0.00 BTC' : `-${item.dailyRawCost.toFixed(2)} BTC`}
                              </td>
                              <td className="py-2.5 px-4 text-right font-bold text-slate-800">
                                {item.disabled ? (
                                  <span className="text-slate-400 font-mono text-[11px]" title="Disabled company excluded from operational cost share">0.0%</span>
                                ) : (
                                  `${costSharePct.toFixed(1)}%`
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-300 bg-slate-50 font-mono font-black text-slate-900">
                        <td className="py-3 px-4" colSpan={4}>
                          TOTAL MANUFACTURING RAW MATERIAL EXPENSE
                        </td>
                        <td className="py-3 px-3 text-right text-slate-900">
                          {rawCostsBreakdown.totalRawUnits.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-400">
                          —
                        </td>
                        <td className={`py-3 px-3 text-right text-sm ${rawCostsBreakdown.totalDailyExpense > 0 ? 'text-red-600' : 'text-blue-500'}`}>
                          {rawCostsBreakdown.totalDailyExpense > 0 
                            ? `-${rawCostsBreakdown.totalDailyExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BTC`
                            : '0.00 BTC'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {rawCostsBreakdown.totalDailyExpense > 0 ? '100.0%' : '0.0%'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>


            </div>
          )}

          {/* 3B. RAW MATERIAL SUPPLY, DEFICIT & BOTTLENECK ANALYSIS */}
          {activeMetric === 'rawSupply' && (
            <div className="space-y-5">
              {/* Executive KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Deficit Cost */}
                <div className="bg-white p-4 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold uppercase text-slate-500">Daily Deficit Cost</span>
                      {rawSupplyAnalysis.deficitCount > 0 ? (
                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold font-mono rounded">
                          {rawSupplyAnalysis.deficitCount} Deficit{rawSupplyAnalysis.deficitCount > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono rounded">
                          Balanced
                        </span>
                      )}
                    </div>
                    <div className="text-xl sm:text-2xl font-black font-mono mt-1 text-rose-600">
                      {rawSupplyAnalysis.totalDeficitCostDaily > 0 
                        ? `-${rawSupplyAnalysis.totalDeficitCostDaily.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                        : '0.00'}
                      <span className="text-xs font-normal text-slate-500 ml-1">BTC/d</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 font-sans mt-2">
                    Open market procurement needed to prevent production shutdowns
                  </div>
                </div>

                {/* 2. Lost Output Revenue */}
                <div className="bg-white p-4 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold uppercase text-slate-500">Lost Output at Risk</span>
                      <span className="text-[10px] text-amber-600 font-bold font-mono flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Bottleneck
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black font-mono mt-1 text-amber-600">
                      {rawSupplyAnalysis.totalLostRevenueDaily > 0 
                        ? `-${rawSupplyAnalysis.totalLostRevenueDaily.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                        : '0.00'}
                      <span className="text-xs font-normal text-slate-500 ml-1">BTC/d</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 font-sans mt-2">
                    Gross finished goods revenue unproduced if missing inputs are not bought
                  </div>
                </div>

                {/* 3. Net Margin Value Add */}
                <div className="bg-white p-4 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold uppercase text-slate-500">Net Import Value-Add</span>
                      <span className="text-[10px] text-emerald-700 font-bold font-mono flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" /> Arbitrage
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black font-mono mt-1 text-emerald-600">
                      +{rawSupplyAnalysis.totalNetValueAddLostDaily.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="text-xs font-normal text-slate-500 ml-1">BTC/d</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 font-sans mt-2">
                    Net profit captured by buying missing inputs vs. halting production
                  </div>
                </div>

                {/* 4. Self Sufficiency */}
                <div className="bg-white p-4 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold uppercase text-slate-500">Internal Supply Autarky</span>
                      <span className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded ${
                        rawSupplyAnalysis.overallSelfSufficiencyPct >= 100 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : rawSupplyAnalysis.overallSelfSufficiencyPct >= 50 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-rose-100 text-rose-800'
                      }`}>
                        {rawSupplyAnalysis.overallSelfSufficiencyPct >= 100 ? 'Self-Reliant' : 'Dependent'}
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black font-mono mt-1 text-slate-900">
                      {rawSupplyAnalysis.overallSelfSufficiencyPct.toFixed(1)}%
                    </div>
                  </div>
                  <div className="space-y-1 mt-2">
                    <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          rawSupplyAnalysis.overallSelfSufficiencyPct >= 100 ? 'bg-emerald-500' : rawSupplyAnalysis.overallSelfSufficiencyPct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, rawSupplyAnalysis.overallSelfSufficiencyPct))}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono flex justify-between">
                      <span>{rawSupplyAnalysis.totalCoveredUnitsAll.toFixed(0)} supplied</span>
                      <span>{rawSupplyAnalysis.totalDemandUnitsAll.toFixed(0)} demanded</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Supply vs Demand Ledger Table */}
              <div className="bg-white border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <span className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wide">
                      Raw Material Supply vs. Demand & Deficit Ledger
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono ml-2">
                      (Total In-House Supply − Factory Demand = Net Surplus / Deficit)
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    {rawSupplyAnalysis.commodityRows.length} active commodity streams tracked
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-600">
                        <th className="py-2.5 px-4 font-bold">Raw Material</th>
                        <th className="py-2.5 px-3 font-bold text-right">In-House Supply</th>
                        <th className="py-2.5 px-3 font-bold text-right">Factory Demand</th>
                        <th className="py-2.5 px-3 font-bold text-right">Net Balance</th>
                        <th className="py-2.5 px-3 font-bold text-right">Coverage</th>
                        <th className="py-2.5 px-3 font-bold text-right">Deficit Cost</th>
                        <th className="py-2.5 px-3 font-bold">Impacted Product</th>
                        <th className="py-2.5 px-3 font-bold text-right">Units Not Produced</th>
                        <th className="py-2.5 px-3 font-bold text-right">Lost Revenue</th>
                        <th className="py-2.5 px-4 font-bold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {rawSupplyAnalysis.commodityRows.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-10 text-center text-slate-400 font-sans">
                            No active raw material production or factory consumption streams found.
                          </td>
                        </tr>
                      ) : (
                        rawSupplyAnalysis.commodityRows.map((row) => {
                          const rawTheme = getCompanyTheme(row.rawCode);
                          return (
                            <tr 
                              key={row.rawCode} 
                              className={`transition-colors ${rawTheme.rowGradient}`}
                            >
                              {/* Raw Material Name & Spot Price */}
                              <td className="py-3 px-4 font-bold text-slate-900 font-sans">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold shadow-xs ${rawTheme.pillTag}`}>
                                    {row.rawCode}
                                  </span>
                                  <span>{row.rawName}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono font-normal mt-0.5">
                                  {row.rawPrice.toFixed(3)} BTC/unit
                                </div>
                              </td>

                              {/* Daily Supply */}
                              <td className="py-3 px-3 text-right font-bold text-slate-900">
                                <div>{row.supply.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">u/d</span></div>
                                <div className="text-[10px] text-slate-500 font-sans font-normal">
                                  {row.producers.length} source{row.producers.length !== 1 ? 's' : ''}
                                </div>
                              </td>

                              {/* Daily Demand */}
                              <td className="py-3 px-3 text-right font-bold text-slate-800">
                                <div>{row.demand.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">u/d</span></div>
                                <div className="text-[10px] text-slate-500 font-sans font-normal">
                                  {row.consumers.length} factor{row.consumers.length !== 1 ? 'ies' : 'y'}
                                </div>
                              </td>

                              {/* Net Balance */}
                              <td className="py-3 px-3 text-right whitespace-nowrap font-black">
                                <span className={row.isDeficit ? 'text-rose-600' : row.isSurplus ? 'text-emerald-600' : 'text-slate-600'}>
                                  {row.balance > 0 ? `+${row.balance.toFixed(1)}` : row.balance.toFixed(1)} u/d
                                </span>
                              </td>

                              {/* Coverage */}
                              <td className="py-3 px-3 text-right font-bold">
                                <span className={
                                  row.coveragePct >= 100 
                                    ? 'text-emerald-700' 
                                    : row.coveragePct >= 50 
                                      ? 'text-amber-700' 
                                      : 'text-rose-700'
                                }>
                                  {row.coveragePct.toFixed(1)}%
                                </span>
                              </td>

                              {/* Deficit Cost */}
                              <td className="py-3 px-3 text-right font-black whitespace-nowrap">
                                {row.isDeficit ? (
                                  <span className="text-rose-600">
                                    -{row.deficitCost.toFixed(2)} BTC
                                  </span>
                                ) : (
                                  <span className="text-slate-400">0.00 BTC</span>
                                )}
                              </td>

                              {/* Impacted Product */}
                              <td className="py-3 px-3 font-semibold text-slate-800 capitalize font-sans">
                                {row.consumers.length > 0 ? (
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {row.consumers.map(cons => {
                                      const consTheme = getCompanyTheme(cons.itemCode || cons.finishedName);
                                      return (
                                        <span key={cons.companyId} className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold shadow-xs ${consTheme.pillTag}`}>
                                          {cons.finishedName}
                                        </span>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  row.bottleneckFinishedName
                                )}
                              </td>

                              {/* Units Not Produced */}
                              <td className="py-3 px-3 text-right font-black whitespace-nowrap">
                                {row.unproducedFinishedUnits > 0 ? (
                                  <span className="text-rose-600 font-black">
                                    -{row.unproducedFinishedUnits.toFixed(1)} <span className="text-[10px] font-normal">u/d</span>
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 font-semibold">0.0 u/d</span>
                                )}
                              </td>

                              {/* Lost Revenue */}
                              <td className="py-3 px-3 text-right font-black whitespace-nowrap">
                                {row.lostRevenue > 0 ? (
                                  <span className="text-amber-600">
                                    -{row.lostRevenue.toFixed(2)} BTC
                                  </span>
                                ) : (
                                  <span className="text-emerald-700">0.00 BTC</span>
                                )}
                              </td>

                              {/* Status Badge */}
                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                {row.isDeficit ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold uppercase font-mono">
                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                    Deficit
                                  </span>
                                ) : row.isSurplus ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase font-mono">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Surplus
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold uppercase font-mono">
                                    Balanced
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-300 bg-slate-50 font-mono font-black text-slate-900 text-xs">
                        <td className="py-3 px-4">
                          PORTFOLIO TOTALS
                        </td>
                        <td className="py-3 px-3 text-right">
                          {rawSupplyAnalysis.commodityRows.reduce((s, r) => s + r.supply, 0).toFixed(1)} u/d
                        </td>
                        <td className="py-3 px-3 text-right">
                          {rawSupplyAnalysis.totalDemandUnitsAll.toFixed(1)} u/d
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          {(() => {
                            const net = rawSupplyAnalysis.commodityRows.reduce((s, r) => s + r.supply, 0) - rawSupplyAnalysis.totalDemandUnitsAll;
                            return (
                              <span className={net < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                                {net > 0 ? `+${net.toFixed(1)}` : net.toFixed(1)} u/d
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-800">
                          {rawSupplyAnalysis.overallSelfSufficiencyPct.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-right text-rose-600 whitespace-nowrap">
                          -{rawSupplyAnalysis.totalDeficitCostDaily.toFixed(2)} BTC
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          —
                        </td>
                        <td className="py-3 px-3 text-right text-rose-600 whitespace-nowrap">
                          -{rawSupplyAnalysis.commodityRows.reduce((s, r) => s + r.unproducedFinishedUnits, 0).toFixed(1)} u/d
                        </td>
                        <td className="py-3 px-3 text-right text-amber-600 whitespace-nowrap">
                          -{rawSupplyAnalysis.totalLostRevenueDaily.toFixed(2)} BTC
                        </td>
                        <td className="py-3 px-4 text-center text-slate-500 font-normal">
                          {rawSupplyAnalysis.deficitCount} Deficits
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Deep-Dive Analysis & Actionable Blueprint */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 1. Downstream Factory Bottleneck Impact */}
                <div className="bg-white border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Factory className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold font-mono text-slate-900 uppercase">
                      Factory Bottleneck & Arbitrage Analysis
                    </span>
                  </div>

                  {rawSupplyAnalysis.deficitCount === 0 ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-sans">
                      <div className="font-bold flex items-center gap-1.5 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Zero Production Bottlenecks
                      </div>
                      All operating manufacturing facilities are 100% supplied by internal extraction or have zero raw deficit constraints.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {rawSupplyAnalysis.commodityRows.filter(r => r.isDeficit).map(deficit => (
                        <div key={deficit.rawCode} className="p-3 bg-slate-50 border border-slate-200 space-y-1.5 text-xs font-sans">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 font-mono text-sm">
                              {deficit.rawName} Bottleneck
                            </span>
                            <span className="font-mono text-xs font-bold text-rose-600">
                              -{deficit.deficitUnits.toFixed(1)} units/d missing
                            </span>
                          </div>

                          <div className="text-slate-600 leading-relaxed text-[11px]">
                            Consuming facilities lack raw inputs to run at full capacity:
                            <ul className="list-disc list-inside mt-1 space-y-0.5 font-mono text-slate-700">
                              {deficit.consumers.map(cons => (
                                <li key={cons.companyId}>
                                  <strong>{cons.companyName}</strong>: requires {cons.rawNeeded.toFixed(1)} {deficit.rawName}/d to produce {cons.finishedUnits.toFixed(1)} {cons.finishedName}/d
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-2 bg-white border border-slate-200 text-[11px] font-mono space-y-1 mt-2">
                            <div className="flex justify-between text-slate-600">
                              <span>Raw Import Cost:</span>
                              <span className="text-rose-600 font-bold">-{deficit.deficitCost.toFixed(2)} BTC/d</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>Finished Goods Value Created:</span>
                              <span className="text-slate-900 font-bold">+{deficit.lostRevenue.toFixed(2)} BTC/d</span>
                            </div>
                            <div className="flex justify-between text-emerald-700 border-t border-slate-100 pt-1 font-bold">
                              <span>Net Manufacturing Arbitrage:</span>
                              <span>+{deficit.netValueAddLost.toFixed(2)} BTC/d ({deficit.roiOfProcurement.toFixed(0)}% ROI)</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Industrial Expansion Blueprint */}
                <div className="bg-white border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <ShieldAlert className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold font-mono text-slate-900 uppercase">
                      Industrial Expansion Blueprint (Autarky Roadmap)
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs font-sans">
                    {rawSupplyAnalysis.deficitCount > 0 ? (
                      rawSupplyAnalysis.commodityRows.filter(r => r.isDeficit).map(deficit => (
                        <div key={`blueprint-${deficit.rawCode}`} className="p-3 bg-blue-50/50 border border-blue-200 space-y-1.5">
                          <div className="font-bold text-slate-900 flex items-center justify-between">
                            <span>Close {deficit.rawName} Deficit</span>
                            <span className="font-mono text-blue-700 text-[11px]">
                              +{deficit.deficitUnits.toFixed(1)} u/d required
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {deficit.producers.length > 0 ? (
                              <>
                                You already own <strong>{deficit.producers.length} {deficit.rawName} facility</strong> ({deficit.producers.map(p => p.name).join(', ')}). Upgrade their engine tier or expand the workforce to close the remaining gap of {deficit.deficitUnits.toFixed(1)} units/day.
                              </>
                            ) : (
                              <>
                                You currently operate <strong>zero {deficit.rawName} extraction facilities</strong>. Founding a dedicated {deficit.rawName} extraction company will eliminate the {deficit.deficitCost.toFixed(2)} BTC/day open-market expense.
                              </>
                            )}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                        <div className="font-bold mb-1">Full Supply Independence Achieved</div>
                        Your portfolio does not rely on open market raw material imports. All downstream finished goods production is insulated from commodity price shocks.
                      </div>
                    )}

                    {/* Surplus Intelligence */}
                    {rawSupplyAnalysis.surplusCount > 0 && (
                      <div className="p-3 bg-slate-50 border border-slate-200 space-y-1">
                        <div className="font-bold text-slate-800 font-mono text-xs">
                          Exportable Surplus Commodities:
                        </div>
                        <div className="text-[11px] text-slate-600 leading-relaxed">
                          You produce surplus in {rawSupplyAnalysis.commodityRows.filter(r => r.isSurplus).map(r => `${r.rawName} (+${r.surplusUnits.toFixed(1)} u/d)`).join(', ')}. These generate up to <strong>+{rawSupplyAnalysis.totalSurplusValueDaily.toFixed(2)} BTC/day</strong> in external spot sales.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. BASE SALARIES PAID BREAKDOWN (v0.27+ AI Worker Hourly Salaries) */}
          {activeMetric === 'salaries' && (
            <div className="space-y-4">
              <div className="bg-white p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-mono font-bold uppercase text-slate-500">
                    Total Base Salaries Paid
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-red-500">
                    -{marketOverview.totalBaseLaborExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="text-xs font-normal text-slate-500 ml-1.5">BTC/day</span>
                  </div>
                </div>
                <div className="text-left sm:text-right text-xs font-mono text-slate-600">
                  <div>Hired Workforce: <span className="font-bold text-slate-900">{activeWorkers.length} active workers</span>{allWorkers.length > activeWorkers.length ? ` (${allWorkers.length} total)` : ''} • Managers: <span className="font-bold text-amber-800">{activeManagers.length} hired</span></div>
                  <div>Worker Wages: <span className="font-bold text-red-600">-{marketOverview.totalWorkerWages.toFixed(2)} BTC</span> • Manager Pay: <span className="font-bold text-red-600">-{marketOverview.totalManagerCost.toFixed(2)} BTC</span></div>
                  <div className="text-[10px] text-slate-400">Continuous 24-hour shift schedule</div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-slate-700 uppercase">
                    AI Employee Wage & Production Details ({activeWorkers.length} Active Workers{allWorkers.length > activeWorkers.length ? ` • ${allWorkers.length - activeWorkers.length} in disabled facilities` : ''})
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Daily Salary = Hourly Rate * 24 Hours • Click any employee to inspect breakdown
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-600">
                        <th className="py-2.5 px-4 font-bold">Employee</th>
                        <th className="py-2.5 px-3 font-bold">Company</th>
                        <th className="py-2.5 px-3 font-bold text-right">Hourly Yield (PP/h)</th>
                        <th className="py-2.5 px-3 font-bold text-right">Hourly Salary (BTC/h)</th>
                        <th className="py-2.5 px-3 font-bold text-right">Daily PP</th>
                        <th className="py-2.5 px-3 font-bold text-right">Payable Salary/Day (BTC)</th>
                        <th className="py-2.5 px-3 font-bold text-right">Daily Revenue (BTC)</th>
                        <th className="py-2.5 px-4 font-bold text-right">Net Profit / Day (BTC)</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {allWorkers.map((w, idx) => {
                        const workerKey = w.id || `worker-${idx}`;
                        const isExpanded = expandedWorkerId === workerKey;
                        const hourlyYield = w.hourlyOutputPp || 0;
                        const hourlyWage = w.hourlyWage || 0;
                        const dailyPp = w.dailyOutputPp || (hourlyYield * 24);
                        const dailyWage = w.dailyWage || (hourlyWage * 24);
                        const dailyRev = w.dailyProductionValue || (dailyPp * 0.09566);
                        const dailyNet = w.dailyProfit !== undefined ? w.dailyProfit : (dailyRev - dailyWage);
                        const compBonus = w.companyTotalBonusPct || 0;
                        const theme = getCompanyTheme(w.company || w.companyItemCode || w.itemCode || w.companyName);
                        const isFemale = w.gender === 'female';

                        const isCompDisabled = isCompanyDisabled(w.company) || w.companyDisabled || w.isCompanyDisabled;

                        return (
                          <React.Fragment key={workerKey}>
                            <tr 
                              onClick={() => setExpandedWorkerId(isExpanded ? null : workerKey)}
                              className={`cursor-pointer transition-colors ${isCompDisabled ? 'opacity-60 saturate-40 bg-slate-100/90 text-slate-500' : theme.rowGradient} ${isExpanded ? 'font-semibold' : ''}`}
                              title="Click to view detailed mathematical breakdown"
                            >
                              <td className="py-2.5 px-4 font-bold text-slate-900 font-sans">
                                <div className="flex items-center space-x-2">
                                  <span className={`text-[10px] font-mono transition-transform duration-150 inline-block ${isExpanded ? `rotate-90 ${theme.accentText} font-black` : 'text-slate-400'}`}>
                                    ▶
                                  </span>
                                  {/* AI Worker Robot Avatar: Blue for male, Pink for female */}
                                  <span 
                                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs shrink-0 shadow-xs ${
                                      isFemale 
                                        ? 'bg-pink-100 text-pink-600 border border-pink-200' 
                                        : 'bg-blue-100 text-blue-600 border border-blue-200'
                                    }`}
                                    title={`AI Worker (${w.gender || 'male'})`}
                                  >
                                    <Bot className="w-3.5 h-3.5" />
                                  </span>
                                  <span className="hover:underline">{w.name || w.username}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-medium text-slate-700">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold shadow-xs ${theme.pillTag}`}>
                                    {w.companyItemCode || 'Product'}
                                  </span>
                                  {isCompDisabled && <span className="text-xs shrink-0 select-none" title="Company Disabled">💔</span>}
                                  <span className="font-semibold text-slate-900 font-sans">{w.companyName}</span>
                                  {isCompDisabled && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-200 border border-slate-300 text-slate-800 text-[9px] font-mono font-bold uppercase rounded shrink-0 shadow-2xs" title="Company Disabled">
                                      <span>💔</span>
                                      <span>Disabled</span>
                                    </span>
                                  )}
                                </div>
                                {!isCompDisabled && compBonus > 0 && (
                                  <div className={`text-[10px] font-mono font-bold mt-0.5 ${theme.accentText}`}>
                                    +{compBonus.toFixed(1)}% bonus
                                  </div>
                                )}
                              </td>
                              <td className={`py-2.5 px-3 text-right font-bold ${theme.accentText}`}>
                                {isCompDisabled ? '0.00' : hourlyYield.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-red-600">
                                {isCompDisabled ? '-0.0000' : `-${hourlyWage.toFixed(4)}`}
                              </td>
                              <td className="py-2.5 px-3 text-right font-black text-slate-900">
                                {isCompDisabled ? '0.0' : dailyPp.toFixed(1)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-black text-red-500">
                                {isCompDisabled ? '-0.00' : `-${dailyWage.toFixed(2)}`}
                              </td>
                              <td className={`py-2.5 px-3 text-right font-bold ${dailyRev > 0 ? 'text-emerald-600' : dailyRev < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                {isCompDisabled ? '0.00' : (dailyRev > 0 ? `+${dailyRev.toFixed(2)}` : dailyRev < 0 ? dailyRev.toFixed(2) : '0.00')}
                              </td>
                              <td className="py-2.5 px-4 text-right font-black">
                                <span className={dailyNet > 0 ? 'text-emerald-700' : dailyNet < 0 ? 'text-red-600' : 'text-blue-600'}>
                                  {isCompDisabled ? '0.00' : `${dailyNet > 0 ? '+' : ''}${dailyNet.toFixed(2)}`}
                                </span>
                              </td>
                            </tr>

                            {/* Inline Expandable Math Audit Card */}
                            {isExpanded && (
                              <tr className={`border-b-2 ${theme.accentBorder}`}>
                                <td colSpan={9} className="p-3.5 sm:p-5">
                                  <div className={`bg-white border ${theme.cardBorder} p-4 sm:p-5 space-y-4 shadow-sm relative overflow-hidden rounded-xl`}>
                                    {/* Top Product Theme Accent Strip */}
                                    <div className="absolute top-0 inset-x-0 h-1.5" style={{ backgroundColor: theme.accentColor }} />

                                    {/* Header with Product Theme */}
                                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 ${theme.cardHeaderBg} -mx-4 -mt-4 p-4 sm:-mx-5 sm:-mt-5 sm:p-5`}>
                                      <div>
                                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs shrink-0 ${
                                            isFemale 
                                              ? 'bg-pink-100 text-pink-600 border border-pink-200' 
                                              : 'bg-blue-100 text-blue-600 border border-blue-200'
                                          }`}>
                                            <Bot className="w-4 h-4" />
                                          </span>
                                          <span className="text-base font-extrabold text-slate-900 font-sans">
                                            {w.name || w.username}
                                          </span>
                                          {w.age && (
                                            <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-1.5 py-0.5 font-bold rounded">
                                              Age {w.age} {w.gender ? `(${w.gender})` : ''}
                                            </span>
                                          )}
                                          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 font-bold rounded shadow-xs ${theme.pillTag}`}>
                                            {w.companyItemCode || 'Product'} • {theme.label}
                                          </span>
                                          <span className="text-xs font-sans font-bold text-slate-700">
                                            {w.companyName}
                                          </span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-sans mt-0.5">
                                          Continuous 24-Hour AI Employee Economics & Live Accounting
                                        </p>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setInspectedWorker(w);
                                          }}
                                          className={`px-3 py-1.5 text-xs font-mono font-bold transition cursor-pointer flex items-center space-x-1 rounded-lg ${theme.badgeBg} hover:opacity-90`}
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
                                      {/* Pillar 1: Hourly Production & 24h Output */}
                                      <div className={`p-3.5 border rounded-xl space-y-2 font-mono text-xs ${theme.modalKpiBg || 'bg-slate-50 border-slate-200'}`}>
                                        <div className="text-[11px] font-bold text-slate-700 uppercase flex items-center justify-between">
                                          <span>1. Hourly & 24h Yield</span>
                                          <span className="text-slate-400 font-normal">Continuous</span>
                                        </div>
                                        <div className="space-y-1 text-slate-600">
                                          <div className="flex justify-between">
                                            <span>Hourly Production:</span>
                                            <strong className={`font-bold ${theme.accentText}`}>{hourlyYield.toFixed(3)} PP/h</strong>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Facility Multiplier:</span>
                                            <strong className="text-emerald-700 font-bold">+{compBonus.toFixed(1)}%</strong>
                                          </div>
                                          <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-900 font-bold">
                                            <span>Continuous 24h Yield:</span>
                                            <strong className={`font-black ${theme.accentText}`}>{dailyPp.toFixed(1)} PP/day</strong>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Pillar 2: Hourly Rate & 24h Outflow */}
                                      <div className="bg-rose-50/50 p-3.5 border border-rose-200/70 rounded-xl space-y-2 font-mono text-xs">
                                        <div className="text-[11px] font-bold text-slate-700 uppercase flex items-center justify-between">
                                          <span>2. Salary & Payroll</span>
                                          <span className="text-slate-400 font-normal">Hourly Rate</span>
                                        </div>
                                        <div className="space-y-1 text-slate-600">
                                          <div className="flex justify-between">
                                            <span>Contracted Hourly Rate:</span>
                                            <strong className="text-red-600 font-bold">-{hourlyWage.toFixed(6)} BTC/h</strong>
                                          </div>
                                          <div className="flex justify-between pt-1 border-t border-rose-200 text-slate-900 font-bold">
                                            <span>Payable Salary / Day (24h):</span>
                                            <strong className="text-red-600 font-black text-sm">-{dailyWage.toFixed(3)} BTC/day</strong>
                                          </div>
                                          <div className="flex justify-between text-[11px] text-slate-500">
                                            <span>Weekly (7d):</span>
                                            <strong className="text-red-600">-{(dailyWage * 7).toFixed(2)} BTC</strong>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Pillar 3: Economic Value & Net Profit */}
                                      <div className="bg-emerald-50/50 p-3.5 border border-emerald-200/70 rounded-xl space-y-2 font-mono text-xs">
                                        <div className="text-[11px] font-bold text-slate-700 uppercase flex items-center justify-between">
                                          <span>3. Net Profit Generated</span>
                                          <span className="text-slate-400 font-normal">Accounting</span>
                                        </div>
                                        <div className="space-y-1 text-slate-600">
                                          <div className="flex justify-between">
                                            <span>Gross Revenue (0.09566 BTC/PP):</span>
                                            <strong className="text-emerald-700 font-bold">+{dailyRev.toFixed(3)} BTC/d</strong>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Salary Paid:</span>
                                            <strong className="text-red-600 font-bold">-{dailyWage.toFixed(3)} BTC/d</strong>
                                          </div>
                                          <div className="flex justify-between pt-1 border-t border-emerald-200 text-slate-900 font-bold">
                                            <span>Net Profit Contribution:</span>
                                            <strong className={`font-black text-sm ${dailyNet >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                              {dailyNet >= 0 ? '+' : ''}{dailyNet.toFixed(3)} BTC/d
                                            </strong>
                                          </div>
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
                        <td className="py-3 px-4" colSpan={4}>
                          TOTAL BASE SALARIES PAID ({activeWorkers.length} ACTIVE EMPLOYEES)
                        </td>
                        <td className="py-3 px-3 text-right text-slate-900">
                          {activeWorkers.reduce((s, w) => s + (w.dailyOutputPp || 0), 0).toFixed(1)}
                        </td>
                        <td className="py-3 px-3 text-right text-red-500 text-sm">
                          -{marketOverview.totalWorkerWages.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className={`py-3 px-3 text-right text-sm ${
                          activeWorkers.reduce((s, w) => s + (w.dailyProductionValue || 0), 0) > 0 ? 'text-emerald-600' : activeWorkers.reduce((s, w) => s + (w.dailyProductionValue || 0), 0) < 0 ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          +{activeWorkers.reduce((s, w) => s + (w.dailyProductionValue || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right text-sm">
                          <span className={marketOverview.baseDailyProfit > 0 ? 'text-emerald-700' : marketOverview.baseDailyProfit < 0 ? 'text-red-600' : 'text-blue-600'}>
                            {marketOverview.baseDailyProfit >= 0 ? '+' : ''}{marketOverview.baseDailyProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Hired Managers Payroll Table */}
              {allManagers.length > 0 && (
                <div className="bg-white border border-slate-200 overflow-hidden">
                  <div className="px-4 py-2.5 bg-amber-50/70 border-b border-amber-200 flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-amber-900 uppercase">
                      Hired Company Managers ({activeManagers.length} Active Managers)
                    </span>
                    <span className="text-[11px] font-mono text-amber-700">
                      Total Manager Payroll: -{marketOverview.totalManagerCost.toFixed(2)} BTC/day
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-600">
                          <th className="py-2.5 px-4 font-bold">Company</th>
                          <th className="py-2.5 px-3 font-bold">Manager Role</th>
                          <th className="py-2.5 px-3 font-bold text-center">Prod Bonus</th>
                          <th className="py-2.5 px-3 font-bold text-right">Hourly Wage</th>
                          <th className="py-2.5 px-4 font-bold text-right">Daily Cost (24h)</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono">
                        {allManagers.map(m => {
                          const mgrTheme = getCompanyTheme(m.company || m.itemCode || m.companyName);
                          const isMgrCompDisabled = isCompanyDisabled(m.company) || m.companyDisabled;
                          return (
                            <tr key={m.id} className={`transition-colors ${isMgrCompDisabled ? 'opacity-60 saturate-40 bg-slate-100/90 text-slate-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]' : mgrTheme.rowGradient}`}>
                              <td className="py-2.5 px-4 font-bold text-slate-900 font-sans">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold shadow-xs ${mgrTheme.pillTag}`}>
                                    {m.itemCode || 'Product'}
                                  </span>
                                  {isMgrCompDisabled && <span className="text-xs shrink-0 select-none" title="Company Disabled">💔</span>}
                                  <span>{m.companyName}</span>
                                  {isMgrCompDisabled && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-200 border border-slate-300 text-slate-800 text-[9px] font-mono font-bold uppercase rounded shrink-0 shadow-2xs" title="Company Disabled">
                                      <span>💔</span>
                                      <span>Disabled</span>
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] rounded">
                                  Manager Lv.{m.managementLevel}
                                </span>
                              </td>
                              <td className={`py-2.5 px-3 text-center font-bold ${mgrTheme.accentText}`}>
                                {isMgrCompDisabled ? '0%' : `+${m.productionBonusPercent}%`}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-red-600">
                                {isMgrCompDisabled ? '-0.0000 BTC/h' : `-${m.hourlyWage.toFixed(4)} BTC/h`}
                              </td>
                              <td className="py-2.5 px-4 text-right font-bold text-red-600">
                                {isMgrCompDisabled ? '-0.00 BTC/d' : `-${m.dailyWage.toFixed(2)} BTC/d`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold font-mono">
                          <td colSpan={4} className="py-2.5 px-4 text-slate-800">
                            Total Manager Outflow:
                          </td>
                          <td className="py-2.5 px-4 text-right text-red-600 text-sm">
                            -{marketOverview.totalManagerCost.toFixed(2)} BTC
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. BASE DAILY PROFIT BREAKDOWN */}
          {activeMetric === 'profit' && (
            <div className="space-y-4">
              {/* 4 KPI Summary Cards with Clear Accounting Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Net Daily Profit */}
                <div className="bg-white p-4 border border-slate-200">
                  <div className="text-[11px] font-mono font-bold uppercase text-slate-500">
                    Base Net Profit / Day
                  </div>
                  <div className={`text-2xl font-black font-mono ${marketOverview.baseDailyProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {marketOverview.baseDailyProfit >= 0 ? '+' : ''}{marketOverview.baseDailyProfit.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    <span className="text-xs font-normal text-slate-500 ml-1">BTC/d</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-1">
                    Net Margin: <span className="font-bold text-slate-800">{marketOverview.baseNetMarginPct.toFixed(1)}%</span>
                  </div>
                </div>

                {/* 2. Gross Daily Revenue */}
                <div className="bg-white p-4 border border-slate-200">
                  <div className="text-[11px] font-mono font-bold uppercase text-slate-500">
                    Gross Daily Revenue
                  </div>
                  <div className={`text-2xl font-black font-mono ${
                    marketOverview.totalBaseGrossRevenue > 0 ? 'text-emerald-600' : marketOverview.totalBaseGrossRevenue < 0 ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {marketOverview.totalBaseGrossRevenue > 0 ? '+' : ''}{marketOverview.totalBaseGrossRevenue.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    <span className="text-xs font-normal text-slate-500 ml-1">BTC/d</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-1">
                    From <span className="font-bold text-slate-800">{marketOverview.totalBaseDailyUnits.toFixed(0)} units</span> output
                  </div>
                </div>

                {/* 3. Raw Material Input Expense */}
                <div className="bg-white p-4 border border-slate-200">
                  <div className="text-[11px] font-mono font-bold uppercase text-slate-500">
                    Raw Material Costs (-)
                  </div>
                  <div className="text-2xl font-black font-mono text-red-500">
                    -{marketOverview.totalBaseRawExpense.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    <span className="text-xs font-normal text-slate-500 ml-1">BTC/d</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-1">
                    <span className="font-bold text-slate-800">{rawCostsBreakdown.mfgCount} manufacturing</span> facilities
                  </div>
                </div>

                {/* 4. Labor & Manager Wages */}
                <div className="bg-white p-4 border border-slate-200">
                  <div className="text-[11px] font-mono font-bold uppercase text-slate-500">
                    Salaries & Payroll (-)
                  </div>
                  <div className="text-2xl font-black font-mono text-red-500">
                    -{marketOverview.totalBaseLaborExpense.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    <span className="text-xs font-normal text-slate-500 ml-1">BTC/d</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-1">
                    <span className="font-bold text-slate-800">{activeWorkers.length} workers</span> • {activeManagers.length} mgrs
                  </div>
                </div>
              </div>

              {/* Primary Company P&L Statement with Raw Cost Calculations */}
              <div className="bg-white border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs font-bold font-mono text-slate-700 uppercase">
                    P&L Statement Per Company (With Raw Material Math)
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Net Profit = Gross Revenue - Raw Input Costs - Labor Salaries • Click company row to expand accounting math
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-600">
                        <th className="py-2.5 px-4 font-bold">Company</th>
                        <th className="py-2.5 px-3 font-bold">Commodity</th>
                        <th className="py-2.5 px-3 font-bold text-right">Finished Yield (units/day)</th>
                        <th className="py-2.5 px-3 font-bold text-right">Gross Revenue (BTC)</th>
                        <th className="py-2.5 px-3 font-bold text-right">Raw Costs (BTC)</th>
                        <th className="py-2.5 px-3 font-bold text-right">Salaries (BTC)</th>
                        <th className="py-2.5 px-3 font-bold text-center">Employees</th>
                        <th className="py-2.5 px-3 font-bold text-right">Net Profit / Day (BTC)</th>
                        <th className="py-2.5 px-4 font-bold text-right">Net Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {companies.map(c => {
                        const compId = c.id || c._id;
                        const isExpanded = expandedProfitCompanyId === compId;
                        const theme = getCompanyTheme(c);
                        const inputs = getCompanyRawInputs(c);
                        const isRaw = c.isRaw === true || c.recipe?.type === 'raw' || inputs.length === 0;
                        const disabled = isCompanyDisabled(c);
                        // Within the company calculations remain true and exact
                        const units = (c.baseUnits !== undefined ? c.baseUnits : (c.unitsPerDay || 0));
                        const finishedSpot = c.spotPrice || prices[c.itemCode] || 1.0;
                        const rev = (c.grossRevenue || (units * finishedSpot));

                        // Raw cost calculations for this facility
                        const rawDetails = inputs.map(inp => {
                          const ratio = inp.qty || 1;
                          const rawUnits = units * ratio;
                          const rawPrice = getRawMaterialPrice(inp.id, prices);
                          const cost = rawUnits * rawPrice;
                          const unitCost = ratio * rawPrice;
                          return {
                            rawId: inp.id,
                            rawName: RAW_MATERIAL_NAMES[inp.id] || inp.id,
                            ratio,
                            rawUnits,
                            rawPrice,
                            cost,
                            unitCost
                          };
                        });
                        const rawCost = isRaw ? 0 : (c.dailyRawExpenseTotal !== undefined ? c.dailyRawExpenseTotal : rawDetails.reduce((s, r) => s + r.cost, 0));
                        const sal = (c.dailyLaborExpense || 0);
                        const net = (c.baseNetProfit !== undefined ? c.baseNetProfit : (rev - rawCost - sal));
                        const margin = rev > 0 ? (net / rev) * 100 : 0;
                        const workersCount = (c.workersList || c.workers || c.employees || []).length;

                        return (
                          <React.Fragment key={compId}>
                            <tr 
                              onClick={() => setExpandedProfitCompanyId(isExpanded ? null : compId)}
                              className={`cursor-pointer transition-colors ${disabled ? 'opacity-60 saturate-40 bg-slate-100/90 text-slate-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]' : theme.rowGradient} ${isExpanded ? 'font-semibold' : ''}`}
                              title="Click to view detailed P&L & raw material cost calculation"
                            >
                              <td className="py-2.5 px-4 font-bold text-slate-900 font-sans">
                                <div className="flex items-center space-x-2">
                                  <span className={`text-[10px] font-mono transition-transform duration-150 inline-block ${isExpanded ? `rotate-90 ${theme.accentText} font-black` : 'text-slate-400'}`}>
                                    ▶
                                  </span>
                                  {disabled && <span className="text-xs shrink-0 select-none" title="Company Disabled">💔</span>}
                                  <span className="hover:underline">{c.name}</span>
                                  {disabled && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-200 border border-slate-300 text-slate-800 text-[9px] font-mono font-bold uppercase rounded shrink-0 shadow-2xs" title="Company Disabled">
                                      <span>💔</span>
                                      <span>Disabled</span>
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold shadow-xs ${theme.pillTag}`}>
                                  {c.recipe?.name || c.itemCode}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-black text-slate-800">
                                {disabled ? '0.0' : units.toFixed(1)}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className={`font-bold font-mono ${disabled ? 'text-slate-400' : (rev > 0 ? 'text-emerald-600' : rev < 0 ? 'text-red-600' : 'text-blue-600')}`}>
                                  {disabled ? '0.0' : (rev > 0 ? `+${rev.toFixed(1)}` : rev < 0 ? rev.toFixed(1) : '0.0')}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  @{finishedSpot.toFixed(3)} BTC
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {isRaw ? (
                                  <span className="font-bold text-slate-400 font-mono">—</span>
                                ) : disabled ? (
                                  <span className="font-bold text-slate-400 font-mono">0.0</span>
                                ) : (
                                  <div>
                                    <div className="font-bold text-red-500 font-mono">
                                      {rawCost > 0 ? `-${rawCost.toFixed(1)}` : '0.0'}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono">
                                      {rawDetails.map(r => `${r.rawUnits.toFixed(1)} ${r.rawName} @ ${r.rawPrice.toFixed(3)}`).join(' + ')}
                                    </div>
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className={`font-bold font-mono ${disabled ? 'text-slate-400' : (sal > 0 ? 'text-red-500' : 'text-blue-500')}`}>
                                  {disabled ? '0.0' : (sal > 0 ? `-${sal.toFixed(1)}` : '0.0')}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold font-mono text-slate-800">
                                {workersCount + (c.hasManager ? 1 : 0)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-black">
                                <span className={disabled ? 'text-slate-400' : (net > 0 ? 'text-emerald-700' : net < 0 ? 'text-red-600' : 'text-blue-600')}>
                                  {disabled ? '0.0' : (net > 0 ? `+${net.toFixed(1)}` : net < 0 ? net.toFixed(1) : '0.0')}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-right font-bold">
                                <span className={disabled ? 'text-slate-400' : (margin > 0 ? 'text-emerald-700' : margin < 0 ? 'text-red-600' : 'text-blue-600')}>
                                  {disabled ? '—' : `${margin.toFixed(1)}%`}
                                </span>
                              </td>
                            </tr>

                            {/* Inline Expandable P&L & Raw Cost Audit Card */}
                            {isExpanded && (
                              <tr className={`border-b-2 ${theme.accentBorder}`}>
                                <td colSpan={8} className="p-3.5 sm:p-5">
                                  <div className={`bg-white border ${theme.cardBorder} p-4 sm:p-5 space-y-4 shadow-md relative overflow-hidden rounded-xl`}>
                                    {/* Top Product Theme Accent Strip */}
                                    <div className="absolute top-0 inset-x-0 h-1.5" style={{ backgroundColor: theme.accentColor }} />

                                    {/* Header */}
                                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 ${theme.cardHeaderBg} -mx-4 -mt-4 p-4 sm:-mx-5 sm:-mt-5 sm:p-5`}>
                                      <div>
                                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                          <span className="text-base font-extrabold text-slate-900 font-sans">
                                            {c.name}
                                          </span>
                                          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 font-bold rounded shadow-xs ${theme.pillTag}`}>
                                            {c.recipe?.name || c.itemCode} • {theme.label}
                                          </span>
                                          <span className="text-xs font-mono font-bold text-slate-600">
                                            Engine Lv.{c.engineLevel || 1} • Storage Lv.{c.storageLevel || 1}
                                          </span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-sans mt-0.5">
                                          Unit Economics, Raw Material Recipe Calculations & Net Profit Math
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setExpandedProfitCompanyId(null);
                                        }}
                                        className="px-2 py-1 text-xs font-mono font-bold text-slate-400 hover:text-slate-700 transition cursor-pointer self-start sm:self-auto"
                                      >
                                        Collapse ✕
                                      </button>
                                    </div>

                                    {/* 4 Math Audit Pillars */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                      {/* Pillar 1: Gross Revenue Calculation */}
                                      <div className="bg-emerald-50/60 p-3.5 border border-emerald-200/80 rounded-xl space-y-2 font-mono text-xs">
                                        <div className="text-[11px] font-bold text-emerald-900 uppercase flex items-center justify-between">
                                          <span>1. Revenue Math</span>
                                          <span className="text-emerald-700 font-normal">Gross</span>
                                        </div>
                                        <div className="space-y-1 text-slate-600">
                                          <div className="flex justify-between">
                                            <span>Daily Output:</span>
                                            <strong className="text-slate-900 font-bold">{units.toFixed(2)} units/d</strong>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Market Spot Price:</span>
                                            <strong className="text-emerald-700 font-bold">{finishedSpot.toFixed(3)} BTC</strong>
                                          </div>
                                          <div className="flex justify-between pt-1 border-t border-emerald-200 text-slate-900 font-bold">
                                            <span>Gross Revenue:</span>
                                            <strong className="text-emerald-800 font-black">+{rev.toFixed(2)} BTC/d</strong>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Pillar 2: Raw Material Cost Calculation */}
                                      <div className={`p-3.5 border rounded-xl space-y-2 font-mono text-xs ${isRaw ? 'bg-slate-50 border-slate-200' : 'bg-rose-50/60 border-rose-200/80'}`}>
                                        <div className="text-[11px] font-bold text-slate-800 uppercase flex items-center justify-between">
                                          <span>2. Raw Input Math</span>
                                          <span className="text-slate-500 font-normal">{isRaw ? 'Extraction' : 'Recipe'}</span>
                                        </div>
                                        {isRaw ? (
                                          <div className="space-y-1 text-slate-600">
                                            <div className="text-slate-700 font-medium pt-1">
                                              Raw extraction facility.
                                            </div>
                                            <div className="text-[11px] text-slate-500">
                                              Zero upstream material input required.
                                            </div>
                                            <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-900 font-bold">
                                              <span>Raw Expense:</span>
                                              <strong className="text-slate-600 font-bold">0.00 BTC/d</strong>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="space-y-1 text-slate-600">
                                            {rawDetails.map((r, rIdx) => (
                                              <div key={rIdx} className="space-y-0.5 pb-1 border-b border-rose-200/60 last:border-b-0 last:pb-0">
                                                <div className="flex justify-between text-slate-800 font-bold">
                                                  <span>{r.rawName}:</span>
                                                  <span>{r.ratio}x ratio</span>
                                                </div>
                                                <div className="flex justify-between text-[11px]">
                                                  <span>Consumption:</span>
                                                  <strong className="text-slate-900">{r.rawUnits.toFixed(1)} u/d</strong>
                                                </div>
                                                <div className="flex justify-between text-[11px]">
                                                  <span>Spot Price:</span>
                                                  <strong className="text-rose-700">@{r.rawPrice.toFixed(3)} BTC</strong>
                                                </div>
                                                <div className="flex justify-between text-[11px]">
                                                  <span>Unit Raw Burden:</span>
                                                  <strong className="text-rose-700">{r.unitCost.toFixed(3)} BTC/u</strong>
                                                </div>
                                              </div>
                                            ))}
                                            <div className="flex justify-between pt-1 border-t border-rose-200 text-slate-900 font-bold">
                                              <span>Total Raw Outflow:</span>
                                              <strong className="text-red-600 font-black">-{rawCost.toFixed(2)} BTC/d</strong>
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {/* Pillar 3: Salaries & Payroll Calculation */}
                                      <div className="bg-slate-50 p-3.5 border border-slate-200/80 rounded-xl space-y-2 font-mono text-xs">
                                        <div className="text-[11px] font-bold text-slate-700 uppercase flex items-center justify-between">
                                          <span>3. Labor & Salaries</span>
                                          <span className="text-slate-400 font-normal">Payroll</span>
                                        </div>
                                        <div className="space-y-1 text-slate-600">
                                          <div className="flex justify-between">
                                            <span>Hired Line Workers:</span>
                                            <strong className="text-slate-900 font-bold">{workersCount} employees</strong>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Manager Contract:</span>
                                            <strong className="text-slate-900 font-bold">{c.hasManager ? `Lv.${c.manager?.managementLevel || 1}` : 'None'}</strong>
                                          </div>
                                          <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-900 font-bold">
                                            <span>Daily Salaries Paid:</span>
                                            <strong className="text-red-600 font-black">-{sal.toFixed(2)} BTC/d</strong>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Pillar 4: Value-Add & Net Profit Math */}
                                      <div className="bg-blue-50/60 p-3.5 border border-blue-200/80 rounded-xl space-y-2 font-mono text-xs">
                                        <div className="text-[11px] font-bold text-blue-900 uppercase flex items-center justify-between">
                                          <span>4. Net Operating Profit</span>
                                          <span className="text-blue-700 font-normal">Bottom Line</span>
                                        </div>
                                        <div className="space-y-1 text-slate-600">
                                          <div className="flex justify-between">
                                            <span>Value-Add Margin:</span>
                                            <strong className="text-blue-900 font-bold">+{(rev - rawCost).toFixed(2)} BTC/d</strong>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Net Operating Margin:</span>
                                            <strong className={`font-bold ${margin >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{margin.toFixed(1)}%</strong>
                                          </div>
                                          <div className="flex justify-between pt-1 border-t border-blue-200 text-slate-900 font-bold">
                                            <span>Net Daily Profit:</span>
                                            <strong className={`font-black text-sm ${net >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                              {net >= 0 ? '+' : ''}{net.toFixed(2)} BTC/d
                                            </strong>
                                          </div>
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
                        <td className="py-3 px-4" colSpan={3}>
                          TOTAL BASE DAILY PROFIT
                        </td>
                        <td className={`py-3 px-3 text-right font-bold ${
                          marketOverview.totalBaseGrossRevenue > 0 ? 'text-emerald-600' : marketOverview.totalBaseGrossRevenue < 0 ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {marketOverview.totalBaseGrossRevenue > 0 ? `+${marketOverview.totalBaseGrossRevenue.toFixed(1)}` : '0.0'}
                        </td>
                        <td className={`py-3 px-3 text-right font-bold ${marketOverview.totalBaseRawExpense > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                          {marketOverview.totalBaseRawExpense > 0 ? `-${marketOverview.totalBaseRawExpense.toFixed(1)}` : '0.0'}
                        </td>
                        <td className={`py-3 px-3 text-right font-bold ${marketOverview.totalBaseLaborExpense > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                          {marketOverview.totalBaseLaborExpense > 0 ? `-${marketOverview.totalBaseLaborExpense.toFixed(1)}` : '0.0'}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-800 font-bold">
                          {activeWorkers.length + activeManagers.length}
                        </td>
                        <td className={`py-3 px-3 text-right text-sm font-black ${
                          marketOverview.baseDailyProfit > 0 ? 'text-emerald-700' : marketOverview.baseDailyProfit < 0 ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {marketOverview.baseDailyProfit >= 0 ? '+' : ''}{marketOverview.baseDailyProfit.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </td>
                        <td className={`py-3 px-4 text-right font-bold ${
                          marketOverview.baseNetMarginPct > 0 ? 'text-emerald-700' : marketOverview.baseNetMarginPct < 0 ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {marketOverview.baseNetMarginPct.toFixed(1)}%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Dedicated Manufacturing Raw Material Cost Calculations Ledger */}
              {rawCostsBreakdown.items.length > 0 && (
                <div className="bg-white border border-slate-200 overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs font-bold font-mono text-slate-700 uppercase">
                      Manufacturing Raw Material Input Calculations & Cost Share
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Formula: Finished Units × Input Ratio = Raw Units Needed • Raw Units × Spot Price = Daily Raw Expense
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-600">
                          <th className="py-2.5 px-4 font-bold">Facility</th>
                          <th className="py-2.5 px-3 font-bold">Commodity</th>
                          <th className="py-2.5 px-3 font-bold text-right">Daily Output</th>
                          <th className="py-2.5 px-3 font-bold">Raw Input</th>
                          <th className="py-2.5 px-3 font-bold text-center">Recipe Ratio</th>
                          <th className="py-2.5 px-3 font-bold text-right">Raw Units Needed</th>
                          <th className="py-2.5 px-3 font-bold text-right">Raw Spot Price</th>
                          <th className="py-2.5 px-3 font-bold text-right">Raw Cost / Finished Unit</th>
                          <th className="py-2.5 px-3 font-bold text-right">Daily Raw Expense</th>
                          <th className="py-2.5 px-4 font-bold text-right">Cost Share %</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono">
                        {rawCostsBreakdown.items.map((item, idx) => {
                          const costShare = rawCostsBreakdown.totalDailyExpense > 0 
                            ? (item.dailyRawCost / rawCostsBreakdown.totalDailyExpense) * 100 
                            : 0;
                          const unitRawCost = item.qtyPerUnit * item.rawPrice;
                          return (
                            <tr key={`raw-calc-${item.companyId}-${idx}`} className={`transition-colors ${item.theme.rowGradient}`}>
                              <td className="py-2.5 px-4 font-bold text-slate-900 font-sans">
                                {item.companyName}
                              </td>
                              <td className="py-2.5 px-3 capitalize">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold shadow-xs ${item.theme.pillTag}`}>
                                  {item.outputName}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-black text-slate-800">
                                {item.unitsProduced.toFixed(1)} u/d
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-800 capitalize font-sans">
                                {item.rawName}
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold text-slate-600">
                                {item.qtyPerUnit}x
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-blue-900">
                                {item.rawUnitsNeeded.toFixed(1)} u/d
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                                {item.rawPrice.toFixed(3)} BTC
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                                {unitRawCost.toFixed(3)} BTC/u
                              </td>
                              <td className="py-2.5 px-3 text-right font-black text-red-500">
                                -{item.dailyRawCost.toFixed(2)} BTC
                              </td>
                              <td className="py-2.5 px-4 text-right font-bold text-slate-700">
                                {costShare.toFixed(1)}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-300 bg-slate-50 font-mono font-black text-slate-900">
                          <td className="py-3 px-4" colSpan={5}>
                            TOTAL MANUFACTURING RAW MATERIAL EXPENSE
                          </td>
                          <td className="py-3 px-3 text-right text-blue-900">
                            {rawCostsBreakdown.totalRawUnits.toFixed(1)} u/d
                          </td>
                          <td className="py-3 px-3 text-right text-slate-400">-</td>
                          <td className="py-3 px-3 text-right text-slate-400">-</td>
                          <td className="py-3 px-3 text-right text-red-500 text-sm">
                            -{rawCostsBreakdown.totalDailyExpense.toFixed(2)} BTC
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
                        <th className="py-2.5 px-3 font-bold">Commodity</th>
                        <th className="py-2.5 px-3 font-bold text-center">Recipe PP</th>
                        <th className="py-2.5 px-3 font-bold text-right">Base PP/Day</th>
                        <th className="py-2.5 px-3 font-bold text-right">Daily Units Produced/Day</th>
                        <th className="py-2.5 px-4 font-bold text-right">Output Share</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {companies.map(c => {
                        const theme = getCompanyTheme(c);
                        const disabled = isCompanyDisabled(c);
                        const recipePp = c.recipe?.pp || 1;
                        const basePp = c.companyBaseDailyPp || 0;
                        const units = c.baseUnits || 0;
                        // Operational output share excludes disabled facilities
                        const sharePct = !disabled && marketOverview.totalBaseDailyUnits > 0 ? (units / marketOverview.totalBaseDailyUnits) * 100 : 0;
                        return (
                          <tr key={c.id || c._id} className={`transition-colors ${disabled ? 'opacity-60 saturate-40 bg-slate-100/90 text-slate-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]' : theme.rowGradient}`}>
                            <td className="py-2.5 px-4 font-bold text-slate-900 font-sans">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {disabled && <span className="text-xs shrink-0 select-none" title="Company Disabled">💔</span>}
                                <span>{c.name}</span>
                                {disabled && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-200 border border-slate-300 text-slate-800 text-[9px] font-mono font-bold uppercase rounded shrink-0 shadow-2xs" title="Company Disabled">
                                    <span>💔</span>
                                    <span>Disabled</span>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold shadow-xs ${theme.pillTag}`}>
                                {c.recipe?.name || c.itemCode}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-600">
                              {recipePp} PP
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                              {disabled ? '0.0' : basePp.toFixed(1)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-slate-900">
                              {disabled ? '0.0' : units.toFixed(1)}
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold text-slate-800">
                              {disabled ? (
                                <span className="text-slate-400 font-mono text-[11px]" title="Disabled company excluded from operational output share">0.0%</span>
                              ) : (
                                `${sharePct.toFixed(1)}%`
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-300 bg-slate-50 font-mono font-black text-slate-900">
                        <td className="py-3 px-4" colSpan={4}>
                          TOTAL BASE DAILY PRODUCTION
                        </td>
                        <td className="py-3 px-3 text-right text-slate-900 text-sm">
                          {marketOverview.totalBaseDailyUnits.toFixed(1)}
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
                        <th className="py-2.5 px-4 font-bold text-right">Effective Daily Engine PP</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {companies.map(c => {
                        const theme = getCompanyTheme(c);
                        const disabled = isCompanyDisabled(c);
                        const pph = disabled ? 0 : (c.engineTier?.ppPerHour || c.engineLevel || 1);
                        const base24h = disabled ? 0 : (pph * 24);
                        const eff24h = disabled ? 0 : (c.engineProducedDailyPp || (base24h * (c.bonusMultiplier || 1.0)));
                        return (
                          <tr key={`engine-${c.id || c._id}`} className={`transition-colors ${disabled ? 'opacity-60 saturate-40 bg-slate-100/90 text-slate-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]' : theme.rowGradient}`}>
                            <td className="py-2.5 px-4 font-bold text-slate-900 font-sans">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold shadow-xs ${theme.pillTag}`}>
                                  {c.recipe?.name || c.itemCode}
                                </span>
                                {disabled && <span className="text-xs shrink-0 select-none" title="Company Disabled">💔</span>}
                                <span>{c.name}</span>
                                {disabled && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-200 border border-slate-300 text-slate-800 text-[9px] font-mono font-bold uppercase rounded shrink-0 shadow-2xs" title="Company Disabled">
                                    <span>💔</span>
                                    <span>Disabled</span>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-700">Lv.{c.engineLevel || 1}</td>
                            <td className="py-2.5 px-3 text-right text-slate-700">{pph} PP/h</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-800">{base24h.toFixed(1)} PP</td>
                            <td className="py-2.5 px-4 text-right font-black text-slate-900">{eff24h.toFixed(1)} PP</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-300 bg-slate-50 font-mono font-bold text-slate-900">
                        <td className="py-3 px-4" colSpan={3}>Automated Engines Subtotal</td>
                        <td className="py-3 px-3 text-right">{companies.filter(c => !isCompanyDisabled(c)).reduce((s, c) => s + (c.engineBaseDailyPp || ((c.engineTier?.ppPerHour || 1) * 24)), 0).toFixed(1)} PP</td>
                        <td className="py-3 px-4 text-right text-slate-900 font-black">{companies.filter(c => !isCompanyDisabled(c)).reduce((s, c) => s + (c.engineProducedDailyPp || 0), 0).toFixed(1)} PP</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* 2. Hired Workforce PP Generation */}
              <div className="bg-white border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-slate-700 uppercase">
                    2. Hired Workforce PP Generation ({activeWorkers.length} Active Employees)
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
                    <tbody className="font-mono">
                      {companies.map(c => {
                        const count = (c.workersList || c.workers || []).length;
                        const disabled = isCompanyDisabled(c);
                        const baseLabor = disabled ? 0 : (c.workersBaseDailyPp || 0);
                        const prodLabor = disabled ? 0 : (c.workersProducedDailyPp || 0);
                        const theme = getCompanyTheme(c);
                        return (
                          <tr key={`labor-${c.id || c._id}`} className={`transition-colors ${disabled ? 'opacity-60 saturate-40 bg-slate-100/90 text-slate-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]' : theme.rowGradient}`}>
                            <td className="py-2.5 px-4 font-bold text-slate-900 font-sans">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold shadow-xs ${theme.pillTag}`}>
                                  {c.recipe?.name || c.itemCode}
                                </span>
                                {disabled && <span className="text-xs shrink-0 select-none" title="Company Disabled">💔</span>}
                                <span>{c.name}</span>
                                {disabled && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-200 border border-slate-300 text-slate-800 text-[9px] font-mono font-bold uppercase rounded shrink-0 shadow-2xs" title="Company Disabled">
                                    <span>💔</span>
                                    <span>Disabled</span>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-700 font-bold">{count} workers</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-800">{baseLabor.toFixed(1)} PP</td>
                            <td className="py-2.5 px-4 text-right font-black text-slate-900">{prodLabor.toFixed(1)} PP</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-300 bg-slate-50 font-mono font-bold text-slate-900">
                        <td className="py-3 px-4" colSpan={2}>Hired Labor Subtotal ({activeWorkers.length} active workers)</td>
                        <td className="py-3 px-3 text-right">{companies.filter(c => !isCompanyDisabled(c)).reduce((s, c) => s + (c.workersBaseDailyPp || 0), 0).toFixed(1)} PP</td>
                        <td className="py-3 px-4 text-right text-slate-900 font-black">{companies.filter(c => !isCompanyDisabled(c)).reduce((s, c) => s + (c.workersProducedDailyPp || 0), 0).toFixed(1)} PP</td>
                      </tr>
                    </tfoot>
                  </table>
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
                    <tbody className="font-mono">
                      {companies.map(c => {
                        const workers = c.workersList || c.workers || [];
                        const count = workers.length;
                        const disabled = isCompanyDisabled(c);
                        const dailyPp = disabled ? 0 : (c.workersProducedDailyPp || c.workersBaseDailyPp || 0);
                        const dailyWage = disabled ? 0 : (c.dailyLaborExpense || 0);
                        const costPerPp = (!disabled && dailyPp > 0) ? (dailyWage / dailyPp) : 0;
                        const theme = getCompanyTheme(c);
                        return (
                          <tr key={c.id || c._id} className={`transition-colors ${disabled ? 'opacity-60 saturate-40 bg-slate-100/90 text-slate-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]' : theme.rowGradient}`}>
                            <td className="py-2.5 px-4 font-bold text-slate-900 font-sans">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold shadow-xs ${theme.pillTag}`}>
                                  {c.recipe?.name || c.itemCode}
                                </span>
                                {disabled && <span className="text-xs shrink-0 select-none" title="Company Disabled">💔</span>}
                                <span>{c.name}</span>
                                {disabled && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-200 border border-slate-300 text-slate-800 text-[9px] font-mono font-bold uppercase rounded shrink-0 shadow-2xs" title="Company Disabled">
                                    <span>💔</span>
                                    <span>Disabled</span>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${count > 0 ? theme.badgeBg : 'bg-slate-100 text-slate-500'}`}>
                                {count} emps
                              </span>
                              {c.hasManager && (
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 font-bold text-[9px] block mt-1 rounded" title={`Manager Lv.${c.manager?.managementLevel || 1}`}>
                                  Mgr Lv.{c.manager?.managementLevel || 1}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-sans">
                              {count > 0 ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {workers.map((w, wIdx) => {
                                    const fullWorker = allWorkers.find(aw => (aw.id && aw.id === w.id) || aw.username === w.username)
                                      || { ...w, companyName: c.name, companyItemCode: c.itemCode, companyTotalBonusPct: c.totalBonusPct, recipe: c.recipe, spotPrice: c.spotPrice };
                                    const isFemale = fullWorker.gender === 'female';
                                    return (
                                      <button 
                                        key={w.id || wIdx}
                                        type="button"
                                        onClick={() => setInspectedWorker(fullWorker)}
                                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold transition cursor-pointer rounded border ${theme.badgeBg} hover:opacity-85 shadow-xs`}
                                        title="Click to view detailed employee skills & salary math audit"
                                      >
                                        <Bot className={`w-3.5 h-3.5 ${isFemale ? 'text-pink-500' : 'text-blue-500'}`} />
                                        <span>{w.username}</span>
                                        <span className="text-[9px] opacity-60">↗</span>
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
                          {activeWorkers.length} active employee contracts across {companies.filter(c => !isCompanyDisabled(c)).length} active facilities
                        </td>
                        <td className="py-3 px-3 text-right text-slate-900">
                          {companies.filter(c => !isCompanyDisabled(c)).reduce((s, c) => s + (c.workersProducedDailyPp || c.workersBaseDailyPp || 0), 0).toFixed(1)} PP
                        </td>
                        <td className="py-3 px-3 text-right text-red-500 text-sm">
                          -{marketOverview.totalBaseLaborExpense.toFixed(2)} BTC
                        </td>
                        <td className="py-3 px-4 text-right text-slate-900">
                          {(marketOverview.totalBaseLaborExpense / (companies.filter(c => !isCompanyDisabled(c)).reduce((s, c) => s + (c.workersProducedDailyPp || c.workersBaseDailyPp || 0), 0) || 1)).toFixed(3)} BTC
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center justify-end text-xs text-slate-500 font-mono">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer rounded-lg shadow-xs"
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
