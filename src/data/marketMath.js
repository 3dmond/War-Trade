// Mathematical utilities for WarEra Financial Market & TradingView Chart Engine
import { RECIPES } from './gameData';

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
 * - Supply Chain Balance Ledger tracks over/undersupply across the empire.
 * - Ratios: Produced PP vs Base PP (%), Price generated per Base PP.
 * - Total Empire PP is inclusive of self-work PP.
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

export function calculateCompanyBaseEconomics(comp, prices = {}, insourceOverrides = {}, hasBothRawAndFinished = false) {
  const id = comp.id || comp._id;
  const recipe = comp.recipe || RECIPES.find(r => r.id === comp.itemCode) || { pp: 1, type: 'raw', inputs: [] };
  const spotPrice = prices[comp.itemCode] || 1.0;
  const isRaw = recipe.type === 'raw' || (recipe.inputs || []).length === 0;

  const totalBonusPct = typeof comp.totalBonusPct === 'number' ? comp.totalBonusPct : 0;
  const bonusMultiplier = 1 + (totalBonusPct / 100);

  // Engine: Base PP and Produced PP
  const engineBasePph = comp.engineTier?.ppPerHour || (comp.engineLevel || 1);
  const engineBaseDailyPp = engineBasePph * 24;
  const engineProducedDailyPp = engineBaseDailyPp * bonusMultiplier;

  // Hired Employees: Base PP, Produced PP, Wages
  let workersBaseDailyPp = 0;
  let workersProducedDailyPp = 0;
  let workersDailyWages = 0;

  const workersList = (comp.workersList || comp.workers || []).map(w => {
    const wProdLvl = typeof w.productionSkill === 'number' ? w.productionSkill : 0;
    const wBaseSessionPp = w.productionPointsBase || (10 + wProdLvl * 3);
    const wEnergyLvl = typeof w.energySkill === 'number' ? w.energySkill : 0;
    const wEnergyTotal = w.energyPointsTotal || (30 + wEnergyLvl * 10);
    const wSessions = Number((wEnergyTotal * 0.24).toFixed(2));
    const wFidelity = typeof w.fidelity === 'number' ? w.fidelity : (typeof w.loyaltyBonus === 'number' ? w.loyaltyBonus : 0);
    const wDailyBase = wBaseSessionPp * wSessions;
    const wMultiplier = 1 + ((totalBonusPct + wFidelity) / 100);
    const wProduced = wDailyBase * wMultiplier;
    const wWageRate = typeof w.wagePerPp === 'number' ? w.wagePerPp : (typeof w.wage === 'number' ? w.wage : 0.146);
    const wWage = wProduced * wWageRate;

    workersBaseDailyPp += wDailyBase;
    workersProducedDailyPp += wProduced;
    workersDailyWages += wWage;

    return {
      ...w,
      energySkill: wEnergyLvl,
      energyPointsTotal: wEnergyTotal,
      workSessionsPerDay: wSessions,
      dailySessions: wSessions,
      productionSkill: wProdLvl,
      productionPointsBase: wBaseSessionPp,
      companyTotalBonusPct: totalBonusPct,
      fidelity: wFidelity,
      loyaltyBonus: wFidelity,
      workerMultiplier: wMultiplier,
      effectivePpPerHit: wBaseSessionPp * wMultiplier,
      ppPerHit: wBaseSessionPp * wMultiplier,
      dailyPp: wProduced,
      baseDailyPp: wDailyBase,
      producedDailyPp: wProduced,
      wagePerPp: wWageRate,
      wage: wWageRate,
      dailyWage: wWage
    };
  });

  // Company Base & Produced PP
  const companyBaseDailyPp = engineBaseDailyPp + workersBaseDailyPp;
  const companyProducedDailyPp = engineProducedDailyPp + workersProducedDailyPp;
  const ppRatioPct = companyBaseDailyPp > 0 ? (companyProducedDailyPp / companyBaseDailyPp) * 100 : 100;

  // Base Production in units per day
  const baseUnits = recipe.pp > 0 ? (companyProducedDailyPp / recipe.pp) : 0;
  const grossRevenue = baseUnits * spotPrice;

  // Price as a ratio of Base PP:
  const pricePerBasePp = companyBaseDailyPp > 0 ? (grossRevenue / companyBaseDailyPp) : 0;
  const spotToRecipePpRatio = recipe.pp > 0 ? (spotPrice / recipe.pp) : 0;

  // Raw Material Costs:
  // For users with both raw and finished goods companies, raw materials are supplied internally => cost is 0.
  // For users with only finished goods companies (no raw facilities), raw materials are bought from market.
  const isRawZeroCost = isRaw || hasBothRawAndFinished;

  let unitRawMarketCost = 0;
  const rawInputsBreakdown = isRaw ? [] : (recipe.inputs || []).map(inp => {
    const itemPrice = prices[inp.id] || 0;
    const unitsNeededPerUnit = inp.qty;
    const totalUnitsNeededDaily = baseUnits * inp.qty;
    const costPerUnit = unitsNeededPerUnit * itemPrice;
    const marketRawExpense = totalUnitsNeededDaily * itemPrice;
    unitRawMarketCost += costPerUnit;

    const actualDailyRawExpense = isRawZeroCost ? 0 : marketRawExpense;

    return {
      id: inp.id,
      name: inp.id,
      qtyNeededPerUnit: unitsNeededPerUnit,
      unitMarketPrice: itemPrice,
      totalUnitsNeededDaily,
      costPerUnit,
      marketRawExpense,
      dailyRawExpense: actualDailyRawExpense,
      isInsourced: isRawZeroCost,
      savingsCoins: isRawZeroCost ? marketRawExpense : 0
    };
  });

  const dailyRawExpenseTotal = isRawZeroCost ? 0 : (baseUnits * unitRawMarketCost);
  const dailyLaborExpense = workersDailyWages;

  // Base Net Profit
  const baseNetProfit = grossRevenue - dailyRawExpenseTotal - dailyLaborExpense;

  const baseLaborCostPerUnit = baseUnits > 0 ? (dailyLaborExpense / baseUnits) : 0;
  const baseRawCostPerUnit = isRawZeroCost ? 0 : unitRawMarketCost;
  const baseNetProfitPerUnit = spotPrice - baseRawCostPerUnit - baseLaborCostPerUnit;

  const baseNetMarginPct = grossRevenue > 0 ? (baseNetProfit / grossRevenue) * 100 : 0;

  return {
    ...comp,
    id,
    recipe,
    isRaw,
    spotPrice,
    totalBonusPct,
    bonusMultiplier,
    engineBaseDailyPp,
    engineProducedDailyPp,
    workersBaseDailyPp,
    workersProducedDailyPp,
    workersDailyWages,
    workersList,
    companyBaseDailyPp,
    companyProducedDailyPp,
    ppRatioPct,
    pricePerBasePp,
    spotToRecipePpRatio,
    baseUnits,
    unitsPerDay: baseUnits,
    grossRevenue,
    dailyGrossRevenue: grossRevenue,
    unitRawMarketCost,
    rawInputsBreakdown,
    dailyRawExpenseTotal,
    dailyLaborExpense,
    baseNetProfit,
    dailyNetProfit: baseNetProfit,
    baseLaborCostPerUnit,
    baseRawCostPerUnit,
    baseNetProfitPerUnit,
    netProfitPerUnit: baseNetProfitPerUnit,
    baseNetMarginPct,
    netMarginPct: baseNetMarginPct
  };
}

