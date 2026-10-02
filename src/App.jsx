import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import WarEraTerminal from './components/WarEraTerminal';
import ProfileSyncModal from './components/ProfileSyncModal';
import LandingPage from './components/LandingPage';
import { api, FALLBACK_PRICES } from './services/wareraApi';
import { RECIPES } from './data/gameData';

export default function App() {
  const [apiToken, setApiToken] = useState(() => api.getToken());
  const [prices, setPrices] = useState(() => {
    try {
      const saved = localStorage.getItem('warera_live_prices');
      if (saved) return JSON.parse(saved);
    } catch {}
    return FALLBACK_PRICES;
  });
  const [orderBook, setOrderBook] = useState({});
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  
  // Saved player dossier { user, companies, equipment, totalWorkers }
  const [dossier, setDossier] = useState(() => {
    try {
      const saved = localStorage.getItem('warera_dossier');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Compute live effective market spot prices directly from the real order book
  // (Mid-point of best bid and best ask represents actual current trading level in game)
  const effectivePrices = useMemo(() => {
    const map = { ...prices };
    if (orderBook && typeof orderBook === 'object') {
      Object.keys(orderBook).forEach(code => {
        const ob = orderBook[code];
        const buy = ob?.buyOrders?.[0]?.price;
        const sell = ob?.sellOrders?.[0]?.price;
        if (buy !== undefined && sell !== undefined) {
          map[code] = Number(((buy + sell) / 2).toFixed(4));
        } else if (buy !== undefined) {
          map[code] = buy;
        } else if (sell !== undefined) {
          map[code] = sell;
        }
      });
      if (map.coca) map.mysteriousPlant = map.coca;
      if (map.cocain) map.pill = map.cocain;
    }
    return map;
  }, [prices, orderBook]);

  // Refresh live spot prices and order book depth
  const refreshPrices = async () => {
    setIsRefreshingPrices(true);
    try {
      const itemCodes = RECIPES.map(r => r.id);
      const [pricesRes, orderBookRes] = await Promise.allSettled([
        api.getPrices(),
        api.getTopOrders(itemCodes)
      ]);

      if (pricesRes.status === 'fulfilled' && pricesRes.value && Object.keys(pricesRes.value).length > 0) {
        setPrices(pricesRes.value);
        setIsLiveConnected(true);
        try {
          localStorage.setItem('warera_live_prices', JSON.stringify(pricesRes.value));
        } catch {}
      }
      if (orderBookRes.status === 'fulfilled' && orderBookRes.value && Object.keys(orderBookRes.value).length > 0) {
        setOrderBook(orderBookRes.value);
      }
    } catch (err) {
      console.warn('Could not refresh market data:', err);
    } finally {
      setIsRefreshingPrices(false);
    }
  };

  useEffect(() => {
    refreshPrices();
    const interval = setInterval(refreshPrices, 15000); // 15-second responsive refresh for fast-moving market
    return () => clearInterval(interval);
  }, []);

  const handleUpdateToken = (newToken) => {
    api.setToken(newToken);
    setApiToken(newToken);
    refreshPrices();
  };

  const handleSyncUser = (newDossier) => {
    setDossier(newDossier);
    try {
      localStorage.setItem('warera_dossier', JSON.stringify(newDossier));
    } catch (e) {
      // Storage quota or error
    }
  };

  const handleDisconnect = () => {
    setDossier(null);
    try {
      localStorage.removeItem('warera_dossier');
    } catch (e) {}
  };

  const user = dossier?.user;

  // First page (Binance-inspired onboarding / profile link gate)
  if (!user) {
    return (
      <LandingPage
        prices={effectivePrices}
        orderBook={orderBook}
        onConnectUser={handleSyncUser}
      />
    );
  }

  return (
    <div className="h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900 overflow-hidden">
      
      {/* Header */}
      <Header
        userData={user}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onDisconnect={handleDisconnect}
      />

      {/* Main Full-Height Viewport */}
      <main className="flex-1 w-full overflow-hidden flex flex-col">
        <WarEraTerminal
          prices={effectivePrices}
          vwapPrices={prices}
          orderBook={orderBook}
          onRefreshPrices={refreshPrices}
          isRefreshing={isRefreshingPrices}
        />
      </main>

      {/* Profile Sync Modal */}
      <ProfileSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSyncUser={handleSyncUser}
        currentUserData={user}
      />

    </div>
  );
}
