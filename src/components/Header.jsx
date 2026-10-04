import React from 'react';
import { User, LogOut } from 'lucide-react';

export default function Header({ 
  userData, 
  onOpenSyncModal,
  onDisconnect,
  activeTab = 'portfolio',
  setActiveTab
}) {
  return (
    <header className="bg-white sticky top-0 z-40 shadow-xs w-full">
      <div className="w-full px-3 sm:px-5">
        <div className="flex items-center justify-between h-14">
          
          {/* Logo & Navigation Tabs */}
          <div className="flex items-center space-x-6 select-none">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-tight text-slate-900 text-lg font-sans">
                War Trade
              </span>
            </div>

            {/* Navigation Tabs */}
            {setActiveTab && (
              <nav className="flex items-center space-x-1 bg-slate-100/80 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('terminal')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'terminal'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>Market Terminal</span>
                </button>
                <button
                  onClick={() => setActiveTab('portfolio')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'portfolio'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>Portfolio</span>
                </button>
              </nav>
            )}
          </div>

          {/* Right Status & Profile Controls */}
          <div className="flex items-center space-x-2">
            {/* User Profile Sync Button (Linked by username) */}
            {userData?.username ? (
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={onOpenSyncModal}
                  className="flex items-center space-x-2 px-3 py-1.5 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition font-mono font-medium"
                  title="Profile details & stats"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                    {userData.username.charAt(0).toUpperCase()}
                  </div>
                  <span>@{userData.username}</span>
                  <span className="text-slate-500 text-[10px]">Lv.{userData.leveling?.level || 1}</span>
                </button>
                {onDisconnect && (
                  <button
                    onClick={onDisconnect}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Switch account / disconnect"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenSyncModal}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition font-medium shadow-xs"
              >
                <User className="w-3.5 h-3.5" />
                <span>Link Account</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
