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
import EmployeeAuditModal from './EmployeeAuditModal';

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
    employees: [],
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
    employees: [],
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
    employees: [],
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
  // Inspected worker for modal audit breakdown
  const [inspectedWorker, setInspectedWorker] = useState(null);

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
      const enrichedWorkers = (comp.employeesList || comp.employees || []).map(w => ({
        ...w,
        companyId: comp.id,
        companyName: comp.name,
        companyItemCode: comp.itemCode,
        recipe,
        spotPrice,
      }));

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

  // Safe active worker index for carousel
  const validWorkerIdx = Math.min(
    activeWorkerIdx,
    Math.max(0, (activeCompany?.enrichedWorkers?.length || 1) - 1)
  );
  const currentWorker = activeCompany?.enrichedWorkers?.[validWorkerIdx];

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

            {/* RIGHT COLUMN: SLEEK FIFA-STYLE EMPLOYEE CARD & CAROUSEL */}
            <div className="lg:col-span-7 bg-white p-5 space-y-4 flex flex-col justify-between">
              
              {/* Carousel Navigation Header */}
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-extrabold text-slate-900 font-sans tracking-tight">
                    Workforce Roster ({activeCompany.enrichedWorkers.length}/{activeCompany.maxEmployees ?? 0})
                  </h3>
                </div>

                {/* Visible Carousel Navigation */}
                {activeCompany.enrichedWorkers.length > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveWorkerIdx(prev => (prev > 0 ? prev - 1 : activeCompany.enrichedWorkers.length - 1))}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                      title="Previous Employee"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>

                    {/* Pagination Indicator Dots */}
                    <div className="flex items-center gap-1.5 px-1">
                      {activeCompany.enrichedWorkers.map((_, dotIdx) => (
                        <button
                          key={dotIdx}
                          type="button"
                          onClick={() => setActiveWorkerIdx(dotIdx)}
                          className={`h-2 rounded-full transition-all cursor-pointer ${
                            dotIdx === validWorkerIdx 
                              ? 'bg-amber-500 w-4 shadow-sm' 
                              : 'bg-slate-300 hover:bg-slate-400 w-2'
                          }`}
                          title={`Go to employee ${dotIdx + 1}`}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveWorkerIdx(prev => (prev < activeCompany.enrichedWorkers.length - 1 ? prev + 1 : 0))}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                      title="Next Employee"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* FIFA TRADING CARD CONTAINER (COMPACT, NOT TOO WIDE) */}
              <div className="flex-1 flex flex-col justify-center">
                {activeCompany.enrichedWorkers.length > 0 && currentWorker ? (() => {
                  const theme = getItemClassificationTheme(activeCompany.itemCode);
                  const countryCode = currentWorker.countryCode || currentWorker.nationalityCode || (typeof currentWorker.nationality === 'string' && currentWorker.nationality.length === 2 ? currentWorker.nationality : null) || activeCompany.countryCode || 'HQ';
                  const flagEmoji = getCountryFlag(countryCode);
                  const netDailyProfit = (typeof currentWorker.dailyProfit === 'number' ? currentWorker.dailyProfit : ((currentWorker.dailyProductionValue || 0) - (currentWorker.dailyWage || 0)));
                  const workerDailyPp = (currentWorker.dailyOutputPp || (currentWorker.hourlyOutputPp ? currentWorker.hourlyOutputPp * 24 : 0));
                  const workerHourlyPp = (currentWorker.hourlyOutputPp || (workerDailyPp / 24));
                  
                  const positiveTraits = (currentWorker.traits || []).filter(t => !getTraitInfo(t.code || t).isNegative);
                  const negativeTraits = (currentWorker.traits || []).filter(t => getTraitInfo(t.code || t).isNegative);

                  return (
                    <div className="max-w-[390px] w-full mx-auto">
                      <div className={`relative rounded-2xl p-4.5 bg-gradient-to-b ${theme.cardBg} border ${theme.cardBorder} text-white shadow-xl transition-all duration-300 overflow-hidden`}>
                        {/* Shimmer / Holographic Card Glow Overlay */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-40" />

                        {/* TOP HEADER: Rating, Nationality & Portrait */}
                        <div className="flex items-start justify-between relative z-10 mb-2">
                          {/* Left Rating Stack */}
                          <div className="flex flex-col items-start">
                            <div className="flex items-baseline gap-1">
                              <span className={`text-2xl font-black font-mono tracking-tight ${netDailyProfit >= 0 ? 'text-amber-300' : 'text-rose-400'} drop-shadow`}>
                                {netDailyProfit >= 0 ? '+' : ''}{netDailyProfit.toFixed(2)}
                              </span>
                              <span className="text-[10px] font-black text-amber-400/90 font-mono">BTC/d</span>
                            </div>
                            <span className="text-[9px] font-black tracking-widest uppercase text-slate-300">
                              NET PROFIT
                            </span>
                            <div className="mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-[10px] font-mono font-bold">
                              <span className="text-sm">{flagEmoji}</span>
                              <span className="text-slate-200">{countryCode.toUpperCase()}</span>
                            </div>
                          </div>

                          {/* Center / Right: Worker Portrait & Gender */}
                          <div className="relative flex flex-col items-center">
                            <div className={`w-20 h-20 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-b ${theme.headerGrad} shadow-lg ring-2 ${theme.ringColor}`}>
                              {currentWorker.avatarUrl ? (
                                <img 
                                  src={currentWorker.avatarUrl} 
                                  alt={currentWorker.name || currentWorker.username} 
                                  className="w-full h-full object-cover rounded-[14px]"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              ) : (
                                <WorkerSilhouette gender={currentWorker.gender || 'male'} className="w-full h-full bg-slate-900 rounded-[14px]" />
                              )}
                            </div>
                            {/* Gender & Age Badge */}
                            <div className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-slate-950/90 border border-white/20 text-[10px] font-mono font-bold flex items-center gap-1 shadow">
                              <span className={currentWorker.gender === 'female' ? 'text-pink-400' : 'text-blue-400'}>
                                {currentWorker.gender === 'female' ? '♀' : '♂'}
                              </span>
                              <span className="text-slate-200">{currentWorker.age ? `${currentWorker.age}y` : 'AI'}</span>
                            </div>
                          </div>
                        </div>

                        {/* WORKER NAME & COMPANY BADGE */}
                        <div className="text-center mt-3 pt-1 relative z-10">
                          <h4 className="text-base font-black uppercase tracking-wider text-white drop-shadow font-sans truncate">
                            {currentWorker.name || currentWorker.username || 'AI Specialist'}
                          </h4>
                          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-300 mt-0.5">
                            <span className="opacity-75">Assigned to:</span>
                            <span className="font-bold text-amber-200 underline decoration-amber-400/40 truncate max-w-[180px]">
                              {activeCompany.name}
                            </span>
                            <span className="text-[10px] opacity-80">({activeCompany.itemCode})</span>
                          </div>
                        </div>

                        {/* CORE SKILLS - FIFA 5-STAT GRID */}
                        <div className="grid grid-cols-5 gap-1.5 my-3 relative z-10 text-center font-mono">
                          <div className="bg-black/35 backdrop-blur-sm rounded-lg p-1.5 border border-white/10" title="Production Stat (Total)">
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-sans">PROD</span>
                            <span className="text-xs font-black text-amber-300">
                              ⛏️ {currentWorker.breakdown?.production?.total ?? ((currentWorker.baseProduction || 0) + (currentWorker.trainedProduction || 0))}
                            </span>
                          </div>
                          <div className="bg-black/35 backdrop-blur-sm rounded-lg p-1.5 border border-white/10" title="Luck Stat">
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-sans">LUCK</span>
                            <span className="text-xs font-black text-emerald-400">
                              🍀 {currentWorker.breakdown?.luck?.total ?? (currentWorker.luck || 0)}
                            </span>
                          </div>
                          <div className="bg-black/35 backdrop-blur-sm rounded-lg p-1.5 border border-white/10" title="Happiness Morale">
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-sans">HAP</span>
                            <span className="text-xs font-black text-yellow-300">
                              😊 {currentWorker.happinessBreakdown?.value ?? (currentWorker.happiness || 50)}%
                            </span>
                          </div>
                          <div className="bg-black/35 backdrop-blur-sm rounded-lg p-1.5 border border-white/10" title="Production Bonus">
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-sans">BONUS</span>
                            <span className="text-xs font-black text-blue-300">
                              ⚡ +{currentWorker.productionBonus?.total ?? currentWorker.productionBonus ?? currentWorker.productionBonusData?.total ?? 0}%
                            </span>
                          </div>
                          <div className="bg-black/35 backdrop-blur-sm rounded-lg p-1.5 border border-white/10" title="Responsibility / Growth Potential">
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-sans">RESP</span>
                            <span className="text-xs font-black text-purple-300">
                              💬 {currentWorker.potential ?? currentWorker.breakdown?.responsibility?.total ?? 0}
                            </span>
                          </div>
                        </div>

                        {/* TRAITS (SEPARATED: POSITIVE & NEGATIVE) */}
                        {Array.isArray(currentWorker.traits) && currentWorker.traits.length > 0 && (
                          <div className="space-y-1.5 my-2.5 relative z-10">
                            {/* Positive Traits */}
                            {positiveTraits.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 justify-center">
                                {positiveTraits.map((t, idx) => {
                                  const info = getTraitInfo(t.code || t);
                                  return (
                                    <span
                                      key={`pos-${idx}`}
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm backdrop-blur-sm border ${
                                        info.isCoworkerLinked 
                                          ? 'bg-amber-500/20 text-amber-200 border-amber-500/50' 
                                          : 'bg-emerald-500/20 text-emerald-200 border-emerald-500/50'
                                      }`}
                                      title={`${info.name}: ${info.description} ${info.isCoworkerLinked ? '• Links to Coworkers' : ''}`}
                                    >
                                      <span>★</span>
                                      <span>{info.name}</span>
                                      {info.isCoworkerLinked && <span className="text-[8px] opacity-80">(Team)</span>}
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            {/* Negative Traits */}
                            {negativeTraits.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 justify-center">
                                {negativeTraits.map((t, idx) => {
                                  const info = getTraitInfo(t.code || t);
                                  return (
                                    <span
                                      key={`neg-${idx}`}
                                      className="px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm backdrop-blur-sm bg-rose-500/25 text-rose-200 border border-rose-500/60"
                                      title={`${info.name}: ${info.description}`}
                                    >
                                      <span>⚠️</span>
                                      <span>{info.name}</span>
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* TOOL HARDWARE IF EQUIPPED */}
                        {(currentWorker.toolItem || currentWorker.tool || currentWorker._raw?.toolItem) && (
                          <div className="my-2 p-2 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10 text-[10px] flex items-center justify-between font-mono relative z-10">
                            <div className="flex items-center gap-1.5 font-bold text-sky-200">
                              <span>🔧</span>
                              <span>{(currentWorker.toolItem?.code || currentWorker.tool?.code || currentWorker._raw?.toolItem?.code || 'Tool')}</span>
                              <span className="text-emerald-400">
                                +{currentWorker.toolItem?.skills?.production ?? currentWorker.toolStatus?.bonusPercent ?? 0}% Prod
                              </span>
                            </div>
                            <span className="text-slate-400">
                              State: {(currentWorker.toolItem?.state || currentWorker.tool?.state || 100).toFixed(0)}/100
                            </span>
                          </div>
                        )}

                        {/* PRODUCTION & FINANCIALS BREAKDOWN (PROMINENT) */}
                        <div className="mt-3 p-2.5 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 space-y-1.5 font-mono text-xs relative z-10">
                          <div className="flex justify-between items-center text-slate-300">
                            <span className="font-sans text-[11px]">Daily Production Rate:</span>
                            <strong className="text-amber-300 text-xs font-black">
                              {workerDailyPp.toFixed(1)} PP/day
                              <span className="text-[10px] text-slate-400 ml-1 font-normal font-sans">({workerHourlyPp.toFixed(2)}/h)</span>
                            </strong>
                          </div>
                          <div className="flex justify-between items-center text-slate-300">
                            <span className="font-sans text-[11px]">Gross Production Value:</span>
                            <strong className="text-emerald-400 font-bold">
                              +{(currentWorker.dailyProductionValue || 0).toFixed(2)} BTC/d
                            </strong>
                          </div>
                          <div className="flex justify-between items-center text-slate-300">
                            <span className="font-sans text-[11px]">Contracted Wage:</span>
                            <strong className="text-rose-400 font-bold">
                              -{(currentWorker.dailyWage || currentWorker.dailySalary || 0).toFixed(2)} BTC/d
                            </strong>
                          </div>
                          <div className="flex justify-between items-center pt-1.5 border-t border-white/10 text-white font-bold">
                            <span className="font-sans text-[11px]">Net Daily Profit:</span>
                            <strong className={`font-mono text-xs ${netDailyProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {netDailyProfit >= 0 ? '+' : ''}{netDailyProfit.toFixed(2)} BTC/d
                            </strong>
                          </div>
                        </div>

                        {/* AUDIT BUTTON */}
                        <button
                          type="button"
                          onClick={() => setInspectedWorker({
                            ...currentWorker,
                            companyName: activeCompany.name,
                            companyItemCode: activeCompany.itemCode,
                            companyTotalBonusPct: activeCompany.totalBonusPct,
                            recipe: activeCompany.recipe,
                            spotPrice: activeCompany.spotPrice,
                            baseRawCostPerUnit: activeCompany.baseRawCostPerUnit
                          })}
                          className="w-full mt-3 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 text-xs font-mono font-black transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer relative z-10"
                        >
                          <span>Audit Skills, Morale & Traits Math</span>
                          <span>↗</span>
                        </button>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="p-8 flex flex-col justify-center items-center text-center space-y-2 bg-slate-50 rounded-2xl">
                    <Users className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                    <span className="text-xs font-bold text-slate-700 block">No Employees Assigned</span>
                    <p className="text-xs text-slate-500 font-sans max-w-[260px] leading-relaxed">
                      Break Room Lv.{activeCompany.breakRoomLevel ?? 0} supports up to {activeCompany.maxEmployees ?? 0} worker{(activeCompany.maxEmployees ?? 0) === 1 ? '' : 's'}. Automated engine generates {(activeCompany.engineTier?.ppPerHour ? activeCompany.engineTier.ppPerHour * 24 : 24)} PP/day at 0 wage cost.
                    </p>
                  </div>
                )}
              </div>

              {/* COMBINED OVERVIEW: RENDER ONLY IF MULTIPLE WORKERS (> 1) */}
              {activeCompany.enrichedWorkers.length > 1 && combinedWorkforceStats && (
                <div className="p-3 rounded-xl bg-slate-50 text-xs font-mono text-slate-600 space-y-1.5">
                  <div className="flex items-center justify-between pb-1 font-sans">
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                      Combined Workforce ({activeCompany.enrichedWorkers.length} Employees)
                    </span>
                    <span className="font-black text-xs text-emerald-700">
                      Net: {combinedWorkforceStats.combinedDailyProfit >= 0 ? '+' : ''}{combinedWorkforceStats.combinedDailyProfit.toFixed(2)} BTC/d
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-1.5 bg-white rounded-lg shadow-sm">
                      <span className="text-[10px] text-slate-400 block font-sans">Total Output</span>
                      <strong className="text-slate-900 font-mono">{(activeCompany.companyProducedDailyPp || combinedWorkforceStats.totalOutputPp).toFixed(1)} PP/d</strong>
                    </div>
                    <div className="p-1.5 bg-white rounded-lg shadow-sm">
                      <span className="text-[10px] text-slate-400 block font-sans">Daily Salaries</span>
                      <strong className="text-rose-500 font-mono">-{combinedWorkforceStats.combinedDailySalary.toFixed(2)}/d</strong>
                    </div>
                    <div className="p-1.5 bg-white rounded-lg shadow-sm">
                      <span className="text-[10px] text-slate-400 block font-sans">Combined Profit</span>
                      <strong className="text-emerald-600 font-mono">+{combinedWorkforceStats.combinedDailyProfit.toFixed(2)}/d</strong>
                    </div>
                  </div>
                </div>
              )}

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
                  {activeCompany.uncollectedUnits.toFixed(1)} units (+{activeCompany.uncollectedValueCoins.toFixed(2)} BTC)
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

                  {/* PLAIN-ENGLISH ECONOMIC SUMMARY CALLOUT */}
                  <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 text-xs font-sans space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Executive Economics Summary</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Every unit of <strong>{activeCompany.recipeName || activeCompany.itemCode}</strong> sells on the spot market for <strong>{activeCompany.spotPrice.toFixed(3)} BTC</strong>. After paying <strong>{activeCompany.baseLaborCostPerUnit.toFixed(3)} BTC</strong> in workforce wages{activeCompany.baseRawCostPerUnit > 0 ? ` and ${activeCompany.baseRawCostPerUnit.toFixed(3)} BTC in raw materials` : ''}, your company pockets <strong>+{activeCompany.baseNetProfitPerUnit.toFixed(3)} BTC pure profit</strong> per unit ({activeCompany.baseNetMarginPct ? activeCompany.baseNetMarginPct.toFixed(1) : 0}% net margin).
                    </p>
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



      {/* Dedicated Employee Mathematical Audit Modal */}
      {inspectedWorker && (
        <EmployeeAuditModal
          isOpen={Boolean(inspectedWorker)}
          onClose={() => setInspectedWorker(null)}
          worker={inspectedWorker}
        />
      )}

    </div>
  );
}
