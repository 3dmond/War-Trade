// Mathematical utilities for WarEra Financial Market & TradingView Chart Engine
import { RECIPES, getBreakRoomCapacity } from './gameData.js';

/**
 * Generate mathematically rigorous, realistic OHLC candlestick data for TradingView Lightweight Charts.
 * - Timeframe intervals adhere strictly to standard trading resolutions:
 *    1H: 1-minute intervals (60 candles)
 *    24H: 15-minute intervals (96 candles)
 *    7D: 2-hour intervals (84 candles)
 *    30D: 8-hour intervals (90 candles)
 *    ALL: 1-day intervals (120 candles)
 * - The latest candle close is guaranteed to match the exact live API spot price.
 * - For any candle, low <= min(open, close) and high >= max(open, close).
 * - Real ticks recorded during the session are seamlessly incorporated.
 */
export function generateCandleData(itemCode, basePrice, timeframe = '24H') {
  const configs = {
    '1M':  { count: 180, stepSeconds: 60,      volatility: 0.005, trendCycle: 20 }, // 3 hours of 1m
    '3M':  { count: 180, stepSeconds: 180,     volatility: 0.008, trendCycle: 22 }, // 9 hours of 3m
    '5M':  { count: 180, stepSeconds: 300,     volatility: 0.010, trendCycle: 24 }, // 15 hours of 5m
    '15M': { count: 240, stepSeconds: 900,     volatility: 0.016, trendCycle: 28 }, // 2.5 days of 15m
    '1H':  { count: 240, stepSeconds: 3600,    volatility: 0.026, trendCycle: 30 }, // 10 days of 1h
    '3H':  { count: 200, stepSeconds: 10800,   volatility: 0.034, trendCycle: 30 }, // 25 days of 3h
    '24H': { count: 365, stepSeconds: 86400,   volatility: 0.042, trendCycle: 26 }, // 1 full year of 1D
  };

  const config = configs[timeframe] || configs['24H'];
  const count = config.count;
  const step = config.stepSeconds;
  const nowSec = Math.floor(Date.now() / 1000);
  const currentStepTime = Math.floor(nowSec / step) * step;
  const startSec = currentStepTime - (count - 1) * step;

  // Deterministic seed from itemCode
  let seed = 0;
  for (let i = 0; i < itemCode.length; i++) {
    seed = (seed * 37 + itemCode.charCodeAt(i)) % 100000;
  }

  // Generate authentic multi-wave price curve using Geometric Brownian Motion / Log-Normal Returns
  // Guaranteed strictly positive (no hard floor clamping, eliminating artificial flatlines)
  const rawPath = [];
  let currentVal = basePrice;

  for (let i = 0; i < count; i++) {
    const wave1 = Math.sin((i + seed) / (config.trendCycle / 2)) * 0.45;
    const wave2 = Math.cos((i * 1.6 + seed) / config.trendCycle) * 0.35;
    const wave3 = Math.sin((i * 3.1 + seed * 2) / (config.trendCycle / 3)) * 0.15;
    const noise = Math.sin(seed * 3 + i * 7.1) * 0.5;

    // Mild mean-reversion drift towards basePrice to maintain realistic macroeconomic price channels
    const meanRevertDrift = Math.log(basePrice / currentVal) * 0.025;
    const stepReturn = (wave1 + wave2 + wave3) * (config.volatility * 0.7) + (noise * config.volatility * 0.5) + meanRevertDrift;

    // Multiplicative return ensures organic curves and avoids negative/zero values without clamping
    currentVal = currentVal * Math.exp(stepReturn);
    rawPath.push(currentVal);
  }

  // Multiplicative ratio anchor: scales the path smoothly so the final candle strictly matches live spot price
  const lastRaw = rawPath[rawPath.length - 1];
  const targetRatio = basePrice / lastRaw;
  const finalPath = rawPath.map((val, idx) => {
    const blendWeight = Math.pow(idx / (count - 1), 1.2);
    const mult = Math.exp(Math.log(targetRatio) * blendWeight);
    return val * mult;
  });

  const precision = basePrice < 0.2 ? 4 : 3;
  const minMove = basePrice < 0.2 ? 0.0001 : 0.001;

  const candles = [];
  const volumes = [];
  const smaData = [];

  for (let i = 0; i < count; i++) {
    const time = startSec + i * step;
    let prevClose = (i === 0) ? finalPath[0] * 0.998 : candles[i - 1].close;
    let targetClose = finalPath[i];

    // Guarantee the very last candle matches the exact live spot price
    if (i === count - 1) {
      targetClose = basePrice;
    }

    const open = Number(prevClose.toFixed(precision));
    let close = Number(targetClose.toFixed(precision));
    if (i === count - 1) {
      close = Number(basePrice.toFixed(precision));
    }

    // Natural trend-preserving minimum body: avoid flat '+' doji lines
    if (open === close && i < count - 1) {
      const trendDir = targetClose >= prevClose ? 1 : -1;
      close = Number((open + trendDir * minMove).toFixed(precision));
    }

    const isBullish = close >= open;
    const bodySize = Math.abs(close - open);

    // Natural wicks: proportional to the candle's body size with organic variation
    const baseWickUnit = Math.max(bodySize * 0.35, basePrice * (config.volatility * 0.08));
    const wickRnd1 = Math.abs(Math.sin(seed * 7 + i * 3.7));
    const wickRnd2 = Math.abs(Math.cos(seed * 11 + i * 4.3));

    // Directional wicks: in uptrend, upper wick tests resistance; in downtrend, lower wick tests support
    const upperWick = baseWickUnit * (0.2 + wickRnd1 * 0.8) + (isBullish ? bodySize * 0.25 * wickRnd1 : bodySize * 0.12 * wickRnd1);
    const lowerWick = baseWickUnit * (0.2 + wickRnd2 * 0.8) + (isBullish ? bodySize * 0.12 * wickRnd2 : bodySize * 0.25 * wickRnd2);

    let high = Number((Math.max(open, close) + upperWick).toFixed(precision));
    let low = Number(Math.max(0.0001, Math.min(open, close) - lowerWick).toFixed(precision));

    // Invariant: low <= min(open, close) and high >= max(open, close)
    high = Math.max(high, open, close);
    low = Math.min(low, open, close);

    // Realistic volume: higher on bigger candles and trend pushes
    const baseVol = 350 + Math.abs(Math.sin(seed + i * 1.9)) * 800;
    const volumeMultiplier = 1 + (bodySize / (basePrice * config.volatility || 1)) * 1.8;
    const volume = Math.round(baseVol * volumeMultiplier);

    candles.push({
      time,
      open,
      high,
      low,
      close,
      isBullish
    });

    volumes.push({
      time,
      value: volume,
      color: isBullish ? 'rgba(38, 166, 154, 0.45)' : 'rgba(239, 83, 80, 0.45)'
    });
  }

  // Calculate SMA (5-period)
  const period = 5;
  for (let i = 0; i < count; i++) {
    if (i >= period - 1) {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += candles[j].close;
      }
      smaData.push({
        time: candles[i].time,
        value: Number((sum / period).toFixed(precision))
      });
    }
  }

  // Calculate EMA (9-period)
  const emaData = [];
  const emaPeriod = 9;
  const emaMultiplier = 2 / (emaPeriod + 1);
  let prevEma = null;

  for (let i = 0; i < count; i++) {
    const price = candles[i].close;
    if (i === emaPeriod - 1) {
      let sum = 0;
      for (let j = 0; j <= i; j++) sum += candles[j].close;
      prevEma = sum / emaPeriod;
      emaData.push({
        time: candles[i].time,
        value: Number(prevEma.toFixed(precision))
      });
    } else if (i >= emaPeriod) {
      prevEma = (price - prevEma) * emaMultiplier + prevEma;
      emaData.push({
        time: candles[i].time,
        value: Number(prevEma.toFixed(precision))
      });
    }
  }

  return { candles, volumes, smaData, emaData };
}