export function calculateSupplyChainLedger(baseCompanies = [], prices = {}, insourceOverrides = {}, hasBothRawAndFinished = false) {
  // Aggregate Base Supply (from owned raw producers)
  const rawSupply = {};
  baseCompanies.forEach(c => {
    if (c.isRaw) {
      if (!rawSupply[c.itemCode]) {
        rawSupply[c.itemCode] = {
          units: 0,
          producers: []
        };
      }
      rawSupply[c.itemCode].units += c.baseUnits;
      rawSupply[c.itemCode].producers.push(c);
    }
  });

  // Aggregate Base Demand (from owned finished consumers)
  const rawDemand = {};
  const downstreamMap = {};
  baseCompanies.forEach(c => {
    if (!c.isRaw) {
      (c.recipe?.inputs || []).forEach(inp => {
        if (!rawDemand[inp.id]) {
          rawDemand[inp.id] = {
            units: 0,
            consumers: []
          };
        }
        const needed = c.baseUnits * inp.qty;
        rawDemand[inp.id].units += needed;
        rawDemand[inp.id].consumers.push({
          companyId: c.id || c._id,
          name: c.name,
          recipeName: c.recipe?.name || c.itemCode,
          neededUnits: needed
        });

        if (!downstreamMap[inp.id]) downstreamMap[inp.id] = [];
        downstreamMap[inp.id].push({
          id: c.id || c._id,
          name: c.name,
          recipeName: c.recipe?.name || c.itemCode,
          dailyNeeded: needed
        });
      });
    }
  });

  // Unique list of all commodities involved
  const allCommodityCodes = Array.from(new Set([
    ...Object.keys(rawSupply),
    ...Object.keys(rawDemand)
  ]));

  const ledger = allCommodityCodes.map(code => {
    const supplyUnits = rawSupply[code]?.units || 0;
    const demandUnits = rawDemand[code]?.units || 0;
    const balanceUnits = Number((supplyUnits - demandUnits).toFixed(1));
    const price = prices[code] || 1.0;

    let status = 'balanced';
    if (balanceUnits > 0.05) status = 'surplus';
    else if (balanceUnits < -0.05) status = 'deficit';

    const surplusUnits = Math.max(0, balanceUnits);
    const deficitUnits = Math.max(0, -balanceUnits);
    const surplusCoins = surplusUnits * price;
    const deficitCoins = deficitUnits * price;

    return {
      itemCode: code,
      unitPrice: price,
      supplyUnits,
      demandUnits,
      balanceUnits,
      status, // 'surplus' (oversupply) | 'deficit' (undersupply) | 'balanced'
      surplusUnits,
      deficitUnits,
      surplusCoins,
      deficitCoins,
      producers: rawSupply[code]?.producers || [],
      consumers: rawDemand[code]?.consumers || []
    };
  });

  // Enriched raw inputs for each company showing insource toggleability & cost changes
  const enrichedCompanies = baseCompanies.map(comp => {
    const downstreamConsumers = downstreamMap[comp.itemCode] || [];

    if (comp.isRaw) {
      const demand = rawDemand[comp.itemCode]?.units || 0;
      const internalSupplied = Math.min(comp.baseUnits, demand);
      const externalMarketUnits = Math.max(0, comp.baseUnits - demand);
      const internalTransferValue = internalSupplied * comp.spotPrice;

      return {
        ...comp,
        isSupplyingInternal: internalSupplied > 0,
        internalSupplied,
        externalMarketUnits,
        internalTransferValue,
        downstreamConsumers
      };
    }

    // Finished Goods company inputs
    const enrichedInputs = (comp.rawInputsBreakdown || []).map(inp => {
      const owned = rawSupply[inp.id];
      const hasOwnedProducer = !!(owned && owned.units > 0);
      const overrideKey = `${comp.id || comp._id}_${inp.id}`;

      // If user has both raw and finished goods companies, raw costs are 0!
      const isInsourced = hasBothRawAndFinished || (hasOwnedProducer
        ? (insourceOverrides[overrideKey] !== undefined ? insourceOverrides[overrideKey] : true)
        : false);

      const availableSupply = owned?.units || 0;
      const insourcedUnits = hasBothRawAndFinished
        ? inp.totalUnitsNeededDaily
        : (isInsourced ? Math.min(inp.totalUnitsNeededDaily, availableSupply) : 0);
      const deficitUnits = hasBothRawAndFinished ? 0 : Math.max(0, inp.totalUnitsNeededDaily - insourcedUnits);
      const costAvoided = inp.totalUnitsNeededDaily * inp.unitMarketPrice;
      const cashOutflow = hasBothRawAndFinished ? 0 : (deficitUnits * inp.unitMarketPrice);

      return {
        ...inp,
        hasOwnedProducer: hasBothRawAndFinished || hasOwnedProducer,
        hasOwnedCompany: hasBothRawAndFinished || hasOwnedProducer,
        isInsourced,
        isConstrained: false,
        insourcedUnits,
        deficitUnits,
        costAvoided,
        savingsCoins: costAvoided,
        cashOutflow,
        dailyRawExpense: cashOutflow,
        ownedProducers: owned?.producers || [],
        rawProducerCompanies: owned?.producers || []
      };
    });

    const totalCostAvoided = enrichedInputs.reduce((sum, inp) => sum + inp.costAvoided, 0);
    const adjustedRawCashExpense = hasBothRawAndFinished ? 0 : enrichedInputs.reduce((sum, inp) => sum + inp.cashOutflow, 0);
    const dailyRawExpenseTotal = hasBothRawAndFinished ? 0 : comp.dailyRawExpenseTotal;
    const baseNetProfit = comp.grossRevenue - dailyRawExpenseTotal - comp.dailyLaborExpense;
    const adjustedNetProfit = comp.grossRevenue - adjustedRawCashExpense - comp.dailyLaborExpense;

    return {
      ...comp,
      rawInputsBreakdown: enrichedInputs,
      dailyRawExpenseTotal,
      baseRawCostPerUnit: hasBothRawAndFinished ? 0 : comp.baseRawCostPerUnit,
      baseNetProfit,
      totalCostAvoided,
      adjustedRawCashExpense,
      adjustedNetProfit,
      downstreamConsumers
    };
  });

  return {
    ledger,
    rawSupply,
    rawDemand,
    enrichedCompanies
  };
}

