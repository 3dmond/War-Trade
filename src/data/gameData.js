// Game Configuration & Math Reference derived from WarEra Wiki & Live Game Engine (updated v0.27+)

export const RECIPES = [
  // Raw Materials
  { id: 'grain', name: 'Grain', type: 'raw', pp: 1, inputs: [], category: 'Food & Farming', minLevel: 1 },
  { id: 'limestone', name: 'Limestone', type: 'raw', pp: 1, inputs: [], category: 'Construction', minLevel: 1 },
  { id: 'iron', name: 'Iron', type: 'raw', pp: 1, inputs: [], category: 'Metallurgy', minLevel: 1 },
  { id: 'lead', name: 'Lead', type: 'raw', pp: 1, inputs: [], category: 'Munitions', minLevel: 1 },
  { id: 'petroleum', name: 'Petroleum', type: 'raw', pp: 1, inputs: [], category: 'Energy', minLevel: 1 },
  { id: 'coca', name: 'Coca (Plant)', type: 'raw', pp: 1, inputs: [], category: 'Pharma', minLevel: 1 },
  { id: 'mysteriousPlant', name: 'Mysterious Plant', type: 'raw', pp: 1, inputs: [], category: 'Pharma', minLevel: 1 },
  { id: 'livestock', name: 'Livestock', type: 'raw', pp: 20, inputs: [], category: 'Food & Farming', minLevel: 1 },
  { id: 'fish', name: 'Fish', type: 'raw', pp: 40, inputs: [], category: 'Food & Farming', minLevel: 1 },
  { id: 'wood', name: 'Wood', type: 'raw', pp: 1, inputs: [], category: 'Raw Materials', minLevel: 1 },
  { id: 'scraps', name: 'Scraps', type: 'raw', pp: 1, inputs: [], category: 'Raw Materials', minLevel: 1 },

  // Processed Goods
  { id: 'bread', name: 'Bread', type: 'processed', pp: 10, inputs: [{ id: 'grain', qty: 10 }], totalPp: 20, category: 'Food & Farming', minLevel: 1, effect: '+10% Health recovery / 1 hunger' },
  { id: 'steak', name: 'Steak', type: 'processed', pp: 20, inputs: [{ id: 'livestock', qty: 1 }], totalPp: 40, category: 'Food & Farming', minLevel: 1, effect: '+20% Health recovery / 1 hunger' },
  { id: 'cookedFish', name: 'Cooked Fish', type: 'processed', pp: 40, inputs: [{ id: 'fish', qty: 1 }], totalPp: 80, category: 'Food & Farming', minLevel: 1, effect: '+30% Health recovery / 1 hunger' },
  { id: 'concrete', name: 'Concrete', type: 'processed', pp: 10, inputs: [{ id: 'limestone', qty: 10 }], totalPp: 20, category: 'Construction', minLevel: 1, effect: 'Used for Companies (100x), MUs (300x), Relocation (5x)' },
  { id: 'steel', name: 'Steel', type: 'processed', pp: 10, inputs: [{ id: 'iron', qty: 10 }], totalPp: 20, category: 'Metallurgy', minLevel: 1, effect: 'Used for Engine & Storage Upgrades' },
  { id: 'oil', name: 'Oil', type: 'processed', pp: 1, inputs: [{ id: 'petroleum', qty: 1 }], totalPp: 2, category: 'Energy', minLevel: 1, effect: 'Fuel upkeep for active MU Headquarters' },
  { id: 'lightAmmo', name: 'Light Ammo', type: 'processed', pp: 1, inputs: [{ id: 'lead', qty: 1 }], totalPp: 2, category: 'Munitions', minLevel: 1, effect: 'Consumable for battle attacks' },
  { id: 'ammo', name: 'Standard Ammo', type: 'processed', pp: 4, inputs: [{ id: 'lead', qty: 4 }], totalPp: 8, category: 'Munitions', minLevel: 1, effect: 'Mid-tier battle attack ammunition' },
  { id: 'heavyAmmo', name: 'Heavy Ammo', type: 'processed', pp: 16, inputs: [{ id: 'lead', qty: 16 }], totalPp: 32, category: 'Munitions', minLevel: 1, effect: 'High-damage combat ammunition' },
  { id: 'cocain', name: 'Cocain', type: 'processed', pp: 200, inputs: [{ id: 'coca', qty: 200 }], totalPp: 400, category: 'Pharma', minLevel: 5, effect: '+80% Damage Buff for 1 hunger' },
  { id: 'pill', name: 'Cocain', type: 'processed', pp: 200, inputs: [{ id: 'coca', qty: 200 }], totalPp: 400, category: 'Pharma', minLevel: 5, effect: '+80% Damage Buff for 1 hunger' },
  { id: 'paper', name: 'Paper', type: 'processed', pp: 1, inputs: [{ id: 'wood', qty: 1 }], totalPp: 2, category: 'Governance', minLevel: 1, effect: 'Required for Battle Orders, Alliances & Treaties' },
];

