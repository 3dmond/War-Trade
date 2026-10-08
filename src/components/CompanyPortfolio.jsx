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
import { RECIPES, ENGINE_UPGRADE_TIERS, STORAGE_UPGRADE_TIERS, getSkillValue } from '../data/gameData';
import { api, FALLBACK_WAGE_STATS } from '../services/wareraApi';
import { calculatePortfolioOverview } from '../data/marketMath';
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

// Preset companies demonstrating supply chain linkages & employee profiles
const DEFAULT_COMPANIES = [
  {
    id: 'c1',
    name: 'Vanguard Munitions Plant',
    itemCode: 'heavyAmmo',
    engineLevel: 4,
    storageLevel: 3,
    production: 180.0,
    concreteInvested: 250,
    regionName: 'Ecuadorian Sierra',
    countryCode: 'EC',
    hasDepositBonus: false,
    countryBonusPct: 10.0,
    ethicBonusPct: 30.0,
    totalBonusPct: 40.0,
    estimatedValue: 1850,
    workers: [
      {
        id: 'w-1',
        userId: '6a68c590bcfca7e78bdc0570',
        username: 'Xr_7ut',
        level: 17,
        avatarUrl: 'https://media.warera.io/avatars/6a68c590bcfca7e78bdc0570-1785360785461-zksfg4f7.jpg',
        productionSkill: 10,
        productionPointsBase: 40,
        energySkill: 10,
        energyPointsTotal: 100,
        loyaltyBonus: 10,
        wagePerPp: 0.129,
        isRealPlayer: true,
        isSimulated: false
      },
      {
        id: 'w-2',
        userId: '68373ebe842134b2efcfd795',
        username: 'DonPelayo',
        level: 8,
        avatarUrl: null,
        productionSkill: 8,
        productionPointsBase: 34,
        energySkill: 8,
        energyPointsTotal: 80,
        loyaltyBonus: 5,
        wagePerPp: 0.145,
        isRealPlayer: true,
        isSimulated: false
      }
    ],
    isSelfWorking: false
  },
  {
    id: 'c2',
    name: 'Red River Lead Extract',
    itemCode: 'lead',
    engineLevel: 3,
    storageLevel: 3,
    production: 220.0,
    concreteInvested: 180,
    regionName: 'Ecuadorian Sierra',
    countryCode: 'EC',
    hasDepositBonus: false,
    countryBonusPct: 21.0,
    ethicBonusPct: 30.0,
    totalBonusPct: 51.0,
    estimatedValue: 1150,
    workers: [
      {
        id: 'w-3',
        username: 'MiningBaron',
        level: 5,
        productionSkill: 7,
        productionPointsBase: 31,
        energySkill: 8,
        energyPointsTotal: 80,
        loyaltyBonus: 0,
        wagePerPp: 0.138,
        isSimulated: false
      }
    ],
    isSelfWorking: false
  },
  {
    id: 'c3',
    name: 'Stall 1',
    itemCode: 'steel',
    engineLevel: 5,
    storageLevel: 6,
    production: 965.0,
    concreteInvested: 200,
    regionName: 'Dubai',
    countryCode: 'AE',
    mainCity: 'Dubai',
    hasDepositBonus: false,
    countryBonusPct: 25.5,
    ethicBonusPct: 30.0,
    totalBonusPct: 55.5,
    estimatedValue: 1528,
    workers: [],
    isSelfWorking: false
  },
  {
    id: 'c4',
    name: 'Stall 2',
    itemCode: 'steel',
    engineLevel: 5,
    storageLevel: 6,
    production: 678.5,
    concreteInvested: 200,
    regionName: 'Djibouti City',
    countryCode: 'DJ',
    mainCity: 'Djibouti',
    hasDepositBonus: false,
    countryBonusPct: 25.5,
    ethicBonusPct: 30.0,
    totalBonusPct: 55.5,
    estimatedValue: 1476,
    workers: [],
    isSelfWorking: false
  },
  {
    id: 'c5',
    name: 'Stall 3',
    itemCode: 'steel',
    engineLevel: 6,
    storageLevel: 6,
    production: 674.8,
    concreteInvested: 200,
    regionName: 'Doha',
    countryCode: 'QA',
    mainCity: 'Qatar',
    hasDepositBonus: false,
    countryBonusPct: 25.5,
    ethicBonusPct: 30.0,
    totalBonusPct: 55.5,
    estimatedValue: 2048,
    workers: [],
    isSelfWorking: false
  }
];

