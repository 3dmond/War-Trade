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
  ExternalLink
} from 'lucide-react';
import ItemIcon from './ItemIcon';
import MetricBreakdownModal from './MetricBreakdownModal';
import { api } from '../services/wareraApi';

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

  // Live Empire Net Worth & Breakdown (matches authoritative in-game wealth stats and live updates with yield/prices)
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
                <span className={`text-xs font-bold font-mono ${hourlyStats.netWorthCoins > 0 ? 'text-emerald-700' : hourlyStats.netWorthCoins < 0 ? 'text-rose-700' : 'text-slate-400'}`}>
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
                  <span className={`text-xs font-bold font-mono ${hourlyStats.netWorthCoins > 0 ? 'text-emerald-700' : hourlyStats.netWorthCoins < 0 ? 'text-rose-700' : 'text-slate-400'}`}>
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
            <span className={`font-bold ${hourlyStats.netWorthCoins >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
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
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
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
          <div className={`text-xl sm:text-2xl font-black font-mono ${marketOverview.totalBaseRawExpense > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
            {marketOverview.totalBaseRawExpense > 0 
              ? `-${marketOverview.totalBaseRawExpense.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}` 
              : '0.0'}
            <span className="text-xs font-normal text-slate-400 ml-1">/day</span>
          </div>
          <div className="text-[11px] text-slate-500 font-sans flex items-center justify-between">
            <span>Factory input costs</span>
            <span className={`text-[10px] font-mono ${marketOverview.hasBothRawAndFinished ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
              {marketOverview.hasBothRawAndFinished ? 'Insourced (0 C)' : 'Spot purchases'}
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
          <div className={`text-xl sm:text-2xl font-black font-mono ${marketOverview.totalBaseLaborExpense > 0 ? 'text-amber-800' : 'text-slate-900'}`}>
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
          <div className={`text-xl sm:text-2xl font-black font-mono ${marketOverview.baseDailyProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {marketOverview.baseDailyProfit >= 0 ? '+' : ''}{marketOverview.baseDailyProfit.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            <span className="text-xs font-normal text-slate-400 ml-1">/day</span>
          </div>
          <div className="text-[11px] text-slate-500 font-sans flex items-center justify-between">
            <span>Net profit after costs</span>
            <span className="text-emerald-700 font-mono text-[10px] font-bold">{marketOverview.baseNetMarginPct.toFixed(1)}% margin</span>
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

      {/* 3. GENERAL PORTFOLIO OWNER LABOR CAPACITY (STRICTLY OUTSIDE COMPANY PROFILES) */}
      <div className="bg-white p-5 space-y-3.5 border border-slate-200/80 shadow-xs">
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
                          <div className={`text-[10px] font-bold ${c.priceChange24h.changePct >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
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
                        <div className="font-bold text-slate-900">
                          +{(c.grossRevenue ?? (c.baseUnits * (c.spotPrice || 0))).toFixed(2)}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          Coins/day
                        </span>
                      </td>

                      {/* Raw Material Costs */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className={`font-bold ${(c.dailyRawExpenseTotal || 0) > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {(c.dailyRawExpenseTotal || 0) > 0 ? `-${c.dailyRawExpenseTotal.toFixed(2)}` : '0.00'}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {c.isRaw ? 'Extraction' : 'Market Spot'}
                        </span>
                      </td>

                      {/* Base Salaries Paid Out */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className={`font-bold ${(c.dailyLaborExpense || 0) > 0 ? 'text-amber-800' : 'text-slate-400'}`}>
                          {(c.dailyLaborExpense || 0) > 0 ? `-${c.dailyLaborExpense.toFixed(2)}` : '0.00'}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {c.workers?.length ? `${c.workers.length} hired` : '0 hired'}
                        </span>
                      </td>

                      {/* Base Daily Profit (Standard) */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className={`font-bold ${isPositiveBase ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {isPositiveBase ? '+' : ''}{baseIncome.toFixed(2)}
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
                          Coins / Base PP
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
              Revenue: <strong className="text-slate-900 font-bold">+{marketOverview.totalBaseGrossRevenue.toFixed(2)}</strong>
            </span>
            <span>•</span>
            <span>
              Raw Costs: <strong className="text-rose-600 font-bold">-{marketOverview.totalBaseRawExpense.toFixed(2)}</strong>
            </span>
            <span>•</span>
            <span>
              Salaries: <strong className="text-amber-800 font-bold">-{marketOverview.totalBaseLaborExpense.toFixed(2)}</strong>
            </span>
            <span>•</span>
            <span>
              Net Profit: <strong className={marketOverview.baseDailyProfit >= 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>{marketOverview.baseDailyProfit >= 0 ? '+' : ''}{marketOverview.baseDailyProfit.toFixed(2)}</strong>
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
