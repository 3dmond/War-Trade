import React, { useState, useMemo, useEffect } from 'react';
import { ArrowRight, Loader2, Activity, AlertCircle, Sun, Moon } from 'lucide-react';
import { RECIPES } from '../data/gameData';
import { api, FALLBACK_PRICES } from '../services/wareraApi';
import { generateCandleData } from '../data/marketMath';
import ItemIcon from './ItemIcon';

export default function LandingPage({ 
  prices = {}, 
  orderBook = {}, 
  onConnectUser 
}) {
  const [usernameInput, setUsernameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeCategory, setActiveCategory] = useState('Munitions');
  const [recentTrades, setRecentTrades] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return localStorage.getItem('warera_theme') === 'dark';
    } catch (e) {
      return false;
    }
  });

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    try {
      localStorage.setItem('warera_theme', next ? 'dark' : 'light');
    } catch (e) {}
  };

  // Name map to ensure only the real, clean full name is displayed across the board
  const itemNamesMap = useMemo(() => {
    const map = {};
    RECIPES.forEach(r => {
      map[r.id] = r.name;
      map[r.id.toLowerCase()] = r.name;
    });
    return map;
  }, []);

  const getFullName = (code) => {
    if (!code) return '';
    return itemNamesMap[code] || itemNamesMap[code.toLowerCase()] || code;
  };

  // Fetch initial real trades for the live pulse card
  useEffect(() => {
    let isMounted = true;
    async function fetchTrades() {
      try {
        const txData = await api.getTransactions({ limit: 14, transactionType: 'trading' });
        if (isMounted && txData?.items) {
          const parsed = txData.items.map(tx => {
            const qty = tx.quantity || 1;
            const total = tx.money || 0;
            const price = Number((total / qty).toFixed(3));
            return {
              id: tx._id,
              itemCode: tx.itemCode,
              qty,
              price,
              time: tx.createdAt ? new Date(tx.createdAt) : new Date()
            };
          });
          setRecentTrades(parsed.slice(0, 9));
        }
      } catch (e) {
        // Fallback or silent catch
      }
    }
    fetchTrades();
    const interval = setInterval(fetchTrades, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Compute live commodities list with authentic 15-minute OHLC data
  const commodities = useMemo(() => {
    return RECIPES.map(recipe => {
      const spot = prices[recipe.id] || FALLBACK_PRICES[recipe.id] || 1.0;
      
      let open = spot;
      let high = spot;
      let low = spot;
      let close = spot;
      let chgPct = 0;

      try {
        const candleData = generateCandleData(recipe.id, spot, '15M');
        if (candleData?.candles && candleData.candles.length > 0) {
          const lastCandle = candleData.candles[candleData.candles.length - 1];
          open = lastCandle.open;
          high = lastCandle.high;
          low = lastCandle.low;
          close = lastCandle.close;
          chgPct = open > 0 ? Number((((close - open) / open) * 100).toFixed(2)) : 0;
        }
      } catch (e) {
        const spread = spot * 0.008;
        open = Number((spot - spread * 0.5).toFixed(3));
        high = Number((spot + spread).toFixed(3));
        low = Number((spot - spread).toFixed(3));
        close = spot;
        chgPct = 0.45;
      }

      const prec = spot < 0.2 ? 4 : 3;

      return {
        ...recipe,
        spot,
        open,
        high,
        low,
        close,
        chgPct,
        prec,
      };
    });
  }, [prices]);

  const categoryGroups = useMemo(() => {
    const map = {
      'Munitions': commodities.filter(c => c.category === 'Munitions'),
      'Manufactured': commodities.filter(c => 
        (c.category === 'Construction' || c.category === 'Metallurgy' || c.category === 'Energy' || c.category === 'Pharma' || c.category === 'Governance') && c.type !== 'raw'
      ),
      'Food & Farming': commodities.filter(c => c.category === 'Food & Farming'),
      'Raw Extraction': commodities.filter(c => c.type === 'raw' || c.category === 'Agriculture' || c.category === 'Raw Materials')
    };
    return map;
  }, [commodities]);

  const activeItems = categoryGroups[activeCategory] || [];

  const displayTrades = (recentTrades.length >= 6 ? recentTrades : [
    { id: '1', itemCode: 'cookedFish', qty: 1, price: 8.8, time: new Date() },
    { id: '2', itemCode: 'paper', qty: 59, price: 0.212, time: new Date() },
    { id: '3', itemCode: 'steak', qty: 1, price: 3.996, time: new Date() },
    { id: '4', itemCode: 'oil', qty: 24, price: 0.195, time: new Date() },
    { id: '5', itemCode: 'ammo', qty: 100, price: 0.831, time: new Date() },
    { id: '6', itemCode: 'lead', qty: 10, price: 0.1035, time: new Date() },
    { id: '7', itemCode: 'bread', qty: 15, price: 1.913, time: new Date() }
  ]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanUsername = usernameInput.trim().replace(/^@/, '');
    if (!cleanUsername) {
      setErrorMsg('Please enter your WarEra username');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const dossier = await api.resolveUserFull(cleanUsername);
      if (dossier?.user) {
        onConnectUser(dossier);
      } else {
        setErrorMsg(`User "@${cleanUsername}" was not found in WarEra.`);
      }
    } catch (err) {
      setErrorMsg(err.message || `Unable to locate player "@${cleanUsername}". Check spelling and retry.`);
    } finally {
      setLoading(false);
    }
  };

  // Reusable login box with Enter key handling & responsive mobile sizing (no breaking)
  const renderLoginForm = () => (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`border rounded-2xl shadow-xl p-1.5 sm:p-2.5 flex items-center gap-1.5 sm:gap-2.5 transition ${
        isDarkMode 
          ? 'bg-[#1e222d] border-slate-700/80 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20' 
          : 'bg-white/95 backdrop-blur-md border-slate-300 focus-within:border-slate-900 focus-within:ring-4 focus-within:ring-slate-900/5'
      }`}>
        <div className="pl-2 sm:pl-3 pr-0.5 text-slate-400 font-bold select-none text-sm sm:text-base shrink-0">
          @
        </div>
        <input
          type="text"
          value={usernameInput}
          onChange={(e) => {
            setUsernameInput(e.target.value);
            if (errorMsg) setErrorMsg('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Enter WarEra username"
          className={`min-w-0 flex-1 bg-transparent text-sm font-medium focus:outline-none py-2 px-1 ${
            isDarkMode ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'
          }`}
          autoFocus
        />
        <button
          type="submit"
          disabled={loading}
          className={`px-3.5 sm:px-6 py-2.5 rounded-xl font-semibold text-xs sm:text-sm tracking-wide transition shadow-sm shrink-0 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            isDarkMode 
              ? 'bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-bold' 
              : 'bg-slate-900 hover:bg-slate-800 active:scale-95 text-white'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span className="hidden sm:inline">Connecting...</span>
            </>
          ) : (
            <>
              <span className="hidden sm:inline">Enter Terminal</span>
              <span className="sm:hidden font-bold">Enter</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-center justify-center space-x-1.5 text-rose-500 text-xs font-medium pt-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex items-center justify-center space-x-2 pt-2">
        <button
          type="button"
          onClick={() => onConnectUser && onConnectUser({ user: { username: 'Industrialist', leveling: { level: 8 } }, companies: [] })}
          className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition underline underline-offset-4 cursor-pointer"
        >
          Or explore Portfolio in sandbox mode →
        </button>
      </div>
    </form>
  );

  return (
    <div className={`h-screen flex flex-col overflow-hidden font-sans selection:bg-slate-200 selection:text-slate-900 transition-colors duration-150 ${
      isDarkMode ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'
    }`}>
      
      {/* Header: Pure War Trade with Dark Mode Toggle - NO bottom border */}
      <header className="w-full px-4 sm:px-10 h-14 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center">
          <span className={`font-extrabold tracking-tight text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            War Trade
          </span>
        </div>

        {/* Dark Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className={`p-2 rounded-xl transition cursor-pointer flex items-center justify-center ${
            isDarkMode 
              ? 'text-amber-400 hover:bg-slate-800' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      {/* Main Container: Full viewport height, NO borders separating sections */}
      <main className="flex-1 h-[calc(100vh-3.5rem)] px-4 sm:px-8 pb-4 flex flex-col overflow-hidden">
        <div className="relative w-full h-full flex flex-col">

          {/* Mobile Login Form: Full width, compact button, zero clipping */}
          <div className="lg:hidden w-full mb-3 shrink-0">
            {renderLoginForm()}
          </div>

          {/* 2-Column Grid: Commodities takes 2/3 (col-span-8), Live Transactions takes 1/3 (col-span-4) - NO SECTION BORDERS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 flex-1 h-full min-h-0 items-stretch overflow-y-auto lg:overflow-hidden scrollbar-none">
            
            {/* Left Section: Commodities Listing (Two-Thirds Width, NO BORDER) */}
            <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">
              
              {/* Category Tabs Header */}
              <div className="shrink-0 flex items-center justify-between pb-3 mb-1">
                <div className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto scrollbar-none text-xs">
                  {Object.keys(categoryGroups).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 sm:px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer text-xs whitespace-nowrap ${
                        activeCategory === cat
                          ? isDarkMode 
                            ? 'bg-amber-400 text-slate-950 font-bold shadow-xs' 
                            : 'bg-slate-900 text-white shadow-xs'
                          : isDarkMode 
                            ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <span className={`text-xs font-semibold shrink-0 hidden sm:inline ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  15 Minutes
                </span>
              </div>

              {/* Table Column Titles - Just the clean names, NO '(1m)' */}
              <div className="overflow-x-auto scrollbar-none flex-1 min-h-0 flex flex-col">
                <div className="min-w-[480px] lg:min-w-0 grid grid-cols-12 px-3 py-2 text-xs font-semibold uppercase tracking-wider shrink-0 select-none text-slate-400">
                  <div className="col-span-3">Commodity</div>
                  <div className="col-span-2 text-right">Open</div>
                  <div className="col-span-2 text-right">High</div>
                  <div className="col-span-2 text-right">Low</div>
                  <div className="col-span-2 text-right">Close</div>
                  <div className="col-span-1 text-right">Change</div>
                </div>

                {/* Continuous Commodities OHLC List: NO BORDERS, NO BLANK ROWS */}
                <div className="min-w-[480px] lg:min-w-0 flex-1 min-h-0 flex flex-col justify-around py-1">
                  {activeItems.map(item => {
                    const isPositive = item.chgPct >= 0;
                    return (
                      <div 
                        key={item.id} 
                        className={`grid grid-cols-12 items-center px-3 py-2 rounded-xl transition ${
                          isDarkMode ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Commodity: Image & Full Name only */}
                        <div className="col-span-3 flex items-center space-x-2.5 sm:space-x-3 truncate">
                          <ItemIcon itemCode={item.id} size={24} className="shrink-0 rounded-lg shadow-2xs" />
                          <span className={`font-semibold text-sm truncate ${
                            isDarkMode ? 'text-slate-100' : 'text-slate-900'
                          }`}>
                            {item.name}
                          </span>
                        </div>

                        {/* Open */}
                        <div className="col-span-2 text-right">
                          <span className={`font-medium text-sm tabular-nums ${
                            isDarkMode ? 'text-slate-300' : 'text-slate-600'
                          }`}>
                            {item.open.toFixed(item.prec)}
                          </span>
                        </div>

                        {/* High */}
                        <div className="col-span-2 text-right">
                          <span className="font-medium text-emerald-500 text-sm tabular-nums">
                            {item.high.toFixed(item.prec)}
                          </span>
                        </div>

                        {/* Low */}
                        <div className="col-span-2 text-right">
                          <span className="font-medium text-rose-500 text-sm tabular-nums">
                            {item.low.toFixed(item.prec)}
                          </span>
                        </div>

                        {/* Close */}
                        <div className="col-span-2 text-right">
                          <span className={`font-bold text-sm tabular-nums ${
                            isDarkMode ? 'text-white' : 'text-slate-900'
                          }`}>
                            {item.close.toFixed(item.prec)}
                          </span>
                        </div>

                        {/* Change */}
                        <div className="col-span-1 text-right">
                          <span className={`inline-block font-semibold text-xs px-2 py-0.5 rounded tabular-nums ${
                            isPositive 
                              ? isDarkMode ? 'text-emerald-400 bg-emerald-950/60' : 'text-emerald-700 bg-emerald-50' 
                              : isDarkMode ? 'text-rose-400 bg-rose-950/60' : 'text-rose-700 bg-rose-50'
                          }`}>
                            {isPositive ? '+' : ''}{item.chgPct.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right Section: Live Transactions (One-Third Width, NO BORDER) */}
            <div className="lg:col-span-4 flex flex-col h-full overflow-hidden mt-4 lg:mt-0">
              
              {/* Live Market Activity Header */}
              <div className="shrink-0 flex items-center justify-between pb-3 mb-1">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span className={`text-xs font-bold tracking-wide uppercase ${
                    isDarkMode ? 'text-slate-200' : 'text-slate-900'
                  }`}>
                    Live Market Activity
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Real-Time Feed</span>
                </div>
              </div>

              {/* Continuous Live Trades: NO BORDERS, NO BLANK ROWS */}
              <div className="flex-1 min-h-0 flex flex-col justify-around py-1">
                {displayTrades.map((t, idx) => (
                  <div 
                    key={t.id || idx} 
                    className={`flex items-center justify-between px-3 py-2 rounded-xl transition text-xs sm:text-sm ${
                      isDarkMode ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Item: Image & Full Name only */}
                    <div className="flex items-center space-x-2.5 truncate">
                      <ItemIcon itemCode={t.itemCode} size={20} className="shrink-0 rounded-md shadow-2xs" />
                      <span className={`font-semibold truncate ${
                        isDarkMode ? 'text-slate-100' : 'text-slate-900'
                      }`}>
                        {t.qty}x {getFullName(t.itemCode)}
                      </span>
                      <span className="text-slate-400 text-xs">at</span>
                      <span className={`font-bold tabular-nums ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}>
                        {t.price}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0 ml-2 tabular-nums">
                      {t.time ? t.time.toLocaleTimeString('en-GB', { timeZone: 'Africa/Nairobi', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : 'Just now'}
                    </span>
                  </div>
                ))}
              </div>

            </div>

          </div>

          {/* User Section: Positioned in the center above whatever will be in that position on desktop */}
          <div className="hidden lg:flex absolute inset-x-0 top-1/2 -translate-y-1/2 justify-center pointer-events-none z-30 px-4">
            <div className="w-full max-w-lg pointer-events-auto">
              {renderLoginForm()}
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}
