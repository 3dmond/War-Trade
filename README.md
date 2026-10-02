# WarEra Market 📊

> **The Advanced Financial Trading Terminal for WarEra**

WarEra Market is a TradingView-grade financial terminal and market intelligence engine designed specifically for the WarEra economy.

---

## ✨ Features

- **TradingView-Style Chart Canvas**: Interactive candlestick and line charts powered by TradingView Lightweight Charts engine.
- **Dynamic Timeframes**: `15M`, `30M`, `1H`, `24H`, `7D`, `30D`, and `ALL` resolutions with zero-shift live candle updates.
- **Technical Drawing Tools Suite**:
  - Trend Lines & Parallel Channels
  - Fibonacci Retracement & Fibonacci Extension / Reversal
  - Support & Resistance Rectangle Zones & Reversal Circles
  - Measurement Ruler with live price delta ($\Delta P$) and percentage ($\Delta\%$) readouts
  - Customizable color palettes, stroke thickness, solid/dashed styling, and `Ctrl+D` duplication
- **Moving Average Indicators**: 5-period SMA and 9-period EMA overlays with toggle controls.
- **Craft Break-Even Line**: Live break-even cost line calculated directly from recipe input commodity prices.
- **Market Watchlist**: Categorized commodities (Munitions, Manufactured, Food & Farming, Raw Extraction) with Top Buy (Bid), Top Sell (Ask), and Spread quotes.
- **Live Order Book & Craft Arbitrage Card**: Real-time bid/ask quotes, fee-adjusted net margins, and instant profit calculations.
- **Axis Drag-to-Scale & Reset**: Drag the vertical price axis or horizontal time axis to scale; double-click either axis to reset.
- **Theme Modes**: Modern Light theme by default with 1-click Dark Mode toggle.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Dev Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

---

## 🛠️ Tech Stack

- **React 18**
- **Vite 6**
- **Lightweight Charts v5.2** (TradingView)
- **Tailwind CSS**
- **Lucide Icons**
