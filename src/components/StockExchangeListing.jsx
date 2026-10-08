import React, { useState, useMemo, useEffect } from 'react';
import { 
  RotateCw, 
  ChevronRight, 
  CheckCircle2,
  Users,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  Layers,
  Sliders,
  Table,
  Building2,
  Cpu,
  Coins,
  X
} from 'lucide-react';
import ItemIcon from './ItemIcon';
import MetricBreakdownModal from './MetricBreakdownModal';
import { api } from '../services/wareraApi';
import { RECIPES } from '../data/gameData';

const PIPELINE_META = {
  iron: { name: 'Metallurgy Pipeline', rawName: 'Iron', endName: 'Steel', endCode: 'steel' },
  limestone: { name: 'Construction Pipeline', rawName: 'Limestone', endName: 'Concrete', endCode: 'concrete' },
  grain: { name: 'Farming & Food Pipeline', rawName: 'Grain', endName: 'Bread', endCode: 'bread' },
  livestock: { name: 'Livestock & Meat Pipeline', rawName: 'Livestock', endName: 'Steak', endCode: 'steak' },
  fish: { name: 'Fisheries Pipeline', rawName: 'Fish', endName: 'Cooked Fish', endCode: 'cookedFish' },
  lead: { name: 'Munitions Pipeline', rawName: 'Lead', endName: 'Ammunition', endCode: 'ammo' },
  petroleum: { name: 'Petroleum & Energy Pipeline', rawName: 'Petroleum', endName: 'Refined Oil', endCode: 'oil' },
  coca: { name: 'Pharmaceutical Pipeline', rawName: 'Coca Plant', endName: 'Combat Pill', endCode: 'pill' },
  mysteriousPlant: { name: 'Pharmaceutical Pipeline', rawName: 'Mysterious Plant', endName: 'Combat Pill', endCode: 'pill' },
  wood: { name: 'Forestry & Paper Pipeline', rawName: 'Wood', endName: 'Paper', endCode: 'paper' },
};