export const SKILL_DEFINITIONS = [
  // Combat Skills
  { id: 'attack', name: 'Attack', category: 'combat', unlockLevel: 1, baseValue: 100, step: 20, unit: '', maxLevel: 10, desc: 'Base damage dealt per combat hit' },
  { id: 'precision', name: 'Precision', category: 'combat', unlockLevel: 1, baseValue: 50, step: 5, unit: '%', maxLevel: 10, desc: 'Hit rate (misses deal 50% dmg). Capped at 100%; overflow converts to extra damage!' },
  { id: 'critChance', name: 'Crit Chance', category: 'combat', unlockLevel: 5, baseValue: 10, step: 5, unit: '%', maxLevel: 10, desc: 'Probability of landing a critical hit' },
  { id: 'critDamage', name: 'Crit Damage', category: 'combat', unlockLevel: 10, baseValue: 100, step: 20, unit: '%', maxLevel: 10, desc: 'Extra percentage damage multiplier applied to crits' },
  { id: 'health', name: 'Health Bar', category: 'combat', unlockLevel: 5, baseValue: 50, step: 10, unit: ' HP', maxLevel: 10, desc: 'Health pool (consumes 10 HP/hit, regen 10%/hr)' },
  { id: 'hunger', name: 'Hunger Bar', category: 'combat', unlockLevel: 5, baseValue: 4, step: 1, unit: ' pts', maxLevel: 10, desc: 'Food consumption capacity (1 food = 1 pt)' },
  { id: 'armor', name: 'Armor', category: 'combat', unlockLevel: 5, baseValue: 0, step: 4, unit: '%', maxLevel: 10, desc: 'Mitigates health lost per hit (up to 90% max mitigation = 1 HP/hit)' },
  { id: 'dodge', name: 'Dodge', category: 'combat', unlockLevel: 10, baseValue: 0, step: 4, unit: '%', maxLevel: 10, desc: 'Chance to take 0 health loss & 0 armor durability wear' },
  
  // Economic Skills
  { id: 'energy', name: 'Energy Bar', category: 'economy', unlockLevel: 1, baseValue: 30, step: 10, unit: ' pts', maxLevel: 10, desc: 'Worker stamina (consumes 10 pts/work session, regen 10%/hr)' },
  { id: 'companies', name: 'Companies', category: 'economy', unlockLevel: 1, baseValue: 2, step: 1, unit: ' owned', maxLevel: 10, desc: 'Maximum number of companies you can own' },
  { id: 'management', name: 'Management', category: 'economy', unlockLevel: 10, baseValue: 0, step: 1, unit: ' lvl', maxLevel: 10, desc: '+2% production bonus per level applied to every employee in all your companies. Also required to become a paid Manager for another company.' },
  { id: 'leadership', name: 'Leadership', category: 'economy', unlockLevel: 1, baseValue: 0, step: 1, unit: ' lvl', maxLevel: 10, desc: 'Improves training card quality: +1% Uncommon, +0.6% Rare, +0.3% Epic, +0.1% Legendary per level.' },
  { id: 'entrepreneurship', name: 'Entrepreneurship', category: 'economy', unlockLevel: 1, baseValue: 30, step: 5, unit: ' pts', maxLevel: 10, desc: 'Stamina for self-working in your own companies' },
  { id: 'production', name: 'Production', category: 'economy', unlockLevel: 1, baseValue: 10, step: 3, unit: ' PP/hit', maxLevel: 10, desc: 'Work efficiency: PP produced per work session (self-work only)' },

  // Special Skills
  { id: 'lootChance', name: 'Loot Chance', category: 'special', unlockLevel: 10, baseValue: 5, step: 2, unit: '%', maxLevel: 10, desc: 'Chance to loot Case (+1%/%) and Elite Case (+0.01%/%) per battle hit' }
];

export const ENGINE_UPGRADE_TIERS = [
  { level: 1, steel: 0, ppPerHour: 1 },
  { level: 2, steel: 20, ppPerHour: 2 },
  { level: 3, steel: 40, ppPerHour: 3 },
  { level: 4, steel: 80, ppPerHour: 4 },
  { level: 5, steel: 160, ppPerHour: 5 },
  { level: 6, steel: 320, ppPerHour: 6 },
  { level: 7, steel: 640, ppPerHour: 7 },
];

