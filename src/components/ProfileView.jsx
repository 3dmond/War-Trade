import React from 'react';
import { 
  User, 
  Shield, 
  Coins, 
  Building2, 
  Swords, 
  Flame, 
  ExternalLink, 
  RefreshCw,
  Award,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { SKILL_DEFINITIONS } from '../data/gameData';

export default function ProfileView({ dossier, onOpenSyncModal }) {
  const user = dossier?.user;
  const companies = dossier?.companies || [];
  const equipment = dossier?.equipment;
  const totalWorkers = dossier?.totalWorkers || 0;

  // Empty state if no profile is loaded
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400 shadow-xl">
          <User className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-zinc-100 font-sans">
            No Profile Connected
          </h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
            Connect any WarEra player profile using their username, 24-character User ID, or profile link to inspect their skills, companies, and combat loadout.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={onOpenSyncModal}
            className="px-5 py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 font-medium text-xs transition shadow-lg inline-flex items-center gap-2"
          >
            <User className="w-4 h-4 text-zinc-700" />
            <span>Link WarEra Profile</span>
          </button>
        </div>
      </div>
    );
  }

  const leveling = user.leveling || {};
  const skills = user.skills || {};
  const stats = user.stats || {};
  const wealth = stats.wealth || {};

  // Group skills by category
  const combatSkills = SKILL_DEFINITIONS.filter(s => s.category === 'combat');
  const econSkills = SKILL_DEFINITIONS.filter(s => s.category === 'economy' || s.category === 'special');

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      
      {/* Profile Overview Card with Generous Breathing Room */}
      <div className="bg-zinc-900/60 border border-zinc-800/90 rounded-xl p-6 shadow-xl space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/70">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xl font-bold text-zinc-100">
              {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-zinc-100">{user.username}</h1>
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-mono font-semibold">
                  Lv. {leveling.level || 1}
                </span>
                {leveling.prestigeLevel > 0 && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-semibold">
                    Prestige {leveling.prestigeLevel}
                  </span>
                )}
              </div>
              <div className="text-xs text-zinc-500 font-mono mt-1 flex items-center space-x-2">
                <span>ID: {user._id}</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">
                  {user.isActive ? 'Active Citizen' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenSyncModal}
            className="px-3.5 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition self-start sm:self-auto flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
            <span>Switch Profile</span>
          </button>
        </div>

        {/* 4 Spacious Summary Stat Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-950/60 border border-zinc-800/80 p-4 rounded-lg">
            <div className="text-xs text-zinc-500 font-medium">Military Rank</div>
            <div className="text-lg font-bold text-zinc-100 mt-1 font-sans">
              {user.rank || 'Recruit'}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5 font-mono">
              Total XP: {(leveling.xp || 0).toLocaleString()}
            </div>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/80 p-4 rounded-lg">
            <div className="text-xs text-zinc-500 font-medium">Total Wealth</div>
            <div className="text-lg font-bold text-emerald-400 mt-1 font-mono">
              ${(wealth.total || wealth.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5 font-mono">
              Cash & In-game Assets
            </div>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/80 p-4 rounded-lg">
            <div className="text-xs text-zinc-500 font-medium">Enterprises Owned</div>
            <div className="text-lg font-bold text-zinc-100 mt-1 font-mono">
              {companies.length} Companies
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5 font-mono">
              Active Production Lines
            </div>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/80 p-4 rounded-lg">
            <div className="text-xs text-zinc-500 font-medium">Workforce Employed</div>
            <div className="text-lg font-bold text-zinc-100 mt-1 font-mono">
              {totalWorkers} Workers
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5 font-mono">
              Across All Facilities
            </div>
          </div>
        </div>

      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Combat Skills */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-zinc-800/80">
            <Swords className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider font-mono">
              Combat Skills
            </h3>
          </div>

          <div className="space-y-3.5">
            {combatSkills.map((sk) => {
              const currentLvl = skills[sk.id] || 0;
              const pct = (currentLvl / sk.maxLevel) * 100;
              return (
                <div key={sk.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-300">{sk.name}</span>
                    <span className="text-zinc-400 font-semibold">
                      Lvl {currentLvl}/{sk.maxLevel}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-zinc-300 h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                  <div className="text-[10px] text-zinc-500">{sk.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Economic Skills */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-zinc-800/80">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider font-mono">
              Economic Skills
            </h3>
          </div>

          <div className="space-y-3.5">
            {econSkills.map((sk) => {
              const currentLvl = skills[sk.id] || 0;
              const pct = (currentLvl / sk.maxLevel) * 100;
              return (
                <div key={sk.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-300">{sk.name}</span>
                    <span className="text-zinc-400 font-semibold">
                      Lvl {currentLvl}/{sk.maxLevel}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                  <div className="text-[10px] text-zinc-500">{sk.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Owned Companies (if any) */}
      {companies.length > 0 && (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider font-mono">
              Enterprise Facilities ({companies.length})
            </h3>
            <span className="text-xs text-zinc-500 font-mono">Active Production</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((comp, idx) => (
              <div 
                key={comp._id || idx}
                className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-2 text-xs font-mono"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-zinc-200">{comp.name || `Facility #${idx + 1}`}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    {comp.itemCode || 'Good'}
                  </span>
                </div>
                <div className="text-zinc-500 text-[11px]">
                  Region: {comp.region || 'HQ'}
                </div>
                <div className="pt-2 border-t border-zinc-800 flex justify-between text-zinc-400 text-[11px]">
                  <span>Engine: Lvl {comp.automatedEngine?.level || 1}</span>
                  <span>Storage: Lvl {comp.storage?.level || 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
