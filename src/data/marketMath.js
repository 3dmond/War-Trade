// Mathematical utilities for WarEra Financial Market & TradingView Chart Engine
import { api } from '../services/wareraApi';

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
    '15M': { count: 30, stepSeconds: 30, volatility: 0.015, trendCycle: 10 },
    '30M': { count: 30, stepSeconds: 60, volatility: 0.020, trendCycle: 12 },
    '1H': { count: 60, stepSeconds: 60, volatility: 0.025, trendCycle: 15 },
    '24H': { count: 96, stepSeconds: 900, volatility: 0.038, trendCycle: 24 },
    '7D': { count: 84, stepSeconds: 7200, volatility: 0.065, trendCycle: 20 },
    '30D': { count: 90, stepSeconds: 28800, volatility: 0.095, trendCycle: 18 },
    'ALL': { count: 120, stepSeconds: 86400, volatility: 0.150, trendCycle: 25 }
  };

  const config = configs[timeframe] || configs['24H'];
  const count = config.count;
  const step = config.stepSeconds;
  const nowSec = Math.floor(Date.now() / 1000);
  // Quantize startSec to step boundary for clean time grid
  const currentStepTime = Math.floor(nowSec / step) * step;
  const startSec = currentStepTime - (count - 1) * step;

  // Deterministic seed from itemCode
  let seed = 0;
  for (let i = 0; i < itemCode.length; i++) {
    seed = (seed * 37 + itemCode.charCodeAt(i)) % 100000;
  }

  // Generate synthetic multi-wave price cycle
  const rawPath = [];
  let currentVal = basePrice;

  for (let i = 0; i < count; i++) {
    const wave1 = Math.sin((i + seed) / (config.trendCycle / 2)) * 0.45;
    const wave2 = Math.cos((i * 1.6 + seed) / config.trendCycle) * 0.35;
    const wave3 = Math.sin((i * 3.1 + seed * 2) / (config.trendCycle / 3)) * 0.15;
    const noise = (Math.sin(seed * 3 + i * 7.1) * 0.5) * config.volatility;

    const stepDelta = basePrice * (wave1 + wave2 + wave3) * (config.volatility * 0.6) + (basePrice * noise);
    currentVal = Math.max(basePrice * 0.25, currentVal + stepDelta);
    rawPath.push(currentVal);
  }

  // Anchor final candle strictly to the actual live spot price from WarEra
  const lastRaw = rawPath[rawPath.length - 1];
  const offset = basePrice - lastRaw;
  const finalPath = rawPath.map((val, idx) => {
    const blendRatio = idx / (count - 1);
    return Math.max(basePrice * 0.3, val + offset * blendRatio);
  });

  // Pull real ticks recorded during session to anchor the most recent candles
  let recordedTicks = [];
  try {
    recordedTicks = api.getPriceTicks();
  } catch (e) {
    recordedTicks = [];
  }

  const candles = [];
  const volumes = [];
  const smaData = [];

  for (let i = 0; i < count; i++) {
    const time = startSec + i * step;
    let prevClose = i === 0 ? finalPath[0] * 0.996 : candles[i - 1].close;
    let targetClose = finalPath[i];

    // Guarantee the very last candle matches the exact live spot price
    if (i === count - 1) {
      targetClose = basePrice;
    }

    // Check if we have real recorded ticks falling into this candle's time bucket
    const ticksInBucket = recordedTicks.filter(t => t.time >= time && t.time < time + step);
    if (ticksInBucket.length > 0) {
      const pricesInBucket = ticksInBucket
        .map(t => t.prices[itemCode])
        .filter(p => p !== undefined && p > 0);
      if (pricesInBucket.length > 0) {
        targetClose = pricesInBucket[pricesInBucket.length - 1];
      }
    }

    let open = Number(prevClose.toFixed(4));
    let close = Number(targetClose.toFixed(4));
    if (i === count - 1) {
      close = Number(basePrice.toFixed(4));
    }

    // Ensure candle body is clearly visible even on small-priced commodities or short timeframes
    const bodySpread = Math.abs(close - open);
    const minBody = Math.max(basePrice * config.volatility * 0.15, basePrice < 0.1 ? 0.0004 : 0.001);
    if (bodySpread < minBody && i < count - 1) {
      if (i % 2 === 0) {
        close = Number((open + minBody).toFixed(4));
      } else {
        close = Number((Math.max(0.0001, open - minBody)).toFixed(4));
      }
    }

    // Mathematical wick dynamics
    const candleSpread = Math.abs(close - open);
    const minWick = Math.max(basePrice * (config.volatility * 0.35), basePrice < 0.1 ? 0.0006 : 0.0015);
    const upperWick = minWick + Math.abs(Math.sin(seed + i * 2.3)) * (candleSpread * 0.8 + minWick);
    const lowerWick = minWick + Math.abs(Math.cos(seed + i * 3.1)) * (candleSpread * 0.8 + minWick);

    let high = Number((Math.max(open, close) + upperWick).toFixed(4));
    let low = Number(Math.max(0.0001, Math.min(open, close) - lowerWick).toFixed(4));

    // Strict mathematical validation: low <= min(open, close) and high >= max(open, close)
    high = Math.max(high, open, close);
    low = Math.min(low, open, close);

    const isBullish = close >= open;

    // Realistic volume
    const baseVol = 350 + Math.abs(Math.sin(seed + i * 1.9)) * 900;
    const volumeMultiplier = 1 + (candleSpread / (basePrice * config.volatility || 1)) * 1.4;
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
        value: Number((sum / period).toFixed(4))
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
        value: Number(prevEma.toFixed(4))
      });
    } else if (i >= emaPeriod) {
      prevEma = (price - prevEma) * emaMultiplier + prevEma;
      emaData.push({
        time: candles[i].time,
        value: Number(prevEma.toFixed(4))
      });
    }
  }

  return { candles, volumes, smaData, emaData };
}

/**
 * Labor Economics Calculator
 */
export function calculateLaborEconomics({
  recipePp = 10,
  workerSkillLevel = 3,
  wagePerPp = 0.04,
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