// Mapper to convert raw WarEra API company documents into reactive state
export function mapCompanyFromDossier(c, i = 0, user = null, wageStats = null) {
  const fallbackAverage = wageStats?.allowedRange?.average || FALLBACK_WAGE_STATS.allowedRange.average;
  const id = c._id || c.id || `c-${i}`;
  const engineLvl = c.activeUpgradeLevels?.automatedEngine || c.automatedEngine?.level || c.engineLevel || 1;
  const storageLvl = c.activeUpgradeLevels?.storage || c.storage?.level || c.storageLevel || 1;
  const regionName = c.regionName || c.regionData?.name || (c.region ? 'Regional Sector' : 'Central District');
  const countryCode = c.countryCode || c.regionData?.countryCode?.toUpperCase() || 'HQ';
  const mainCity = c.mainCity || c.regionData?.mainCity || '';
  const ownerUsername = c.ownerUsername || user?.username || 'You';
  const ownerId = c.ownerId || user?._id || c.user;
  const ownerAvatarUrl = c.ownerAvatarUrl || user?.avatarUrl;

  const rawWorkers = c.workers || [];
  const workers = rawWorkers.map((w, wIdx) => {
    const contractedWage = typeof w.wage === 'number' ? w.wage : (typeof w.wagePerPp === 'number' ? w.wagePerPp : fallbackAverage);
    const fidelityBonus = typeof w.fidelity === 'number' ? w.fidelity : (typeof w.loyaltyBonus === 'number' ? w.loyaltyBonus : 0);
    const prodLvl = typeof w.productionSkill === 'number' ? w.productionSkill : (typeof w.productionSkillLevel === 'number' ? w.productionSkillLevel : 0);
    const prodBase = w.productionPointsBase || (prodLvl > 10 ? prodLvl : (10 + prodLvl * 3));
    const energyLvl = typeof w.energySkill === 'number' ? w.energySkill : (typeof w.energySkillLevel === 'number' ? w.energySkillLevel : 0);
    const energyStamina = w.energyPointsTotal || (30 + energyLvl * 10);
    // Natural 24h capacity: 10% hourly regen = 2.4 * max stamina per 24 hours. At 10 energy pts/session = 0.24 * stamina
    const dailySessions = Number((energyStamina * 0.24).toFixed(2));

    return {
      id: w._id || w.id || `w-${wIdx}`,
      userId: w.userId || w.user,
      username: w.username || `Worker #${wIdx + 1}`,
      level: w.level || 1,
      avatarUrl: w.avatarUrl || null,
      productionSkill: prodLvl,
      productionPointsBase: prodBase,
      energySkill: energyLvl,
      energyPointsTotal: energyStamina,
      dailySessions,
      workSessionsPerDay: dailySessions,
      loyaltyBonus: fidelityBonus,
      fidelity: fidelityBonus,
      wage: contractedWage,
      wagePerPp: contractedWage,
      joinedAt: w.joinedAt,
      isRealPlayer: !!(w.userId || w.user),
      isSimulated: !!w.isSimulated
    };
  });

  const apiBonus = typeof c.productionBonus === 'number'
    ? c.productionBonus
    : (typeof c.productionBonusData?.total === 'number'
        ? c.productionBonusData.total
        : (typeof c.totalBonusPct === 'number' ? c.totalBonusPct : null));

  const totalBonusPct = apiBonus !== null
    ? apiBonus
    : ((c.depositBonusPct ?? (c.hasDepositBonus ? 30.0 : 0.0)) + (c.countryBonusPct ?? 5.5));

  return {
    id,
    _id: c._id || id,
    name: c.name || `Facility #${i + 1}`,
    itemCode: c.itemCode || 'heavyAmmo',
    engineLevel: engineLvl,
    storageLevel: storageLvl,
    production: typeof c.production === 'number' ? c.production : 0,
    syncedAt: Date.now(),
    concreteInvested: c.concreteInvested || 200,
    regionName,
    countryCode,
    mainCity,
    ownerUsername,
    ownerId,
    ownerAvatarUrl,
    hasDepositBonus: (c.depositBonusPct ?? c.productionBonusData?.depositBonus ?? 0) > 0,
    depositBonusPct: c.depositBonusPct ?? c.productionBonusData?.depositBonus ?? 0,
    countryBonusPct: c.countryBonusPct ?? c.productionBonusData?.strategicBonus ?? 5.5,
    strategicBonus: c.strategicBonus ?? c.productionBonusData?.strategicBonus ?? 0,
    ethicBonusPct: c.ethicBonusPct ?? c.productionBonusData?.ethicSpecializationBonus ?? 0,
    productionBonus: totalBonusPct,
    productionBonusData: c.productionBonusData || null,
    totalBonusPct,
    estimatedValue: c.estimatedValue,
    workOfferData: c.workOfferData || null,
    workers,
    isSelfWorking: false,
    isRealGameCompany: !!c._id
  };
}

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

  // Live in-game wage statistics (from workOffer.getWageStats)
  const [wageStats, setWageStats] = useState(dossier?.wageStats || FALLBACK_WAGE_STATS);

  useEffect(() => {
    let isMounted = true;
    api.getWageStats().then(stats => {
      if (isMounted && stats?.allowedRange) {
        setWageStats(stats);
      }
    });
    return () => { isMounted = false; };
  }, []);

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
      return userCompanies.map((c, i) => mapCompanyFromDossier(c, i, user, wageStats));
    }
    return DEFAULT_COMPANIES;
  });

  // Re-sync whenever incoming dossier/userCompanies changes
  useEffect(() => {
    if (userCompanies && userCompanies.length > 0) {
      const mapped = userCompanies.map((c, i) => mapCompanyFromDossier(c, i, user, wageStats));
      setCompanies(mapped);
      setSelectedCompanyId(prev => {
        const exists = mapped.some(mc => mc.id === prev || mc._id === prev);
        return exists ? prev : (mapped[0]?._id || mapped[0]?.id);
      });
    }
  }, [dossier]);

  // Keep selected ID valid
  const effectiveSelectedId = selectedCompanyId || companies[0]?.id;

  // Management Skill & Portfolio-wide Hiring Capacity
  const managementSkill = user?.skills?.management;
  const managementLevel = managementSkill?.level ?? 0;
  const maxHiringSlots = managementSkill?.total ?? managementSkill?.value ?? (4 + managementLevel * 2);

  // Total workforce across ALL companies
  const totalEmployedWorkers = useMemo(() => {
    return companies.reduce((sum, c) => sum + (c.workers?.length || 0), 0);
  }, [companies]);

  const remainingHiringSlots = Math.max(0, maxHiringSlots - totalEmployedWorkers);
  const isAtHiringLimit = totalEmployedWorkers >= maxHiringSlots;

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

      // Compute total worker PP from employee list
      let totalWorkerBasePp = 0;
      let totalWorkerWages = 0;

      const workersList = (comp.workers || []).map(w => {
        const energyLvl = typeof w.energySkill === 'number' ? w.energySkill : 0;
        const energyStamina = w.energyPointsTotal || (30 + energyLvl * 10);
        const dailySessions = typeof w.workSessionsPerDay === 'number' && w.workSessionsPerDay > 0
          ? w.workSessionsPerDay 
          : Number((energyStamina * 0.24).toFixed(2));

        const prodLvl = typeof w.productionSkill === 'number' ? w.productionSkill : 0;
        const basePp = w.productionPointsBase || (prodLvl > 10 ? prodLvl : (10 + prodLvl * 3));
        const loyaltyBonus = typeof w.fidelity === 'number' ? w.fidelity : (typeof w.loyaltyBonus === 'number' ? w.loyaltyBonus : 0);
        
        // 1. Worker Labor PP per session (what contracted wage is paid on):
        const devPct = typeof comp.regionData?.development === 'number' ? comp.regionData.development : 4.88;
        const laborMultiplier = (1 + (loyaltyBonus / 100)) * (1 + (devPct / 100));
        const laborPpPerHit = Number((basePp * laborMultiplier).toFixed(2));

        // 2. Company Production PP per session (full factory yield delivered to company inventory):
        const companyMultiplier = 1 + (totalBonusPct / 100);
        const producedPpPerHit = Number((laborPpPerHit * (1 + (totalBonusPct * 0.91 / 100))).toFixed(2));

        const dailyBasePp = dailySessions * basePp;
        const dailyLaborPp = Number((dailySessions * laborPpPerHit).toFixed(1));
        const dailyProducedPp = Number((dailySessions * producedPpPerHit).toFixed(1));

        // 3. Contracted Wage Rate & Regional Income Tax:
        const wageRate = typeof w.wagePerPp === 'number' ? w.wagePerPp : (typeof w.wage === 'number' ? w.wage : 0.158);
        const incomeTaxPct = typeof comp.incomeTaxPct === 'number' ? comp.incomeTaxPct : (comp.countryTaxes?.income ?? 9.0);
        const netWageRate = Number((wageRate * (1 - (incomeTaxPct / 100))).toFixed(3));

        // Per-hit and daily payroll outflows:
        const grossWagePerHit = Number((laborPpPerHit * wageRate).toFixed(3));
        const taxPerHit = Number((grossWagePerHit * (incomeTaxPct / 100)).toFixed(3));
        const netWagePerHit = Number((grossWagePerHit - taxPerHit).toFixed(3));

        const dailyWage = Number((dailySessions * grossWagePerHit).toFixed(2));
        const dailyTax = Number((dailySessions * taxPerHit).toFixed(2));
        const netDailyWage = Number((dailySessions * netWagePerHit).toFixed(2));

        totalWorkerBasePp += dailyBasePp;
        totalWorkerWages += dailyWage;

        return {
          ...w,
          energySkill: energyLvl,
          energyStamina,
          energyPointsTotal: energyStamina,
          dailySessions,
          workSessionsPerDay: dailySessions,
          productionSkill: prodLvl,
          basePp,
          productionPointsBase: basePp,
          loyaltyBonus,
          fidelity: loyaltyBonus,
          companyTotalBonusPct: totalBonusPct,
          incomeTaxPct,
          devPct,
          laborPpPerHit,
          wLaborPpPerHit: laborPpPerHit,
          producedPpPerHit,
          wProducedPpPerHit: producedPpPerHit,
          effectivePpPerHit: producedPpPerHit,
          ppPerHit: producedPpPerHit,
          wageRate,
          wagePerPp: wageRate,
          wage: wageRate,
          netWageRate,
          grossWagePerHit,
          taxPerHit,
          netWagePerHit,
          dailyPp: dailyProducedPp,
          baseDailyPp: dailyBasePp,
          producedDailyPp: dailyProducedPp,
          dailyLaborPp,
          dailyWage,
          grossDailyWage: dailyWage,
          netDailyWage,
          dailyTax
        };
      });

      // Pure Base Layer: Automated Engine + Hired Employees (Self-work is optimized dynamically across portfolio)
      const totalDailyBasePp = (engineTier.ppPerHour * 24) + totalWorkerBasePp;
      const totalDailyEffectivePp = engineDailyPp + (totalWorkerBasePp * bonusMultiplier);
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
        workersList,
        totalWorkerBasePp,
        totalWorkerWages,
        totalDailyBasePp,
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

      // Storage & Engine Timer (using live accumulated stored PP)
      const storageTier = comp.storageTier || STORAGE_UPGRADE_TIERS.find(t => t.level === comp.storageLevel) || STORAGE_UPGRADE_TIERS[0];
      const storageCapacity = comp.storageCapacityPp || storageTier.capacity;
      const currentStoredPp = comp.currentStoredPp || 0;
      const currentFillPct = Math.min(100, (currentStoredPp / storageCapacity) * 100);
      const remainingPpToFull = Math.max(0, storageCapacity - currentStoredPp);

      const effectiveEnginePph = comp.effectiveEnginePph || ((comp.engineTier?.ppPerHour || comp.engineLevel || 1) * comp.bonusMultiplier);
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

      // Workers enriched net contribution (evaluating individual profitability)
      const enrichedWorkers = (comp.workersList || []).map(w => {
        const unitsProduced = recipe.pp > 0 ? (w.producedDailyPp / recipe.pp) : 0;
        const grossValue = unitsProduced * spotPrice;
        const rawExpense = isRawProducer ? 0 : (unitsProduced * comp.baseRawCostPerUnit);
        const netContribution = grossValue - rawExpense - w.dailyWage;

        return {
          ...w,
          unitsProduced,
          grossValue,
          rawExpense,
          sellingFee: 0,
          netContribution
        };
      });

      const hasEmployees = enrichedWorkers.length > 0;

      return {
        ...comp,
        recipeName: recipe.name,
        recipePp: recipe.pp,
        spotPrice,
        netSellPrice,
        isRawProducer,
        enrichedWorkers,
        hasEmployees,
        storageTier,
        storageCapacity,
        storageCapacityPp: storageCapacity,
        currentStoredPp,
        currentFillPct,
        remainingPpToFull,
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
    if (!activeCompany?.enrichedWorkers || activeCompany.enrichedWorkers.length === 0) {
      return null;
    }
    const workers = activeCompany.enrichedWorkers;
    const combinedDailyPp = workers.reduce((sum, w) => sum + (w.dailyPp || 0), 0);
    const combinedUnits = workers.reduce((sum, w) => sum + (w.unitsProduced || 0), 0);
    const combinedGrossValue = workers.reduce((sum, w) => sum + (w.grossValue || 0), 0);
    const combinedRawExpense = workers.reduce((sum, w) => sum + (w.rawExpense || 0), 0);
    const combinedSellingFee = workers.reduce((sum, w) => sum + (w.sellingFee || 0), 0);
    const combinedWages = workers.reduce((sum, w) => sum + (w.dailyWage || 0), 0);
    const combinedNet = combinedGrossValue - combinedRawExpense - combinedSellingFee - combinedWages;

    return {
      count: workers.length,
      combinedDailyPp,
      combinedUnits,
      combinedGrossValue,
      combinedRawExpense,
      combinedSellingFee,
      combinedWages,
      combinedNet
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
          const mapped = freshDossier.companies.map((c, i) => mapCompanyFromDossier(c, i, freshDossier.user, wageStats));
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
            const mapped = mapCompanyFromDossier(fresh, 0, user, wageStats);
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

  // Remove worker from company
  const handleRemoveWorker = (workerId) => {
    const updatedWorkers = (activeCompany.workers || []).filter(w => w.id !== workerId);
    handleUpdate(activeCompany.id, 'workers', updatedWorkers);
    setActiveWorkerIdx(prev => Math.max(0, Math.min(prev, updatedWorkers.length - 1)));
  };

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
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                    <span className="font-bold text-slate-800">Base Production:</span>
                    <strong className="text-slate-900 font-mono">
                      {activeCompany.baseUnits.toFixed(1)} units/day
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Base Revenue / day:</span>
                    <strong className="text-emerald-500 font-mono">
                      +{activeCompany.grossRevenue.toFixed(2)} BTC/day
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Costs of Raw Material / day:</span>
                    <strong className={activeCompany.dailyRawExpenseTotal > 0 ? "text-red-500 font-mono" : "text-blue-500 font-mono"}>
                      {activeCompany.dailyRawExpenseTotal > 0 ? `-${activeCompany.dailyRawExpenseTotal.toFixed(2)}` : '0.00'} BTC/day
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Base Salaries Paid / day:</span>
                    <strong className={activeCompany.dailyLaborExpense > 0 ? "text-red-500 font-mono" : "text-blue-500 font-mono"}>
                      {activeCompany.dailyLaborExpense > 0 ? `-${activeCompany.dailyLaborExpense.toFixed(2)}` : '0.00'} BTC/day
                    </strong>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200/40">
                    <span className="font-bold text-slate-800">Base Profit / day:</span>
                    <strong className={`font-bold font-mono ${activeCompany.baseNetProfit > 0 ? 'text-emerald-500' : activeCompany.baseNetProfit < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                      {activeCompany.baseNetProfit >= 0 ? '+' : ''}{activeCompany.baseNetProfit.toFixed(2)} BTC/day
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Base PP (Daily):</span>
                    <strong className="text-slate-900 font-mono">
                      {activeCompany.companyBaseDailyPp.toFixed(1)} PP/day
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Produced PP (Bonuses):</span>
                    <strong className="text-blue-900 font-mono">
                      {activeCompany.companyProducedDailyPp.toFixed(1)} PP/day
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>PP Ratio:</span>
                    <strong className="text-slate-900 font-mono">
                      {activeCompany.ppRatioPct.toFixed(1)}%
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Price / Base PP:</span>
                    <strong className="text-slate-900 font-mono">
                      {activeCompany.pricePerBasePp.toFixed(3)} BTC/PP
                    </strong>
                  </div>
                  {(activeCompany.totalCostAvoided || 0) > 0 && (
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/40 text-emerald-700 font-bold">
                      <span>Adjusted Net (Insourced):</span>
                      <strong className="font-mono">
                        +{activeCompany.adjustedNetProfit.toFixed(2)}/day (+{activeCompany.totalCostAvoided.toFixed(2)} saved)
                      </strong>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: LINKEDIN-STYLE EMPLOYEE STRUCTURE (COMPACT SIDE-BY-SIDE FLOW) */}
            <div className="lg:col-span-7 bg-white p-5 space-y-4 flex flex-col justify-between">
              
              {/* Heading */}
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-extrabold text-slate-900 font-sans">
                    {activeCompany.enrichedWorkers.length}/{maxHiringSlots} employees
                  </h3>
                </div>

                {/* Left/Right navigation if multiple workers */}
                {activeCompany.enrichedWorkers.length > 1 && (
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveWorkerIdx(prev => Math.max(0, prev - 1))}
                      disabled={validWorkerIdx === 0}
                      className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                      title="Previous Worker"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-mono font-bold text-slate-600 px-1">
                      {validWorkerIdx + 1} of {activeCompany.enrichedWorkers.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveWorkerIdx(prev => Math.min(activeCompany.enrichedWorkers.length - 1, prev + 1))}
                      disabled={validWorkerIdx >= activeCompany.enrichedWorkers.length - 1}
                      className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                      title="Next Worker"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* WORKER PROFILE OR UNSTAFFED STATUS (FULL WIDTH) */}
              <div className="flex-1 flex flex-col">
                {activeCompany.enrichedWorkers.length > 0 && currentWorker ? (
                  <div className="bg-slate-50/70 p-4 space-y-3 flex flex-col justify-between flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-3 min-w-0">
                        {currentWorker.avatarUrl ? (
                          <img 
                            src={currentWorker.avatarUrl} 
                            alt={currentWorker.username} 
                            className="w-11 h-11 object-cover shrink-0" 
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-11 h-11 bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center shrink-0">
                            {(currentWorker.username || 'W').charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center space-x-1.5 flex-wrap">
                            <span className="font-extrabold text-slate-900 text-xs font-sans truncate">@{currentWorker.username}</span>
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-100 text-blue-900 uppercase font-mono">
                              Worker
                            </span>
                            <span className="px-1 py-0.5 text-[9px] font-mono font-bold bg-slate-200 text-slate-700">
                              Lv.{currentWorker.level || 1}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 truncate">
                            Net Worth: <strong className="text-slate-900 font-bold">{(currentWorker.netWorth || (currentWorker.level ? currentWorker.level * 250 : 500)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveWorker(currentWorker.id)}
                        className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
                        title="Remove worker"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Worker Breakdown */}
                    <div className="space-y-1.5 font-mono text-[11px] text-slate-600 flex-1 flex flex-col justify-around">
                      <div className="flex justify-between items-center">
                        <span>Contract Wage:</span>
                        <strong className="text-amber-800 font-bold">{currentWorker.wagePerPp.toFixed(3)} BTC/PP</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Base Production:</span>
                        <strong className="text-slate-900">Lv.{currentWorker.productionSkill || 0} ({currentWorker.basePp} PP/hit)</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Bonuses:</span>
                        <strong className="text-emerald-700">
                          {currentWorker.companyTotalBonusPct > 0 ? `+${currentWorker.companyTotalBonusPct}% Co.` : ''}
                          {currentWorker.loyaltyBonus > 0 ? ` +${currentWorker.loyaltyBonus}% Fidel.` : ''}
                          {(!currentWorker.companyTotalBonusPct && !currentWorker.loyaltyBonus) ? '0%' : ''}
                          <span className="text-slate-500 font-normal ml-1">({(currentWorker.effectivePpPerHit || currentWorker.ppPerHit || (currentWorker.basePp * (currentWorker.workerMultiplier || 1))).toFixed(1)} PP/hit)</span>
                        </strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Energy Stamina:</span>
                        <strong className="text-slate-900">Lv.{currentWorker.energySkill || 0} ({currentWorker.energyStamina} pts • {currentWorker.dailySessions.toFixed(1)} hits/d)</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Daily Output:</span>
                        <strong className="text-slate-900">{currentWorker.dailyPp.toFixed(1)} PP/d</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Daily Salary:</span>
                        <strong className="text-red-500">-{currentWorker.dailyWage.toFixed(2)} BTC/d</strong>
                      </div>
                      <div className="flex justify-between items-center pt-1 text-slate-900 font-bold border-t border-slate-200">
                        <span>Net Contribution:</span>
                        <span className={`font-black ${currentWorker.netContribution > 0 ? 'text-emerald-500' : currentWorker.netContribution < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                          {currentWorker.netContribution >= 0 ? '+' : ''}{currentWorker.netContribution.toFixed(2)} BTC/d
                        </span>
                      </div>

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
                        className="w-full mt-2 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-mono font-bold transition cursor-pointer flex items-center justify-center space-x-1"
                      >
                        <span>Audit Skills & Salary Math</span>
                        <span>↗</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50/70 p-4 space-y-3 flex flex-col justify-between flex-1">
                    {activeCompany.workOfferData ? (
                      <div className="space-y-2 font-mono text-[11px] flex-1 flex flex-col justify-between">
                        <div className="flex items-center justify-between font-sans pb-1.5">
                          <span className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                            <Briefcase className="w-3.5 h-3.5 text-amber-700" />
                            <span>Job Opening</span>
                          </span>
                          <span className="font-bold text-amber-950 font-mono text-xs">
                            {activeCompany.workOfferData.wage?.toFixed(3)}/PP
                          </span>
                        </div>
                        <div className="space-y-1.5 flex-1 flex flex-col justify-around">
                          <div className="flex justify-between">
                            <span>Open Slots:</span>
                            <strong className="text-slate-900">{activeCompany.workOfferData.quantity} spots</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Min Energy:</span>
                            <strong className="text-slate-900">Lv.{activeCompany.workOfferData.minEnergy || 0}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Min Prod:</span>
                            <strong className="text-slate-900">Lv.{activeCompany.workOfferData.minProduction || 0}</strong>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col justify-center items-center text-center p-3 text-slate-400 space-y-1">
                        <Users className="w-6 h-6 text-slate-300 stroke-[1.5]" />
                        <span className="text-xs font-bold text-slate-600 block">Unstaffed Facility</span>
                        <p className="text-[11px] text-slate-400 font-sans max-w-[200px]">
                          Automated Engine delivers {activeCompany.engineTier.ppPerHour * 24} PP/day at 0 wage cost.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* COMBINED OVERVIEW: RENDER ONLY IF MULTIPLE WORKERS (> 1) */}
              {activeCompany.enrichedWorkers.length > 1 && combinedWorkforceStats && (
                <div className="bg-slate-50/70 p-3 font-mono text-xs text-slate-600 space-y-1.5">
                  <div className="flex items-center justify-between pb-1 font-sans">
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                      Combined Workforce ({activeCompany.enrichedWorkers.length} Workers)
                    </span>
                    <span className={`font-black text-xs ${combinedWorkforceStats.combinedNet > 0 ? 'text-emerald-500' : combinedWorkforceStats.combinedNet < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                      Net: {combinedWorkforceStats.combinedNet >= 0 ? '+' : ''}{combinedWorkforceStats.combinedNet.toFixed(2)}/day
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-1.5">
                      <span className="text-[10px] text-slate-400 block font-sans">Daily PP</span>
                      <strong className="text-slate-900 font-mono">{combinedWorkforceStats.combinedDailyPp.toFixed(1)}</strong>
                    </div>
                    <div className="p-1.5">
                      <span className="text-[10px] text-slate-400 block font-sans">Daily Output</span>
                      <strong className="text-slate-900 font-mono">{combinedWorkforceStats.combinedUnits.toFixed(2)} u/d</strong>
                    </div>
                    <div className="p-1.5">
                      <span className="text-[10px] text-slate-400 block font-sans">Total Wages</span>
                      <strong className={`${combinedWorkforceStats.combinedWages > 0 ? 'text-red-500' : 'text-blue-500'} font-mono`}>-{combinedWorkforceStats.combinedWages.toFixed(2)}/d</strong>
                    </div>
                    <div className="p-1.5">
                      <span className="text-[10px] text-slate-400 block font-sans">Net Cashflow</span>
                      <strong className={`font-mono ${combinedWorkforceStats.combinedNet > 0 ? 'text-emerald-500' : combinedWorkforceStats.combinedNet < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                        +{combinedWorkforceStats.combinedNet.toFixed(2)}/d
                      </strong>
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
                  Storage Capacity & Engine Fill Timer
                </h3>
              </div>

              {/* TIME UNTIL FULL USING ENGINE ONLY */}
              <div className="bg-amber-500/10 p-3.5 space-y-1">
                <span className="text-xs font-bold text-amber-900 block">
                  Time until storage is full (Engine only):
                </span>
                <div className="text-lg font-black font-mono text-amber-700">
                  {activeCompany.engineDaysOnly > 0 
                    ? `${activeCompany.engineDaysOnly} days, ${activeCompany.engineHoursRemainder} hours` 
                    : `${activeCompany.engineHoursRemainder} hours`}
                </div>
                <p className="text-[11px] text-amber-800/80 font-sans">
                  At your current Automated Engine speed ({activeCompany.effectiveEnginePph ? activeCompany.effectiveEnginePph.toFixed(2) : activeCompany.engineTier.ppPerHour} PP/hour), your warehouse holds {activeCompany.storageCapacity} PP.
                </p>
              </div>

              {/* STORAGE CYLINDER */}
              <div className="relative w-44 sm:w-52 h-56 mx-auto flex flex-col justify-end items-center my-2">
                <div className="relative w-full h-full bg-slate-100 overflow-hidden flex flex-col justify-end">
                  <div className="absolute top-0 inset-x-0 h-9 bg-slate-200 z-20" />
                  <div 
                    className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-amber-700 via-amber-600 to-amber-500 transition-all duration-500 flex items-start justify-center pt-2"
                    style={{ height: `${Math.max(6, activeCompany.currentFillPct)}%` }}
                  >
                    <div className="w-full h-3 bg-amber-400/60 opacity-90" />
                  </div>
                  <div className="relative z-20 bg-white/95 py-1.5 px-3.5 text-center mb-3">
                    <span className="font-mono font-black text-slate-900 text-xs">
                      {activeCompany.currentStoredPp.toFixed(0)} / {activeCompany.storageCapacity} PP ({activeCompany.currentFillPct.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Warehouse Yield & Storage Upgrade Details */}
              <div className="space-y-2.5 font-mono text-xs">
                <div className="flex justify-between items-center text-slate-600 bg-slate-50/70 p-3">
                  <span>Ready Yield in Storage:</span>
                  <strong className="text-amber-700 font-extrabold">
                    {activeCompany.uncollectedUnits.toFixed(1)} units ({activeCompany.uncollectedValueCoins.toFixed(1)})
                  </strong>
                </div>

                {/* Storage Upgrade Info in Plain English (hidden if max storage reached) */}
                {activeCompany.nextStorageTier && (
                  <div className="bg-slate-50/70 p-3 space-y-1">
                    <div className="flex items-center justify-between text-slate-800 font-bold">
                      <span>Next Storage Level (Lv.{activeCompany.storageLevel + 1})</span>
                      <span className="text-blue-600">+{activeCompany.storageExtraCapacity} PP</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-sans">
                      Upgrading costs <strong>{activeCompany.storageUpgradeSteel} Steel</strong>. Holds an extra {activeCompany.storageExtraCapacity} PP, giving you <strong>+{activeCompany.storageExtraEngineHours.toFixed(0)} extra hours</strong> before storage fills up.
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN: UNIT ECONOMICS & HARDWARE UPGRADES (7 COLS) */}
            <div className="lg:col-span-7 bg-white p-5 space-y-4 flex flex-col justify-between">
              
              {/* UNIT ECONOMICS BREAKDOWN STRUCTURE (MATCHES ASSET VALUATION BREAKDOWN STRUCTURE) */}
              <div className="space-y-2.5 font-mono text-xs flex-1 flex flex-col justify-around">
                <div className="flex items-center justify-between pb-1.5 font-sans">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">Unit Economics</span>
                    <h3 className="text-base font-extrabold text-slate-900 font-sans mt-0.5">
                      Unit Economics Breakdown
                    </h3>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-600">
                    Per Unit Analysis
                  </span>
                </div>

                <div className="space-y-2 text-slate-600 flex-1 flex flex-col justify-around">
                  <div className="flex justify-between items-center">
                    <span>Market Selling Price:</span>
                    <strong className="text-slate-900 font-bold">{activeCompany.spotPrice.toFixed(3)}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Raw Material Cost:</span>
                    <strong className={activeCompany.baseRawCostPerUnit > 0 ? "text-red-500 font-bold" : (activeCompany.isRaw ? "text-blue-500 font-bold" : "text-emerald-500 font-bold")}>
                      {activeCompany.isRaw ? (
                        <span>0.000 (Natural Extraction)</span>
                      ) : (
                        (activeCompany.totalCostAvoided || 0) > 0 ? (
                          <span>
                            -{((activeCompany.adjustedRawCashExpense || 0) / (activeCompany.baseUnits || 1)).toFixed(3)}
                            <span className="text-[10px] text-emerald-500 font-sans font-normal ml-1">
                              (+{((activeCompany.totalCostAvoided || 0) / (activeCompany.baseUnits || 1)).toFixed(3)} saved)
                            </span>
                          </span>
                        ) : (
                          <span>-{activeCompany.baseRawCostPerUnit.toFixed(3)} (Market Spot)</span>
                        )
                      )}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Hired Labor Wages:</span>
                    <strong className={activeCompany.baseLaborCostPerUnit > 0 ? "text-red-500 font-bold" : "text-blue-500 font-bold"}>
                      {activeCompany.baseLaborCostPerUnit > 0 ? `-${activeCompany.baseLaborCostPerUnit.toFixed(3)}` : '0.000'}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center pt-2 text-slate-900 font-bold border-t border-slate-100">
                    <span>Base Net Profit / Unit:</span>
                    <span className={`font-black text-sm ${activeCompany.baseNetProfitPerUnit > 0 ? 'text-emerald-500' : activeCompany.baseNetProfitPerUnit < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                      {activeCompany.baseNetProfitPerUnit >= 0 ? '+' : ''}{activeCompany.baseNetProfitPerUnit.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200/40">
                    <span>Produced PP / Base PP Ratio:</span>
                    <strong className="text-slate-900 font-mono">{activeCompany.ppRatioPct.toFixed(1)}%</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Price / Base PP:</span>
                    <strong className="text-slate-900 font-mono">{activeCompany.pricePerBasePp.toFixed(3)} BTC/PP</strong>
                  </div>
                </div>
              </div>

              {/* HARDWARE UPGRADES IN PLAIN ENGLISH */}
              {activeCompany.nextEngineTier && (
                <div className="bg-slate-50/70 p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-slate-800 font-bold text-xs">
                    <span>Next Automated Engine Level (Lv.{activeCompany.engineLevel + 1})</span>
                    <span className="text-amber-700 font-mono font-bold">+24 PP / day</span>
                  </div>
                  <p className="text-xs text-slate-600 font-sans">
                    Upgrading costs <strong>{activeCompany.engineUpgradeSteel} Steel</strong> ({activeCompany.engineUpgradeCoins.toFixed(1)}). Gives you +1 PP/hour (+24 PP/day), generating <strong>+{activeCompany.engineExtraProfitDaily.toFixed(1)}/day</strong> extra net profit.
                  </p>
                  <div className="text-[11px] font-mono text-emerald-700 font-bold pt-0.5">
                    Recoups its upgrade cost in {activeCompany.enginePaybackDays.toFixed(0)} days.
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* 3. BOTTOM SECTION: SUPPLY CHAIN */}
          <div className="bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-xl font-black text-slate-900 font-sans tracking-tight">
                  Supply Chain
                </h3>
                <p className="text-xs text-slate-500 font-sans">
                  Raw material sourcing assumptions for this facility
                </p>
              </div>
            </div>

            {activeCompany.rawInputsBreakdown.length === 0 ? (
              <div className="bg-slate-50/70 p-5 space-y-3 font-sans">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-extrabold text-slate-900 text-sm">Natural Resource Extraction Ledger</span>
                </div>
                <p className="text-xs text-slate-500">
                  This facility extracts commodities directly from regional deposits. Daily output is valued at live exchange spot price ({activeCompany.spotPrice.toFixed(3)} BTC) and services your portfolio's supply pipeline.
                </p>

                <div className="space-y-2 pt-3 border-t border-slate-200/60 font-mono text-xs">
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="font-bold text-slate-800">Base Production:</span>
                    <strong className="text-slate-900 font-sans">
                      {activeCompany.baseUnits.toFixed(1)} units/day
                    </strong>
                  </div>

                  <div className="flex justify-between items-center text-slate-700">
                    <span>Base Revenue / day:</span>
                    <strong className="text-slate-900 font-sans">
                      +{(activeCompany.baseUnits * activeCompany.spotPrice).toFixed(2)} BTC/day
                    </strong>
                  </div>

                  <div className="flex justify-between items-center text-slate-700">
                    <span>Costs of Raw Material / day:</span>
                    <strong className="text-slate-400 font-sans">
                      0.00 BTC/day (Natural Extraction)
                    </strong>
                  </div>

                  <div className="flex justify-between items-center text-slate-700">
                    <span>Base Salaries Paid / day:</span>
                    <strong className={activeCompany.dailyLaborExpense > 0 ? "text-red-500 font-sans" : "text-blue-500 font-sans"}>
                      {activeCompany.dailyLaborExpense > 0 ? `-${activeCompany.dailyLaborExpense.toFixed(2)}` : '0.00'} BTC/day
                    </strong>
                  </div>

                  <div className="flex justify-between items-center text-slate-700">
                    <span>Internal Facility Feed:</span>
                    <strong className="text-emerald-500 font-sans">
                      {activeCompany.internalSupplied ? activeCompany.internalSupplied.toFixed(1) : '0.0'} units/day (+{(activeCompany.internalTransferValue || 0).toFixed(2)} BTC transfer credit)
                    </strong>
                  </div>

                  <div className="flex justify-between items-center text-slate-700">
                    <span>Commercial Market Surplus:</span>
                    <strong className="text-slate-900 font-sans">
                      {activeCompany.externalMarketUnits ? activeCompany.externalMarketUnits.toFixed(1) : activeCompany.baseUnits.toFixed(1)} units/day (+{((activeCompany.externalMarketUnits ?? activeCompany.baseUnits) * activeCompany.spotPrice).toFixed(2)} BTC market sales)
                    </strong>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 text-slate-900 font-bold">
                    <span>Base Profit / day:</span>
                    <div className="text-right">
                      <span className={`font-black font-sans text-sm block ${activeCompany.baseNetProfit > 0 ? 'text-emerald-500' : activeCompany.baseNetProfit < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                        {activeCompany.baseNetProfit >= 0 ? '+' : ''}{activeCompany.baseNetProfit.toFixed(2)} BTC/day
                      </span>
                    </div>
                  </div>

                  {activeCompany.downstreamConsumers && activeCompany.downstreamConsumers.length > 0 ? (
                    <div className="pt-2 border-t border-slate-200/60 text-xs font-sans space-y-1.5">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-emerald-800">Internal Supply Status:</span>
                        <span className="text-[11px] text-slate-500 font-mono">Offset against downstream costs</span>
                      </div>
                      <div className="flex items-center flex-wrap gap-2 pt-1">
                        <span className="text-slate-500 text-xs">Supplying your facilities:</span>
                        {activeCompany.downstreamConsumers.map(dc => (
                          <button
                            key={dc.id}
                            type="button"
                            onClick={() => setSelectedCompanyId(dc.id)}
                            className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 hover:underline bg-blue-50 px-2 py-0.5 transition cursor-pointer"
                            title={`Switch to ${dc.name}`}
                          >
                            <span>{dc.name}</span>
                            <span className="text-[10px] text-blue-500 font-mono">({dc.recipeName} • {dc.dailyNeeded?.toFixed(0)} u/d)</span>
                            <span className="text-[10px] opacity-70 font-mono">→</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-600 font-sans">
                      <span>100% of production is available for market export or strategic stockpile accumulation.</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Finished Goods Base Breakdown Banner */}
                <div className="bg-slate-50 p-4 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 font-sans">
                    <span className="font-extrabold text-slate-900 text-sm">Finished Goods Base Production & Sourcing Summary</span>
                    <span className="text-xs font-mono font-bold text-slate-600">Standard Baseline</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Base Production</span>
                      <strong className="text-slate-900">{activeCompany.baseUnits.toFixed(1)} u/d</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Base Revenue</span>
                      <strong className="text-emerald-500 font-mono">+{activeCompany.grossRevenue.toFixed(2)} BTC/d</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Raw Material Costs</span>
                      <strong className={`${activeCompany.dailyRawExpenseTotal > 0 ? 'text-red-500' : 'text-blue-500'} font-mono`}>-{activeCompany.dailyRawExpenseTotal.toFixed(2)} BTC/d</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Base Salaries Paid</span>
                      <strong className={`${activeCompany.dailyLaborExpense > 0 ? "text-red-500" : "text-blue-500"} font-mono`}>
                        {activeCompany.dailyLaborExpense > 0 ? `-${activeCompany.dailyLaborExpense.toFixed(2)}` : '0.00'} BTC/d
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Base Profit</span>
                      <strong className={`${activeCompany.baseNetProfit > 0 ? 'text-emerald-500 font-bold' : activeCompany.baseNetProfit < 0 ? 'text-red-500 font-bold' : 'text-blue-500 font-bold'} font-mono`}>
                        {activeCompany.baseNetProfit >= 0 ? '+' : ''}{activeCompany.baseNetProfit.toFixed(2)} BTC/d
                      </strong>
                    </div>
                  </div>
                  {(activeCompany.totalCostAvoided || 0) > 0 && (
                    <div className="pt-1.5 border-t border-slate-200/50 flex justify-between items-center text-xs font-mono text-emerald-500">
                      <span>In-House Sourcing Cost Avoidance:</span>
                      <strong>+{activeCompany.totalCostAvoided.toFixed(2)} BTC/day saved (Adjusted Net: +{activeCompany.adjustedNetProfit.toFixed(2)} BTC/d)</strong>
                    </div>
                  )}
                </div>

                {activeCompany.rawInputsBreakdown.map(inp => (
                  <div key={inp.id} className="bg-slate-50/70 p-4 space-y-3">
                    
                    {/* Header: Commodity & Sourcing Control */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <ItemIcon itemCode={inp.id} size={32} />
                        <div>
                          <span className="font-extrabold text-slate-900 text-base block font-sans">{inp.name}</span>
                          <span className="text-xs text-slate-500 font-mono">
                            Market Price: <strong className="text-slate-800">{inp.unitMarketPrice.toFixed(3)}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Checkbox of whether raw material company is available/insourced */}
                      <div className="flex items-center space-x-3 self-start sm:self-auto">
                        <label className={`flex items-center space-x-2.5 px-3.5 py-2 transition select-none ${
                          inp.hasOwnedCompany ? 'cursor-pointer bg-white hover:bg-slate-50' : 'cursor-not-allowed bg-slate-100 opacity-60'
                        }`}>
                          <input
                            type="checkbox"
                            checked={inp.isInsourced}
                            disabled={!inp.hasOwnedCompany}
                            onChange={(e) => {
                              if (!inp.hasOwnedCompany) return;
                              const key = `${activeCompany.id || activeCompany._id}_${inp.id}`;
                              setInsourceOverrides(prev => ({
                                ...prev,
                                [key]: e.target.checked
                              }));
                            }}
                            className={`w-4 h-4 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 ${
                              inp.hasOwnedCompany ? 'cursor-pointer' : 'cursor-not-allowed'
                            }`}
                          />
                          <span className="text-xs font-bold text-slate-800 font-sans">
                            {inp.hasOwnedCompany 
                              ? (inp.isInsourced ? 'Insourced (Default)' : 'Buy from Market')
                              : 'Buy from Market'}
                          </span>
                        </label>

                        <span className={`text-xs font-mono font-bold px-2.5 py-1 ${
                          inp.isInsourced 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : (inp.hasOwnedCompany ? 'bg-slate-200 text-slate-700' : 'bg-slate-200 text-slate-600')
                        }`}>
                          {inp.isInsourced ? `Insourced (+${inp.savingsCoins.toFixed(1)} C saved)` : (inp.hasOwnedCompany ? 'Market Purchase' : 'Market (No Facility)')}
                        </span>
                      </div>
                    </div>

                    {/* Asset Valuation Breakdown Structure */}
                    <div className="space-y-2 font-mono text-xs text-slate-600">
                      <div className="flex justify-between items-center">
                        <span>Daily Required by Facility:</span>
                        <strong className="text-slate-900 font-sans">
                          {inp.totalUnitsNeededDaily.toFixed(1)} units/day
                          <span className="text-[11px] font-normal text-slate-500 ml-1">
                            ({inp.qtyNeededPerUnit} per {activeCompany.recipe.name})
                          </span>
                        </strong>
                      </div>

                      <div className="flex justify-between items-center">
                        <span>Market Unit Price:</span>
                        <strong className="text-slate-900">{inp.unitMarketPrice.toFixed(3)}</strong>
                      </div>

                      <div className="flex justify-between items-center">
                        <span>Sourcing Breakdown:</span>
                        {inp.isInsourced ? (
                          <div className="text-right">
                            <span className="text-emerald-700 font-bold font-sans">
                              {inp.unitsTransferred.toFixed(1)} units Internally Supplied (+{inp.savingsCoins.toFixed(2)} BTC saved)
                            </span>
                            {inp.deficitUnits > 0 && (
                              <div className="text-[11px] text-amber-700 font-sans">
                                + {inp.deficitUnits.toFixed(1)} units bought from market (-{inp.dailyRawExpense.toFixed(2)} BTC)
                              </div>
                            )}
                            {inp.rawProducerCompanies.length > 0 && (
                              <div className="text-[11px] text-slate-500 font-sans pt-0.5">
                                ↳ Secured by{' '}
                                {inp.rawProducerCompanies.map(sc => (
                                  <button
                                    key={sc.id || sc.companyId}
                                    type="button"
                                    onClick={() => setSelectedCompanyId(sc.id || sc.companyId)}
                                    className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer inline-flex items-center gap-0.5 ml-1"
                                  >
                                    <span>{sc.name}</span>
                                    <span>↗</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-700 font-sans text-right">
                            <span>Market ({inp.totalUnitsNeededDaily.toFixed(1)} units @ {inp.unitMarketPrice.toFixed(3)})</span>
                            {!inp.hasOwnedCompany && (
                              <span className="text-[11px] text-slate-400 block font-normal">
                                (No owned producer — purchase required)
                              </span>
                            )}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-2 text-slate-900 font-bold">
                        <span>Daily Raw Material Cash Outflow:</span>
                        <div className="text-right">
                          <span className={`font-black text-sm block ${inp.dailyRawExpense > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                            {inp.dailyRawExpense > 0 ? `-${inp.dailyRawExpense.toFixed(2)}/day` : '0.00/day (100% Insourced)'}
                          </span>
                          {inp.isInsourced && inp.savingsCoins > 0 && (
                            <span className="text-[11px] text-emerald-500 font-normal font-sans">
                              Offset against owned raw producer output (+{inp.savingsCoins.toFixed(2)} BTC/day internal savings)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
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