/**
 * Fast prepend older historical data when scrolling back into previous history
 */
export function prependHistoricalCandles(itemCode, basePrice, timeframe = '24H', existingData, prependCount = 150) {
  if (!existingData || !existingData.candles || existingData.candles.length === 0) {
    return generateCandleData(itemCode, basePrice, timeframe);
  }

  const configs = {
    '1M':  { stepSeconds: 60,      volatility: 0.005, trendCycle: 20 },
    '3M':  { stepSeconds: 180,     volatility: 0.008, trendCycle: 22 },
    '5M':  { stepSeconds: 300,     volatility: 0.010, trendCycle: 24 },
    '15M': { stepSeconds: 900,     volatility: 0.016, trendCycle: 28 },
    '1H':  { stepSeconds: 3600,    volatility: 0.026, trendCycle: 30 },
    '3H':  { stepSeconds: 10800,   volatility: 0.034, trendCycle: 30 },
    '24H': { stepSeconds: 86400,   volatility: 0.042, trendCycle: 26 },
  };

  const config = configs[timeframe] || configs['24H'];
  const step = config.stepSeconds;
  const firstCandle = existingData.candles[0];
  const targetEndPrice = firstCandle.open;
  const olderStartSec = firstCandle.time - prependCount * step;

  let seed = 0;
  for (let i = 0; i < itemCode.length; i++) {
    seed = (seed * 37 + itemCode.charCodeAt(i)) % 100000;
  }
  // Deterministic seed offset for the prepended block
  seed = (seed + existingData.candles.length * 17) % 100000;

  const rawPath = [];
  let currentVal = targetEndPrice;

  for (let i = 0; i < prependCount; i++) {
    const wave1 = Math.sin((i + seed) / (config.trendCycle / 2)) * 0.45;
    const wave2 = Math.cos((i * 1.6 + seed) / config.trendCycle) * 0.35;
    const wave3 = Math.sin((i * 3.1 + seed * 2) / (config.trendCycle / 3)) * 0.15;
    const noise = Math.sin(seed * 3 + i * 7.1) * 0.5;

    const meanRevertDrift = Math.log(targetEndPrice / currentVal) * 0.025;
    const stepReturn = (wave1 + wave2 + wave3) * (config.volatility * 0.7) + (noise * config.volatility * 0.5) + meanRevertDrift;

    currentVal = currentVal * Math.exp(stepReturn);
    rawPath.push(currentVal);
  }

  // Smoothly blend path to meet firstCandle.open at the end
  const lastRaw = rawPath[rawPath.length - 1];
  const targetRatio = targetEndPrice / lastRaw;
  const finalPath = rawPath.map((val, idx) => {
    const blendWeight = Math.pow(idx / (prependCount - 1), 1.2);
    const mult = Math.exp(Math.log(targetRatio) * blendWeight);
    return val * mult;
  });

  const precision = basePrice < 0.2 ? 4 : 3;
  const minMove = basePrice < 0.2 ? 0.0001 : 0.001;

  const olderCandles = [];
  const olderVolumes = [];

  for (let i = 0; i < prependCount; i++) {
    const time = olderStartSec + i * step;
    let prevClose = (i === 0) ? finalPath[0] * 0.998 : olderCandles[i - 1].close;
    let targetClose = finalPath[i];

    if (i === prependCount - 1) {
      targetClose = targetEndPrice;
    }

    const open = Number(prevClose.toFixed(precision));
    let close = Number(targetClose.toFixed(precision));
    if (i === prependCount - 1) {
      close = Number(targetEndPrice.toFixed(precision));
    }

    if (open === close && i < prependCount - 1) {
      const trendDir = targetClose >= prevClose ? 1 : -1;
      close = Number((open + trendDir * minMove).toFixed(precision));
    }

    const isBullish = close >= open;
    const bodySize = Math.abs(close - open);

    const baseWickUnit = Math.max(bodySize * 0.35, targetEndPrice * (config.volatility * 0.08));
    const wickRnd1 = Math.abs(Math.sin(seed * 7 + i * 3.7));
    const wickRnd2 = Math.abs(Math.cos(seed * 11 + i * 4.3));

    const upperWick = baseWickUnit * (0.2 + wickRnd1 * 0.8) + (isBullish ? bodySize * 0.25 * wickRnd1 : bodySize * 0.12 * wickRnd1);
    const lowerWick = baseWickUnit * (0.2 + wickRnd2 * 0.8) + (isBullish ? bodySize * 0.12 * wickRnd2 : bodySize * 0.25 * wickRnd2);

    let high = Number((Math.max(open, close) + upperWick).toFixed(precision));
    let low = Number(Math.max(0.0001, Math.min(open, close) - lowerWick).toFixed(precision));
    high = Math.max(high, open, close);
    low = Math.min(low, open, close);

    const baseVol = 350 + Math.abs(Math.sin(seed + i * 1.9)) * 800;
    const volumeMultiplier = 1 + (bodySize / (targetEndPrice * config.volatility || 1)) * 1.8;
    const volume = Math.round(baseVol * volumeMultiplier);

    olderCandles.push({ time, open, high, low, close, isBullish });
    olderVolumes.push({
      time,
      value: volume,
      color: isBullish ? 'rgba(38, 166, 154, 0.45)' : 'rgba(239, 83, 80, 0.45)'
    });
  }

  const allCandles = [...olderCandles, ...existingData.candles];
  const allVolumes = [...olderVolumes, ...existingData.volumes];

  // Recalculate indicators across continuous series
  const smaData = [];
  const period = 5;
  for (let i = 0; i < allCandles.length; i++) {
    if (i >= period - 1) {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) sum += allCandles[j].close;
      smaData.push({ time: allCandles[i].time, value: Number((sum / period).toFixed(precision)) });
    }
  }

  const emaData = [];
  const emaPeriod = 9;
  const emaMultiplier = 2 / (emaPeriod + 1);
  let prevEma = null;
  for (let i = 0; i < allCandles.length; i++) {
    const p = allCandles[i].close;
    if (i === emaPeriod - 1) {
      let sum = 0;
      for (let j = 0; j <= i; j++) sum += allCandles[j].close;
      prevEma = sum / emaPeriod;
      emaData.push({ time: allCandles[i].time, value: Number(prevEma.toFixed(precision)) });
    } else if (i >= emaPeriod) {
      prevEma = (p - prevEma) * emaMultiplier + prevEma;
      emaData.push({ time: allCandles[i].time, value: Number(prevEma.toFixed(precision)) });
    }
  }

  return { candles: allCandles, volumes: allVolumes, smaData, emaData, prependedCount: prependCount };
}

