// WarEra v0.27+ Employee Trait Definitions & Metadata
// Authoritative, exhaustive catalog of all in-game employee traits grouped by category.

export const TRAIT_CATEGORIES = {
  tools: 'Tools',
  coworkers: 'Coworkers',
  work: 'Work',
  ageAndTenure: 'Age and tenure',
  geography: 'Geography',
  politics: 'Politics',
  wages: 'Wages',
  retention: 'Staying or leaving',
  loot: 'Loot',
  support: 'Support'
};

export const TRAIT_DEFINITIONS = {
  // ==================== 1. TOOLS ====================
  handy: {
    name: 'Handy',
    code: 'handy',
    category: 'tools',
    categoryLabel: 'Tools',
    isCoworkerLinked: false,
    icon: '🛠️',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
    description: 'Gives +40% output while the employee is holding a tool.'
  },
  improviser: {
    name: 'Improviser',
    code: 'improviser',
    category: 'tools',
    categoryLabel: 'Tools',
    isCoworkerLinked: false,
    icon: '👐',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Gives +25% output while the employee is holding no tool.'
  },

  // ==================== 2. COWORKERS ====================
  comic: {
    name: 'Comic',
    code: 'comic',
    category: 'coworkers',
    categoryLabel: 'Coworkers',
    isCoworkerLinked: true,
    icon: '🎭',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Gives +10 to every coworker, but the employee loses 1 for themselves.'
  },
  mentor: {
    name: 'Mentor',
    code: 'mentor',
    category: 'coworkers',
    categoryLabel: 'Coworkers',
    isCoworkerLinked: true,
    icon: '🎓',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    description: 'Gives +2 to every weaker coworker, but the employee loses 1 for themselves.'
  },
  foreman: {
    name: 'Foreman',
    code: 'foreman',
    category: 'coworkers',
    categoryLabel: 'Coworkers',
    isCoworkerLinked: true,
    icon: '📋',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    description: 'Gives +9 to every coworker.'
  },
  nationalist: {
    name: 'Nationalist',
    code: 'nationalist',
    category: 'coworkers',
    categoryLabel: 'Coworkers',
    isCoworkerLinked: true,
    icon: '🚩',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
    description: 'Gives +10 when at least half of the coworkers are from the employee’s country.'
  },
  cosmopolitan: {
    name: 'Cosmopolitan',
    code: 'cosmopolitan',
    category: 'coworkers',
    categoryLabel: 'Coworkers',
    isCoworkerLinked: true,
    icon: '🌐',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    description: 'Gives +2 for each foreign-nationality coworker, up to +4.'
  },
  loner: {
    name: 'Loner',
    code: 'loner',
    category: 'coworkers',
    categoryLabel: 'Coworkers',
    isCoworkerLinked: true,
    icon: '🚶',
    badgeClass: 'bg-stone-100 text-stone-800 border-stone-300',
    description: 'Gives +100% output and +5 when working alone.'
  },
  sociable: {
    name: 'Sociable',
    code: 'sociable',
    category: 'coworkers',
    categoryLabel: 'Coworkers',
    isCoworkerLinked: true,
    icon: '🗣️',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'Gives +25% per coworker, up to +50%, but gives -10 when working alone.'
  },
  rival: {
    name: 'Rival',
    code: 'rival',
    category: 'coworkers',
    categoryLabel: 'Coworkers',
    isCoworkerLinked: true,
    icon: '⚡',
    badgeClass: 'bg-orange-100 text-orange-900 border-orange-300',
    description: 'Gives +3 while another worker out-produces them; gives -1 when nobody out-produces them.'
  },
  primaDonna: {
    name: 'Prima Donna',
    code: 'primaDonna',
    category: 'coworkers',
    categoryLabel: 'Coworkers',
    isCoworkerLinked: true,
    icon: '👑',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    description: 'Gives +20% when paid more than every coworker; gives -10 when not. Has no effect while working alone.'
  },
  oldFriends: {
    name: 'Old Friends',
    code: 'oldFriends',
    category: 'coworkers',
    categoryLabel: 'Coworkers',
    isCoworkerLinked: true,
    icon: '👥',
    badgeClass: 'bg-teal-100 text-teal-900 border-teal-300',
    description: 'Gives +15% output when working alongside their friend.'
  },
  sweethearts: {
    name: 'Sweethearts',
    code: 'sweethearts',
    category: 'coworkers',
    categoryLabel: 'Coworkers',
    isCoworkerLinked: true,
    icon: '💖',
    badgeClass: 'bg-pink-100 text-pink-900 border-pink-300',
    description: 'Gives +20% output when working alongside their sweetheart; this trait can only come from an office romance.'
  },
  girlPower: {
    name: 'Girl Power',
    code: 'girlPower',
    category: 'coworkers',
    categoryLabel: 'Coworkers',
    isCoworkerLinked: true,
    icon: '👩‍🦰',
    badgeClass: 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300',
    description: 'Gives +15% per female coworker, up to +30%; women only.'
  },
  bandOfBrothers: {
    name: 'Band of Brothers',
    code: 'bandOfBrothers',
    category: 'coworkers',
    categoryLabel: 'Coworkers',
    isCoworkerLinked: true,
    icon: '🛡️',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    description: 'Gives +15% per male coworker, up to +30%; men only.'
  },
  xenophobe: {
    name: 'Xenophobe',
    code: 'xenophobe',
    category: 'coworkers',
    categoryLabel: 'Coworkers',
    isCoworkerLinked: true,
    icon: '⛔',
    badgeClass: 'bg-red-100 text-red-900 border-red-300',
    description: 'Gives -2 and -5 when any coworker is foreign.'
  },
  bully: {
    name: 'Bully',
    code: 'bully',
    category: 'coworkers',
    categoryLabel: 'Coworkers',
    isCoworkerLinked: true,
    icon: '👊',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
    description: 'Gives +2 to the employee, but -10 to every coworker; no effect while alone.'
  },
  envious: {
    name: 'Envious',
    code: 'envious',
    category: 'coworkers',
    categoryLabel: 'Coworkers',
    isCoworkerLinked: true,
    icon: '😒',
    badgeClass: 'bg-yellow-100 text-yellow-900 border-yellow-300',
    description: 'Gives -5 per better-paid coworker, up to -10.'
  },
  nemesis: {
    name: 'Nemesis',
    code: 'nemesis',
    category: 'coworkers',
    categoryLabel: 'Coworkers',
    isCoworkerLinked: true,
    icon: '⚔️',
    badgeClass: 'bg-red-100 text-red-900 border-red-300',
    description: 'Gives -15% output when working alongside their nemesis.'
  },
  misandrist: {
    name: 'Misandrist',
    code: 'misandrist',
    category: 'coworkers',
    categoryLabel: 'Coworkers',
    isCoworkerLinked: true,
    icon: '🚫',
    badgeClass: 'bg-pink-100 text-pink-900 border-pink-300',
    description: 'Gives -15% per male coworker, up to -30%; women only.'
  },
  misogynist: {
    name: 'Misogynist',
    code: 'misogynist',
    category: 'coworkers',
    categoryLabel: 'Coworkers',
    isCoworkerLinked: true,
    icon: '🚫',
    badgeClass: 'bg-slate-100 text-slate-900 border-slate-300',
    description: 'Gives -15% per female coworker, up to -30%; men only.'
  },

  // ==================== 3. WORK ====================
  quickStudy: {
    name: 'Quick Study',
    code: 'quickStudy',
    category: 'work',
    categoryLabel: 'Work',
    isCoworkerLinked: false,
    icon: '📖',
    badgeClass: 'bg-cyan-100 text-cyan-900 border-cyan-300',
    description: 'Doubles specialization speed.'
  },
  stockpiler: {
    name: 'Stockpiler',
    code: 'stockpiler',
    category: 'work',
    categoryLabel: 'Work',
    isCoworkerLinked: false,
    icon: '📦',
    badgeClass: 'bg-slate-100 text-slate-900 border-slate-300',
    description: 'Prevents Happiness loss when company storage is full.'
  },
  talksToMachines: {
    name: 'Talks to Machines',
    code: 'talksToMachines',
    category: 'work',
    categoryLabel: 'Work',
    isCoworkerLinked: false,
    icon: '🤖',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'Doubles automated engine output when working alone.'
  },
  specialist: {
    name: 'Specialist',
    code: 'specialist',
    category: 'work',
    categoryLabel: 'Work',
    isCoworkerLinked: false,
    icon: '🎯',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
    description: 'Gives +3 and +5 while producing the employee’s specialized good.'
  },
  craftsman: {
    name: 'Craftsman',
    code: 'craftsman',
    category: 'work',
    categoryLabel: 'Work',
    isCoworkerLinked: false,
    icon: '🔨',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Gives +3 on manufactured goods, but -1 on raw resources.'
  },
  laborer: {
    name: 'Laborer',
    code: 'laborer',
    category: 'work',
    categoryLabel: 'Work',
    isCoworkerLinked: false,
    icon: '⛏️',
    badgeClass: 'bg-stone-100 text-stone-900 border-stone-300',
    description: 'Gives +3 on raw resources, but -1 on anything manufactured.'
  },
  claustrophobe: {
    name: 'Claustrophobe',
    code: 'claustrophobe',
    category: 'work',
    categoryLabel: 'Work',
    isCoworkerLinked: false,
    icon: '🚪',
    badgeClass: 'bg-orange-100 text-orange-900 border-orange-300',
    description: 'Gives -20% output until company storage reaches level 3.'
  },

  // ==================== 4. AGE AND TENURE ====================
  veteran: {
    name: 'Veteran',
    code: 'veteran',
    category: 'ageAndTenure',
    categoryLabel: 'Age and tenure',
    isCoworkerLinked: false,
    icon: '🎖️',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Gives +20% output after 30 days at the same company.'
  },
  diamondInTheRough: {
    name: 'Diamond in the Rough',
    code: 'diamondInTheRough',
    category: 'ageAndTenure',
    categoryLabel: 'Age and tenure',
    isCoworkerLinked: false,
    icon: '💎',
    badgeClass: 'bg-teal-100 text-teal-900 border-teal-300',
    description: 'Gives +1 to one stat every 10 days at the same company, up to +4.'
  },
  lateBloomer: {
    name: 'Late Bloomer',
    code: 'lateBloomer',
    category: 'ageAndTenure',
    categoryLabel: 'Age and tenure',
    isCoworkerLinked: false,
    icon: '🌻',
    badgeClass: 'bg-lime-100 text-lime-900 border-lime-300',
    description: 'Gives +2 per 10 years past age 40, up to +6.'
  },
  earlyBloomer: {
    name: 'Early Bloomer',
    code: 'earlyBloomer',
    category: 'ageAndTenure',
    categoryLabel: 'Age and tenure',
    isCoworkerLinked: false,
    icon: '🌱',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'Gives +6 until age 40, then -2 per 10 years, reducing to nothing at age 60.'
  },
  creatureOfHabit: {
    name: 'Creature of Habit',
    code: 'creatureOfHabit',
    category: 'ageAndTenure',
    categoryLabel: 'Age and tenure',
    isCoworkerLinked: false,
    icon: '🔄',
    badgeClass: 'bg-stone-100 text-stone-800 border-stone-300',
    description: 'Gives -30% output for 3 days after being transferred to a new company.'
  },
  burnout: {
    name: 'Burnout',
    code: 'burnout',
    category: 'ageAndTenure',
    categoryLabel: 'Age and tenure',
    isCoworkerLinked: false,
    icon: '🔥',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
    description: 'Gives -1 to all stats every 20 days at the same company, up to -3.'
  },
  wornOut: {
    name: 'Worn Out',
    code: 'wornOut',
    category: 'ageAndTenure',
    categoryLabel: 'Age and tenure',
    isCoworkerLinked: false,
    icon: '⏳',
    badgeClass: 'bg-stone-100 text-stone-800 border-stone-300',
    description: 'Gives -2 per 10 years past age 50, up to -6.'
  },

  // ==================== 5. GEOGRAPHY ====================
  patriot: {
    name: 'Patriot',
    code: 'patriot',
    category: 'geography',
    categoryLabel: 'Geography',
    isCoworkerLinked: false,
    icon: '🦅',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    description: 'Gives +2 and +10 when working in a homeland core region.'
  },
  expat: {
    name: 'Expat',
    code: 'expat',
    category: 'geography',
    categoryLabel: 'Geography',
    isCoworkerLinked: false,
    icon: '✈️',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
    description: 'Gives +2 when working abroad.'
  },
  homesick: {
    name: 'Homesick',
    code: 'homesick',
    category: 'geography',
    categoryLabel: 'Geography',
    isCoworkerLinked: false,
    icon: '🏠',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Gives -2 and -10 when working abroad.'
  },

  // ==================== 6. POLITICS ====================
  statist: {
    name: 'Statist',
    code: 'statist',
    category: 'politics',
    categoryLabel: 'Politics',
    isCoworkerLinked: false,
    icon: '🏛️',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    description: 'Gives +6 when employee tax is 20% or higher.'
  },
  taxShy: {
    name: 'Tax-shy',
    code: 'taxShy',
    category: 'politics',
    categoryLabel: 'Politics',
    isCoworkerLinked: false,
    icon: '💸',
    badgeClass: 'bg-red-100 text-red-900 border-red-300',
    description: 'Gives -1% per 1% employee tax, up to -30%.'
  },

  // ==================== 7. WAGES ====================
  modest: {
    name: 'Modest',
    code: 'modest',
    category: 'wages',
    categoryLabel: 'Wages',
    isCoworkerLinked: false,
    icon: '🪙',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'Expects 15% less pay than the market rate.'
  },
  greedy: {
    name: 'Greedy',
    code: 'greedy',
    category: 'wages',
    categoryLabel: 'Wages',
    isCoworkerLinked: false,
    icon: '💰',
    badgeClass: 'bg-yellow-100 text-yellow-900 border-yellow-300',
    description: 'Expects 20% more pay than the market rate.'
  },
  climber: {
    name: 'Climber',
    code: 'climber',
    category: 'wages',
    categoryLabel: 'Wages',
    isCoworkerLinked: false,
    icon: '🧗',
    badgeClass: 'bg-orange-100 text-orange-900 border-orange-300',
    description: 'Expects 2% more pay for every week hired.'
  },

  // ==================== 8. RETENTION / STAYING OR LEAVING ====================
  loyal: {
    name: 'Loyal',
    code: 'loyal',
    category: 'retention',
    categoryLabel: 'Staying or leaving',
    isCoworkerLinked: false,
    icon: '🤝',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    description: 'Halves Happiness losses.'
  },
  anchor: {
    name: 'Anchor',
    code: 'anchor',
    category: 'retention',
    categoryLabel: 'Staying or leaving',
    isCoworkerLinked: false,
    icon: '⚓',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
    description: 'Never quits, but gives -50% output below 30 Happiness.'
  },
  flightRisk: {
    name: 'Flight Risk',
    code: 'flightRisk',
    category: 'retention',
    categoryLabel: 'Staying or leaving',
    isCoworkerLinked: false,
    icon: '💨',
    badgeClass: 'bg-red-100 text-red-900 border-red-300',
    description: 'Quits below 50 Happiness instead of the normal 30.'
  },

  // ==================== 9. LOOT ====================
  salvager: {
    name: 'Salvager',
    code: 'salvager',
    category: 'loot',
    categoryLabel: 'Loot',
    isCoworkerLinked: false,
    icon: '🧰',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Still finds toolboxes even when company storage is full.'
  },
  luckyCharm: {
    name: 'Lucky Charm',
    code: 'luckyCharm',
    category: 'loot',
    categoryLabel: 'Loot',
    isCoworkerLinked: true,
    icon: '🧲',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'Gives +3 to every coworker. It is assigned at 00:00 UTC to whoever works beside them at that time, and the buff lasts until the next reset even if workers change company.'
  },
  scavenger: {
    name: 'Scavenger',
    code: 'scavenger',
    category: 'loot',
    categoryLabel: 'Loot',
    isCoworkerLinked: false,
    icon: '🔍',
    badgeClass: 'bg-stone-100 text-stone-800 border-stone-300',
    description: 'Doubles toolbox chance, but gives -25% output.'
  },
  gambler: {
    name: 'Gambler',
    code: 'gambler',
    category: 'loot',
    categoryLabel: 'Loot',
    isCoworkerLinked: false,
    icon: '🎲',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    description: 'Gives +3 output, but -15%; critical event outcomes, whether good or bad, happen twice as often.'
  },
  jinx: {
    name: 'Jinx',
    code: 'jinx',
    category: 'loot',
    categoryLabel: 'Loot',
    isCoworkerLinked: true,
    icon: '🐈‍⬛',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    description: 'Gives -2 to every coworker.'
  },

  // ==================== 10. SUPPORT ====================
  recruiter: {
    name: 'Recruiter',
    code: 'recruiter',
    category: 'support',
    categoryLabel: 'Support',
    isCoworkerLinked: false,
    icon: '📢',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    description: 'Adds +1 candidate to every company’s daily recruitment shortlist.'
  },
  trainer: {
    name: 'Trainer',
    code: 'trainer',
    category: 'support',
    categoryLabel: 'Support',
    isCoworkerLinked: true,
    icon: '🏋️',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'Gives coworkers 2 extra training sessions per day, shared between them; refills at 00:00 UTC.'
  }
};

