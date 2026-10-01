import React, { useState } from 'react';
import { Key, User, RefreshCw, BarChart2, Briefcase, Users } from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  apiToken, 
  onUpdateToken, 
  userData, 
  onOpenSyncModal,
  isLiveConnected 
}) {
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenDraft, setTokenDraft] = useState(apiToken);

  const handleSaveToken = () => {
    if (tokenDraft.trim()) {
      onUpdateToken(tokenDraft.trim());
      setShowTokenInput(false);
    }
  };

  const navItems = [
    { id: 'terminal', label: 'Terminal', icon: BarChart2 },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
    { id: 'labor', label: 'Labor & Scenarios', icon: Users },
  ];

  return (
    <header className="bg-white sticky top-0 z-40 shadow-xs border-b border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Navigation */}
          <div className="flex items-center space-x-8">
            <button 
              onClick={() => setActiveTab('terminal')}
              className="flex items-center space-x-2.5 text-left focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white shadow-xs">
                <span className="font-mono font-bold text-sm">W</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-bold tracking-tight text-slate-900 text-base font-sans">
                  WARERA
                </span>
                <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  MARKET
                </span>
              </div>
            </button>

            {/* Seamless Light Navigation tabs */}
            <nav className="hidden sm:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Status & Profile Controls */}
          <div className="flex items-center space-x-3">
            {/* Live Feed Pill */}
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-mono">
              <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-subtle'}`}></span>
              <span className="text-slate-600 hidden sm:inline font-medium">
                {isLiveConnected ? 'FEED LIVE' : 'CONNECTING'}
              </span>
            </div>

            {/* Token Button */}
            <button
              onClick={() => setShowTokenInput(!showTokenInput)}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
              title="API Key Configuration"
            >
              <Key className="w-3.5 h-3.5" />
            </button>

            {/* User Profile Sync Button */}
            {userData?.username ? (
              <button
                onClick={onOpenSyncModal}
                className="flex items-center space-x-2 px-3 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition font-mono font-medium"
              >
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                  {userData.username.charAt(0).toUpperCase()}
                </div>
                <span>@{userData.username}</span>
                <span className="text-slate-500 text-[10px]">Lv.{userData.leveling?.level || 1}</span>
              </button>
            ) : (
              <button
                onClick={onOpenSyncModal}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition font-medium shadow-xs"
              >
                <User className="w-3.5 h-3.5" />
                <span>Link Account</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex sm:hidden space-x-1 pb-2 pt-1 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 py-1.5 text-center text-xs font-medium rounded-lg transition flex items-center justify-center gap-1.5 ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Token Drawer (Light Theme) */}
        {showTokenInput && (
          <div className="py-3 px-4 mb-2 bg-slate-100 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center space-x-2 text-slate-800 w-full sm:w-auto">
              <Key className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-medium">WarEra Token:</span>
              <input
                type="text"
                value={tokenDraft}
                onChange={(e) => setTokenDraft(e.target.value)}
                placeholder="wae_..."
                className="bg-white border border-slate-300 rounded-md px-2.5 py-1 text-slate-900 w-full sm:w-80 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-xs"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleSaveToken}
                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md text-xs transition"
              >
                Save
              </button>
              <button
                onClick={() => setShowTokenInput(false)}
                className="px-3 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded-md text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </header>
  );
}