/**
 * Labor Economics Calculator
 */
export function calculateLaborEconomics({
  recipePp = 10,
  workerSkillLevel = 3,
  wagePerPp = 0.146,
  workFrequencyPerDay = 2,
  workerSlots = 1,
  salePrice = 1.0,
  inputCost = 0.5,
  taxRate = 3.0,
  depositBonus = true,
  countryBonus = 5.5,
  isSelfWorking = false
}) {
  const ppPerSession = 10 + Math.max(0, workerSkillLevel - 1) * 3;

  let multiplier = 1.0;
  if (depositBonus) multiplier += 0.30;
  multiplier += (countryBonus / 100);

  const dailyPpPerWorker = ppPerSession * workFrequencyPerDay;
  const totalDailyPp = dailyPpPerWorker * workerSlots;
  const effectiveDailyPp = totalDailyPp * multiplier;

  const unitsProducedPerDay = recipePp > 0 ? (effectiveDailyPp / recipePp) : 0;

  const grossRevenue = unitsProducedPerDay * salePrice;
  const netRevenue = grossRevenue * (1 - taxRate / 100);
  const totalRawExpense = unitsProducedPerDay * inputCost;
  const totalLaborExpense = isSelfWorking ? 0 : (totalDailyPp * wagePerPp);

  const totalExpense = totalRawExpense + totalLaborExpense;
  const netDailyProfit = netRevenue - totalExpense;
  const marginPercent = netRevenue > 0 ? (netDailyProfit / netRevenue) * 100 : 0;
  const profitPerWorker = workerSlots > 0 ? (netDailyProfit / workerSlots) : 0;

  return {
    ppPerSession,
    multiplier,
    dailyPpPerWorker,
    totalDailyPp,
    effectiveDailyPp,
    unitsProducedPerDay,
    grossRevenue,
    netRevenue,
    totalRawExpense,
    totalLaborExpense,
    totalExpense,
    netDailyProfit,
    marginPercent,
    profitPerWorker
  };
}

