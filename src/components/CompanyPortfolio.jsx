import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, 
  Minus,
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
  ArrowRightLeft,
  Cpu
} from 'lucide-react';
import { RECIPES, ENGINE_UPGRADE_TIERS, STORAGE_UPGRADE_TIERS, getBreakRoomCapacity } from '../data/gameData';
import { api } from '../services/wareraApi';
import { calculatePortfolioOverview, mapCompanyFromDossier, isCompanyDisabled, getWorkerIndividualBonusBreakdown } from '../data/marketMath';
import { getTraitInfo } from '../data/employeeTraits';
import ItemIcon from './ItemIcon';
import StockExchangeListing from './StockExchangeListing';
import EmployeeFifaCard, { EmployeeFifaCardMini, EmployeeProductionBreakdown } from './EmployeeFifaCard';
import WorkforceFifaCarousel from './WorkforceFifaCarousel';
import { getCompanyTheme } from '../data/companyThemes';
import CountryFlagBadge from './CountryFlagBadge';

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

import { resolveCountry, getCountryFlag, getCountryName } from '../data/wareraCountries';
export { getCountryFlag, getCountryName };

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

  // Owner management skill and global enterprise production bonus
  const ownerMgmtSkill = user?.skills?.management;
  const ownerMgmtLevel = ownerMgmtSkill?.level ?? 0;
  const ownerMgmtBonusPct = (ownerMgmtSkill?.value || (ownerMgmtLevel > 0 ? ownerMgmtLevel + 1 : 0)) * 2;

  // Active selected company ID - initialized to real company if present
  const [selectedCompanyId, setSelectedCompanyId] = useState(() => {
    return userCompanies?.[0]?._id || userCompanies?.[0]?.id || 'c1';
  });

  const topRef = useRef(null);

  // Insource toggle overrides: { [`${companyId}_${rawItemCode}`]: boolean }
  const [insourceOverrides, setInsourceOverrides] = useState({});

  // Portfolio View Mode: 'listing' (Stock Exchange homepage) | 'details' (Company deep-dive)
  const [viewMode, setViewMode] = useState('listing');

  // Always scroll to top of page when opening or switching company details
  useEffect(() => {
    if (viewMode === 'details') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      if (topRef.current) {
        topRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
        let parent = topRef.current.parentElement;
        while (parent) {
          if (parent.scrollTop > 0) {
            parent.scrollTop = 0;
          }
          parent = parent.parentElement;
        }
      }
    }
  }, [viewMode, selectedCompanyId]);

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

  // 1. Base Output Computations (incorporating all live Production Bonuses)
  const baseCompaniesData = useMemo(() => {
    // Owner Management Skill production bonus across all portfolio facilities (+2% per effective level)
    const ownerBonusPct = ownerMgmtBonusPct || 0;

    return companies.map(comp => {
      const recipe = RECIPES.find(r => r.id === comp.itemCode) || RECIPES[0];

      // Regional & natural deposit bonuses from WarEra API (strategic + deposit + ethic)
      const depositBonusPct = comp.depositBonusPct ?? (comp.hasDepositBonus ? 30.0 : 0.0);
      const countryBonusPct = comp.countryBonusPct ?? (comp.productionBonusData?.strategicBonus ?? 5.5);
      const ethicBonusPct = comp.ethicBonusPct ?? (comp.productionBonusData?.ethicSpecializationBonus ?? 0.0);
      const regionalBonusPct = typeof comp.totalBonusPct === 'number'
        ? comp.totalBonusPct
        : (typeof comp.productionBonus === 'number'
            ? comp.productionBonus
            : (typeof comp.productionBonusData?.total === 'number'
                ? comp.productionBonusData.total
                : (depositBonusPct + countryBonusPct + ethicBonusPct)));

      // Facility Manager boost percentage (e.g. +16% for contracted Lv.8 facility manager)
      const managerBonusPct = comp.manager?.productionBonusPercent || (comp.manager?.managementLevel ? comp.manager.managementLevel * 2 : (comp.managerBonusPct ?? 0)) || 0;

      // Complete Production Bonus applied to Automated Engine: Regional + Owner Mgmt + Facility Manager
      const totalEngineBonusPct = regionalBonusPct + ownerBonusPct + managerBonusPct;
      const engineBonusMultiplier = 1 + (totalEngineBonusPct / 100);

      const disabled = isCompanyDisabled(comp);
      const engineTier = ENGINE_UPGRADE_TIERS.find(t => t.level === comp.engineLevel) || ENGINE_UPGRADE_TIERS[0];
      // Within-the-company calculations remain true and exact
      const effectiveEnginePph = engineTier.ppPerHour * engineBonusMultiplier;
      const engineDailyPp = effectiveEnginePph * 24;

      // v0.27+: employees with production stats, individual bonuses, and hourly outputs
      // Individual bonuses (tools, traits, individual morale) are strictly isolated to that worker
      // and NOT leaked globally to the engine or other companies.
      const employeesList = (comp.employees || comp.workers || []).map((w, idx) => {
        const bonusBreakdown = getWorkerIndividualBonusBreakdown(w, {
          ...comp,
          regionalBonusPct,
          managerBonusPct,
          manager: comp.manager
        }, ownerBonusPct);

        const totalProd = bonusBreakdown.baseProdStat;
        const hourlyWage = typeof w.wage === 'number'
          ? w.wage
          : (typeof w.salary === 'number' ? w.salary : (typeof w.estimate?.wage === 'number' ? w.estimate.wage : 0));
        const dailySalary = typeof w.salary === 'number' ? w.salary * 24 : hourlyWage * 24;

        const hourlyOutputPp = bonusBreakdown.hourlyOutputPp;
        const dailyOutputPp = bonusBreakdown.dailyOutputPp;

        const countryResolved = resolveCountry(w.nationality || w.nationalityCode || w.nationalityId || w.countryCode || w.country);
        const resolvedCountryCode = countryResolved?.code && countryResolved.code !== 'HQ' ? countryResolved.code : (w.countryCode || null);
        const resolvedCountryName = countryResolved?.name && countryResolved.code !== 'HQ' ? countryResolved.name : (w.countryName || null);

        return {
          ...w,
          id: w.id || w._id || `emp-${idx}`,
          totalProduction: totalProd,
          baseHourlyPp: bonusBreakdown.baseHourlyPp,
          hourlyWage,
          dailySalary,
          hourlyOutputPp,
          dailyOutputPp,
          individualBonusBreakdown: bonusBreakdown,
          totalBonusPct: bonusBreakdown.totalBonus,
          companyTotalBonusPct: regionalBonusPct,
          ownerMgmtBonusPct: ownerBonusPct,
          managerBonusPct,
          countryCode: resolvedCountryCode,
          countryName: resolvedCountryName,
          nationalityCode: resolvedCountryCode,
          nationalityName: resolvedCountryName,
          flagEmoji: countryResolved?.flag || (resolvedCountryCode ? getCountryFlag(resolvedCountryCode) : '🌐'),
        };
      });

      const totalWorkersHourlyPp = employeesList.reduce((sum, w) => sum + (w.hourlyOutputPp || 0), 0);
      const workersProducedDailyPp = employeesList.reduce((sum, w) => sum + (w.dailyOutputPp || 0), 0);
      const totalWorkerDailySalary = employeesList.reduce((sum, w) => sum + (w.dailySalary ?? 0), 0);

      // Total combined continuous production speed (Engine + Staff) with all bonuses
      const totalCombinedPph = effectiveEnginePph + totalWorkersHourlyPp;

      // Engine hardware daily PP
      const totalDailyEffectivePp = engineDailyPp;
      const unitsPerDay = recipe.pp > 0 ? (totalDailyEffectivePp / recipe.pp) : 0;

      // Storage holding capacity in units (exact warehouse size)
      const storageTier = STORAGE_UPGRADE_TIERS.find(t => t.level === comp.storageLevel) || STORAGE_UPGRADE_TIERS[0];
      const storageCapacityPp = storageTier.capacity;
      const storageCapacityUnits = recipe.pp > 0 ? (storageCapacityPp / recipe.pp) : 0;

      // Real-time live in-storage production accumulation (Combined Engine + Staff):
      const elapsedHours = Math.max(0, (liveTick - (comp.syncedAt || liveTick)) / 3600000);
      const liveAccumulatedPp = totalCombinedPph * elapsedHours;
      const currentStoredPp = Math.min(
        storageCapacityPp,
        Math.max(0, (comp.production || 0) + liveAccumulatedPp)
      );
      const storedReadyUnits = recipe.pp > 0 ? (currentStoredPp / recipe.pp) : 0;

      return {
        ...comp,
        recipe,
        depositBonusPct,
        countryBonusPct,
        ethicBonusPct,
        regionalBonusPct,
        totalBonusPct: regionalBonusPct,
        ownerMgmtBonusPct: ownerBonusPct,
        managerBonusPct,
        totalEngineBonusPct,
        bonusMultiplier: engineBonusMultiplier,
        engineTier,
        effectiveEnginePph,
        engineDailyPp,
        totalWorkersHourlyPp,
        workersProducedDailyPp,
        totalCombinedPph,
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
        storedReadyUnits,
        isDisabled: disabled
      };
    });
  }, [companies, liveTick, ownerMgmtBonusPct]);

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

      // Automated Engine effective speed (including Regional + Owner Mgmt + Facility Manager bonuses)
      const effectiveEnginePph = comp.effectiveEnginePph || ((comp.engineTier?.ppPerHour || comp.engineLevel || 1) * (comp.bonusMultiplier || 1));
      
      // AI Workforce effective speed (including Worker bonuses: Tool, Traits, Happiness, Specialization, Mgmt)
      const workersProducedDailyPp = comp.companyProducedDailyPp || comp.workersProducedDailyPp || 0;
      const workersHourlyPp = comp.totalWorkersHourlyPp || (workersProducedDailyPp / 24);

      // Total combined continuous production speed
      const totalCombinedPph = effectiveEnginePph + workersHourlyPp;

      // Precise Countdown incorporating all Production Bonuses:
      const isStorageFull = remainingPpToFull <= 0 || currentFillPct >= 100;
      const totalHoursUntilFull = isStorageFull 
        ? 0 
        : (totalCombinedPph > 0 ? (remainingPpToFull / totalCombinedPph) : 99999);

      // Exact time breakdown using total rounded minutes with full carry-over:
      const totalMinutesUntilFull = (isStorageFull || totalHoursUntilFull >= 99999)
        ? 0
        : Math.max(0, Math.round(totalHoursUntilFull * 60));

      const storageDaysOnly = Math.floor(totalMinutesUntilFull / 1440);
      const storageHoursRemainder = Math.floor((totalMinutesUntilFull % 1440) / 60);
      const storageMinutesRemainder = totalMinutesUntilFull % 60;

      // Engine-only benchmark comparison:
      const engineHoursUntilFull = isStorageFull 
        ? 0 
        : (effectiveEnginePph > 0 ? (remainingPpToFull / effectiveEnginePph) : 99999);
      const engineTotalMinutes = (isStorageFull || engineHoursUntilFull >= 99999)
        ? 0
        : Math.max(0, Math.round(engineHoursUntilFull * 60));
      const engineDaysOnly = Math.floor(engineTotalMinutes / 1440);
      const engineHoursRemainder = Math.floor((engineTotalMinutes % 1440) / 60);
      const engineMinutesRemainder = engineTotalMinutes % 60;

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
      const disabledComp = isCompanyDisabled(comp);
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
        storageExtraEngineHours = totalCombinedPph > 0 ? (storageExtraCapacity / totalCombinedPph) : 0;
      }

      // v0.27+ employees: pass through with context enrichment (Line workers only, managers are executive row entries)
      const rawWorkerList = (comp.employeesList || comp.employees || []).map(w => ({
        ...w,
        companyId: comp.id,
        companyName: comp.name,
        companyItemCode: comp.itemCode,
        recipe,
        spotPrice,
        individualBonusBreakdown: w.individualBonusBreakdown || getWorkerIndividualBonusBreakdown(w, comp, ownerBonusPct)
      }));

      const enrichedWorkers = [...rawWorkerList];
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
        isStorageFull,
        totalEngineBonusPct: comp.totalEngineBonusPct || 0,
        ownerMgmtBonusPct: comp.ownerMgmtBonusPct ?? ownerBonusPct,
        managerBonusPct: comp.managerBonusPct || 0,
        regionalBonusPct: comp.regionalBonusPct || 0,
        depositBonusPct: comp.depositBonusPct || 0,
        countryBonusPct: comp.countryBonusPct || 0,
        strategicBonus: comp.strategicBonus || 0,
        ethicBonusPct: comp.ethicBonusPct || 0,
        hasDepositBonus: comp.hasDepositBonus || false,
        effectiveEnginePph,
        workersHourlyPp,
        totalCombinedPph,
        totalHoursUntilFull,
        totalMinutesUntilFull,
        storageDaysOnly,
        storageHoursRemainder,
        storageMinutesRemainder,
        engineHoursUntilFull,
        engineDaysOnly,
        engineHoursRemainder,
        engineMinutesRemainder,
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

  // Guiding Product Theme (Grey, Green, Blue, Purple)
  const activeTheme = useMemo(() => getCompanyTheme(activeCompany), [activeCompany]);

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
        const workerNat = resolveCountry(w.nationality || w.nationalityCode || w.nationalityId || w.countryCode || w.country);
        const wCountryCode = workerNat?.code && workerNat.code !== 'HQ' ? workerNat.code : 'HQ';

        list.push({
          ...w,
          companyName: c.name,
          companyId: c.id,
          countryCode: wCountryCode,
          countryName: workerNat?.name || getCountryName(wCountryCode),
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
    const isFull = activeCompany?.isStorageFull || pct >= 100;

    if (isFull) {
      return {
        badgeText: 'Storage Full',
        badgeClass: 'bg-rose-200 text-rose-900 border border-rose-300 font-extrabold',
        timerColor: 'text-rose-700',
        bannerBg: 'bg-rose-500/15 border-rose-500/40 text-rose-950',
        liquidGradient: 'from-rose-600 via-red-600 to-rose-500',
        capColor: 'bg-rose-500',
      };
    }
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
      badgeClass: activeTheme.badgeBg || 'bg-emerald-100 text-emerald-800',
      timerColor: activeTheme.accentText || 'text-emerald-600',
      bannerBg: `${activeTheme.cardHeaderBg} border ${activeTheme.cardBorder}`,
      liquidGradient: activeTheme.liquidGradient || 'from-emerald-600 via-teal-500 to-cyan-500',
      capColor: 'opacity-90',
    };
  }, [activeCompany?.currentFillPct, activeCompany?.isStorageFull, activeTheme]);

  return (
    <div ref={topRef} className={`flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-8 select-none ${viewMode === 'details' ? 'py-2.5 sm:py-3 space-y-3' : 'py-6 space-y-8'}`}>
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
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            if (topRef.current?.parentElement) {
              topRef.current.parentElement.scrollTop = 0;
            }
          }}
          onRefreshLive={handleRefreshActiveCompany}
          isRefreshingLive={isRefreshingLive}
          managementLevel={managementLevel}
          maxHiringSlots={maxHiringSlots}
        />
      ) : (
        <div className="space-y-3 animate-in fade-in duration-150 font-sans">
          {/* Navigation Bar / Return to Stock Exchange Listing */}
          <div className="flex items-center justify-between gap-4 py-0.5">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setViewMode('listing')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 ${activeTheme.backButton} text-xs font-bold font-mono transition cursor-pointer group`}
              >
                <ArrowLeft className="w-4 h-4 opacity-80 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Stock Exchange Listing</span>
              </button>
              
              <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 font-mono">
                <span>/</span>
                <span className="font-bold text-slate-900 font-sans flex items-center gap-1">
                  {activeCompany.name}
                  {isCompanyDisabled(activeCompany) && (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 inline" title="Company Disabled" />
                  )}
                </span>
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${activeTheme.pillTag}`}>
                  {activeCompany.itemCode} • {activeTheme.label}
                </span>
              </div>
            </div>
          </div>

          {/* MAIN 2-COLUMN BALANCED GRID (5 COLS LEFT, 7 COLS RIGHT) MAXIMIZING VISIBLE SPACE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            
            {/* LEFT COLUMN (5 COLS): ASSET VALUATION BREAKDOWN & WAREHOUSE STORAGE */}
            <div className="contents lg:flex lg:flex-col lg:col-span-5 lg:space-y-4">
            {/* LEFT COLUMN: COMPANY INTRODUCTION (ASSET VALUATION BREAKDOWN STRUCTURE) */}
            <div className={`order-1 lg:order-none bg-white p-3.5 sm:p-4 border ${activeTheme.cardBorder} rounded-2xl shadow-xs space-y-2.5 relative overflow-hidden`}>
              {/* Top Accent Strip */}
              <div className="absolute top-0 inset-x-0 h-1" style={{ backgroundColor: activeTheme.accentColor }} />
              
              {/* Company Identity Header */}
              <div className="flex items-start justify-between gap-3 pb-1 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className={`w-9 h-9 flex items-center justify-center shrink-0 rounded-lg ${activeTheme.iconBox}`}>
                    <ItemIcon itemCode={activeCompany.itemCode} size={22} />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <h2 className="text-base font-extrabold text-slate-900 font-sans truncate">{activeCompany.name}</h2>
                      {isCompanyDisabled(activeCompany) && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 border border-rose-300 text-rose-700 text-[9px] font-mono font-bold uppercase rounded shrink-0" title="Company Disabled">
                          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                          <span>Disabled</span>
                        </span>
                      )}
                      <span className={`px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase rounded-sm ${activeTheme.pillTag}`}>
                        {activeCompany.itemCode}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      <span className="truncate">
                        {activeCompany.regionName} ({activeCompany.countryCode}){activeCompany.mainCity ? ` • ${activeCompany.mainCity}` : ''}
                      </span>
                      <span>•</span>
                      <span 
                        className={`font-bold shrink-0 cursor-help ${activeTheme.accentText}`}
                        title={activeCompany.productionBonusData ? `Strategic: +${activeCompany.strategicBonus}% | Ethics: +${activeCompany.ethicBonusPct}% | Deposit: +${activeCompany.depositBonusPct}%` : `Production Bonus: +${activeCompany.totalBonusPct.toFixed(1)}%`}
                      >
                        +{activeCompany.totalBonusPct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Asset Valuation Breakdown Structure */}
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between pb-1 font-sans border-b border-slate-100">
                  <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wide">
                    Asset Valuation Breakdown
                  </span>
                  <span className={`font-mono text-[11px] font-bold ${activeTheme.accentText}`}>
                    Engine Lv.{activeCompany.engineLevel} • Storage Lv.{activeCompany.storageLevel}
                  </span>
                </div>

                <div className="space-y-1 text-slate-600">
                  <div className="flex justify-between items-center py-0.5">
                    <span>Building Structure ({activeCompany.concreteInvested} Concrete):</span>
                    <strong className="text-slate-900 font-bold">{activeCompany.concreteInvestedVal.toFixed(0)}</strong>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span>Engine Lv.{activeCompany.engineLevel} Hardware:</span>
                    <strong className="text-slate-900 font-bold">{activeCompany.steelInEngine.toFixed(0)}</strong>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span>Storage Lv.{activeCompany.storageLevel} Hardware:</span>
                    <strong className="text-slate-900 font-bold">{activeCompany.steelInStorage.toFixed(0)}</strong>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span>Ready Yield in Storage ({activeCompany.uncollectedUnits.toFixed(1)} units):</span>
                    <strong className="text-amber-700 font-bold">{activeCompany.uncollectedValueCoins.toFixed(0)}</strong>
                  </div>
                  <div className="flex justify-between items-center pt-1 text-slate-900 font-bold">
                    <span>Total Asset Valuation:</span>
                    <span className={`font-black text-xs ${activeTheme.accentText}`}>
                      {activeCompany.totalCalculatedWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span>Hourly Growth:</span>
                    <span className={`font-black ${activeCompany.growth24hCoins > 0 ? 'text-emerald-500' : activeCompany.growth24hCoins < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                      {activeCompany.growth24hCoins >= 0 ? '+' : ''}{(activeCompany.growth24hCoins / 24).toFixed(2)} ({(activeCompany.growth24hPct / 24).toFixed(2)}%) past 1h
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span className="font-bold text-slate-800">Daily Production (PP):</span>
                    <div className="text-right">
                      <strong className="text-slate-900 font-mono">
                        {activeCompany.companyProducedDailyPp.toFixed(1)} PP/day
                      </strong>
                      <span className="text-[9px] text-emerald-700 block font-semibold">
                        Bonuses included
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-slate-600">
                    <span>Output Yield:</span>
                    <strong className="text-slate-900 font-mono">
                      {activeCompany.baseUnits.toFixed(1)} units/day
                    </strong>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-slate-600">
                    <span>Daily Gross Revenue:</span>
                    <strong className={`${
                      activeCompany.grossRevenue > 0 ? 'text-emerald-500' : activeCompany.grossRevenue < 0 ? 'text-red-500' : 'text-blue-500'
                    } font-mono`}>
                      {activeCompany.grossRevenue > 0 ? '+' : ''}{activeCompany.grossRevenue.toFixed(2)} BTC/day
                    </strong>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-slate-600">
                    <span>Daily Salaries Paid:</span>
                    <strong className={activeCompany.dailyLaborExpense > 0 ? "text-red-500 font-mono" : "text-blue-500 font-mono"}>
                      {activeCompany.dailyLaborExpense > 0 ? `-${activeCompany.dailyLaborExpense.toFixed(2)}` : '0.00'} BTC/day
                    </strong>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span className="font-bold text-slate-800">Daily Net Profit:</span>
                    <div className="text-right">
                      <strong className={`font-bold font-mono ${activeCompany.baseNetProfit > 0 ? 'text-emerald-500' : activeCompany.baseNetProfit < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                        {activeCompany.baseNetProfit >= 0 ? '+' : ''}{activeCompany.baseNetProfit.toFixed(2)} BTC/day
                      </strong>
                      <span className="text-[9px] text-slate-400 block font-normal">
                        {activeCompany.baseNetMarginPct ? `${activeCompany.baseNetMarginPct.toFixed(1)}% margin` : ''}
                      </span>
                    </div>
                  </div>
                  {(activeCompany.totalCostAvoided || 0) > 0 && (
                    <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-emerald-700 font-bold">
                      <span>Adjusted Net (Insourced):</span>
                      <strong className="font-mono">
                        +{activeCompany.adjustedNetProfit.toFixed(2)}/day (+{activeCompany.totalCostAvoided.toFixed(2)} saved)
                      </strong>
                    </div>
                  )}
                </div>
              </div>

            </div>

                        {/* FACILITY MANAGER SECTION (BETWEEN ASSET BREAKDOWN AND STORAGE) */}
            <div className={`order-2 lg:order-none bg-white p-3 sm:p-3.5 border ${activeTheme.cardBorder} rounded-2xl shadow-xs relative overflow-hidden`}>
              {/* Top Accent Strip */}
              <div className="absolute top-0 inset-x-0 h-1" style={{ backgroundColor: activeTheme.accentColor }} />
              
              {activeCompany.manager ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-amber-400/50 relative shrink-0 bg-slate-900 shadow-inner">
                      {activeCompany.manager.avatarUrl ? (
                        <img 
                          src={activeCompany.manager.avatarUrl} 
                          alt={activeCompany.manager.username || 'Manager'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-black text-amber-300 text-xs">
                          {(activeCompany.manager.username || 'M').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <span className="text-xs font-black text-slate-900 tracking-tight truncate font-sans">
                          {activeCompany.manager.username || activeCompany.manager.name || 'Facility Manager'}
                        </span>
                        {activeCompany.manager.level && (
                          <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0">
                            Lv.{activeCompany.manager.level}
                          </span>
                        )}
                        {activeCompany.manager.countryCode && (
                          <span className="text-xs shrink-0" title={activeCompany.manager.countryName || activeCompany.manager.countryCode}>
                            {getCountryFlag(activeCompany.manager.countryCode)}
                          </span>
                        )}
                        <span className="px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 text-[8px] font-mono font-black uppercase rounded shrink-0">
                          MANAGER
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                        <span>Mgmt Lv.{activeCompany.manager.managementLevel || 1}</span>
                        <span>•</span>
                        <span className="text-emerald-600 font-bold">
                          +{activeCompany.manager.productionBonusPercent || (activeCompany.manager.managementLevel * 2)}% Boost
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono shrink-0 pl-2">
                    <div className="text-xs font-black text-rose-500">
                      -{(activeCompany.manager.dailyWage || activeCompany.managerPay || 0).toFixed(2)} BTC/day
                    </div>
                    <div className="text-[10px] text-slate-400">
                      -{(activeCompany.manager.hourlyWage || (activeCompany.managerPay ? activeCompany.managerPay / 24 : 0)).toFixed(3)} BTC/h
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-slate-500 py-0.5">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-bold text-slate-700 font-sans">Facility Manager:</span>
                    <span className="text-slate-500">No Manager</span>
                  </div>
                  <span className="font-mono text-slate-400 text-[11px]">0.00 BTC/day</span>
                </div>
              )}
            </div>

            {/* 4. WAREHOUSE STORAGE (Mobile Order 4) */}
            <div className={`order-4 lg:order-none bg-white p-5 space-y-4 flex flex-col justify-between border ${activeTheme.cardBorder} rounded-2xl shadow-xs relative overflow-hidden`}>
              {/* Top Accent Strip */}
              <div className="absolute top-0 inset-x-0 h-1" style={{ backgroundColor: activeTheme.accentColor }} />
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">Warehouse Storage</span>
                  <h3 className="text-base font-extrabold text-slate-900 font-sans mt-0.5">
                    Storage Capacity & Combined Fill Timer
                  </h3>
                </div>
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${activeTheme.pillTag}`}>
                  {activeCompany.itemCode}
                </span>
              </div>

              {/* TIME UNTIL FULL BANNER */}
              <div className={`p-3.5 sm:p-4 rounded-xl border ${storageFillTheme.bannerBg} space-y-2`}>
                {/* Header & Status */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold block">
                    Time until storage is full (Engine + Staff):
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${storageFillTheme.badgeClass}`}>
                    {storageFillTheme.badgeText}
                  </span>
                </div>

                {/* Big Timer */}
                <div className={`text-2xl font-black font-mono ${storageFillTheme.timerColor} tracking-tight`}>
                  {activeCompany.isStorageFull || activeCompany.currentFillPct >= 100 ? (
                    'Storage Full'
                  ) : activeCompany.totalCombinedPph <= 0 ? (
                    'Production Inactive'
                  ) : activeCompany.storageDaysOnly > 0 ? (
                    `${activeCompany.storageDaysOnly}d ${activeCompany.storageHoursRemainder}h ${activeCompany.storageMinutesRemainder}m` 
                  ) : (
                    `${activeCompany.storageHoursRemainder}h ${activeCompany.storageMinutesRemainder}m`
                  )}
                </div>

                {/* Quick Summary Flow: Mobile 2-column flow vs Desktop inline pill */}
                <div className="sm:hidden grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                  <div className="bg-white/80 p-2 rounded-lg border border-slate-200/60">
                    <span className="text-[10px] text-slate-500 block font-sans">Production Speed:</span>
                    <strong className="text-slate-900 font-bold">+{(activeCompany.totalCombinedPph || 0).toFixed(2)} PP/h</strong>
                    <span className="text-[10px] text-slate-500 ml-1">({((activeCompany.totalCombinedPph || 0) * 24).toFixed(1)}/d)</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg border border-slate-200/60">
                    <span className="text-[10px] text-slate-500 block font-sans">Remaining Space:</span>
                    <strong className="text-slate-900 font-bold">{(activeCompany.remainingPpToFull ?? Math.max(0, activeCompany.storageCapacity - activeCompany.currentStoredPp)).toFixed(1)} PP</strong>
                    <span className="text-[10px] text-slate-500 ml-1">/ {activeCompany.storageCapacity} PP</span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center justify-between text-[11px] font-mono bg-white/70 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-slate-200/60 text-slate-700">
                  <span>
                    Speed: <strong className="text-slate-900">+{(activeCompany.totalCombinedPph || 0).toFixed(2)} PP/h</strong>
                    <span className="text-[10px] text-slate-500 ml-1">({((activeCompany.totalCombinedPph || 0) * 24).toFixed(1)}/d)</span>
                  </span>
                  <span>
                    Remaining: <strong className="text-slate-900">{(activeCompany.remainingPpToFull ?? Math.max(0, activeCompany.storageCapacity - activeCompany.currentStoredPp)).toFixed(1)} PP</strong>
                  </span>
                </div>
              </div>

              {/* PRODUCTION SPEED BREAKDOWN STRUCTURE (CLEAN, BORDERLESS ROWS, NO EMOJIS, EXACT ASSET VALUATION STYLE) */}
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between pb-1 font-sans border-b border-slate-100">
                  <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wide">
                    Production Speed Breakdown
                  </span>
                  <span className={`font-mono text-[11px] font-bold ${activeTheme.accentText}`}>
                    +{(activeCompany.totalCombinedPph || 0).toFixed(2)} PP/h total
                  </span>
                </div>

                <div className="space-y-1 text-slate-600">
                  {/* Automated Engine Breakdown */}
                  <div className="flex justify-between items-center py-0.5 text-slate-900 font-bold">
                    <span>Automated Engine (Lv.{activeCompany.engineLevel || 0}):</span>
                    <strong className="font-mono text-amber-700">
                      +{(activeCompany.effectiveEnginePph || 0).toFixed(2)} PP/h
                    </strong>
                  </div>
                  <div className="flex justify-between items-center py-0.5 pl-2 text-slate-600">
                    <span>Base Hardware:</span>
                    <strong className="font-mono text-slate-800">{(activeCompany.engineTier?.ppPerHour || 1).toFixed(2)} PP/h</strong>
                  </div>
                  {(activeCompany.ownerMgmtBonusPct || 0) > 0 && (
                    <div className="flex justify-between items-center py-0.5 pl-2 text-slate-600">
                      <span>Owner Management:</span>
                      <strong className="font-mono text-emerald-600">+{activeCompany.ownerMgmtBonusPct}%</strong>
                    </div>
                  )}
                  {(activeCompany.managerBonusPct || 0) > 0 && (
                    <div className="flex justify-between items-center py-0.5 pl-2 text-slate-600">
                      <span>Facility Manager:</span>
                      <strong className="font-mono text-emerald-600">+{activeCompany.managerBonusPct}%</strong>
                    </div>
                  )}
                  {(activeCompany.regionalBonusPct || 0) > 0 && (
                    <div className="flex justify-between items-center py-0.5 pl-2 text-slate-600">
                      <span>Regional Modifier:</span>
                      <strong className="font-mono text-emerald-600">+{activeCompany.regionalBonusPct}%</strong>
                    </div>
                  )}
                  {(activeCompany.totalEngineBonusPct || 0) > 0 && (
                    <div className="flex justify-between items-center py-0.5 pl-2 text-slate-500 text-[10px] border-t border-dashed border-slate-100">
                      <span># Calculation:</span>
                      <span className="font-mono text-slate-700">
                        {(activeCompany.engineTier?.ppPerHour || 1).toFixed(2)} PP/h × (1 + {(activeCompany.totalEngineBonusPct / 100).toFixed(2)}) = {(activeCompany.effectiveEnginePph || 0).toFixed(2)} PP/h
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-0.5 pl-2 text-slate-700 font-bold">
                    <span>Engine Total:</span>
                    <span className="font-mono text-amber-700">
                      +{(activeCompany.effectiveEnginePph || 0).toFixed(2)} PP/h
                      <span className="text-[10px] text-slate-400 font-normal ml-1">
                        ({((activeCompany.effectiveEnginePph || 0) * 24).toFixed(1)}/d)
                      </span>
                    </span>
                  </div>

                  {/* Line Workforce Breakdown */}
                  <div className="flex justify-between items-center pt-1.5 border-t border-slate-100 text-slate-900 font-bold">
                    <span>Line Workforce ({activeCompany.enrichedWorkers?.length || 0} assigned):</span>
                    <strong className="font-mono text-blue-700">
                      +{(activeCompany.workersHourlyPp || 0).toFixed(2)} PP/h
                    </strong>
                  </div>

                  {(!activeCompany.enrichedWorkers || activeCompany.enrichedWorkers.length === 0) ? (
                    <div className="text-[11px] text-slate-400 italic py-1 pl-2">
                      No line workers assigned. Output is driven exclusively by automated engine hardware.
                    </div>
                  ) : (
                    <div className="space-y-2 pt-0.5">
                      {activeCompany.enrichedWorkers.map((w, idx) => {
                        const b = w.individualBonusBreakdown || getWorkerIndividualBonusBreakdown(w, activeCompany, ownerMgmtBonusPct);
                        const hourlyOutputPp = b.hourlyOutputPp || 0;
                        const dailyOutputPp = b.dailyOutputPp || Number((hourlyOutputPp * 24).toFixed(1));

                        return (
                          <div key={w.id || idx} className="space-y-0.5 pt-1.5 border-t border-slate-100 first:border-t-0 first:pt-0">
                            {/* Worker Name (clean bold, no emojis) */}
                            <div className="flex justify-between items-center py-0.5 text-slate-900 font-bold">
                              <span>{w.name || `Employee #${idx + 1}`}</span>
                              <strong className="font-mono text-emerald-600">
                                +{hourlyOutputPp.toFixed(2)} PP/h
                              </strong>
                            </div>

                            {/* Base: PROD (PP/h) */}
                            <div className="flex justify-between items-center py-0.5 pl-2 text-slate-600">
                              <span>Base:</span>
                              <strong className="font-mono text-slate-800">
                                {b.baseProdStat} PROD ({b.baseHourlyPp.toFixed(2)} PP/h)
                              </strong>
                            </div>

                            {/* Modifiers (Tool, Traits, Morale, Specialization, Mgmt, Manager, Regional) */}
                            {b.toolBonus !== 0 && (
                              <div className="flex justify-between items-center py-0.5 pl-2 text-slate-600">
                                <span>Tool ({b.toolName || w.toolItem?.code || 'Equipped'}):</span>
                                <strong className={`font-mono ${b.toolBonus > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                  {b.toolBonus > 0 ? `+${b.toolBonus}%` : `${b.toolBonus}%`}
                                </strong>
                              </div>
                            )}

                            {b.traitBonus !== 0 && (
                              <div className="flex justify-between items-center py-0.5 pl-2 text-slate-600">
                                <span>Traits:</span>
                                <strong className={`font-mono ${b.traitBonus > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                  {b.traitBonus > 0 ? `+${b.traitBonus}%` : `${b.traitBonus}%`}
                                </strong>
                              </div>
                            )}

                            {b.hapBonus !== 0 && (
                              <div className="flex justify-between items-center py-0.5 pl-2 text-slate-600">
                                <span>Morale ({typeof w.happiness === 'number' ? w.happiness : 50}%):</span>
                                <strong className={`font-mono ${b.hapBonus > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                  {b.hapBonus > 0 ? `+${b.hapBonus}%` : `${b.hapBonus}%`}
                                </strong>
                              </div>
                            )}

                            {b.specBonus !== 0 && (
                              <div className="flex justify-between items-center py-0.5 pl-2 text-slate-600">
                                <span>Specialization:</span>
                                <strong className={`font-mono ${b.specBonus > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                  {b.specBonus > 0 ? `+${b.specBonus}%` : `${b.specBonus}%`}
                                </strong>
                              </div>
                            )}

                            {b.mgmtBonus !== 0 && (
                              <div className="flex justify-between items-center py-0.5 pl-2 text-slate-600">
                                <span>Owner Management:</span>
                                <strong className={`font-mono ${b.mgmtBonus > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                  {b.mgmtBonus > 0 ? `+${b.mgmtBonus}%` : `${b.mgmtBonus}%`}
                                </strong>
                              </div>
                            )}

                            {b.managerBonus !== 0 && (
                              <div className="flex justify-between items-center py-0.5 pl-2 text-slate-600">
                                <span>Facility Manager:</span>
                                <strong className={`font-mono ${b.managerBonus > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                  {b.managerBonus > 0 ? `+${b.managerBonus}%` : `${b.managerBonus}%`}
                                </strong>
                              </div>
                            )}

                            {b.regionalBonus !== 0 && (
                              <div className="flex justify-between items-center py-0.5 pl-2 text-slate-600">
                                <span>Regional Modifier:</span>
                                <strong className={`font-mono ${b.regionalBonus > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                  {b.regionalBonus > 0 ? `+${b.regionalBonus}%` : `${b.regionalBonus}%`}
                                </strong>
                              </div>
                            )}

                            {/* #show calculation */}
                            <div className="flex justify-between items-center py-0.5 pl-2 text-slate-500 text-[10px] border-t border-dashed border-slate-100">
                              <span># Calculation:</span>
                              <span className="font-mono text-slate-700">
                                {b.baseHourlyPp.toFixed(2)} PP/h × (1 {b.totalBonus >= 0 ? '+' : '-'} {Math.abs(b.totalBonus)}%) = {hourlyOutputPp.toFixed(2)} PP/h
                              </span>
                            </div>

                            {/* total pp/hr */}
                            <div className="flex justify-between items-center py-0.5 pl-2 text-slate-700 font-bold">
                              <span>Total PP/h:</span>
                              <span className="font-mono text-emerald-600">
                                +{hourlyOutputPp.toFixed(2)} PP/h
                                <span className="text-[10px] text-slate-400 font-normal ml-1">
                                  ({dailyOutputPp.toFixed(1)} PP/day)
                                </span>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Active Facility Modifiers (Only shown if present and > 0, else no show) */}
                  {Boolean(
                    (activeCompany.hasDepositBonus && (activeCompany.depositBonusPct || 0) > 0) ||
                    ((activeCompany.countryBonusPct || activeCompany.strategicBonus || 0) > 0) ||
                    ((activeCompany.ethicBonusPct || 0) > 0)
                  ) && (
                    <div className="space-y-0.5 pt-1.5 border-t border-slate-100 text-slate-600">
                      <div className="py-0.5 text-slate-900 font-bold">
                        <span>Active Facility Modifiers:</span>
                      </div>
                      {activeCompany.hasDepositBonus && (activeCompany.depositBonusPct || 0) > 0 && (
                        <div className="flex justify-between items-center py-0.5 pl-2">
                          <span>Rich Natural Deposit:</span>
                          <strong className="font-mono text-emerald-600">+{activeCompany.depositBonusPct}%</strong>
                        </div>
                      )}
                      {(activeCompany.countryBonusPct || activeCompany.strategicBonus || 0) > 0 && (
                        <div className="flex justify-between items-center py-0.5 pl-2">
                          <span>Strategic Core Region:</span>
                          <strong className="font-mono text-emerald-600">+{activeCompany.countryBonusPct || activeCompany.strategicBonus}%</strong>
                        </div>
                      )}
                      {(activeCompany.ethicBonusPct || 0) > 0 && (
                        <div className="flex justify-between items-center py-0.5 pl-2">
                          <span>Ethic Affinity:</span>
                          <strong className="font-mono text-emerald-600">+{activeCompany.ethicBonusPct}%</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fill Math Reconciliation */}
                  <div className="flex justify-between items-center pt-1.5 border-t border-slate-100 text-slate-600">
                    <span className="font-bold text-slate-800">Storage Fill Math:</span>
                    <span className="font-mono text-slate-700 text-[10px]">
                      {(activeCompany.remainingPpToFull ?? Math.max(0, activeCompany.storageCapacity - activeCompany.currentStoredPp)).toFixed(1)} PP ÷ {(activeCompany.totalCombinedPph || 0).toFixed(2)} PP/h = {
                        activeCompany.isStorageFull || activeCompany.currentFillPct >= 100 
                          ? '0.0h (Full)'
                          : activeCompany.totalCombinedPph > 0 
                            ? `${((activeCompany.remainingPpToFull ?? Math.max(0, activeCompany.storageCapacity - activeCompany.currentStoredPp)) / activeCompany.totalCombinedPph).toFixed(2)} hrs`
                            : 'Inactive'
                      }
                    </span>
                  </div>
                </div>
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
            </div>

            {/* RIGHT COLUMN (7 COLS): WORKFORCE ROSTER (FIFA CAROUSEL) & UNIT ECONOMICS */}
            <div className="contents lg:flex lg:flex-col lg:col-span-7 lg:space-y-4">
            {/* RIGHT COLUMN: SLEEK FIFA-STYLE EMPLOYEE SHOWCASE (CLASSY MODERN LUXURY STADIUM THEME) */}
            <div className={`order-3 lg:order-none bg-gradient-to-b from-slate-900 via-[#0a0f1d] to-slate-950 border ${activeTheme.accentBorder || 'border-slate-800'} rounded-2xl p-3.5 sm:p-4 space-y-2.5 flex flex-col justify-between text-white shadow-2xl relative overflow-hidden`}>
              
              {/* Ambient Top Radiance guided by company theme */}
              <div className={`absolute top-0 inset-x-0 h-48 ${activeTheme.stadiumGlow} pointer-events-none`} />

              {/* FIFA TRADING CARD CONTAINER & OUTSIDE PRODUCTION BREAKDOWN */}
              <div className="relative z-10 flex-1 flex flex-col justify-center space-y-3">
                {activeCompany.enrichedWorkers.length > 0 && currentWorker ? (
                  <>
                    <WorkforceFifaCarousel
                      workers={activeCompany.enrichedWorkers}
                      company={activeCompany}
                      portfolioWorkers={allPortfolioWorkers}
                      portfolioCompanies={analyzedCompanies}
                      onSelectCompany={(compId) => setSelectedCompanyId(compId)}
                      activeWorkerIdx={validWorkerIdx}
                      onWorkerChange={(newIdx) => setActiveWorkerIdx(newIdx)}
                      activeTheme={activeTheme}
                    />

                    {/* 2. PRODUCTION BREAKDOWN (OUTSIDE THE CARD) */}
                    <EmployeeProductionBreakdown 
                      key={currentWorker.userId || currentWorker.id || validWorkerIdx}
                      worker={currentWorker}
                      company={activeCompany}
                      className="animate-in fade-in duration-300"
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

            {/* 5. UNIT ECONOMICS & HARDWARE UPGRADES (Mobile Order 5) */}
            <div className={`order-5 lg:order-none bg-white p-5 space-y-4 flex flex-col justify-between border ${activeTheme.cardBorder} rounded-2xl shadow-xs relative overflow-hidden`}>
              {/* Top Accent Strip */}
              <div className="absolute top-0 inset-x-0 h-1" style={{ backgroundColor: activeTheme.accentColor }} />
              
              {/* UNIT ECONOMICS BREAKDOWN STRUCTURE */}
              <div className="space-y-3 font-mono text-xs flex-1 flex flex-col justify-around">
                <div className="flex items-center justify-between pb-1 font-sans">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">Unit Economics</span>
                    <h3 className="text-base font-extrabold text-slate-900 font-sans mt-0.5">
                      Production Cost & Margin Analysis
                    </h3>
                  </div>
                  <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-full ${activeTheme.badgeBg}`}>
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

                  <div className={`flex justify-between items-center p-2.5 rounded-xl ${activeTheme.cardHeaderBg} font-bold`}>
                    <span className="font-sans font-extrabold">Net Profit Per Unit:</span>
                    <span className={`font-black text-sm font-mono ${activeTheme.accentText}`}>
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

              {/* HARDWARE UPGRADES */}
              {activeCompany.nextEngineTier && (
                <div className={`p-3.5 rounded-xl space-y-2 ${activeTheme.cardHeaderBg} border ${activeTheme.cardBorder}`}>
                  <div className="flex items-center justify-between text-slate-800 font-bold text-xs">
                    <span>Next Automated Engine Level (Lv.{activeCompany.engineLevel + 1})</span>
                    <span className={`font-mono font-bold ${activeTheme.accentText}`}>+24 PP / day</span>
                  </div>

                  {/* Mobile Flow View (Clean, non-wordy analytical 2x2 grid) */}
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono sm:hidden">
                    <div className="bg-white/80 p-2 rounded-lg border border-slate-200/60 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-500 font-sans font-medium">Hardware Cost</span>
                      <strong className="text-slate-900 text-xs font-bold mt-0.5">
                        {activeCompany.engineUpgradeSteel} Steel
                        <span className="block text-[10px] font-normal text-slate-500">({activeCompany.engineUpgradeCoins.toFixed(1)} BTC)</span>
                      </strong>
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-slate-200/60 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-500 font-sans font-medium">Speed Boost</span>
                      <strong className="text-amber-700 text-xs font-bold mt-0.5">
                        +1.0 PP/h
                        <span className="block text-[10px] font-normal text-slate-500">(+24 PP/day)</span>
                      </strong>
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-slate-200/60 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-500 font-sans font-medium">Extra Net Profit</span>
                      <strong className="text-emerald-600 text-xs font-bold mt-0.5">
                        +{activeCompany.engineExtraProfitDaily.toFixed(1)} BTC/d
                      </strong>
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-slate-200/60 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-500 font-sans font-medium">Payback Horizon</span>
                      <strong className="text-slate-900 text-xs font-bold mt-0.5">
                        {activeCompany.enginePaybackDays.toFixed(0)} days
                      </strong>
                    </div>
                  </div>

                  {/* Desktop Narrative Paragraph (Preserved 100% on PC view) */}
                  <div className="hidden sm:block space-y-1">
                    <p className="text-xs text-slate-600 font-sans">
                      Upgrading costs <strong>{activeCompany.engineUpgradeSteel} Steel</strong> ({activeCompany.engineUpgradeCoins.toFixed(1)} BTC). Gives you +1 PP/hour (+24 PP/day), generating <strong className={activeTheme.accentText}>+{activeCompany.engineExtraProfitDaily.toFixed(1)} BTC/day</strong> extra net profit.
                    </p>
                    <div className={`text-[11px] font-mono font-bold pt-0.5 ${activeTheme.accentText}`}>
                      Recoups its upgrade cost in {activeCompany.enginePaybackDays.toFixed(0)} days.
                    </div>
                  </div>
                </div>
              )}

            </div>
            </div>

          </div>
        </div>
      )}





    </div>
  );
}
