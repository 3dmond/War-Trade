import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  createChart, 
  ColorType, 
  CrosshairMode, 
  CandlestickSeries, 
  LineSeries, 
  AreaSeries,
  HistogramSeries, 
  LineStyle 
} from 'lightweight-charts';
import { 
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
  Sparkles,
  Activity,
  Settings
} from 'lucide-react';
import { RECIPES } from '../data/gameData';
import { generateCandleData, prependHistoricalCandles } from '../data/marketMath';
import { api } from '../services/wareraApi';
import ChartDrawingsOverlay from './ChartDrawingsOverlay';
import ItemIcon from './ItemIcon';
import ChartSettingsModal from './ChartSettingsModal';

export default function WarEraTerminal({ prices = {}, vwapPrices = {}, orderBook = {}, onRefreshPrices, isRefreshing = false }) {
  const [selectedItemCode, setSelectedItemCode] = useState('ammo');
  const [chartType, setChartType] = useState('candle'); // 'candle' | 'line'
  const [timeframe, setTimeframe] = useState('1M'); // Default: 1 minute chart
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);
  const timeframeDropdownRef = useRef(null);
  const [themeMode, setThemeMode] = useState(() => {
    try {
      return localStorage.getItem('warera_theme') || 'light';
    } catch (e) {
      return 'light';
    }
  });

  // Extensible chart section height (default 68vh, between 60-70 view height)
  const [chartHeightVh, setChartHeightVh] = useState(() => {
    try {
      const saved = localStorage.getItem('warera_chart_height_vh');
      if (saved) return Math.max(45, Math.min(92, Number(saved)));
    } catch (e) {}
    return 68; // Default: 68% view height
  });
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  const isDraggingChartRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartHeightPxRef = useRef(0);
  const chartSectionWrapperRef = useRef(null);

  // Chart appearance settings (MT / TradingView style, default: white bg)
  const [chartSettings, setChartSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('warera_chart_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      bg: '#ffffff',
      upColor: '#16a34a',
      downColor: '#dc2626',
      showGrid: true,
      gridColor: '#f1f5f9',
      showBidLine: true,
      bidLineColor: '#16a34a',
      bidLineStyle: 'dashed',
      showAskLine: true,
      askLineColor: '#dc2626',
      askLineStyle: 'dashed',
    };
  });
  const [showChartSettings, setShowChartSettings] = useState(false);
  const tickerRoundsRef = useRef(0);

  const handleTickerIteration = () => {
    tickerRoundsRef.current += 1;
    // Auto-refresh prices automatically after ~2 ticker rounds
    if (tickerRoundsRef.current % 2 === 0) {
      if (onRefreshPrices) onRefreshPrices();
    }
  };

  const handleUpdateChartSettings = (partial) => {
    setChartSettings(prev => {
      const updated = { ...prev, ...partial };
      try {
        localStorage.setItem('warera_chart_settings', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleResetChartSettings = () => {
    const defaults = themeMode === 'dark' ? {
      bg: '#131722',
      upColor: '#26a69a',
      downColor: '#ef5350',
      showGrid: true,
      gridColor: '#202430',
      showBidLine: true,
      bidLineColor: '#26a69a',
      bidLineStyle: 'dashed',
      showAskLine: true,
      askLineColor: '#ef5350',
      askLineStyle: 'dashed',
    } : {
      bg: '#ffffff',
      upColor: '#16a34a',
      downColor: '#dc2626',
      showGrid: true,
      gridColor: '#f1f5f9',
      showBidLine: true,
      bidLineColor: '#16a34a',
      bidLineStyle: 'dashed',
      showAskLine: true,
      askLineColor: '#dc2626',
      askLineStyle: 'dashed',
    };
    setChartSettings(defaults);
    try {
      localStorage.removeItem('warera_chart_settings');
    } catch (e) {}
  };
  
  // Navigation & Real-time fast forward state
  const [isScrolledBack, setIsScrolledBack] = useState(false);
  const isExtendingHistoryRef = useRef(false);

  // Active Drawing Tool: 'cursor' | 'trendline' | 'channel' | 'fibRetracement' | 'fibExtension' | 'rectangle' | 'circle' | 'ruler'
  const [activeDrawingTool, setActiveDrawingTool] = useState('cursor');

  // Watchlist category collapse states
  const [collapsedSections, setCollapsedSections] = useState({});

  // Analysis overlays
  const [showVolume, setShowVolume] = useState(true);

  // Live crosshair inspection state
  const [crosshairData, setCrosshairData] = useState(null);

  // Live Transactions Tape (Strict 10-Item FIFO Buffer) - Default ON
  const [showLiveTape, setShowLiveTape] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const knownTradeIdsRef = useRef(new Set());
  const prevTopOrdersRef = useRef(null);

  const handleStartResize = (clientY) => {
    isDraggingChartRef.current = true;
    dragStartYRef.current = clientY;
    dragStartHeightPxRef.current = chartSectionWrapperRef.current 
      ? chartSectionWrapperRef.current.clientHeight 
      : (window.innerHeight * (chartHeightVh / 100));
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMouseDownResize = (e) => {
    e.preventDefault();
    handleStartResize(e.clientY);
  };

  const handleTouchStartResize = (e) => {
    if (e.touches?.[0]) {
      handleStartResize(e.touches[0].clientY);
    }
  };

  useEffect(() => {
    const handleWinResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (chartContainerRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', handleWinResize);
    return () => window.removeEventListener('resize', handleWinResize);
  }, []);

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!isDraggingChartRef.current) return;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const deltaY = clientY - dragStartYRef.current;
      const newPx = Math.max(260, Math.min(window.innerHeight * 0.92, dragStartHeightPxRef.current + deltaY));
      const newVh = Math.round((newPx / window.innerHeight) * 100);
      setChartHeightVh(newVh);

      if (chartContainerRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    const handlePointerUp = () => {
      if (isDraggingChartRef.current) {
        isDraggingChartRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        try {
          localStorage.setItem('warera_chart_height_vh', chartHeightVh.toString());
        } catch (e) {}

        if (chartContainerRef.current && chartInstanceRef.current) {
          chartInstanceRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
          });
        }
      }
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [chartHeightVh]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (chartContainerRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    }, 40);
    return () => clearTimeout(t);
  }, [chartHeightVh]);

  // Close timeframe dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (timeframeDropdownRef.current && !timeframeDropdownRef.current.contains(e.target)) {
        setShowTimeframeDropdown(false);
      }
    };
    if (showTimeframeDropdown) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [showTimeframeDropdown]);

  // Fetch and update recent transactions (strict FIFO of 10) directly from WarEra
  const updateLiveTransactions = useCallback(async (itemCode) => {
    try {
      // 1. Fetch real historical / live executed trades from WarEra's transaction feed
      const txData = await api.getTransactions({ itemCode, limit: 25, transactionType: 'trading' });
      const rawTrades = txData?.items || [];

      // 2. Fetch active top orders to cross-reference mid-market price
      const topOrders = await api.getItemTopOrders(itemCode);
      const buys = topOrders?.buyOrders || [];
      const sells = topOrders?.sellOrders || [];
      const bestBid = buys[0]?.price || 0;
      const bestAsk = sells[0]?.price || 0;
      const mid = (bestBid && bestAsk) ? (bestBid + bestAsk) / 2 : (bestBid || bestAsk || 1.0);

      let parsedTrades = [];

      if (rawTrades.length > 0) {
        parsedTrades = rawTrades.map(tx => {
          const qty = tx.quantity || 1;
          const total = tx.money || 0;
          const price = Number((total / qty).toFixed(4));
          // If execution price is closer to/above mid price, taker bought; else taker sold
          const side = price >= mid ? 'BUY' : 'SELL';
          return {
            id: tx._id,
            side,
            price,
            quantity: qty,
            total: Number(total.toFixed(2)),
            timestamp: new Date(tx.createdAt).getTime(),
            timeFormatted: new Date(tx.createdAt).toLocaleTimeString('en-GB', { timeZone: 'Africa/Nairobi', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
            itemCode
          };
        });
      } else {
        // Fallback: active order book if no trade logs available yet
        parsedTrades = [
          ...buys.map(b => ({
            id: b._id,
            side: 'BUY',
            price: b.price,
            quantity: b.quantity,
            total: Number((b.price * b.quantity).toFixed(2)),
            timestamp: new Date(b.offerAt).getTime(),
            timeFormatted: new Date(b.offerAt).toLocaleTimeString('en-GB', { timeZone: 'Africa/Nairobi', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
            itemCode
          })),
          ...sells.map(s => ({
            id: s._id,
            side: 'SELL',
            price: s.price,
            quantity: s.quantity,
            total: Number((s.price * s.quantity).toFixed(2)),
            timestamp: new Date(s.offerAt).getTime(),
            timeFormatted: new Date(s.offerAt).toLocaleTimeString('en-GB', { timeZone: 'Africa/Nairobi', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
            itemCode
          }))
        ];
      }

      parsedTrades.sort((a, b) => b.timestamp - a.timestamp);

      setRecentTransactions(prev => {
        // If switching items, load fresh from WarEra
        if (prev.length === 0 || prev[0]?.itemCode !== itemCode) {
          knownTradeIdsRef.current.clear();
          const initial = parsedTrades.slice(0, 10);
          initial.forEach(t => knownTradeIdsRef.current.add(t.id));
          return initial;
        }

        // Add newly arrived trades
        const newTrades = [];
        parsedTrades.forEach(t => {
          if (!knownTradeIdsRef.current.has(t.id)) {
            knownTradeIdsRef.current.add(t.id);
            newTrades.push(t);
          }
        });

        if (newTrades.length === 0) return prev;
        const combined = [...newTrades, ...prev];
        return combined.slice(0, 10);
      });
    } catch (e) {
      console.warn('Error updating live transactions:', e);
    }
  }, []);

  useEffect(() => {
    updateLiveTransactions(selectedItemCode);
    const interval = setInterval(() => {
      updateLiveTransactions(selectedItemCode);
    }, 6000); // 6s responsive live trade polling
    return () => clearInterval(interval);
  }, [selectedItemCode, updateLiveTransactions]);

  // Refs for Chart and Series to prevent re-creation and avoid violent canvas shifts
  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const lineSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const bidPriceLineRef = useRef(null);
  const askPriceLineRef = useRef(null);
  const timeframeRef = useRef(timeframe);
  timeframeRef.current = timeframe;
  const hasReanchoredRef = useRef('');

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

  // Order Book Quotes (Real-time live in-game orders from WarEra)
  const marketOrderBook = useMemo(() => {
    const spot = primarySpot;
    
    // Resolve live order book from WarEra API (supporting alias mappings)
    const liveOrders = orderBook?.[selectedItemCode] 
      || (selectedItemCode === 'mysteriousPlant' ? orderBook?.['coca'] : selectedItemCode === 'pill' ? orderBook?.['cocain'] : null);
    
    const liveBuy = liveOrders?.buyOrders?.[0]?.price;
    const liveSell = liveOrders?.sellOrders?.[0]?.price;
    const buyQty = liveOrders?.buyOrders?.[0]?.quantity;
    const sellQty = liveOrders?.sellOrders?.[0]?.quantity;

    const spreadPctDefault = (selectedItemCode === 'cocain' || selectedItemCode === 'pill' || selectedItemCode === 'case2') ? 2.5 : 1.4;
    const halfSpread = (spot * (spreadPctDefault / 100)) / 2;

    const topBuyPrice = liveBuy !== undefined ? Number(liveBuy.toFixed(4)) : Number((spot - halfSpread).toFixed(4));
    const topSellPrice = liveSell !== undefined ? Number(liveSell.toFixed(4)) : Number((spot + halfSpread).toFixed(4));
    const spread = Number(Math.max(0, topSellPrice - topBuyPrice).toFixed(4));
    const spreadPct = topBuyPrice > 0 ? Number(((spread / topBuyPrice) * 100).toFixed(2)) : spreadPctDefault;
    const avgPrice = Number(((topBuyPrice + topSellPrice) / 2).toFixed(4));

    const netSellRealized = topBuyPrice * 0.97;
    const craftMargin = craftCost > 0 ? ((netSellRealized - craftCost) / netSellRealized) * 100 : 0;
    const craftNetProfit = craftCost > 0 ? (netSellRealized - craftCost) : 0;

    return {
      topBuyPrice,
      topSellPrice,
      buyQty,
      sellQty,
      spread,
      spreadPct,
      avgPrice,
      craftCost,
      craftMargin,
      craftNetProfit,
      isRealOrderBook: liveBuy !== undefined && liveSell !== undefined
    };
  }, [primarySpot, selectedItemCode, craftCost, orderBook]);

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

      // Real live market quotes from WarEra order book
      const liveOrders = orderBook?.[recipe.id] 
        || (recipe.id === 'mysteriousPlant' ? orderBook?.['coca'] : recipe.id === 'pill' ? orderBook?.['cocain'] : null);
      const liveBuy = liveOrders?.buyOrders?.[0]?.price;
      const liveSell = liveOrders?.sellOrders?.[0]?.price;

      const spreadPctDefault = (recipe.id === 'cocain' || recipe.id === 'pill' || recipe.id === 'case2') ? 2.5 : 1.4;
      const halfSpread = (spot * (spreadPctDefault / 100)) / 2;

      const buyPrice = liveBuy !== undefined ? Number(liveBuy.toFixed(3)) : Number((spot - halfSpread).toFixed(3));
      const sellPrice = liveSell !== undefined ? Number(liveSell.toFixed(3)) : Number((spot + halfSpread).toFixed(3));
      const spread = Number(Math.max(0, sellPrice - buyPrice).toFixed(3));

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
        isReal: liveBuy !== undefined,
        ticker: recipe.id.substring(0, 4).toUpperCase()
      };
    });
  }, [prices, orderBook]);

  const groupedWatchlist = useMemo(() => {
    const groups = {
      'MUNITIONS': [],
      'MANUFACTURED': [],
      'FOOD & FARMING': [],
      'RAW EXTRACTION': []
    };

    allCommodities.forEach(item => {
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
  }, [allCommodities]);

  const toggleSection = (sectionName) => {
    setCollapsedSections(prev => ({ ...prev, [sectionName]: !prev[sectionName] }));
  };

  const isDark = themeMode === 'dark';
  const themeColors = useMemo(() => {
    const base = isDark ? {
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
    } : {
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

    return {
      ...base,
      bg: chartSettings.bg || base.bg,
      upColor: chartSettings.upColor || base.upColor,
      downColor: chartSettings.downColor || base.downColor,
      grid: chartSettings.showGrid ? (chartSettings.gridColor || base.grid) : 'transparent',
    };
  }, [isDark, chartSettings]);

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
        fontFamily: "'Plus Jakarta Sans', 'Outfit', system-ui, sans-serif",
        fontSize: 11,
        attributionLogo: false,
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
      localization: {
        timeFormatter: (timestampSec) => {
          const d = new Date(timestampSec * 1000);
          return d.toLocaleDateString('en-GB', {
            timeZone: 'Africa/Nairobi',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }) + ' ' + d.toLocaleTimeString('en-GB', {
            timeZone: 'Africa/Nairobi',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }) + ' GMT+3';
        },
        dateFormat: 'dd MMM yyyy',
      },
      timeScale: {
        borderColor: themeColors.border,
        timeVisible: true,
        secondsVisible: false,
        minBarSpacing: 0.2,
        tickMarkFormatter: (time) => {
          const timestampSec = typeof time === 'number' ? time : (time.timestamp || (time.year ? Math.floor(new Date(Date.UTC(time.year, time.month - 1, time.day)).getTime() / 1000) : 0));
          if (!timestampSec) return '';
          const d = new Date(timestampSec * 1000);
          const tf = timeframeRef.current || '1M';
          if (['1M', '3M', '5M', '15M', '1H', '3H'].includes(tf)) {
            return d.toLocaleTimeString('en-GB', {
              timeZone: 'Africa/Nairobi',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            });
          }
          return d.toLocaleDateString('en-GB', {
            timeZone: 'Africa/Nairobi',
            day: '2-digit',
            month: 'short'
          });
        },
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

    // Crosshair listener: accurately lookup the candle at hovered timestamp
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time) {
        setCrosshairData(null);
        return;
      }
      const history = activeHistoryRef.current;
      const candle = history?.candles?.find(c => c.time === param.time);
      if (candle) {
        setCrosshairData({
          time: candle.time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          value: candle.close,
          isBullish: candle.close >= candle.open
        });
      } else {
        const activeSeries = candleSeriesRef.current || lineSeriesRef.current;
        if (!activeSeries) return;
        const data = param.seriesData.get(activeSeries);
        if (data) setCrosshairData(data);
      }
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
  }, [themeMode]);

  // Live Chart & Series Appearance Options Effect
  useEffect(() => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.applyOptions({
        layout: {
          background: { type: ColorType.Solid, color: themeColors.bg },
        },
        grid: {
          vertLines: { color: themeColors.grid },
          horzLines: { color: themeColors.grid },
        },
      });
    }

    if (candleSeriesRef.current) {
      candleSeriesRef.current.applyOptions({
        upColor: themeColors.upColor,
        downColor: themeColors.downColor,
        wickUpColor: themeColors.upColor,
        wickDownColor: themeColors.downColor,
      });
    }
  }, [themeColors.bg, themeColors.upColor, themeColors.downColor, themeColors.grid]);

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
    bidPriceLineRef.current = null;
    askPriceLineRef.current = null;

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
      const lineSeries = chart.addSeries(AreaSeries, {
        lineColor: themeColors.lineColor,
        topColor: isDark ? 'rgba(56, 189, 248, 0.28)' : 'rgba(2, 132, 199, 0.20)',
        bottomColor: isDark ? 'rgba(56, 189, 248, 0.00)' : 'rgba(2, 132, 199, 0.00)',
        lineWidth: 2.5,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 5,
        crosshairMarkerBorderColor: '#ffffff',
        crosshairMarkerBackgroundColor: themeColors.lineColor,
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

    // Standard timeframe display: minutes, hours, days (never raw seconds)
    chart.timeScale().applyOptions({
      secondsVisible: false,
    });

    // Open view focused on the most recent 60 candles properly scaled to shown size
    const totalBars = initialData.candles.length;
    chart.timeScale().setVisibleLogicalRange({
      from: Math.max(0, totalBars - 60),
      to: totalBars + 4,
    });
    setIsScrolledBack(false);

    // Track scroll position to reveal "Fast Forward" button and lazy-prepend older bars seamlessly
    const handleLogicalRangeChange = (logicalRange) => {
      if (!logicalRange) return;
      const history = activeHistoryRef.current;
      const currentTotal = history?.candles?.length || 0;

      // When user is scrolled back into previous history
      setIsScrolledBack(logicalRange.to < currentTotal - 8);

      // Instantly prepend more historical candles when scrolling near the beginning of history
      if (logicalRange.from < 15 && !isExtendingHistoryRef.current) {
        isExtendingHistoryRef.current = true;
        try {
          const extended = prependHistoricalCandles(selectedItemCode, primarySpot, timeframe, history, 150);
          activeHistoryRef.current = extended;

          if (candleSeriesRef.current) {
            candleSeriesRef.current.setData(extended.candles);
          } else if (lineSeriesRef.current) {
            lineSeriesRef.current.setData(extended.candles.map(c => ({ time: c.time, value: c.close })));
          }

          if (volumeSeriesRef.current) {
            volumeSeriesRef.current.setData(extended.volumes);
          }

          chart.timeScale().setVisibleLogicalRange({
            from: logicalRange.from + extended.prependedCount,
            to: logicalRange.to + extended.prependedCount,
          });
        } catch (err) {
          console.warn('Error extending history:', err);
        } finally {
          setTimeout(() => {
            isExtendingHistoryRef.current = false;
          }, 200);
        }
      }
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange(handleLogicalRangeChange);

    return () => {
      try {
        chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleLogicalRangeChange);
      } catch (e) {}
    };

  }, [selectedItemCode, timeframe, chartType, themeMode, themeColors, showVolume]);

  // LIVE REAL-TIME CANDLE ENGINE & STEPPING
  // Automatically rolls into new candles when timeframe step elapses (e.g. every 60s for 1M)
  // And continuously updates active open candle with real price action without artificial cliff drops!
  useEffect(() => {
    if (!activeHistoryRef.current) return;
    const history = activeHistoryRef.current;
    if (!history.candles || history.candles.length === 0) return;

    const activeMain = candleSeriesRef.current || lineSeriesRef.current;
    if (!activeMain) return;

    const stepSecondsMap = {
      '1M': 60,
      '3M': 180,
      '5M': 300,
      '15M': 900,
      '1H': 3600,
      '3H': 10800,
      '24H': 86400,
    };
    const step = stepSecondsMap[timeframe] || 60;
    const newPrice = Number(primarySpot.toFixed(pricePrecision));

    // 1. Initial Discrepancy Auto-Reanchor
    // If baseline was rendered with an initial fallback/stale quote and real quotes arrive
    const lastIdx = history.candles.length - 1;
    const lastCandle = history.candles[lastIdx];
    const discrepancy = Math.abs(newPrice - lastCandle.open) / (lastCandle.open || 1);
    const anchorKey = `${selectedItemCode}-${timeframe}`;
    
    if (discrepancy > 0.015 && hasReanchoredRef.current !== anchorKey) {
      hasReanchoredRef.current = anchorKey;
      const reanchored = generateCandleData(selectedItemCode, primarySpot, timeframe);
      activeHistoryRef.current = reanchored;
      if (candleSeriesRef.current) candleSeriesRef.current.setData(reanchored.candles);
      if (lineSeriesRef.current) lineSeriesRef.current.setData(reanchored.candles.map(c => ({ time: c.time, value: c.close })));
      if (volumeSeriesRef.current) volumeSeriesRef.current.setData(reanchored.volumes);
      return;
    }

    // 2. Real-time step update / rollover function
    const updateActiveCandle = () => {
      const hist = activeHistoryRef.current;
      if (!hist || !hist.candles || hist.candles.length === 0) return;
      const activeSeries = candleSeriesRef.current || lineSeriesRef.current;
      if (!activeSeries) return;

      const nowSec = Math.floor(Date.now() / 1000);
      const currentStepTime = Math.floor(nowSec / step) * step;
      const curIdx = hist.candles.length - 1;
      const curCandle = hist.candles[curIdx];
      const curPrice = Number(primarySpot.toFixed(pricePrecision));

      if (currentStepTime > curCandle.time) {
        // A new candle interval has arrived (e.g. next minute)
        const openPrice = curCandle.close;
        const newCandle = {
          time: currentStepTime,
          open: openPrice,
          high: Math.max(openPrice, curPrice),
          low: Math.min(openPrice, curPrice),
          close: curPrice,
          isBullish: curPrice >= openPrice
        };
        hist.candles.push(newCandle);

        if (candleSeriesRef.current) {
          candleSeriesRef.current.update(newCandle);
        } else if (lineSeriesRef.current) {
          lineSeriesRef.current.update({ time: newCandle.time, value: newCandle.close });
        }

        const newVol = {
          time: currentStepTime,
          value: Math.round(180 + Math.random() * 260),
          color: newCandle.isBullish ? themeColors.upColor : themeColors.downColor
        };
        hist.volumes.push(newVol);
        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.update(newVol);
        }
      } else {
        // Update current open candle
        const updatedCandle = {
          ...curCandle,
          close: curPrice,
          high: Math.max(curCandle.high, curPrice),
          low: Math.min(curCandle.low, curPrice),
          isBullish: curPrice >= curCandle.open
        };
        hist.candles[curIdx] = updatedCandle;

        if (candleSeriesRef.current) {
          candleSeriesRef.current.update(updatedCandle);
        } else if (lineSeriesRef.current) {
          lineSeriesRef.current.update({ time: updatedCandle.time, value: updatedCandle.close });
        }
      }
    };

    // Run immediately on price update
    updateActiveCandle();

    // And run an interval timer every 1s to guarantee candle rollover the exact moment a new step starts
    const timer = setInterval(updateActiveCandle, 1000);
    return () => clearInterval(timer);

  }, [primarySpot, pricePrecision, timeframe, selectedItemCode, themeColors.upColor, themeColors.downColor]);

  // Real-time Bid & Ask Price Lines Effect (Customizable on Chart)
  useEffect(() => {
    const series = candleSeriesRef.current || lineSeriesRef.current;
    if (!series) return;

    const mapLineStyle = (styleStr) => {
      if (styleStr === 'solid') return LineStyle.Solid;
      if (styleStr === 'dotted') return LineStyle.Dotted;
      return LineStyle.Dashed;
    };

    // 1. Bid Price Line
    if (chartSettings.showBidLine !== false && marketOrderBook.topBuyPrice > 0) {
      const bidOpts = {
        price: marketOrderBook.topBuyPrice,
        color: chartSettings.bidLineColor || '#16a34a',
        lineWidth: 1,
        lineStyle: mapLineStyle(chartSettings.bidLineStyle),
        axisLabelVisible: true,
        title: 'BID',
      };
      if (bidPriceLineRef.current) {
        try {
          bidPriceLineRef.current.applyOptions(bidOpts);
        } catch (e) {
          try { series.removePriceLine(bidPriceLineRef.current); } catch (_) {}
          bidPriceLineRef.current = series.createPriceLine(bidOpts);
        }
      } else {
        bidPriceLineRef.current = series.createPriceLine(bidOpts);
      }
    } else if (bidPriceLineRef.current) {
      try { series.removePriceLine(bidPriceLineRef.current); } catch (e) {}
      bidPriceLineRef.current = null;
    }

    // 2. Ask Price Line
    if (chartSettings.showAskLine !== false && marketOrderBook.topSellPrice > 0) {
      const askOpts = {
        price: marketOrderBook.topSellPrice,
        color: chartSettings.askLineColor || '#dc2626',
        lineWidth: 1,
        lineStyle: mapLineStyle(chartSettings.askLineStyle),
        axisLabelVisible: true,
        title: 'ASK',
      };
      if (askPriceLineRef.current) {
        try {
          askPriceLineRef.current.applyOptions(askOpts);
        } catch (e) {
          try { series.removePriceLine(askPriceLineRef.current); } catch (_) {}
          askPriceLineRef.current = series.createPriceLine(askOpts);
        }
      } else {
        askPriceLineRef.current = series.createPriceLine(askOpts);
      }
    } else if (askPriceLineRef.current) {
      try { series.removePriceLine(askPriceLineRef.current); } catch (e) {}
      askPriceLineRef.current = null;
    }
  }, [
    chartSettings.showBidLine,
    chartSettings.bidLineColor,
    chartSettings.bidLineStyle,
    chartSettings.showAskLine,
    chartSettings.askLineColor,
    chartSettings.askLineStyle,
    marketOrderBook.topBuyPrice,
    marketOrderBook.topSellPrice,
    selectedItemCode,
    timeframe,
    chartType
  ]);

  const activeCandles = activeHistoryRef.current?.candles || [];
  const latestCandle = activeCandles[activeCandles.length - 1] || { 
    open: primarySpot, 
    high: primarySpot, 
    low: primarySpot, 
    close: primarySpot,
    time: Math.floor(Date.now() / 1000)
  };
  const firstCandle = activeCandles[0] || latestCandle;
  const priceChange = latestCandle.close - firstCandle.open;
  const priceChangePct = firstCandle.open > 0 ? (priceChange / firstCandle.open) * 100 : 0;
  const isUp = priceChange >= 0;

  // Active bar under crosshair pointer or latest candle
  const displayBar = crosshairData || latestCandle;
  const barOpen = displayBar.open ?? displayBar.value ?? primarySpot;
  const barClose = displayBar.close ?? displayBar.value ?? primarySpot;
  const barHigh = displayBar.high ?? Math.max(barOpen, barClose);
  const barLow = displayBar.low ?? Math.min(barOpen, barClose);
  const barDiff = barClose - barOpen;
  const barDiffPct = barOpen > 0 ? (barDiff / barOpen) * 100 : 0;
  const isBarUp = barClose >= barOpen;

  const formatBarTime = useCallback((timestampSec) => {
    if (!timestampSec) return '';
    const date = new Date(timestampSec * 1000);
    if (['1M', '3M', '5M', '15M', '1H', '3H'].includes(timeframe)) {
      return date.toLocaleDateString('en-GB', { timeZone: 'Africa/Nairobi', month: 'short', day: 'numeric' }) + ' ' + 
             date.toLocaleTimeString('en-GB', { timeZone: 'Africa/Nairobi', hour: '2-digit', minute: '2-digit', second: (timeframe === '1M' || timeframe === '3M') ? '2-digit' : undefined, hour12: false }) + ' GMT+3';
    }
    if (timeframe === '24H') {
      return date.toLocaleDateString('en-GB', { timeZone: 'Africa/Nairobi', month: 'short', day: 'numeric', year: 'numeric' }) + ' (GMT+3)';
    }
    return date.toLocaleDateString('en-GB', { timeZone: 'Africa/Nairobi', month: 'short', year: 'numeric' });
  }, [timeframe]);

  const timeframeLabel = useMemo(() => {
    const map = {
      '1M': '1m Candle',
      '3M': '3m Candle',
      '5M': '5m Candle',
      '15M': '15m Candle',
      '1H': '1h Candle',
      '3H': '3h Candle',
      '24H': '24h (Daily) Candle',
    };
    return map[timeframe] || `${timeframe} Candle`;
  }, [timeframe]);

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
    <div className={`h-full w-full flex flex-col select-none overflow-hidden ${isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}`}>
      
      {/* Top Seamless Continuous Moving Ticker Tape (High-Contrast NYC Exchange Board) */}
      <div className="w-full overflow-hidden py-1.5 border-b shrink-0 select-none bg-black border-zinc-800 text-white shadow-xs">
        <div 
          className="animate-marquee flex items-center space-x-7 whitespace-nowrap cursor-pointer"
          onAnimationIteration={handleTickerIteration}
        >
          {[...allCommodities, ...allCommodities].map((item, idx) => (
            <button
              key={`${item.id}-${idx}`}
              onClick={() => setSelectedItemCode(item.id)}
              className="flex items-center space-x-2 text-xs font-mono transition hover:opacity-80 focus:outline-none shrink-0"
              title={`Switch chart to ${item.name} (${item.ticker})`}
            >
              <ItemIcon itemCode={item.id} size={18} className="shrink-0" />
              <span className="font-black text-white tracking-wider text-xs">
                {item.ticker}
              </span>
              <span className="font-mono font-black text-white text-xs tracking-tight">
                {item.spot < 0.2 ? item.spot.toFixed(4) : item.spot.toFixed(3)}
              </span>
              <span className={`text-[11px] font-black px-1.5 py-0.5 rounded border ${
                item.chgPct >= 0 
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-500/60' 
                  : 'bg-rose-950 text-rose-400 border-rose-500/60'
              }`}>
                {item.chgPct >= 0 ? '▲ +' : '▼ '}{Math.abs(item.chgPct).toFixed(1)}%
              </span>
              <span className="text-zinc-700 font-bold ml-2">•</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Full-Height Workspace: Left Drawing Toolbar + Chart Canvas + Right Watchlist */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 w-full overflow-y-auto lg:overflow-hidden scrollbar-none">
        
        {/* LEFT WORKSPACE (lg: 8 cols, xl: 9 cols): Drawing Bar + Chart Canvas */}
        <div 
          ref={chartSectionWrapperRef}
          style={{
            height: isMobile ? `${chartHeightVh}vh` : undefined,
            minHeight: isMobile ? `${chartHeightVh}vh` : undefined,
          }}
          className={`lg:col-span-8 xl:col-span-9 flex flex-col min-h-0 border-r shrink-0 lg:shrink ${
            isDark ? 'bg-[#131722] border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          
          {/* Chart Header Bar: Title, Timeframes, Overlays, Theme */}
          <div className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b shrink-0 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            
            {/* Symbol, Live Quote & High-Contrast BID/ASK (Wrapped to remain 100% visible on mobile) */}
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 w-full lg:w-auto">
              
              {/* Left: Item identity & current spot price */}
              <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                <div className="flex items-center space-x-1.5">
                  <ItemIcon itemCode={selectedItemCode} size={26} showBorder className="shadow-xs shrink-0" />
                  <span className="text-base sm:text-lg font-bold font-sans tracking-tight">{primaryRecipe.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                    isDark ? 'bg-amber-400/10 text-amber-400' : 'bg-amber-50 text-amber-800'
                  }`}>
                    {primaryRecipe.id.substring(0, 4).toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-lg sm:text-xl font-extrabold font-mono">
                    {primarySpot.toFixed(pricePrecision)}
                  </span>
                  <span className={`text-xs font-mono font-bold flex items-center ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                    {isUp ? '+' : ''}{priceChangePct.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Right / Second row on mobile: High Contrast BID & ASK Prices */}
              <div className="flex items-center space-x-1.5 font-mono shrink-0">
                {/* High Contrast BID Display */}
                <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-600 text-white shadow-xs border border-emerald-500">
                  <span className="bg-emerald-800 text-emerald-100 text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider">
                    BID
                  </span>
                  <strong className="text-xs sm:text-sm font-black tracking-tight text-white">
                    {marketOrderBook.topBuyPrice.toFixed(pricePrecision)}
                  </strong>
                </div>

                {/* High Contrast ASK Display */}
                <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-rose-600 text-white shadow-xs border border-rose-500">
                  <span className="bg-rose-800 text-rose-100 text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider">
                    ASK
                  </span>
                  <strong className="text-xs sm:text-sm font-black tracking-tight text-white">
                    {marketOrderBook.topSellPrice.toFixed(pricePrecision)}
                  </strong>
                </div>

                {/* SPREAD */}
                <div className={`hidden sm:flex items-center px-2 py-1 rounded-md border text-[11px] font-bold ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
                }`}>
                  <span className="opacity-75 text-[9px] mr-1">SPR</span>
                  <span>{marketOrderBook.spread.toFixed(pricePrecision)}</span>
                </div>
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

              {/* Single Consolidated Timeframe Selector (Thin dropdown matching text width) */}
              <div className="relative inline-block" ref={timeframeDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowTimeframeDropdown(prev => !prev)}
                  className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold transition border ${
                    showTimeframeDropdown
                      ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                      : isDark
                        ? 'bg-[#1e222d] border-slate-700 text-slate-200 hover:border-slate-500'
                        : 'bg-white border-slate-300 text-slate-800 hover:border-slate-400 shadow-2xs'
                  }`}
                  title="Select Chart Timeframe"
                >
                  <span>{timeframe}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${showTimeframeDropdown ? 'rotate-180 text-amber-500' : 'text-slate-400'}`} />
                </button>

                {showTimeframeDropdown && (
                  <div className={`absolute left-0 mt-1 w-16 py-1 rounded-lg shadow-xl border z-50 flex flex-col font-mono text-xs animate-in fade-in zoom-in-95 duration-100 ${
                    isDark
                      ? 'bg-[#1e222d] border-slate-700 shadow-black/60 text-slate-200'
                      : 'bg-white border-slate-200 shadow-slate-300/60 text-slate-800'
                  }`}>
                    {['1M', '3M', '5M', '15M', '1H', '3H', '24H'].map((tf) => {
                      const isSelected = timeframe === tf;
                      return (
                        <button
                          key={tf}
                          type="button"
                          onClick={() => {
                            setTimeframe(tf);
                            setShowTimeframeDropdown(false);
                          }}
                          className={`w-full text-center py-1 px-2 text-xs font-mono font-semibold transition ${
                            isSelected
                              ? isDark
                                ? 'bg-amber-400/20 text-amber-300 font-bold'
                                : 'bg-amber-50 text-amber-800 font-bold'
                              : isDark
                                ? 'hover:bg-[#2a2e39] text-slate-300'
                                : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          {tf}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Volume Indicator */}
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

              {/* Bid/Ask Price Lines Quick Toggle */}
              <button
                onClick={() => handleUpdateChartSettings({ 
                  showBidLine: chartSettings.showBidLine === false ? true : false,
                  showAskLine: chartSettings.showAskLine === false ? true : false
                })}
                className={`px-2 py-0.5 rounded flex items-center gap-1 font-medium transition ${
                  (chartSettings.showBidLine !== false || chartSettings.showAskLine !== false)
                    ? isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                    : isDark ? 'bg-[#131722] text-slate-500' : 'bg-slate-100 text-slate-500'
                }`}
                title="Toggle Market Bid & Ask Price Lines on Chart"
              >
                <span>B/A Lines</span>
              </button>

              {/* Auto-Fit Reset Button */}
              <button
                onClick={() => {
                  if (chartInstanceRef.current && activeHistoryRef.current) {
                    const totalBars = activeHistoryRef.current.candles.length;
                    chartInstanceRef.current.timeScale().setVisibleLogicalRange({
                      from: Math.max(0, totalBars - 65),
                      to: totalBars + 4
                    });
                    setIsScrolledBack(false);
                  }
                }}
                className={`p-1 rounded transition ${
                  isDark ? 'bg-[#131722] hover:bg-[#2a2e39] text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title="Reset View to Latest Real-Time Candles"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Theme Toggle */}
              <button
                onClick={() => {
                  const next = isDark ? 'light' : 'dark';
                  setThemeMode(next);
                  try {
                    localStorage.setItem('warera_theme', next);
                  } catch (e) {}
                }}
                className={`p-1 rounded transition flex items-center ${
                  isDark ? 'bg-[#131722] text-amber-400' : 'bg-slate-100 text-slate-700'
                }`}
                title={`Switch to ${isDark ? 'Light' : 'Dark'} Theme`}
              >
                {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>

            </div>

          </div>

          {/* Subheader: Live OHLC Bar & Hover Telemetry */}
          <div className="flex flex-wrap items-center justify-between text-xs font-mono py-1 px-1 shrink-0 text-slate-400 gap-y-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
              
              {/* Bar Timestamp (Hidden on phone view as requested) */}
              <span className={`hidden sm:inline-flex px-1.5 py-0.5 rounded font-bold transition ${
                crosshairData 
                  ? (isDark ? 'bg-amber-400/20 text-amber-300' : 'bg-amber-100 text-amber-900')
                  : (isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600')
              }`}>
                {crosshairData ? '📍 ' : '🔴 LIVE '}{formatBarTime(displayBar.time)}
              </span>

              {/* Timeframe Resolution Pill */}
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                isDark ? 'bg-slate-800/80 text-cyan-400' : 'bg-slate-100 text-cyan-700'
              }`}>
                {timeframeLabel}
              </span>

              {/* Line Mode vs Candle Mode Display */}
              {chartType === 'line' ? (
                <div className="flex items-center space-x-2">
                  <span>Price: <strong className={isDark ? 'text-sky-400' : 'text-sky-600'}>{barClose.toFixed(pricePrecision)}</strong></span>
                  <span className={`font-bold ${isBarUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isBarUp ? '+' : ''}{barDiff.toFixed(pricePrecision)} ({isBarUp ? '+' : ''}{barDiffPct.toFixed(2)}%)
                  </span>
                  <span className="text-slate-500 text-[10px] hidden sm:inline">(O: {barOpen.toFixed(pricePrecision)} H: {barHigh.toFixed(pricePrecision)} L: {barLow.toFixed(pricePrecision)})</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2.5">
                  <span>O: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{barOpen.toFixed(pricePrecision)}</strong></span>
                  <span>H: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{barHigh.toFixed(pricePrecision)}</strong></span>
                  <span>L: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{barLow.toFixed(pricePrecision)}</strong></span>
                  <span>C: <strong className={isBarUp ? 'text-emerald-500' : 'text-rose-500'}>{barClose.toFixed(pricePrecision)}</strong></span>
                  <span className={`font-bold ${isBarUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isBarUp ? '+' : ''}{barDiff.toFixed(pricePrecision)} ({isBarUp ? '+' : ''}{barDiffPct.toFixed(2)}%)
                  </span>
                </div>
              )}
            </div>
            
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
          <div 
            className="flex-1 flex min-h-0 relative"
            onContextMenu={(e) => {
              e.preventDefault();
              setShowChartSettings(true);
            }}
          >
            
            {/* TRADINGVIEW LEFT DRAWING TOOLBAR */}
            <div className={`w-10 flex flex-col items-center py-2 space-y-1.5 shrink-0 border-r ${
              isDark ? 'bg-[#171a24] border-slate-800' : 'bg-slate-50 border-slate-200'
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

              {/* Divider below ruler option */}
              <div className={`w-5 h-px my-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />

              {/* LIVE TRANSACTIONS TOGGLE BUTTON (Bottom Left of Chart, Below Ruler) */}
              <button
                onClick={() => setShowLiveTape(prev => !prev)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition relative ${
                  showLiveTape
                    ? 'bg-emerald-500 text-white shadow-md font-bold ring-2 ring-emerald-400/40'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
                title={showLiveTape ? 'Close Live Transactions Feed' : 'Open Live Transactions Feed (Last 10 Trades)'}
              >
                <Activity className="w-4 h-4" />
                {showLiveTape && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </button>

              {/* CHART SETTINGS GEAR BUTTON (Below Live Feed Toggle) */}
              <button
                onClick={() => setShowChartSettings(true)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                  showChartSettings
                    ? 'bg-amber-500 text-white shadow-md font-bold ring-2 ring-amber-400/40'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
                title="Chart Properties (Colors, Candles, Canvas Background)"
              >
                <Settings className="w-4 h-4" />
              </button>
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

              {/* Floating Real-Time Jump Button (visible when inspecting previous history) */}
              {isScrolledBack && (
                <button
                  onClick={() => {
                    if (chartInstanceRef.current && activeHistoryRef.current) {
                      chartInstanceRef.current.timeScale().scrollToRealTime();
                      setIsScrolledBack(false);
                    }
                  }}
                  className="absolute bottom-5 right-16 z-30 flex items-center space-x-1.5 px-3 py-1.5 rounded-full shadow-lg border text-xs font-mono font-bold transition bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300 animate-in fade-in"
                  title="Jump to latest live market price"
                >
                  <span>Fast Forward to Live</span>
                  <ChevronRight className="w-3.5 h-3.5 -mr-1.5" />
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}

            </div>

          </div>

        </div>

        {/* RESIZABLE EXTENSION DRAG HANDLE (Drag down to extend chart height) */}
        <div 
          onMouseDown={handleMouseDownResize}
          onTouchStart={handleTouchStartResize}
          onDoubleClick={() => setChartHeightVh(68)}
          className={`lg:hidden h-5 w-full flex items-center justify-center cursor-row-resize shrink-0 transition select-none group border-t border-b ${
            isDark ? 'bg-[#171a24] hover:bg-[#202434] border-slate-800' : 'bg-slate-100 hover:bg-slate-200 border-slate-200'
          }`}
          title="Drag down to expand chart height (Double-click to reset to 68vh)"
        >
          <div className="flex items-center space-x-1.5">
            <div className={`w-14 h-1.5 rounded-full transition ${
              isDark ? 'bg-slate-600 group-hover:bg-amber-400' : 'bg-slate-400 group-hover:bg-slate-700'
            }`} />
          </div>
        </div>

        {/* RIGHT WORKSPACE (lg: 4 cols, xl: 3 cols): Seamless TradingView Watchlist + Order Book Panel */}
        <div className={`lg:col-span-4 xl:col-span-3 flex flex-col shrink-0 lg:shrink min-h-0 ${
          isDark ? 'bg-[#1e222d]' : 'bg-slate-50/50'
        }`}>
          
          {/* Watchlist Header */}
          <div className={`p-3 pb-2 space-y-2 shrink-0 border-b ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold font-sans tracking-wide">Market List</span>
              <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {allCommodities.length} Commodities
              </span>
            </div>

            {/* Market List Table Columns: Symbol | Bid | Ask | Spread */}
            <div className={`grid grid-cols-4 gap-2 text-[10px] uppercase font-mono tracking-wider pt-1 pb-1 px-2 ${
              isDark ? 'text-slate-500' : 'text-slate-400'
            }`}>
              <div>Symbol</div>
              <div className="text-right text-emerald-500 font-bold pr-1">Bid</div>
              <div className="text-right text-rose-500 font-bold pr-1">Ask</div>
              <div className="text-right">Spread</div>
            </div>
          </div>

          {/* Grouped Watchlist Items (Scrollable - guaranteed visible on mobile with explicit min-height) */}
          <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 scrollbar-none min-h-[340px] max-h-[500px] lg:max-h-none lg:min-h-0">
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
                        const prec = item.spot < 0.2 ? 4 : 3;

                        return (
                          <div
                            key={item.id}
                            onClick={() => setSelectedItemCode(item.id)}
                            className={`grid grid-cols-4 gap-2 items-center py-1.5 px-2 rounded-lg cursor-pointer transition text-xs font-mono ${
                              isSelected
                                ? isDark ? 'bg-amber-400/15 text-white font-bold' : 'bg-amber-50 text-slate-900 font-bold'
                                : isDark ? 'hover:bg-[#131722] text-slate-300' : 'hover:bg-white text-slate-700 shadow-2xs hover:shadow-xs'
                            }`}
                          >
                            <div className="flex items-center space-x-1.5 truncate">
                              <ItemIcon itemCode={item.id} size={18} className="shrink-0" />
                              <span className={`font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                                {item.ticker}
                              </span>
                            </div>

                            <div className="text-right font-bold text-emerald-500 text-[11px] pr-1">
                              {item.buyPrice.toFixed(prec)}
                            </div>

                            <div className="text-right font-bold text-rose-500 text-[11px] pr-1">
                              {item.sellPrice.toFixed(prec)}
                            </div>

                            <div className={`text-right font-medium text-[11px] ${
                              isDark ? 'text-slate-400' : 'text-slate-600'
                            }`}>
                              {item.spread.toFixed(prec)}
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

          {/* BOTTOM LIVE TRANSACTIONS FEED (Highlighted Sales in Red, Buys in Green) */}
          {showLiveTape && (
            <div className={`p-3 border-t shrink-0 relative animate-in fade-in duration-150 ${
              isDark ? 'bg-[#171a24] border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="space-y-2">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Live Transactions
                  </span>
                  <span className="text-[10px] text-emerald-500 font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Real-Time
                  </span>
                </div>

                {/* Transactions Table: TIME | SIDE | PRICE | QTY | TOTAL */}
                <div className={`p-1.5 rounded-lg text-xs font-mono ${
                  isDark ? 'bg-[#131722]' : 'bg-slate-50 border border-slate-200/80'
                }`}>
                  <div className={`grid grid-cols-12 text-[10px] uppercase font-bold tracking-wider pb-1 px-1 mb-1 border-b ${
                    isDark ? 'text-slate-500 border-slate-800' : 'text-slate-400 border-slate-200'
                  }`}>
                    <div className="col-span-3">Time</div>
                    <div className="col-span-2">Side</div>
                    <div className="col-span-2 text-right">Price</div>
                    <div className="col-span-2 text-right">Qty</div>
                    <div className="col-span-3 text-right">Total</div>
                  </div>

                  {/* 10 Transactions Stream (Strict FIFO Buffer with highlighted row backgrounds) */}
                  <div className="space-y-1 max-h-[185px] overflow-y-auto scrollbar-none font-mono text-[11px]">
                    {recentTransactions.length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-500 animate-pulse">
                        Connecting to WarEra transaction feed...
                      </div>
                    ) : (
                      recentTransactions.slice(0, 10).map((trade, idx) => {
                        const isBuy = trade.side === 'BUY';
                        return (
                          <div
                            key={trade.id || idx}
                            className={`grid grid-cols-12 items-center py-1 px-1.5 rounded transition-colors ${
                              isBuy 
                                ? isDark ? 'bg-emerald-950/40 border border-emerald-500/30' : 'bg-emerald-50/90 border border-emerald-200/90' 
                                : isDark ? 'bg-rose-950/40 border border-rose-500/30' : 'bg-rose-50/90 border border-rose-200/90'
                            }`}
                          >
                            <div className={`col-span-3 text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {trade.timeFormatted}
                            </div>
                            <div className="col-span-2">
                              <span className={`px-1 py-0.5 rounded text-[9px] font-bold ${
                                isBuy 
                                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold' 
                                  : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 font-extrabold'
                              }`}>
                                {trade.side}
                              </span>
                            </div>
                            <div className={`col-span-2 text-right font-bold ${
                              isBuy ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            }`}>
                              {trade.price}
                            </div>
                            <div className={`col-span-2 text-right ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              {trade.quantity.toLocaleString()}
                            </div>
                            <div className={`col-span-3 text-right font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                              {trade.total.toFixed(2)}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Chart Properties Settings Modal (MT / TradingView style) */}
      <ChartSettingsModal
        isOpen={showChartSettings}
        onClose={() => setShowChartSettings(false)}
        settings={chartSettings}
        onUpdateSettings={handleUpdateChartSettings}
        onResetDefaults={handleResetChartSettings}
        isDark={isDark}
      />

    </div>
  );
}