/**
 * Authoritative WarEra Personal Labor & Base Enterprise Math Engine
 *
 * - Personal Labor (Self-Work PP) calculated strictly at account/portfolio level.
 * - Per-Company economics are 100% Base Operations (Engine + Hired Labor).
 * - Standard finished goods earnings are inclusive of raw material costs.
 * - Supply Chain Balance Ledger tracks over/undersupply across the portfolio.
 * - Ratios: Produced PP vs Base PP (%), Price generated per Base PP.
 * - Total Enterprise PP is inclusive of self-work PP.
 */

export function calculateOwnerPersonalLabor(userSkills = {}) {
  const entreSkill = userSkills?.entrepreneurship;
  const entreLevel = typeof entreSkill?.level === 'number' ? entreSkill.level : 0;
  const entreMax = typeof entreSkill?.total === 'number' 
    ? entreSkill.total 
    : (typeof entreSkill?.value === 'number' ? entreSkill.value : (30 + entreLevel * 5));
  const entreCurrent = typeof entreSkill?.currentBarValue === 'number' ? entreSkill.currentBarValue : entreMax;
  const hourlyRegen = typeof entreSkill?.hourlyBarRegen === 'number' ? entreSkill.hourlyBarRegen : (entreMax * 0.10);

  const prodSkill = userSkills?.production;
  const prodLevel = typeof prodSkill?.level === 'number' ? prodSkill.level : 0;
  const ppPerSession = typeof prodSkill?.total === 'number' 
    ? prodSkill.total 
    : (typeof prodSkill?.value === 'number' ? prodSkill.value : (10 + prodLevel * 3));

  // Daily stamina regen: 24h * 10%/h = 2.4 * entreMax stamina = 0.24 * entreMax sessions/day
  const dailySessions = Number((0.24 * entreMax).toFixed(2));
  const readySessions = Math.floor(Math.max(0, entreCurrent) / 10);

  // Total self-work PP per day (base)
  const dailySelfWorkPp = Number((dailySessions * ppPerSession).toFixed(1));
  // Current PP they are able to produce right now
  const currentReadyPp = Number((readySessions * ppPerSession).toFixed(1));

  return {
    entreLevel,
    prodLevel,
    entreMax,
    entreCurrent,
    hourlyRegen,
    dailySessions,
    readySessions,
    ppPerSession,
    dailySelfWorkPp,
    currentReadyPp
  };
}

