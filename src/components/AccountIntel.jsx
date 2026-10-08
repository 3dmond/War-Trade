import React from 'react';
import { 
  User, 
  Building2, 
  Shield, 
  Swords, 
  Coins, 
  Layers, 
  PackageOpen, 
  Award, 
  Zap, 
  Flame, 
  RefreshCw, 
  ArrowUpRight,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { SKILL_DEFINITIONS } from '../data/gameData';

export default function AccountIntel({ 
  dossier, 
  onOpenSyncModal, 
  onLoadBuildToAdvisor,
  onAnalyzeCompanyInOptimizer 
}) {
  const user = dossier?.user;
  const companies = dossier?.companies || [];
  const equipment = dossier?.equipment;
  const totalWorkers = dossier?.totalWorkers || 0;

  if (!user) {
    return (
      <div className="bg-[#0f1523] border border-[#1b253b] rounded-xl p-8 shadow-lg text-center space-y-4 font-mono">
        <div className="w-12 h-12 rounded-full bg-cyan-950 border border-cyan-800/60 flex items-center justify-center mx-auto text-cyan-400">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white uppercase">No WarEra Profile Loaded</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Paste any WarEra profile URL, User ID (24-hex), or in-game username to extract their entire character dossier, skills build, companies, and combat equipment.
          </p>
        </div>
        <button
          onClick={onOpenSyncModal}
          className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-bold text-white text-xs shadow-lg shadow-cyan-600/30 transition"
        >
          EXTRACT ANY WARERA PROFILE
        </button>
      </div>
    );
  }

  const leveling = user.leveling || {};
  const skills = user.skills || {};
  const stats = user.stats || {};
  const wealth = stats.wealth || {};

  return (
    <div className="space-y-6 font-mono text-xs">
      
      {/* Profile Overview Card */}
      <div className="bg-[#0f1523] border border-[#1b253b] rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#182033] pb-4 mb-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600 via-blue-700 to-indigo-800 flex items-center justify-center text-white font-extrabold text-lg shadow-lg border border-cyan-400/40">
              {user.username ? user.username[0].toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-white">{user.username}</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50 text-[11px] font-bold">
                  LEVEL {leveling.level || 1}
                </span>
                {leveling.prestigeLevel > 0 && (
                  <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/50 text-[10px] font-bold">
                    PRESTIGE {leveling.prestigeLevel}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                <span>User ID: <code className="text-slate-300">{user._id}</code></span>
                <span>•</span>
                <span>Status: <strong className="text-emerald-400">{user.isActive ? 'ACTIVE' : 'INACTIVE'}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenSyncModal}
              className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-bold text-white transition flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>SEARCH / EXTRACT ANOTHER PROFILE</span>
            </button>
          </div>
        </div>

        {/* Level XP Bar */}
        <div className="mb-4 bg-[#121826] p-3 rounded-lg border border-[#1a2335]">
          <div className="flex justify-between items-center text-[11px] mb-1">
            <span className="text-slate-400">Total Experience: <strong className="text-white">{(leveling.totalXp || 0).toLocaleString()} XP</strong></span>
            <span className="text-cyan-400 font-bold">Level {leveling.level}</span>
          </div>
          <div className="w-full h-2 bg-[#1a2335] rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full w-2/3"></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>Available Skill Points: <strong className="text-emerald-400">{leveling.availableSkillPoints || 0}</strong></span>
            <span>Total Skill Points Earned: <strong className="text-white">{leveling.totalSkillPoints || 0}</strong></span>
          </div>
        </div>

        {/* Wealth & Core Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 bg-[#121826] border border-[#1a2335] rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase block">Total Net Worth</span>
            <span className="text-base font-bold text-amber-400 mt-1 block">
              {(wealth.total || stats.estimatedWealth || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] text-slate-500">BTC</span>
          </div>

          <div className="p-3 bg-[#121826] border border-[#1a2335] rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase block">Liquid Money</span>
            <span className="text-base font-bold text-emerald-400 mt-1 block">
              {(wealth.money || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] text-slate-500">BTC</span>
          </div>

          <div className="p-3 bg-[#121826] border border-[#1a2335] rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase block">Total Lifetime Damage</span>
            <span className="text-base font-bold text-red-400 mt-1 block">
              {(stats.damagesCount || 0).toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500">Global Rank #{stats.damagesRanking || '—'}</span>
          </div>

          <div className="p-3 bg-[#121826] border border-[#1a2335] rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase block">Owned Companies</span>
            <span className="text-base font-bold text-cyan-400 mt-1 block">
              {companies.length} Companies
            </span>
            <span className="text-[10px] text-slate-500">Valued at {(wealth.companies || 0).toFixed(0)} BTC</span>
          </div>

          <div className="p-3 bg-[#121826] border border-[#1a2335] rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase block">Work Sessions</span>
            <span className="text-base font-bold text-purple-400 mt-1 block">
              {(stats.worksCount || 0).toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500">Streak: {stats.dailyRewardStreak || 0} days</span>
          </div>
        </div>
      </div>

      {/* Extracted Character Build Section */}
      <div className="bg-[#0f1523] border border-[#1b253b] rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#182033] pb-3 gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Swords className="w-4 h-4 text-cyan-400" />
              CHARACTER BUILD & ALLOCATED SKILLS
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live snapshot of their 14 skills, gear bonuses, and effective values.
            </p>
          </div>

          <button
            onClick={() => onLoadBuildToAdvisor && onLoadBuildToAdvisor(user)}
            className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 font-bold flex items-center gap-1.5 transition self-start sm:self-auto"
          >
            <span>Analyze Build in Advisor</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(skills).map(([key, sk]) => {
            const def = SKILL_DEFINITIONS.find(d => d.id === key || d.id === key.toLowerCase()) || { name: key };
            const lvl = sk.level || 0;
            const total = sk.total || sk.value || 0;
            const gearBonus = (sk.weapon || 0) + (sk.equipment || 0);

            return (
              <div key={key} className="p-3 bg-[#121826] border border-[#1a2335] rounded-lg space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-xs">{def.name || key}</span>
                  <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40 text-[10px] font-bold">
                    Lv {lvl}/10
                  </span>
                </div>
                
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span>Effective Stat:</span>
                  <span className="text-cyan-400 font-bold">{total}</span>
                </div>

                {gearBonus > 0 && (
                  <div className="flex justify-between text-[10px] text-emerald-400">
                    <span>Gear Buffs:</span>
                    <span>+{gearBonus}</span>
                  </div>
                )}

                {sk.hourlyBarRegen && (
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Hourly Regen:</span>
                    <span>+{sk.hourlyBarRegen}/hr</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Owned Companies (Industrial Portfolio) */}
      <div className="bg-[#0f1523] border border-[#1b253b] rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-[#182033] pb-3">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              OWNED INDUSTRIAL PORTFOLIO ({companies.length} COMPANIES)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Total Workers Employed: {totalWorkers}</span>
        </div>

        {companies.length === 0 ? (
          <div className="p-6 text-center text-slate-500 bg-[#121826] rounded-lg border border-[#1a2335]">
            No companies found for this profile.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {companies.map((comp, idx) => (
              <div 
                key={comp._id || idx} 
                className="p-3.5 bg-[#121826] border border-[#1a2335] rounded-lg space-y-2.5 hover:border-cyan-800/60 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs truncate max-w-[150px]">
                    {comp.name || `Company #${idx + 1}`}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40 text-[10px] font-bold">
                    {comp.itemCode ? comp.itemCode.toUpperCase() : 'UNKNOWN'}
                  </span>
                </div>

                <div className="space-y-1 text-[11px] text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Automated Engine:</span>
                    <span className="text-amber-400 font-bold">
                      Lv {comp.activeUpgradeLevels?.automatedEngine || 1} ({(comp.activeUpgradeLevels?.automatedEngine || 1)} PP/h)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Storage Storage:</span>
                    <span className="text-cyan-400 font-bold">
                      Lv {comp.activeUpgradeLevels?.storage || 1} ({((comp.activeUpgradeLevels?.storage || 1) * 200)} PP max)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Stored PP Output:</span>
                    <span className="text-white font-bold">{comp.production?.toFixed(1) || '0'} PP</span>
                  </div>
                  <div className="flex justify-between border-t border-[#1a2335] pt-1">
                    <span className="text-slate-400">Estimated Value:</span>
                    <span className="text-emerald-400 font-bold">{comp.estimatedValue?.toFixed(1) || '—'} BTC</span>
                  </div>
                </div>

                <button
                  onClick={() => onAnalyzeCompanyInOptimizer && onAnalyzeCompanyInOptimizer(comp.itemCode)}
                  className="w-full py-1 text-center bg-[#151d2f] hover:bg-cyan-950 border border-cyan-900/40 rounded text-cyan-300 text-[10px] font-bold transition flex items-center justify-center gap-1"
                >
                  <span>Analyze Profitability in Optimizer</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Combat Equipment & Weapon Loadout */}
      {equipment && (
        <div className="bg-[#0f1523] border border-[#1b253b] rounded-xl p-5 shadow-lg space-y-4">
          <div className="border-b border-[#182033] pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              EQUIPPED COMBAT ARSENAL & DURABILITY
            </h3>
            <span className="text-[11px] text-slate-400">
              Active Ammo: <strong className="text-amber-400">{equipment.ammo || 'None'}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { slot: 'Weapon', item: equipment.weapon },
              { slot: 'Helmet', item: equipment.helmet },
              { slot: 'Chest', item: equipment.chest },
              { slot: 'Pants', item: equipment.pants },
              { slot: 'Boots', item: equipment.boots },
              { slot: 'Gloves', item: equipment.gloves },
            ].map(({ slot, item }) => (
              <div key={slot} className="p-3 bg-[#121826] border border-[#1a2335] rounded-lg space-y-1">
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">{slot}</span>
                {item ? (
                  <>
                    <span className="text-xs font-bold text-white block truncate">
                      {item.code ? item.code.toUpperCase() : item.type || 'Equipped'}
                    </span>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>Durability:</span>
                      <span className={item.state > 20 ? 'text-emerald-400' : 'text-red-400'}>
                        {item.state}/{item.maxState || 100}
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-[11px] text-slate-600 italic block py-2">Empty Slot</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