export const STORAGE_UPGRADE_TIERS = [
  { level: 1, steel: 0, capacity: 200 },
  { level: 2, steel: 10, capacity: 400 },
  { level: 3, steel: 20, capacity: 600 },
  { level: 4, steel: 40, capacity: 800 },
  { level: 5, steel: 80, capacity: 1000 },
  { level: 6, steel: 160, capacity: 1200 },
  { level: 7, steel: 320, capacity: 1400 },
];

// Break Room upgrade tiers — unlocks employee slots per company (max 3 employees per company)
export const BREAK_ROOM_TIERS = [
  { level: 0, maxEmployees: 0, label: 'No Break Room' },
  { level: 1, maxEmployees: 1, label: 'Break Room I' },
  { level: 2, maxEmployees: 2, label: 'Break Room II' },
  { level: 3, maxEmployees: 3, label: 'Break Room III' },
];

// Employee system capacity constants (v0.27+)
export const EMPLOYEE_CAPS = {
  maxPerCompany: 3,          // Hard cap: 3 employees per company (Break Room III)
  maxCompaniesBase: 12,      // Companies skill Lv10 = 12 companies
  maxCompaniesPrestige: 13,  // Prestige adds 1 more company slot
  maxTotalBase: 36,          // 12 × 3
  maxTotalPrestige: 39,      // 13 × 3
};

// Returns max employees allowed in a company given its Break Room level
export function getBreakRoomCapacity(breakRoomLevel = 0) {
  const tier = BREAK_ROOM_TIERS.find(t => t.level === breakRoomLevel);
  return tier ? tier.maxEmployees : 0;
}

// Triangular skill points: cost to reach level N from (N-1) is N. Total cost = N*(N+1)/2.
export function getSkillCostToLevel(targetLevel) {
  if (targetLevel <= 0) return 0;
  return (targetLevel * (targetLevel + 1)) / 2;
}

export function getTotalSkillPointsAtLevel(playerLevel) {
  // 4 points base at Level 1, plus 4 points per level up
  return 4 + Math.max(0, playerLevel - 1) * 4;
}

// Calculate effective skill value at any level matching WarEra in-game growth
export function getSkillValue(skillId, level = 0) {
  const def = SKILL_DEFINITIONS.find(s => s.id.toLowerCase() === (skillId || '').toLowerCase());
  if (!def) return 0;
  const numLevel = Math.max(0, Math.min(def.maxLevel ?? 10, Number(level) || 0));
  return def.baseValue + numLevel * def.step;
}

export function getSkillDefinition(skillId) {
  return SKILL_DEFINITIONS.find(s => s.id.toLowerCase() === (skillId || '').toLowerCase()) || null;
}

// Recommended archetypes
export const ARCHETYPES = {
  tycoon: {
    id: 'tycoon',
    name: 'Industrial Tycoon',
    tagline: 'Maximize business expansion with companies, leadership-trained employees, and self-work.',
    icon: 'Factory',
    priority: ['companies', 'energy', 'leadership', 'management', 'entrepreneurship', 'production'],
    secondary: ['health', 'hunger', 'lootChance']
  },
  warlord: {
    id: 'warlord',
    name: 'Frontline Warlord',
    tagline: 'Shatter enemy damage pools with overflow attack, max precision, crits and armor.',
    icon: 'Swords',
    priority: ['attack', 'precision', 'critChance', 'critDamage', 'armor', 'dodge', 'health', 'hunger'],
    secondary: ['energy', 'production']
  },
  scavenger: {
    id: 'scavenger',
    name: 'Battle Scavenger / Case Hunter',
    tagline: 'Farm high-value Cases and Elite Cases with max Dodge & Armor for lowest cost per hit.',
    icon: 'PackageOpen',
    priority: ['lootChance', 'dodge', 'armor', 'precision', 'health', 'hunger'],
    secondary: ['attack', 'entrepreneurship']
  },
  hybrid: {
    id: 'hybrid',
    name: 'Balanced Sovereign',
    tagline: 'Self-sufficient economic engine supporting regular patriotic battle contributions.',
    icon: 'Scale',
    priority: ['production', 'attack', 'companies', 'precision', 'entrepreneurship', 'health', 'hunger', 'armor'],
    secondary: ['energy', 'critChance', 'lootChance']
  }
};
