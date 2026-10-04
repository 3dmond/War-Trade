import React, { useState, useMemo, useEffect } from 'react';
import { 
  RotateCw, 
  ChevronRight, 
  Plus,
  CheckCircle2,
  Users
} from 'lucide-react';
import ItemIcon from './ItemIcon';
import { api } from '../services/wareraApi';

export default function StockExchangeListing({
  companies = [],
  user = null,
  dossier = null,
  portfolioStats = {},
  onSelectCompany,
  onRefreshLive,
  isRefreshingLive = false,
  managementLevel = 0,
  maxHiringSlots = 4
}) {
  const [sectorFilter, setSectorFilter] = useState('all'); // 'all' | 'raw' | 'processed'

  // Filter companies by sector only
  const filteredCompanies = useMemo(() => {
    let result = [...companies];
    if (sectorFilter === 'raw') {
      result = result.filter(c => c.recipe?.type === 'raw');
    } else if (sectorFilter === 'processed') {
      result = result.filter(c => c.recipe?.type === 'processed');
    }
    return result;
  }, [companies, sectorFilter]);

  // Aggregate Market Stats (Figures only, no symbols)
  const marketOverview = useMemo(() => {
    const totalValuation = companies.reduce((sum, c) => sum + (c.totalCalculatedWorth || 0), 0);
    const totalDailyProfit = companies.reduce((sum, c) => sum + (c.dailyNetProfit || 0), 0);
    const total24hGrowthCoins = companies.reduce((sum, c) => sum + (c.growth24hCoins || 0), 0);
    const baselineValuation = Math.max(1, totalValuation - total24hGrowthCoins);
    const total24hGrowthPct = (total24hGrowthCoins / baselineValuation) * 100;
    const totalDailyUnits = companies.reduce((sum, c) => sum + (c.unitsPerDay || 0), 0);
    const totalWorkers = companies.reduce((sum, c) => sum + (c.workers?.length || 0), 0);

    return {
      totalValuation,
      totalDailyProfit,
      total24hGrowthCoins,
      total24hGrowthPct,
      totalDailyUnits,
      totalWorkers
    };
  }, [companies]);

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

  // 1-Hour change metrics for Total Net Worth & Portfolio Valuation
  const hourlyValuationCoins = (marketOverview.total24hGrowthCoins || 0) / 24;
  const baselineTotalNetWorth = Math.max(1, liveTotalNetWorth - hourlyValuationCoins);
  const hourlyValuationPct = (hourlyValuationCoins / baselineTotalNetWorth) * 100;

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
        <div className="lg:col-span-5 bg-white p-5 space-y-4 flex flex-col justify-between">
          
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

          {/* Territory & Domicile Details (Clean, no emojis/icons) */}
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
            <div className="pt-2 flex justify-between items-baseline">
              <span className="text-slate-500 text-xs font-sans">Total Net Worth:</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl sm:text-2xl font-black font-mono text-slate-900">
                  {liveTotalNetWorth.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
                <span className={`text-xs font-bold font-mono ${hourlyValuationCoins > 0 ? 'text-emerald-700' : hourlyValuationCoins < 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                  {hourlyValuationCoins >= 0 ? '+' : ''}{hourlyValuationCoins.toFixed(1)} ({hourlyValuationPct >= 0 ? '+' : ''}{hourlyValuationPct.toFixed(2)}%)
                </span>
                <span className="text-[10px] text-slate-400 font-sans">past 1h</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: NET WORTH BREAKDOWN (ASSET ALLOCATION STRUCTURE) */}
        <div className="lg:col-span-7 bg-white p-5 space-y-4 flex flex-col justify-between">
          
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

              <div className="flex justify-between items-center pt-2 text-slate-900 font-bold">
                <span>Total:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-amber-800 font-black text-sm">
                    {liveTotalNetWorth.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </span>
                  <span className={`text-xs font-bold font-mono ${hourlyValuationCoins > 0 ? 'text-emerald-700' : hourlyValuationCoins < 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                    {hourlyValuationCoins >= 0 ? '+' : ''}{hourlyValuationCoins.toFixed(1)} ({hourlyValuationPct >= 0 ? '+' : ''}{hourlyValuationPct.toFixed(2)}%)
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans">past 1h</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 2. OVERVIEW VALUE BOXES (FIGURES ONLY, NO SYMBOLS/COINS) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Market Cap / Portfolio Valuation (Past 1h Gain/Loss) */}
        <div className="bg-white p-4 space-y-1">
          <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            Portfolio Valuation
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
            {marketOverview.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className={`font-bold ${hourlyValuationCoins >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {hourlyValuationCoins >= 0 ? '+' : ''}{hourlyValuationCoins.toFixed(1)} ({hourlyValuationPct >= 0 ? '+' : ''}{hourlyValuationPct.toFixed(2)}%)
            </span>
            <span className="text-[10px] text-slate-400 font-sans">past 1h</span>
          </div>
        </div>

        {/* Net Operating Cashflow */}
        <div className="bg-white p-4 space-y-1">
          <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            Net Cashflow
          </div>
          <div className={`text-xl sm:text-2xl font-black font-mono ${marketOverview.totalDailyProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {marketOverview.totalDailyProfit >= 0 ? '+' : ''}{marketOverview.totalDailyProfit.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            <span className="text-xs font-normal text-slate-400 ml-1">/day</span>
          </div>
          <span className="text-[11px] text-slate-500 font-sans block truncate">
            Net yield after labor & raw inputs
          </span>
        </div>

        {/* Total Daily Output */}
        <div className="bg-white p-4 space-y-1">
          <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            Daily Output
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
            {marketOverview.totalDailyUnits.toFixed(1)} <span className="text-xs font-normal text-slate-400">units/day</span>
          </div>
          <span className="text-[11px] text-slate-500 font-sans block truncate">
            Across {companies.length} active facilities
          </span>
        </div>

        {/* Workforce Engagement */}
        <div className="bg-white p-4 space-y-1">
          <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            Staff Deployment
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
            {marketOverview.totalWorkers} <span className="text-xs font-normal text-slate-400">/ {maxHiringSlots} slots</span>
          </div>
          <div className="text-[11px] text-slate-500 font-sans flex items-center gap-1">
            <span>Management Lv.{managementLevel}</span>
            <span>•</span>
            <span className="text-emerald-700 font-bold">{Math.max(0, maxHiringSlots - marketOverview.totalWorkers)} slots open</span>
          </div>
        </div>
      </div>

      {/* 2. CATEGORY FILTERS & ACTIONS (NO SEARCH, NO SORT, NO STAFFED FILTER) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3">
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
            Manufactured ({companies.filter(c => c.recipe?.type === 'processed').length})
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
            Raw Materials ({companies.filter(c => c.recipe?.type === 'raw').length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefreshLive}
            disabled={isRefreshingLive}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer disabled:opacity-50"
            title="Sync all facilities, storage, and prices live from WarEra"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshingLive ? 'animate-spin text-amber-500' : 'text-slate-600'}`} />
            <span>{isRefreshingLive ? 'Syncing...' : 'Sync Live'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" title="Real-time live updating active" />
          </button>
        </div>
      </div>

      {/* 3. STOCK EXCHANGE LISTING BOARD (DATA TABLE - FIGURES ONLY, NO GAINERS/LOSERS COLUMN) */}
      <div className="bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 uppercase font-mono font-bold tracking-wider text-[11px]">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3 min-w-[200px]">Asset / Listing</th>
                <th className="py-3 px-3">Sector</th>
                <th className="py-3 px-3 text-right">Market Spot</th>
                <th className="py-3 px-3 text-right">Daily Output</th>
                <th className="py-3 px-3 text-right">Daily Net Profit</th>
                <th className="py-3 px-3 text-right">Market Valuation</th>
                <th className="py-3 px-3 text-center min-w-[130px]">Warehouse / Storage</th>
                <th className="py-3 px-3 text-center">Staff</th>
                <th className="py-3 px-3 text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-sans">
                    No companies match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((c, idx) => {
                  const isPositiveProfit = (c.dailyNetProfit || 0) >= 0;

                  return (
                    <tr 
                      key={c.id || idx}
                      onClick={() => onSelectCompany(c.id)}
                      className="hover:bg-slate-50/90 transition cursor-pointer group"
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
                          c.recipe?.type === 'raw' 
                            ? 'bg-amber-100/70 text-amber-900' 
                            : 'bg-blue-100/70 text-blue-900'
                        }`}>
                          {c.recipe?.category || (c.recipe?.type === 'raw' ? 'Raw Materials' : 'Manufacturing')}
                        </span>
                      </td>

                      {/* Market Spot Price (Figures only) */}
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

                      {/* Daily Output */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <span className="font-bold text-slate-900">{c.unitsPerDay.toFixed(1)}</span>
                        <span className="text-[10px] text-slate-400 ml-1">units/day</span>
                      </td>

                      {/* Daily Net Profit (Figures only) */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className={`font-bold ${isPositiveProfit ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {isPositiveProfit ? '+' : ''}{c.dailyNetProfit.toFixed(2)}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {c.isRawProducer && c.unitsTransferredDaily > 0 
                            ? `${((c.unitsTransferredDaily / c.unitsPerDay) * 100).toFixed(0)}% internal` 
                            : (c.netMarginPct ? `${c.netMarginPct.toFixed(1)}% margin` : '—')}
                        </span>
                      </td>

                      {/* Market Valuation (Figures only) */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {c.totalCalculatedWorth ? c.totalCalculatedWorth.toFixed(1) : '—'}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-normal font-sans">
                          Lv.{c.engineLevel} Engine • Lv.{c.storageLevel} Silo
                        </span>
                      </td>

                      {/* Storage / Capacity Progress */}
                      <td className="py-3.5 px-3">
                        <div className="w-full max-w-[120px] mx-auto space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>{c.currentStoredPp.toFixed(0)} PP</span>
                            <span>{c.currentFillPct.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                c.currentFillPct >= 90 ? 'bg-rose-500' : c.currentFillPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, c.currentFillPct))}%` }}
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
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 group-hover:bg-blue-600 text-white font-bold text-xs transition cursor-pointer"
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

        {/* Table Footer Summary Bar (Figures only) */}
        <div className="bg-slate-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-slate-600">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">Showing {filteredCompanies.length} of {companies.length} listed enterprises</span>
            <span>•</span>
            <span className="text-slate-500">Click any row to open facility details</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>
              Hourly Growth: <strong className={hourlyValuationCoins >= 0 ? 'text-emerald-700 font-black' : 'text-rose-600 font-black'}>
                {hourlyValuationCoins >= 0 ? '+' : ''}{hourlyValuationCoins.toFixed(2)} ({hourlyValuationPct >= 0 ? '+' : ''}{hourlyValuationPct.toFixed(2)}%) past 1h
              </strong>
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
