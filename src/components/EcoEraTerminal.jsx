import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  createChart, 
  ColorType, 
  CrosshairMode, 
  CandlestickSeries, 
  LineSeries, 
  HistogramSeries, 
  LineStyle 
} from 'lightweight-charts';
import { 
  Search, 
  RefreshCw, 
  Plus, 
  X, 
  BarChart2, 
  LineChart, 
  ArrowUpRight, 
  ArrowDownRight,
  Sun,
  Moon,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  MousePointer,
  TrendingUp,
  Square,
  Circle,
  Ruler,
  Maximize2,
  Trash2,
  Sliders,
  Layers,
  Sparkles
} from 'lucide-react';
import { RECIPES } from '../data/gameData';
import { generateCandleData } from '../data/marketMath';
import ChartDrawingsOverlay from './ChartDrawingsOverlay';

export default function EcoEraTerminal({ prices = {}, onRefreshPrices, isRefreshing = false }) {
  const [selectedItemCode, setSelectedItemCode] = useState('ammo');
  const [comparisonItemCode, setComparisonItemCode] = useState('');
  const [chartType, setChartType] = useState('candle'); // 'candle' | 'line'
  const [timeframe, setTimeframe] = useState('24H');
  const [themeMode, setThemeMode] = useState('light');
  const [watchlistSearch, setWatchlistSearch] = useState('');
  
  // Active Drawing Tool: 'cursor' | 'trendline' | 'channel' | 'fibRetracement' | 'fibExtension' | 'rectangle' | 'circle' | 'ruler'
  const [activeDrawingTool, setActiveDrawingTool] = useState('cursor');

  // Watchlist category collapse states
  const [collapsedSections, setCollapsedSections] = useState({});

  // Analysis overlays
  const [showSma, setShowSma] = useState(true);
  const [showEma, setShowEma] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [showBreakEven, setShowBreakEven] = useState(true);

  // Live crosshair inspection state
  const [crosshairData, setCrosshairData] = useState(null);

  // Refs for Chart and Series to prevent re-creation and avoid violent canvas shifts
  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const lineSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const smaSeriesRef = useRef(null);
  const emaSeriesRef = useRef(null);
  const comparisonSeriesRef = useRef(null);
  const breakEvenLineRef = useRef(null);

  // Active chart dataset ref to avoid random shifting of historical bars
  const activeHistoryRef = useRef(null);
  const activeParamsRef = useRef({ itemCode: '', timeframe: '', chartType: '' });

  // Primary selected item recipe & spot price
  const primaryRecipe = useMemo(() => {
    return RECIPES.find(r => r.id === selectedItemCode) || RECIPES[0];
  }, [selectedItemCode]);

  const primarySpot = prices[selectedItemCode] || 1.0;

  // Single unit craft cost
  const craftCost = useMemo(() => {
    if (!primaryRecipe.inputs || primaryRecipe.inputs.length === 0) return 0;
    let cost = 0;
    primaryRecipe.inputs.forEach(inp => {
      cost += (prices[inp.id] || 0) * inp.qty;
    });
    return cost;
  }, [primaryRecipe, prices]);

  // Order Book Quotes
  const marketOrderBook = useMemo(() => {
    const spot = primarySpot;
    const spreadPct = (selectedItemCode === 'cocain' || selectedItemCode === 'pill' || selectedItemCode === 'case2') ? 2.5 : 1.4;
    const halfSpread = (spot * (spreadPct / 100)) / 2;

    const topBuyPrice = Number((spot - halfSpread).toFixed(4));  // Bid: sell instantly at
    const topSellPrice = Number((spot + halfSpread).toFixed(4)); // Ask: buy instantly at
    const spread = Number((topSellPrice - topBuyPrice).toFixed(4));
    const avgPrice = Number(((topBuyPrice + topSellPrice) / 2).toFixed(4));

    const netSellRealized = topBuyPrice * 0.97;
    const craftMargin = craftCost > 0 ? ((netSellRealized - craftCost) / netSellRealized) * 100 : 0;
    const craftNetProfit = craftCost > 0 ? (netSellRealized - craftCost) : 0;

    return {
      topBuyPrice,
      topSellPrice,
      spread,
      spreadPct,
      avgPrice,
      craftCost,
      craftMargin,
      craftNetProfit
    };
  }, [primarySpot, selectedItemCode, craftCost]);

  const comparisonSpot = comparisonItemCode ? (prices[comparisonItemCode] || 1.0) : 0;

  // All commodities with Buy, Sell, and Spread calculated for the market list
  const allCommodities = useMemo(() => {
    return RECIPES.map(recipe => {
      const spot = prices[recipe.id] || 0;
      let cost = 0;
      if (recipe.inputs && recipe.inputs.length > 0) {
        recipe.inputs.forEach(inp => {
          cost += (prices[inp.id] || 0) * inp.qty;
        });
      }
      const netSpread = recipe.inputs && recipe.inputs.length > 0 ? (spot * 0.97 - cost) : spot * 0.97;
      const margin = spot > 0 && recipe.inputs && recipe.inputs.length > 0 ? (netSpread / spot) * 100 : 0;

      let seed = 0;
      for (let i = 0; i < recipe.id.length; i++) seed = (seed * 31 + recipe.id.charCodeAt(i)) % 100;
      const chgPct = Number(((seed % 15 - 6.5) * 0.85).toFixed(2));
      const chg = Number((spot * (chgPct / 100)).toFixed(4));

      // Market Quotes: Top Buy (Bid), Top Sell (Ask), Spread
      const spreadPct = (recipe.id === 'cocain' || recipe.id === 'pill' || recipe.id === 'case2') ? 2.5 : 1.4;
      const halfSpread = (spot * (spreadPct / 100)) / 2;
      const buyPrice = Number((spot - halfSpread).toFixed(3));
      const sellPrice = Number((spot + halfSpread).toFixed(3));
      const spread = Number((sellPrice - buyPrice).toFixed(3));

      return {
        ...recipe,
        spot,
        cost,
        netSpread,
        margin,
        chg,
        chgPct,
        buyPrice,
        sellPrice,
        spread,
        ticker: recipe.id.substring(0, 4).toUpperCase()
      };
    });
  }, [prices]);

  const filteredCommodities = useMemo(() => {
    if (!watchlistSearch.trim()) return allCommodities;
    const query = watchlistSearch.toLowerCase();
    return allCommodities.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.ticker.toLowerCase().includes(query) ||
      c.id.toLowerCase().includes(query)
    );
  }, [allCommodities, watchlistSearch]);

  const groupedWatchlist = useMemo(() => {
    const groups = {
      'MUNITIONS': [],
      'MANUFACTURED': [],
      'FOOD & FARMING': [],
      'RAW EXTRACTION': []
    };

    filteredCommodities.forEach(item => {
      if (item.category === 'Munitions') {
        groups['MUNITIONS'].push(item);
      } else if (item.category === 'Construction' || item.category === 'Metallurgy' || item.category === 'Energy' || item.category === 'Pharma' || item.category === 'Governance') {
        if (item.type === 'raw') {
          groups['RAW EXTRACTION'].push(item);
        } else {
          groups['MANUFACTURED'].push(item);
        }
      } else if (item.category === 'Food & Farming') {
        groups['FOOD & FARMING'].push(item);
      } else {
        groups['RAW EXTRACTION'].push(item);
      }
    });

    return groups;
  }, [filteredCommodities]);

  const toggleSection = (sectionName) => {
    setCollapsedSections(prev => ({ ...prev, [sectionName]: !prev[sectionName] }));
  };

  const isDark = themeMode === 'dark';
  const themeColors = useMemo(() => {
    if (isDark) {
      return {
        bg: '#131722',
        panelBg: '#1e222d',
        sidebarBg: '#1e222d',
        cardBg: '#171a24',
        text: '#d1d4dc',
        textMuted: '#787b86',
        grid: '#202430',
        border: '#2a2e39',
        upColor: '#26a69a',
        downColor: '#ef5350',
        lineColor: '#38bdf8', // Cyan
        smaColor: '#f59e0b', // Amber
        emaColor: '#c084fc', // Purple
        compColor: '#a855f7', // Violet
        craftColor: '#10b981' // Emerald
      };
    }
    return {
      bg: '#ffffff',
      panelBg: '#ffffff',
      sidebarBg: '#ffffff',
      cardBg: '#f8fafc',
      text: '#131722',
      textMuted: '#64748b',
      grid: '#f1f5f9',
      border: '#e2e8f0',
      upColor: '#16a34a',
      downColor: '#dc2626',
      lineColor: '#0284c7', // Cyan
      smaColor: '#ea580c', // Orange
      emaColor: '#9333ea', // Purple
      compColor: '#7c3aed', // Violet
      craftColor: '#15803d' // Forest green
    };
  }, [isDark]);

  // Determine dynamic price precision for low-cost items (e.g. Ammo at $0.024)
  const pricePrecision = primarySpot < 0.2 ? 4 : 3;
  const priceMinMove = primarySpot < 0.2 ? 0.0001 : 0.001;

  // Initialize TradingView lightweight chart with dynamic full-height
  useEffect(() => {
    if (!chartContainerRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const container = chartContainerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const chart = createChart(container, {
      width,
      height,
      layout: {
        background: { type: ColorType.Solid, color: themeColors.bg },
        textColor: themeColors.textMuted,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: themeColors.grid },
        horzLines: { color: themeColors.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: themeColors.textMuted,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: isDark ? '#2a2e39' : '#131722',
        },
        horzLine: {
          color: themeColors.textMuted,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: isDark ? '#2a2e39' : '#131722',
        },
      },
      rightPriceScale: {
        borderColor: themeColors.border,
        visible: true,
        autoScale: true,
        scaleMargins: {
          top: 0.08,
          bottom: 0.22,
        },
      },
      timeScale: {
        borderColor: themeColors.border,
        timeVisible: true,
        secondsVisible: timeframe === '15M' || timeframe === '30M',
        minBarSpacing: 0.2,
      },
      handleScroll: {
        mouseWheel: false, // Prevents page wheel scroll from fighting candlestick wheel zoom
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: {
          time: true,
          price: true,
        },
        axisDoubleClickReset: {
          time: true,
          price: true,
        },
        mouseWheel: true,
        pinch: true,
      },
    });

    chartInstanceRef.current = chart;

    // Crosshair listener
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time) {
        setCrosshairData(null);
        return;
      }
      const activeSeries = candleSeriesRef.current || lineSeriesRef.current;
      if (!activeSeries) return;
      const data = param.seriesData.get(activeSeries);
      if (data) setCrosshairData(data);
    });

    const handleResize = () => {
      if (chartContainerRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [themeMode, themeColors]);

  // STABLE SERIES SETUP EFFECT: Runs only when itemCode, timeframe, or chartType changes
  // This guarantees historical timestamps are set ONCE, eliminating random shifting of candles and drawings!
  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart) return;

    // Remove existing series before adding new ones
    if (candleSeriesRef.current) {
      try { chart.removeSeries(candleSeriesRef.current); } catch (e) {}
      candleSeriesRef.current = null;
    }
    if (lineSeriesRef.current) {
      try { chart.removeSeries(lineSeriesRef.current); } catch (e) {}
      lineSeriesRef.current = null;
    }
    if (volumeSeriesRef.current) {
      try { chart.removeSeries(volumeSeriesRef.current); } catch (e) {}
      volumeSeriesRef.current = null;
    }
    if (smaSeriesRef.current) {
      try { chart.removeSeries(smaSeriesRef.current); } catch (e) {}
      smaSeriesRef.current = null;
    }
    if (emaSeriesRef.current) {
      try { chart.removeSeries(emaSeriesRef.current); } catch (e) {}
      emaSeriesRef.current = null;
    }

    // Generate initial stable historical dataset
    const initialData = generateCandleData(selectedItemCode, primarySpot, timeframe);
    activeHistoryRef.current = initialData;
    activeParamsRef.current = { itemCode: selectedItemCode, timeframe, chartType };

    // 1. Primary Series
    if (chartType === 'candle') {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: themeColors.upColor,
        downColor: themeColors.downColor,
        borderVisible: false,
        wickUpColor: themeColors.upColor,
        wickDownColor: themeColors.downColor,
        priceFormat: { type: 'price', precision: pricePrecision, minMove: priceMinMove },
      });
      candleSeries.setData(initialData.candles);
      candleSeriesRef.current = candleSeries;
    } else {
      const lineSeries = chart.addSeries(LineSeries, {
        color: themeColors.lineColor,
        lineWidth: 2.5,
        priceFormat: { type: 'price', precision: pricePrecision, minMove: priceMinMove },
      });
      lineSeries.setData(initialData.candles.map(c => ({ time: c.time, value: c.close })));
      lineSeriesRef.current = lineSeries;
    }

    // 2. Volume Histogram
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.78, bottom: 0 },
      });
      volumeSeries.setData(initialData.volumes);
      volumeSeriesRef.current = volumeSeries;
    }

    // 3. SMA Overlay
    if (showSma && initialData.smaData && initialData.smaData.length > 0) {
      const smaSeries = chart.addSeries(LineSeries, {
        color: themeColors.smaColor,
        lineWidth: 1.8,
        priceFormat: { type: 'price', precision: pricePrecision, minMove: priceMinMove },
      });
      smaSeries.setData(initialData.smaData);
      smaSeriesRef.current = smaSeries;
    }

    // 3b. EMA Overlay
    if (showEma && initialData.emaData && initialData.emaData.length > 0) {
      const emaSeries = chart.addSeries(LineSeries, {
        color: themeColors.emaColor,
        lineWidth: 1.8,
        priceFormat: { type: 'price', precision: pricePrecision, minMove: priceMinMove },
      });
      emaSeries.setData(initialData.emaData);
      emaSeriesRef.current = emaSeries;
    }

    // 4. Break-Even Craft Line
    const activeMain = candleSeriesRef.current || lineSeriesRef.current;
    if (showBreakEven && craftCost > 0 && activeMain) {
      breakEvenLineRef.current = activeMain.createPriceLine({
        price: craftCost,
        color: themeColors.craftColor,
        lineWidth: 1.5,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: 'CRAFT COST',
      });
    }

    // Fit content ONLY on symbol or timeframe switch
    chart.timeScale().fitContent();

  }, [selectedItemCode, timeframe, chartType, themeMode, themeColors, showVolume, showSma, showEma]);

  // LIVE SPOT PRICE IN-PLACE UPDATE EFFECT
  // Updates only the latest bar without moving timestamps or jerking the chart camera!
  useEffect(() => {
    if (!activeHistoryRef.current) return;
    const history = activeHistoryRef.current;
    if (!history.candles || history.candles.length === 0) return;

    const activeMain = candleSeriesRef.current || lineSeriesRef.current;
    if (!activeMain) return;

    const lastIdx = history.candles.length - 1;
    const lastCandle = history.candles[lastIdx];
    const newClose = Number(primarySpot.toFixed(pricePrecision));

    const updatedCandle = {
      ...lastCandle,
      close: newClose,
      high: Math.max(lastCandle.high, newClose),
      low: Math.min(lastCandle.low, newClose),
      isBullish: newClose >= lastCandle.open
    };

    history.candles[lastIdx] = updatedCandle;

    // In-place series update
    if (candleSeriesRef.current) {
      candleSeriesRef.current.update(updatedCandle);
    } else if (lineSeriesRef.current) {
      lineSeriesRef.current.update({ time: updatedCandle.time, value: updatedCandle.close });
    }

    // Update SMA last point in-place
    if (smaSeriesRef.current && history.smaData && history.smaData.length > 0) {
      const smaPeriod = 5;
      const recentCandles = history.candles.slice(-smaPeriod);
      const avg = recentCandles.reduce((acc, c) => acc + c.close, 0) / recentCandles.length;
      const updatedSma = { time: updatedCandle.time, value: Number(avg.toFixed(pricePrecision)) };
      smaSeriesRef.current.update(updatedSma);
    }

    // Update EMA last point in-place
    if (emaSeriesRef.current && history.emaData && history.emaData.length > 0) {
      const emaLast = history.emaData[history.emaData.length - 1];
      const emaMult = 2 / (9 + 1);
      const newEmaVal = (newClose - emaLast.value) * emaMult + emaLast.value;
      emaSeriesRef.current.update({ time: updatedCandle.time, value: Number(newEmaVal.toFixed(pricePrecision)) });
    }

    // Update craft break-even line price if craft cost changed
    if (breakEvenLineRef.current && craftCost > 0) {
      breakEvenLineRef.current.applyOptions({ price: craftCost });
    }

  }, [primarySpot, craftCost, pricePrecision]);

  // Comparison series effect
  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart) return;

    if (comparisonSeriesRef.current) {
      try { chart.removeSeries(comparisonSeriesRef.current); } catch (e) {}
      comparisonSeriesRef.current = null;
    }

    if (comparisonItemCode && comparisonSpot > 0) {
      const compData = generateCandleData(comparisonItemCode, comparisonSpot, timeframe);
      const compSeries = chart.addSeries(LineSeries, {
        color: themeColors.compColor,
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        priceFormat: { type: 'price', precision: 3, minMove: 0.001 },
      });
      compSeries.setData(compData.candles.map(c => ({ time: c.time, value: c.close })));
      comparisonSeriesRef.current = compSeries;
    }
  }, [comparisonItemCode, comparisonSpot, timeframe, themeColors]);

  const activeCandles = activeHistoryRef.current?.candles || [];
  const latestCandle = activeCandles[activeCandles.length - 1] || { open: primarySpot, high: primarySpot, low: primarySpot, close: primarySpot };
  const firstCandle = activeCandles[0] || latestCandle;
  const priceChange = latestCandle.close - firstCandle.open;
  const priceChangePct = firstCandle.open > 0 ? (priceChange / firstCandle.open) * 100 : 0;
  const isUp = priceChange >= 0;
  const displayOhlc = crosshairData && crosshairData.open !== undefined ? crosshairData : latestCandle;

  // TradingView Left Toolbar Tools
  const drawingTools = [
    { id: 'cursor', label: 'Pointer / Pan', icon: MousePointer },
    { id: 'trendline', label: 'Trend Line', icon: TrendingUp },
    { id: 'channel', label: 'Parallel Channel', icon: Layers },
    { id: 'fibRetracement', label: 'Fibonacci Retracement (0.618)', icon: Sparkles },
    { id: 'fibExtension', label: 'Fibonacci Extension / Reversal', icon: ArrowUpRight },
    { id: 'rectangle', label: 'Rectangle Zone', icon: Square },
    { id: 'circle', label: 'Circle Reversal', icon: Circle },
    { id: 'ruler', label: 'Measurement Ruler', icon: Ruler },
  ];

  return (
    <div className={`h-full flex flex-col space-y-2 select-none ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* Top Compact Ticker Tape Strip */}
      <div className={`rounded-xl px-4 py-1.5 flex items-center justify-between text-xs font-mono shrink-0 shadow-xs ${
        isDark ? 'bg-[#1e222d]' : 'bg-white border border-slate-200/60'
      }`}>
        <div className="flex items-center space-x-2 shrink-0 pr-4">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
          <span className={`font-bold tracking-wider ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
            ECOERA TERMINAL
          </span>
        </div>

        <div className="flex items-center space-x-6 overflow-x-auto scrollbar-none whitespace-nowrap py-0.5">
          {allCommodities.slice(0, 10).map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedItemCode(item.id)}
              className="flex items-center space-x-1.5 hover:opacity-75 transition focus:outline-none"
            >
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{item.ticker}</span>
              <span className="font-bold">${item.spot.toFixed(3)}</span>
              <span className={`text-[11px] font-bold ${item.chgPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {item.chgPct >= 0 ? '▲' : '▼'} {Math.abs(item.chgPct).toFixed(1)}%
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={onRefreshPrices}
          disabled={isRefreshing}
          className={`pl-4 shrink-0 transition ${isDark ? 'text-slate-400 hover:text-amber-400' : 'text-slate-500 hover:text-amber-700'}`}
          title="Refresh live spot quotes"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} />
        </button>
      </div>

      {/* Main Full-Height Workspace: Left Drawing Toolbar + Chart Canvas + Right Watchlist */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
        
        {/* LEFT WORKSPACE (lg: 8 cols, xl: 9 cols): Drawing Bar + Chart Canvas */}
        <div className={`lg:col-span-8 xl:col-span-9 rounded-2xl flex flex-col min-h-0 p-3 shadow-sm ${
          isDark ? 'bg-[#1e222d]' : 'bg-white border border-slate-200/60'
        }`}>
          
          {/* Chart Header Bar: Title, Timeframes, Overlays, Theme */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b shrink-0 border-slate-700/20">
            
            {/* Symbol & Live Quote */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold font-sans tracking-tight">{primaryRecipe.name}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                  isDark ? 'bg-amber-400/10 text-amber-400' : 'bg-amber-50 text-amber-800'
                }`}>
                  {primaryRecipe.id.substring(0, 4).toUpperCase()}
                </span>
                <span className="text-xl font-extrabold font-mono ml-2">
                  ${primarySpot.toFixed(pricePrecision)}
                </span>
                <span className={`text-xs font-mono font-bold flex items-center ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {isUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                  {isUp ? '+' : ''}{priceChangePct.toFixed(2)}% ({timeframe})
                </span>
              </div>
            </div>

            {/* Timeframe & Chart Style Toolbar */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
              
              {/* Candles vs Line */}
              <div className={`flex rounded-lg p-0.5 ${isDark ? 'bg-[#131722]' : 'bg-slate-100'}`}>
                <button
                  onClick={() => setChartType('candle')}
                  className={`px-2 py-0.5 rounded transition ${
                    chartType === 'candle'
                      ? 'bg-amber-500 text-white font-bold'
                      : isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Candles
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`px-2 py-0.5 rounded transition ${
                    chartType === 'line'
                      ? 'bg-amber-500 text-white font-bold'
                      : isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Line
                </button>
              </div>

              {/* Timeframes: 15M, 30M, 1H, 24H, 7D, 30D, ALL */}
              <div className={`flex rounded-lg p-0.5 ${isDark ? 'bg-[#131722]' : 'bg-slate-100'}`}>
                {['15M', '30M', '1H', '24H', '7D', '30D', 'ALL'].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2 py-0.5 rounded transition font-medium ${
                      timeframe === tf
                        ? isDark ? 'bg-[#2a2e39] text-white font-bold' : 'bg-white text-slate-900 font-bold shadow-xs'
                        : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              {/* Comparison Selector */}
              <div className={`flex items-center space-x-1 rounded-lg px-2 py-0.5 ${
                isDark ? 'bg-[#131722]' : 'bg-slate-100'
              }`}>
                <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>VS:</span>
                <select
                  value={comparisonItemCode || ''}
                  onChange={(e) => setComparisonItemCode(e.target.value)}
                  className="bg-transparent text-purple-400 font-bold focus:outline-none cursor-pointer text-xs"
                >
                  <option value="" className={isDark ? 'bg-[#1e222d] text-slate-300' : 'text-slate-600'}>None</option>
                  {RECIPES.filter(r => r.id !== selectedItemCode).map(r => (
                    <option key={r.id} value={r.id} className={isDark ? 'bg-[#1e222d] text-slate-300' : 'text-slate-800'}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Indicators */}
              <button
                onClick={() => setShowSma(!showSma)}
                className={`px-2 py-0.5 rounded flex items-center gap-1 font-medium ${
                  showSma
                    ? isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-900'
                    : isDark ? 'bg-[#131722] text-slate-500' : 'bg-slate-100 text-slate-500'
                }`}
                title="Simple Moving Average (5)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>SMA</span>
              </button>

              <button
                onClick={() => setShowEma(!showEma)}
                className={`px-2 py-0.5 rounded flex items-center gap-1 font-medium ${
                  showEma
                    ? isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-900'
                    : isDark ? 'bg-[#131722] text-slate-500' : 'bg-slate-100 text-slate-500'
                }`}
                title="Exponential Moving Average (9)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                <span>EMA</span>
              </button>

              <button
                onClick={() => setShowBreakEven(!showBreakEven)}
                className={`px-2 py-0.5 rounded flex items-center gap-1 font-medium ${
                  showBreakEven
                    ? isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-900'
                    : isDark ? 'bg-[#131722] text-slate-500' : 'bg-slate-100 text-slate-500'
                }`}
                title="Craft Break-Even Line"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Craft Line</span>
              </button>

              <button
                onClick={() => setShowVolume(!showVolume)}
                className={`px-2 py-0.5 rounded flex items-center gap-1 font-medium ${
                  showVolume
                    ? isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-900'
                    : isDark ? 'bg-[#131722] text-slate-500' : 'bg-slate-100 text-slate-500'
                }`}
                title="Trading Volume"
              >
                <span>Vol</span>
              </button>

              {/* Auto-Fit Reset Button */}
              <button
                onClick={() => {
                  if (chartInstanceRef.current) {
                    chartInstanceRef.current.timeScale().fitContent();
                  }
                }}
                className={`p-1 rounded transition ${
                  isDark ? 'bg-[#131722] hover:bg-[#2a2e39] text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title="Reset View / Auto-Fit"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Theme Toggle */}
              <button
                onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
                className={`p-1 rounded transition flex items-center ${
                  isDark ? 'bg-[#131722] text-amber-400' : 'bg-slate-100 text-slate-700'
                }`}
                title={`Switch to ${isDark ? 'Light' : 'Dark'} Theme`}
              >
                {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>

            </div>

          </div>

          {/* Subheader: Live OHLC Bar */}
          <div className="flex items-center justify-between text-xs font-mono py-1 px-1 shrink-0 text-slate-400">
            {displayOhlc && (
              <div className="flex items-center space-x-3 text-[11px]">
                <span>O: <strong className={isDark ? 'text-white' : 'text-slate-900'}>${(displayOhlc.open ?? displayOhlc.value ?? 0).toFixed(pricePrecision)}</strong></span>
                <span>H: <strong className={isDark ? 'text-white' : 'text-slate-900'}>${(displayOhlc.high ?? displayOhlc.value ?? 0).toFixed(pricePrecision)}</strong></span>
                <span>L: <strong className={isDark ? 'text-white' : 'text-slate-900'}>${(displayOhlc.low ?? displayOhlc.value ?? 0).toFixed(pricePrecision)}</strong></span>
                <span>C: <strong className={displayOhlc.close >= displayOhlc.open ? 'text-emerald-500' : 'text-rose-500'}>${(displayOhlc.close ?? displayOhlc.value ?? 0).toFixed(pricePrecision)}</strong></span>
              </div>
            )}
            
            {activeDrawingTool !== 'cursor' && (
              <div className="flex items-center space-x-2 text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded text-[11px] font-bold">
                <span>Tool Active: {drawingTools.find(t => t.id === activeDrawingTool)?.label}</span>
                <button onClick={() => setActiveDrawingTool('cursor')} className="text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Center Chart Area with Left Drawing Toolbar */}
          <div className="flex-1 flex min-h-0 relative">
            
            {/* TRADINGVIEW LEFT DRAWING TOOLBAR */}
            <div className={`w-10 flex flex-col items-center py-2 space-y-1.5 rounded-l-xl shrink-0 border-r ${
              isDark ? 'bg-[#171a24] border-slate-800' : 'bg-slate-50 border-slate-200/80'
            }`}>
              {drawingTools.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeDrawingTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveDrawingTool(tool.id)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                      isActive
                        ? 'bg-amber-500 text-white shadow-sm font-bold'
                        : isDark
                        ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                    title={tool.label}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>

            {/* CHART CANVAS WITH SYNCHRONIZED DRAWING OVERLAY */}
            <div className="flex-1 relative min-h-0 overflow-hidden">
              
              {/* Lightweight Charts Canvas */}
              <div 
                ref={chartContainerRef}
                className={`w-full h-full ${
                  isDark ? 'bg-[#131722]' : 'bg-white'
                }`}
              />

              {/* Interactive SVG Drawing Overlay (Handles, Resizing, Dragging, Duplicating) */}
              <ChartDrawingsOverlay
                chart={chartInstanceRef.current}
                mainSeries={candleSeriesRef.current || lineSeriesRef.current}
                activeTool={activeDrawingTool}
                setActiveTool={setActiveDrawingTool}
                isDark={isDark}
                containerRef={chartContainerRef}
              />

            </div>

          </div>

        </div>

        {/* RIGHT WORKSPACE (lg: 4 cols, xl: 3 cols): TradingView Watchlist + Order Book Card */}
        <div className={`lg:col-span-4 xl:col-span-3 rounded-2xl flex flex-col min-h-0 p-3 space-y-3 shadow-sm ${
          isDark ? 'bg-[#1e222d]' : 'bg-white border border-slate-200/60'
        }`}>
          
          {/* Watchlist Header */}
          <div className="space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold font-sans tracking-wide">Market List</span>
              <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {filteredCommodities.length} Commodities
              </span>
            </div>

            <div className="relative font-mono text-xs">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                type="text"
                value={watchlistSearch}
                onChange={(e) => setWatchlistSearch(e.target.value)}
                placeholder="Search symbol..."
                className={`w-full rounded-lg px-8 py-1 text-xs focus:outline-none font-mono ${
                  isDark 
                    ? 'bg-[#131722] text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-amber-400' 
                    : 'bg-slate-100 text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-amber-500'
                }`}
              />
            </div>

            {/* Market List Table Columns: Symbol | Buy | Sell | Spread (Last Price Removed) */}
            <div className={`grid grid-cols-12 text-[10px] uppercase font-mono tracking-wider pb-1 border-b ${
              isDark ? 'text-slate-500 border-slate-800' : 'text-slate-400 border-slate-100'
            }`}>
              <div className="col-span-4">Symbol</div>
              <div className="col-span-3 text-right text-emerald-500/80">Buy (Bid)</div>
              <div className="col-span-3 text-right text-rose-500/80">Sell (Ask)</div>
              <div className="col-span-2 text-right">Spread</div>
            </div>
          </div>

          {/* Grouped Watchlist Items (Scrollable) */}
          <div className="flex-1 overflow-y-auto space-y-2 scrollbar-none min-h-0">
            {Object.entries(groupedWatchlist).map(([groupName, items]) => {
              if (items.length === 0) return null;
              const isCollapsed = collapsedSections[groupName];

              return (
                <div key={groupName} className="space-y-0.5">
                  <button
                    onClick={() => toggleSection(groupName)}
                    className={`w-full flex items-center justify-between text-[11px] font-mono font-bold py-1 px-1 rounded transition text-left ${
                      isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      <span>{groupName}</span>
                    </span>
                    <span className="text-[10px] font-normal text-slate-500">({items.length})</span>
                  </button>

                  {!isCollapsed && (
                    <div className="space-y-0.5">
                      {items.map((item) => {
                        const isSelected = item.id === selectedItemCode;

                        return (
                          <div
                            key={item.id}
                            onClick={() => setSelectedItemCode(item.id)}
                            className={`grid grid-cols-12 items-center py-1.5 px-2 rounded-lg cursor-pointer transition text-xs font-mono ${
                              isSelected
                                ? isDark ? 'bg-amber-400/15 text-white font-bold' : 'bg-amber-50 text-slate-900 font-bold'
                                : isDark ? 'hover:bg-[#131722] text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="col-span-4 flex items-center space-x-1.5 truncate">
                              <span className={`font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                                {item.ticker}
                              </span>
                              <span className="text-[10px] truncate opacity-60 hidden sm:inline">{item.name}</span>
                            </div>

                            <div className="col-span-3 text-right font-bold text-emerald-500 text-[11px]">
                              ${item.buyPrice.toFixed(3)}
                            </div>

                            <div className="col-span-3 text-right font-bold text-rose-500 text-[11px]">
                              ${item.sellPrice.toFixed(3)}
                            </div>

                            <div className={`col-span-2 text-right font-medium text-[11px] ${
                              isDark ? 'text-slate-400' : 'text-slate-600'
                            }`}>
                              ${item.spread.toFixed(3)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* BOTTOM ASSET DETAIL & ORDER BOOK CARD */}
          <div className={`p-3.5 border-t space-y-2.5 rounded-xl shrink-0 ${
            isDark ? 'bg-[#171a24] border-slate-800' : 'bg-slate-50 border-slate-200/70'
          }`}>
            
            {/* Header & Status */}
            <div className="flex items-center justify-between">
              <span className={`text-sm font-bold font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {primaryRecipe.name}
              </span>
              <span className="text-[10px] text-emerald-500 font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Market Live
              </span>
            </div>

            {/* Order Book Quotes */}
            <div className={`p-2.5 rounded-lg space-y-1.5 text-xs font-mono ${
              isDark ? 'bg-[#131722]' : 'bg-white border border-slate-200/60'
            }`}>
              
              {/* Top Buy (Bid) */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Top Buy (Bid)</span>
                  <span className="text-[10px] text-slate-500">Sell at:</span>
                </div>
                <span className="font-bold text-emerald-500 text-sm">
                  ${marketOrderBook.topBuyPrice.toFixed(4)}
                </span>
              </div>

              {/* Top Sell (Ask) */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-700/20">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Top Sell (Ask)</span>
                  <span className="text-[10px] text-slate-500">Buy at:</span>
                </div>
                <span className="font-bold text-rose-500 text-sm">
                  ${marketOrderBook.topSellPrice.toFixed(4)}
                </span>
              </div>

              {/* Spread & Average */}
              <div className={`flex items-center justify-between pt-1 border-t text-[10px] ${
                isDark ? 'border-slate-700/20' : 'border-slate-200'
              }`}>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Spread:</span>
                <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  ${marketOrderBook.spread.toFixed(4)} ({marketOrderBook.spreadPct}%)
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px]">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Mid / Avg:</span>
                <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                  ${marketOrderBook.avgPrice.toFixed(4)}
                </span>
              </div>
            </div>

            {/* Craft Margin Snapshot */}
            {craftCost > 0 && (
              <div className="flex justify-between items-center text-xs font-mono px-1">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Craft Margin:</span>
                <span className={`font-bold ${marketOrderBook.craftMargin >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {marketOrderBook.craftMargin >= 0 ? '+' : ''}{marketOrderBook.craftMargin.toFixed(1)}% (+${marketOrderBook.craftNetProfit.toFixed(3)})
                </span>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
