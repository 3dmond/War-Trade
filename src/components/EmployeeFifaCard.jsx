import React, { useState } from 'react';
import { 
  Wrench, 
  Sparkles, 
  Users, 
  HelpCircle, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Smile, 
  AlertTriangle,
  Award,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2
} from 'lucide-react';
import { resolveCountry, getCountryFlag, getCountryName } from '../data/wareraCountries';
import { getTraitInfo } from '../data/employeeTraits';
import { getItemValuePerPp, getWorkerIndividualBonusBreakdown } from '../data/marketMath';
import { getCountryFlagTheme } from '../data/countryFlagColors';

/**
 * Sleek Futuristic AI Robot Avatar Component
 * Used as a placeholder for AI line workers who do not have an in-game profile picture.
 * - Male: High-tech Electric Blue cybernetic visor, power diodes, and circuit traces.
 * - Female: Sleek Hot Pink / Rose Neon cybernetic visor, power diodes, and circuit traces.
 */
export function AiRobotAvatar({ gender = 'male', className = "w-full h-full" }) {
  const isFemale = String(gender || '').toLowerCase() === 'female';
  const idPrefix = isFemale ? 'femaleBot' : 'maleBot';

  return (
    <svg 
      className={className} 
      viewBox="0 0 100 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="geometricPrecision"
    >
      <defs>
        {/* Gender-specific neon glow filter */}
        <filter id={`${idPrefix}_glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Chassis gold metallic gradient */}
        <linearGradient id={`${idPrefix}_chassisGold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="40%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>

        {/* Dark cyber armor gradient */}
        <linearGradient id={`${idPrefix}_darkArmor`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#292524" />
          <stop offset="100%" stopColor="#0c0a09" />
        </linearGradient>

        {/* Visor gradient: Pink for female, Blue for male */}
        <linearGradient id={`${idPrefix}_visor`} x1="0%" y1="0%" x2="100%" y2="0%">
          {isFemale ? (
            <>
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="50%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#db2777" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#0284c7" />
            </>
          )}
        </linearGradient>
      </defs>

      {/* Background cyber armor plate */}
      <rect width="100" height="120" fill={`url(#${idPrefix}_darkArmor)`} rx="10" />
      
      {/* Background ambient radial aura (Pink or Blue) */}
      <circle 
        cx="50" 
        cy="50" 
        r="38" 
        fill={isFemale ? "#ec4899" : "#0284c7"} 
        fillOpacity="0.18" 
      />

      {/* Cybernetic circuit traces in background */}
      <path 
        d="M 15 25 L 35 25 L 42 35" 
        stroke="#fef08a" 
        strokeWidth="0.8" 
        strokeOpacity="0.25" 
        strokeDasharray="2 2" 
      />
      <path 
        d="M 85 25 L 65 25 L 58 35" 
        stroke="#fef08a" 
        strokeWidth="0.8" 
        strokeOpacity="0.25" 
        strokeDasharray="2 2" 
      />
      
      {/* Lower circuit traces (Pink or Blue) */}
      <path 
        d="M 20 105 L 35 90 L 35 75" 
        stroke={isFemale ? "#f472b6" : "#38bdf8"} 
        strokeWidth="0.9" 
        strokeOpacity="0.4" 
        strokeDasharray="2 2" 
      />
      <path 
        d="M 80 105 L 65 90 L 65 75" 
        stroke={isFemale ? "#f472b6" : "#38bdf8"} 
        strokeWidth="0.9" 
        strokeOpacity="0.4" 
        strokeDasharray="2 2" 
      />

      {/* Torso & Shoulder Armor */}
      {isFemale ? (
        <path 
          d="M 24 120 L 34 100 L 45 96 L 55 96 L 66 100 L 76 120 Z" 
          fill="#1c1917" 
          stroke="#b45309" 
          strokeWidth="1" 
        />
      ) : (
        <path 
          d="M 22 120 L 32 98 L 44 94 L 56 94 L 68 98 L 78 120 Z" 
          fill="#1c1917" 
          stroke="#b45309" 
          strokeWidth="1" 
        />
      )}

      {/* Chest core / Power LED (Hot Pink for female, Electric Blue/Cyan for male) */}
      <circle 
        cx="50" 
        cy="108" 
        r="4.2" 
        fill={isFemale ? "#f43f5e" : "#06b6d4"} 
        filter={`url(#${idPrefix}_glow)`} 
      />
      <circle cx="50" cy="108" r="2" fill="#ffffff" />

      {/* Shoulder golden bevels */}
      <path d="M 18 120 L 28 102 L 34 105 L 26 120 Z" fill={`url(#${idPrefix}_chassisGold)`} />
      <path d="M 82 120 L 72 102 L 66 105 L 74 120 Z" fill={`url(#${idPrefix}_chassisGold)`} />

      {/* Neck Pistons & Collar */}
      <rect x="44" y="82" width="12" height="14" rx="2" fill="#292524" stroke="#78350f" strokeWidth="0.8" />
      <line x1="47" y1="84" x2="47" y2="94" stroke="#a8a29e" strokeWidth="1" />
      <line x1="53" y1="84" x2="53" y2="94" stroke="#a8a29e" strokeWidth="1" />

      {/* Head Chassis Base */}
      {isFemale ? (
        <path 
          d="M 33 44 L 43 23 L 57 23 L 67 44 L 64 73 L 50 86 L 36 73 Z" 
          fill="#1c1917" 
          stroke={`url(#${idPrefix}_chassisGold)`} 
          strokeWidth="1.5" 
        />
      ) : (
        <path 
          d="M 32 44 L 42 22 L 58 22 L 68 44 L 66 74 L 50 86 L 34 74 Z" 
          fill="#1c1917" 
          stroke={`url(#${idPrefix}_chassisGold)`} 
          strokeWidth="1.5" 
        />
      )}

      {/* Forehead Gold Armor Plate */}
      <path d="M 40 24 L 60 24 L 64 36 L 36 36 Z" fill={`url(#${idPrefix}_chassisGold)`} />
      
      {/* Forehead AI status indicator diode (Pink for female, Blue for male) */}
      <circle 
        cx="50" 
        cy="30" 
        r="2" 
        fill={isFemale ? "#f472b6" : "#38bdf8"} 
        filter={`url(#${idPrefix}_glow)`} 
      />

      {/* Side Audio / Sensor Pods */}
      <rect x="28" y="44" width="4" height="18" rx="1.5" fill={`url(#${idPrefix}_chassisGold)`} />
      <rect x="68" y="44" width="4" height="18" rx="1.5" fill={`url(#${idPrefix}_chassisGold)`} />
      <line 
        x1="26" y1="53" x2="28" y2="53" 
        stroke={isFemale ? "#f472b6" : "#38bdf8"} 
        strokeWidth="1.2" 
      />
      <line 
        x1="72" y1="53" x2="74" y2="53" 
        stroke={isFemale ? "#f472b6" : "#38bdf8"} 
        strokeWidth="1.2" 
      />

      {/* Glowing Neon Visor / Cybernetic Eyes */}
      {isFemale ? (
        // Sleek styled cat-eye curve visor for female robot
        <path 
          d="M 36 49 L 64 49 L 61 59 L 39 59 Z" 
          fill={`url(#${idPrefix}_visor)`} 
          filter={`url(#${idPrefix}_glow)`} 
        />
      ) : (
        // Bold angular visor for male robot
        <path 
          d="M 37 49 L 63 49 L 60 59 L 40 59 Z" 
          fill={`url(#${idPrefix}_visor)`} 
          filter={`url(#${idPrefix}_glow)`} 
        />
      )}

      {/* Dual Cybernetic Ocular Pupils */}
      <circle cx="45" cy="54" r="2.2" fill="#ffffff" />
      <circle cx="55" cy="54" r="2.2" fill="#ffffff" />

      {/* Cheek & Jaw Panels */}
      <path d="M 35 63 L 42 63 L 45 72 L 37 72 Z" fill="#292524" stroke="#44403c" strokeWidth="0.6" />
      <path d="M 65 63 L 58 63 L 55 72 L 63 72 Z" fill="#292524" stroke="#44403c" strokeWidth="0.6" />

      {/* Mouth Grille Vent Slats */}
      <line x1="46" y1="72" x2="54" y2="72" stroke={isFemale ? "#f472b6" : "#d97706"} strokeWidth="1" strokeLinecap="round" />
      <line x1="47" y1="75" x2="53" y2="75" stroke={isFemale ? "#f472b6" : "#d97706"} strokeWidth="1" strokeLinecap="round" />
      <line x1="48" y1="78" x2="52" y2="78" stroke={isFemale ? "#f472b6" : "#d97706"} strokeWidth="1" strokeLinecap="round" />

      {/* Chin Guard */}
      <path d="M 46 80 L 54 80 L 50 85 Z" fill={`url(#${idPrefix}_chassisGold)`} />
    </svg>
  );
}

/**
 * Rectangular FIFA-Style Gold Employee Card
 * Features:
 * - Clean rectangular card shape (not FIFA shield shape)
 * - Authentic FIFA gold card color palette, metallic gradients & ray patterns
 * - Top Left:
 *     - Rating + WRK/MGR
 *     - Country: Flag emoji + Full country name in small font
 *     - Company: Name and location flag (no repeated prod bonus)
 *     - Tool: Symbol, name, durability state/bar (no repeated prod bonus)
 * - Top Right:
 *     - For managers: their ingame profile picture
 *     - For AI employees: futuristic AiRobotAvatar placeholder
 * - Middle:
 *     - Name: 'as placed' (distinctive gold banner across card)
 * - Bottom:
 *     - 6-Stat Grid: [ Prod, Luck, Happiness, Bonus, Responsibility, Potential ]
 *     - Skill points have dropdown arrows toggling inline audits beneath the grid
 *     - Traits & Synergies list with dropdown arrows (no ugly borders, clean mobile layout)
 */
export default function EmployeeFifaCard({
  worker,
  company,
  portfolioWorkers = [],
  portfolioCompanies = [],
  onSelectCompany,
  className = ''
}) {
  const [expandedStat, setExpandedStat] = useState(null);

  if (!worker) return null;

  // Determine if this person is a manager
  const isManager = Boolean(
    worker.isManager || 
    worker.role === 'manager' || 
    worker.role === 'Manager' || 
    worker.type === 'manager' ||
    (company?.manager && (company.manager.userId === worker.userId || company.manager.id === worker.id))
  );

  // Nationality / Country Code & Full Country Name (Strictly worker's real citizenship, NOT facility location!)
  const resolvedCountry = resolveCountry(
    worker.nationality || 
    worker.nationalityCode || 
    worker.nationalityId || 
    worker.countryCode || 
    worker.country ||
    (isManager ? (company?.countryCode || null) : null)
  );
  const countryCode = resolvedCountry?.code && resolvedCountry.code !== 'HQ' 
    ? resolvedCountry.code 
    : (isManager ? (company?.countryCode || 'HQ') : 'HQ');
  const countryName = resolvedCountry?.name && resolvedCountry.code !== 'HQ' 
    ? resolvedCountry.name 
    : (isManager ? getCountryName(company?.countryCode || 'HQ') : 'Global HQ');
  const flagEmoji = resolvedCountry?.flag || getCountryFlag(countryCode);
  const flagTheme = getCountryFlagTheme(countryCode);

  // Company location flag & company name
  const companyCountryCode = company?.countryCode || 'HQ';
  const companyFlag = getCountryFlag(companyCountryCode);
  const companyName = worker.companyName || company?.name || 'Active Company';

  // Commodity Net Value & Rate per PP
  const itemCode = worker.companyItemCode || worker.estimate?.itemCode || company?.itemCode || 'heavyAmmo';
  const ratePerPp = typeof worker.ratePerPp === 'number' 
    ? worker.ratePerPp 
    : (typeof company?.spotPrice === 'number' && company?.recipePp ? company.spotPrice / company.recipePp : getItemValuePerPp(itemCode));

  // Tool Item & Hardware Details
  const toolItem = worker.toolItem || worker.tool || worker._raw?.toolItem || null;
  const toolStatus = worker.toolStatus || worker._raw?.toolStatus || null;
  const toolSkills = toolItem?.skills || {};
  const toolProdBonus = toolSkills.production ?? toolStatus?.bonusPercent ?? 0;
  const toolState = typeof toolItem?.state === 'number' ? toolItem.state : (toolItem ? 100 : null);
  const toolMaxState = toolItem?.maxState || 100;

  // Resolve Tool Symbol / Icon & Name
  const getToolDisplay = (tool) => {
    if (!tool) return null;
    const code = (tool.code || '').toLowerCase();
    let symbol = '🔧';
    let name = tool.code || 'Equipped Tool';

    if (code.includes('hammer')) {
      symbol = '🔨';
      name = code.replace('hammer', 'Hammer Lv.');
    } else if (code.includes('wrench')) {
      symbol = '🔧';
      name = code.replace('wrench', 'Wrench Lv.');
    } else if (code.includes('drill')) {
      symbol = '⚡';
      name = code.replace('drill', 'Drill Lv.');
    } else if (code.includes('pickaxe') || code.includes('pick')) {
      symbol = '⛏️';
      name = code.replace('pickaxe', 'Pickaxe Lv.').replace('pick', 'Pick Lv.');
    }
    return { symbol, name };
  };
  const toolDisplay = getToolDisplay(toolItem);

  // Breakdowns
  const breakdown = worker.breakdown || worker._raw?.breakdown || {};
  const prodBreakdown = breakdown.production || null;
  const luckBreakdown = breakdown.luck || null;
  const respBreakdown = breakdown.responsibility || null;

  // 1. Prod Stat
  const baseProd = worker.baseProduction ?? prodBreakdown?.base ?? (worker.base?.production ?? 0);
  const trainedProd = worker.trainedProduction ?? prodBreakdown?.trained ?? (worker.trained?.production ?? 0);
  const totalProd = prodBreakdown?.total ?? (baseProd + trainedProd);

  // 2. Luck Stat
  const baseLuck = worker.luck ?? luckBreakdown?.base ?? (worker.base?.luck ?? 0);
  const trainedLuck = luckBreakdown?.trained ?? (worker.trained?.luck ?? 0);
  const totalLuck = luckBreakdown?.total ?? (baseLuck + trainedLuck);

  // 3. Happiness Morale
  const happinessBreakdown = worker.happinessBreakdown || worker._raw?.happinessBreakdown || null;
  const happiness = typeof happinessBreakdown?.value === 'number'
    ? happinessBreakdown.value
    : (worker.happiness ?? 50);

  // 4. Production Bonus & Detailed Breakdown
  const prodBonusObj = worker.productionBonusData || worker.productionBonus || worker._raw?.productionBonus || null;
  const prodBonusTotal = typeof prodBonusObj?.total === 'number'
    ? prodBonusObj.total
    : (typeof worker.productionBonus === 'number' 
        ? worker.productionBonus 
        : (typeof company?.totalBonusPct === 'number' ? company.totalBonusPct : 0));

  const bonusBreakdownData = worker.productionBonusBreakdown || worker.productionBonusData || worker._raw?.productionBonusBreakdown || {};
  const bonusContributions = Array.isArray(prodBonusObj?.contributions) 
    ? prodBonusObj.contributions 
    : (Array.isArray(bonusBreakdownData?.contributions) ? bonusBreakdownData.contributions : null);

  const ownerMgmtContrib = bonusContributions?.find(c => c.source === 'management');
  const facilityManagerContrib = bonusContributions?.find(c => c.source === 'manager');
  const coreRegionContrib = bonusContributions?.find(c => c.source === 'coreRegion');
  const happinessContrib = bonusContributions?.find(c => c.source === 'happiness');
  const toolContrib = bonusContributions?.find(c => c.source === 'tool');
  const specializationContrib = bonusContributions?.find(c => c.source === 'specialization');
  const traitContribs = bonusContributions?.filter(c => !['management', 'manager', 'coreRegion', 'happiness', 'tool', 'specialization'].includes(c.source)) || [];

  const resolvedOwnerMgmtBonus = ownerMgmtContrib 
    ? ownerMgmtContrib.percent 
    : (typeof bonusBreakdownData.management === 'number' ? bonusBreakdownData.management : 0);

  const resolvedFacilityManagerBonus = facilityManagerContrib 
    ? facilityManagerContrib.percent 
    : (company?.manager?.productionBonusPercent || (company?.manager?.managementLevel ? company.manager.managementLevel * 2 : (company?.managerBonusPct ?? 0)));

  const resolvedCoreBonus = coreRegionContrib
    ? coreRegionContrib.percent
    : (typeof bonusBreakdownData.coreRegion === 'number' ? bonusBreakdownData.coreRegion : (company?.countryBonusPct ?? 5));

  const resolvedHapBonus = happinessContrib
    ? happinessContrib.percent
    : (typeof bonusBreakdownData.happiness === 'number' ? bonusBreakdownData.happiness : (typeof happiness === 'number' ? Math.round(happiness - 50) : 0));

  const resolvedToolBonus = toolContrib
    ? toolContrib.percent
    : (typeof bonusBreakdownData.tool === 'number' ? bonusBreakdownData.tool : (toolProdBonus || 0));

  const resolvedSpecBonus = specializationContrib
    ? specializationContrib.percent
    : (typeof bonusBreakdownData.specialization === 'number' ? bonusBreakdownData.specialization : (worker.specializationBonus ?? (worker.breakdown?.productionBonus?.specialization ?? 1)));

  const resolvedCalculatedTotal = typeof bonusBreakdownData.total === 'number'
    ? bonusBreakdownData.total
    : (typeof prodBonusTotal === 'number' && prodBonusTotal > 0
        ? prodBonusTotal
        : (resolvedOwnerMgmtBonus + resolvedFacilityManagerBonus + resolvedCoreBonus + resolvedHapBonus + resolvedToolBonus + resolvedSpecBonus));

  // 5. Responsibility Stat
  const baseResp = respBreakdown?.base ?? (worker.base?.responsibility ?? 0);
  const trainedResp = respBreakdown?.trained ?? (worker.trained?.responsibility ?? 0);
  const totalResp = respBreakdown?.total ?? worker.responsibility ?? (baseResp + trainedResp);

  // 6. Growth Potential
  const potential = worker.potential ?? worker._raw?.potential ?? worker.trainingPotential ?? 0;
  const potentialMax = worker.potentialMax ?? worker._raw?.potentialMax ?? potential;

  // Traits
  const traits = Array.isArray(worker.traits) ? worker.traits : [];

  // Profile picture selection:
  // For managers: use ingame profile picture
  // For AI workers: use robot image placeholder
  const avatarUrl = isManager 
    ? (worker.avatarUrl || worker.profilePicture || company?.manager?.avatarUrl || company?.ownerAvatarUrl || null)
    : (worker.avatarUrl || null);

  return (
    <div 
      className={`relative max-w-[370px] w-full mx-auto select-none antialiased subpixel-antialiased ${className}`}
      style={{
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility',
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
      }}
    >
      {/* 
        RECTANGULAR FIFA GOLD TRADING CARD
        - Clean straight top and bottom edges (not shield shape)
        - Authentic FIFA gold card color palette and metallic gradients
      */}
      <div 
        className="relative rounded-2xl p-3 sm:p-3.5 border-2 border-[#fde047] shadow-[0_15px_40px_rgba(202,138,4,0.45),0_0_20px_rgba(250,204,21,0.25)] ring-1 ring-[#eab308] text-slate-950 transition-all duration-300 font-sans"
        style={{
          background: 'linear-gradient(165deg, #fffdf2 0%, #fef9c3 12%, #fef08a 28%, #fde047 50%, #facc15 75%, #eab308 100%)'
        }}
      >
        {/* Subtle FIFA Metallic Diagonal Ray / Ribbon Overlay */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <svg className="w-full h-full opacity-35" viewBox="0 0 360 480" fill="none" preserveAspectRatio="none">
            <path d="M-50 120 L280 -40 L380 40 L-10 260 Z" fill="url(#goldSheenLight)" />
            <path d="M40 320 L380 100 L420 160 L100 420 Z" fill="url(#goldSheenDark)" />
            <path d="M-80 380 L320 180 L360 230 L-20 470 Z" fill="url(#goldSheenLight)" />
            <circle cx="270" cy="110" r="130" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.35" strokeDasharray="3 3" />
            <circle cx="270" cy="110" r="160" stroke="#fff" strokeWidth="1" strokeOpacity="0.2" />
            <defs>
              <linearGradient id="goldSheenLight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#fef08a" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="goldSheenDark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#eab308" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#fef08a" stopOpacity="0.05" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-white/80 to-transparent" />
        </div>

        {/* 
          1. TOP SECTION:
          - Left: Tool equipped (facility name container removed as redundant)
          - Right: Worker profile picture (no worker tag across DP, no redundant country under DP)
        */}
        <div className="relative z-10 flex items-center justify-between gap-3 mb-2">
          
          {/* Left: Tool Equipped */}
          <div className="flex-1">
            <div 
              className={`p-2.5 sm:p-3 rounded-xl border ${
                toolItem 
                  ? 'bg-gradient-to-r from-black/15 to-black/10 border-[#8a6316]/40 shadow-xs' 
                  : 'bg-black/5 border-dashed border-[#8a6316]/30 text-[#694b12]'
              }`}
            >
              {toolItem ? (
                <div className="space-y-1.5">
                  {/* Tool Symbol & Name */}
                  <div className="flex items-center gap-1.5 truncate text-[11px] sm:text-xs font-bold text-[#2a1a02]">
                    <span className="text-base">{toolDisplay?.symbol || '🔧'}</span>
                    <span className="truncate font-mono font-black text-slate-950 text-xs sm:text-sm">{toolDisplay?.name || toolItem.code}</span>
                  </div>

                  {/* Tool Durability State */}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <div className="flex-1 bg-[#473007]/20 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          toolState > 50 ? 'bg-emerald-700' : (toolState > 20 ? 'bg-amber-700' : 'bg-red-700')
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, (toolState / toolMaxState) * 100))}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#4a3307] shrink-0">
                      {toolState?.toFixed(0)}/{toolMaxState}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-amber-950 py-3">
                  <Wrench className="w-4 h-4 text-[#694b12]" />
                  <span>No Tool Equipped</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Worker / Manager Picture */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <div 
              className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-xl overflow-hidden p-0.5 shadow-md border border-[#8a6316]/50 transition hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(180deg, #fceda2 0%, #caa038 50%, #875c12 100%)'
              }}
            >
              {/* Picture rendering:
                  For managers: use ingame profile picture
                  For AI workers: use AiRobotAvatar placeholder
              */}
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={worker.name || worker.username} 
                  className="w-full h-full object-cover rounded-[10px]" style={{ imageRendering: '-webkit-optimize-contrast' }}
                  onError={(e) => { 
                    e.currentTarget.style.display = 'none'; 
                    const next = e.currentTarget.nextElementSibling;
                    if (next) next.style.display = 'flex';
                  }}
                />
              ) : null}

              {/* Robot avatar placeholder for AI workers */}
              <div className={`w-full h-full rounded-[10px] ${avatarUrl ? 'hidden' : 'block'}`}>
                <AiRobotAvatar gender={worker.gender} className="w-full h-full" />
              </div>

              {/* Age / Gender overlay at bottom of photo (worker tag removed!) */}
              <div className="absolute bottom-1 inset-x-1 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[9px] font-mono font-bold text-white flex items-center justify-between border border-white/10">
                <span className={worker.gender === 'female' ? 'text-pink-300' : 'text-sky-300'}>
                  {worker.gender === 'female' ? '♀' : '♂'} {worker.age ? `${worker.age}y` : ''}
                </span>
                {isManager && (
                  <span className="text-amber-300 font-sans uppercase tracking-wider text-[8px]">
                    MANAGER
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* 
          2. NAME BANNER WITH COUNTRY FLAG THEME:
          Flag theme applied to worker name banner to represent their country (like user profile card)!
        */}
        <div className="relative z-10 my-1.5">
          <div 
            className="relative overflow-hidden py-1 px-3 rounded-lg shadow-xs border flex items-center justify-center gap-2 animate-flag-wave transition-all duration-300"
            style={{
              background: flagTheme.gradient,
              borderColor: flagTheme.borderColor,
            }}
            title={`Worker: ${worker.name || worker.username || 'Employee'} • Country: ${countryName} (${countryCode})`}
          >
            {/* Silk fabric sheen wave ripple */}
            <div className="animate-flag-sheen" />

            {/* Flag Emoji with gentle wind flutter */}
            {flagEmoji && (
              <span className="text-sm sm:text-base shrink-0 leading-none animate-flag-flutter drop-shadow-xs relative z-10">
                {flagEmoji}
              </span>
            )}

            {/* Worker Name */}
            <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-[#1a1102] drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)] font-sans truncate text-center relative z-10">
              {worker.name || worker.username || 'AI Employee'}
            </h3>
          </div>
        </div>

        {/* 
          3. STATS SECTION:
          Details in []: [ Prod, Luck, Happiness, Bonus, Responsibility, Potential ]
          "with the details in [] and the traits filled in the place where the stats are."
          With dropdown arrows for skill points to toggle inline audits!
        */}
        <div className="relative z-10 pt-0.5 pb-0.5">
          
          <div className="h-px bg-gradient-to-r from-transparent via-[#875c12]/50 to-transparent mb-1" />

          {/* 6-Stat Grid with central divider line */}
          <div className="relative grid grid-cols-2 gap-x-3.5 gap-y-1 font-mono text-center">
            
            <div className="absolute top-1 bottom-1 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-[#875c12]/45 to-transparent pointer-events-none" />

            {/* 1. PROD */}
            <div 
              className={`py-1 px-2 rounded-md transition cursor-pointer flex items-center justify-between ${
                expandedStat === 'prod' ? 'bg-black/20 ring-1 ring-[#875c12]' : 'hover:bg-black/10'
              }`}
              onClick={() => setExpandedStat(expandedStat === 'prod' ? null : 'prod')}
            >
              <span className="text-[15px] sm:text-[16px] font-black text-slate-950 tracking-tight tabular-nums shrink-0">
                {totalProd}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black text-amber-950 uppercase tracking-wider font-sans">
                  PROD
                </span>
                {expandedStat === 'prod' ? (
                  <ChevronUp className="w-3 h-3 text-amber-950" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-amber-950/70" />
                )}
              </div>
            </div>

            {/* 2. LUCK */}
            <div 
              className={`py-1 px-2 rounded-md transition cursor-pointer flex items-center justify-between ${
                expandedStat === 'luck' ? 'bg-black/20 ring-1 ring-[#875c12]' : 'hover:bg-black/10'
              }`}
              onClick={() => setExpandedStat(expandedStat === 'luck' ? null : 'luck')}
            >
              <span className="text-[15px] sm:text-[16px] font-black text-slate-950 tracking-tight tabular-nums shrink-0">
                {totalLuck}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black text-amber-950 uppercase tracking-wider font-sans">
                  LUCK
                </span>
                {expandedStat === 'luck' ? (
                  <ChevronUp className="w-3 h-3 text-amber-950" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-amber-950/70" />
                )}
              </div>
            </div>

            {/* 3. HAPPINESS */}
            <div 
              className={`py-1 px-2 rounded-md transition cursor-pointer flex items-center justify-between ${
                expandedStat === 'hap' ? 'bg-black/20 ring-1 ring-[#875c12]' : 'hover:bg-black/10'
              }`}
              onClick={() => setExpandedStat(expandedStat === 'hap' ? null : 'hap')}
            >
              <span className="text-[15px] sm:text-[16px] font-black text-slate-950 tracking-tight tabular-nums shrink-0">
                {happiness}%
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black text-amber-950 uppercase tracking-wider font-sans">
                  HAP
                </span>
                {expandedStat === 'hap' ? (
                  <ChevronUp className="w-3 h-3 text-amber-950" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-amber-950/70" />
                )}
              </div>
            </div>

            {/* 4. BONUS */}
            <div 
              className={`py-1 px-2 rounded-md transition cursor-pointer flex items-center justify-between ${
                expandedStat === 'bonus' ? 'bg-black/20 ring-1 ring-[#875c12]' : 'hover:bg-black/10'
              }`}
              onClick={() => setExpandedStat(expandedStat === 'bonus' ? null : 'bonus')}
              title="Production Bonus Breakdown"
            >
              <span className="text-[15px] sm:text-[16px] font-black text-slate-950 tracking-tight tabular-nums shrink-0">
                +{prodBonusTotal.toFixed(0)}%
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black text-amber-950 uppercase tracking-wider font-sans">
                  BON
                </span>
                {expandedStat === 'bonus' ? (
                  <ChevronUp className="w-3 h-3 text-amber-950" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-amber-950/70" />
                )}
              </div>
            </div>

            {/* 5. RESPONSIBILITY */}
            <div 
              className={`py-1 px-2 rounded-md transition cursor-pointer flex items-center justify-between ${
                expandedStat === 'resp' ? 'bg-black/20 ring-1 ring-[#875c12]' : 'hover:bg-black/10'
              }`}
              onClick={() => setExpandedStat(expandedStat === 'resp' ? null : 'resp')}
            >
              <span className="text-[15px] sm:text-[16px] font-black text-slate-950 tracking-tight tabular-nums shrink-0">
                {totalResp}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black text-amber-950 uppercase tracking-wider font-sans">
                  RESP
                </span>
                {expandedStat === 'resp' ? (
                  <ChevronUp className="w-3 h-3 text-amber-950" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-amber-950/70" />
                )}
              </div>
            </div>

            {/* 6. POTENTIAL */}
            <div 
              className={`py-1 px-2 rounded-md transition cursor-pointer flex items-center justify-between ${
                expandedStat === 'pot' ? 'bg-black/20 ring-1 ring-[#875c12]' : 'hover:bg-black/10'
              }`}
              onClick={() => setExpandedStat(expandedStat === 'pot' ? null : 'pot')}
            >
              <span className="text-[15px] sm:text-[16px] font-black text-slate-950 tracking-tight tabular-nums shrink-0">
                {potential}/{potentialMax || 8}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black text-amber-950 uppercase tracking-wider font-sans">
                  POT
                </span>
                {expandedStat === 'pot' ? (
                  <ChevronUp className="w-3 h-3 text-amber-950" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-amber-950/70" />
                )}
              </div>
            </div>

          </div>

          {/* Inline Skill Point Audit Breakdown Drawer */}
          {expandedStat && (
            <div className="mt-2.5 p-2.5 rounded-lg bg-black/15 backdrop-blur-xs border border-[#875c12]/30 text-xs font-mono text-[#261803] space-y-1.5 animate-in fade-in duration-150">
              
              {/* PROD AUDIT */}
              {expandedStat === 'prod' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between font-sans font-bold text-xs text-[#2a1a02] border-b border-[#875c12]/20 pb-1">
                    <span>⛏️ Production Stat Breakdown</span>
                    <span className="font-mono font-black text-amber-950">Total: {totalProd}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Base Production:</span>
                    <strong>{baseProd}</strong>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Trained Skill:</span>
                    <strong className="text-emerald-900 font-bold">+{trainedProd}</strong>
                  </div>
                  {toolProdBonus > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span>Tool Multiplier:</span>
                      <strong className="text-sky-950 font-bold">+{toolProdBonus}%</strong>
                    </div>
                  )}
                  <div className="pt-1 border-t border-[#875c12]/20 flex justify-between font-bold text-[11px]">
                    <span>Effective Production Output:</span>
                    <span className="text-[#2a1a02] font-black">{totalProd} PP</span>
                  </div>
                </div>
              )}

              {/* LUCK AUDIT */}
              {expandedStat === 'luck' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between font-sans font-bold text-xs text-[#2a1a02] border-b border-[#875c12]/20 pb-1">
                    <span>🍀 Luck Stat Breakdown</span>
                    <span className="font-mono font-black text-amber-950">Total: {totalLuck}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Base Luck:</span>
                    <strong>{baseLuck}</strong>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Trained Luck:</span>
                    <strong className="text-emerald-900 font-bold">+{trainedLuck}</strong>
                  </div>
                  <p className="text-[10px] text-[#4d3408] pt-1 border-t border-[#875c12]/20 font-sans">
                    Governs critical procs and bonus commodity yield during daily production cycles.
                  </p>
                </div>
              )}

              {/* HAPPINESS AUDIT */}
              {expandedStat === 'hap' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between font-sans font-bold text-xs text-[#2a1a02] border-b border-[#875c12]/20 pb-1">
                    <span>😊 Happiness Morale</span>
                    <span className="font-mono font-black text-amber-950">{happiness}%</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Morale State:</span>
                    <strong className={happiness >= 75 ? 'text-emerald-900' : (happiness >= 40 ? 'text-amber-950' : 'text-rose-950')}>
                      {happiness >= 75 ? 'Optimal (High Performance)' : (happiness >= 40 ? 'Stable Morale' : 'Critical (Risk of Leaving)')}
                    </strong>
                  </div>
                  <p className="text-[10px] text-[#4d3408] pt-1 border-t border-[#875c12]/20 font-sans">
                    Low morale (&lt;30%) triggers output penalties and worker departure risks.
                  </p>
                </div>
              )}

              {/* BONUS AUDIT: EXACT WARERA IN-GAME POPUP */}
              {expandedStat === 'bonus' && (
                <div className="space-y-2 p-2 rounded-lg bg-black/20 backdrop-blur-xs border border-[#875c12]/35 text-xs font-mono text-[#261803]">
                  <div className="flex items-center justify-between font-sans border-b border-[#875c12]/20 pb-1">
                    <span className="font-extrabold text-xs text-[#2a1a02]">Production bonus</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-black/15 flex items-center justify-center text-[9px] font-sans font-bold text-[#5c3e07]" title="Every percent that scales what their Production banks, added together.">
                      ?
                    </span>
                  </div>
                  
                  <p className="text-[10px] text-[#4d3408] font-sans leading-tight">
                    Every percent that scales what their <span className="font-bold text-[#2a1a02]">⛏️ Production</span> banks, added together.
                  </p>

                  <div className="space-y-1 pt-1 font-mono text-[11px] border-t border-[#875c12]/15">
                    {/* 1. Owner Management Bonus */}
                    {resolvedOwnerMgmtBonus > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5">
                          <span className="text-xs">👑</span>
                          <span>Owner Management</span>
                        </span>
                        <strong className="text-emerald-950 font-black">
                          +{resolvedOwnerMgmtBonus}%
                        </strong>
                      </div>
                    )}

                    {/* 2. Hired Facility Manager Bonus */}
                    {resolvedFacilityManagerBonus > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5">
                          <span className="text-xs">👔</span>
                          <span>Facility Manager{company?.manager?.username ? ` (${company.manager.username})` : ''}</span>
                        </span>
                        <strong className="text-emerald-950 font-black">
                          +{resolvedFacilityManagerBonus}%
                        </strong>
                      </div>
                    )}

                    {/* Fallback if neither was greater than 0 */}
                    {resolvedOwnerMgmtBonus <= 0 && resolvedFacilityManagerBonus <= 0 && (
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5">
                          <span className="text-xs">👔</span>
                          <span>Management</span>
                        </span>
                        <strong className="text-emerald-950 font-black">+0%</strong>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5">
                        <span className="text-xs">📍</span>
                        <span>Core region</span>
                      </span>
                      <strong className={resolvedCoreBonus >= 0 ? "text-emerald-950 font-black" : "text-rose-950 font-black"}>
                        {resolvedCoreBonus >= 0 ? `+${resolvedCoreBonus}%` : `${resolvedCoreBonus}%`}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5">
                        <span className="text-xs">😊</span>
                        <span>Happiness</span>
                      </span>
                      <strong className={resolvedHapBonus >= 0 ? "text-emerald-950 font-black" : "text-rose-950 font-black"}>
                        {resolvedHapBonus >= 0 ? `+${resolvedHapBonus}%` : `${resolvedHapBonus}%`}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5">
                        <span className="text-xs">🔧</span>
                        <span>Tool</span>
                      </span>
                      <strong className={resolvedToolBonus >= 0 ? "text-emerald-950 font-black" : "text-rose-950 font-black"}>
                        {resolvedToolBonus >= 0 ? `+${resolvedToolBonus}%` : `${resolvedToolBonus}%`}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5">
                        <span className="text-xs">🎓</span>
                        <span>Specialization</span>
                      </span>
                      <strong className={resolvedSpecBonus >= 0 ? "text-emerald-950 font-black" : "text-rose-950 font-black"}>
                        {resolvedSpecBonus >= 0 ? `+${resolvedSpecBonus}%` : `${resolvedSpecBonus}%`}
                      </strong>
                    </div>

                    {traitContribs.map(tc => (
                      <div key={tc.source} className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5">
                          <span className="text-xs">✨</span>
                          <span className="capitalize">{tc.source}</span>
                        </span>
                        <strong className="text-emerald-950 font-black">
                          +{tc.percent}%
                        </strong>
                      </div>
                    ))}

                    <div className="pt-1.5 mt-1 border-t border-[#875c12]/25 flex justify-between items-center font-bold text-xs">
                      <span className="text-[#2a1a02] font-sans uppercase tracking-wider font-extrabold">Total</span>
                      <strong className="text-[#2a1a02] font-mono font-black text-xs flex items-center gap-0.5">
                        <span>⛏️</span>
                        <span>{resolvedCalculatedTotal >= 0 ? `+${resolvedCalculatedTotal}%` : `${resolvedCalculatedTotal}%`}</span>
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* RESPONSIBILITY AUDIT */}
              {expandedStat === 'resp' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between font-sans font-bold text-xs text-[#2a1a02] border-b border-[#875c12]/20 pb-1">
                    <span>🛡️ Responsibility & Roles</span>
                    <span className="font-mono font-black text-amber-950">Tier {totalResp}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Base Responsibility:</span>
                    <strong>{baseResp}</strong>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Trained Responsibility:</span>
                    <strong className="text-emerald-900">+{trainedResp}</strong>
                  </div>
                </div>
              )}

              {/* POTENTIAL AUDIT */}
              {expandedStat === 'pot' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between font-sans font-bold text-xs text-[#2a1a02] border-b border-[#875c12]/20 pb-1">
                    <span>🌟 Training Potential</span>
                    <span className="font-mono font-black text-amber-950">{potential} / {potentialMax || 8}</span>
                  </div>
                  <p className="text-[10px] text-[#4d3408] font-sans">
                    Reflects maximum growth capability and training slots remaining.
                  </p>
                </div>
              )}

              {/* Tap to close */}
              <div className="text-center pt-1">
                <button 
                  type="button"
                  className="text-[9px] uppercase tracking-wider font-bold text-[#5c3e07] hover:text-black underline cursor-pointer"
                  onClick={() => setExpandedStat(null)}
                >
                  Close Breakdown
                </button>
              </div>

            </div>
          )}

          {/* 
            TRAITS SECTION:
            Clean simple list of traits without expandable clutter or wordy descriptions.
          */}
          <div className="mt-1.5 pt-1.5 border-t border-[#875c12]/35">
            <div className="flex items-center justify-between mb-1 px-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-950 font-sans flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-950" />
                <span>TRAITS</span>
              </span>
              <span className="text-[10px] font-mono font-black text-amber-950">
                {traits.length} {traits.length === 1 ? 'Trait' : 'Traits'}
              </span>
            </div>

            {traits.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 py-0.5">
                {traits.map((t, idx) => {
                  const info = getTraitInfo(t);
                  return (
                    <span 
                      key={idx}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-sans font-bold border shadow-xs select-none ${
                        info.isNegative 
                          ? 'bg-rose-500/20 text-rose-950 border-rose-500/40' 
                          : 'bg-black/10 text-slate-950 border-[#875c12]/30'
                      }`}
                      title={info.description || info.name}
                    >
                      <span className="text-xs">{info.icon || '✨'}</span>
                      <span className="truncate">{info.name}</span>
                      {info.isNegative && (
                        <span className="text-[8px] uppercase tracking-wider font-mono text-rose-900 ml-0.5 font-black">
                          NEG
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-1 text-[10px] font-mono text-[#5b3f09] italic">
                No active personality traits.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

/**
 * Mini FIFA Trading Card Component
 * Used in the stacked deck view to show roster cards peeking in background.
 */
export function EmployeeFifaCardMini({
  worker,
  company,
  onClick,
  className = ''
}) {
  if (!worker) return null;
  const isManager = Boolean(worker.isManager || worker.role === 'Manager' || worker.role === 'manager');
  const resolvedCountry = resolveCountry(
    worker.nationality || 
    worker.nationalityCode || 
    worker.nationalityId || 
    worker.countryCode || 
    worker.country ||
    (isManager ? (company?.countryCode || null) : null)
  );
  const countryCode = resolvedCountry?.code && resolvedCountry.code !== 'HQ' 
    ? resolvedCountry.code 
    : (isManager ? (company?.countryCode || 'HQ') : 'HQ');
  const flagEmoji = resolvedCountry?.flag || getCountryFlag(countryCode);
  const countryName = resolvedCountry?.name && resolvedCountry.code !== 'HQ' 
    ? resolvedCountry.name 
    : (isManager ? getCountryName(company?.countryCode || 'HQ') : 'Global HQ');
  const flagTheme = getCountryFlagTheme(countryCode);
  const totalProd = worker.breakdown?.production?.total ?? (worker.baseProduction ?? worker.production ?? 99);
  const totalLuck = worker.breakdown?.luck?.total ?? (worker.luck ?? 1);
  const avatarUrl = isManager ? (worker.avatarUrl || null) : null;

  return (
    <div 
      className={`rounded-2xl p-3.5 border-2 border-[#fef08a] ring-1 ring-[#ca8a04] cursor-pointer select-none transition-all duration-300 hover:brightness-105 flex flex-col justify-between opacity-100 shadow-2xl ${className}`}
      style={{
        background: 'linear-gradient(165deg, #fffbeb 0%, #fef08a 12%, #fde047 28%, #facc15 50%, #eab308 75%, #ca8a04 100%)',
        width: '260px',
        minHeight: '330px'
      }}
      onClick={onClick}
    >
      <div className="w-24 h-28 mx-auto rounded-xl overflow-hidden p-0.5 border border-[#8a6316]/60 shadow-md mt-1 bg-gradient-to-b from-[#fceda2] to-[#875c12] relative">
        {avatarUrl ? (
          <img src={avatarUrl} alt={worker.name} className="w-full h-full object-cover rounded-[8px]" />
        ) : (
          <AiRobotAvatar gender={worker.gender} className="w-full h-full" />
        )}
        <div className="absolute bottom-1 inset-x-1 px-1.5 py-0.5 rounded bg-black/75 text-[8px] font-mono font-bold text-white flex items-center justify-between border border-white/10">
          <span className={worker.gender === 'female' ? 'text-pink-300' : 'text-sky-300'}>
            {worker.gender === 'female' ? '♀' : '♂'}
          </span>
          {isManager && (
            <span className="text-amber-300 uppercase tracking-wider">
              MGR
            </span>
          )}
        </div>
      </div>

      {/* Worker Name with Country Flag Theme */}
      <div 
        className="relative overflow-hidden py-1 px-2 rounded-md border text-center my-2 shadow-xs flex items-center justify-center gap-1.5 animate-flag-wave select-none"
        style={{
          background: flagTheme.gradient,
          borderColor: flagTheme.borderColor,
        }}
        title={`${worker.name || worker.username} (${countryName})`}
      >
        <div className="animate-flag-sheen" />
        {flagEmoji && (
          <span className="text-xs shrink-0 leading-none animate-flag-flutter relative z-10">
            {flagEmoji}
          </span>
        )}
        <span className="text-xs font-black uppercase text-[#1a1102] truncate block font-sans relative z-10 drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]">
          {worker.name || worker.username || 'Employee'}
        </span>
      </div>

      {/* Quick Stat Bar */}
      <div className="flex items-center justify-around py-1 px-2 bg-black/10 rounded-lg border border-[#8a6316]/20 font-mono text-[10px] text-[#2c1d04] font-bold">
        <span>⛏️ {totalProd} PP</span>
        <span>•</span>
        <span>🍀 {totalLuck} LUCK</span>
      </div>

      <div className="text-center pt-2 pb-1">
        <span className="text-[9px] font-black text-[#3a2503] uppercase tracking-wider bg-black/15 hover:bg-black/25 px-3 py-1 rounded-full border border-[#875c12]/30 transition">
          Click to View Card
        </span>
      </div>
    </div>
  );
}

/**
 * Production & Economics Breakdown (Rendered OUTSIDE the FIFA card)
 * "For the prod breakdown, it'll appear outside the card, not in the card. 
 *  For the audit, on hover on any auditable point, show the breakdown."
 */
export function EmployeeProductionBreakdown({
  worker,
  company,
  className = ''
}) {
  const [expandedMetric, setExpandedMetric] = useState(null);

  if (!worker) return null;

  // Hourly and daily output PP
  const hourlyOutputPp = typeof worker.hourlyOutputPp === 'number'
    ? worker.hourlyOutputPp
    : (typeof worker.estimate?.production === 'number' ? worker.estimate.production : (worker.dailyOutputPp ? worker.dailyOutputPp / 24 : 0));

  const dailyOutputPp = typeof worker.dailyOutputPp === 'number'
    ? worker.dailyOutputPp
    : Number((hourlyOutputPp * 24).toFixed(2));

  // Wage
  const hourlyWage = typeof worker.hourlyWage === 'number'
    ? worker.hourlyWage
    : (typeof worker.wage === 'number'
        ? worker.wage
        : (typeof worker.salary === 'number'
            ? worker.salary
            : (typeof worker.estimate?.wage === 'number' ? worker.estimate.wage : 0)));

  const dailyWage = typeof worker.dailyWage === 'number'
    ? worker.dailyWage
    : Number((hourlyWage * 24).toFixed(3));

  // Pricing & Revenue
  const itemCode = worker.companyItemCode || worker.estimate?.itemCode || company?.itemCode || 'heavyAmmo';
  const ratePerPp = typeof worker.ratePerPp === 'number' 
    ? worker.ratePerPp 
    : (typeof company?.spotPrice === 'number' && company?.recipePp ? company.spotPrice / company.recipePp : getItemValuePerPp(itemCode));

  const hourlyRevenue = Number((hourlyOutputPp * ratePerPp).toFixed(4));
  const dailyRevenue = typeof worker.dailyProductionValue === 'number'
    ? worker.dailyProductionValue
    : Number((dailyOutputPp * ratePerPp).toFixed(3));

  const dailyProfit = typeof worker.dailyProfit === 'number'
    ? worker.dailyProfit
    : Number((dailyRevenue - dailyWage).toFixed(3));

  const weeklyWage = Number((dailyWage * 7).toFixed(2));
  const monthlyWage = Number((dailyWage * 30).toFixed(2));

  return (
    <div className={`bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 space-y-1.5 font-mono text-xs shadow-xl text-slate-200 ${className}`}>
      
      {/* 4 Primary KPI Cards with Dropdown Toggle (No Title) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        
        {/* Metric 1: Hourly Output PP */}
        <div 
          className={`p-2 rounded-lg border transition cursor-pointer select-none ${
            expandedMetric === 'output' 
              ? 'bg-slate-900 border-amber-400 ring-1 ring-amber-400/50 shadow-md' 
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-xs'
          }`}
          onClick={() => setExpandedMetric(expandedMetric === 'output' ? null : 'output')}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-sans">Hourly Output</span>
            {expandedMetric === 'output' ? (
              <ChevronUp className="w-3 h-3 text-amber-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-slate-400" />
            )}
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-100 block font-mono mt-0.5">
            {hourlyOutputPp.toFixed(2)} PP/h
          </span>
          <span className="text-[9px] text-emerald-400 font-sans block">
            {(hourlyOutputPp * 24).toFixed(1)} daily
          </span>
        </div>

        {/* Metric 2: Hourly Wage */}
        <div 
          className={`p-2 rounded-lg border transition cursor-pointer select-none ${
            expandedMetric === 'wage' 
              ? 'bg-slate-900 border-amber-400 ring-1 ring-amber-400/50 shadow-md' 
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-xs'
          }`}
          onClick={() => setExpandedMetric(expandedMetric === 'wage' ? null : 'wage')}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-sans">Hourly Wage</span>
            {expandedMetric === 'wage' ? (
              <ChevronUp className="w-3 h-3 text-amber-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-slate-400" />
            )}
          </div>
          <span className="text-xs sm:text-sm font-bold text-rose-400 block font-mono mt-0.5">
            -{hourlyWage.toFixed(3)} BTC/h
          </span>
          <span className="text-[9px] text-slate-400 font-sans block">
            -{dailyWage.toFixed(2)}/day
          </span>
        </div>

        {/* Metric 3: Hourly Revenue */}
        <div 
          className={`p-2 rounded-lg border transition cursor-pointer select-none ${
            expandedMetric === 'revenue' 
              ? 'bg-slate-900 border-amber-400 ring-1 ring-amber-400/50 shadow-md' 
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-xs'
          }`}
          onClick={() => setExpandedMetric(expandedMetric === 'revenue' ? null : 'revenue')}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-sans">Hourly Revenue</span>
            {expandedMetric === 'revenue' ? (
              <ChevronUp className="w-3 h-3 text-amber-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-slate-400" />
            )}
          </div>
          <span className="text-xs sm:text-sm font-bold text-emerald-400 block font-mono mt-0.5">
            +{hourlyRevenue.toFixed(3)} BTC/h
          </span>
          <span className="text-[9px] text-slate-400 font-sans block">
            +{dailyRevenue.toFixed(2)}/day
          </span>
        </div>

        {/* Metric 4: Net Daily Profit */}
        <div 
          className={`p-2 rounded-lg border transition cursor-pointer select-none ${
            expandedMetric === 'profit' 
              ? 'bg-slate-900 border-amber-400 ring-1 ring-amber-400/50 shadow-md' 
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-xs'
          }`}
          onClick={() => setExpandedMetric(expandedMetric === 'profit' ? null : 'profit')}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-sans">Net Daily Profit</span>
            {expandedMetric === 'profit' ? (
              <ChevronUp className="w-3 h-3 text-amber-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-slate-400" />
            )}
          </div>
          <span className={`text-xs sm:text-sm font-black block font-mono mt-0.5 ${dailyProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {dailyProfit >= 0 ? '+' : ''}{dailyProfit.toFixed(2)} BTC/d
          </span>
          <span className="text-[9px] text-slate-400 font-sans block">
            Margin: {dailyRevenue > 0 ? ((dailyProfit / dailyRevenue) * 100).toFixed(0) : 0}%
          </span>
        </div>

      </div>

      {/* Inline Dropdown Breakdown Drawer */}
      {expandedMetric && (
        <div className="p-3 rounded-lg bg-slate-900/95 border border-amber-400/50 shadow-2xl text-xs space-y-1.5 animate-in fade-in duration-150">
          
          {expandedMetric === 'output' && (() => {
            const b = worker.individualBonusBreakdown || getWorkerIndividualBonusBreakdown(worker, company);
            const effHourlyPp = b.hourlyOutputPp || hourlyOutputPp;
            const effDailyPp = b.dailyOutputPp || Number((effHourlyPp * 24).toFixed(1));

            return (
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex items-center justify-between text-amber-300 font-sans font-bold pb-1 border-b border-slate-800">
                  <span>Hourly Output Breakdown</span>
                  <span className="font-mono">+{effHourlyPp.toFixed(2)} PP/h</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Base Production:</span>
                  <strong className="text-white">{b.baseProdStat} PROD ({b.baseHourlyPp.toFixed(2)} PP/h)</strong>
                </div>
                {b.toolBonus !== 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span>Tool ({b.toolName || worker.toolItem?.code || 'Equipped'}):</span>
                    <strong className={b.toolBonus > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {b.toolBonus > 0 ? `+${b.toolBonus}%` : `${b.toolBonus}%`}
                    </strong>
                  </div>
                )}
                {b.traitBonus !== 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span>Traits:</span>
                    <strong className={b.traitBonus > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {b.traitBonus > 0 ? `+${b.traitBonus}%` : `${b.traitBonus}%`}
                    </strong>
                  </div>
                )}
                {b.hapBonus !== 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span>Morale ({typeof worker.happiness === 'number' ? worker.happiness : 50}%):</span>
                    <strong className={b.hapBonus > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {b.hapBonus > 0 ? `+${b.hapBonus}%` : `${b.hapBonus}%`}
                    </strong>
                  </div>
                )}
                {b.specBonus !== 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span>Specialization:</span>
                    <strong className={b.specBonus > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {b.specBonus > 0 ? `+${b.specBonus}%` : `${b.specBonus}%`}
                    </strong>
                  </div>
                )}
                {b.mgmtBonus !== 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span>Owner Management:</span>
                    <strong className={b.mgmtBonus > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {b.mgmtBonus > 0 ? `+${b.mgmtBonus}%` : `${b.mgmtBonus}%`}
                    </strong>
                  </div>
                )}
                {b.managerBonus !== 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span>Facility Manager:</span>
                    <strong className={b.managerBonus > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {b.managerBonus > 0 ? `+${b.managerBonus}%` : `${b.managerBonus}%`}
                    </strong>
                  </div>
                )}
                {b.regionalBonus !== 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span>Regional Modifier:</span>
                    <strong className={b.regionalBonus > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {b.regionalBonus > 0 ? `+${b.regionalBonus}%` : `${b.regionalBonus}%`}
                    </strong>
                  </div>
                )}
                <div className="flex justify-between text-slate-400 text-[10px] pt-1 border-t border-dashed border-slate-800">
                  <span># Calculation:</span>
                  <span className="text-slate-300 font-mono">
                    {b.baseHourlyPp.toFixed(2)} PP/h × (1 {b.totalBonus >= 0 ? '+' : '-'} {Math.abs(b.totalBonus)}%) = {effHourlyPp.toFixed(2)} PP/h
                  </span>
                </div>
                <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800 font-bold">
                  <span>Total Output:</span>
                  <span className="text-emerald-400">+{effHourlyPp.toFixed(2)} PP/h ({effDailyPp.toFixed(1)} daily)</span>
                </div>
              </div>
            );
          })()}

          {expandedMetric === 'wage' && (
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex items-center justify-between text-amber-300 font-sans font-bold pb-1 border-b border-slate-800">
                <span>Payroll & Wage Breakdown</span>
                <span className="font-mono text-rose-400">-{hourlyWage.toFixed(4)} BTC/hr</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Hourly Wage:</span>
                <strong className="text-rose-400">-{hourlyWage.toFixed(4)} BTC</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Daily Payroll (24h):</span>
                <strong className="text-rose-400">-{dailyWage.toFixed(3)} BTC</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Weekly Run-Rate (7d):</span>
                <span>-{weeklyWage.toFixed(2)} BTC</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Monthly Run-Rate (30d):</span>
                <span>-{monthlyWage.toFixed(2)} BTC</span>
              </div>
            </div>
          )}

          {expandedMetric === 'revenue' && (
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex items-center justify-between text-amber-300 font-sans font-bold pb-1 border-b border-slate-800">
                <span>Gross Revenue Breakdown</span>
                <span className="font-mono text-emerald-400">+{dailyRevenue.toFixed(3)} BTC/d</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Commodity Market Value per PP:</span>
                <strong>{ratePerPp.toFixed(4)} BTC</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Gross Hourly Revenue:</span>
                <strong className="text-emerald-400">+{hourlyRevenue.toFixed(4)} BTC/hr</strong>
              </div>
              <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800 font-bold">
                <span>Gross Daily Revenue (24h):</span>
                <span className="text-emerald-300">+{dailyRevenue.toFixed(3)} BTC/day</span>
              </div>
            </div>
          )}

          {expandedMetric === 'profit' && (
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex items-center justify-between text-amber-300 font-sans font-bold pb-1 border-b border-slate-800">
                <span>Daily Net Profit Equation</span>
                <span className={`font-mono font-bold ${dailyProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {dailyProfit >= 0 ? '+' : ''}{dailyProfit.toFixed(3)} BTC/d
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Daily Gross Production Value:</span>
                <strong className="text-emerald-400">+{dailyRevenue.toFixed(3)} BTC</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Less Daily Wages:</span>
                <strong className="text-rose-400">-{dailyWage.toFixed(3)} BTC</strong>
              </div>
              <div className="flex justify-between text-slate-100 pt-1 border-t border-slate-800 font-bold">
                <span>Net Daily Profit:</span>
                <span className={dailyProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {dailyProfit >= 0 ? '+' : ''}{dailyProfit.toFixed(3)} BTC/day
                </span>
              </div>
            </div>
          )}

          <div className="text-right pt-1 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setExpandedMetric(null)}
              className="text-[9px] font-sans uppercase tracking-wider text-slate-400 hover:text-amber-300 transition cursor-pointer"
            >
              Close Breakdown ✕
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
