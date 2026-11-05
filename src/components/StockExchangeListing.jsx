import React, { useState, useMemo, useEffect } from 'react';
import { 
  RotateCw, 
  ChevronRight, 
  CheckCircle2,
  Users,
  User,
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
  MapPin,
  X
} from 'lucide-react';
import ItemIcon from './ItemIcon';
import MetricBreakdownModal from './MetricBreakdownModal';
import { api } from '../services/wareraApi';
import { RECIPES } from '../data/gameData';
import { getCountryFlag } from './CompanyPortfolio';
import { getCountryName } from '../data/traitSynergyEngine';

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

/**
 * User / Portfolio Owner FIFA Trading Card Component
 * Order: Image -> Name -> Level -> Country -> Current Location -> Total Net Worth.
 * Contrast: Bright vivid neon green/red for past 1h change.
 */
function UserFifaCard({
  avatar,
  name,
  level,
  countryFlag,
  countryName,
  currentLocation,
  netWorth,
  hourlyStats
}) {
  return (
    <div 
      className="rounded-2xl p-4 border-2 border-[#fced9a] ring-1 ring-[#875c12]/40 select-none transition-all duration-300 hover:brightness-105 flex flex-col justify-between opacity-100 shadow-[0_12px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.16)] shrink-0"
      style={{
        background: 'linear-gradient(160deg, #f7e7a3 0%, #ecd077 18%, #dbb048 42%, #c9992c 68%, #b3801a 88%, #9c6c10 100%)',
        width: '260px',
        minHeight: '340px'
      }}
    >
      {/* 1. Image (Clean, unobstructed) */}
      <div className="w-24 h-28 mx-auto rounded-xl overflow-hidden p-0.5 border border-[#8a6316]/60 shadow-md mt-1 bg-gradient-to-b from-[#fceda2] to-[#875c12] relative">
        {avatar ? (
          <img 
            src={avatar} 
            alt={name} 
            className="w-full h-full object-cover rounded-[8px]" 
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.parentElement?.querySelector('.avatar-fallback');
              if (fallback) fallback.classList.remove('hidden');
            }}
          />
        ) : null}
        <div 
          className={`avatar-fallback w-full h-full bg-slate-900 text-amber-300 font-extrabold text-3xl flex items-center justify-center rounded-[8px] ${avatar ? 'hidden' : ''}`}
        >
          {name ? name.charAt(0).toUpperCase() : 'U'}
        </div>
      </div>

      {/* 2. Name */}
      <div className="py-1 px-2.5 rounded-md bg-white/40 border border-[#8a6316]/30 text-center my-0.5 shadow-inner">
        <span className="text-xs font-black uppercase text-[#241703] truncate block font-sans tracking-wide">
          {name}
        </span>
      </div>

      {/* 3. Level */}
      <div className="flex items-center justify-center gap-1 py-0.5 px-2 bg-black/15 rounded-md border border-[#8a6316]/30 text-center mx-auto w-full max-w-[130px] shadow-xs my-0.5 font-mono">
        <span className="text-[10px] font-extrabold text-[#241703] tracking-wider uppercase">
          Level {level || 1}
        </span>
      </div>

      {/* 4. Country (Flag + Full Country Name) */}
      <div className="flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-md bg-black/15 border border-[#8a6316]/30 text-center mx-auto w-full max-w-[170px] shadow-xs my-0.5">
        <span className="text-sm shrink-0 leading-none">{countryFlag}</span>
        <span className="text-[10px] font-black uppercase tracking-wider text-[#241703] font-sans truncate">
          {countryName}
        </span>
      </div>

      {/* 5. Current Location */}
      <div className="flex items-center justify-center gap-1 py-0.5 px-2 bg-black/10 rounded-md border border-[#8a6316]/20 font-sans text-[10px] text-[#3a2503] font-bold truncate mx-auto w-full max-w-[220px] my-0.5">
        <MapPin className="w-3 h-3 text-rose-700 shrink-0" />
        <span className="truncate">{currentLocation}</span>
      </div>

      {/* 6. Total Net Worth (Bright High-Contrast Change) */}
      <div className="flex flex-col items-center justify-center py-2 px-3 bg-black/20 rounded-lg border border-[#8a6316]/30 font-mono text-[#241703] mt-1 w-full shadow-inner">
        <div className="text-[9px] font-bold uppercase tracking-wider text-[#472f05] flex items-center gap-1">
          <span>Total Net Worth</span>
        </div>
        <div className="text-sm font-black text-[#1a1102] tracking-tight">
          {typeof netWorth === 'number' ? netWorth.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '0.0'} BTC
        </div>
        {hourlyStats && (
          <div className={`text-[10px] font-black tracking-tight ${hourlyStats.netWorthCoins >= 0 ? 'text-[#00e676]' : 'text-[#ff1744]'}`}>
            {hourlyStats.netWorthCoins >= 0 ? '+' : ''}{hourlyStats.netWorthCoins.toFixed(1)} ({hourlyStats.netWorthPct >= 0 ? '+' : ''}{hourlyStats.netWorthPct.toFixed(2)}%) past 1h
          </div>
        )}
      </div>
    </div>
  );
}

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

    // Direct ground-truth aggregations across active companies
    const sumCompanyGrossRevenue = companies.reduce((sum, c) => sum + (c.dailyGrossRevenue ?? c.grossRevenue ?? 0), 0);
    const sumCompanyWorkerExpense = companies.reduce((sum, c) => sum + (c.workersDailyWages ?? c.dailyLaborExpense ?? 0), 0);
    const sumCompanyManagerExpense = companies.reduce((sum, c) => sum + (c.managerPay ?? 0), 0);
    const sumCompanyLaborExpense = sumCompanyWorkerExpense + sumCompanyManagerExpense;
    const sumCompanyRawExpense = companies.reduce((sum, c) => sum + (c.dailyRawExpenseTotal ?? 0), 0);
    const sumCompanyNetProfit = sumCompanyGrossRevenue - sumCompanyLaborExpense - sumCompanyRawExpense;
    const sumCompanyDailyUnits = companies.reduce((sum, c) => sum + (c.baseUnits ?? 0), 0);
    const sumCompanyProducedPp = companies.reduce((sum, c) => sum + (c.companyProducedDailyPp ?? 0), 0);
    const sumCompanyBasePp = companies.reduce((sum, c) => sum + (c.companyBaseDailyPp ?? c.companyProducedDailyPp ?? 0), 0);
    const sumCompanyWorkers = companies.reduce((sum, c) => sum + (c.enrichedWorkers?.length || c.employees?.length || c.workers?.length || 0), 0);
    const sumCompanyManagers = companies.reduce((sum, c) => sum + (c.hasManager ? 1 : 0), 0);

    const totalWorkerWages = (typeof portfolioTotals?.totalWorkerWages === 'number')
      ? portfolioTotals.totalWorkerWages
      : sumCompanyWorkerExpense;

    const totalManagerCost = (typeof portfolioTotals?.totalManagerCost === 'number')
      ? portfolioTotals.totalManagerCost
      : sumCompanyManagerExpense;

    const totalBaseGrossRevenue = (typeof portfolioTotals?.totalBaseGrossRevenue === 'number' && portfolioTotals.totalBaseGrossRevenue > 0)
      ? portfolioTotals.totalBaseGrossRevenue
      : sumCompanyGrossRevenue;

    const totalBaseLaborExpense = (typeof portfolioTotals?.totalBaseLaborExpense === 'number' && portfolioTotals.totalBaseLaborExpense > 0)
      ? portfolioTotals.totalBaseLaborExpense
      : (totalWorkerWages + totalManagerCost);

    const totalBaseRawExpense = typeof portfolioTotals?.totalBaseRawExpense === 'number'
      ? portfolioTotals.totalBaseRawExpense
      : sumCompanyRawExpense;

    const baseDailyProfit = (typeof portfolioTotals?.totalBaseNetProfit === 'number' && Math.abs(portfolioTotals.totalBaseNetProfit) > 0)
      ? portfolioTotals.totalBaseNetProfit
      : (totalBaseGrossRevenue - totalBaseLaborExpense - totalBaseRawExpense);

    const totalBaseDailyUnits = (typeof portfolioTotals?.totalBaseProductionUnits === 'number' && portfolioTotals.totalBaseProductionUnits > 0)
      ? portfolioTotals.totalBaseProductionUnits
      : sumCompanyDailyUnits;

    const totalCompanyProducedPp = (typeof portfolioTotals?.totalCompanyProducedPp === 'number' && portfolioTotals.totalCompanyProducedPp > 0)
      ? portfolioTotals.totalCompanyProducedPp
      : sumCompanyProducedPp;

    const totalCompanyBasePp = (typeof portfolioTotals?.totalCompanyBasePp === 'number' && portfolioTotals.totalCompanyBasePp > 0)
      ? portfolioTotals.totalCompanyBasePp
      : sumCompanyBasePp;

    const totalDailySelfWorkPp = 0;
    const totalInclusiveBasePp = totalCompanyProducedPp;
    const baseNetMarginPct = totalBaseGrossRevenue > 0 ? (baseDailyProfit / totalBaseGrossRevenue) * 100 : 0;

    const totalRawBaseUnits = companies.filter(c => c.isRaw).reduce((sum, c) => sum + (c.baseUnits ?? 0), 0);
    const totalFinishedBaseUnits = companies.filter(c => !c.isRaw).reduce((sum, c) => sum + (c.baseUnits ?? 0), 0);

    const total24hGrowthCoins = companies.reduce((sum, c) => sum + (c.growth24hCoins || 0), 0);
    const baselineValuation = Math.max(1, totalValuation - total24hGrowthCoins);
    const total24hGrowthPct = (total24hGrowthCoins / baselineValuation) * 100;
    const totalWorkers = (typeof portfolioTotals?.totalEmployees === 'number' && portfolioTotals.totalEmployees > 0)
      ? portfolioTotals.totalEmployees
      : sumCompanyWorkers;

    const totalManagers = (typeof portfolioTotals?.totalManagers === 'number')
      ? portfolioTotals.totalManagers
      : sumCompanyManagers;

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
      totalWorkerWages,
      totalManagerCost,
      totalManagers,
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

  // Dynamic Country Resolution (user.country is official citizenship, e.g. Israel)
  const [resolvedCountry, setResolvedCountry] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (user?.country && /^[a-f\d]{24}$/i.test(user.country)) {
      api.getCountryById(user.country).then(c => {
        if (isMounted && c) {
          setResolvedCountry({
            code: c.code?.toUpperCase(),
            name: c.name
          });
        }
      }).catch(() => {});
    }
    return () => { isMounted = false; };
  }, [user?.country]);

  // Region & Location resolution with live updates
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
    if (user?.homeRegionName) {
      setResolvedHomeRegion(`${user.homeRegionName}${user.homeCountryCode ? ` (${user.homeCountryCode})` : ''}`);
    } else if (user?.region && /^[a-f\d]{24}$/i.test(user.region)) {
      api.getRegionById(user.region).then(r => {
        if (isMounted && r) {
          setResolvedHomeRegion(`${r.name || 'Regional Sector'}${r.countryCode ? ` (${r.countryCode.toUpperCase()})` : ''}`);
        }
      }).catch(() => {});
    }

    if (user?.currentLocationName) {
      setResolvedCurrentLoc(`${user.currentLocationName}${user.currentCountryCode ? ` (${user.currentCountryCode})` : ''}`);
    } else if (user?.location && /^[a-f\d]{24}$/i.test(user.location)) {
      api.getRegionById(user.location).then(r => {
        if (isMounted && r) {
          setResolvedCurrentLoc(`${r.name || 'Regional Sector'}${r.countryCode ? ` (${r.countryCode.toUpperCase()})` : ''}`);
        }
      }).catch(() => {});
    }

    return () => { isMounted = false; };
  }, [user?.region, user?.location, user?.homeRegionName, user?.currentLocationName, user?.currentCountryCode, user?.homeCountryCode]);

  const homeRegionDisplay = resolvedHomeRegion 
    || (companies[0] ? `${companies[0].regionName} (${companies[0].countryCode})` : 'Central District (HQ)');

  const currentLocDisplay = resolvedCurrentLoc 
    || homeRegionDisplay;

  // Owner Country Info (Prioritizes official citizenship country, e.g. Israel 'IL')
  const ownerCountryCode = resolvedCountry?.code
    || (user?.countryCode && typeof user.countryCode === 'string' ? user.countryCode.toUpperCase() : null)
    || (user?.countryData?.code ? user.countryData.code.toUpperCase() : null)
    || (typeof user?.country === 'string' && user.country.length === 2 ? user.country.toUpperCase() : null)
    || user?.currentCountryCode
    || user?.homeCountryCode
    || companies[0]?.countryCode
    || 'IL';

  const ownerCountryFlag = getCountryFlag(ownerCountryCode);
  const ownerCountryName = resolvedCountry?.name
    || user?.countryName
    || user?.countryData?.name
    || getCountryName(ownerCountryCode)
    || (ownerCountryCode === 'HQ' ? 'Global HQ' : ownerCountryCode);

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

  // Live Portfolio Net Worth & Breakdown (matches authoritative in-game wealth stats and live updates with yield/prices)
    return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-4 space-y-5 select-none font-sans">
      
      {/* 1. TOP DASHBOARD: 3-PART UNIFIED LAYOUT (USER CARD LEFT, NET WORTH BREAKDOWN CENTER, OVERVIEW CARDS RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* LEFT: USER FIFA CARD (FLOATING ON PAGE) */}
        <div className="lg:col-span-3 flex justify-center lg:justify-start items-center">
          <UserFifaCard
            avatar={ownerAvatar}
            name={ownerName}
            level={ownerLevel}
            countryFlag={ownerCountryFlag}
            countryName={ownerCountryName}
            currentLocation={currentLocDisplay}
            netWorth={liveTotalNetWorth}
            hourlyStats={hourlyStats}
          />
        </div>

        {/* CENTER: NET WORTH BREAKDOWN - ROYAL PURPLE GRADIENT SHADE */}
        <div className="lg:col-span-4 bg-gradient-to-br from-purple-100/80 via-purple-50/35 to-white p-4 sm:p-5 space-y-3 flex flex-col justify-between border border-purple-200/80 rounded-lg shadow-xs">
          <div className="space-y-2.5 font-mono text-xs flex-1 flex flex-col justify-around">
            <div className="flex items-center justify-between pb-1 font-sans border-b border-purple-100/80">
              <span className="text-[11px] font-bold text-purple-950 uppercase tracking-wide">
                Net Worth Breakdown
              </span>
              <span className="font-mono text-xs font-bold text-purple-700/70">
                Allocation
              </span>
            </div>

            <div className="space-y-2 text-slate-700 flex-1 flex flex-col justify-around">
              {netWorthBreakdownItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span>{item.label}:</span>
                  <div className="flex items-center space-x-2 text-right">
                    <strong className="text-slate-900 font-bold">
                      {item.value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    </strong>
                    <span className="text-[11px] font-bold font-mono text-purple-900/60">
                      {item.sharePct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}

              <div 
                onClick={() => setActiveBreakdownMetric('valuation')}
                className="flex justify-between items-center pt-2 text-slate-900 font-bold border-t border-purple-100/80 cursor-pointer hover:bg-purple-50/50 px-1.5 py-1 -mx-1.5 transition-colors group rounded"
                title="Click to view full portfolio valuation breakdown"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Total:</span>
                  <span className="text-[10px] text-purple-600/70 group-hover:text-purple-900 font-normal font-mono flex items-center gap-0.5">
                    Breakdown <ExternalLink className="w-2.5 h-2.5 inline" />
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-purple-950 font-black text-sm">
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

        {/* RIGHT: OVERVIEW KPI CARDS IN A COMPACT 2-COLUMN GRID */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-2 content-between">
          
          {/* 1. Portfolio Valuation - Champagne / Amber Cream & White */}
          <div 
            onClick={() => setActiveBreakdownMetric('valuation')}
            className="bg-gradient-to-br from-amber-100/60 via-amber-50/30 to-white p-2.5 space-y-0.5 border border-amber-200/80 hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer group relative flex flex-col justify-between rounded-lg"
            title="Click to view asset-by-asset valuation breakdown"
          >
            <div className="flex items-center justify-between">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider font-mono truncate">
                Portfolio Valuation
              </div>
              <span className="text-[9px] text-slate-400 group-hover:text-amber-800 transition-colors font-mono flex items-center gap-0.5 shrink-0">
                Breakdown <ExternalLink className="w-2.5 h-2.5" />
              </span>
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-slate-900">
              {(liveTotalNetWorth > 0 ? liveTotalNetWorth : marketOverview.totalValuation).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono">
              <span className={`font-bold ${hourlyStats.netWorthCoins > 0 ? 'text-emerald-500' : hourlyStats.netWorthCoins < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                {hourlyStats.netWorthCoins >= 0 ? '+' : ''}{hourlyStats.netWorthCoins.toFixed(1)} ({hourlyStats.netWorthPct >= 0 ? '+' : ''}{hourlyStats.netWorthPct.toFixed(2)}%)
              </span>
              <span className="text-slate-400 font-sans">past 1h</span>
            </div>
          </div>

          {/* 2. Base Daily Revenue - Mint / Emerald Cream & White */}
          <div 
            onClick={() => setActiveBreakdownMetric('revenue')}
            className="bg-gradient-to-br from-emerald-100/60 via-emerald-50/30 to-white p-2.5 space-y-0.5 border border-emerald-200/80 hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer group relative flex flex-col justify-between rounded-lg"
            title="Click to view company-by-company revenue breakdown"
          >
            <div className="flex items-center justify-between">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider font-mono truncate">
                Base Daily Revenue
              </div>
              <span className="text-[9px] text-slate-400 group-hover:text-amber-800 transition-colors font-mono flex items-center gap-0.5 shrink-0">
                Breakdown <ExternalLink className="w-2.5 h-2.5" />
              </span>
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-emerald-500">
              +{marketOverview.totalBaseGrossRevenue.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              <span className="text-[10px] font-normal text-slate-400 ml-1">/day</span>
            </div>
            <div className="text-[10px] text-slate-500 font-sans flex items-center justify-between">
              <span>Gross output</span>
              <span className="text-slate-400 font-mono">Spot</span>
            </div>
          </div>

          {/* 3. Labor Cost / PP - Ice / Sky Blue Cream & White */}
          <div 
            onClick={() => setActiveBreakdownMetric('salaries')}
            className="bg-gradient-to-br from-sky-100/60 via-sky-50/30 to-white p-2.5 space-y-0.5 border border-sky-200/80 hover:border-sky-400 hover:shadow-xs transition-all cursor-pointer group relative flex flex-col justify-between rounded-lg"
            title="Click to view workforce payroll and average labor cost per PP"
          >
            <div className="flex items-center justify-between">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider font-mono truncate">
                Labor Cost / PP
              </div>
              <span className="text-[9px] text-slate-400 group-hover:text-amber-800 transition-colors font-mono flex items-center gap-0.5 shrink-0">
                Breakdown <ExternalLink className="w-2.5 h-2.5" />
              </span>
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-slate-900">
              {(marketOverview.totalCompanyProducedPp > 0 ? (marketOverview.totalBaseLaborExpense / marketOverview.totalCompanyProducedPp) : 0).toFixed(3)}
              <span className="text-[10px] font-normal text-slate-400 ml-1">BTC/PP</span>
            </div>
            <div className="text-[10px] text-slate-500 font-sans flex items-center justify-between">
              <span>Workforce rate</span>
              <span className="text-slate-400 font-mono">Avg</span>
            </div>
          </div>

          {/* 4. Base Salaries Paid - Peach / Rose Cream & White */}
          <div 
            onClick={() => setActiveBreakdownMetric('salaries')}
            className="bg-gradient-to-br from-rose-100/60 via-rose-50/30 to-white p-2.5 space-y-0.5 border border-rose-200/80 hover:border-rose-400 hover:shadow-xs transition-all cursor-pointer group relative flex flex-col justify-between rounded-lg"
            title="Click to view worker roster and payable salary breakdown"
          >
            <div className="flex items-center justify-between">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider font-mono truncate">
                Base Salaries Paid
              </div>
              <span className="text-[9px] text-slate-400 group-hover:text-amber-800 transition-colors font-mono flex items-center gap-0.5 shrink-0">
                Breakdown <ExternalLink className="w-2.5 h-2.5" />
              </span>
            </div>
            <div className={`text-base sm:text-lg font-black font-mono ${marketOverview.totalBaseLaborExpense > 0 ? 'text-red-500' : 'text-blue-500'}`}>
              {marketOverview.totalBaseLaborExpense > 0 ? '-' : ''}{marketOverview.totalBaseLaborExpense.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              <span className="text-[10px] font-normal text-slate-400 ml-1">/day</span>
            </div>
            <div className="text-[10px] text-slate-500 font-sans flex items-center justify-between">
              <span>Emps: -{marketOverview.totalWorkerWages.toFixed(1)}</span>
              <span className="text-slate-400 font-mono">Mgr: -{marketOverview.totalManagerCost.toFixed(1)}</span>
            </div>
          </div>

          {/* 5. Base Daily Profit - Teal / Jade Cream & White */}
          <div 
            onClick={() => setActiveBreakdownMetric('profit')}
            className="bg-gradient-to-br from-teal-100/60 via-emerald-50/30 to-white p-2.5 space-y-0.5 border border-teal-200/80 hover:border-teal-400 hover:shadow-xs transition-all cursor-pointer group relative flex flex-col justify-between rounded-lg"
            title="Click to view company-by-company profit statement"
          >
            <div className="flex items-center justify-between">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider font-mono truncate">
                Base Daily Profit
              </div>
              <span className="text-[9px] text-slate-400 group-hover:text-amber-800 transition-colors font-mono flex items-center gap-0.5 shrink-0">
                Breakdown <ExternalLink className="w-2.5 h-2.5" />
              </span>
            </div>
            <div className={`text-base sm:text-lg font-black font-mono ${marketOverview.baseDailyProfit > 0 ? 'text-emerald-500' : marketOverview.baseDailyProfit < 0 ? 'text-red-500' : 'text-blue-500'}`}>
              {marketOverview.baseDailyProfit >= 0 ? '+' : ''}{marketOverview.baseDailyProfit.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              <span className="text-[10px] font-normal text-slate-400 ml-1">/day</span>
            </div>
            <div className="text-[10px] text-slate-500 font-sans flex items-center justify-between">
              <span>Net profit</span>
              <span className={`font-mono font-bold ${marketOverview.baseNetMarginPct > 0 ? 'text-emerald-500' : marketOverview.baseNetMarginPct < 0 ? 'text-red-500' : 'text-blue-500'}`}>{marketOverview.baseNetMarginPct.toFixed(1)}% margin</span>
            </div>
          </div>

          {/* 6. Operating Facilities - Light Purple and White Cream */}
          <div 
            onClick={() => setActiveBreakdownMetric('valuation')}
            className="bg-gradient-to-br from-purple-100/70 via-purple-50/30 to-white p-2.5 space-y-0.5 border border-purple-200/80 hover:border-purple-400 hover:shadow-xs transition-all cursor-pointer group relative flex flex-col justify-between rounded-lg"
            title="Click to view all enterprise facilities"
          >
            <div className="flex items-center justify-between">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider font-mono truncate">
                Operating Facilities
              </div>
              <span className="text-[9px] text-slate-400 group-hover:text-amber-800 transition-colors font-mono flex items-center gap-0.5 shrink-0">
                Breakdown <ExternalLink className="w-2.5 h-2.5" />
              </span>
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-slate-900">
              {companies.length} <span className="text-[10px] font-normal text-slate-400">Facilities</span>
            </div>
            <div className="text-[10px] text-slate-500 font-sans flex items-center justify-between">
              <span>Enterprises</span>
              <span className="text-emerald-700 font-bold font-mono">100% active</span>
            </div>
          </div>

          {/* 7. Total Enterprise PP - Orange Cream and White */}
          <div 
            onClick={() => setActiveBreakdownMetric('pp')}
            className="bg-gradient-to-br from-orange-100/70 via-orange-50/30 to-white p-2.5 space-y-0.5 border border-orange-200/80 hover:border-orange-400 hover:shadow-xs transition-all cursor-pointer group relative flex flex-col justify-between rounded-lg"
            title="Click to view engine, worker, and self-work PP breakdown"
          >
            <div className="flex items-center justify-between">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider font-mono truncate">
                Total Enterprise PP
              </div>
              <span className="text-[9px] text-slate-400 group-hover:text-amber-800 transition-colors font-mono flex items-center gap-0.5 shrink-0">
                Breakdown <ExternalLink className="w-2.5 h-2.5" />
              </span>
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-slate-900 flex items-baseline">
              <span>{marketOverview.totalCompanyProducedPp.toFixed(1)}</span>
              <span className="text-[10px] font-normal text-slate-400 ml-1 mr-1.5">PP/d</span>
              <span className="px-1 py-0.2 text-[9px] font-mono font-bold bg-orange-100/90 text-orange-950 rounded">
                ~{Math.round(marketOverview.totalCompanyProducedPp / 1000)}k
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-sans truncate">
              <span>Workforce yield</span>
            </div>
          </div>

          {/* 8. Staff Deployment - Lavender / Violet Cream and White */}
          <div 
            onClick={() => setActiveBreakdownMetric('staff')}
            className="bg-gradient-to-br from-violet-100/70 via-violet-50/30 to-white p-2.5 space-y-0.5 border border-violet-200/80 hover:border-violet-400 hover:shadow-xs transition-all cursor-pointer group relative flex flex-col justify-between rounded-lg"
            title="Click to view staff deployment and management capacity"
          >
            <div className="flex items-center justify-between">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider font-mono truncate">
                Staff Deployment
              </div>
              <span className="text-[9px] text-slate-400 group-hover:text-amber-800 transition-colors font-mono flex items-center gap-0.5 shrink-0">
                Breakdown <ExternalLink className="w-2.5 h-2.5" />
              </span>
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-slate-900">
              {marketOverview.totalWorkers} <span className="text-[10px] font-normal text-slate-400">/ {maxHiringSlots}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-sans flex items-center justify-between">
              <span>+{marketOverview.totalManagers || 0} Mgr</span>
              <span className="text-emerald-700 font-bold font-mono">{Math.max(0, maxHiringSlots - marketOverview.totalWorkers)} open</span>
            </div>
          </div>

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
                <th className="py-3 px-3 text-right">Daily PP (24h)</th>
                <th className="py-3 px-3 text-right">Units Yield/Day</th>
                <th className="py-3 px-3 text-right">Revenue/Day (BTC)</th>
                <th className="py-3 px-3 text-right">Salaries Paid</th>
                <th className="py-3 px-3 text-right">Net Profit (BTC)</th>
                <th className="py-3 px-3 text-right">Margin</th>
                <th className="py-3 px-3 text-center min-w-[100px]">Storage</th>
                <th className="py-3 px-3 text-center min-w-[80px]">Staff</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400 font-sans">
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

                      {/* Daily PP (24h) */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap font-bold text-slate-900 font-mono">
                        {c.companyProducedDailyPp.toFixed(1)}
                      </td>

                      {/* Daily Output Yield */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap font-bold text-slate-800 font-mono">
                        {(c.baseUnits !== undefined ? c.baseUnits : (c.unitsPerDay || 0)).toFixed(1)}
                      </td>

                      {/* Daily Gross Revenue */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap font-bold text-emerald-600 font-mono">
                        +{(c.grossRevenue ?? 0).toFixed(2)}
                      </td>

                      {/* Base Salaries Paid Out */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap font-mono">
                        <span className={`font-bold ${(c.dailyLaborExpense || 0) > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                          {(c.dailyLaborExpense || 0) > 0 ? `-${c.dailyLaborExpense.toFixed(2)}` : '0.00'}
                        </span>
                      </td>

                      {/* Net Daily Profit */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap font-mono">
                        <span className={`font-bold ${baseIncome > 0 ? 'text-emerald-500' : baseIncome < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                          {baseIncome >= 0 ? '+' : ''}{baseIncome.toFixed(2)}
                        </span>
                      </td>

                      {/* Margin Column */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap font-mono">
                        <span className={`font-bold ${(c.baseNetMarginPct ?? 0) > 0 ? 'text-emerald-600' : (c.baseNetMarginPct ?? 0) < 0 ? 'text-red-500' : 'text-slate-500'}`}>
                          {typeof c.baseNetMarginPct === 'number' ? `${c.baseNetMarginPct.toFixed(1)}%` : '—'}
                        </span>
                      </td>

                      {/* Storage / Capacity Progress */}
                      <td className="py-3.5 px-3">
                        <div className="w-full max-w-[100px] mx-auto space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
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

                      {/* Staff (Workers + Managers with Icons) */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center gap-2.5 font-mono font-bold text-xs">
                          <span className="inline-flex items-center gap-1 text-slate-700" title={`${c.workers?.length || 0} Workers`}>
                            <Users className="w-3.5 h-3.5 text-slate-500" />
                            <span>{c.workers?.length || 0}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 text-slate-900" title={`${c.hasManager ? 1 : 0} Manager`}>
                            <User className="w-3.5 h-3.5 text-slate-900" />
                            <span>{c.hasManager ? 1 : 0}</span>
                          </span>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

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
