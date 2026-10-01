import React, { useState, useEffect, useMemo } from 'react';
import { 
  Target, 
  Swords, 
  Factory, 
  PackageOpen, 
  Scale, 
  Zap, 
  ShieldCheck, 
  Plus, 
  Minus, 
  RotateCcw, 
  Check, 
  Info,
  Sparkles,
  Download
} from 'lucide-react';
import { SKILL_DEFINITIONS, ARCHETYPES, getSkillCostToLevel, getTotalSkillPointsAtLevel } from '../data/gameData';

export default function BuildAdvisor({ userLevel = 1, currentSkills = {}, syncedUsername = null }) {
  const [level, setLevel] = useState(userLevel || 5);
  const [activeArchetype, setActiveArchetype] = useState('tycoon');
  
  // Custom skill allocations { [skillId]: level (0-10) }
  const [allocatedSkills, setAllocatedSkills] = useState(() => {
    const initial = {};
    SKILL_DEFINITIONS.forEach(s => { initial[s.id] = 0; });
    return initial;
  });

  // Keep level in sync when user profile changes
  useEffect(() => {
    if (userLevel && userLevel > 1) {
      setLevel(userLevel);
    }
  }, [userLevel]);

  // Load user's actual in-game skill allocation
  const loadLiveUserSkills = () => {
    if (!currentSkills || Object.keys(currentSkills).length === 0) return;
    const newAlloc = {};
    SKILL_DEFINITIONS.forEach(s => {
      // Find matching key in user's skills
      const sk = currentSkills[s.id] || currentSkills[s.id.toLowerCase()];
      newAlloc[s.id] = sk?.level || 0;
    });
    setAllocatedSkills(newAlloc);
  };

  // Calculate total skill points available for the selected level
  const totalPointsAvailable = useMemo(() => {
    return getTotalSkillPointsAtLevel(level);
  }, [level]);

  // Calculate points spent
  const totalPointsSpent = useMemo(() => {
    let spent = 0;
    Object.entries(allocatedSkills).forEach(([skillId, lvl]) => {
      spent += getSkillCostToLevel(lvl);
    });
    return spent;
  }, [allocatedSkills]);

  const pointsRemaining = totalPointsAvailable - totalPointsSpent;

  // Apply an archetype preset automatically tailored to the level
  const applyArchetype = (archetypeKey, targetLevel = level) => {
    setActiveArchetype(archetypeKey);
    const arch = ARCHETYPES[archetypeKey];
    if (!arch) return;

    let available = getTotalSkillPointsAtLevel(targetLevel);
    const newAlloc = {};
    SKILL_DEFINITIONS.forEach(s => { newAlloc[s.id] = 0; });

    // Round-robin / priority allocation into primary skills that are unlocked at this level
    const unlockedPrimaries = arch.priority.filter(id => {
      const def = SKILL_DEFINITIONS.find(s => s.id === id);
      return def && def.unlockLevel <= targetLevel;
    });

    const unlockedSecondaries = arch.secondary.filter(id => {
      const def = SKILL_DEFINITIONS.find(s => s.id === id);
      return def && def.unlockLevel <= targetLevel;
    });

    let changed = true;
    let loopCount = 0;
    while (changed && available > 0 && loopCount < 30) {
      changed = false;
      loopCount++;

      // Try leveling primaries first
      for (const skillId of unlockedPrimaries) {
        const curLvl = newAlloc[skillId] || 0;
        if (curLvl < 10) {
          const costToNext = curLvl + 1;
          if (available >= costToNext) {
            newAlloc[skillId] = curLvl + 1;
            available -= costToNext;
            changed = true;
          }
        }
      }

      // Then secondaries if primaries are high or out of reach
      if (!changed) {
        for (const skillId of unlockedSecondaries) {
          const curLvl = newAlloc[skillId] || 0;
          if (curLvl < 10) {
            const costToNext = curLvl + 1;
            if (available >= costToNext) {
              newAlloc[skillId] = curLvl + 1;
              available -= costToNext;
              changed = true;
            }
          }
        }
      }
    }

    setAllocatedSkills(newAlloc);
  };

  const handleAdjustSkill = (skillId, delta) => {
    const curLvl = allocatedSkills[skillId] || 0;
    const nextLvl = curLvl + delta;
    if (nextLvl < 0 || nextLvl > 10) return;

    const skillDef = SKILL_DEFINITIONS.find(s => s.id === skillId);
    if (skillDef && skillDef.unlockLevel > level) return;

    if (delta > 0) {
      const cost = nextLvl;
      if (pointsRemaining >= cost) {
        setAllocatedSkills(prev => ({ ...prev, [skillId]: nextLvl }));
      }
    } else {
      setAllocatedSkills(prev => ({ ...prev, [skillId]: nextLvl }));
    }
  };

  const handleReset = () => {
    const res = {};
    SKILL_DEFINITIONS.forEach(s => { res[s.id] = 0; });
    setAllocatedSkills(res);
  };

  // Compute calculated combat & economic stats
  const calculatedStats = useMemo(() => {
    const getVal = (id) => {
      const def = SKILL_DEFINITIONS.find(s => s.id === id);
      const lvl = allocatedSkills[id] || 0;
      return def ? def.baseValue + (lvl * def.step) : 0;
    };

    const rawPrecision = getVal('precision');
    const effectivePrecision = Math.min(100, rawPrecision);
    const overflowPrecision = Math.max(0, rawPrecision - 100);

    const baseAttack = getVal('attack');
    const effectiveAttack = baseAttack * (1 + (overflowPrecision / 100));

    const critChance = getVal('critChance');
    const critDamageBonus = getVal('critDamage');
    const armorPct = Math.min(90, getVal('armor')); // Capped at 90% (min 1 HP loss)
    const dodgePct = Math.min(40, getVal('dodge'));
    const lootPct = getVal('lootChance');

    const health = getVal('health');
    const hunger = getVal('hunger');
    const energy = getVal('energy');
    const entrepreneurship = getVal('entrepreneurship');
    const companies = getVal('companies');
    const management = getVal('management');
    const production = getVal('production');

    return {
      effectiveAttack,
      baseAttack,
      effectivePrecision,
      overflowPrecision,
      critChance,
      critDamageBonus,
      armorPct,
      dodgePct,
      lootPct,
      health,
      hunger,
      energy,
      entrepreneurship,
      companies,
      management,
      production
    };
  }, [allocatedSkills]);

  const hasCurrentSkills = currentSkills && Object.keys(currentSkills).length > 0;

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Archetype Selector */}
      <div className="bg-[#0f1523] border border-[#1b253b] rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#182033] pb-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              CHARACTER BUILD ADVISOR & LEVEL ROADMAP
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Optimizes your 14 skills based on triangular cost curves $N(N+1)/2$ and level unlock thresholds.
            </p>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs">
            {hasCurrentSkills && (
              <button
                onClick={loadLiveUserSkills}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 font-bold transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>LOAD @{syncedUsername || 'USER'}'S LIVE BUILD</span>
              </button>
            )}

            <button
              onClick={handleReset}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#141d2f] hover:bg-[#1b2740] border border-[#1f2b45] text-slate-300 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET</span>
            </button>
          </div>
        </div>

        {/* Level Slider & Point Status */}
        <div className="bg-[#121826] border border-[#1a2335] rounded-lg p-4 mb-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-1/2 font-mono">
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="text-slate-300">Simulate Target Character Level:</span>
              <span className="text-cyan-400 font-bold text-base">LEVEL {level}</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={level}
              onChange={(e) => {
                const newLvl = parseInt(e.target.value);
                setLevel(newLvl);
                applyArchetype(activeArchetype, newLvl);
              }}
              className="w-full accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Lv 1 (Novice)</span>
              <span>Lv 5 (Combat/Bars Unlocked)</span>
              <span>Lv 10 (Advanced Unlocked)</span>
              <span>Lv 50+</span>
            </div>
          </div>

          <div className="flex items-center space-x-6 font-mono text-center">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Total Points</span>
              <span className="text-xl font-bold text-white">{totalPointsAvailable}</span>
            </div>
            <div className="h-8 w-px bg-[#1f2b42]" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Points Spent</span>
              <span className="text-xl font-bold text-amber-400">{totalPointsSpent}</span>
            </div>
            <div className="h-8 w-px bg-[#1f2b42]" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Points Remaining</span>
              <span className={`text-xl font-bold ${pointsRemaining > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                {pointsRemaining}
              </span>
            </div>
          </div>
        </div>

        {/* Archetype Preset Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(ARCHETYPES).map(([key, arch]) => {
            const isSelected = activeArchetype === key;
            return (
              <div
                key={key}
                onClick={() => applyArchetype(key)}
                className={`cursor-pointer p-3.5 rounded-lg border transition text-left flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-950/30 border-cyan-500/80 shadow-md shadow-cyan-950/50'
                    : 'bg-[#121826] border-[#1a2335] hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                      {arch.name}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {arch.tagline}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#1a2335] flex items-center justify-between text-[10px] font-mono">
                  <span className="text-cyan-400 font-semibold">Priority:</span>
                  <span className="text-slate-300 truncate max-w-[130px]">
                    {arch.priority.slice(0, 3).join(', ')}...
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Calculated Stat Dashboard */}
      <div className="bg-[#0f1523] border border-[#1b253b] rounded-xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-white font-mono border-b border-[#182033] pb-3 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          ESTIMATED STAT METRICS AT LEVEL {level} ({ARCHETYPES[activeArchetype]?.name.toUpperCase()})
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-center">
          <div className="p-3 bg-[#121826] border border-[#1a2335] rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase block">Effective Attack</span>
            <span className="text-lg font-bold text-amber-400">{calculatedStats.effectiveAttack.toFixed(0)}</span>
            <span className="text-[10px] text-slate-500 block">Base {calculatedStats.baseAttack}</span>
          </div>

          <div className="p-3 bg-[#121826] border border-[#1a2335] rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase block">Precision Rate</span>
            <span className="text-lg font-bold text-cyan-400">{calculatedStats.effectivePrecision}%</span>
            <span className="text-[10px] text-slate-500 block">
              {calculatedStats.overflowPrecision > 0 ? `+${calculatedStats.overflowPrecision}% overflow dmg` : 'No overflow'}
            </span>
          </div>

          <div className="p-3 bg-[#121826] border border-[#1a2335] rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase block">Crit Chance / Dmg</span>
            <span className="text-lg font-bold text-purple-400">{calculatedStats.critChance}%</span>
            <span className="text-[10px] text-slate-500 block">+{calculatedStats.critDamageBonus}% mult</span>
          </div>

          <div className="p-3 bg-[#121826] border border-[#1a2335] rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase block">Armor & Dodge</span>
            <span className="text-lg font-bold text-emerald-400">{calculatedStats.armorPct}% / {calculatedStats.dodgePct}%</span>
            <span className="text-[10px] text-slate-500 block">
              Takes ~{Math.max(1, 10 * (1 - calculatedStats.armorPct / 100)).toFixed(1)} HP / hit
            </span>
          </div>

          <div className="p-3 bg-[#121826] border border-[#1a2335] rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase block">Loot Drop / Hit</span>
            <span className="text-lg font-bold text-amber-300">{calculatedStats.lootPct}%</span>
            <span className="text-[10px] text-slate-500 block">+{calculatedStats.lootPct * 0.01}% Elite</span>
          </div>

          <div className="p-3 bg-[#121826] border border-[#1a2335] rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase block">Work PP / Session</span>
            <span className="text-lg font-bold text-blue-400">{calculatedStats.production} PP</span>
            <span className="text-[10px] text-slate-500 block">Per 10 Stamina</span>
          </div>
        </div>
      </div>

      {/* Interactive Skill Allocator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Combat Skills */}
        <div className="bg-[#0f1523] border border-[#1b253b] rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-[#182033] pb-3">
            <h3 className="text-sm font-bold text-red-400 font-mono flex items-center gap-2">
              <Swords className="w-4 h-4 text-red-400" />
              COMBAT SKILLS
            </h3>
            <span className="text-xs text-slate-400 font-mono">Unlock gates: Lv 1, 5, 10</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {SKILL_DEFINITIONS.filter(s => s.category === 'combat').map((skill) => {
              const currentLvl = allocatedSkills[skill.id] || 0;
              const isLocked = skill.unlockLevel > level;
              const costToNext = currentLvl + 1;
              const canAfford = pointsRemaining >= costToNext && currentLvl < 10 && !isLocked;

              return (
                <div 
                  key={skill.id}
                  className={`p-3 rounded-lg border flex items-center justify-between transition ${
                    isLocked ? 'bg-[#0b0e17] border-[#151c2a] opacity-50' : 'bg-[#121826] border-[#1a2335]'
                  }`}
                >
                  <div className="space-y-0.5 max-w-[200px] sm:max-w-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-xs">{skill.name}</span>
                      {isLocked && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/40">
                          REQ LV {skill.unlockLevel}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">{skill.desc}</p>
                    <span className="text-[11px] text-cyan-300 font-semibold block">
                      Value: {skill.baseValue + currentLvl * skill.step}{skill.unit}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span className="text-sm font-bold text-white block">Lv {currentLvl}/10</span>
                      <span className="text-[10px] text-slate-500">
                        {currentLvl < 10 ? `Next: -${costToNext} pts` : 'MAXED'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleAdjustSkill(skill.id, -1)}
                        disabled={currentLvl <= 0}
                        className="w-7 h-7 rounded bg-[#1a2337] hover:bg-[#222e47] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-300"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleAdjustSkill(skill.id, 1)}
                        disabled={!canAfford}
                        className="w-7 h-7 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Economic & Special Skills */}
        <div className="bg-[#0f1523] border border-[#1b253b] rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-[#182033] pb-3">
            <h3 className="text-sm font-bold text-blue-400 font-mono flex items-center gap-2">
              <Factory className="w-4 h-4 text-blue-400" />
              ECONOMIC & SPECIAL SKILLS
            </h3>
            <span className="text-xs text-slate-400 font-mono">Unlock gates: Lv 1, 10</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {SKILL_DEFINITIONS.filter(s => s.category !== 'combat').map((skill) => {
              const currentLvl = allocatedSkills[skill.id] || 0;
              const isLocked = skill.unlockLevel > level;
              const costToNext = currentLvl + 1;
              const canAfford = pointsRemaining >= costToNext && currentLvl < 10 && !isLocked;

              return (
                <div 
                  key={skill.id}
                  className={`p-3 rounded-lg border flex items-center justify-between transition ${
                    isLocked ? 'bg-[#0b0e17] border-[#151c2a] opacity-50' : 'bg-[#121826] border-[#1a2335]'
                  }`}
                >
                  <div className="space-y-0.5 max-w-[200px] sm:max-w-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-xs">{skill.name}</span>
                      {isLocked && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/40">
                          REQ LV {skill.unlockLevel}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">{skill.desc}</p>
                    <span className="text-[11px] text-cyan-300 font-semibold block">
                      Value: {skill.baseValue + currentLvl * skill.step}{skill.unit}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span className="text-sm font-bold text-white block">Lv {currentLvl}/10</span>
                      <span className="text-[10px] text-slate-500">
                        {currentLvl < 10 ? `Next: -${costToNext} pts` : 'MAXED'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleAdjustSkill(skill.id, -1)}
                        disabled={currentLvl <= 0}
                        className="w-7 h-7 rounded bg-[#1a2337] hover:bg-[#222e47] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-300"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleAdjustSkill(skill.id, 1)}
                        disabled={!canAfford}
                        className="w-7 h-7 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