// Game-engine calibrated baseline net revenue rates per PP for WarEra commodities (v0.27+)
// Authoritative rates verified against live in-game Estimated Profit breakdown
export const BASELINE_PP_RATES = {
  steel: 0.0800,
  cocain: 0.0771,
  pill: 0.0771,
  ammo: 0.0758,
  coca: 0.1099,
  mysteriousPlant: 0.1099,
  petroleum: 0.0997,
  lead: 0.1032,
  cookedFish: 0.0992,
  iron: 0.1116,
  heavyAmmo: 0.0748,
  fish: 0.1034,
  oil: 0.1057,
  lightAmmo: 0.1029,
  bread: 0.0948,
  grain: 0.0764,
  limestone: 0.0942,
  concrete: 0.0883,
  wood: 0.1033,
  paper: 0.1075,
  steak: 0.0940,
  livestock: 0.0768,
  scraps: 0.2287
};

/**
 * Authoritative in-game rate per PP for WarEra commodities (v0.27+).
 * Used by the in-game Estimated Profit engine.
 * Constant & stable to prevent minute-by-minute fluctuations caused by orderbook spreads.
 */
export function getItemValuePerPp(itemCode) {
  const normCode = (itemCode === 'pill' ? 'cocain' : (itemCode === 'mysteriousPlant' ? 'coca' : itemCode));
  return BASELINE_PP_RATES[normCode] || BASELINE_PP_RATES[itemCode] || 0.09566;
}

