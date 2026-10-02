import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Swords, 
  Coins, 
  ArrowUpRight, 
  ArrowDownRight,
  Shield, 
  ChevronRight, 
  Sparkles, 
  Activity,
  Layers,
  Flame,
  Clock
} from 'lucide-react';
import { RECIPES } from '../data/gameData';

export default function Home({ 
  prices, 
  activeBattles = [], 
  userData, 
  onNavigate, 
  onOpenSyncModal 
}) {
  // Compute top market mover and highest craft spreads
  const marketAnalysis = useMemo(() => {
    const items = RECIPES.map(recipe => {
      const spot = prices[recipe.id] || 0;
      let cost = 0;
      if (recipe.inputs && recipe.inputs.length > 0) {
        recipe.inputs.forEach(inp => {
          cost += (prices[inp.id] || 0) * inp.qty;
        });
      }
      const netProfit = spot * 0.97 - cost; // 3% market tax
      const margin = spot > 0 ? (netProfit / spot) * 100 : 0;
      const profitPerPp = recipe.pp > 0 ? netProfit / recipe.pp : 0;

      return {
        ...recipe,
        spot,
        cost,
        netProfit,
        margin,
        profitPerPp
      };
    });

    const craftable = items.filter(i => i.inputs && i.inputs.length > 0);
    const topMargin = [...craftable].sort((a, b) => b.margin - a.margin)[0];
    const topYield = [...craftable].sort((a, b) => b.profitPerPp - a.profitPerPp)[0];

    return { items, topMargin, topYield };
  }, [prices]);

  // Selected spotlight commodities for the homepage overview
  const featuredCommodities = useMemo(() => {
    const watchlistIds = ['ammo', 'heavyAmmo', 'pill', 'bread', 'steel', 'concrete'];
    return watchlistIds.map(id => {
      const item = marketAnalysis.items.find(i => i.id === id);
      if (!item) return null;
      // Pre-set simulated 24h trend delta based on market action
      const deltas = {
        ammo: +4.2,
        heavyAmmo: +7.8,
        pill: +12.4,
        bread: +1.9,
        steel: -2.3,
        concrete: -0.8
      };
      return {
        ...item,
        delta: deltas[id] || 0
      };
    }).filter(Boolean);
  }, [marketAnalysis]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      
      {/* Top Welcome & Context Banner with Breathing Room */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 font-sans">
            Command Overview
          </h1>
          <p className="text-sm text-zinc-400 mt-1 font-normal">
            Real-time tactical intelligence across global spot markets, active frontlines, and economic yields.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Feed: Live Spot Prices</span>
          <span className="text-zinc-600">•</span>
          <span>Tax: 3.0%</span>
        </div>
      </div>

      {/* 4 Spacious Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Top Market Spread */}
        <div className="bg-zinc-900/60 border border-zinc-800/90 rounded-xl p-5 hover:border-zinc-700 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium mb-2">
              <span>Top Crafting Spread</span>
              <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[11px] font-mono font-semibold">
                +{marketAnalysis.topMargin?.margin.toFixed(1)}%
              </span>
            </div>
            <div className="text-xl font-bold text-zinc-100 font-sans">
              {marketAnalysis.topMargin?.name || 'Combat Pill'}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Spot ${(marketAnalysis.topMargin?.spot || 0).toFixed(2)} vs Craft ${(marketAnalysis.topMargin?.cost || 0).toFixed(2)}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
            <span>Net yield</span>
            <span className="text-emerald-400 font-mono font-medium">
              +${(marketAnalysis.topMargin?.netProfit || 0).toFixed(2)} / unit
            </span>
          </div>
        </div>

        {/* Card 2: Highest PP Efficiency */}
        <div className="bg-zinc-900/60 border border-zinc-800/90 rounded-xl p-5 hover:border-zinc-700 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium mb-2">
              <span>Best Labor Efficiency</span>
              <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[11px] font-mono font-semibold">
                High PP Yield
              </span>
            </div>
            <div className="text-xl font-bold text-zinc-100 font-sans">
              {marketAnalysis.topYield?.name || 'Heavy Ammo'}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              ${(marketAnalysis.topYield?.profitPerPp || 0).toFixed(3)} profit per production point
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
            <span>Production base</span>
            <span className="text-zinc-300 font-mono">
              {marketAnalysis.topYield?.pp || 0} PP/hit
            </span>
          </div>
        </div>

        {/* Card 3: Active War Theaters */}
        <div className="bg-zinc-900/60 border border-zinc-800/90 rounded-xl p-5 hover:border-zinc-700 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium mb-2">
              <span>Active Conflicts</span>
              <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded text-[11px] font-mono font-semibold">
                Contested
              </span>
            </div>
            <div className="text-xl font-bold text-zinc-100 font-sans">
              {activeBattles.length > 0 ? `${activeBattles.length} Theaters` : '4 Active Fronts'}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Frontline munitions & food demand is elevated
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
            <span>Primary Burn</span>
            <span className="text-rose-400 font-mono font-medium">Standard & Heavy Ammo</span>
          </div>
        </div>

        {/* Card 4: Player Status */}
        <div className="bg-zinc-900/60 border border-zinc-800/90 rounded-xl p-5 hover:border-zinc-700 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium mb-2">
              <span>Commander Status</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                userData?.username ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-zinc-400 bg-zinc-800'
              }`}>
                {userData?.username ? 'Synced' : 'Guest'}
              </span>
            </div>
            <div className="text-xl font-bold text-zinc-100 font-sans truncate">
              {userData?.username ? `@${userData.username}` : 'No Profile Linked'}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {userData?.username ? `Level ${userData?.leveling?.level || 1} • Ready for combat` : 'Link profile to analyze personal stats'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
            <span>Action</span>
            {userData?.username ? (
              <button 
                onClick={() => onNavigate('profile')} 
                className="text-zinc-300 hover:text-white font-medium inline-flex items-center gap-1"
              >
                View Profile <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button 
                onClick={onOpenSyncModal} 
                className="text-zinc-200 hover:text-white font-medium inline-flex items-center gap-1 underline underline-offset-2"
              >
                Sync Dossier
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Main Two-Column Layout with Generous Spacing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 7 Cols: Market Highlights Table */}
        <div className="lg:col-span-7 bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800/70">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Market Pulse</h2>
              <p className="text-xs text-zinc-400 mt-0.5">High-volume commodities & crafting spreads</p>
            </div>
            <button
              onClick={() => onNavigate('market')}
              className="text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700/80 px-3 py-1.5 rounded-md transition"
            >
              <span>Terminal View</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 divide-y divide-zinc-800/50">
            {featuredCommodities.map((item) => {
              const isProfit = item.margin > 0;
              const isDeltaPositive = item.delta >= 0;
              return (
                <div 
                  key={item.id} 
                  className="py-3.5 flex items-center justify-between hover:bg-zinc-800/30 px-2 rounded-lg transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-md bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center font-mono text-xs font-semibold text-zinc-300">
                      {item.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-200">{item.name}</div>
                      <div className="text-xs text-zinc-500 font-mono">{item.category}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-right font-mono">
                    {/* Spot Price & 24h Delta */}
                    <div>
                      <div className="text-sm font-medium text-zinc-100">
                        ${item.spot.toFixed(3)}
                      </div>
                      <div className={`text-xs flex items-center justify-end font-semibold ${
                        isDeltaPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {isDeltaPositive ? <ArrowUpRight className="w-3 h-3 inline mr-0.5" /> : <ArrowDownRight className="w-3 h-3 inline mr-0.5" />}
                        {isDeltaPositive ? `+${item.delta.toFixed(1)}%` : `${item.delta.toFixed(1)}%`}
                      </div>
                    </div>

                    {/* Craft Spread / Margin */}
                    <div className="w-24">
                      <div className={`text-xs px-2 py-0.5 rounded text-center font-semibold ${
                        isProfit 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {isProfit ? `+${item.margin.toFixed(1)}%` : `${item.margin.toFixed(1)}%`}
                      </div>
                      <div className="text-[10px] text-zinc-500 text-center mt-0.5">
                        {isProfit ? 'Craft Profit' : 'Direct Loss'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-800/70 flex items-center justify-between text-xs text-zinc-400">
            <span>Need full market depth & arbitrage?</span>
            <button
              onClick={() => onNavigate('market')}
              className="text-zinc-200 hover:text-white font-medium underline underline-offset-4"
            >
              Open War Trade Terminal →
            </button>
          </div>
        </div>

        {/* Right 5 Cols: Active War Theaters Snapshot */}
        <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/70">
              <div>
                <h2 className="text-base font-semibold text-zinc-100">Frontline Wars</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Active conflicts & frontline burn</p>
              </div>
              <button
                onClick={() => onNavigate('war')}
                className="text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700/80 px-3 py-1.5 rounded-md transition"
              >
                <span>War Map</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* War items */}
            <div className="mt-4 space-y-4">
              
              {/* Battle 1 */}
              <div className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-zinc-400">Round 3 • Active</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    High Intensity
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-zinc-200">Spain</div>
                  <div className="text-xs text-zinc-500 font-mono">VS</div>
                  <div className="text-sm font-semibold text-zinc-200">France</div>
                </div>

                {/* Score bar */}
                <div className="space-y-1">
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 h-full w-[58%]"></div>
                    <div className="bg-rose-500 h-full w-[42%]"></div>
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                    <span className="text-emerald-400">58% Defending</span>
                    <span className="text-rose-400">42% Attacking</span>
                  </div>
                </div>
              </div>

              {/* Battle 2 */}
              <div className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-zinc-400">Round 1 • Active</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Early Round
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-zinc-200">Poland</div>
                  <div className="text-xs text-zinc-500 font-mono">VS</div>
                  <div className="text-sm font-semibold text-zinc-200">Germany</div>
                </div>

                {/* Score bar */}
                <div className="space-y-1">
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 h-full w-[49%]"></div>
                    <div className="bg-rose-500 h-full w-[51%]"></div>
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                    <span className="text-emerald-400">49% Defending</span>
                    <span className="text-rose-400">51% Attacking</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800/70 text-xs text-zinc-400 flex items-center justify-between">
            <span>High ammo burn during active rounds</span>
            <button
              onClick={() => onNavigate('war')}
              className="text-zinc-200 hover:text-white font-medium underline underline-offset-4"
            >
              Inspect Frontlines →
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
