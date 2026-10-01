import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  SlidersHorizontal, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  ChevronRight, 
  Coins, 
  Layers, 
  Factory, 
  Info,
  CheckCircle,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { RECIPES } from '../data/gameData';

export default function MarketTerminal({ 
  prices = {}, 
  onRefreshPrices, 
  isRefreshing = false 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedItemCode, setSelectedItemCode] = useState('ammo');
  const [marketTaxRate, setMarketTaxRate] = useState(3.0); // % sales tax
  const [regionalDepositBonus, setRegionalDepositBonus] = useState(true); // +30% regional bonus
  const [batchQuantity, setBatchQuantity] = useState(100);

  // Simulated 24h percentage movements for Bloomberg ticker
  const mockDeltas = useMemo(() => ({
    grain: -1.2,
    limestone: +0.4,
    iron: +2.1,
    lead: -1.8,
    petroleum: +3.2,
    mysteriousPlant: +0.9,
    livestock: -0.5,
    fish: +1.4,
    wood: 0.0,
    bread: +2.1,
    steak: -1.0,
    cookedFish: +4.8,
    concrete: -0.4,
    steel: -2.3,
    oil: +1.1,
    lightAmmo: +1.5,
    ammo: +4.2,
    heavyAmmo: +7.8,
    pill: +12.4,
    paper: +0.6,
    case1: -3.1,
    case2: +5.5,
    woodenCase: +1.2
  }), []);

  // Compute full financial metrics for every item
  const marketRows = useMemo(() => {
    return RECIPES.map((recipe) => {
      const spotPrice = prices[recipe.id] || 0;
      const netSpot = spotPrice * (1 - marketTaxRate / 100);

      // Ingredient costs
      let ingredientCost = 0;
      const ingredientsBreakdown = [];
      if (recipe.inputs && recipe.inputs.length > 0) {
        recipe.inputs.forEach((inp) => {
          const inpPrice = prices[inp.id] || 0;
          const cost = inpPrice * inp.qty;
          ingredientCost += cost;
          ingredientsBreakdown.push({
            id: inp.id,
            qty: inp.qty,
            unitPrice: inpPrice,
            totalCost: cost
          });
        });
      }

      const hasIngredients = recipe.inputs && recipe.inputs.length > 0;
      const netSpread = hasIngredients ? (netSpot - ingredientCost) : netSpot;
      const margin = (hasIngredients && spotPrice > 0) ? ((netSpread / spotPrice) * 100) : 0;
      const profitPerPp = recipe.pp > 0 ? (netSpread / recipe.pp) : 0;

      // Recommended Bloomberg Terminal Action
      let action = 'HOLD';
      let actionColor = 'text-zinc-400 bg-zinc-800/80 border-zinc-700';

      if (!hasIngredients) {
        action = 'RAW ASSET';
        actionColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      } else if (margin > 30) {
        action = 'CRAFT ARB 🔥';
        actionColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      } else if (margin > 5) {
        action = 'PRODUCE';
        actionColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      } else {
        action = 'BUY FINISHED';
        actionColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      }

      // Generate a Bloomberg 4-letter ticker symbol
      const ticker = recipe.id.substring(0, 4).toUpperCase();

      return {
        ...recipe,
        ticker,
        spotPrice,
        netSpot,
        ingredientCost,
        ingredientsBreakdown,
        netSpread,
        margin,
        profitPerPp,
        action,
        actionColor,
        delta: mockDeltas[recipe.id] || 0
      };
    });
  }, [prices, marketTaxRate, mockDeltas]);

  // Categories list
  const categories = ['ALL', 'Munitions', 'Food & Farming', 'Construction', 'Metallurgy', 'Energy', 'Pharma', 'Raw Materials'];

  // Filtered rows
  const filteredRows = useMemo(() => {
    return marketRows.filter((row) => {
      const matchesSearch = row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            row.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            row.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'ALL' || row.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [marketRows, searchQuery, selectedCategory]);

  // Selected item details for inspector
  const selectedItem = useMemo(() => {
    return marketRows.find((r) => r.id === selectedItemCode) || marketRows[0];
  }, [marketRows, selectedItemCode]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      
      {/* Bloomberg Terminal Top Bar with Ticker Tape */}
      <div className="bg-[#090b10] border border-amber-500/30 rounded-xl overflow-hidden shadow-2xl">
        
        {/* Terminal Header */}
        <div className="bg-[#0d1017] px-4 py-2.5 border-b border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 bg-amber-400 rounded-sm"></span>
            <span className="font-bold tracking-wider text-amber-400">WARERA TERMINAL</span>
            <span className="text-zinc-600">//</span>
            <span className="text-zinc-400 text-[11px]">COMMODITY DESK & ARBITRAGE SCANNER</span>
          </div>

          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1.5 text-zinc-400">
              <span className="text-zinc-500">TAX:</span>
              <span className="text-amber-300 font-bold">{marketTaxRate}%</span>
            </div>
            <button
              onClick={onRefreshPrices}
              disabled={isRefreshing}
              className="flex items-center space-x-1 text-zinc-400 hover:text-amber-400 transition"
              title="Refresh spot prices"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">REFRESH</span>
            </button>
          </div>
        </div>

        {/* Bloomberg Ticker Tape */}
        <div className="bg-[#07080c] px-4 py-2 overflow-x-auto border-b border-zinc-800/80 flex items-center space-x-6 text-xs font-mono scrollbar-none whitespace-nowrap">
          {marketRows.slice(0, 10).map((item) => {
            const isUp = item.delta >= 0;
            return (
              <div 
                key={item.id} 
                onClick={() => setSelectedItemCode(item.id)}
                className="flex items-center space-x-1.5 cursor-pointer hover:opacity-80 transition"
              >
                <span className="text-amber-400 font-bold">{item.ticker}</span>
                <span className="text-zinc-200">${item.spotPrice.toFixed(3)}</span>
                <span className={`font-semibold flex items-center text-[11px] ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isUp ? '▲' : '▼'} {Math.abs(item.delta).toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Search & Category Filter Strip */}
        <div className="p-3 bg-[#0a0d14] flex flex-col md:flex-row items-center justify-between gap-3 border-b border-zinc-800/70">
          
          {/* Search bar */}
          <div className="relative w-full md:w-72 font-mono">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH TICKER OR NAME..."
              className="w-full bg-[#121620] border border-zinc-700/80 rounded px-8 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400/80"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex space-x-1 overflow-x-auto w-full md:w-auto scrollbar-none py-1">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-xs font-mono rounded transition whitespace-nowrap ${
                    active
                      ? 'bg-amber-400 text-black font-bold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  {cat.toUpperCase()}
                </button>
              );
            })}
          </div>

        </div>

      </div>

      {/* Main Terminal Area: Table & Inspector Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 8 Cols: Financial Table */}
        <div className="lg:col-span-8 bg-[#0b0e15] border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#10141f] text-zinc-400 border-b border-zinc-800/80 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Ticker / Name</th>
                  <th className="py-3 px-3 text-right">Spot Bid</th>
                  <th className="py-3 px-3 text-right">Craft Cost</th>
                  <th className="py-3 px-3 text-right">Net Spread</th>
                  <th className="py-3 px-3 text-right">Margin %</th>
                  <th className="py-3 px-3 text-right">PP Yield</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredRows.map((row) => {
                  const isSelected = row.id === selectedItemCode;
                  const isMarginPos = row.margin > 0;
                  const hasCraft = row.inputs && row.inputs.length > 0;

                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedItemCode(row.id)}
                      className={`cursor-pointer transition ${
                        isSelected 
                          ? 'bg-amber-500/10 border-l-2 border-amber-400' 
                          : 'hover:bg-zinc-800/40'
                      }`}
                    >
                      {/* Ticker / Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <span className="font-bold text-amber-400">{row.ticker}</span>
                          <span className="text-zinc-200 font-sans font-medium">{row.name}</span>
                        </div>
                        <div className="text-[10px] text-zinc-500">{row.category}</div>
                      </td>

                      {/* Spot Price */}
                      <td className="py-3 px-3 text-right font-medium text-zinc-100">
                        ${row.spotPrice.toFixed(3)}
                      </td>

                      {/* Craft Cost */}
                      <td className="py-3 px-3 text-right text-zinc-400">
                        {hasCraft ? `$${row.ingredientCost.toFixed(3)}` : '—'}
                      </td>

                      {/* Net Spread (Profit) */}
                      <td className="py-3 px-3 text-right">
                        {hasCraft ? (
                          <span className={`font-semibold ${isMarginPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isMarginPos ? '+' : ''}${row.netSpread.toFixed(3)}
                          </span>
                        ) : (
                          <span className="text-zinc-500">RAW</span>
                        )}
                      </td>

                      {/* Margin % */}
                      <td className="py-3 px-3 text-right">
                        {hasCraft ? (
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            isMarginPos 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {isMarginPos ? '+' : ''}{row.margin.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-[11px]">—</span>
                        )}
                      </td>

                      {/* PP Yield */}
                      <td className="py-3 px-3 text-right font-medium text-zinc-300">
                        {row.pp > 0 ? `${row.profitPerPp.toFixed(3)}/PP` : '—'}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${row.actionColor}`}>
                          {row.action}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2.5 bg-[#0e121a] border-t border-zinc-800 text-[11px] text-zinc-500 font-mono flex items-center justify-between">
            <span>Showing {filteredRows.length} assets • Click any row to inspect recipe tree & batch calculator</span>
            <span className="text-amber-400">REAL-TIME WARERA FEED</span>
          </div>
        </div>

        {/* Right 4 Cols: Bloomberg Inspector / Analytical Panel */}
        <div className="lg:col-span-4 bg-[#0b0e15] border border-zinc-800 rounded-xl p-5 shadow-xl font-mono text-xs space-y-5">
          
          {/* Item Header */}
          <div className="border-b border-zinc-800 pb-3 flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-1.5 py-0.5 rounded bg-amber-400 text-black font-extrabold text-[11px]">
                  {selectedItem.ticker}
                </span>
                <span className="text-base font-bold text-zinc-100 font-sans">{selectedItem.name}</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">{selectedItem.category} • Base {selectedItem.pp} PP</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-zinc-100">${selectedItem.spotPrice.toFixed(3)}</div>
              <div className={`text-[11px] font-semibold ${selectedItem.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {selectedItem.delta >= 0 ? '▲' : '▼'} {selectedItem.delta.toFixed(1)}% (24H)
              </div>
            </div>
          </div>

          {/* Recipe Breakdown */}
          <div>
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Recipe Input Composition</span>
              <span className="text-zinc-500 text-[10px]">Per Unit</span>
            </h4>

            {selectedItem.ingredientsBreakdown.length > 0 ? (
              <div className="space-y-2 bg-[#121622] p-3 rounded-lg border border-zinc-800/80">
                {selectedItem.ingredientsBreakdown.map((ing) => (
                  <div key={ing.id} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-sans">
                      {ing.qty}x {ing.id}
                    </span>
                    <span className="text-zinc-400">
                      ${ing.totalCost.toFixed(3)} (${ing.unitPrice.toFixed(3)} ea)
                    </span>
                  </div>
                ))}
                
                <div className="pt-2 border-t border-zinc-700/60 flex items-center justify-between text-xs font-bold">
                  <span className="text-zinc-400">Raw Input Cost:</span>
                  <span className="text-zinc-100">${selectedItem.ingredientCost.toFixed(3)}</span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#121622] rounded-lg border border-zinc-800/80 text-zinc-400 text-[11px]">
                Raw material extracted directly via natural resource deposit or harvesting. No ingredient cost.
              </div>
            )}
          </div>

          {/* Unit Economics Snapshot */}
          <div className="bg-[#121622] p-3 rounded-lg border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Gross Spot Price:</span>
              <span className="text-zinc-200 font-semibold">${selectedItem.spotPrice.toFixed(3)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Market Tax ({marketTaxRate}%):</span>
              <span className="text-rose-400">-${(selectedItem.spotPrice * marketTaxRate / 100).toFixed(3)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Net Spot Realized:</span>
              <span className="text-zinc-200 font-semibold">${selectedItem.netSpot.toFixed(3)}</span>
            </div>
            <div className="pt-2 border-t border-zinc-700/60 flex items-center justify-between text-xs font-bold">
              <span className="text-zinc-300">Net Profit per Unit:</span>
              <span className={`font-mono ${selectedItem.netSpread >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {selectedItem.netSpread >= 0 ? '+' : ''}${selectedItem.netSpread.toFixed(3)}
              </span>
            </div>
          </div>

          {/* Batch Profit Simulator */}
          <div className="pt-2 border-t border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase">Batch Simulator</span>
              <span className="text-xs text-zinc-400">{batchQuantity} Units</span>
            </div>

            <div className="flex gap-2">
              {[50, 100, 500, 1000].map(qty => (
                <button
                  key={qty}
                  onClick={() => setBatchQuantity(qty)}
                  className={`flex-1 py-1 rounded text-xs transition ${
                    batchQuantity === qty
                      ? 'bg-amber-400 text-black font-bold'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {qty}x
                </button>
              ))}
            </div>

            <div className="p-3 bg-[#080a10] border border-amber-500/20 rounded-lg space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Revenue ({batchQuantity}x):</span>
                <span className="text-zinc-200">${(selectedItem.netSpot * batchQuantity).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Raw Cost:</span>
                <span className="text-zinc-200">-${(selectedItem.ingredientCost * batchQuantity).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Labor Required:</span>
                <span className="text-zinc-200">{selectedItem.pp * batchQuantity} PP</span>
              </div>
              <div className="pt-2 border-t border-zinc-800 flex justify-between font-bold text-sm">
                <span className="text-zinc-100">Estimated Profit:</span>
                <span className={`font-mono ${selectedItem.netSpread >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {selectedItem.netSpread >= 0 ? '+' : ''}${(selectedItem.netSpread * batchQuantity).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
