import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Minus,
  Trash2, 
  RotateCcw, 
  RotateCw,
  MapPin, 
  Clock, 
  ShieldCheck, 
  AlertTriangle,
  Users,
  GitBranch,
  CheckCircle2,
  DollarSign,
  Briefcase,
  Layers,
  ArrowRight,
  User,
  Search,
  Loader2,
  X,
  Sparkles,
  Filter,
  Check,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  ArrowLeft,
  Zap,
  TrendingUp,
  Target,
  ArrowRightLeft
} from 'lucide-react';
import { RECIPES, ENGINE_UPGRADE_TIERS, STORAGE_UPGRADE_TIERS, getBreakRoomCapacity } from '../data/gameData';
import { api } from '../services/wareraApi';
import { calculatePortfolioOverview, mapCompanyFromDossier } from '../data/marketMath';
import { getTraitInfo } from '../data/employeeTraits';
import ItemIcon from './ItemIcon';
import StockExchangeListing from './StockExchangeListing';
import EmployeeFifaCard, { EmployeeFifaCardMini, EmployeeProductionBreakdown } from './EmployeeFifaCard';

// Reusable tactile Gold Coin icon
export function GoldCoin({ size = 15, className = '' }) {
  return (
    <span className={`inline-flex items-center justify-center shrink-0 align-middle ${className}`} title="BTC">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
        <circle cx="12" cy="12" r="10" fill="url(#goldGrad)" stroke="#b45309" strokeWidth="1.2" />
        <circle cx="12" cy="12" r="7.5" stroke="#fef3c7" strokeWidth="0.8" opacity="0.8" />
        <text x="12" y="15.5" textAnchor="middle" fontSize="10" fontWeight="900" fill="#78350f" fontFamily="sans-serif">₿</text>
        <defs>
          <linearGradient id="goldGrad" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fef08a" />
            <stop offset="0.45" stopColor="#f59e0b" />
            <stop offset="1" stopColor="#d97706" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}

// Country flag emoji resolver from 2-letter ISO code
export function getCountryFlag(code) {
  if (!code || typeof code !== 'string') return '🌐';
  const clean = code.trim().toUpperCase();
  if (clean.length !== 2) return '🌐';
  try {
    return clean.replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
  } catch {
    return '🌐';
  }
}

// In-game Item Classification Theme resolver (FIFA Card Color Palette)
// Purple: fish, heavyAmmo, cookedFish
// Green: ammo, bread, steel, concrete, paper, oil, petroleum
// Blue: lightAmmo, uncookedFish
// Grey: wood, coca, mysteriousPlant, limestone, grain, lead, iron, scraps
// Gold: pill, cocain
export function getItemClassificationTheme(itemCode = '') {
  const code = (itemCode || '').toLowerCase();

  // Gold Tier: pills / cocain
  if (['pill', 'cocain'].includes(code)) {
    return {
      type: 'gold',
      label: 'Gold Tier',
      cardBg: 'from-amber-950/80 via-yellow-950/60 to-slate-950',
      cardBorder: 'border-amber-400/50 shadow-[0_0_25px_rgba(245,158,11,0.3)]',
      headerGrad: 'from-amber-400 via-yellow-300 to-amber-500',
      accentText: 'text-amber-300',
      ratingBg: 'bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950',
      ringColor: 'ring-amber-400/60',
      pillBg: 'border-amber-400/40 bg-amber-400/10 text-amber-200'
    };
  }

  // Purple Tier: heavyAmmo, cookedFish, fish
  if (['heavyammo', 'cookedfish', 'fish'].includes(code)) {
    return {
      type: 'purple',
      label: 'Epic Purple',
      cardBg: 'from-purple-950/80 via-fuchsia-950/60 to-slate-950',
      cardBorder: 'border-purple-400/50 shadow-[0_0_25px_rgba(168,85,247,0.3)]',
      headerGrad: 'from-purple-400 via-fuchsia-300 to-purple-500',
      accentText: 'text-purple-300',
      ratingBg: 'bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white',
      ringColor: 'ring-purple-400/60',
      pillBg: 'border-purple-400/40 bg-purple-400/10 text-purple-200'
    };
  }

  // Blue Tier: lightAmmo, uncookedFish
  if (['lightammo', 'uncookedfish'].includes(code)) {
    return {
      type: 'blue',
      label: 'Rare Blue',
      cardBg: 'from-blue-950/80 via-cyan-950/60 to-slate-950',
      cardBorder: 'border-blue-400/50 shadow-[0_0_25px_rgba(59,130,246,0.3)]',
      headerGrad: 'from-blue-400 via-cyan-300 to-blue-500',
      accentText: 'text-blue-300',
      ratingBg: 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white',
      ringColor: 'ring-blue-400/60',
      pillBg: 'border-blue-400/40 bg-blue-400/10 text-blue-200'
    };
  }

  // Green Tier: ammo, bread, steel, concrete, paper, oil, petroleum
  if (['ammo', 'bread', 'steel', 'concrete', 'paper', 'oil', 'petroleum'].includes(code)) {
    return {
      type: 'green',
      label: 'Industrial Green',
      cardBg: 'from-emerald-950/80 via-teal-950/60 to-slate-950',
      cardBorder: 'border-emerald-400/50 shadow-[0_0_25px_rgba(16,185,129,0.3)]',
      headerGrad: 'from-emerald-400 via-teal-300 to-green-500',
      accentText: 'text-emerald-300',
      ratingBg: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white',
      ringColor: 'ring-emerald-400/60',
      pillBg: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
    };
  }

  // Natural Grey Tier: wood, coca, mysteriousPlant, limestone, grain, lead, iron, scraps
  return {
    type: 'grey',
    label: 'Standard Grey',
    cardBg: 'from-slate-900/90 via-slate-800/70 to-slate-950',
    cardBorder: 'border-slate-500/50 shadow-[0_0_20px_rgba(148,163,184,0.2)]',
    headerGrad: 'from-slate-300 via-slate-200 to-slate-400',
    accentText: 'text-slate-300',
    ratingBg: 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-950',
    ringColor: 'ring-slate-400/60',
    pillBg: 'border-slate-500/40 bg-slate-500/10 text-slate-300'
  };
}

// Sleek modern avatar silhouette for employees
export function WorkerSilhouette({ gender = 'male', className = 'w-20 h-20' }) {
  const isFemale = gender === 'female';
  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-full ${className}`}>
      <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
        <defs>
          <radialGradient id="silhouetteGlow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.25" />
            <stop offset="70%" stopColor="#64748b" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="avatarHead" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <linearGradient id="avatarShoulders" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#silhouetteGlow)" />
        {isFemale ? (
          <g transform="translate(0, 4)">
            <ellipse cx="50" cy="38" rx="16" ry="19" fill="url(#avatarHead)" />
            <path d="M32 38 C32 20, 68 20, 68 38 C68 45, 66 54, 62 58 C60 52, 58 48, 56 46 C44 46, 40 52, 38 58 C34 54, 32 45, 32 38 Z" fill="#64748b" opacity="0.35" />
            <path d="M22 84 C22 66, 34 58, 50 58 C66 58, 78 66, 78 84 Z" fill="url(#avatarShoulders)" />
          </g>
        ) : (
          <g transform="translate(0, 4)">
            <ellipse cx="50" cy="36" rx="17" ry="19" fill="url(#avatarHead)" />
            <path d="M20 84 C20 64, 32 56, 50 56 C68 56, 80 64, 80 84 Z" fill="url(#avatarShoulders)" />
          </g>
        )}
      </svg>
    </div>
  );
}

// Default companies for demo mode (no dossier connected)
const DEFAULT_COMPANIES = [
  {
    id: 'c1',
    name: 'Vanguard Munitions Plant',
    itemCode: 'heavyAmmo',
    engineLevel: 4,
    storageLevel: 3,
    breakRoomLevel: 3,
    maxEmployees: 3,
    production: 180.0,
    concreteInvested: 250,
    regionName: 'Ecuadorian Sierra',
    countryCode: 'EC',
    hasDepositBonus: false,
    countryBonusPct: 10.0,
    ethicBonusPct: 30.0,
    totalBonusPct: 40.0,
    estimatedValue: 1850,
    employees: [
      {
        id: 'emp-demo-1',
        name: 'Haoxuan Qi',
        gender: 'male',
        age: 28,
        countryCode: 'EC',
        nationality: 'EC',
        baseProduction: 3,
        trainedProduction: 4,
        luck: 3,
        responsibility: 2,
        potential: 6,
        potentialMax: 8,
        happiness: 58,
        hourlyWage: 0.0627,
        dailyWage: 1.505,
        hourlyOutputPp: 2.49,
        dailyOutputPp: 59.76,
        dailyProductionValue: 3.585,
        dailyProfit: 2.08,
        traits: [
          { code: 'anchor' },
          { code: 'luckyCharm' },
          { code: 'cosmopolitan' }
        ],
        toolItem: {
          code: 'hammer3',
          skills: { production: 16 },
          state: 91.6,
          maxState: 100
        },
        toolStatus: {
          rolledPercent: 16,
          isUsable: true,
          bonusPercent: 16
        },
        productionBonus: {
          total: 43,
          contributions: [
            { source: 'management', percent: 16 },
            { source: 'coreRegion', percent: 5 },
            { source: 'happiness', percent: 2 },
            { source: 'tool', percent: 16 },
            { source: 'specialization', percent: 4 }
          ]
        },
        breakdown: {
          production: {
            base: 3,
            trained: 4,
            contributions: [
              { code: 'cosmopolitan', delta: 4 },
              { code: 'tool', delta: 16, percent: true }
            ],
            total: 7
          },
          luck: {
            base: 3,
            trained: 0,
            contributions: [{ code: 'luckyCharm', delta: 3 }],
            total: 3
          },
          responsibility: {
            base: 1,
            trained: 1,
            contributions: [],
            total: 2
          }
        },
        happinessBreakdown: {
          base: 50,
          contributions: [
            { reason: 'responsibility', delta: 6 },
            { reason: 'incomeTax', delta: -4 },
            { reason: 'event', delta: 6 }
          ],
          value: 58,
          quitChance: 0
        }
      },
      {
        id: 'emp-demo-2',
        name: 'Beatriz Trejo Reyna',
        gender: 'female',
        age: 38,
        countryCode: 'ES',
        nationality: 'ES',
        baseProduction: 4,
        trainedProduction: 4,
        luck: 4,
        responsibility: 2,
        potential: 4,
        potentialMax: 4,
        happiness: 52,
        hourlyWage: 0.1516,
        dailyWage: 3.64,
        hourlyOutputPp: 2.86,
        dailyOutputPp: 68.64,
        dailyProductionValue: 4.118,
        dailyProfit: 0.478,
        traits: [
          { code: 'diamondInTheRough' }
        ],
        toolItem: {
          code: 'drill4',
          skills: { production: 20 },
          state: 84.0,
          maxState: 100
        },
        toolStatus: {
          rolledPercent: 20,
          isUsable: true,
          bonusPercent: 20
        },
        productionBonus: {
          total: 47,
          contributions: [
            { source: 'management', percent: 16 },
            { source: 'coreRegion', percent: 5 },
            { source: 'tool', percent: 20 },
            { source: 'specialization', percent: 6 }
          ]
        },
        breakdown: {
          production: {
            base: 4,
            trained: 4,
            contributions: [
              { code: 'tool', delta: 20, percent: true }
            ],
            total: 8
          },
          luck: {
            base: 1,
            trained: 0,
            contributions: [{ code: 'luckyCharm', delta: 3 }],
            total: 4
          },
          responsibility: {
            base: 2,
            trained: 0,
            contributions: [],
            total: 2
          }
        },
        happinessBreakdown: {
          base: 50,
          contributions: [
            { reason: 'responsibility', delta: 6 },
            { reason: 'incomeTax', delta: -4 }
          ],
          value: 52,
          quitChance: 0
        }
      }
    ],
    manager: {
      id: 'mgr-demo-1',
      userId: 'user-valentin',
      username: 'Valentin (General Manager)',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      managementLevel: 8,
      hourlyWage: 0.05,
      dailyWage: 1.20,
      productionBonusPercent: 16,
      countryCode: 'EC'
    },
    hasManager: true,
    workers: [],
    isSelfWorking: false
  },
  {
    id: 'c2',
    name: 'Red River Lead Extract',
    itemCode: 'lead',
    engineLevel: 3,
    storageLevel: 3,
    breakRoomLevel: 2,
    maxEmployees: 2,
    production: 220.0,
    concreteInvested: 180,
    regionName: 'Ecuadorian Sierra',
    countryCode: 'EC',
    hasDepositBonus: false,
    countryBonusPct: 21.0,
    ethicBonusPct: 30.0,
    totalBonusPct: 51.0,
    estimatedValue: 1150,
    employees: [
      {
        id: 'emp-demo-3',
        name: 'Mateo Silva',
        gender: 'male',
        age: 32,
        countryCode: 'EC',
        nationality: 'EC',
        baseProduction: 5,
        trainedProduction: 2,
        luck: 2,
        responsibility: 3,
        potential: 5,
        potentialMax: 7,
        happiness: 65,
        hourlyWage: 0.08,
        dailyWage: 1.92,
        hourlyOutputPp: 3.1,
        dailyOutputPp: 74.4,
        dailyProductionValue: 4.46,
        dailyProfit: 2.54,
        traits: [
          { code: 'bandOfBrothers' },
          { code: 'foreman' }
        ],
        toolItem: {
          code: 'wrench2',
          skills: { production: 12 },
          state: 95.0,
          maxState: 100
        },
        toolStatus: {
          rolledPercent: 12,
          isUsable: true,
          bonusPercent: 12
        },
        breakdown: {
          production: { base: 5, trained: 2, total: 7 },
          luck: { base: 2, trained: 0, total: 2 },
          responsibility: { base: 3, trained: 0, total: 3 }
        }
      }
    ],
    workers: [],
    isSelfWorking: false
  },
  {
    id: 'c3',
    name: 'Stall 1',
    itemCode: 'steel',
    engineLevel: 5,
    storageLevel: 6,
    breakRoomLevel: 3,
    maxEmployees: 3,
    production: 965.0,
    concreteInvested: 200,
    regionName: 'Madrid',
    countryCode: 'ES',
    mainCity: 'Madrid',
    hasDepositBonus: false,
    countryBonusPct: 0,
    ethicBonusPct: 0,
    totalBonusPct: 0,
    estimatedValue: 1528,
    employees: [
      {
        id: 'emp-demo-4',
        name: 'Elena Gomez',
        gender: 'female',
        age: 26,
        countryCode: 'ES',
        nationality: 'ES',
        baseProduction: 6,
        trainedProduction: 3,
        luck: 3,
        responsibility: 2,
        potential: 4,
        potentialMax: 6,
        happiness: 70,
        hourlyWage: 0.09,
        dailyWage: 2.16,
        hourlyOutputPp: 3.5,
        dailyOutputPp: 84.0,
        dailyProductionValue: 5.04,
        dailyProfit: 2.88,
        traits: [
          { code: 'girlPower' },
          { code: 'cosmopolitan' }
        ],
        toolItem: {
          code: 'hammer2',
          skills: { production: 10 },
          state: 88.0,
          maxState: 100
        },
        toolStatus: {
          rolledPercent: 10,
          isUsable: true,
          bonusPercent: 10
        },
        breakdown: {
          production: { base: 6, trained: 3, total: 9 },
          luck: { base: 3, trained: 0, total: 3 },
          responsibility: { base: 2, trained: 0, total: 2 }
        }
      }
    ],
    workers: [],
    isSelfWorking: false
  },
];

// Maps raw WarEra API company documents into reactive portfolio state (v0.27+)
export { mapCompanyFromDossier };

export default function CompanyPortfolio({ 
  dossier, 
  prices = {}, 
  onOpenSyncModal,
  onRefreshPrices,
  onUpdateDossier,
  onNavigateToTerminal
}) {
  const user = dossier?.user;
  const userCompanies = dossier?.companies || [];

  // Active selected company ID - initialized to real company if present
  const [selectedCompanyId, setSelectedCompanyId] = useState(() => {
    return userCompanies?.[0]?._id || userCompanies?.[0]?.id || 'c1';
  });

  // Insource toggle overrides: { [`${companyId}_${rawItemCode}`]: boolean }
  const [insourceOverrides, setInsourceOverrides] = useState({});

  // Portfolio View Mode: 'listing' (Stock Exchange homepage) | 'details' (Company deep-dive)
  const [viewMode, setViewMode] = useState('listing');

  // Live 24h market price movements for accurate valuation growth
  const [priceChanges24h, setPriceChanges24h] = useState({});


  useEffect(() => {
    let isMounted = true;
    const itemCodes = RECIPES.map(r => r.id);
    api.get24hPriceChanges(itemCodes).then(changes => {
      if (isMounted && changes && Object.keys(changes).length > 0) {
        setPriceChanges24h(changes);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Filter: 'all' | 'withEmployees' | 'withoutEmployees'
  const [staffFilter, setStaffFilter] = useState('all');


  // Active worker index for horizontal card navigation
  const [activeWorkerIdx, setActiveWorkerIdx] = useState(0);

  // Reset worker carousel index when selected company changes
  useEffect(() => {
    setActiveWorkerIdx(0);
  }, [selectedCompanyId]);

  // Live single-company refresh state
  const [isRefreshingLive, setIsRefreshingLive] = useState(false);

  // Live continuous heartbeat ticker for in-storage production accumulation & real-time pricing
  const [liveTick, setLiveTick] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTick(Date.now());
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Load companies
  const [companies, setCompanies] = useState(() => {
    if (userCompanies.length > 0) {
      return userCompanies.map((c, i) => mapCompanyFromDossier(c, i, user));
    }
    return DEFAULT_COMPANIES;
  });

  // Re-sync whenever incoming dossier/userCompanies changes
  useEffect(() => {
    if (userCompanies && userCompanies.length > 0) {
      const mapped = userCompanies.map((c, i) => mapCompanyFromDossier(c, i, user));
      setCompanies(mapped);
      setSelectedCompanyId(prev => {
        const exists = mapped.some(mc => mc.id === prev || mc._id === prev);
        return exists ? prev : (mapped[0]?._id || mapped[0]?.id);
      });
    }
  }, [dossier]);

  // Keep selected ID valid
  const effectiveSelectedId = selectedCompanyId || companies[0]?.id;

  // v0.27+: Management skill now grants +2% production bonus per level (not slot count)
  // Capacity is per-company, gated by Break Room upgrade (1/2/3 max per company)
  const managementSkill = user?.skills?.management;
  const managementLevel = managementSkill?.level ?? 0;
  const managementProductionBonus = managementLevel * 2; // +2% per level
  const leadershipLevel = user?.skills?.leadership?.level ?? 0;

  // Total employees across portfolio (Break Room per company determines per-company cap)
  const totalEmployedWorkers = useMemo(() => {
    return companies.reduce((sum, c) => sum + (c.employees?.length || c.workers?.length || 0), 0);
  }, [companies]);

  // Max total capacity = sum of all Break Room capacities across active companies
  const totalEmployeeCapacity = useMemo(() => {
    return companies.reduce((sum, c) => sum + (c.maxEmployees ?? getBreakRoomCapacity(c.breakRoomLevel ?? 0)), 0);
  }, [companies]);

  const maxHiringSlots = totalEmployeeCapacity;
  const remainingHiringSlots = Math.max(0, totalEmployeeCapacity - totalEmployedWorkers);
  const isAtHiringLimit = totalEmployedWorkers >= totalEmployeeCapacity;

  // 1. Base Output Computations
  const baseCompaniesData = useMemo(() => {
    return companies.map(comp => {
      const recipe = RECIPES.find(r => r.id === comp.itemCode) || RECIPES[0];

      // Authoritative live production bonus from WarEra API (company.getProductionBonus):
      // Components: strategicBonus + depositBonus + ethicSpecializationBonus + ethicDepositBonus = total
      const depositBonusPct = comp.depositBonusPct ?? (comp.hasDepositBonus ? 30.0 : 0.0);
      const countryBonusPct = comp.countryBonusPct ?? (comp.productionBonusData?.strategicBonus ?? 5.5);
      const totalBonusPct = typeof comp.totalBonusPct === 'number'
        ? comp.totalBonusPct
        : (typeof comp.productionBonus === 'number'
            ? comp.productionBonus
            : (typeof comp.productionBonusData?.total === 'number'
                ? comp.productionBonusData.total
                : (depositBonusPct + countryBonusPct)));
      const bonusMultiplier = 1 + (totalBonusPct / 100);

      const engineTier = ENGINE_UPGRADE_TIERS.find(t => t.level === comp.engineLevel) || ENGINE_UPGRADE_TIERS[0];
      const effectiveEnginePph = engineTier.ppPerHour * bonusMultiplier;
      const engineDailyPp = effectiveEnginePph * 24;

      // v0.27+: employees have the new schema from enrichEmployees()
      // salary (BTC/hr) and baseProduction/trainedProduction are the core stats
      // where totalProduction = baseProduction + trainedProduction + traitProduction
      const employeesList = (comp.employees || comp.workers || []).map(w => {
        const totalProd = (w.baseProduction ?? 0) + (w.trainedProduction ?? 0) + (w.traitProduction ?? 0);
        // Daily salary cost: salary is in BTC/hr directly
        const dailySalary = typeof w.salary === 'number' ? w.salary * 24 : null;
        return {
          ...w,
          totalProduction: totalProd,
          dailySalary,
          companyTotalBonusPct: totalBonusPct,
        };
      });

      const totalWorkerDailySalary = employeesList.reduce((sum, w) => sum + (w.dailySalary ?? 0), 0);

      // Engine base: pure automated hardware, no longer includes worker PP in engine model
      const totalDailyEffectivePp = engineDailyPp;
      const unitsPerDay = recipe.pp > 0 ? (totalDailyEffectivePp / recipe.pp) : 0;

      // Storage holding capacity in units (exact warehouse size)
      const storageTier = STORAGE_UPGRADE_TIERS.find(t => t.level === comp.storageLevel) || STORAGE_UPGRADE_TIERS[0];
      const storageCapacityPp = storageTier.capacity;
      const storageCapacityUnits = recipe.pp > 0 ? (storageCapacityPp / recipe.pp) : 0;

      // Real-time live in-storage production accumulation:
      // In WarEra, automated engine runs continuously at effectiveEnginePph (base * bonusMultiplier)
      const elapsedHours = Math.max(0, (liveTick - (comp.syncedAt || liveTick)) / 3600000);
      const engineAccumulatedPp = effectiveEnginePph * elapsedHours;
      const currentStoredPp = Math.min(
        storageCapacityPp,
        Math.max(0, (comp.production || 0) + engineAccumulatedPp)
      );
      const storedReadyUnits = recipe.pp > 0 ? (currentStoredPp / recipe.pp) : 0;

      return {
        ...comp,
        recipe,
        depositBonusPct,
        countryBonusPct,
        totalBonusPct,
        bonusMultiplier,
        engineTier,
        effectiveEnginePph,
        engineDailyPp,
        storageTier,
        storageCapacityPp,
        storageCapacityUnits,
        employees: employeesList,
        workers: employeesList,
        workersList: employeesList,
        employeesList,
        totalWorkerDailySalary,
        totalDailyEffectivePp,
        unitsPerDay,
        currentStoredPp,
        storedReadyUnits
      };
    });
  }, [companies, liveTick]);

  // 2. Portfolio-wide Base Portfolio Overview & Supply Chain Ledger
  const portfolioOverview = useMemo(() => {
    return calculatePortfolioOverview({
      companies: baseCompaniesData,
      userSkills: user?.skills,
      prices,
      insourceOverrides
    });
  }, [baseCompaniesData, user?.skills, prices, insourceOverrides]);

  // 3. Complete Financials based on Base Operations, Storage, and Upgrades
  const analyzedCompanies = useMemo(() => {
    const steelPrice = prices.steel || 1.72;
    const concretePrice = prices.concrete || 1.70;
    const enrichedList = portfolioOverview?.companies || [];

    return enrichedList.map(comp => {
      const recipe = comp.recipe || RECIPES.find(r => r.id === comp.itemCode) || { id: comp.itemCode, name: comp.itemCode, pp: 1, type: 'raw' };
      const spotPrice = comp.spotPrice || prices[comp.itemCode] || 1.0;
      const netSellPrice = spotPrice;
      const isRawProducer = comp.isRaw;

      // Storage & Combined Engine + AI Workers Timer (using live accumulated stored PP)
      const storageTier = comp.storageTier || STORAGE_UPGRADE_TIERS.find(t => t.level === comp.storageLevel) || STORAGE_UPGRADE_TIERS[0];
      const storageCapacity = comp.storageCapacityPp || storageTier.capacity;
      const currentStoredPp = comp.currentStoredPp || 0;
      const currentFillPct = Math.min(100, (currentStoredPp / storageCapacity) * 100);
      const remainingPpToFull = Math.max(0, storageCapacity - currentStoredPp);

      const effectiveEnginePph = comp.effectiveEnginePph || ((comp.engineTier?.ppPerHour || comp.engineLevel || 1) * comp.bonusMultiplier);
      const workersProducedDailyPp = comp.companyProducedDailyPp || comp.workersProducedDailyPp || 0;
      const workersHourlyPp = workersProducedDailyPp / 24;
      const totalCombinedPph = effectiveEnginePph + workersHourlyPp;

      const totalHoursUntilFull = totalCombinedPph > 0 ? (remainingPpToFull / totalCombinedPph) : 9999;
      const storageDaysOnly = Math.floor(totalHoursUntilFull / 24);
      const storageHoursRemainder = Math.floor(totalHoursUntilFull % 24);
      const storageMinutesRemainder = Math.floor((totalHoursUntilFull * 60) % 60);

      const engineHoursUntilFull = effectiveEnginePph > 0 ? (remainingPpToFull / effectiveEnginePph) : 9999;
      const engineDaysOnly = Math.floor(engineHoursUntilFull / 24);
      const engineHoursRemainder = Math.floor(engineHoursUntilFull % 24);

      // Ready inventory
      const uncollectedUnits = comp.storedReadyUnits || 0;
      const uncollectedValueCoins = uncollectedUnits * netSellPrice;

      // Real-time Asset Worth Breakdown
      const concreteInvestedVal = (comp.concreteInvested || 200) * concretePrice;
      const steelInEngine = (comp.engineTier?.steel || 0) * steelPrice;
      const steelInStorage = (storageTier?.steel || 0) * steelPrice;
      const inventoryVal = uncollectedValueCoins;
      const baseHardwareVal = concreteInvestedVal + steelInEngine + steelInStorage;
      const baseValuation = (typeof comp.estimatedValue === 'number' && comp.estimatedValue > 0)
        ? comp.estimatedValue
        : baseHardwareVal;
      const totalCalculatedWorth = baseValuation + inventoryVal;

      // 24-Hour Enterprise Value Growth
      const itemPriceChange = priceChanges24h[comp.itemCode];
      const inventoryPriceDelta = (itemPriceChange?.changeDiff || 0) * (comp.storedReadyUnits || 0);
      const growth24hCoins = comp.baseNetProfit + inventoryPriceDelta;
      const baselineValuation = Math.max(1, totalCalculatedWorth - growth24hCoins);
      const growth24hPct = (growth24hCoins / baselineValuation) * 100;

      // Upgrades
      const maxEngineLevel = 5;
      const nextEngineTier = (comp.engineLevel < maxEngineLevel) 
        ? (ENGINE_UPGRADE_TIERS.find(t => t.level === comp.engineLevel + 1) || null)
        : null;
      let engineUpgradeSteel = 0;
      let engineUpgradeCoins = 0;
      let engineExtraProfitDaily = 0;
      let enginePaybackDays = 999;

      if (nextEngineTier && comp.engineTier) {
        engineUpgradeSteel = nextEngineTier.steel - comp.engineTier.steel;
        engineUpgradeCoins = engineUpgradeSteel * steelPrice;
        const extraDailyUnits = recipe.pp > 0 ? ((24 * comp.bonusMultiplier) / recipe.pp) : 0;
        engineExtraProfitDaily = extraDailyUnits * comp.baseNetProfitPerUnit;
        enginePaybackDays = engineExtraProfitDaily > 0 ? (engineUpgradeCoins / engineExtraProfitDaily) : 999;
      }

      const maxStorageLevel = 5;
      const nextStorageTier = (comp.storageLevel < maxStorageLevel)
        ? (STORAGE_UPGRADE_TIERS.find(t => t.level === comp.storageLevel + 1) || null)
        : null;
      let storageUpgradeSteel = 0;
      let storageExtraCapacity = 0;
      let storageExtraEngineHours = 0;

      if (nextStorageTier) {
        storageUpgradeSteel = nextStorageTier.steel - storageTier.steel;
        storageExtraCapacity = nextStorageTier.capacity - storageCapacity;
        storageExtraEngineHours = effectiveEnginePph > 0 ? (storageExtraCapacity / effectiveEnginePph) : 0;
      }

      // v0.27+ employees: pass through with context enrichment
      const rawWorkerList = (comp.employeesList || comp.employees || []).map(w => ({
        ...w,
        companyId: comp.id,
        companyName: comp.name,
        companyItemCode: comp.itemCode,
        recipe,
        spotPrice,
      }));

      const enrichedWorkers = [...rawWorkerList];
      if (comp.manager && !enrichedWorkers.some(w => w.id === comp.manager.id || w.userId === comp.manager.userId)) {
        enrichedWorkers.push({
          ...comp.manager,
          id: comp.manager.id || `mgr-${comp.id}`,
          name: comp.manager.username || comp.manager.name || 'Hired Facility Manager',
          username: comp.manager.username || 'Manager',
          isManager: true,
          role: 'Manager',
          gender: comp.manager.gender || 'male',
          avatarUrl: comp.manager.avatarUrl || comp.ownerAvatarUrl || null,
          countryCode: comp.manager.countryCode || comp.countryCode || 'HQ',
          companyId: comp.id,
          companyName: comp.name,
          companyItemCode: comp.itemCode,
          recipe,
          spotPrice,
          hourlyWage: comp.manager.hourlyWage || (comp.managerPay ? comp.managerPay / 24 : 0),
          dailyWage: comp.manager.dailyWage || comp.managerPay || 0,
          hourlyOutputPp: 0,
          dailyOutputPp: 0,
          dailyProductionValue: 0,
          dailyProfit: -(comp.manager.dailyWage || comp.managerPay || 0),
          happiness: 100,
          potential: comp.manager.managementLevel || 1,
          potentialMax: 10,
          baseProduction: 0,
          trainedProduction: 0,
          productionBonus: comp.manager.productionBonusPercent || (comp.manager.managementLevel ? comp.manager.managementLevel * 2 : 0),
          traits: [
            { code: 'management', name: `Management Lv.${comp.manager.managementLevel || 1}`, description: `Scales all facility workers' production by continuous +${(comp.manager.managementLevel || 1) * 2}% bonus.` }
          ],
          breakdown: {
            production: { base: 0, trained: 0, total: comp.manager.managementLevel || 1 },
            luck: { base: 0, trained: 0, total: 0 },
            responsibility: { base: comp.manager.managementLevel || 1, trained: 0, total: comp.manager.managementLevel || 1 }
          }
        });
      }

      const hasEmployees = enrichedWorkers.length > 0;

      return {
        ...comp,
        recipeName: recipe.name,
        recipePp: recipe.pp,
        spotPrice,
        netSellPrice,
        isRawProducer,
        enrichedWorkers,
        employees: enrichedWorkers,
        workers: enrichedWorkers,
        workersList: enrichedWorkers,
        hasEmployees,
        storageTier,
        storageCapacity,
        storageCapacityPp: storageCapacity,
        currentStoredPp,
        currentFillPct,
        remainingPpToFull,
        effectiveEnginePph,
        workersHourlyPp,
        totalCombinedPph,
        totalHoursUntilFull,
        storageDaysOnly,
        storageHoursRemainder,
        storageMinutesRemainder,
        engineHoursUntilFull,
        engineDaysOnly,
        engineHoursRemainder,
        uncollectedUnits,
        uncollectedValueCoins,
        concreteInvestedVal,
        steelInEngine,
        steelInStorage,
        totalCalculatedWorth,
        growth24hCoins: Number(growth24hCoins.toFixed(2)),
        growth24hPct: Number(growth24hPct.toFixed(2)),
        priceChange24h: itemPriceChange,
        nextEngineTier,
        engineUpgradeSteel,
        engineUpgradeCoins,
        engineExtraProfitDaily,
        enginePaybackDays,
        nextStorageTier,
        storageUpgradeSteel,
        storageExtraCapacity,
        storageExtraEngineHours
      };
    });
  }, [portfolioOverview, prices, priceChanges24h]);

  // Filtered companies based on staffFilter: 'all' | 'withEmployees' | 'withoutEmployees'
  const filteredCompanies = useMemo(() => {
    if (staffFilter === 'withEmployees') {
      return analyzedCompanies.filter(c => c.hasEmployees);
    }
    if (staffFilter === 'withoutEmployees') {
      return analyzedCompanies.filter(c => !c.hasEmployees);
    }
    return analyzedCompanies;
  }, [analyzedCompanies, staffFilter]);

  // Active company
  const activeCompany = useMemo(() => {
    return filteredCompanies.find(c => c.id === effectiveSelectedId) 
      || analyzedCompanies.find(c => c.id === effectiveSelectedId) 
      || filteredCompanies[0] 
      || analyzedCompanies[0];
  }, [filteredCompanies, analyzedCompanies, effectiveSelectedId]);

  // Combined workforce statistics for active company (mathematically aligned with zero double-counting)
  const combinedWorkforceStats = useMemo(() => {
    const workers = activeCompany?.enrichedWorkers || [];
    if (workers.length === 0) return null;
    const combinedDailySalary = workers.reduce((sum, w) => sum + (w.dailyWage || w.dailySalary || 0), 0);
    const totalOutputPp = workers.reduce((sum, w) => sum + (w.dailyOutputPp || (w.hourlyOutputPp ? w.hourlyOutputPp * 24 : 0)), 0);
    const combinedDailyRevenue = workers.reduce((sum, w) => sum + (w.dailyProductionValue || 0), 0);
    const combinedDailyProfit = combinedDailyRevenue - combinedDailySalary;
    const totalProdStat = workers.reduce((sum, w) => sum + (w.breakdown?.production?.total ?? ((w.baseProduction || 0) + (w.trainedProduction || 0))), 0);
    return {
      count: workers.length,
      combinedDailySalary,
      totalOutputPp,
      combinedDailyRevenue,
      combinedDailyProfit,
      totalProduction: totalProdStat,
    };
  }, [activeCompany?.enrichedWorkers]);

  // Whole-portfolio workers for cross-facility synergy searches
  const allPortfolioWorkers = useMemo(() => {
    const list = [];
    (analyzedCompanies || []).forEach(c => {
      (c.enrichedWorkers || c.employees || []).forEach(w => {
        list.push({
          ...w,
          companyName: c.name,
          companyId: c.id,
          countryCode: w.countryCode || w.nationalityCode || (typeof w.nationality === 'string' && w.nationality.length === 2 ? w.nationality : null) || c.countryCode || 'HQ',
        });
      });
    });
    return list;
  }, [analyzedCompanies]);

  // Safe active worker index for carousel
  const validWorkerIdx = Math.min(
    activeWorkerIdx,
    Math.max(0, (activeCompany?.enrichedWorkers?.length || 1) - 1)
  );
  const currentWorker = activeCompany?.enrichedWorkers?.[validWorkerIdx];
  const totalRosterWorkers = activeCompany?.enrichedWorkers?.length || 0;
  const nextRosterWorker = totalRosterWorkers > 1 
    ? activeCompany.enrichedWorkers[(validWorkerIdx + 1) % totalRosterWorkers] 
    : null;
  const nextRosterWorkerIdx = totalRosterWorkers > 1 
    ? (validWorkerIdx + 1) % totalRosterWorkers 
    : null;
  const prevRosterWorker = totalRosterWorkers > 2 
    ? activeCompany.enrichedWorkers[(validWorkerIdx - 1 + totalRosterWorkers) % totalRosterWorkers] 
    : null;
  const prevRosterWorkerIdx = totalRosterWorkers > 2 
    ? (validWorkerIdx - 1 + totalRosterWorkers) % totalRosterWorkers 
    : null;

  // Handlers for company edits
  const handleUpdate = (id, key, val) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, [key]: val } : c));
  };

  const handleDelete = (id) => {
    if (companies.length <= 1) return;
    setCompanies(prev => prev.filter(c => c.id !== id));
    setSelectedCompanyId(companies.find(c => c.id !== id)?.id || companies[0].id);
  };

  // Live refresh of currently active facility and empire directly from WarEra API
  const handleRefreshActiveCompany = async () => {
    if (isRefreshingLive) return;
    setIsRefreshingLive(true);
    try {
      // 1. Fetch latest live prices & order books across all commodities
      if (onRefreshPrices) {
        await onRefreshPrices();
      }

      // 2. Fetch latest user dossier & facilities
      if (user?._id) {
        const freshDossier = await api.resolveUserFull(user._id);
        if (freshDossier?.companies && freshDossier.companies.length > 0) {
          const mapped = freshDossier.companies.map((c, i) => mapCompanyFromDossier(c, i, freshDossier.user));
          setCompanies(mapped);
          if (onUpdateDossier) {
            onUpdateDossier(freshDossier);
          }
        }
      } else if (activeCompany) {
        const targetId = activeCompany._id || activeCompany.id;
        if (targetId && /^[a-f\d]{24}$/i.test(targetId)) {
          const fresh = await api.getCompanyFull(targetId, user);
          if (fresh) {
            const mapped = mapCompanyFromDossier(fresh, 0, user);
            setCompanies(prev => prev.map(c => (c.id === targetId || c._id === targetId) ? mapped : c));
          }
        }
      }

      // Refresh 24h market price changes
      try {
        const itemCodes = RECIPES.map(r => r.id);
        const changes = await api.get24hPriceChanges(itemCodes);
        if (changes && Object.keys(changes).length > 0) {
          setPriceChanges24h(changes);
        }
      } catch (err) {
        console.warn('Failed to refresh 24h prices:', err);
      }
    } catch (e) {
      console.warn('Live refresh failed:', e);
    } finally {
      setIsRefreshingLive(false);
    }
  };

  // Dynamic fill theme for warehouse storage
  const storageFillTheme = useMemo(() => {
    const pct = activeCompany?.currentFillPct || 0;
    if (pct >= 90) {
      return {
        badgeText: 'Near Capacity',
        badgeClass: 'bg-rose-100 text-rose-800',
        timerColor: 'text-rose-600',
        bannerBg: 'bg-rose-500/10 border-rose-500/30 text-rose-900',
        liquidGradient: 'from-rose-600 via-red-500 to-amber-500',
        capColor: 'bg-rose-400/80',
      };
    }
    if (pct >= 75) {
      return {
        badgeText: 'Filling Fast',
        badgeClass: 'bg-orange-100 text-orange-800',
        timerColor: 'text-orange-600',
        bannerBg: 'bg-orange-500/10 border-orange-500/30 text-orange-900',
        liquidGradient: 'from-orange-600 via-amber-500 to-yellow-400',
        capColor: 'bg-orange-400/80',
      };
    }
    if (pct >= 50) {
      return {
        badgeText: 'Moderate Fill',
        badgeClass: 'bg-amber-100 text-amber-800',
        timerColor: 'text-amber-600',
        bannerBg: 'bg-amber-500/10 border-amber-500/30 text-amber-900',
        liquidGradient: 'from-amber-600 via-yellow-500 to-amber-400',
        capColor: 'bg-amber-400/70',
      };
    }
    return {
      badgeText: 'Optimal Capacity',
      badgeClass: 'bg-emerald-100 text-emerald-800',
      timerColor: 'text-emerald-600',
      bannerBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900',
      liquidGradient: 'from-emerald-600 via-teal-500 to-cyan-500',
      capColor: 'bg-emerald-400/70',
    };
  }, [activeCompany?.currentFillPct]);

  return (
    <div className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-6 space-y-8 select-none">
      {viewMode === 'listing' ? (
        <StockExchangeListing
          companies={analyzedCompanies}
          user={user}
          dossier={dossier}
          portfolioTotals={portfolioOverview?.totals}
          ownerLabor={portfolioOverview?.ownerLabor}
          supplyChainLedger={portfolioOverview?.supplyChainLedger}
          prices={prices}
          priceChanges24h={priceChanges24h}
          onSelectCompany={(compId) => {
            setSelectedCompanyId(compId);
            setViewMode('details');
          }}
          onRefreshLive={handleRefreshActiveCompany}
          isRefreshingLive={isRefreshingLive}
          managementLevel={managementLevel}
          maxHiringSlots={maxHiringSlots}
        />
      ) : (
        <div className="space-y-6 animate-in fade-in duration-150 font-sans">
          {/* Navigation Bar / Return to Stock Exchange Listing */}
          <div className="flex items-center justify-between gap-4 pb-2">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setViewMode('listing')}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold font-mono transition cursor-pointer group"
              >
                <ArrowLeft className="w-4 h-4 text-slate-300 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Stock Exchange Listing</span>
              </button>
              
              <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 font-mono">
                <span>/</span>
                <span className="font-bold text-slate-900 font-sans">{activeCompany.name}</span>
                <span className="text-[10px] font-mono uppercase bg-slate-100 px-1.5 py-0.5 text-slate-600">
                  {activeCompany.itemCode}
                </span>
              </div>
            </div>
          </div>

          {/* 1. TOP GRID: COMPANY INTRODUCTION & LINKEDIN-STYLE EMPLOYEE STRUCTURE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            
            {/* LEFT COLUMN: COMPANY INTRODUCTION (ASSET VALUATION BREAKDOWN STRUCTURE) */}
            <div className="lg:col-span-5 bg-white p-5 space-y-4 flex flex-col justify-between">
              
              {/* Company Identity Header */}
              <div className="flex items-start justify-between gap-3 pb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-slate-100 flex items-center justify-center shrink-0">
                    <ItemIcon itemCode={activeCompany.itemCode} size={28} />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <h2 className="text-lg font-extrabold text-slate-900 font-sans truncate">{activeCompany.name}</h2>
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 text-slate-700 uppercase">
                        {activeCompany.itemCode}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">
                        {activeCompany.regionName} ({activeCompany.countryCode}){activeCompany.mainCity ? ` • ${activeCompany.mainCity}` : ''}
                      </span>
                      <span>•</span>
                      <span 
                        className="text-emerald-700 font-bold shrink-0 cursor-help"
                        title={activeCompany.productionBonusData ? `Strategic: +${activeCompany.strategicBonus}% | Ethics: +${activeCompany.ethicBonusPct}% | Deposit: +${activeCompany.depositBonusPct}%` : `Production Bonus: +${activeCompany.totalBonusPct.toFixed(1)}%`}
                      >
                        +{activeCompany.totalBonusPct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={() => handleDelete(activeCompany.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Delete this facility"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Asset Valuation Breakdown Structure */}
              <div className="space-y-2.5 font-mono text-xs flex-1 flex flex-col justify-around">
                <div className="flex items-center justify-between pb-1.5 font-sans">
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                    Asset Valuation Breakdown
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-600">
                    Engine Lv.{activeCompany.engineLevel} • Storage Lv.{activeCompany.storageLevel}
                  </span>
                </div>

                <div className="space-y-1.5 text-slate-600 flex-1 flex flex-col justify-around">
                  <div className="flex justify-between items-center">
                    <span>Building Structure ({activeCompany.concreteInvested} Concrete):</span>
                    <strong className="text-slate-900 font-bold">{activeCompany.concreteInvestedVal.toFixed(0)}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Engine Lv.{activeCompany.engineLevel} Hardware:</span>
                    <strong className="text-slate-900 font-bold">{activeCompany.steelInEngine.toFixed(0)}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Storage Lv.{activeCompany.storageLevel} Hardware:</span>
                    <strong className="text-slate-900 font-bold">{activeCompany.steelInStorage.toFixed(0)}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Ready Yield in Storage ({activeCompany.uncollectedUnits.toFixed(1)} units):</span>
                    <strong className="text-amber-700 font-bold">{activeCompany.uncollectedValueCoins.toFixed(0)}</strong>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 text-slate-900 font-bold">
                    <span>Total Asset Valuation:</span>
                    <span className="text-emerald-700 font-black text-sm">
                      {activeCompany.totalCalculatedWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-0.5">
                    <span>Hourly Growth:</span>
                    <span className={`font-black ${activeCompany.growth24hCoins > 0 ? 'text-emerald-500' : activeCompany.growth24hCoins < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                      {activeCompany.growth24hCoins >= 0 ? '+' : ''}{(activeCompany.growth24hCoins / 24).toFixed(2)} ({(activeCompany.growth24hPct / 24).toFixed(2)}%) past 1h
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-slate-100">
                    <span className="font-bold text-slate-800">Daily Production (PP):</span>
                    <div className="text-right">
                      <strong className="text-slate-900 font-mono">
                        {activeCompany.companyProducedDailyPp.toFixed(1)} PP/day
                      </strong>
                      <span className="text-[10px] text-emerald-700 block font-semibold">
                        Bonuses included
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Output Yield:</span>
                    <strong className="text-slate-900 font-mono">
                      {activeCompany.baseUnits.toFixed(1)} units/day
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Daily Gross Revenue:</span>
                    <strong className="text-emerald-500 font-mono">
                      +{activeCompany.grossRevenue.toFixed(2)} BTC/day
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Daily Salaries Paid:</span>
                    <strong className={activeCompany.dailyLaborExpense > 0 ? "text-red-500 font-mono" : "text-blue-500 font-mono"}>
                      {activeCompany.dailyLaborExpense > 0 ? `-${activeCompany.dailyLaborExpense.toFixed(2)}` : '0.00'} BTC/day
                    </strong>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-slate-100">
                    <span className="font-bold text-slate-800">Daily Net Profit:</span>
                    <div className="text-right">
                      <strong className={`font-bold font-mono ${activeCompany.baseNetProfit > 0 ? 'text-emerald-500' : activeCompany.baseNetProfit < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                        {activeCompany.baseNetProfit >= 0 ? '+' : ''}{activeCompany.baseNetProfit.toFixed(2)} BTC/day
                      </strong>
                      <span className="text-[10px] text-slate-400 block font-normal">
                        {activeCompany.baseNetMarginPct ? `${activeCompany.baseNetMarginPct.toFixed(1)}% margin` : ''}
                      </span>
                    </div>
                  </div>
                  {(activeCompany.totalCostAvoided || 0) > 0 && (
                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-100 text-emerald-700 font-bold">
                      <span>Adjusted Net (Insourced):</span>
                      <strong className="font-mono">
                        +{activeCompany.adjustedNetProfit.toFixed(2)}/day (+{activeCompany.totalCostAvoided.toFixed(2)} saved)
                      </strong>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: SLEEK FIFA-STYLE EMPLOYEE SHOWCASE (CLASSY MODERN LUXURY STADIUM THEME) */}
            <div className="lg:col-span-7 bg-gradient-to-b from-slate-900 via-[#0a0f1d] to-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 flex flex-col justify-between text-white shadow-2xl relative overflow-hidden">
              
              {/* Ambient Golden Top Radiance */}
              <div className="absolute top-0 inset-x-0 h-48 bg-[radial-gradient(ellipse_at_top,_rgba(245,158,11,0.14),_transparent_70%)] pointer-events-none" />

              {/* Workforce Roster Header: Just the clean title */}
              <div className="relative z-10 pb-2 border-b border-slate-800/80">
                <h3 className="text-sm font-black text-slate-100 font-sans tracking-tight">
                  Workforce Roster
                </h3>
              </div>

              {/* FIFA TRADING CARD CONTAINER & OUTSIDE PRODUCTION BREAKDOWN */}
              <div className="relative z-10 flex-1 flex flex-col justify-center space-y-5">
                {activeCompany.enrichedWorkers.length > 0 && currentWorker ? (
                  <>
                    {/* Fanned 3D FIFA Card Deck View:
                        Card 3 (Previous, Left, z-10) < Card 1 (Active, Center, z-30) > Card 2 (Next, Right, z-20)
                        - 100% OPAQUE (NO translucent double-exposure ghosting)
                        - Symmetrical Left & Right peeking positions
                        - Deep physical drop shadows and scale stepping
                    */}
                    <div className="relative flex items-center justify-center py-4 min-h-[480px] isolate overflow-visible">
                      
                      {/* Left Peek Card (Previous Employee in roster, z-10) */}
                      {totalRosterWorkers > 2 && prevRosterWorker && (
                        <div 
                          className="hidden lg:block absolute -left-2 xl:left-2 top-1/2 -translate-y-1/2 transition-all duration-300 transform scale-[0.88] brightness-[0.82] hover:brightness-100 hover:scale-[0.92] cursor-pointer pointer-events-auto opacity-100 drop-shadow-[0_15px_35px_rgba(0,0,0,0.8)]"
                          style={{ zIndex: 10 }}
                          onClick={() => setActiveWorkerIdx(prevRosterWorkerIdx)}
                          title={`Click to view previous: #${prevRosterWorkerIdx + 1} ${prevRosterWorker.name || prevRosterWorker.username}`}
                        >
                          <EmployeeFifaCardMini 
                            worker={prevRosterWorker}
                            company={activeCompany}
                          />
                        </div>
                      )}

                      {/* Right Peek Card (Next Employee in roster, z-20) */}
                      {totalRosterWorkers > 1 && nextRosterWorker && (
                        <div 
                          className="hidden md:block absolute -right-2 xl:right-2 top-1/2 -translate-y-1/2 transition-all duration-300 transform scale-[0.88] brightness-[0.82] hover:brightness-100 hover:scale-[0.92] cursor-pointer pointer-events-auto opacity-100 drop-shadow-[0_15px_35px_rgba(0,0,0,0.8)]"
                          style={{ zIndex: 20 }}
                          onClick={() => setActiveWorkerIdx(nextRosterWorkerIdx)}
                          title={`Click to view next: #${nextRosterWorkerIdx + 1} ${nextRosterWorker.name || nextRosterWorker.username}`}
                        >
                          <EmployeeFifaCardMini 
                            worker={nextRosterWorker}
                            company={activeCompany}
                          />
                        </div>
                      )}

                      {/* Active Center Card (Top of the deck, z-30) */}
                      <div 
                        className="relative transition-all duration-300 transform scale-100 pointer-events-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.85)]" 
                        style={{ zIndex: 30 }}
                      >
                        <EmployeeFifaCard 
                          worker={currentWorker}
                          company={activeCompany}
                          portfolioWorkers={allPortfolioWorkers}
                          portfolioCompanies={analyzedCompanies}
                          onSelectCompany={(compId) => setSelectedCompanyId(compId)}
                        />
                      </div>

                    </div>

                    {/* 2. PRODUCTION BREAKDOWN (OUTSIDE THE CARD) */}
                    <EmployeeProductionBreakdown 
                      worker={currentWorker}
                      company={activeCompany}
                    />
                  </>
                ) : (
                  <div className="p-8 flex flex-col justify-center items-center text-center space-y-2 bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl">
                    <Users className="w-8 h-8 text-slate-500 stroke-[1.5]" />
                    <span className="text-xs font-bold text-slate-300 block">No Employees Assigned</span>
                    <p className="text-xs text-slate-400 font-sans max-w-[260px] leading-relaxed">
                      Break Room Lv.{activeCompany.breakRoomLevel ?? 0} supports up to {activeCompany.maxEmployees ?? 0} worker{(activeCompany.maxEmployees ?? 0) === 1 ? '' : 's'}. Automated engine generates {(activeCompany.engineTier?.ppPerHour ? activeCompany.engineTier.ppPerHour * 24 : 24)} PP/day at 0 wage cost.
                    </p>
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* 2. MIDDLE GRID: WAREHOUSE STORAGE (LEFT) & UNIT ECONOMICS / UPGRADES (RIGHT) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            
            {/* LEFT COLUMN: WAREHOUSE STORAGE (5 COLS) */}
            <div className="lg:col-span-5 bg-white p-5 space-y-4 flex flex-col justify-between">
              
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">Warehouse Storage</span>
                <h3 className="text-base font-extrabold text-slate-900 font-sans mt-0.5">
                  Storage Capacity & Combined Fill Timer
                </h3>
              </div>

              {/* TIME UNTIL FULL USING ENGINE + AI WORKFORCE COMBINED */}
              <div className={`p-4 rounded-xl border ${storageFillTheme.bannerBg} space-y-1.5`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold block">
                    Time until storage is full (Engine + Staff):
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${storageFillTheme.badgeClass}`}>
                    {storageFillTheme.badgeText}
                  </span>
                </div>
                <div className={`text-xl font-black font-mono ${storageFillTheme.timerColor}`}>
                  {activeCompany.storageDaysOnly > 0 
                    ? `${activeCompany.storageDaysOnly}d ${activeCompany.storageHoursRemainder}h ${activeCompany.storageMinutesRemainder}m` 
                    : `${activeCompany.storageHoursRemainder}h ${activeCompany.storageMinutesRemainder}m`}
                </div>
                <p className="text-[11px] opacity-85 font-sans leading-relaxed">
                  Combined production speed: <strong>{(activeCompany.totalCombinedPph || 0).toFixed(2)} PP/hr</strong> (Engine: {(activeCompany.effectiveEnginePph || 0).toFixed(2)} + AI Workers: {(activeCompany.workersHourlyPp || 0).toFixed(2)}). Warehouse capacity: <strong>{activeCompany.storageCapacity} PP</strong>.
                </p>
              </div>

              {/* DYNAMIC STORAGE CYLINDER GAUGE */}
              <div className="relative w-44 sm:w-52 h-56 mx-auto flex flex-col justify-end items-center my-2">
                <div className="relative w-full h-full bg-slate-100 rounded-2xl overflow-hidden flex flex-col justify-end shadow-inner">
                  <div className="absolute top-0 inset-x-0 h-8 bg-slate-200/90 z-20 flex items-center justify-center">
                    <span className="text-[10px] font-mono font-bold text-slate-500">CAPACITY {activeCompany.storageCapacity} PP</span>
                  </div>
                  <div 
                    className={`absolute bottom-0 inset-x-0 bg-gradient-to-t ${storageFillTheme.liquidGradient} transition-all duration-500 flex items-start justify-center pt-2`}
                    style={{ height: `${Math.max(8, activeCompany.currentFillPct)}%` }}
                  >
                    <div className={`w-full h-2.5 ${storageFillTheme.capColor} opacity-90`} />
                  </div>
                  <div className="relative z-20 bg-white/95 backdrop-blur-sm py-1.5 px-3.5 text-center mb-3 rounded-xl shadow-sm mx-auto">
                    <span className="font-mono font-black text-slate-900 text-xs">
                      {activeCompany.currentStoredPp.toFixed(0)} / {activeCompany.storageCapacity} PP ({activeCompany.currentFillPct.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Warehouse Ready Yield */}
              <div className="flex justify-between items-center text-slate-600 bg-slate-50 p-3 rounded-xl font-mono text-xs">
                <span>Ready Yield in Storage:</span>
                <strong className="text-slate-900 font-extrabold">
                  {activeCompany.uncollectedUnits.toFixed(1)} units
                </strong>
              </div>

            </div>

            {/* RIGHT COLUMN: UNIT ECONOMICS & HARDWARE UPGRADES (7 COLS) */}
            <div className="lg:col-span-7 bg-white p-5 space-y-4 flex flex-col justify-between">
              
              {/* UNIT ECONOMICS BREAKDOWN STRUCTURE */}
              <div className="space-y-3 font-mono text-xs flex-1 flex flex-col justify-around">
                <div className="flex items-center justify-between pb-1 font-sans">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">Unit Economics</span>
                    <h3 className="text-base font-extrabold text-slate-900 font-sans mt-0.5">
                      Production Cost & Margin Analysis
                    </h3>
                  </div>
                  <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    {activeCompany.baseNetMarginPct ? `${activeCompany.baseNetMarginPct.toFixed(1)}% Margin` : 'Profitable'}
                  </span>
                </div>

                <div className="space-y-2 text-slate-600 flex-1 flex flex-col justify-around">
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50">
                    <span className="font-sans">Market Selling Price:</span>
                    <strong className="text-slate-900 font-bold">+{activeCompany.spotPrice.toFixed(3)} BTC / unit</strong>
                  </div>

                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50">
                    <span className="font-sans">Hired Labor Wages:</span>
                    <strong className={activeCompany.baseLaborCostPerUnit > 0 ? "text-rose-500 font-bold" : "text-slate-700 font-bold"}>
                      {activeCompany.baseLaborCostPerUnit > 0 ? `-${activeCompany.baseLaborCostPerUnit.toFixed(3)} BTC / unit` : '0.000 BTC / unit'}
                    </strong>
                  </div>

                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50">
                    <span className="font-sans">Raw Material Inputs:</span>
                    <strong className={activeCompany.baseRawCostPerUnit > 0 ? "text-rose-500 font-bold" : "text-emerald-600 font-bold"}>
                      {activeCompany.isRaw ? (
                        <span>0.000 BTC (Natural Extraction)</span>
                      ) : (
                        (activeCompany.totalCostAvoided || 0) > 0 ? (
                          <span>
                            -{((activeCompany.adjustedRawCashExpense || 0) / (activeCompany.baseUnits || 1)).toFixed(3)} BTC
                            <span className="text-[10px] text-emerald-600 font-sans font-normal ml-1">
                              (+{((activeCompany.totalCostAvoided || 0) / (activeCompany.baseUnits || 1)).toFixed(3)} saved)
                            </span>
                          </span>
                        ) : (
                          <span>-{activeCompany.baseRawCostPerUnit.toFixed(3)} BTC</span>
                        )
                      )}
                    </strong>
                  </div>

                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-emerald-50 text-emerald-950 font-bold">
                    <span className="font-sans font-extrabold">Net Profit Per Unit:</span>
                    <span className={`font-black text-sm font-mono ${activeCompany.baseNetProfitPerUnit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {activeCompany.baseNetProfitPerUnit >= 0 ? '+' : ''}{activeCompany.baseNetProfitPerUnit.toFixed(3)} BTC / unit
                    </span>
                  </div>

                  <div className="flex justify-between items-center px-2 py-1 text-slate-500 text-[11px]">
                    <span className="font-sans">Daily Production Volume:</span>
                    <strong className="text-slate-800 font-mono">
                      {activeCompany.baseUnits.toFixed(1)} units/day (+{activeCompany.baseNetProfit.toFixed(2)} BTC/day net)
                    </strong>
                  </div>
                </div>
              </div>

              {/* HARDWARE UPGRADES IN PLAIN ENGLISH */}
              {activeCompany.nextEngineTier && (
                <div className="bg-slate-50 p-3.5 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-slate-800 font-bold text-xs">
                    <span>Next Automated Engine Level (Lv.{activeCompany.engineLevel + 1})</span>
                    <span className="text-amber-700 font-mono font-bold">+24 PP / day</span>
                  </div>
                  <p className="text-xs text-slate-600 font-sans">
                    Upgrading costs <strong>{activeCompany.engineUpgradeSteel} Steel</strong> ({activeCompany.engineUpgradeCoins.toFixed(1)} BTC). Gives you +1 PP/hour (+24 PP/day), generating <strong>+{activeCompany.engineExtraProfitDaily.toFixed(1)} BTC/day</strong> extra net profit.
                  </p>
                  <div className="text-[11px] font-mono text-emerald-700 font-bold pt-0.5">
                    Recoups its upgrade cost in {activeCompany.enginePaybackDays.toFixed(0)} days.
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}





    </div>
  );
}