// Aliases mapping common case variations from raw backend payloads to canonical keys
export const TRAIT_ALIASES = {
  'prima-donna': 'primaDonna',
  'prima_donna': 'primaDonna',
  'old-friends': 'oldFriends',
  'old_friends': 'oldFriends',
  'girl-power': 'girlPower',
  'girl_power': 'girlPower',
  'band-of-brothers': 'bandOfBrothers',
  'band_of_brothers': 'bandOfBrothers',
  'quick-study': 'quickStudy',
  'quick_study': 'quickStudy',
  'talks-to-machines': 'talksToMachines',
  'talks_to_machines': 'talksToMachines',
  'diamond-in-the-rough': 'diamondInTheRough',
  'diamond_in_the_rough': 'diamondInTheRough',
  'late-bloomer': 'lateBloomer',
  'late_bloomer': 'lateBloomer',
  'early-bloomer': 'earlyBloomer',
  'early_bloomer': 'earlyBloomer',
  'creature-of-habit': 'creatureOfHabit',
  'creature_of_habit': 'creatureOfHabit',
  'worn-out': 'wornOut',
  'worn_out': 'wornOut',
  'tax-shy': 'taxShy',
  'tax_shy': 'taxShy',
  'flight-risk': 'flightRisk',
  'flight_risk': 'flightRisk',
  'lucky-charm': 'luckyCharm',
  'lucky_charm': 'luckyCharm'
};