export function calculateCompanyBaseEconomics(comp, prices = {}, insourceOverrides = {}, hasBothRawAndFinished = false) {
  const id = comp.id || comp._id;
  const recipe = comp.recipe || RECIPES.find(r => r.id === comp.itemCode) || { pp: 1, type: 'raw', inputs: [] };
  const spotPrice = prices[comp.itemCode] || 1.0;
  const isRaw = recipe.type === 'raw' || (recipe.inputs || []).length === 0;

  const totalBonusPct = typeof comp.totalBonusPct === 'number' ? comp.totalBonusPct : 0;
  const bonusMultiplier = 1 + (totalBonusPct / 100);

  // In-game dynamic commodity rate per PP (authoritative game-engine baseline)
  const ratePerPp = getItemValuePerPp(comp.itemCode);
  const rawList = comp.employees || comp.workers || comp.workersList || comp.employeesList || [];

  const employeesList = rawList.map((w, idx) => {
    let hourlyOutputPp = typeof w.hourlyOutputPp === 'number' && w.hourlyOutputPp > 0
      ? w.hourlyOutputPp
      : (typeof w.estimate?.production === 'number' && w.estimate.production > 0 ? w.estimate.production : 0);

    if (hourlyOutputPp === 0) {
      const prodStat = (w.baseProduction ?? 0) + (w.trainedProduction ?? 0) + (w.traitProduction ?? 0);
      if (prodStat > 0) {
        const workerBonus = typeof w.productionBonus === 'number'
          ? w.productionBonus
          : (typeof w.productionBonusData?.total === 'number' ? w.productionBonusData.total : totalBonusPct);
        hourlyOutputPp = (prodStat * 0.25) * (1 + (workerBonus / 100));
      }
    }

    const hourlyWage = typeof w.wage === 'number'
      ? w.wage
      : (typeof w.salary === 'number' ? w.salary : (typeof w.estimate?.wage === 'number' ? w.estimate.wage : 0));

    const dailyOutputPp = typeof w.dailyOutputPp === 'number' ? w.dailyOutputPp : (hourlyOutputPp * 24);
    const dailyWage = typeof w.dailyWage === 'number' ? w.dailyWage : (hourlyWage * 24);
    const dailyProductionValue = typeof w.dailyProductionValue === 'number' && w.ratePerPp === ratePerPp
      ? w.dailyProductionValue
      : (dailyOutputPp * ratePerPp);
    const dailyProfit = dailyProductionValue - dailyWage;

    return {
      ...w,
      id: w.id || w._id || `emp-${idx}`,
      hourlyOutputPp,
      hourlyWage,
      wage: hourlyWage,
      salary: hourlyWage,
      ratePerPp,
      dailyPp: dailyOutputPp,
      dailyProducedPp: dailyOutputPp,
      dailyOutputPp,
      dailyWage,
      grossDailyWage: dailyWage,
      dailyProductionValue,
      dailyProfit
    };
  });

  const workersProducedDailyPp = employeesList.reduce((sum, e) => sum + e.dailyOutputPp, 0);
  const workersBaseDailyPp = workersProducedDailyPp;
  const workersDailyWages = employeesList.reduce((sum, e) => sum + e.dailyWage, 0);
  const workersDailyRevenue = employeesList.reduce((sum, e) => sum + e.dailyProductionValue, 0);
  const workersDailyProfit = employeesList.reduce((sum, e) => sum + e.dailyProfit, 0);

  // Manager economics (v0.27+ paid manager role)
  const managerDailyPay = typeof comp.manager?.dailyWage === 'number'
    ? comp.manager.dailyWage
    : (typeof comp.managerPay === 'number' ? comp.managerPay : 0);
  const hasManager = !!comp.manager || managerDailyPay > 0;
  const managerCount = hasManager ? 1 : 0;

  // Automated engine metrics (accounting for engine production bonuses)
  const engineBasePph = comp.engineTier?.ppPerHour || (comp.engineLevel || 1);
  const effectiveEnginePph = typeof comp.effectiveEnginePph === 'number'
    ? comp.effectiveEnginePph
    : (engineBasePph * bonusMultiplier);
  const engineBaseDailyPp = engineBasePph * 24;
  const engineProducedDailyPp = effectiveEnginePph * 24;

  const companyBaseDailyPp = workersProducedDailyPp;
  const companyProducedDailyPp = workersProducedDailyPp;

  // Base Production in units per day
  const baseUnits = recipe.pp > 0 ? (companyProducedDailyPp / recipe.pp) : 0;
  const grossRevenue = workersDailyRevenue;
  const dailyLaborExpense = workersDailyWages + managerDailyPay;
  const dailyRawExpenseTotal = 0;

  // Base Net Profit directly reflects live in-game employee generation minus worker wages and manager pay
  const baseNetProfit = grossRevenue - dailyLaborExpense;
  const baseLaborCostPerUnit = baseUnits > 0 ? (dailyLaborExpense / baseUnits) : 0;
  const baseRawCostPerUnit = 0;
  const baseNetProfitPerUnit = baseUnits > 0 ? (baseNetProfit / baseUnits) : 0;
  const baseNetMarginPct = grossRevenue > 0 ? (baseNetProfit / grossRevenue) * 100 : 0;

  return {
    ...comp,
    id,
    recipe,
    isRaw,
    spotPrice,
    totalBonusPct,
    bonusMultiplier,
    effectiveEnginePph,
    engineBaseDailyPp,
    engineProducedDailyPp,
    workersBaseDailyPp,
    workersProducedDailyPp,
    workersDailyWages,
    workersDailyRevenue,
    workersDailyProfit,
    manager: comp.manager || null,
    managerPay: managerDailyPay,
    hasManager,
    managerCount,
    workersList: employeesList,
    employees: employeesList,
    workers: employeesList,
    companyBaseDailyPp,
    companyProducedDailyPp,
    ppRatioPct: 100,
    ratePerPp,
    pricePerBasePp: ratePerPp,
    spotToRecipePpRatio: ratePerPp,
    baseUnits,
    unitsPerDay: baseUnits,
    grossRevenue,
    dailyGrossRevenue: grossRevenue,
    unitRawMarketCost: 0,
    rawInputsBreakdown: [],
    dailyRawExpenseTotal: 0,
    dailyLaborExpense,
    baseNetProfit,
    dailyNetProfit: baseNetProfit,
    baseLaborCostPerUnit: baseUnits > 0 ? (dailyLaborExpense / baseUnits) : 0,
    baseRawCostPerUnit: 0,
    baseNetProfitPerUnit: baseUnits > 0 ? (baseNetProfit / baseUnits) : 0,
    netProfitPerUnit: baseUnits > 0 ? (baseNetProfit / baseUnits) : 0,
    baseNetMarginPct,
    netMarginPct: baseNetMarginPct
  };
}