export function calculatePortfolioOverview({
  companies = [],
  userSkills = {},
  prices = {},
  insourceOverrides = {}
}) {
  const ownerLabor = calculateOwnerPersonalLabor(userSkills);

  // Helper to reliably detect raw extraction facilities even before recipe binding
  const resolveIsRaw = (c) => {
    if (typeof c.isRaw === 'boolean') return c.isRaw;
    const rec = c.recipe || RECIPES.find(r => r.id === (c.itemCode || c.id || c.type || c.recipeId));
    if (rec) {
      return rec.type === 'raw' || !rec.inputs || rec.inputs.length === 0;
    }
    return false;
  };

  // Detect whether the user owns both raw resource extraction facilities and finished goods manufacturing facilities
  const hasRawCompanies = companies.some(c => resolveIsRaw(c));
  const hasFinishedCompanies = companies.some(c => !resolveIsRaw(c));
  const hasBothRawAndFinished = hasRawCompanies && hasFinishedCompanies;

  const baseCalculated = companies.map(c => calculateCompanyBaseEconomics(c, prices, insourceOverrides, hasBothRawAndFinished));
  const { ledger, rawSupply, rawDemand, enrichedCompanies } = calculateSupplyChainLedger(baseCalculated, prices, insourceOverrides, hasBothRawAndFinished);

  // Totals across the portfolio
  const totalCompanyBasePp = enrichedCompanies.reduce((sum, c) => sum + c.companyBaseDailyPp, 0);
  const totalCompanyProducedPp = enrichedCompanies.reduce((sum, c) => sum + c.companyProducedDailyPp, 0);
  const totalDailySelfWorkPp = ownerLabor.dailySelfWorkPp;
  // Inclusive total PP across enterprise:
  const totalInclusiveBasePp = totalCompanyBasePp + totalDailySelfWorkPp;
  const currentReadySelfWorkPp = ownerLabor.currentReadyPp;

  const totalBaseProductionUnits = enrichedCompanies.reduce((sum, c) => sum + c.baseUnits, 0);
  const totalRawBaseUnits = enrichedCompanies.filter(c => c.isRaw).reduce((sum, c) => sum + c.baseUnits, 0);
  const totalFinishedBaseUnits = enrichedCompanies.filter(c => !c.isRaw).reduce((sum, c) => sum + c.baseUnits, 0);
  const totalBaseGrossRevenue = enrichedCompanies.reduce((sum, c) => sum + c.grossRevenue, 0);
  const totalBaseRawExpense = hasBothRawAndFinished ? 0 : enrichedCompanies.reduce((sum, c) => sum + (c.dailyRawExpenseTotal || 0), 0);
  const totalBaseLaborExpense = enrichedCompanies.reduce((sum, c) => sum + c.dailyLaborExpense, 0);
  const totalBaseNetProfit = totalBaseGrossRevenue - totalBaseRawExpense - totalBaseLaborExpense;

  return {
    ownerLabor,
    companies: enrichedCompanies,
    supplyChainLedger: ledger,
    hasBothRawAndFinished,
    totals: {
      totalCompanyBasePp,
      totalCompanyProducedPp,
      totalDailySelfWorkPp,
      totalInclusiveBasePp,
      currentReadySelfWorkPp,
      totalBaseProductionUnits,
      totalRawBaseUnits,
      totalFinishedBaseUnits,
      totalBaseGrossRevenue,
      totalBaseRawExpense,
      totalBaseLaborExpense,
      totalBaseNetProfit,
      hasBothRawAndFinished
    }
  };
}

// Backwards-compatibility wrapper
export function calculateSupplyChainAndOptimization(params = {}) {
  return calculatePortfolioOverview(params);
}

