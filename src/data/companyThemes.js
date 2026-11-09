/**
 * Centralized Company & Commodity Theme Engine
 * 
 * Provides unified theme colors, gradients, card borders, ambient radiance,
 * and popup styling based on product classifications:
 * - Raw Materials -> Grey gradient
 * - Small Ammo, Concrete, Steel, Bread, Paper, Oil -> Green gradient
 * - Medium Ammo, Steak -> Blue gradient
 * - Heavy Ammo, Cooked Fish, Pill / Cocain -> Purple gradient
 */

export function getCompanyTheme(companyOrItemCode) {
  let code = '';
  let name = '';
  let isRaw = false;

  if (typeof companyOrItemCode === 'string') {
    code = companyOrItemCode.toLowerCase().trim();
  } else if (companyOrItemCode && typeof companyOrItemCode === 'object') {
    code = (companyOrItemCode.itemCode || companyOrItemCode.recipe?.id || companyOrItemCode.code || '').toLowerCase().trim();
    name = (companyOrItemCode.recipe?.name || companyOrItemCode.name || '').toLowerCase().trim();
    isRaw = Boolean(
      companyOrItemCode.isRaw ||
      companyOrItemCode.recipe?.type === 'raw' ||
      name.includes('raw') ||
      name.includes('mining') ||
      name.includes('quarry') ||
      name.includes('plantation')
    );
  }

  // 1. Raw Materials -> Grey Theme
  const rawCodes = ['grain', 'limestone', 'iron', 'lead', 'petroleum', 'coca', 'mysteriousplant', 'livestock', 'fish', 'wood', 'scraps'];
  if (isRaw || rawCodes.includes(code)) {
    return {
      family: 'grey',
      label: 'Raw Materials',
      accentColor: '#475569',
      // Row table gradient
      rowGradient: 'bg-slate-100/75 hover:bg-slate-200/80 border-b border-slate-200/90',
      // Page & Container Themes
      pageWash: 'bg-gradient-to-b from-slate-100/40 via-slate-50/20 to-transparent',
      cardBorder: 'border-slate-300 shadow-slate-100/70',
      cardHeaderBg: 'bg-gradient-to-r from-slate-100/90 via-slate-50/50 to-white border-b border-slate-200/90',
      heroBorder: 'border-slate-300',
      badgeBg: 'bg-slate-100 text-slate-800 border border-slate-300/80',
      pillTag: 'bg-slate-200 text-slate-800 font-bold',
      iconBox: 'bg-slate-100 border border-slate-300/80 text-slate-700 shadow-xs',
      accentText: 'text-slate-800',
      accentBorder: 'border-slate-400',
      accentGlow: 'rgba(148, 163, 184, 0.20)',
      stadiumGlow: 'bg-[radial-gradient(ellipse_at_top,_rgba(148,163,184,0.22),_transparent_70%)]',
      backButton: 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700/60 shadow-xs',
      kpiHighlight: 'bg-slate-50 border-slate-200 text-slate-800',
      // Modal / Popup Themes
      modalHeader: 'bg-gradient-to-r from-slate-100 via-slate-50 to-white border-b border-slate-200',
      modalBorder: 'border-slate-300 ring-slate-200/50',
      modalKpiBg: 'bg-slate-50/90 border border-slate-200',
      modalPill: 'bg-slate-100 text-slate-800 border border-slate-300',
      liquidGradient: 'from-slate-600 via-slate-500 to-slate-400',
    };
  }

  // 2. Ammo classifications:
  // - Small ammo -> Green Theme
  if (code === 'lightammo' || code === 'smallammo' || code.includes('light') || code.includes('small') || name.includes('light ammo') || name.includes('small ammo')) {
    return {
      family: 'green',
      label: 'Small Munitions',
      accentColor: '#059669',
      rowGradient: 'bg-emerald-50/80 hover:bg-emerald-100/85 border-b border-emerald-200/80',
      pageWash: 'bg-gradient-to-b from-emerald-50/40 via-teal-50/20 to-transparent',
      cardBorder: 'border-emerald-300/90 shadow-emerald-50/70',
      cardHeaderBg: 'bg-gradient-to-r from-emerald-100/80 via-emerald-50/40 to-white border-b border-emerald-200/90',
      heroBorder: 'border-emerald-300',
      badgeBg: 'bg-emerald-50 text-emerald-800 border border-emerald-300/80',
      pillTag: 'bg-emerald-100 text-emerald-900 font-bold',
      iconBox: 'bg-emerald-50 border border-emerald-300/80 text-emerald-800 shadow-xs',
      accentText: 'text-emerald-700',
      accentBorder: 'border-emerald-500',
      accentGlow: 'rgba(16, 185, 129, 0.22)',
      stadiumGlow: 'bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.25),_transparent_70%)]',
      backButton: 'bg-emerald-950 hover:bg-emerald-900 text-emerald-50 border border-emerald-700/60 shadow-xs',
      kpiHighlight: 'bg-emerald-50/70 border-emerald-200 text-emerald-900',
      modalHeader: 'bg-gradient-to-r from-emerald-100/90 via-emerald-50/40 to-white border-b border-emerald-200',
      modalBorder: 'border-emerald-300 ring-emerald-200/50',
      modalKpiBg: 'bg-emerald-50/60 border border-emerald-200',
      modalPill: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
      liquidGradient: 'from-emerald-600 via-teal-500 to-cyan-500',
    };
  }

  // - Heavy ammo -> Purple Theme
  if (code === 'heavyammo' || code.includes('heavy') || name.includes('heavy ammo')) {
    return {
      family: 'purple',
      label: 'Heavy Munitions',
      accentColor: '#7c3aed',
      rowGradient: 'bg-purple-50/80 hover:bg-purple-100/85 border-b border-purple-200/80',
      pageWash: 'bg-gradient-to-b from-purple-50/40 via-fuchsia-50/20 to-transparent',
      cardBorder: 'border-purple-300/90 shadow-purple-50/70',
      cardHeaderBg: 'bg-gradient-to-r from-purple-100/80 via-purple-50/40 to-white border-b border-purple-200/90',
      heroBorder: 'border-purple-300',
      badgeBg: 'bg-purple-50 text-purple-800 border border-purple-300/80',
      pillTag: 'bg-purple-100 text-purple-900 font-bold',
      iconBox: 'bg-purple-50 border border-purple-300/80 text-purple-800 shadow-xs',
      accentText: 'text-purple-700',
      accentBorder: 'border-purple-500',
      accentGlow: 'rgba(168, 85, 247, 0.25)',
      stadiumGlow: 'bg-[radial-gradient(ellipse_at_top,_rgba(168,85,247,0.28),_transparent_70%)]',
      backButton: 'bg-purple-950 hover:bg-purple-900 text-purple-50 border border-purple-700/60 shadow-xs',
      kpiHighlight: 'bg-purple-50/70 border-purple-200 text-purple-900',
      modalHeader: 'bg-gradient-to-r from-purple-100/90 via-purple-50/40 to-white border-b border-purple-200',
      modalBorder: 'border-purple-300 ring-purple-200/50',
      modalKpiBg: 'bg-purple-50/60 border border-purple-200',
      modalPill: 'bg-purple-50 text-purple-800 border border-purple-200',
      liquidGradient: 'from-purple-600 via-fuchsia-500 to-pink-500',
    };
  }

  // - Medium ammo -> Blue Theme
  if (code === 'ammo' || code === 'standardammo' || code === 'mediumammo' || name.includes('standard ammo') || name.includes('medium ammo') || (code.includes('ammo') && !code.includes('light') && !code.includes('heavy'))) {
    return {
      family: 'blue',
      label: 'Standard Munitions',
      accentColor: '#2563eb',
      rowGradient: 'bg-blue-50/80 hover:bg-blue-100/85 border-b border-blue-200/80',
      pageWash: 'bg-gradient-to-b from-blue-50/40 via-sky-50/20 to-transparent',
      cardBorder: 'border-blue-300/90 shadow-blue-50/70',
      cardHeaderBg: 'bg-gradient-to-r from-blue-100/80 via-blue-50/40 to-white border-b border-blue-200/90',
      heroBorder: 'border-blue-300',
      badgeBg: 'bg-blue-50 text-blue-800 border border-blue-300/80',
      pillTag: 'bg-blue-100 text-blue-900 font-bold',
      iconBox: 'bg-blue-50 border border-blue-300/80 text-blue-800 shadow-xs',
      accentText: 'text-blue-700',
      accentBorder: 'border-blue-500',
      accentGlow: 'rgba(59, 130, 246, 0.22)',
      stadiumGlow: 'bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.25),_transparent_70%)]',
      backButton: 'bg-blue-950 hover:bg-blue-900 text-blue-50 border border-blue-700/60 shadow-xs',
      kpiHighlight: 'bg-blue-50/70 border-blue-200 text-blue-900',
      modalHeader: 'bg-gradient-to-r from-blue-100/90 via-blue-50/40 to-white border-b border-blue-200',
      modalBorder: 'border-blue-300 ring-blue-200/50',
      modalKpiBg: 'bg-blue-50/60 border border-blue-200',
      modalPill: 'bg-blue-50 text-blue-800 border border-blue-200',
      liquidGradient: 'from-blue-600 via-sky-500 to-cyan-400',
    };
  }

  // 3. Cooked fish -> Purple Theme
  if (code === 'cookedfish' || code === 'cooked_fish' || name.includes('cooked fish')) {
    return {
      family: 'purple',
      label: 'Cooked Rations',
      accentColor: '#7c3aed',
      rowGradient: 'bg-purple-50/80 hover:bg-purple-100/85 border-b border-purple-200/80',
      pageWash: 'bg-gradient-to-b from-purple-50/40 via-fuchsia-50/20 to-transparent',
      cardBorder: 'border-purple-300/90 shadow-purple-50/70',
      cardHeaderBg: 'bg-gradient-to-r from-purple-100/80 via-purple-50/40 to-white border-b border-purple-200/90',
      heroBorder: 'border-purple-300',
      badgeBg: 'bg-purple-50 text-purple-800 border border-purple-300/80',
      pillTag: 'bg-purple-100 text-purple-900 font-bold',
      iconBox: 'bg-purple-50 border border-purple-300/80 text-purple-800 shadow-xs',
      accentText: 'text-purple-700',
      accentBorder: 'border-purple-500',
      accentGlow: 'rgba(168, 85, 247, 0.25)',
      stadiumGlow: 'bg-[radial-gradient(ellipse_at_top,_rgba(168,85,247,0.28),_transparent_70%)]',
      backButton: 'bg-purple-950 hover:bg-purple-900 text-purple-50 border border-purple-700/60 shadow-xs',
      kpiHighlight: 'bg-purple-50/70 border-purple-200 text-purple-900',
      modalHeader: 'bg-gradient-to-r from-purple-100/90 via-purple-50/40 to-white border-b border-purple-200',
      modalBorder: 'border-purple-300 ring-purple-200/50',
      modalKpiBg: 'bg-purple-50/60 border border-purple-200',
      modalPill: 'bg-purple-50 text-purple-800 border border-purple-200',
      liquidGradient: 'from-purple-600 via-fuchsia-500 to-pink-500',
    };
  }

  // 4. Pill / Cocain -> Purple Theme
  if (code === 'pill' || code === 'cocain' || code === 'combatpill' || name.includes('pill') || name.includes('cocain')) {
    return {
      family: 'purple',
      label: 'Combat Pharma',
      accentColor: '#7c3aed',
      rowGradient: 'bg-purple-50/80 hover:bg-purple-100/85 border-b border-purple-200/80',
      pageWash: 'bg-gradient-to-b from-purple-50/40 via-fuchsia-50/20 to-transparent',
      cardBorder: 'border-purple-300/90 shadow-purple-50/70',
      cardHeaderBg: 'bg-gradient-to-r from-purple-100/80 via-purple-50/40 to-white border-b border-purple-200/90',
      heroBorder: 'border-purple-300',
      badgeBg: 'bg-purple-50 text-purple-800 border border-purple-300/80',
      pillTag: 'bg-purple-100 text-purple-900 font-bold',
      iconBox: 'bg-purple-50 border border-purple-300/80 text-purple-800 shadow-xs',
      accentText: 'text-purple-700',
      accentBorder: 'border-purple-500',
      accentGlow: 'rgba(168, 85, 247, 0.25)',
      stadiumGlow: 'bg-[radial-gradient(ellipse_at_top,_rgba(168,85,247,0.28),_transparent_70%)]',
      backButton: 'bg-purple-950 hover:bg-purple-900 text-purple-50 border border-purple-700/60 shadow-xs',
      kpiHighlight: 'bg-purple-50/70 border-purple-200 text-purple-900',
      modalHeader: 'bg-gradient-to-r from-purple-100/90 via-purple-50/40 to-white border-b border-purple-200',
      modalBorder: 'border-purple-300 ring-purple-200/50',
      modalKpiBg: 'bg-purple-50/60 border border-purple-200',
      modalPill: 'bg-purple-50 text-purple-800 border border-purple-200',
      liquidGradient: 'from-purple-600 via-fuchsia-500 to-pink-500',
    };
  }

  // 5. Steak -> Blue Theme
  if (code === 'steak' || name.includes('steak')) {
    return {
      family: 'blue',
      label: 'Processed Food',
      accentColor: '#2563eb',
      rowGradient: 'bg-blue-50/80 hover:bg-blue-100/85 border-b border-blue-200/80',
      pageWash: 'bg-gradient-to-b from-blue-50/40 via-sky-50/20 to-transparent',
      cardBorder: 'border-blue-300/90 shadow-blue-50/70',
      cardHeaderBg: 'bg-gradient-to-r from-blue-100/80 via-blue-50/40 to-white border-b border-blue-200/90',
      heroBorder: 'border-blue-300',
      badgeBg: 'bg-blue-50 text-blue-800 border border-blue-300/80',
      pillTag: 'bg-blue-100 text-blue-900 font-bold',
      iconBox: 'bg-blue-50 border border-blue-300/80 text-blue-800 shadow-xs',
      accentText: 'text-blue-700',
      accentBorder: 'border-blue-500',
      accentGlow: 'rgba(59, 130, 246, 0.22)',
      stadiumGlow: 'bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.25),_transparent_70%)]',
      backButton: 'bg-blue-950 hover:bg-blue-900 text-blue-50 border border-blue-700/60 shadow-xs',
      kpiHighlight: 'bg-blue-50/70 border-blue-200 text-blue-900',
      modalHeader: 'bg-gradient-to-r from-blue-100/90 via-blue-50/40 to-white border-b border-blue-200',
      modalBorder: 'border-blue-300 ring-blue-200/50',
      modalKpiBg: 'bg-blue-50/60 border border-blue-200',
      modalPill: 'bg-blue-50 text-blue-800 border border-blue-200',
      liquidGradient: 'from-blue-600 via-sky-500 to-cyan-400',
    };
  }

  // 6. Concrete, steel, bread, paper and oil -> Green Theme
  if (['concrete', 'steel', 'bread', 'paper', 'oil', 'refinedoil'].includes(code) || 
      name.includes('concrete') || name.includes('steel') || name.includes('bread') || name.includes('paper') || name.includes('oil')) {
    return {
      family: 'green',
      label: 'Essential Manufacturing',
      accentColor: '#059669',
      rowGradient: 'bg-emerald-50/80 hover:bg-emerald-100/85 border-b border-emerald-200/80',
      pageWash: 'bg-gradient-to-b from-emerald-50/40 via-teal-50/20 to-transparent',
      cardBorder: 'border-emerald-300/90 shadow-emerald-50/70',
      cardHeaderBg: 'bg-gradient-to-r from-emerald-100/80 via-emerald-50/40 to-white border-b border-emerald-200/90',
      heroBorder: 'border-emerald-300',
      badgeBg: 'bg-emerald-50 text-emerald-800 border border-emerald-300/80',
      pillTag: 'bg-emerald-100 text-emerald-900 font-bold',
      iconBox: 'bg-emerald-50 border border-emerald-300/80 text-emerald-800 shadow-xs',
      accentText: 'text-emerald-700',
      accentBorder: 'border-emerald-500',
      accentGlow: 'rgba(16, 185, 129, 0.22)',
      stadiumGlow: 'bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.25),_transparent_70%)]',
      backButton: 'bg-emerald-950 hover:bg-emerald-900 text-emerald-50 border border-emerald-700/60 shadow-xs',
      kpiHighlight: 'bg-emerald-50/70 border-emerald-200 text-emerald-900',
      modalHeader: 'bg-gradient-to-r from-emerald-100/90 via-emerald-50/40 to-white border-b border-emerald-200',
      modalBorder: 'border-emerald-300 ring-emerald-200/50',
      modalKpiBg: 'bg-emerald-50/60 border border-emerald-200',
      modalPill: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
      liquidGradient: 'from-emerald-600 via-teal-500 to-cyan-500',
    };
  }

  // Fallback -> Grey Theme
  return {
    family: 'grey',
    label: 'Standard Asset',
    accentColor: '#475569',
    rowGradient: 'bg-slate-100/75 hover:bg-slate-200/80 border-b border-slate-200/90',
    pageWash: 'bg-gradient-to-b from-slate-100/40 via-slate-50/20 to-transparent',
    cardBorder: 'border-slate-300 shadow-slate-100/70',
    cardHeaderBg: 'bg-gradient-to-r from-slate-100/90 via-slate-50/50 to-white border-b border-slate-200/90',
    heroBorder: 'border-slate-300',
    badgeBg: 'bg-slate-100 text-slate-800 border border-slate-300/80',
    pillTag: 'bg-slate-200 text-slate-800 font-bold',
    iconBox: 'bg-slate-100 border border-slate-300/80 text-slate-700 shadow-xs',
    accentText: 'text-slate-800',
    accentBorder: 'border-slate-400',
    accentGlow: 'rgba(148, 163, 184, 0.20)',
    stadiumGlow: 'bg-[radial-gradient(ellipse_at_top,_rgba(148,163,184,0.22),_transparent_70%)]',
    backButton: 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700/60 shadow-xs',
    kpiHighlight: 'bg-slate-50 border-slate-200 text-slate-800',
    modalHeader: 'bg-gradient-to-r from-slate-100 via-slate-50 to-white border-b border-slate-200',
    modalBorder: 'border-slate-300 ring-slate-200/50',
    modalKpiBg: 'bg-slate-50/90 border border-slate-200',
    modalPill: 'bg-slate-100 text-slate-800 border border-slate-300',
    liquidGradient: 'from-slate-600 via-slate-500 to-slate-400',
  };
}