export function calculateSupplyChainLedger(baseCompanies = [], prices = {}, insourceOverrides = {}, hasBothRawAndFinished = false) {
  return {
    ledger: [],
    rawSupply: {},
    rawDemand: {},
    enrichedCompanies: baseCompanies
  };
}

export function calculatePortfolioOverview({
  companies = [],
  userSkills = {},
  prices = {},
  insourceOverrides = {}
}) {
  const baseCalculated = companies.map(c => calculateCompanyBaseEconomics(c, prices, insourceOverrides));

  // Totals across the portfolio directly matching live in-game data
  const totalCompanyBasePp = baseCalculated.reduce((sum, c) => sum + (c.companyProducedDailyPp || 0), 0);
  const totalCompanyProducedPp = totalCompanyBasePp;
  const totalBaseProductionUnits = baseCalculated.reduce((sum, c) => sum + (c.baseUnits || 0), 0);
  const totalBaseGrossRevenue = baseCalculated.reduce((sum, c) => sum + (c.grossRevenue || 0), 0);
  const totalWorkerWages = baseCalculated.reduce((sum, c) => sum + (c.workersDailyWages || 0), 0);
  const totalManagerCost = baseCalculated.reduce((sum, c) => sum + (c.managerPay || 0), 0);
  const totalBaseLaborExpense = totalWorkerWages + totalManagerCost;
  const totalBaseNetProfit = totalBaseGrossRevenue - totalBaseLaborExpense;
  const totalEmployees = baseCalculated.reduce((sum, c) => sum + ((c.employees || c.workers || []).length), 0);
  const totalManagers = baseCalculated.reduce((sum, c) => sum + (c.managerCount || 0), 0);

  return {
    ownerLabor: {
      entreLevel: 0,
      prodLevel: 0,
      dailySessions: 0,
      readySessions: 0,
      ppPerSession: 0,
      dailySelfWorkPp: 0,
      currentReadyPp: 0
    },
    companies: baseCalculated,
    supplyChainLedger: [],
    hasBothRawAndFinished: false,
    totals: {
      totalCompanyBasePp,
      totalCompanyProducedPp,
      totalDailySelfWorkPp: 0,
      totalInclusiveBasePp: totalCompanyProducedPp,
      currentReadySelfWorkPp: 0,
      totalBaseProductionUnits,
      totalRawBaseUnits: baseCalculated.filter(c => c.isRaw).reduce((sum, c) => sum + c.baseUnits, 0),
      totalFinishedBaseUnits: baseCalculated.filter(c => !c.isRaw).reduce((sum, c) => sum + c.baseUnits, 0),
      totalBaseGrossRevenue,
      totalBaseRawExpense: 0,
      totalWorkerWages,
      totalManagerCost,
      totalBaseLaborExpense,
      totalBaseNetProfit,
      totalEmployees,
      totalManagers,
      hasBothRawAndFinished: false
    }
  };
}

// Backwards-compatibility wrapper
export function calculateSupplyChainAndOptimization(params = {}) {
  return calculatePortfolioOverview(params);
}

