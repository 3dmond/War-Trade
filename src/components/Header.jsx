import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Menu, X, LineChart, Briefcase, ChevronRight, ShieldCheck } from 'lucide-react';

export default function Header({ 
  userData, 
  onOpenSyncModal,
  onDisconnect,
  activeTab = 'portfolio',
  setActiveTab
}) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
  const navRef = useRef(null);
  const profileRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setIsMobileNavOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsMobileProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white sticky top-0 z-40 shadow-xs w-full border-b border-slate-200/70">
      <div className="w-full px-3 sm:px-5">
        <div className="flex items-center justify-between h-14 relative">
          
          {/* ======================================================== */}
          {/* MOBILE VIEW (< md) CONTROLS                              */}
          {/* ======================================================== */}
          
          {/* FAR LEFT: Mobile Hamburger Menu Button */}
          <div className="flex md:hidden items-center" ref={navRef}>
            <button
              onClick={() => {
                setIsMobileNavOpen(!isMobileNavOpen);
                setIsMobileProfileOpen(false);
              }}
              className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition active:scale-95"
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileNavOpen}
            >
              {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Mobile Nav Dropdown Drawer */}
            {isMobileNavOpen && (
              <div className="absolute top-14 left-2 w-64 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="text-[10px] font-bold font-mono text-slate-400 uppercase px-3 py-1.5 tracking-wider">
                  Navigation
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      if (setActiveTab) setActiveTab('portfolio');
                      setIsMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      activeTab === 'portfolio'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Briefcase className="w-4 h-4" />
                      <span>Company Portfolio</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                  </button>

                  <button
                    onClick={() => {
                      if (setActiveTab) setActiveTab('terminal');
                      setIsMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      activeTab === 'terminal'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <LineChart className="w-4 h-4" />
                      <span>Market Terminal</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* MOBILE CENTER: War Trade Title */}
          <div className="flex md:hidden absolute left-1/2 -translate-x-1/2 items-center pointer-events-none select-none">
            <span className="font-black tracking-tight text-slate-900 text-base font-sans">
              War Trade
            </span>
          </div>

          {/* FAR RIGHT: Mobile Profile Icon Menu Button */}
          <div className="flex md:hidden items-center" ref={profileRef}>
            <button
              onClick={() => {
                setIsMobileProfileOpen(!isMobileProfileOpen);
                setIsMobileNavOpen(false);
              }}
              className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition active:scale-95 relative"
              aria-label="User profile menu"
              aria-expanded={isMobileProfileOpen}
            >
              {userData?.username ? (
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center text-xs font-black shadow-xs ring-2 ring-white">
                  {userData.username.charAt(0).toUpperCase()}
                </div>
              ) : (
                <User className="w-5 h-5 text-slate-700" />
              )}
            </button>

            {/* Mobile Profile Dropdown Menu */}
            {isMobileProfileOpen && (
              <div className="absolute top-14 right-2 w-72 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {userData?.username ? (
                  <div className="space-y-3">
                    {/* User Identity Header */}
                    <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center text-sm font-black shadow-xs">
                        {userData.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-black text-slate-900 text-sm truncate font-sans">
                          @{userData.username}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
                          <span className="font-bold text-amber-700">Lv.{userData.leveling?.level || 1}</span>
                          {userData.countryCode && (
                            <span className="text-[10px] text-slate-400">• {userData.countryCode}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          if (onOpenSyncModal) onOpenSyncModal();
                          setIsMobileProfileOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                      >
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Profile & In-game Stats</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>

                      {onDisconnect && (
                        <button
                          onClick={() => {
                            if (onDisconnect) onDisconnect();
                            setIsMobileProfileOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition"
                        >
                          <span className="flex items-center gap-2">
                            <LogOut className="w-4 h-4" />
                            <span>Log Out / Switch Account</span>
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    <p className="text-xs text-slate-600">Connect your WarEra account to view live data.</p>
                    <button
                      onClick={() => {
                        if (onOpenSyncModal) onOpenSyncModal();
                        setIsMobileProfileOpen(false);
                      }}
                      className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs"
                    >
                      Link Account
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* DESKTOP VIEW (>= md) LAYOUT                              */}
          {/* ======================================================== */}
          
          {/* Logo & Navigation Tabs */}
          <div className="hidden md:flex items-center space-x-6 select-none">
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
                  <LineChart className="w-3.5 h-3.5" />
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
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Portfolio</span>
                </button>
              </nav>
            )}
          </div>

          {/* Desktop Right Status & Profile Controls */}
          <div className="hidden md:flex items-center space-x-2">
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
