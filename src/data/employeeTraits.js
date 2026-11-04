// WarEra v0.27+ Employee Trait Definitions & Metadata
// Exhaustive catalog of traits, category flags, coworker link types, and gameplay effects

export const TRAIT_DEFINITIONS = {
  anchor: {
    name: 'Anchor',
    code: 'anchor',
    category: 'morale',
    isCoworkerLinked: false,
    icon: '⚓',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    description: 'Steadies the workforce under pressure, mitigating happiness losses during hardships.'
  },
  luckyCharm: {
    name: 'Lucky Charm',
    code: 'luckyCharm',
    category: 'synergy',
    isCoworkerLinked: true,
    linkType: 'team_buff',
    icon: '🧲',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'Bestows good fortune, boosting luck for self and colleagues in the same facility.'
  },
  cosmopolitan: {
    name: 'Cosmopolitan',
    code: 'cosmopolitan',
    category: 'production',
    isCoworkerLinked: false,
    icon: '🌐',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    description: 'Thrives in international environments (+4 Production when working abroad).'
  },
  craftsman: {
    name: 'Craftsman',
    code: 'craftsman',
    category: 'production',
    isCoworkerLinked: false,
    icon: '🔨',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Master artisan; provides a dedicated production bonus to manufactured recipes.'
  },
  stockpiler: {
    name: 'Stockpiler',
    code: 'stockpiler',
    category: 'facility',
    isCoworkerLinked: false,
    icon: '📦',
    badgeClass: 'bg-slate-100 text-slate-900 border-slate-300',
    description: 'Optimizes logistics and warehouse buffering for the facility.'
  },
  loner: {
    name: 'Loner',
    code: 'loner',
    category: 'morale',
    isCoworkerLinked: true,
    linkType: 'solo_preference',
    icon: '🚶',
    badgeClass: 'bg-stone-100 text-stone-800 border-stone-300',
    description: 'Works best in quiet spaces. Suffers morale penalties when assigned with multiple coworkers.'
  },
  diamondInTheRough: {
    name: 'Diamond in the Rough',
    code: 'diamondInTheRough',
    category: 'growth',
    isCoworkerLinked: false,
    icon: '💎',
    badgeClass: 'bg-teal-100 text-teal-900 border-teal-300',
    description: 'Unpolished gem with elevated growth potential and superior training gains.'
  },
  gambler: {
    name: 'Gambler',
    code: 'gambler',
    category: 'luck',
    isCoworkerLinked: false,
    icon: '🎲',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    description: 'Takes high-variance risks; occasionally triggers massive bonus production yields.'
  },
  specialist: {
    name: 'Specialist',
    code: 'specialist',
    category: 'production',
    isCoworkerLinked: false,
    icon: '🎯',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
    description: 'Dedicated focus on specialized commodity; earns extra production when producing their focus good.'
  },
  salvager: {
    name: 'Salvager',
    code: 'salvager',
    category: 'production',
    isCoworkerLinked: false,
    icon: '🧲',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Recovers scrap raw materials and tools during active manufacturing cycles.'
  },
  rival: {
    name: 'Rival',
    code: 'rival',
    category: 'synergy',
    isCoworkerLinked: true,
    linkType: 'rivalry',
    icon: '⚔️',
    badgeClass: 'bg-red-100 text-red-900 border-red-300',
    description: 'Fiercely competitive with coworkers in the company (+3 Production from rivalry competition).'
  },
  handy: {
    name: 'Handy',
    code: 'handy',
    category: 'tool',
    isCoworkerLinked: false,
    icon: '🔧',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
    description: 'Maintains equipment meticulously; reduces tool wear and extends durability.'
  },
  comic: {
    name: 'Comic',
    code: 'comic',
    category: 'morale',
    isCoworkerLinked: true,
    linkType: 'team_buff',
    icon: '🎭',
    badgeClass: 'bg-yellow-100 text-yellow-900 border-yellow-300',
    description: 'Brings laughter to the workshop (+5 Happiness bonus to all coworkers in the facility).'
  },
  homesick: {
    name: 'Homesick',
    code: 'homesick',
    category: 'morale',
    isCoworkerLinked: false,
    icon: '🏠',
    badgeClass: 'bg-orange-100 text-orange-900 border-orange-300',
    description: 'Longs for homeland; experiences happiness penalties when assigned abroad.'
  },
  quickStudy: {
    name: 'Quick Study',
    code: 'quickStudy',
    category: 'growth',
    isCoworkerLinked: false,
    icon: '📖',
    badgeClass: 'bg-cyan-100 text-cyan-900 border-cyan-300',
    description: 'Fast learner; absorbs training lessons with higher success rates.'
  },
  taxShy: {
    name: 'Tax Shy',
    code: 'taxShy',
    category: 'tax',
    isCoworkerLinked: false,
    icon: '💸',
    badgeClass: 'bg-red-100 text-red-900 border-red-300',
    description: 'Resents income taxes; experiences steep happiness deductions in high-tax regions.'
  },
  primaDonna: {
    name: 'Prima Donna',
    code: 'primaDonna',
    category: 'wage',
    isCoworkerLinked: false,
    icon: '👑',
    badgeClass: 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300',
    description: 'High-demand talent with strict wage expectations; requires top compensation to stay motivated.'
  },
  laborer: {
    name: 'Laborer',
    code: 'laborer',
    category: 'production',
    isCoworkerLinked: false,
    icon: '⛏️',
    badgeClass: 'bg-stone-100 text-stone-900 border-stone-300',
    description: 'Hardened physical worker; reliable base production output day in and day out.'
  },
  recruiter: {
    name: 'Recruiter',
    code: 'recruiter',
    category: 'facility',
    isCoworkerLinked: false,
    icon: '📢',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'Charismatic networker; attracts skilled applicants to company openings.'
  },
  earlyBloomer: {
    name: 'Early Bloomer',
    code: 'earlyBloomer',
    category: 'growth',
    isCoworkerLinked: false,
    icon: '🌱',
    badgeClass: 'bg-lime-100 text-lime-900 border-lime-300',
    description: 'Reaches high productivity early in career with rapid initial stat development.'
  },
  climber: {
    name: 'Climber',
    code: 'climber',
    category: 'morale',
    isCoworkerLinked: false,
    icon: '🧗',
    badgeClass: 'bg-violet-100 text-violet-900 border-violet-300',
    description: 'Ambitious ladder climber; thrives when assigned to high-tier enterprise companies.'
  },
  expat: {
    name: 'Expat',
    code: 'expat',
    category: 'production',
    isCoworkerLinked: false,
    icon: '✈️',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
    description: 'Seasoned traveler; completely immune to foreign territory happiness penalties.'
  },
  nationalist: {
    name: 'Nationalist',
    code: 'nationalist',
    category: 'morale',
    isCoworkerLinked: false,
    icon: '🚩',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    description: 'Proud patriot; +5 Happiness when working in native homeland, -10 penalty abroad.'
  },
  lateBloomer: {
    name: 'Late Bloomer',
    code: 'lateBloomer',
    category: 'growth',
    isCoworkerLinked: false,
    icon: '🌳',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'Gains maximum productivity and training efficiency at mature age.'
  },
  patriot: {
    name: 'Patriot',
    code: 'patriot',
    category: 'production',
    isCoworkerLinked: false,
    icon: '🎖️',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    description: 'Deeply loyal to country; earns production bonuses when stationed in core regions.'
  },
  girlPower: {
    name: 'Girl Power',
    code: 'girlPower',
    category: 'synergy',
    isCoworkerLinked: true,
    linkType: 'team_buff',
    icon: '🌸',
    badgeClass: 'bg-pink-100 text-pink-900 border-pink-300',
    description: 'Empowering synergy; boosts production when working alongside other female employees.'
  },
  statist: {
    name: 'Statist',
    code: 'statist',
    category: 'morale',
    isCoworkerLinked: false,
    icon: '🏛️',
    badgeClass: 'bg-slate-100 text-slate-900 border-slate-300',
    description: 'Favors powerful central nations; gains morale bonuses in high-ranking countries.'
  },
  mentor: {
    name: 'Mentor',
    code: 'mentor',
    category: 'synergy',
    isCoworkerLinked: true,
    linkType: 'team_buff',
    icon: '🎓',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Master teacher; accelerates stat gains and training efficiency for coworkers.'
  },
  burnout: {
    name: 'Burnout',
    code: 'burnout',
    category: 'morale',
    isCoworkerLinked: false,
    icon: '🔥',
    badgeClass: 'bg-red-100 text-red-900 border-red-300',
    description: 'Exhausted by excessive labor; experiences performance dips under high strain.'
  },
  misogynist: {
    name: 'Misogynist',
    code: 'misogynist',
    category: 'morale',
    isCoworkerLinked: true,
    linkType: 'friction',
    icon: '⚠️',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
    description: 'Creates friction and morale penalties when placed with female colleagues.'
  },
  veteran: {
    name: 'Veteran',
    code: 'veteran',
    category: 'morale',
    isCoworkerLinked: false,
    icon: '🎖️',
    badgeClass: 'bg-slate-100 text-slate-900 border-slate-300',
    description: 'Battle-tested resilience; possesses high base responsibility and steady discipline.'
  },
  sociable: {
    name: 'Sociable',
    code: 'sociable',
    category: 'synergy',
    isCoworkerLinked: true,
    linkType: 'team_buff',
    icon: '🤝',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'Thrives in collaborative teams; gains +Production when facility is fully staffed.'
  },
  envious: {
    name: 'Envious',
    code: 'envious',
    category: 'morale',
    isCoworkerLinked: true,
    linkType: 'friction',
    icon: '👀',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    description: 'Covetous nature; loses happiness if a colleague earns a higher wage.'
  },
  improviser: {
    name: 'Improviser',
    code: 'improviser',
    category: 'production',
    isCoworkerLinked: false,
    icon: '💡',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Ingenious worker; maintains consistent output even when unequipped with tools.'
  },
  wornOut: {
    name: 'Worn Out',
    code: 'wornOut',
    category: 'morale',
    isCoworkerLinked: false,
    icon: '⏳',
    badgeClass: 'bg-stone-100 text-stone-800 border-stone-300',
    description: 'Physical toll of long service; gradual stamina decline in later career years.'
  },
  loyal: {
    name: 'Loyal',
    code: 'loyal',
    category: 'morale',
    isCoworkerLinked: false,
    icon: '🛡️',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'Fiercely devoted; negligible quit chance and high workplace fidelity.'
  },
  foreman: {
    name: 'Foreman',
    code: 'foreman',
    category: 'synergy',
    isCoworkerLinked: true,
    linkType: 'team_buff',
    icon: '👷',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Oversees shop floor operations; boosts output for all coworkers in the facility.'
  },
  manHater: {
    name: 'Man Hater',
    code: 'manHater',
    category: 'morale',
    isCoworkerLinked: true,
    linkType: 'friction',
    icon: '⚠️',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
    description: 'Creates friction when assigned alongside male coworkers.'
  },
  greedy: {
    name: 'Greedy',
    code: 'greedy',
    category: 'wage',
    isCoworkerLinked: false,
    icon: '💰',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Motivated by money; productivity scales directly with salary payout.'
  },
  modest: {
    name: 'Modest',
    code: 'modest',
    category: 'wage',
    isCoworkerLinked: false,
    icon: '🌾',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    description: 'Humble requirements; content with baseline wages and minimal expectations.'
  },
  claustrophobe: {
    name: 'Claustrophobe',
    code: 'claustrophobe',
    category: 'facility',
    isCoworkerLinked: false,
    icon: '🚪',
    badgeClass: 'bg-stone-100 text-stone-800 border-stone-300',
    description: 'Dislikes confined quarters; unhappy in low-level break rooms.'
  },
  trainer: {
    name: 'Trainer',
    code: 'trainer',
    category: 'synergy',
    isCoworkerLinked: true,
    linkType: 'team_buff',
    icon: '🏋️',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    description: 'Athletic coach; aids coworkers in achieving optimal results during training sessions.'
  },
  bandOfBrothers: {
    name: 'Band of Brothers',
    code: 'bandOfBrothers',
    category: 'synergy',
    isCoworkerLinked: true,
    linkType: 'team_buff',
    icon: '🛡️',
    badgeClass: 'bg-slate-100 text-slate-900 border-slate-300',
    description: 'Brotherhood bond; powerful mutual synergy when stationed with fellow veterans.'
  },
  oldFriends: {
    name: 'Old Friends',
    code: 'oldFriends',
    category: 'synergy',
    isCoworkerLinked: true,
    linkType: 'team_buff',
    icon: '👥',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'Lifelong companions; substantial happiness bonus when working with familiar peers.'
  },
  jinx: {
    name: 'Jinx',
    code: 'jinx',
    category: 'luck',
    isCoworkerLinked: true,
    linkType: 'friction',
    icon: '🐈‍⬛',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    description: 'Unfortunate aura; slightly reduces luck stat for colleagues in the same facility.'
  },
  scavenger: {
    name: 'Scavenger',
    code: 'scavenger',
    category: 'production',
    isCoworkerLinked: false,
    icon: '🔍',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Resourceful discoverer; occasionally discovers surplus materials.'
  },
  bully: {
    name: 'Bully',
    code: 'bully',
    category: 'morale',
    isCoworkerLinked: true,
    linkType: 'friction',
    icon: '👊',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
    description: 'Hostile temperament; lowers the happiness of coworkers in the facility.'
  },
  xenophobe: {
    name: 'Xenophobe',
    code: 'xenophobe',
    category: 'morale',
    isCoworkerLinked: true,
    linkType: 'friction',
    icon: '⛔',
    badgeClass: 'bg-red-100 text-red-900 border-red-300',
    description: 'Distrusts foreign nationals; incurs morale penalty when assigned with foreign colleagues.'
  },
  flightRisk: {
    name: 'Flight Risk',
    code: 'flightRisk',
    category: 'morale',
    isCoworkerLinked: false,
    icon: '💨',
    badgeClass: 'bg-red-100 text-red-900 border-red-300',
    description: 'Impatient; significantly higher chance to abandon the company if happiness dips.'
  },
  creatureOfHabit: {
    name: 'Creature of Habit',
    code: 'creatureOfHabit',
    category: 'morale',
    isCoworkerLinked: false,
    icon: '🔄',
    badgeClass: 'bg-stone-100 text-stone-800 border-stone-300',
    description: 'Dislikes abrupt changes; suffers temporary morale drops after being reassigned.'
  }
};

export function getTraitInfo(traitCode) {
  const code = typeof traitCode === 'string' ? traitCode : (traitCode?.code || 'unknown');
  return TRAIT_DEFINITIONS[code] || {
    name: code.charAt(0).toUpperCase() + code.slice(1),
    code,
    category: 'general',
    isCoworkerLinked: false,
    icon: '★',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    description: `Special employee trait: ${code}`
  };
}