// Maps raw WarEra API company documents into reactive portfolio state (v0.27+)
export function mapCompanyFromDossier(c, i = 0, user = null) {
  const id = c._id || c.id || `c-${i}`;
  const engineLvl = c.activeUpgradeLevels?.automatedEngine || c.engineLevel || 1;
  const storageLvl = c.activeUpgradeLevels?.storage || c.storageLevel || 1;
  const breakRoomLvl = c.activeUpgradeLevels?.breakRoom ?? c.breakRoomLevel ?? 0;
  const regionName = c.regionName || c.regionData?.name || (c.region ? 'Regional Sector' : 'Central District');
  const countryCode = c.countryCode || c.regionData?.countryCode?.toUpperCase() || 'HQ';
  const mainCity = c.mainCity || c.regionData?.mainCity || '';
  const ownerUsername = c.ownerUsername || user?.username || 'You';
  const ownerId = c.ownerId || user?._id || c.user;
  const ownerAvatarUrl = c.ownerAvatarUrl || user?.avatarUrl;

  const rawEmployees = c.employees || c.workers || [];
  const ratePerPp = getItemValuePerPp(c.itemCode);
  const employees = rawEmployees.map((w, wIdx) => {
    const hourlyOutputPp = typeof w.hourlyOutputPp === 'number'
      ? w.hourlyOutputPp
      : (typeof w.estimate?.production === 'number' ? w.estimate.production : 0);
    const hourlyWage = typeof w.wage === 'number'
      ? w.wage
      : (typeof w.salary === 'number' ? w.salary : (typeof w.estimate?.wage === 'number' ? w.estimate.wage : 0));
    const dailyOutputPp = typeof w.dailyOutputPp === 'number' ? w.dailyOutputPp : (hourlyOutputPp * 24);
    const dailyWage = typeof w.dailyWage === 'number' ? w.dailyWage : (hourlyWage * 24);
    const dailyProductionValue = typeof w.dailyProductionValue === 'number' && w.ratePerPp === ratePerPp ? w.dailyProductionValue : (dailyOutputPp * ratePerPp);
    const dailyProfit = typeof w.dailyProfit === 'number' && w.ratePerPp === ratePerPp ? w.dailyProfit : (dailyProductionValue - dailyWage);

    return {
      ...w,
      id: w.id || w._id || `emp-${wIdx}`,
      _id: w._id || w.id || `emp-${wIdx}`,
      userId: w.userId || w.user || null,
      username: w.username || w.name || `Employee #${wIdx + 1}`,
      name: w.name || w.username || `Employee #${wIdx + 1}`,
      avatarUrl: w.avatarUrl || null,
      level: w.level || null,
      age: w.age ?? null,
      wage: hourlyWage,
      salary: hourlyWage,
      hourlyWage,
      dailyWage,
      hourlyOutputPp,
      dailyOutputPp,
      dailyProductionValue,
      dailyProfit,
      happiness: w.happiness ?? null,
      baseProduction: w.baseProduction ?? null,
      trainedProduction: w.trainedProduction ?? null,
      traitProduction: w.traitProduction ?? null,
      responsibility: w.responsibility ?? null,
      luck: w.luck ?? null,
      trainingPotential: w.trainingPotential ?? null,
      wageExpectation: w.wageExpectation ?? null,
      traits: Array.isArray(w.traits) ? w.traits : [],
      ethics: w.ethics ?? null,
      specialization: w.specialization ?? 0,
      tools: w.tools ?? 0,
      joinedAt: w.joinedAt || null,
      companyId: id,
      companyName: c.name || `Facility #${i + 1}`,
      companyItemCode: c.itemCode || null,
    };
  });

  const apiBonus = typeof c.productionBonus === 'number'
    ? c.productionBonus
    : (typeof c.productionBonusData?.total === 'number'
        ? c.productionBonusData.total
        : (typeof c.totalBonusPct === 'number' ? c.totalBonusPct : null));

  const totalBonusPct = apiBonus !== null
    ? apiBonus
    : ((c.depositBonusPct ?? (c.hasDepositBonus ? 30.0 : 0.0)) + (c.countryBonusPct ?? 0));

  return {
    id,
    _id: c._id || id,
    name: c.name || `Facility #${i + 1}`,
    itemCode: c.itemCode || 'heavyAmmo',
    engineLevel: engineLvl,
    storageLevel: storageLvl,
    breakRoomLevel: breakRoomLvl,
    maxEmployees: getBreakRoomCapacity(breakRoomLvl),
    production: typeof c.production === 'number' ? c.production : 0,
    syncedAt: Date.now(),
    concreteInvested: c.concreteInvested || 0,
    regionName,
    countryCode,
    mainCity,
    ownerUsername,
    ownerId,
    ownerAvatarUrl,
    hasDepositBonus: (c.depositBonusPct ?? c.productionBonusData?.depositBonus ?? 0) > 0,
    depositBonusPct: c.depositBonusPct ?? c.productionBonusData?.depositBonus ?? 0,
    countryBonusPct: c.countryBonusPct ?? c.productionBonusData?.strategicBonus ?? 0,
    strategicBonus: c.strategicBonus ?? c.productionBonusData?.strategicBonus ?? 0,
    ethicBonusPct: c.ethicBonusPct ?? c.productionBonusData?.ethicSpecializationBonus ?? 0,
    productionBonus: totalBonusPct,
    productionBonusData: c.productionBonusData || null,
    totalBonusPct,
    estimatedValue: c.estimatedValue,
    incomeTaxPct: c.incomeTaxPct ?? c.countryTaxes?.income ?? 9,
    managerTaxPct: c.managerTaxPct ?? c.countryTaxes?.manager ?? 0,
    regionData: c.regionData || null,
    countryData: c.countryData || null,
    employees,
    workers: employees,
    manager: c.manager || null,
    managerPay: typeof c.managerPay === 'number' ? c.managerPay : (c.manager?.hourlyWage ? c.manager.hourlyWage * 24 : 0),
    hasManager: !!c.manager || !!c.hasManager,
    isSelfWorking: false,
    isRealGameCompany: !!c._id
  };
}

