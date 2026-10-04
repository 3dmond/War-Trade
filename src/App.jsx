import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import WarEraTerminal from './components/WarEraTerminal';
import CompanyPortfolio from './components/CompanyPortfolio';
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

  const [activeTab, setActiveTab] = useState('portfolio'); // 'portfolio' | 'terminal'
  const [terminalItemCode, setTerminalItemCode] = useState('ammo');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  const handleNavigateToTerminal = (itemCode) => {
    if (itemCode) {
      setTerminalItemCode(itemCode);
    }
    setActiveTab('terminal');
  };

  // Compute live effective market spot prices directly from the real order book
  // (Mid-point of best bid and best ask represents actual current trading level in game)
  const effectivePrices = useMemo(() => {
    const map = { ...prices };
    if (orderBook && typeof orderBook === 'object') {
      Object.keys(orderBook).forEach(code => {
        const ob = orderBook[code];
        const buy = ob?.buyOrders?.[0]?.price;
        const sell = ob?.sellOrders?.[0]?.price;
        if (typeof buy === 'number' && typeof sell === 'number') {
          map[code] = (buy + sell) / 2;
        } else if (typeof buy === 'number') {
          map[code] = buy;
        } else if (typeof sell === 'number') {
          map[code] = sell;
        }
      });
      if (map.coca !== undefined) map.mysteriousPlant = map.coca;
      if (map.cocain !== undefined) map.pill = map.cocain;
      if (map.pill !== undefined) map.cocain = map.pill;
      if (map.mysteriousPlant !== undefined) map.coca = map.mysteriousPlant;
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
    const interval = setInterval(refreshPrices, 10000); // 10-second responsive refresh for fast-moving market
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

  // Continuous background polling of user dossier (companies, live in-storage accumulation, real workers)
  useEffect(() => {
    if (!dossier?.user?._id) return;

    let isCancelled = false;
    const refreshDossier = async () => {
      try {
        const freshDossier = await api.resolveUserFull(dossier.user._id);
        if (!isCancelled && freshDossier?.user) {
          setDossier(freshDossier);
          try {
            localStorage.setItem('warera_dossier', JSON.stringify(freshDossier));
          } catch {}
        }
      } catch (err) {
        console.warn('Background dossier refresh:', err.message);
      }
    };

    // Run immediately, then poll every 20 seconds
    refreshDossier();
    const interval = setInterval(refreshDossier, 20000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [dossier?.user?._id]);

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
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Full-Height Viewport */}
      <main className="flex-1 w-full overflow-hidden flex flex-col">
        {activeTab === 'terminal' && (
          <WarEraTerminal
            prices={effectivePrices}
            vwapPrices={prices}
            orderBook={orderBook}
            onRefreshPrices={refreshPrices}
            isRefreshing={isRefreshingPrices}
            initialItemCode={terminalItemCode}
          />
        )}

        {activeTab === 'portfolio' && (
          <div className="flex-1 w-full overflow-y-auto flex flex-col">
            <CompanyPortfolio
              dossier={dossier}
              prices={effectivePrices}
              onOpenSyncModal={() => setIsSyncModalOpen(true)}
              onRefreshPrices={refreshPrices}
              onUpdateDossier={handleSyncUser}
              onNavigateToTerminal={handleNavigateToTerminal}
            />
          </div>
        )}
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