export default function StockExchangeListing({
  companies = [],
  user = null,
  dossier = null,
  portfolioTotals = {},
  ownerLabor = {},
  supplyChainLedger = [],
  prices = {},
  priceChanges24h = {},
  onSelectCompany,
  onRefreshLive,
  isRefreshingLive = false,
  managementLevel = 0,
  maxHiringSlots = 4
}) {
  const [sectorFilter, setSectorFilter] = useState('all'); // 'all' | 'raw' | 'processed'
  const [activeBreakdownMetric, setActiveBreakdownMetric] = useState(null); // 'valuation' | 'revenue' | 'rawCosts' | 'salaries' | 'profit' | 'production' | 'pp' | 'staff' | null
  const [activeLaborSheet, setActiveLaborSheet] = useState('even'); // 'even' | 'custom' | 'focused'
  const [customSplits, setCustomSplits] = useState({});
  const [auditCompanyId, setAuditCompanyId] = useState(null);

  const auditedCompany = useMemo(() => {
    if (!auditCompanyId) return null;
    return companies.find(c => (c.id || c._id) === auditCompanyId) || null;
  }, [companies, auditCompanyId]);

  // Factual mathematical breakdown for selected company (Personal Labor self-work primary, base secondary, combined total)
  const auditedCompanyDetails = useMemo(() => {
    if (!auditedCompany) return null;
    const c = auditedCompany;
    const recipe = c.recipe || RECIPES.find(r => r.id === c.itemCode) || { id: c.itemCode, name: c.itemCode, pp: 1, type: 'raw', inputs: [] };
    const recipePp = recipe.pp || 1;
    const isRaw = c.isRaw !== undefined ? c.isRaw : (recipe.type === 'raw' || !recipe.inputs || recipe.inputs.length === 0);
    const spotPrice = c.spotPrice || prices[c.itemCode] || 1.0;
    const recipeInputs = isRaw ? [] : (recipe.inputs || []).map(inp => {
      const price = prices[inp.id] || 0;
      return {
        id: inp.id,
        name: inp.name || inp.id,
        qty: inp.qty,
        unitMarketPrice: price,
        unitCost: inp.qty * price
      };
    });
    const unitRawCost = isRaw ? 0 : recipeInputs.reduce((sum, inp) => sum + inp.unitCost, 0);

    const strategicBonus = c.strategicBonus ?? c.productionBonusData?.strategicBonus ?? 0;
    const depositBonus = c.depositBonusPct ?? c.productionBonusData?.depositBonus ?? 0;
    const ethicBonus = c.ethicBonusPct ?? c.productionBonusData?.ethicSpecializationBonus ?? 0;
    const totalBonusPct = typeof c.totalBonusPct === 'number' ? c.totalBonusPct : (strategicBonus + depositBonus + ethicBonus);
    const appliedMultiplier = typeof c.bonusMultiplier === 'number' ? c.bonusMultiplier : (1 + (totalBonusPct * 0.91 / 100));

    // 1. OWNER SELF-WORK METRICS (PRIMARY AUDIT FOCUS)
    const energyStamina = ownerLabor?.entreMax || (user?.skills?.energy ? (30 + user.skills.energy.level * 10) : 30);
    const dailySessions = typeof ownerLabor?.dailySessions === 'number' && ownerLabor.dailySessions > 0
      ? ownerLabor.dailySessions
      : Number((energyStamina * 0.24).toFixed(2));
    const readySessions = typeof ownerLabor?.readySessions === 'number'
      ? ownerLabor.readySessions
      : Math.floor((ownerLabor?.entreCurrent || 0) / 10);
    const prodSkillLevel = user?.skills?.production?.level ?? 0;
    const playerBasePp = typeof ownerLabor?.ppPerSession === 'number' && ownerLabor.ppPerSession > 0
      ? ownerLabor.ppPerSession
      : (user?.skills?.production ? (user.skills.production.total || user.skills.production.value || 10 + prodSkillLevel * 3) : 10);

    const selfWorkPpPerHit = Number((playerBasePp * appliedMultiplier).toFixed(2));
    const selfWorkUnitsPerHit = Number((selfWorkPpPerHit / recipePp).toFixed(3));
    const selfWorkNetPerHit = Number((selfWorkUnitsPerHit * (spotPrice - unitRawCost)).toFixed(3));

    // 100% Focused Daily Allocation
    const selfWorkDailyPp = Number((dailySessions * selfWorkPpPerHit).toFixed(1));
    const selfWorkDailyUnits = Number((selfWorkDailyPp / recipePp).toFixed(2));
    const selfWorkGrossRevenue = Number((selfWorkDailyUnits * spotPrice).toFixed(2));
    const selfWorkRawCost = isRaw ? 0 : Number((selfWorkDailyUnits * unitRawCost).toFixed(2));
    const selfWorkNetValue = Number((selfWorkGrossRevenue - selfWorkRawCost).toFixed(2));
    const selfWorkMarginPct = selfWorkGrossRevenue > 0 ? (selfWorkNetValue / selfWorkGrossRevenue) * 100 : 100;

    // Active schedule allocation (Even or Custom)
    let activeSessions = dailySessions;
    let activeAllocationLabel = '100% Focused Allocation';
    if (activeLaborSheet === 'even') {
      activeSessions = Number((dailySessions / (companies.length || 1)).toFixed(2));
      activeAllocationLabel = `Even Distribution (${activeSessions.toFixed(1)} hits/day)`;
    } else if (activeLaborSheet === 'custom') {
      const customPct = typeof customSplits[c.id] === 'number' ? customSplits[c.id] : (100 / (companies.length || 1));
      activeSessions = Number(((customPct / 100) * dailySessions).toFixed(2));
      activeAllocationLabel = `Custom Allocation (${customPct.toFixed(1)}% • ${activeSessions.toFixed(1)} hits/day)`;
    }
    const activeUnits = Number(((activeSessions * selfWorkPpPerHit) / recipePp).toFixed(2));
    const activeGross = Number((activeUnits * spotPrice).toFixed(2));
    const activeRawCost = isRaw ? 0 : Number((activeUnits * unitRawCost).toFixed(2));
    const activeNet = Number((activeGross - activeRawCost).toFixed(2));

    // 2. BASE OPERATIONS (HARDWARE ENGINE + HIRED WORKFORCE)
    const engineLevel = c.engineLevel || 1;
    const storageLevel = c.storageLevel || 1;
    const engineBasePph = c.engineTier?.ppPerHour || engineLevel;
    const engineBaseDailyPp = engineBasePph * 24;
    const engineDeliveredDailyPp = Number((engineBaseDailyPp * appliedMultiplier).toFixed(1));
    const engineDailyUnits = Number((engineDeliveredDailyPp / recipePp).toFixed(2));
    const storageCapacityPp = c.storageCapacityPp || (storageLevel * 200);

    const rawWorkers = c.enrichedWorkers || c.workersList || c.workers || [];
    const normalizedWorkers = rawWorkers.map((w, idx) => {
      const wEnergySkill = typeof w.energySkill === 'number' ? w.energySkill : 0;
      const wEnergyStamina = w.energyStamina || w.energyPointsTotal || (30 + wEnergySkill * 10);
      const wDailySessions = typeof w.dailySessions === 'number' && w.dailySessions > 0
        ? w.dailySessions
        : (typeof w.workSessionsPerDay === 'number' && w.workSessionsPerDay > 0
            ? w.workSessionsPerDay
            : Number((wEnergyStamina * 0.24).toFixed(2)));

      const wProdSkill = typeof w.productionSkill === 'number' ? w.productionSkill : 0;
      const wBasePp = w.basePp || w.productionPointsBase || (wProdSkill > 10 ? wProdSkill : 10 + wProdSkill * 3);
      const wFidelity = typeof w.fidelity === 'number' ? w.fidelity : (typeof w.loyaltyBonus === 'number' ? w.loyaltyBonus : 0);
      const wDevPct = typeof w.devPct === 'number' ? w.devPct : (typeof c.regionData?.development === 'number' ? c.regionData.development : 4.88);
      const wIncomeTaxPct = typeof w.incomeTaxPct === 'number' ? w.incomeTaxPct : (typeof c.incomeTaxPct === 'number' ? c.incomeTaxPct : 9.0);

      const laborMultiplier = (1 + (wFidelity / 100)) * (1 + (wDevPct / 100));
      const laborPpPerHit = typeof w.laborPpPerHit === 'number'
        ? w.laborPpPerHit
        : Number((wBasePp * laborMultiplier).toFixed(2));
      const producedPpPerHit = typeof w.producedPpPerHit === 'number'
        ? w.producedPpPerHit
        : Number((laborPpPerHit * appliedMultiplier).toFixed(2));

      const dailyLaborPp = typeof w.dailyLaborPp === 'number' && w.dailyLaborPp > 0
        ? w.dailyLaborPp
        : Number((wDailySessions * laborPpPerHit).toFixed(1));
      const dailyProducedPp = typeof w.dailyProducedPp === 'number' && w.dailyProducedPp > 0
        ? w.dailyProducedPp
        : (typeof w.dailyPp === 'number' && w.dailyPp > 0
            ? w.dailyPp
            : Number((wDailySessions * producedPpPerHit).toFixed(1)));

      const wageRate = typeof w.wageRate === 'number'
        ? w.wageRate
        : (typeof w.wagePerPp === 'number' ? w.wagePerPp : (typeof w.wage === 'number' ? w.wage : 0.158));
      const grossWagePerHit = typeof w.grossWagePerHit === 'number'
        ? w.grossWagePerHit
        : Number((laborPpPerHit * wageRate).toFixed(3));
      const grossDailyWage = typeof w.grossDailyWage === 'number' && w.grossDailyWage > 0
        ? w.grossDailyWage
        : (typeof w.dailyWage === 'number' && w.dailyWage > 0
            ? w.dailyWage
            : Number((wDailySessions * grossWagePerHit).toFixed(2)));

      return {
        id: w.id || `w-${idx}`,
        username: w.username || `Worker #${idx + 1}`,
        level: w.level || 1,
        energyStamina: wEnergyStamina,
        dailySessions: wDailySessions,
        basePp: wBasePp,
        fidelity: wFidelity,
        devPct: wDevPct,
        laborMultiplier,
        laborPpPerHit,
        producedPpPerHit,
        dailyLaborPp,
        dailyProducedPp,
        wageRate,
        grossWagePerHit,
        grossDailyWage
      };
    });

    const workforceCount = normalizedWorkers.length;
    const workforceLaborPp = Number(normalizedWorkers.reduce((sum, w) => sum + w.dailyLaborPp, 0).toFixed(1));
    const workforceProducedPp = Number(normalizedWorkers.reduce((sum, w) => sum + w.dailyProducedPp, 0).toFixed(1));
    const workforceDailyPayroll = Number(normalizedWorkers.reduce((sum, w) => sum + w.grossDailyWage, 0).toFixed(2));

    const baseDeliveredDailyPp = Number((engineDeliveredDailyPp + workforceProducedPp).toFixed(1));
    const baseDailyUnits = Number((baseDeliveredDailyPp / recipePp).toFixed(2));
    const baseGrossRevenue = Number((baseDailyUnits * spotPrice).toFixed(2));
    const baseRawCost = isRaw ? 0 : Number((baseDailyUnits * unitRawCost).toFixed(2));
    const basePayroll = workforceDailyPayroll;
    const baseNetProfit = Number((baseGrossRevenue - baseRawCost - basePayroll).toFixed(2));
    const baseMarginPct = baseGrossRevenue > 0 ? (baseNetProfit / baseGrossRevenue) * 100 : 0;

    // 3. COMBINED FACILITY TOTAL (BASE + SELF-WORK)
    const combined100DeliveredPp = Number((baseDeliveredDailyPp + selfWorkDailyPp).toFixed(1));
    const combined100Units = Number((baseDailyUnits + selfWorkDailyUnits).toFixed(2));
    const combined100Gross = Number((combined100Units * spotPrice).toFixed(2));
    const combined100RawCost = isRaw ? 0 : Number((combined100Units * unitRawCost).toFixed(2));
    const combined100Payroll = basePayroll;
    const combined100Net = Number((combined100Gross - combined100RawCost - combined100Payroll).toFixed(2));
    const combined100MarginPct = combined100Gross > 0 ? (combined100Net / combined100Gross) * 100 : 0;

    const combinedActiveDeliveredPp = Number((baseDeliveredDailyPp + (activeUnits * recipePp)).toFixed(1));
    const combinedActiveUnits = Number((baseDailyUnits + activeUnits).toFixed(2));
    const combinedActiveGross = Number((combinedActiveUnits * spotPrice).toFixed(2));
    const combinedActiveRawCost = isRaw ? 0 : Number((combinedActiveUnits * unitRawCost).toFixed(2));
    const combinedActivePayroll = basePayroll;
    const combinedActiveNet = Number((combinedActiveGross - combinedActiveRawCost - combinedActivePayroll).toFixed(2));
    const combinedActiveMarginPct = combinedActiveGross > 0 ? (combinedActiveNet / combinedActiveGross) * 100 : 0;

    return {
      company: c,
      recipe,
      recipePp,
      isRaw,
      spotPrice,
      recipeInputs,
      unitRawCost,
      strategicBonus,
      depositBonus,
      ethicBonus,
      totalBonusPct,
      appliedMultiplier,
      // Self work
      energyStamina,
      dailySessions,
      readySessions,
      prodSkillLevel,
      playerBasePp,
      selfWorkPpPerHit,
      selfWorkUnitsPerHit,
      selfWorkNetPerHit,
      selfWorkDailyPp,
      selfWorkDailyUnits,
      selfWorkGrossRevenue,
      selfWorkRawCost,
      selfWorkNetValue,
      selfWorkMarginPct,
      activeSessions,
      activeAllocationLabel,
      activeUnits,
      activeGross,
      activeRawCost,
      activeNet,
      // Base
      engineLevel,
      storageLevel,
      engineBasePph,
      engineBaseDailyPp,
      engineDeliveredDailyPp,
      engineDailyUnits,
      storageCapacityPp,
      normalizedWorkers,
      workforceCount,
      workforceLaborPp,
      workforceProducedPp,
      workforceDailyPayroll,
      baseDeliveredDailyPp,
      baseDailyUnits,
      baseGrossRevenue,
      baseRawCost,
      basePayroll,
      baseNetProfit,
      baseMarginPct,
      // Combined
      combined100DeliveredPp,
      combined100Units,
      combined100Gross,
      combined100RawCost,
      combined100Payroll,
      combined100Net,
      combined100MarginPct,
      combinedActiveDeliveredPp,
      combinedActiveUnits,
      combinedActiveGross,
      combinedActiveRawCost,
      combinedActivePayroll,
      combinedActiveNet,
      combinedActiveMarginPct
    };
  }, [auditedCompany, ownerLabor, user, prices, companies, activeLaborSheet, customSplits]);

  // Filter companies by sector only
  const filteredCompanies = useMemo(() => {
    let result = [...companies];
    if (sectorFilter === 'raw') {
      result = result.filter(c => c.isRaw || c.recipe?.type === 'raw');
    } else if (sectorFilter === 'processed') {
      result = result.filter(c => !c.isRaw && c.recipe?.type !== 'raw');
    }
    return result;
  }, [companies, sectorFilter]);

  // Aggregate Market Stats (Figures only, no symbols, zero double-counting)
  const marketOverview = useMemo(() => {
    const totalValuation = companies.reduce((sum, c) => sum + (c.totalCalculatedWorth || 0), 0);
    const baseDailyProfit = typeof portfolioTotals?.totalBaseNetProfit === 'number'
      ? portfolioTotals.totalBaseNetProfit
      : companies.reduce((sum, c) => sum + (c.baseNetProfit ?? 0), 0);
    const totalBaseDailyUnits = typeof portfolioTotals?.totalBaseProductionUnits === 'number'
      ? portfolioTotals.totalBaseProductionUnits
      : companies.reduce((sum, c) => sum + (c.baseUnits ?? 0), 0);
    const totalCompanyBasePp = typeof portfolioTotals?.totalCompanyBasePp === 'number'
      ? portfolioTotals.totalCompanyBasePp
      : companies.reduce((sum, c) => sum + (c.companyBaseDailyPp ?? 0), 0);
    const totalCompanyProducedPp = typeof portfolioTotals?.totalCompanyProducedPp === 'number'
      ? portfolioTotals.totalCompanyProducedPp
      : companies.reduce((sum, c) => sum + (c.companyProducedDailyPp ?? 0), 0);
    const totalDailySelfWorkPp = typeof portfolioTotals?.totalDailySelfWorkPp === 'number'
      ? portfolioTotals.totalDailySelfWorkPp
      : (ownerLabor?.dailySelfWorkPp || 0);
    const totalInclusiveBasePp = typeof portfolioTotals?.totalInclusiveBasePp === 'number'
      ? portfolioTotals.totalInclusiveBasePp
      : (totalCompanyBasePp + totalDailySelfWorkPp);

    const totalBaseGrossRevenue = typeof portfolioTotals?.totalBaseGrossRevenue === 'number'
      ? portfolioTotals.totalBaseGrossRevenue
      : companies.reduce((sum, c) => sum + (c.grossRevenue ?? 0), 0);
    const totalBaseRawExpense = typeof portfolioTotals?.totalBaseRawExpense === 'number'
      ? portfolioTotals.totalBaseRawExpense
      : companies.reduce((sum, c) => sum + (c.dailyRawExpenseTotal ?? 0), 0);
    const totalBaseLaborExpense = typeof portfolioTotals?.totalBaseLaborExpense === 'number'
      ? portfolioTotals.totalBaseLaborExpense
      : companies.reduce((sum, c) => sum + (c.dailyLaborExpense ?? 0), 0);
    const baseNetMarginPct = totalBaseGrossRevenue > 0 ? (baseDailyProfit / totalBaseGrossRevenue) * 100 : 0;

    const totalRawBaseUnits = typeof portfolioTotals?.totalRawBaseUnits === 'number'
      ? portfolioTotals.totalRawBaseUnits
      : companies.filter(c => c.isRaw).reduce((sum, c) => sum + (c.baseUnits ?? 0), 0);
    const totalFinishedBaseUnits = typeof portfolioTotals?.totalFinishedBaseUnits === 'number'
      ? portfolioTotals.totalFinishedBaseUnits
      : companies.filter(c => !c.isRaw).reduce((sum, c) => sum + (c.baseUnits ?? 0), 0);

    const total24hGrowthCoins = companies.reduce((sum, c) => sum + (c.growth24hCoins || 0), 0);
    const baselineValuation = Math.max(1, totalValuation - total24hGrowthCoins);
    const total24hGrowthPct = (total24hGrowthCoins / baselineValuation) * 100;
    const totalWorkers = companies.reduce((sum, c) => sum + (c.workers?.length || 0), 0);

    return {
      totalValuation,
      baseDailyProfit,
      totalBaseGrossRevenue,
      totalBaseRawExpense,
      totalBaseLaborExpense,
      baseNetMarginPct,
      totalBaseDailyUnits,
      totalRawBaseUnits,
      totalFinishedBaseUnits,
      totalCompanyBasePp,
      totalCompanyProducedPp,
      totalDailySelfWorkPp,
      totalInclusiveBasePp,
      total24hGrowthCoins,
      total24hGrowthPct,
      totalWorkers,
      hasBothRawAndFinished: typeof portfolioTotals?.hasBothRawAndFinished === 'boolean'
        ? portfolioTotals.hasBothRawAndFinished
        : (companies.some(c => c.isRaw) && companies.some(c => !c.isRaw))
    };
  }, [companies, portfolioTotals, ownerLabor]);

  // Owner Identity
  const ownerName = user?.username || companies[0]?.ownerUsername || 'Industrialist';
  const ownerAvatar = user?.avatarUrl || companies[0]?.ownerAvatarUrl;
  const ownerLevel = user?.leveling?.level;
  const ownerPrestige = user?.leveling?.prestigeLevel;

  // Region & Location resolution
  const [resolvedHomeRegion, setResolvedHomeRegion] = useState(() => {
    if (user?.homeRegionName) {
      return `${user.homeRegionName}${user.homeCountryCode ? ` (${user.homeCountryCode})` : ''}`;
    }
    return null;
  });

  const [resolvedCurrentLoc, setResolvedCurrentLoc] = useState(() => {
    if (user?.currentLocationName) {
      return `${user.currentLocationName}${user.currentCountryCode ? ` (${user.currentCountryCode})` : ''}`;
    }
    return null;
  });

  useEffect(() => {
    let isMounted = true;
    if (user?.region && !user.homeRegionName && /^[a-f\d]{24}$/i.test(user.region)) {
      api.getRegionById(user.region).then(r => {
        if (isMounted && r) {
          const str = `${r.name || 'Regional Sector'}${r.countryCode ? ` (${r.countryCode.toUpperCase()})` : ''}`;
          setResolvedHomeRegion(str);
        }
      }).catch(() => {});
    } else if (user?.homeRegionName) {
      setResolvedHomeRegion(`${user.homeRegionName}${user.homeCountryCode ? ` (${user.homeCountryCode})` : ''}`);
    }

    if (user?.location && !user.currentLocationName && /^[a-f\d]{24}$/i.test(user.location)) {
      api.getRegionById(user.location).then(r => {
        if (isMounted && r) {
          const str = `${r.name || 'Regional Sector'}${r.countryCode ? ` (${r.countryCode.toUpperCase()})` : ''}`;
          setResolvedCurrentLoc(str);
        }
      }).catch(() => {});
    } else if (user?.currentLocationName) {
      setResolvedCurrentLoc(`${user.currentLocationName}${user.currentCountryCode ? ` (${user.currentCountryCode})` : ''}`);
    }

    return () => { isMounted = false; };
  }, [user?.region, user?.location, user?.homeRegionName, user?.currentLocationName]);

  const homeRegionDisplay = resolvedHomeRegion 
    || (companies[0] ? `${companies[0].regionName} (${companies[0].countryCode})` : 'Central District (HQ)');

  const currentLocDisplay = resolvedCurrentLoc 
    || homeRegionDisplay;

  // Live Portfolio Net Worth & Breakdown (matches authoritative in-game wealth stats and live updates with yield/prices)
  const wealth = user?.stats?.wealth || dossier?.user?.stats?.wealth || {};

  // 1. Industrial Facilities: Authoritative game valuation of companies + live storage yield
  const syncCompaniesVal = typeof wealth.companies === 'number' && wealth.companies > 0
    ? wealth.companies
    : companies.reduce((sum, c) => sum + (c.estimatedValue || c.totalCalculatedWorth || 0), 0);

  // Live yield accumulation across all facilities since sync
  const liveStoredYieldVal = useMemo(() => {
    return companies.reduce((sum, c) => sum + (c.uncollectedValueCoins || 0), 0);
  }, [companies]);

  const liveFacilitiesVal = syncCompaniesVal + liveStoredYieldVal;

  // 2. Personal Items & Inventory
  const syncItemsVal = typeof wealth.items === 'number' ? wealth.items : 0;
  const liveItemsVal = syncItemsVal;

  // 3. Liquid Cash Reserve
  const liquidMoneyVal = typeof wealth.money === 'number' ? wealth.money : 0;

  // 4. Combat Equipment & Weapons
  const equipmentVal = typeof wealth.equipments === 'number' ? wealth.equipments : 0;
  const weaponsVal = typeof wealth.weapons === 'number' ? wealth.weapons : 0;

  // Total Live Net Worth (authoritative wealth.total + live yield accumulation)
  const syncTotalNetWorth = typeof wealth.total === 'number' && wealth.total > 0
    ? wealth.total
    : (syncCompaniesVal + syncItemsVal + liquidMoneyVal + equipmentVal + weaponsVal);

  const liveTotalNetWorth = syncTotalNetWorth + liveStoredYieldVal;

  // Scoped Rolling Hourly Ledger per user
  const effectiveUserId = user?._id || user?.id || user?.username || companies[0]?.ownerUsername || 'guest';
  const [hourlyStats, setHourlyStats] = useState({
    netWorthCoins: 0,
    netWorthPct: 0,
    portfolioCoins: 0,
    portfolioPct: 0
  });

  useEffect(() => {
    if (!liveTotalNetWorth || isNaN(liveTotalNetWorth) || !effectiveUserId) return;
    try {
      const now = Date.now();
      const storageKey = `warera_hourly_ledger_${effectiveUserId}`;
      const raw = localStorage.getItem(storageKey);
      let ledger = raw ? JSON.parse(raw) : [];

      const currentPortfolioVal = marketOverview.totalValuation || 0;

      // Clean legacy un-scoped key
      if (localStorage.getItem('warera_hourly_networth_ledger')) {
        localStorage.removeItem('warera_hourly_networth_ledger');
      }

      // Record snapshot if empty or at least 45 seconds since last entry
      const last = ledger[ledger.length - 1];
      if (!last || (now - last.timestamp) >= 45000) {
        ledger.push({
          timestamp: now,
          netWorth: Number(liveTotalNetWorth.toFixed(1)),
          portfolioVal: Number(currentPortfolioVal.toFixed(1))
        });
      } else {
        last.netWorth = Number(liveTotalNetWorth.toFixed(1));
        last.portfolioVal = Number(currentPortfolioVal.toFixed(1));
      }

      // Keep past 48 hours
      const cutoff = now - (48 * 3600000);
      ledger = ledger.filter(entry => entry.timestamp >= cutoff);
      localStorage.setItem(storageKey, JSON.stringify(ledger));

      // Calculate rolling 1-hour change
      const oneHourAgo = now - 3600000;
      let bestSnapshot = null;
      let minDiff = Infinity;

      for (const entry of ledger) {
        const diff = Math.abs(entry.timestamp - oneHourAgo);
        if (diff < minDiff) {
          minDiff = diff;
          bestSnapshot = entry;
        }
      }

      // If we don't have historical data older than 2 minutes yet (fresh load for this user)
      const oldest = ledger[0];
      const hasHistory = oldest && (now - oldest.timestamp) >= 60000;

      if (!hasHistory) {
        setHourlyStats({
          netWorthCoins: 0,
          netWorthPct: 0,
          portfolioCoins: 0,
          portfolioPct: 0
        });
        return;
      }

      // If bestSnapshot is within reasonable window, use it; otherwise use the oldest recorded in this session
      const baseSnapshot = (bestSnapshot && minDiff < 3600000 * 1.5) ? bestSnapshot : oldest;

      const baseNetWorth = baseSnapshot.netWorth || liveTotalNetWorth;
      const nwDelta = liveTotalNetWorth - baseNetWorth;
      const nwPct = baseNetWorth > 0 ? (nwDelta / baseNetWorth) * 100 : 0;

      const basePort = baseSnapshot.portfolioVal || currentPortfolioVal;
      const portDelta = currentPortfolioVal - basePort;
      const portPct = basePort > 0 ? (portDelta / basePort) * 100 : 0;

      setHourlyStats({
        netWorthCoins: Number(nwDelta.toFixed(1)),
        netWorthPct: Number(nwPct.toFixed(2)),
        portfolioCoins: Number(portDelta.toFixed(1)),
        portfolioPct: Number(portPct.toFixed(2))
      });
    } catch (err) {}
  }, [liveTotalNetWorth, marketOverview.totalValuation, effectiveUserId]);

  const hourlyValuationCoins = hourlyStats.portfolioCoins;
  const hourlyValuationPct = hourlyStats.portfolioPct;

  const netWorthBreakdownItems = useMemo(() => {
    const total = liveTotalNetWorth > 0 ? liveTotalNetWorth : 1;
    const items = [
      { 
        label: `Companies (${companies.length} facilities)`, 
        value: liveFacilitiesVal,
        sharePct: (liveFacilitiesVal / total) * 100
      },
      { 
        label: 'Items', 
        value: liveItemsVal,
        sharePct: (liveItemsVal / total) * 100
      },
      { 
        label: 'Money', 
        value: liquidMoneyVal,
        sharePct: (liquidMoneyVal / total) * 100
      },
    ];

    if (equipmentVal > 0) {
      items.push({ 
        label: 'Equipment', 
        value: equipmentVal,
        sharePct: (equipmentVal / total) * 100
      });
    }
    if (weaponsVal > 0) {
      items.push({ 
        label: 'Weapons', 
        value: weaponsVal,
        sharePct: (weaponsVal / total) * 100
      });
    }

    return items;
  }, [
    liveTotalNetWorth,
    liveFacilitiesVal, 
    liveItemsVal, 
    liquidMoneyVal, 
    equipmentVal, 
    weaponsVal, 
    companies.length
  ]);

  // Initialize and synchronize custom splits when company roster changes
  useEffect(() => {
    if (companies && companies.length > 0) {
      const initial = {};
      const basePct = Number((100 / companies.length).toFixed(1));
      companies.forEach((c, idx) => {
        const cid = c.id || c._id;
        if (idx === 0) {
          initial[cid] = Number((100 - basePct * (companies.length - 1)).toFixed(1));
        } else {
          initial[cid] = basePct;
        }
      });
      setCustomSplits(initial);
    }
  }, [companies.length]);

  const handleUpdateCustomSplit = (compId, delta) => {
    setCustomSplits(prev => {
      const cur = prev[compId] || 0;
      const nextVal = Math.max(0, Math.min(100, Math.round(cur + delta)));
      return { ...prev, [compId]: nextVal };
    });
  };

  const handleSetCustomSplit = (compId, val) => {
    const num = Math.max(0, Math.min(100, Number(val) || 0));
    setCustomSplits(prev => ({ ...prev, [compId]: num }));
  };

  const handleResetCustomEven = () => {
    if (companies.length === 0) return;
    const initial = {};
    const basePct = Number((100 / companies.length).toFixed(1));
    companies.forEach((c, idx) => {
      const cid = c.id || c._id;
      if (idx === 0) {
        initial[cid] = Number((100 - basePct * (companies.length - 1)).toFixed(1));
      } else {
        initial[cid] = basePct;
      }
    });
    setCustomSplits(initial);
  };

  // Labor Simulation Data across the 4 Excel-style scenario sheets
  const laborSimData = useMemo(() => {
    const dailySessions = ownerLabor?.dailySessions || 0;
    const ppPerSession = ownerLabor?.ppPerSession || 10;
    const count = companies.length;
    if (count === 0) {
      return {
        compList: [],
        focusedItems: [],
        evenItems: [],
        totalEvenYield: 0,
        deficitItems: [],
        totalDeficitYield: 0,
        customItems: [],
        totalCustomYield: 0,
        totalCustomPct: 0,
        dailySessions,
        ppPerSession
      };
    }

    const compList = companies.map(comp => {
      const recipe = comp.recipe || RECIPES.find(r => r.id === comp.itemCode) || { id: comp.itemCode, name: comp.itemCode, pp: 1, type: 'raw', inputs: [] };
      const isRaw = comp.isRaw !== undefined ? comp.isRaw : (recipe.type === 'raw' || !recipe.inputs || recipe.inputs.length === 0);
      const spotPrice = comp.spotPrice || prices[comp.itemCode] || 1.0;
      const rawCostPerUnit = isRaw
        ? 0
        : (recipe.inputs || []).reduce((sum, inp) => sum + (inp.qty * (prices[inp.id] || 1.0)), 0);
      const netValuePerUnit = spotPrice - rawCostPerUnit;
      const ppPerUnit = recipe.pp || 1;
      const bonusMultiplier = comp.bonusMultiplier || (1 + ((comp.totalBonusPct || 0) * 0.91 / 100));
      const unitsPerSession = (ppPerSession * bonusMultiplier) / ppPerUnit;

      return {
        id: comp.id || comp._id,
        name: comp.name || `Company (${comp.itemCode?.toUpperCase() || ''})`,
        itemCode: comp.itemCode,
        isRaw,
        recipe,
        spotPrice,
        rawCostPerUnit,
        netValuePerUnit,
        unitsPerSession,
        bonusMultiplier,
        bonusPct: comp.totalBonusPct || 0
      };
    });

    // 1. Focused: 100% of dailySessions on each company individually
    const focusedItems = compList.map(c => {
      const dailyUnits = dailySessions * c.unitsPerSession;
      const netValue = dailyUnits * c.netValuePerUnit;
      return {
        ...c,
        sessions: dailySessions,
        dailyUnits,
        netValue
      };
    });

    // 2. Even Split: dailySessions / count on each company
    const evenSessionsPerComp = count > 0 ? (dailySessions / count) : 0;
    let totalEvenYield = 0;
    const evenItems = compList.map(c => {
      const dailyUnits = evenSessionsPerComp * c.unitsPerSession;
      const netValue = dailyUnits * c.netValuePerUnit;
      totalEvenYield += netValue;
      return {
        ...c,
        sessions: evenSessionsPerComp,
        dailyUnits,
        netValue
      };
    });

    // 3. Deficit Coverage: Prioritize raw companies with deficits
    const ledgerMap = (supplyChainLedger || []).reduce((acc, row) => {
      acc[row.itemCode] = row;
      return acc;
    }, {});

    let remainingSessions = dailySessions;
    const deficitAllocations = {};

    compList.forEach(c => {
      if (c.isRaw && remainingSessions > 0) {
        const ledgerEntry = ledgerMap[c.itemCode];
        if (ledgerEntry && ledgerEntry.status === 'deficit' && ledgerEntry.deficitUnits > 0) {
          const unitsNeeded = ledgerEntry.deficitUnits;
          const sessionsNeeded = c.unitsPerSession > 0 ? (unitsNeeded / c.unitsPerSession) : 0;
          const allocated = Math.min(remainingSessions, sessionsNeeded);
          deficitAllocations[c.id] = allocated;
          remainingSessions -= allocated;
        }
      }
    });

    const otherComps = compList.filter(c => !(deficitAllocations[c.id] > 0));
    const fallbackComps = otherComps.length > 0 ? otherComps : compList;
    const extraSessionsPerComp = fallbackComps.length > 0 ? (remainingSessions / fallbackComps.length) : 0;

    let totalDeficitYield = 0;
    const deficitItems = compList.map(c => {
      const allocated = (deficitAllocations[c.id] || 0) + (fallbackComps.includes(c) ? extraSessionsPerComp : 0);
      const dailyUnits = allocated * c.unitsPerSession;
      const netValue = dailyUnits * c.netValuePerUnit;
      totalDeficitYield += netValue;
      const ledgerEntry = ledgerMap[c.itemCode];
      const isTargetingDeficit = c.isRaw && ledgerEntry && ledgerEntry.status === 'deficit';
      const coveredUnits = isTargetingDeficit ? Math.min(ledgerEntry.deficitUnits, dailyUnits) : 0;
      const coveredSavings = coveredUnits * c.spotPrice;

      return {
        ...c,
        sessions: allocated,
        dailyUnits,
        netValue,
        isTargetingDeficit,
        coveredUnits,
        coveredSavings
      };
    });

    // 4. Custom Split
    let totalCustomYield = 0;
    let totalCustomPct = 0;
    const customItems = compList.map(c => {
      const pct = typeof customSplits[c.id] === 'number' ? customSplits[c.id] : (100 / count);
      totalCustomPct += pct;
      const allocated = (pct / 100) * dailySessions;
      const dailyUnits = allocated * c.unitsPerSession;
      const netValue = dailyUnits * c.netValuePerUnit;
      totalCustomYield += netValue;
      return {
        ...c,
        pct,
        sessions: allocated,
        dailyUnits,
        netValue
      };
    });

    return {
      compList,
      focusedItems,
      evenItems,
      totalEvenYield,
      deficitItems,
      totalDeficitYield,
      customItems,
      totalCustomYield,
      totalCustomPct,
      dailySessions,
      ppPerSession
    };
  }, [companies, ownerLabor, prices, supplyChainLedger, customSplits]);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-4 space-y-5 select-none font-sans">
      
      {/* 1. PORTFOLIO OWNER INTRO & NET WORTH BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* LEFT COLUMN: OWNER IDENTITY & LOCATIONS */}
        <div className="lg:col-span-5 bg-white p-5 space-y-4 flex flex-col justify-between border border-slate-200/80">
          
          {/* Owner Profile Header */}
          <div className="flex items-start justify-between gap-3 pb-2">
            <div className="flex items-center space-x-3.5 min-w-0">
              {ownerAvatar ? (
                <img 
                  src={ownerAvatar} 
                  alt={ownerName} 
                  className="w-14 h-14 object-cover shrink-0" 
                />
              ) : (
                <div className="w-14 h-14 bg-slate-900 text-white font-extrabold text-xl flex items-center justify-center shrink-0">
                  {ownerName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center space-x-2 flex-wrap">
                  <h2 className="text-lg font-extrabold text-slate-900 font-sans truncate">{ownerName}</h2>
                  {ownerLevel && (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                      Lv.{ownerLevel}
                    </span>
                  )}
                  {ownerPrestige > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-100 text-amber-800">
                      Prestige {ownerPrestige}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono">
                  <span>Portfolio Owner</span>
                  <span>•</span>
                  <span>{companies.length} Operating Facilities</span>
                </div>
              </div>
            </div>
          </div>

          {/* Territory & Domicile Details */}
          <div className="space-y-2.5 font-mono text-xs flex-1 flex flex-col justify-around">
            <div className="flex items-center justify-between pb-1 font-sans">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                Territory & Residence
              </span>
            </div>

            <div className="space-y-2 text-slate-600 flex-1 flex flex-col justify-around">
              <div className="flex justify-between items-center">
                <span>Home Region:</span>
                <strong className="text-slate-900 font-sans">
                  {homeRegionDisplay}
                </strong>
              </div>

              <div className="flex justify-between items-center">
                <span>Current Location:</span>
                <strong className="text-slate-900 font-sans">
                  {currentLocDisplay}
                </strong>
              </div>
            </div>

            {/* Total Net Worth Highlight with Past 1h Gain & % */}
            <div className="pt-2 flex justify-between items-baseline border-t border-slate-100">
              <span className="text-slate-500 text-xs font-sans">Total Net Worth:</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl sm:text-2xl font-black font-mono text-slate-900">
                  {liveTotalNetWorth.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
                <span className={`text-xs font-bold font-mono ${hourlyStats.netWorthCoins > 0 ? 'text-emerald-500' : hourlyStats.netWorthCoins < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                  {hourlyStats.netWorthCoins >= 0 ? '+' : ''}{hourlyStats.netWorthCoins.toFixed(1)} ({hourlyStats.netWorthPct >= 0 ? '+' : ''}{hourlyStats.netWorthPct.toFixed(2)}%)
                </span>
                <span className="text-[10px] text-slate-400 font-sans">past 1h</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: NET WORTH BREAKDOWN (ASSET ALLOCATION STRUCTURE) */}
        <div className="lg:col-span-7 bg-white p-5 space-y-4 flex flex-col justify-between border border-slate-200/80">
          
          <div className="space-y-2.5 font-mono text-xs flex-1 flex flex-col justify-around">
            <div className="flex items-center justify-between pb-1.5 font-sans">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                Net Worth Breakdown
              </span>
              <span className="font-mono text-xs font-bold text-slate-500">
                Allocation
              </span>
            </div>

            <div className="space-y-2 text-slate-600 flex-1 flex flex-col justify-around">
              {netWorthBreakdownItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span>{item.label}:</span>
                  <div className="flex items-center space-x-2 text-right">
                    <strong className="text-slate-900 font-bold">
                      {item.value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    </strong>
                    <span className="text-[11px] font-bold font-mono text-slate-500">
                      {item.sharePct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}

              <div 
                onClick={() => setActiveBreakdownMetric('valuation')}
                className="flex justify-between items-center pt-2 text-slate-900 font-bold border-t border-slate-100 cursor-pointer hover:bg-slate-50 px-1.5 py-1 -mx-1.5 transition-colors group"
                title="Click to view full portfolio valuation breakdown"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Total:</span>
                  <span className="text-[10px] text-slate-400 group-hover:text-amber-800 font-normal font-mono flex items-center gap-0.5">
                    Breakdown <ExternalLink className="w-2.5 h-2.5 inline" />
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-amber-800 font-black text-sm">
                    {liveTotalNetWorth.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </span>
                  <span className={`text-xs font-bold font-mono ${hourlyStats.netWorthCoins > 0 ? 'text-emerald-500' : hourlyStats.netWorthCoins < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                    {hourlyStats.netWorthCoins >= 0 ? '+' : ''}{hourlyStats.netWorthCoins.toFixed(1)} ({hourlyStats.netWorthPct >= 0 ? '+' : ''}{hourlyStats.netWorthPct.toFixed(2)}%)
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans">past 1h</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 2. OVERVIEW VALUE BOXES (STANDARDIZED ON BASE INCOME & PRODUCTION - ALL CLICKABLE FOR DETAILED BREAKDOWN) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Market Cap / Portfolio Valuation */}
        <div 
          onClick={() => setActiveBreakdownMetric('valuation')}
          className="bg-white p-4 space-y-1 border border-slate-200/80 hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer group relative"
          title="Click to view asset-by-asset valuation breakdown"
        >
          <div className="flex items-center justify-between">
            <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider font-mono">
              Portfolio Valuation
            </div>
            <span className="text-[10px] text-slate-400 group-hover:text-amber-800 transition-colors font-mono flex items-center gap-0.5">
              Breakdown <ExternalLink className="w-2.5 h-2.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
            {(liveTotalNetWorth > 0 ? liveTotalNetWorth : marketOverview.totalValuation).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className={`font-bold ${hourlyStats.netWorthCoins > 0 ? 'text-emerald-500' : hourlyStats.netWorthCoins < 0 ? 'text-red-500' : 'text-blue-500'}`}>
              {hourlyStats.netWorthCoins >= 0 ? '+' : ''}{hourlyStats.netWorthCoins.toFixed(1)} ({hourlyStats.netWorthPct >= 0 ? '+' : ''}{hourlyStats.netWorthPct.toFixed(2)}%)
            </span>
            <span className="text-[10px] text-slate-400 font-sans">past 1h</span>
          </div>
        </div>

        {/* Base Daily Revenue */}
        <div 
          onClick={() => setActiveBreakdownMetric('revenue')}
          className="bg-white p-4 space-y-1 border border-slate-200/80 hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer group relative"
          title="Click to view company-by-company revenue breakdown"
        >
          <div className="flex items-center justify-between">
            <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider font-mono">
              Base Daily Revenue
            </div>
            <span className="text-[10px] text-slate-400 group-hover:text-amber-800 transition-colors font-mono flex items-center gap-0.5">
              Breakdown <ExternalLink className="w-2.5 h-2.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-500">
            +{marketOverview.totalBaseGrossRevenue.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            <span className="text-xs font-normal text-slate-400 ml-1">/day</span>
          </div>
          <div className="text-[11px] text-slate-500 font-sans flex items-center justify-between">
            <span>Gross output sales</span>
            <span className="text-slate-400 text-[10px] font-mono">Market spot</span>
          </div>
        </div>

        {/* Costs of Raw Material Per Day */}
        <div 
          onClick={() => setActiveBreakdownMetric('rawCosts')}
          className="bg-white p-4 space-y-1 border border-slate-200/80 hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer group relative"
          title="Click to view raw material costs per facility"
        >
          <div className="flex items-center justify-between">
            <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider font-mono">
              Raw Material Costs
            </div>
            <span className="text-[10px] text-slate-400 group-hover:text-amber-800 transition-colors font-mono flex items-center gap-0.5">
              Breakdown <ExternalLink className="w-2.5 h-2.5" />
            </span>
          </div>
          <div className={`text-xl sm:text-2xl font-black font-mono ${marketOverview.totalBaseRawExpense > 0 ? 'text-red-500' : 'text-blue-500'}`}>
            {marketOverview.totalBaseRawExpense > 0 
              ? `-${marketOverview.totalBaseRawExpense.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}` 
              : '0.0'}
            <span className="text-xs font-normal text-slate-400 ml-1">/day</span>
          </div>
          <div className="text-[11px] text-slate-500 font-sans flex items-center justify-between">
            <span>Factory input costs</span>
            <span className={`text-[10px] font-mono ${marketOverview.hasBothRawAndFinished ? 'text-blue-500 font-bold' : 'text-slate-400'}`}>
              {marketOverview.hasBothRawAndFinished ? 'Insourced (0 BTC)' : 'Spot purchases'}
            </span>
          </div>
        </div>

        {/* Base Salaries Paid Out Per Day */}
        <div 
          onClick={() => setActiveBreakdownMetric('salaries')}
          className="bg-white p-4 space-y-1 border border-slate-200/80 hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer group relative"
          title="Click to view worker roster and payable salary breakdown"
        >
          <div className="flex items-center justify-between">
            <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider font-mono">
              Base Salaries Paid
            </div>
            <span className="text-[10px] text-slate-400 group-hover:text-amber-800 transition-colors font-mono flex items-center gap-0.5">
              Breakdown <ExternalLink className="w-2.5 h-2.5" />
            </span>
          </div>
          <div className={`text-xl sm:text-2xl font-black font-mono ${marketOverview.totalBaseLaborExpense > 0 ? 'text-red-500' : 'text-blue-500'}`}>
            {marketOverview.totalBaseLaborExpense > 0 ? '-' : ''}{marketOverview.totalBaseLaborExpense.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            <span className="text-xs font-normal text-slate-400 ml-1">/day</span>
          </div>
          <div className="text-[11px] text-slate-500 font-sans flex items-center justify-between">
            <span>Hired workforce wages</span>
            <span className="text-slate-400 text-[10px] font-mono">{marketOverview.totalWorkers} workers</span>
          </div>
        </div>

        {/* Base Daily Profit (Standard) */}
        <div 
          onClick={() => setActiveBreakdownMetric('profit')}
          className="bg-white p-4 space-y-1 border border-slate-200/80 hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer group relative"
          title="Click to view company-by-company profit statement"
        >
          <div className="flex items-center justify-between">
            <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider font-mono">
              Base Daily Profit
            </div>
            <span className="text-[10px] text-slate-400 group-hover:text-amber-800 transition-colors font-mono flex items-center gap-0.5">
              Breakdown <ExternalLink className="w-2.5 h-2.5" />
            </span>
          </div>
          <div className={`text-xl sm:text-2xl font-black font-mono ${marketOverview.baseDailyProfit > 0 ? 'text-emerald-500' : marketOverview.baseDailyProfit < 0 ? 'text-red-500' : 'text-blue-500'}`}>
            {marketOverview.baseDailyProfit >= 0 ? '+' : ''}{marketOverview.baseDailyProfit.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            <span className="text-xs font-normal text-slate-400 ml-1">/day</span>
          </div>
          <div className="text-[11px] text-slate-500 font-sans flex items-center justify-between">
            <span>Net profit after costs</span>
            <span className={`font-mono text-[10px] font-bold ${marketOverview.baseNetMarginPct > 0 ? 'text-emerald-500' : marketOverview.baseNetMarginPct < 0 ? 'text-red-500' : 'text-blue-500'}`}>{marketOverview.baseNetMarginPct.toFixed(1)}% margin</span>
          </div>
        </div>

        {/* Base Production (Standard) */}
        <div 
          onClick={() => setActiveBreakdownMetric('production')}
          className="bg-white p-4 space-y-1 border border-slate-200/80 hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer group relative"
          title="Click to view physical output units breakdown"
        >
          <div className="flex items-center justify-between">
            <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider font-mono">
              Base Production
            </div>
            <span className="text-[10px] text-slate-400 group-hover:text-amber-800 transition-colors font-mono flex items-center gap-0.5">
              Breakdown <ExternalLink className="w-2.5 h-2.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
            {marketOverview.totalBaseDailyUnits.toFixed(1)} <span className="text-xs font-normal text-slate-400">units/day</span>
          </div>
          <div className="text-[11px] text-slate-500 font-sans flex items-center justify-between">
            <span>Raw: {marketOverview.totalRawBaseUnits.toFixed(1)}</span>
            <span>•</span>
            <span>Finished: {marketOverview.totalFinishedBaseUnits.toFixed(1)}</span>
          </div>
        </div>

        {/* Total Enterprise PP (Inclusive of Self-Work PP) */}
        <div 
          onClick={() => setActiveBreakdownMetric('pp')}
          className="bg-white p-4 space-y-1 border border-slate-200/80 hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer group relative"
          title="Click to view engine, worker, and self-work PP breakdown"
        >
          <div className="flex items-center justify-between">
            <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider font-mono">
              Total Enterprise PP
            </div>
            <span className="text-[10px] text-slate-400 group-hover:text-amber-800 transition-colors font-mono flex items-center gap-0.5">
              Breakdown <ExternalLink className="w-2.5 h-2.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
            {marketOverview.totalInclusiveBasePp.toFixed(1)} <span className="text-xs font-normal text-slate-400">PP/day</span>
          </div>
          <div className="text-[11px] text-slate-500 font-sans truncate" title={`Base Operations: ${marketOverview.totalCompanyBasePp.toFixed(1)} PP + Owner Self-Work: ${marketOverview.totalDailySelfWorkPp.toFixed(1)} PP`}>
            <span>Base: {marketOverview.totalCompanyBasePp.toFixed(0)}</span>
            <span className="mx-1 text-slate-300">+</span>
            <span className="text-amber-800 font-bold">Self: {marketOverview.totalDailySelfWorkPp.toFixed(0)} PP</span>
          </div>
        </div>

        {/* Staff Deployment */}
        <div 
          onClick={() => setActiveBreakdownMetric('staff')}
          className="bg-white p-4 space-y-1 border border-slate-200/80 hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer group relative"
          title="Click to view staff deployment and management capacity"
        >
          <div className="flex items-center justify-between">
            <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider font-mono">
              Staff Deployment
            </div>
            <span className="text-[10px] text-slate-400 group-hover:text-amber-800 transition-colors font-mono flex items-center gap-0.5">
              Breakdown <ExternalLink className="w-2.5 h-2.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
            {marketOverview.totalWorkers} <span className="text-xs font-normal text-slate-400">/ {maxHiringSlots} slots</span>
          </div>
          <div className="text-[11px] text-slate-500 font-sans flex items-center justify-between">
            <span>Mgmt Lv.{managementLevel}</span>
            <span className="text-emerald-700 font-bold font-mono">{Math.max(0, maxHiringSlots - marketOverview.totalWorkers)} open</span>
          </div>
        </div>
      </div>

      {/* 3. SUPPLY CHAIN PIPELINE BALANCES (SURPLUS & DEFICIT COMPARISON) */}
      {supplyChainLedger && supplyChainLedger.length > 0 && (
        <div className="bg-white p-5 space-y-4 border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 font-sans">
                Supply Chain Pipeline Balances
              </h3>
              <p className="text-[11px] text-slate-500 font-sans">
                Live comparison of raw material extraction against manufacturing consumption across all active commodity lines
              </p>
            </div>
            <div className="text-xs font-mono font-bold text-slate-500">
              {supplyChainLedger.length} Active Pipeline{supplyChainLedger.length > 1 ? 's' : ''}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {supplyChainLedger.map((pipe) => {
              const pipeMeta = PIPELINE_META[pipe.itemCode] || {
                name: `${pipe.itemCode.toUpperCase()} Pipeline`,
                rawName: pipe.itemCode.toUpperCase(),
                endName: 'Processed',
                endCode: pipe.itemCode
              };
              const hasConsumers = pipe.demandUnits > 0;
              const integrationPct = hasConsumers 
                ? Math.min(999, Math.round((pipe.supplyUnits / pipe.demandUnits) * 100)) 
                : null;

              return (
                <div key={pipe.itemCode} className="p-4 bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
                    <div className="flex items-center space-x-2 min-w-0">
                      <div className="w-7 h-7 bg-white border border-slate-200 flex items-center justify-center shrink-0">
                        <ItemIcon itemCode={pipe.itemCode} size={18} />
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div className="w-7 h-7 bg-white border border-slate-200 flex items-center justify-center shrink-0">
                        <ItemIcon itemCode={pipeMeta.endCode} size={18} />
                      </div>
                      <div className="font-bold text-slate-900 text-xs font-sans truncate">
                        {pipeMeta.name}
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 text-[10px] font-mono font-bold border shrink-0 ${
                      pipe.status === 'surplus'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : pipe.status === 'deficit'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {pipe.status === 'surplus' ? 'SURPLUS' : pipe.status === 'deficit' ? 'DEFICIT' : 'BALANCED'}
                    </span>
                  </div>

                  <div className="space-y-1.5 font-mono text-xs text-slate-600">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-[11px]">Raw Supply:</span>
                      <strong className="text-slate-900 font-bold">
                        {pipe.supplyUnits.toFixed(1)} {pipeMeta.rawName}/day
                        <span className="text-[10px] text-slate-400 font-normal ml-1">({pipe.producers?.length || 0} facilities)</span>
                      </strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-[11px]">Factory Demand:</span>
                      <strong className="text-slate-900 font-bold">
                        {pipe.demandUnits.toFixed(1)} {pipeMeta.rawName}/day
                        <span className="text-[10px] text-slate-400 font-normal ml-1">({pipe.consumers?.length || 0} facilities)</span>
                      </strong>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 text-[11px]">Net Daily Balance:</span>
                      <strong className={`font-black ${
                        pipe.status === 'surplus'
                          ? 'text-emerald-500'
                          : pipe.status === 'deficit'
                            ? 'text-red-500'
                            : 'text-blue-500'
                      }`}>
                        {pipe.status === 'surplus' ? `+${pipe.surplusUnits.toFixed(1)}` : pipe.status === 'deficit' ? `-${pipe.deficitUnits.toFixed(1)}` : '0.0'} {pipeMeta.rawName}/day
                      </strong>
                    </div>

                    <div className="flex justify-between items-center pt-0.5">
                      <span className="text-slate-500 text-[11px]">
                        {pipe.status === 'surplus' ? 'Surplus Earnings:' : pipe.status === 'deficit' ? 'Deficit Expense:' : 'Market Dependency:'}
                      </span>
                      <span className={`font-black ${
                        pipe.status === 'surplus'
                          ? 'text-emerald-500'
                          : pipe.status === 'deficit'
                            ? 'text-red-500'
                            : 'text-blue-500'
                      }`}>
                        {pipe.status === 'surplus'
                          ? `+${pipe.surplusCoins.toFixed(2)} BTC/day`
                          : pipe.status === 'deficit'
                            ? `-${pipe.deficitCoins.toFixed(2)} BTC/day`
                            : '0.00 BTC/day'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60">
                    <div className="flex justify-between text-[10px] font-mono mb-1 text-slate-500">
                      <span>Integration Level</span>
                      <span className="font-bold text-slate-800">
                        {hasConsumers ? `${integrationPct}% Covered` : '100% Export Operation'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          pipe.status === 'surplus'
                            ? 'bg-emerald-500'
                            : pipe.status === 'deficit'
                              ? 'bg-red-500'
                              : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(100, integrationPct ?? 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. GENERAL PORTFOLIO OWNER LABOR CAPACITY & SCENARIO WORKBOOK */}
      <div className="bg-white p-5 space-y-4 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 font-sans">
              Owner Personal Labor Capacity
            </h3>
            <p className="text-[11px] text-slate-500 font-sans">
              Personal stamina and self-work capacity across the enterprise (separate from company base operations)
            </p>
          </div>
          <div className="flex items-center space-x-2 font-mono text-xs">
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-[11px]">
              Entrepreneurship Lv.{ownerLabor.entreLevel ?? 0}
            </span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-[11px]">
              Production Lv.{ownerLabor.prodLevel ?? 0}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          {/* Total Daily Self-Work PP (Base) */}
          <div className="bg-slate-50 p-3 space-y-1">
            <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider font-mono">
              Total Self-Work PP (Daily Base)
            </div>
            <div className="text-xl font-black font-mono text-amber-800">
              {ownerLabor.dailySelfWorkPp ? ownerLabor.dailySelfWorkPp.toFixed(1) : '0.0'} <span className="text-xs font-normal text-slate-500">PP/day</span>
            </div>
            <div className="text-[11px] text-slate-500 font-sans">
              24h cycle capacity ({ownerLabor.dailySessions ? ownerLabor.dailySessions.toFixed(1) : '0.0'} hits/day)
            </div>
          </div>

          {/* Current Ready PP */}
          <div className="bg-slate-50 p-3 space-y-1">
            <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider font-mono">
              Current Ready PP
            </div>
            <div className="text-xl font-black font-mono text-emerald-700">
              {ownerLabor.currentReadyPp ? ownerLabor.currentReadyPp.toFixed(1) : '0.0'} <span className="text-xs font-normal text-slate-500">PP</span>
            </div>
            <div className="text-[11px] text-slate-500 font-sans">
              Ready right now ({ownerLabor.readySessions ?? 0} hits available)
            </div>
          </div>

          {/* Account Stamina Pool */}
          <div className="bg-slate-50 p-3 space-y-1">
            <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider font-mono">
              Stamina Pool
            </div>
            <div className="text-xl font-black font-mono text-slate-900">
              {ownerLabor.entreCurrent ?? 0} <span className="text-xs font-normal text-slate-400">/ {ownerLabor.entreMax ?? 30}</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-bold font-mono">
              +{ownerLabor.hourlyRegen ? ownerLabor.hourlyRegen.toFixed(1) : '3.0'}/h (10% regen rate)
            </div>
          </div>

          {/* Work Session Power */}
          <div className="bg-slate-50 p-3 space-y-1">
            <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider font-mono">
              Session Efficiency
            </div>
            <div className="text-xl font-black font-mono text-slate-900">
              {ownerLabor.ppPerSession ?? 10} <span className="text-xs font-normal text-slate-500">PP / session</span>
            </div>
            <div className="text-[11px] text-slate-500 font-sans">
              10 Energy per hit • 0 wage overhead
            </div>
          </div>
        </div>

        {/* SELF-WORK DISTRIBUTION SCENARIOS WORKBOOK (EXCEL-STYLE TABS) */}
        <div className="pt-4 border-t border-slate-100 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Self-Work Distribution Scenarios
              </div>
              <div className="text-[11px] text-slate-500 font-sans">
                Compare output and net BTC returns across different daily labor allocation models
              </div>
            </div>

            {/* Excel-style scenario tabs */}
            <div className="flex items-center gap-1 overflow-x-auto border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setActiveLaborSheet('even')}
                className={`px-3 py-1.5 text-xs font-mono font-bold transition cursor-pointer ${
                  activeLaborSheet === 'even'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                Even Distribution
              </button>
              <button
                type="button"
                onClick={() => setActiveLaborSheet('custom')}
                className={`px-3 py-1.5 text-xs font-mono font-bold transition cursor-pointer ${
                  activeLaborSheet === 'custom'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                Custom Allocation
              </button>
              <button
                type="button"
                onClick={() => setActiveLaborSheet('focused')}
                className={`px-3 py-1.5 text-xs font-mono font-bold transition cursor-pointer ${
                  activeLaborSheet === 'focused'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                100% Focused Allocation
              </button>
            </div>
          </div>


          {/* TAB 2: EVEN DISTRIBUTION */}
          {activeLaborSheet === 'even' && (
            <div className="space-y-2">
              <div className="text-[11px] text-slate-500 font-sans flex items-center justify-between">
                <span>Distributes daily personal labor equally across all owned facilities ({(laborSimData.dailySessions / (companies.length || 1)).toFixed(1)} hits/day each). Click any company to audit variables.</span>
              </div>

              <div className="border border-slate-200 overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Company (Click to Audit)</th>
                      <th className="p-2.5">Sector</th>
                      <th className="p-2.5 text-right">Assigned Sessions</th>
                      <th className="p-2.5 text-right">Daily Output</th>
                      <th className="p-2.5 text-right">Net Value (BTC/day)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {laborSimData.evenItems.map((c) => (
                      <tr 
                        key={c.id} 
                        onClick={() => setAuditCompanyId(c.id)}
                        className="hover:bg-slate-100/80 transition-colors cursor-pointer group"
                        title="Click to view full factual production & earnings breakdown"
                      >
                        <td className="p-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-2 min-w-0">
                            <div className="w-6 h-6 bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                              <ItemIcon itemCode={c.itemCode} size={16} />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 font-sans block truncate group-hover:text-cyan-800 transition-colors">
                                {c.name}
                              </span>
                              <span className="text-[10px] text-slate-400 uppercase font-mono">{c.itemCode}</span>
                            </div>
                          </div>
                          <span className="opacity-0 group-hover:opacity-100 text-[10px] text-cyan-700 font-mono transition-opacity flex items-center gap-0.5 shrink-0">
                            Audit <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 text-[10px] font-bold ${
                            c.isRaw ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                          }`}>
                            {c.isRaw ? 'Raw Material' : 'End Product'}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-700">
                          {c.sessions.toFixed(1)} hits/day
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-900">
                          +{c.dailyUnits.toFixed(1)} {c.itemCode.toUpperCase()}/day
                        </td>
                        <td className={`p-2.5 text-right font-black ${
                          c.netValue > 0 ? 'text-emerald-500' : c.netValue < 0 ? 'text-red-500' : 'text-blue-500'
                        }`}>
                          {c.netValue >= 0 ? '+' : ''}{c.netValue.toFixed(2)} BTC/day
                          {!c.isRaw && c.rawCostPerUnit > 0 && (
                            <span className="block text-[10px] text-slate-400 font-normal">
                              Net after -{(c.dailyUnits * c.rawCostPerUnit).toFixed(2)} BTC raw inputs
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {laborSimData.evenItems.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-4 text-center text-slate-400 font-sans">
                          No companies available to allocate personal labor.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {laborSimData.evenItems.length > 0 && (
                    <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                      <tr>
                        <td colSpan="2" className="p-2.5 text-slate-900 font-sans uppercase text-[11px]">
                          Portfolio Combined Total
                        </td>
                        <td className="p-2.5 text-right text-slate-900">
                          {laborSimData.dailySessions.toFixed(1)} hits/day
                        </td>
                        <td className="p-2.5 text-right text-slate-500 font-normal">
                          Balanced Spread
                        </td>
                        <td className={`p-2.5 text-right text-sm font-black ${
                          laborSimData.totalEvenYield > 0 ? 'text-emerald-500' : laborSimData.totalEvenYield < 0 ? 'text-red-500' : 'text-blue-500'
                        }`}>
                          {laborSimData.totalEvenYield >= 0 ? '+' : ''}{laborSimData.totalEvenYield.toFixed(2)} BTC/day
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM ALLOCATION */}
          {activeLaborSheet === 'custom' && (
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 font-sans">
                <span>Adjust custom labor percentage allocation across facilities. Click any company to audit variables.</span>
                <button
                  type="button"
                  onClick={handleResetCustomEven}
                  className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-mono font-bold text-[10px] transition cursor-pointer self-start sm:self-auto"
                >
                  Reset to Even Split
                </button>
              </div>

              <div className="border border-slate-200 overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Company (Click to Audit)</th>
                      <th className="p-2.5">Sector</th>
                      <th className="p-2.5 text-center">Allocation Share (%)</th>
                      <th className="p-2.5 text-right">Assigned Sessions</th>
                      <th className="p-2.5 text-right">Daily Output</th>
                      <th className="p-2.5 text-right">Net Value (BTC/day)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {laborSimData.customItems.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td 
                          onClick={() => setAuditCompanyId(c.id)}
                          className="p-2.5 flex items-center justify-between gap-2 cursor-pointer group hover:bg-slate-100/80 transition-colors"
                          title="Click to view full factual production & earnings breakdown"
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <div className="w-6 h-6 bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                              <ItemIcon itemCode={c.itemCode} size={16} />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 font-sans block truncate group-hover:text-cyan-800 transition-colors">
                                {c.name}
                              </span>
                              <span className="text-[10px] text-slate-400 uppercase font-mono">{c.itemCode}</span>
                            </div>
                          </div>
                          <span className="opacity-0 group-hover:opacity-100 text-[10px] text-cyan-700 font-mono transition-opacity flex items-center gap-0.5 shrink-0">
                            Audit <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 text-[10px] font-bold ${
                            c.isRaw ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                          }`}>
                            {c.isRaw ? 'Raw Material' : 'End Product'}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="inline-flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateCustomSplit(c.id, -5)}
                              className="w-5 h-5 bg-slate-200 hover:bg-slate-300 font-bold text-xs flex items-center justify-center cursor-pointer"
                              title="Decrease by 5%"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={Math.round(c.pct)}
                              onChange={(e) => handleSetCustomSplit(c.id, e.target.value)}
                              className="w-14 text-center py-0.5 px-1 border border-slate-300 bg-white font-bold text-slate-900 font-mono text-xs"
                            />
                            <span className="text-[11px] text-slate-500">%</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateCustomSplit(c.id, 5)}
                              className="w-5 h-5 bg-slate-200 hover:bg-slate-300 font-bold text-xs flex items-center justify-center cursor-pointer"
                              title="Increase by 5%"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-700">
                          {c.sessions.toFixed(1)} hits/day
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-900">
                          +{c.dailyUnits.toFixed(1)} {c.itemCode.toUpperCase()}/day
                        </td>
                        <td className={`p-2.5 text-right font-black ${
                          c.netValue > 0 ? 'text-emerald-500' : c.netValue < 0 ? 'text-red-500' : 'text-blue-500'
                        }`}>
                          {c.netValue >= 0 ? '+' : ''}{c.netValue.toFixed(2)} BTC/day
                          {!c.isRaw && c.rawCostPerUnit > 0 && (
                            <span className="block text-[10px] text-slate-400 font-normal">
                              Net after -{(c.dailyUnits * c.rawCostPerUnit).toFixed(2)} BTC raw inputs
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {laborSimData.customItems.length === 0 && (
                      <tr>
                        <td colSpan="6" className="p-4 text-center text-slate-400 font-sans">
                          No companies available to allocate personal labor.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {laborSimData.customItems.length > 0 && (
                    <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                      <tr>
                        <td colSpan="2" className="p-2.5 text-slate-900 font-sans uppercase text-[11px]">
                          Portfolio Combined Total
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 text-xs font-mono font-bold ${
                            Math.round(laborSimData.totalCustomPct) === 100 
                              ? 'text-emerald-500' 
                              : 'text-amber-500'
                          }`}>
                            {laborSimData.totalCustomPct.toFixed(1)}% {Math.round(laborSimData.totalCustomPct) !== 100 ? '(unbalanced)' : ''}
                          </span>
                        </td>
                        <td className="p-2.5 text-right text-slate-900">
                          {((laborSimData.totalCustomPct / 100) * laborSimData.dailySessions).toFixed(1)} hits/day
                        </td>
                        <td className="p-2.5 text-right text-slate-500 font-normal">
                          Custom Schedule
                        </td>
                        <td className={`p-2.5 text-right text-sm font-black ${
                          laborSimData.totalCustomYield > 0 ? 'text-emerald-500' : laborSimData.totalCustomYield < 0 ? 'text-red-500' : 'text-blue-500'
                        }`}>
                          {laborSimData.totalCustomYield >= 0 ? '+' : ''}{laborSimData.totalCustomYield.toFixed(2)} BTC/day
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: 100% FOCUSED ALLOCATION */}
          {activeLaborSheet === 'focused' && (
            <div className="space-y-2">
              <div className="text-[11px] text-slate-500 font-sans flex items-center justify-between">
                <span>Benchmarks output assuming 100% of daily personal labor ({laborSimData.dailySessions.toFixed(1)} hits/day) is poured exclusively into each company. Click any company to audit its factual variables.</span>
              </div>

              <div className="border border-slate-200 overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Company (Click to Audit)</th>
                      <th className="p-2.5">Sector</th>
                      <th className="p-2.5 text-right">Daily Output</th>
                      <th className="p-2.5 text-right">Net Value (BTC/day)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {laborSimData.focusedItems.map((c) => (
                      <tr 
                        key={c.id} 
                        onClick={() => setAuditCompanyId(c.id)}
                        className="hover:bg-slate-100/80 transition-colors cursor-pointer group"
                        title="Click to view full factual production & earnings breakdown"
                      >
                        <td className="p-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-2 min-w-0">
                            <div className="w-6 h-6 bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                              <ItemIcon itemCode={c.itemCode} size={16} />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 font-sans block truncate group-hover:text-cyan-800 transition-colors">
                                {c.name}
                              </span>
                              <span className="text-[10px] text-slate-400 uppercase font-mono">{c.itemCode}</span>
                            </div>
                          </div>
                          <span className="opacity-0 group-hover:opacity-100 text-[10px] text-cyan-700 font-mono transition-opacity flex items-center gap-0.5 shrink-0">
                            Audit <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 text-[10px] font-bold ${
                            c.isRaw ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                          }`}>
                            {c.isRaw ? 'Raw Material' : 'End Product'}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-900">
                          +{c.dailyUnits.toFixed(1)} {c.itemCode.toUpperCase()}/day
                        </td>
                        <td className={`p-2.5 text-right font-black ${
                          c.netValue > 0 ? 'text-emerald-500' : c.netValue < 0 ? 'text-red-500' : 'text-blue-500'
                        }`}>
                          {c.netValue >= 0 ? '+' : ''}{c.netValue.toFixed(2)} BTC/day
                          {!c.isRaw && c.rawCostPerUnit > 0 && (
                            <span className="block text-[10px] text-slate-400 font-normal">
                              Net after -{(c.dailyUnits * c.rawCostPerUnit).toFixed(2)} BTC raw inputs
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {laborSimData.focusedItems.length === 0 && (
                      <tr>
                        <td colSpan="4" className="p-4 text-center text-slate-400 font-sans">
                          No companies available to allocate personal labor.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. CATEGORY FILTERS & SYNC ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 border border-slate-200/80">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono scrollbar-none">
          <button
            type="button"
            onClick={() => setSectorFilter('all')}
            className={`px-3 py-1.5 transition cursor-pointer shrink-0 font-bold ${
              sectorFilter === 'all' 
                ? 'bg-slate-900 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Listed ({companies.length})
          </button>
          <button
            type="button"
            onClick={() => setSectorFilter('processed')}
            className={`px-3 py-1.5 transition cursor-pointer shrink-0 font-bold ${
              sectorFilter === 'processed' 
                ? 'bg-slate-900 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Manufactured ({companies.filter(c => !c.isRaw).length})
          </button>
          <button
            type="button"
            onClick={() => setSectorFilter('raw')}
            className={`px-3 py-1.5 transition cursor-pointer shrink-0 font-bold ${
              sectorFilter === 'raw' 
                ? 'bg-slate-900 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Raw Materials ({companies.filter(c => c.isRaw).length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 text-slate-600 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-700">Live Continuous Feed</span>
          </div>
        </div>
      </div>

      {/* 6. STOCK EXCHANGE LISTING BOARD (DATA TABLE WITH PP & PRICE RATIOS) */}
      <div className="bg-white overflow-hidden border border-slate-200/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 uppercase font-mono font-bold tracking-wider text-[11px]">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3 min-w-[180px]">Asset / Listing</th>
                <th className="py-3 px-3">Sector</th>
                <th className="py-3 px-3 text-right">Market Spot</th>
                <th className="py-3 px-3 text-right">Base Production</th>
                <th className="py-3 px-3 text-right">Base Revenue</th>
                <th className="py-3 px-3 text-right">Raw Costs</th>
                <th className="py-3 px-3 text-right">Salaries Paid</th>
                <th className="py-3 px-3 text-right">Base Profit</th>
                <th className="py-3 px-3 text-right">Base PP</th>
                <th className="py-3 px-3 text-right">Produced PP</th>
                <th className="py-3 px-3 text-right">PP Ratio (%)</th>
                <th className="py-3 px-3 text-right">Price / Base PP</th>
                <th className="py-3 px-3 text-center min-w-[110px]">Storage</th>
                <th className="py-3 px-3 text-center">Staff</th>
                <th className="py-3 px-3 text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={16} className="py-12 text-center text-slate-400 font-sans">
                    No companies match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((c, idx) => {
                  const baseIncome = c.baseNetProfit !== undefined ? c.baseNetProfit : (c.dailyNetProfit || 0);
                  const isPositiveBase = baseIncome >= 0;
                  const basePp = c.companyBaseDailyPp || 0;
                  const prodPp = c.companyProducedDailyPp || 0;
                  const ppRatio = c.ppRatioPct || (basePp > 0 ? (prodPp / basePp) * 100 : 100);
                  const priceRatio = c.pricePerBasePp || 0;

                  return (
                    <tr 
                      key={c.id || idx}
                      onClick={() => onSelectCompany(c.id)}
                      className="hover:bg-slate-50/90 transition cursor-pointer group border-b border-slate-100"
                    >
                      {/* Rank Index */}
                      <td className="py-3.5 px-3 text-center text-slate-400 font-bold group-hover:text-slate-700">
                        {idx + 1}
                      </td>

                      {/* Company Name & Ticker */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-none bg-slate-100 flex items-center justify-center shrink-0">
                            <ItemIcon itemCode={c.itemCode} size={20} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-extrabold text-slate-900 group-hover:text-blue-600 transition font-sans text-sm truncate">
                                {c.name}
                              </span>
                              {c.isRealGameCompany && (
                                <span className="inline-flex items-center text-emerald-700" title="Verified Game Facility">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-sans truncate">
                              <span className="font-bold text-slate-600">{c.countryCode}</span>
                              {c.mainCity ? ` • ${c.mainCity}` : ''}
                              {c.regionName ? ` (${c.regionName})` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Sector / Category */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold font-sans ${
                          c.isRaw || c.recipe?.type === 'raw'
                            ? 'bg-amber-100/70 text-amber-900' 
                            : 'bg-blue-100/70 text-blue-900'
                        }`}>
                          {c.recipe?.category || (c.isRaw ? 'Raw Materials' : 'Manufacturing')}
                        </span>
                      </td>

                      {/* Market Spot Price */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {c.spotPrice ? c.spotPrice.toFixed(3) : '—'}
                        </div>
                        {c.priceChange24h !== undefined && (
                          <div className={`text-[10px] font-bold ${c.priceChange24h.changePct > 0 ? 'text-emerald-500' : c.priceChange24h.changePct < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                            {c.priceChange24h.changePct >= 0 ? '+' : ''}{c.priceChange24h.changePct.toFixed(2)}%
                          </div>
                        )}
                      </td>

                      {/* Base Daily Production (Standard) */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <span className="font-bold text-slate-900">
                          {(c.baseUnits !== undefined ? c.baseUnits : (c.unitsPerDay || 0)).toFixed(1)}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">u/d</span>
                      </td>

                      {/* Base Revenue Per Day */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="font-bold text-emerald-500">
                          +{(c.grossRevenue ?? (c.baseUnits * (c.spotPrice || 0))).toFixed(2)}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          BTC/day
                        </span>
                      </td>

                      {/* Raw Material Costs */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className={`font-bold ${(c.dailyRawExpenseTotal || 0) > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                          {(c.dailyRawExpenseTotal || 0) > 0 ? `-${c.dailyRawExpenseTotal.toFixed(2)}` : '0.00'}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {c.isRaw ? 'Extraction' : 'Market Spot'}
                        </span>
                      </td>

                      {/* Base Salaries Paid Out */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className={`font-bold ${(c.dailyLaborExpense || 0) > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                          {(c.dailyLaborExpense || 0) > 0 ? `-${c.dailyLaborExpense.toFixed(2)}` : '0.00'}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {c.workers?.length ? `${c.workers.length} hired` : '0 hired'}
                        </span>
                      </td>

                      {/* Base Daily Profit (Standard) */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className={`font-bold ${baseIncome > 0 ? 'text-emerald-500' : baseIncome < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                          {baseIncome >= 0 ? '+' : ''}{baseIncome.toFixed(2)}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {c.baseNetMarginPct ? `${c.baseNetMarginPct.toFixed(1)}% margin` : '—'}
                        </span>
                      </td>

                      {/* Base PP (Daily) */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {basePp.toFixed(1)}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          Engine + Workers
                        </span>
                      </td>

                      {/* Produced PP (with bonuses) */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="font-bold text-blue-900">
                          {prodPp.toFixed(1)}
                        </div>
                        <span className="text-[10px] text-emerald-700 font-bold block">
                          +{c.totalBonusPct ? c.totalBonusPct.toFixed(1) : '0'}% bonus
                        </span>
                      </td>

                      {/* PP Ratio (%) */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 text-xs font-bold font-mono bg-slate-100 text-slate-800">
                          {ppRatio.toFixed(1)}%
                        </span>
                      </td>

                      {/* Price / Base PP */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {priceRatio.toFixed(3)}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          BTC / Base PP
                        </span>
                      </td>

                      {/* Storage / Capacity Progress */}
                      <td className="py-3.5 px-3">
                        <div className="w-full max-w-[110px] mx-auto space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>{(c.currentStoredPp || 0).toFixed(0)} PP</span>
                            <span>{(c.currentFillPct || 0).toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                (c.currentFillPct || 0) >= 90 ? 'bg-rose-500' : (c.currentFillPct || 0) >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, c.currentFillPct || 0))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Staff Count */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {(c.workers?.length || 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-800 font-bold text-[11px]">
                            <Users className="w-3 h-3 text-slate-600" />
                            <span>{c.workers.length}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-sans">
                            Automated
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCompany(c.id);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 group-hover:bg-blue-600 text-white font-bold text-xs transition cursor-pointer"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary Bar */}
        <div className="bg-slate-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-slate-600 border-t border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">Showing {filteredCompanies.length} of {companies.length} listed enterprises</span>
            <span>•</span>
            <span className="text-slate-500">Standardized Base Operations</span>
          </div>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
            <span>
              Revenue: <strong className="text-emerald-500 font-bold">+{marketOverview.totalBaseGrossRevenue.toFixed(2)} BTC</strong>
            </span>
            <span>•</span>
            <span>
              Raw Costs: <strong className={`font-bold ${marketOverview.totalBaseRawExpense > 0 ? 'text-red-500' : 'text-blue-500'}`}>-{marketOverview.totalBaseRawExpense.toFixed(2)} BTC</strong>
            </span>
            <span>•</span>
            <span>
              Salaries: <strong className={`font-bold ${marketOverview.totalBaseLaborExpense > 0 ? 'text-red-500' : 'text-blue-500'}`}>-{marketOverview.totalBaseLaborExpense.toFixed(2)} BTC</strong>
            </span>
            <span>•</span>
            <span>
              Net Profit: <strong className={`font-bold ${marketOverview.baseDailyProfit > 0 ? 'text-emerald-500' : marketOverview.baseDailyProfit < 0 ? 'text-red-500' : 'text-blue-500'}`}>{marketOverview.baseDailyProfit >= 0 ? '+' : ''}{marketOverview.baseDailyProfit.toFixed(2)} BTC</strong>
            </span>
            <span>•</span>
            <span>
              Total Base PP: <strong className="text-slate-900 font-bold">{marketOverview.totalCompanyBasePp.toFixed(1)}</strong>
            </span>
            <span>•</span>
            <span>
              Total Enterprise PP (incl. Self): <strong className="text-blue-900 font-bold">{marketOverview.totalInclusiveBasePp.toFixed(1)}</strong>
            </span>
          </div>
        </div>

      </div>

      {/* COMPANY PRODUCTION AUDIT & VARIABLE BREAKDOWN MODAL */}
      {auditedCompanyDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-300 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col font-sans select-none">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <ItemIcon itemCode={auditedCompanyDetails.company.itemCode} size={24} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
                      {auditedCompanyDetails.company.name}
                    </h2>
                    <span className={`px-2 py-0.5 text-[10px] font-mono font-bold border ${
                      auditedCompanyDetails.isRaw 
                        ? 'bg-amber-50 text-amber-800 border-amber-200' 
                        : 'bg-cyan-50 text-cyan-800 border-cyan-200'
                    }`}>
                      {auditedCompanyDetails.isRaw ? 'RAW EXTRACTION' : 'MANUFACTURED'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
                    <span>{auditedCompanyDetails.company.regionName || 'Regional Sector'} ({auditedCompanyDetails.company.countryCode || 'HQ'})</span>
                    <span>•</span>
                    <span>Spot: {auditedCompanyDetails.spotPrice.toFixed(3)} BTC</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAuditCompanyId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
                title="Close Audit"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable Audit Sections */}
            <div className="p-4 sm:p-5 space-y-5 overflow-y-auto font-mono text-xs text-slate-700 divide-y divide-slate-200">
              
              {/* SECTION 1: OWNER PERSONAL LABOR BREAKDOWN (SELF-WORK - PRIMARY FOCUS) */}
              <div className="space-y-3 pt-1 first:pt-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-bold font-sans text-slate-900 uppercase tracking-wide block">
                      1. Owner Personal Labor Breakdown (Self-Work)
                    </span>
                    <span className="text-[11px] text-slate-500 font-sans">
                      Primary personal audit • 0 wage payroll overhead • Direct capacity utilization
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-mono font-bold self-start sm:self-auto">
                    Primary Focus
                  </span>
                </div>

                {/* Player Variables & Facility Multipliers */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 border border-slate-200/70">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Player Stamina</span>
                    <strong className="text-slate-900 text-sm">{auditedCompanyDetails.energyStamina} Energy</strong>
                    <span className="text-[10px] text-slate-400 block font-normal">
                      {auditedCompanyDetails.dailySessions.toFixed(1)} hits/24h ({auditedCompanyDetails.readySessions} ready)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Player Base PP</span>
                    <strong className="text-slate-900 text-sm">{auditedCompanyDetails.playerBasePp} PP / hit</strong>
                    <span className="text-[10px] text-slate-400 block font-normal">
                      Prod Skill Lv.{auditedCompanyDetails.prodSkillLevel}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Facility Multiplier</span>
                    <strong className="text-emerald-700 text-sm font-bold">
                      {auditedCompanyDetails.appliedMultiplier.toFixed(3)}x
                    </strong>
                    <span className="text-[10px] text-slate-400 block font-normal">
                      +{auditedCompanyDetails.totalBonusPct.toFixed(1)}% bonus × 0.91
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Self-Work Yield / Hit</span>
                    <strong className="text-slate-900 text-sm">{auditedCompanyDetails.selfWorkPpPerHit.toFixed(2)} PP</strong>
                    <span className="text-[10px] text-emerald-600 block font-bold">
                      +{auditedCompanyDetails.selfWorkUnitsPerHit.toFixed(3)} {auditedCompanyDetails.company.itemCode?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Self-Work 100% Capacity Statement */}
                <div className="bg-slate-50 p-3 border border-slate-200/70 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wide font-sans mb-1">
                    100% Focused Daily Self-Work Economics ({auditedCompanyDetails.dailySessions.toFixed(1)} hits/day):
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Delivered Output PP:</span>
                    <strong className="text-slate-900 font-bold">{auditedCompanyDetails.selfWorkDailyPp.toFixed(1)} PP/day</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Physical Daily Output ({auditedCompanyDetails.recipePp} PP/unit):</span>
                    <strong className="text-slate-900 font-bold">+{auditedCompanyDetails.selfWorkDailyUnits.toFixed(2)} {auditedCompanyDetails.company.itemCode?.toUpperCase()}/day</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Gross Daily Revenue (+{auditedCompanyDetails.selfWorkDailyUnits.toFixed(2)} × {auditedCompanyDetails.spotPrice.toFixed(3)} BTC):</span>
                    <strong className="text-emerald-500 font-bold">+{auditedCompanyDetails.selfWorkGrossRevenue.toFixed(2)} BTC/day</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Raw Material Input Costs:</span>
                    <strong className={auditedCompanyDetails.selfWorkRawCost > 0 ? "text-red-500 font-bold" : "text-blue-500 font-bold"}>
                      {auditedCompanyDetails.selfWorkRawCost > 0 ? `-${auditedCompanyDetails.selfWorkRawCost.toFixed(2)}` : '0.00'} BTC/day
                    </strong>
                  </div>
                  {!auditedCompanyDetails.isRaw && auditedCompanyDetails.recipeInputs.length > 0 && (
                    <div className="pl-3 py-1 bg-white/70 border-l-2 border-slate-200 text-[11px] text-slate-500 space-y-0.5">
                      {auditedCompanyDetails.recipeInputs.map(inp => (
                        <div key={inp.id} className="flex justify-between">
                          <span>• Consumes {(auditedCompanyDetails.selfWorkDailyUnits * inp.qty).toFixed(1)} {inp.name} ({inp.qty} / unit @ {inp.unitMarketPrice.toFixed(3)} BTC)</span>
                          <span className="text-red-500 font-mono">-{(auditedCompanyDetails.selfWorkDailyUnits * inp.unitCost).toFixed(2)} BTC</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Workforce Payroll Expense:</span>
                    <strong className="text-blue-500 font-bold">0.00 BTC/day</strong>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-bold text-xs">
                    <span className="text-slate-900 font-sans">Net Personal Labor Value Added:</span>
                    <span className={`text-sm font-black ${
                      auditedCompanyDetails.selfWorkNetValue > 0 ? 'text-emerald-500' : auditedCompanyDetails.selfWorkNetValue < 0 ? 'text-red-500' : 'text-blue-500'
                    }`}>
                      {auditedCompanyDetails.selfWorkNetValue >= 0 ? '+' : ''}{auditedCompanyDetails.selfWorkNetValue.toFixed(2)} BTC/day
                      <span className="text-xs font-normal text-slate-500 ml-1.5 font-mono">
                        ({auditedCompanyDetails.selfWorkMarginPct.toFixed(1)}% margin)
                      </span>
                    </span>
                  </div>
                </div>

                {/* Active Allocation Context Callout */}
                {activeLaborSheet !== 'focused' && (
                  <div className="p-2.5 bg-blue-50/60 border border-blue-200/70 text-[11px] text-slate-700 font-sans flex items-center justify-between">
                    <div>
                      <strong className="text-blue-900 block font-mono uppercase text-[10px]">Current Schedule: {auditedCompanyDetails.activeAllocationLabel}</strong>
                      <span>Allocates <strong>{auditedCompanyDetails.activeSessions.toFixed(1)} hits/day</strong> to this facility</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-slate-900 font-bold block">+{auditedCompanyDetails.activeUnits.toFixed(2)} {auditedCompanyDetails.company.itemCode?.toUpperCase()}/day</span>
                      <span className={`font-black ${auditedCompanyDetails.activeNet > 0 ? 'text-emerald-500' : auditedCompanyDetails.activeNet < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                        {auditedCompanyDetails.activeNet >= 0 ? '+' : ''}{auditedCompanyDetails.activeNet.toFixed(2)} BTC/day net
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: BASE FACILITY OPERATIONS (HARDWARE & WORKFORCE) */}
              <div className="space-y-3 pt-3">
                <div className="pb-1 border-b border-slate-100">
                  <span className="text-xs font-bold font-sans text-slate-900 uppercase tracking-wide block">
                    2. Base Facility Operations (Engine & Hired Workforce)
                  </span>
                  <span className="text-[11px] text-slate-500 font-sans">
                    Autonomous baseline facility yield without personal owner intervention
                  </span>
                </div>

                {/* Automated Engine Hardware */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 border border-slate-200/70">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Engine Hardware</span>
                    <strong className="text-slate-900 text-sm">Tier Lv.{auditedCompanyDetails.engineLevel}</strong>
                    <span className="text-[10px] text-slate-400 block font-normal">{auditedCompanyDetails.engineBasePph} PP/h ({auditedCompanyDetails.engineBaseDailyPp} PP/24h)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Engine Delivered Yield</span>
                    <strong className="text-slate-900 text-sm">{auditedCompanyDetails.engineDeliveredDailyPp.toFixed(1)} PP/day</strong>
                    <span className="text-[10px] text-slate-400 block font-normal">+{auditedCompanyDetails.engineDailyUnits.toFixed(2)} {auditedCompanyDetails.company.itemCode?.toUpperCase()}/d</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Storage Warehouse</span>
                    <strong className="text-slate-900 text-sm">Level {auditedCompanyDetails.storageLevel}</strong>
                    <span className="text-[10px] text-slate-400 block font-normal">{auditedCompanyDetails.storageCapacityPp} PP capacity</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Hired Workforce</span>
                    <strong className="text-slate-900 text-sm">{auditedCompanyDetails.workforceCount} Workers</strong>
                    <span className="text-[10px] text-slate-400 block font-normal">{auditedCompanyDetails.workforceCount > 0 ? `${auditedCompanyDetails.workforceProducedPp.toFixed(1)} PP/day` : 'None hired'}</span>
                  </div>
                </div>

                {/* Hired Workforce Roster Table */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-sans">
                    <span className="font-bold text-slate-800 uppercase">Hired Workforce Roster ({auditedCompanyDetails.workforceCount} Employees):</span>
                    <span className="text-slate-500 font-mono">Contract Labor PP & Payroll Outflows</span>
                  </div>

                  {auditedCompanyDetails.workforceCount > 0 ? (
                    <div className="border border-slate-200 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="p-2">Worker</th>
                            <th className="p-2 text-right">Base PP</th>
                            <th className="p-2 text-right">Fidelity / Dev</th>
                            <th className="p-2 text-right">Labor PP/Hit</th>
                            <th className="p-2 text-right">Daily Hits</th>
                            <th className="p-2 text-right">24h Labor PP</th>
                            <th className="p-2 text-right">24h Output PP</th>
                            <th className="p-2 text-right">Gross Payroll</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {auditedCompanyDetails.normalizedWorkers.map((w, idx) => (
                            <tr key={w.id || idx} className="hover:bg-slate-50">
                              <td className="p-2 font-bold text-slate-900 font-sans">
                                @{w.username}
                                <span className="block text-[10px] text-slate-400 font-mono font-normal">Lv.{w.level}</span>
                              </td>
                              <td className="p-2 text-right text-slate-700">
                                {w.basePp} PP
                              </td>
                              <td className="p-2 text-right text-slate-600">
                                <span className="text-emerald-600 font-bold">+{w.fidelity}%</span> / +{w.devPct}%
                              </td>
                              <td className="p-2 text-right text-slate-900 font-bold">
                                {w.laborPpPerHit.toFixed(2)} PP
                              </td>
                              <td className="p-2 text-right text-slate-700">
                                {w.dailySessions.toFixed(2)} /d
                              </td>
                              <td className="p-2 text-right text-slate-800">
                                {w.dailyLaborPp.toFixed(1)} PP
                              </td>
                              <td className="p-2 text-right text-slate-900 font-bold">
                                {w.dailyProducedPp.toFixed(1)} PP
                              </td>
                              <td className="p-2 text-right text-red-500 font-bold">
                                -{w.grossDailyWage.toFixed(2)} BTC
                                <span className="block text-[10px] text-slate-400 font-normal">
                                  {w.wageRate.toFixed(3)} BTC/PP
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900 font-mono">
                          <tr>
                            <td colSpan="5" className="p-2 text-slate-600 uppercase text-[10px] font-sans">
                              Workforce Totals ({auditedCompanyDetails.workforceCount} Workers)
                            </td>
                            <td className="p-2 text-right text-slate-800">
                              {auditedCompanyDetails.workforceLaborPp.toFixed(1)} PP/day
                            </td>
                            <td className="p-2 text-right text-slate-900">
                              {auditedCompanyDetails.workforceProducedPp.toFixed(1)} PP/day
                            </td>
                            <td className="p-2 text-right text-red-500">
                              -{auditedCompanyDetails.workforceDailyPayroll.toFixed(2)} BTC/day
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 text-slate-500 text-center font-sans text-xs">
                      No workers hired for this facility. Operations rely exclusively on the automated engine.
                    </div>
                  )}
                </div>

                {/* Base Operations Financial Statement */}
                <div className="bg-slate-50 p-3 border border-slate-200/70 space-y-1.5 font-mono text-xs">
                  <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wide font-sans mb-1">
                    Base Facility Daily Financials (Engine + Workforce):
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Base Physical Output ({auditedCompanyDetails.baseDeliveredDailyPp.toFixed(1)} PP / {auditedCompanyDetails.recipePp} PP):</span>
                    <strong className="text-slate-900 font-bold">+{auditedCompanyDetails.baseDailyUnits.toFixed(2)} {auditedCompanyDetails.company.itemCode?.toUpperCase()}/day</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Base Gross Revenue (+{auditedCompanyDetails.baseDailyUnits.toFixed(2)} × {auditedCompanyDetails.spotPrice.toFixed(3)} BTC):</span>
                    <strong className="text-emerald-500 font-bold">+{auditedCompanyDetails.baseGrossRevenue.toFixed(2)} BTC/day</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Base Raw Material Costs:</span>
                    <strong className={auditedCompanyDetails.baseRawCost > 0 ? "text-red-500 font-bold" : "text-blue-500 font-bold"}>
                      {auditedCompanyDetails.baseRawCost > 0 ? `-${auditedCompanyDetails.baseRawCost.toFixed(2)}` : '0.00'} BTC/day
                    </strong>
                  </div>
                  {!auditedCompanyDetails.isRaw && auditedCompanyDetails.recipeInputs.length > 0 && (
                    <div className="pl-3 py-1 bg-white/70 border-l-2 border-slate-200 text-[11px] text-slate-500 space-y-0.5">
                      {auditedCompanyDetails.recipeInputs.map(inp => (
                        <div key={inp.id} className="flex justify-between">
                          <span>• Consumes {(auditedCompanyDetails.baseDailyUnits * inp.qty).toFixed(1)} {inp.name} ({inp.qty} / unit @ {inp.unitMarketPrice.toFixed(3)} BTC)</span>
                          <span className="text-red-500 font-mono">-{(auditedCompanyDetails.baseDailyUnits * inp.unitCost).toFixed(2)} BTC</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Hired Workforce Payroll:</span>
                    <strong className={auditedCompanyDetails.basePayroll > 0 ? "text-red-500 font-bold" : "text-blue-500 font-bold"}>
                      {auditedCompanyDetails.basePayroll > 0 ? `-${auditedCompanyDetails.basePayroll.toFixed(2)}` : '0.00'} BTC/day
                    </strong>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-bold text-xs">
                    <span className="text-slate-900 font-sans">Base Net Facility Daily Profit:</span>
                    <span className={`text-sm font-black ${
                      auditedCompanyDetails.baseNetProfit > 0 ? 'text-emerald-500' : auditedCompanyDetails.baseNetProfit < 0 ? 'text-red-500' : 'text-blue-500'
                    }`}>
                      {auditedCompanyDetails.baseNetProfit >= 0 ? '+' : ''}{auditedCompanyDetails.baseNetProfit.toFixed(2)} BTC/day
                      <span className="text-xs font-normal text-slate-500 ml-1.5 font-mono">
                        ({auditedCompanyDetails.baseMarginPct.toFixed(1)}% margin)
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: COMBINED FACILITY TOTAL (BASE + SELF-WORK COMBINED) */}
              <div className="space-y-3 pt-3">
                <div className="pb-1 border-b border-slate-100">
                  <span className="text-xs font-bold font-sans text-slate-900 uppercase tracking-wide block">
                    3. Combined Facility Total (Base Operations + Owner Self-Work)
                  </span>
                  <span className="text-[11px] text-slate-500 font-sans">
                    Total facility performance reconciling base autonomous operations and personal owner labor
                  </span>
                </div>

                {/* Side-by-side reconciliation matrix */}
                <div className="border border-slate-200 overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5 font-sans">Performance Metric</th>
                        <th className="p-2.5 text-right">Base Facility</th>
                        <th className="p-2.5 text-right">+ Self-Work (100%)</th>
                        <th className="p-2.5 text-right bg-slate-100 text-slate-900">Total Combined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2.5 text-slate-700 font-sans font-bold">24h Delivered PP</td>
                        <td className="p-2.5 text-right text-slate-800">{auditedCompanyDetails.baseDeliveredDailyPp.toFixed(1)} PP</td>
                        <td className="p-2.5 text-right text-slate-800">+{auditedCompanyDetails.selfWorkDailyPp.toFixed(1)} PP</td>
                        <td className="p-2.5 text-right font-bold text-slate-900 bg-slate-50">{auditedCompanyDetails.combined100DeliveredPp.toFixed(1)} PP/day</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-slate-700 font-sans font-bold">Physical Daily Output</td>
                        <td className="p-2.5 text-right text-slate-800">+{auditedCompanyDetails.baseDailyUnits.toFixed(2)}</td>
                        <td className="p-2.5 text-right text-slate-800">+{auditedCompanyDetails.selfWorkDailyUnits.toFixed(2)}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900 bg-slate-50">+{auditedCompanyDetails.combined100Units.toFixed(2)} {auditedCompanyDetails.company.itemCode?.toUpperCase()}/day</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-slate-700 font-sans font-bold">Gross Daily Revenue</td>
                        <td className="p-2.5 text-right text-emerald-500 font-bold">+{auditedCompanyDetails.baseGrossRevenue.toFixed(2)} BTC</td>
                        <td className="p-2.5 text-right text-emerald-500 font-bold">+{auditedCompanyDetails.selfWorkGrossRevenue.toFixed(2)} BTC</td>
                        <td className="p-2.5 text-right text-emerald-500 font-black bg-slate-50">+{auditedCompanyDetails.combined100Gross.toFixed(2)} BTC/day</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-slate-700 font-sans font-bold">Raw Material Expenses</td>
                        <td className={`p-2.5 text-right font-bold ${auditedCompanyDetails.baseRawCost > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                          {auditedCompanyDetails.baseRawCost > 0 ? `-${auditedCompanyDetails.baseRawCost.toFixed(2)}` : '0.00'} BTC
                        </td>
                        <td className={`p-2.5 text-right font-bold ${auditedCompanyDetails.selfWorkRawCost > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                          {auditedCompanyDetails.selfWorkRawCost > 0 ? `-${auditedCompanyDetails.selfWorkRawCost.toFixed(2)}` : '0.00'} BTC
                        </td>
                        <td className={`p-2.5 text-right font-bold bg-slate-50 ${auditedCompanyDetails.combined100RawCost > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                          {auditedCompanyDetails.combined100RawCost > 0 ? `-${auditedCompanyDetails.combined100RawCost.toFixed(2)}` : '0.00'} BTC/day
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-slate-700 font-sans font-bold">Workforce Payroll</td>
                        <td className={`p-2.5 text-right font-bold ${auditedCompanyDetails.basePayroll > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                          {auditedCompanyDetails.basePayroll > 0 ? `-${auditedCompanyDetails.basePayroll.toFixed(2)}` : '0.00'} BTC
                        </td>
                        <td className="p-2.5 text-right font-bold text-blue-500">
                          0.00 BTC
                        </td>
                        <td className={`p-2.5 text-right font-bold bg-slate-50 ${auditedCompanyDetails.combined100Payroll > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                          {auditedCompanyDetails.combined100Payroll > 0 ? `-${auditedCompanyDetails.combined100Payroll.toFixed(2)}` : '0.00'} BTC/day
                        </td>
                      </tr>
                      <tr className="bg-slate-100/80 font-black">
                        <td className="p-2.5 text-slate-900 font-sans">Net Daily Earnings</td>
                        <td className={`p-2.5 text-right ${auditedCompanyDetails.baseNetProfit > 0 ? 'text-emerald-500' : auditedCompanyDetails.baseNetProfit < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                          {auditedCompanyDetails.baseNetProfit >= 0 ? '+' : ''}{auditedCompanyDetails.baseNetProfit.toFixed(2)} BTC
                        </td>
                        <td className={`p-2.5 text-right ${auditedCompanyDetails.selfWorkNetValue > 0 ? 'text-emerald-500' : auditedCompanyDetails.selfWorkNetValue < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                          +{auditedCompanyDetails.selfWorkNetValue.toFixed(2)} BTC
                        </td>
                        <td className={`p-2.5 text-right text-sm bg-slate-200/60 ${auditedCompanyDetails.combined100Net > 0 ? 'text-emerald-500' : auditedCompanyDetails.combined100Net < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                          {auditedCompanyDetails.combined100Net >= 0 ? '+' : ''}{auditedCompanyDetails.combined100Net.toFixed(2)} BTC/day
                          <span className="block text-[10px] font-normal text-slate-500">
                            {auditedCompanyDetails.combined100MarginPct.toFixed(1)}% margin
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* If active schedule is Even or Custom, show active combination */}
                {activeLaborSheet !== 'focused' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 font-mono text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-sans">Active Schedule Combined Yield ({auditedCompanyDetails.activeAllocationLabel}):</span>
                      <strong className="text-slate-900">+{auditedCompanyDetails.combinedActiveUnits.toFixed(2)} {auditedCompanyDetails.company.itemCode?.toUpperCase()}/day</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-sans">Active Schedule Net Profit:</span>
                      <strong className={`text-sm font-black ${
                        auditedCompanyDetails.combinedActiveNet > 0 ? 'text-emerald-500' : auditedCompanyDetails.combinedActiveNet < 0 ? 'text-red-500' : 'text-blue-500'
                      }`}>
                        {auditedCompanyDetails.combinedActiveNet >= 0 ? '+' : ''}{auditedCompanyDetails.combinedActiveNet.toFixed(2)} BTC/day
                        <span className="text-xs font-normal text-slate-500 ml-1.5 font-mono">
                          ({auditedCompanyDetails.combinedActiveMarginPct.toFixed(1)}% margin)
                        </span>
                      </strong>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setAuditCompanyId(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. INTERACTIVE COMPREHENSIVE METRIC BREAKDOWN POPUP MODAL */}
      <MetricBreakdownModal
        isOpen={activeBreakdownMetric !== null}
        activeMetric={activeBreakdownMetric || 'valuation'}
        onClose={() => setActiveBreakdownMetric(null)}
        onChangeMetric={(metric) => setActiveBreakdownMetric(metric)}
        companies={companies}
        marketOverview={marketOverview}
        user={user}
        wealth={wealth}
        ownerLabor={ownerLabor}
        hourlyStats={hourlyStats}
        liveTotalNetWorth={liveTotalNetWorth}
        liveFacilitiesVal={liveFacilitiesVal}
        liveItemsVal={liveItemsVal}
        liquidMoneyVal={liquidMoneyVal}
        equipmentVal={equipmentVal}
        weaponsVal={weaponsVal}
        managementLevel={managementLevel}
        maxHiringSlots={maxHiringSlots}
        prices={prices}
        priceChanges24h={priceChanges24h}
        onSelectCompany={(cid) => {
          setActiveBreakdownMetric(null);
          onSelectCompany?.(cid);
        }}
      />

    </div>
  );
}
