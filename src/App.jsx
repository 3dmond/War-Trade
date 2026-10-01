import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import EcoEraTerminal from './components/EcoEraTerminal';
import CompanyPortfolio from './components/CompanyPortfolio';
import LaborScenarioLab from './components/LaborScenarioLab';
import ProfileSyncModal from './components/ProfileSyncModal';
import { api, FALLBACK_PRICES } from './services/wareraApi';

export default function App() {
  const [activeTab, setActiveTab] = useState('terminal');
  const [apiToken, setApiToken] = useState(() => api.getToken());
  const [prices, setPrices] = useState(FALLBACK_PRICES);
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [selectedLaborItem, setSelectedLaborItem] = useState('ammo');
  
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

  // Refresh live spot prices
  const refreshPrices = async () => {
    setIsRefreshingPrices(true);
    try {
      const newPrices = await api.getPrices();
      if (newPrices && Object.keys(newPrices).length > 0) {
        setPrices(newPrices);
        setIsLiveConnected(true);
      }
    } catch (err) {
      console.warn('Could not refresh prices:', err);
    } finally {
      setIsRefreshingPrices(false);
    }
  };

  useEffect(() => {
    refreshPrices();
    const interval = setInterval(refreshPrices, 60000); // 1-minute auto refresh for spot prices
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

  const handleSelectCompanyForLabor = (itemCode) => {
    setSelectedLaborItem(itemCode);
    setActiveTab('labor');
  };

  const user = dossier?.user;

  return (
    <div className="h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900 overflow-hidden">
      
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        apiToken={apiToken}
        onUpdateToken={handleUpdateToken}
        userData={user}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        isLiveConnected={isLiveConnected}
      />

      {/* Main Full-Height Viewport */}
      <main className="flex-1 w-full max-w-[1880px] mx-auto px-2 sm:px-4 py-2 overflow-hidden flex flex-col">
        {activeTab === 'terminal' && (
          <EcoEraTerminal
            prices={prices}
            onRefreshPrices={refreshPrices}
            isRefreshing={isRefreshingPrices}
          />
        )}

        {activeTab === 'portfolio' && (
          <div className="flex-1 overflow-y-auto max-w-7xl mx-auto w-full py-4">
            <CompanyPortfolio
              dossier={dossier}
              prices={prices}
              onOpenSyncModal={() => setIsSyncModalOpen(true)}
              onSelectCompanyForLabor={handleSelectCompanyForLabor}
            />
          </div>
        )}

        {activeTab === 'labor' && (
          <div className="flex-1 overflow-y-auto max-w-7xl mx-auto w-full py-4">
            <LaborScenarioLab
              prices={prices}
              initialItemCode={selectedLaborItem}
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