/**
 * Normalizes any trait code from string or object to canonical definition.
 */
export function getTraitInfo(traitInput) {
  if (!traitInput) {
    return {
      name: 'Unknown',
      code: 'unknown',
      category: 'general',
      categoryLabel: 'General',
      isCoworkerLinked: false,
      icon: '★',
      badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
      description: 'Standard employee trait.'
    };
  }

  const rawCode = typeof traitInput === 'string' ? traitInput : (traitInput.code || 'unknown');
  const canonicalCode = TRAIT_ALIASES[rawCode] || TRAIT_ALIASES[rawCode.toLowerCase()] || rawCode;

  if (TRAIT_DEFINITIONS[canonicalCode]) {
    return TRAIT_DEFINITIONS[canonicalCode];
  }

  // Convert snake/kebab to camelCase attempt
  const camelCode = canonicalCode.replace(/[-_]([a-z])/g, (_, g) => g.toUpperCase());
  if (TRAIT_DEFINITIONS[camelCode]) {
    return TRAIT_DEFINITIONS[camelCode];
  }

  // Fallback for uncatalogued or custom trait
  const prettyName = canonicalCode
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .trim()
    .replace(/^./, str => str.toUpperCase());

  return {
    name: prettyName,
    code: canonicalCode,
    category: 'general',
    categoryLabel: 'General',
    isCoworkerLinked: false,
    icon: '★',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    description: `Special employee trait: ${prettyName}`
  };
}
