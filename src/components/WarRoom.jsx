import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Swords, 
  ShieldAlert, 
  TrendingUp, 
  RefreshCw, 
  Clock, 
  AlertTriangle, 
  Crosshair, 
  BarChart2, 
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../services/wareraApi';

export default function WarRoom({ prices }) {
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBattleId, setSelectedBattleId] = useState(null);
  const [liveBattleData, setLiveBattleData] = useState(null);

  const fetchBattles = async () => {
    setLoading(true);
    try {
      const active = await api.getActiveBattles();
      setBattles(active || []);
      if (active && active.length > 0 && !selectedBattleId) {
        setSelectedBattleId(active[0]._id || active[0].id);
      }
    } catch (e) {
      console.warn('Could not load battles:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBattles();
    const interval = setInterval(fetchBattles, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  // Fetch live battle telemetry when selected
  useEffect(() => {
    if (!selectedBattleId) return;
    api.getLiveBattleData(selectedBattleId).then(data => {
      setLiveBattleData(data);
    });
  }, [selectedBattleId]);

  // War-to-Market Correlation analysis
  const warCommoditySpreads = [
    {
      name: 'Heavy Ammo',
      price: prices.heavyAmmo || 3.63,
      burnRate: 'HIGH 🔥',
      burnReason: 'Used by frontline warlords for round deciders',
      inputName: '16x Lead',
      inputCost: (prices.lead || 0.11) * 16,
      craftMargin: (((prices.heavyAmmo || 3.63) - (prices.lead || 0.11) * 16) / (prices.heavyAmmo || 3.63)) * 100,
      action: 'CRAFT & STOCKPILE'
    },
    {
      name: 'Standard Ammo',
      price: prices.ammo || 0.86,
      burnRate: 'VERY HIGH 🔥🔥',
      burnReason: 'Primary volume consumable across all active clashes',
      inputName: '4x Lead',
      inputCost: (prices.lead || 0.11) * 4,
      craftMargin: (((prices.ammo || 0.86) - (prices.lead || 0.11) * 4) / (prices.ammo || 0.86)) * 100,
      action: 'HIGH LIQUIDITY SELL'
    },
    {
      name: 'Combat Pill',
      price: prices.pill || 38.68,
      burnRate: 'BURST ⚡',
      burnReason: 'Consumed during high priority orders (+80% dmg)',
      inputName: '200x Plant',
      inputCost: (prices.mysteriousPlant || 0.081) * 200,
      craftMargin: (((prices.pill || 38.68) - (prices.mysteriousPlant || 0.081) * 200) / (prices.pill || 38.68)) * 100,
      action: 'HIGH MARGIN ARBITRAGE'
    },
    {
      name: 'Cooked Fish',
      price: prices.cookedFish || 8.61,
      burnRate: 'STEADY 🍞',
      burnReason: 'Best health recovery (30% HP / hunger) for rapid sustained hitting',
      inputName: '1x Fish',
      inputCost: (prices.fish || 3.73),
      craftMargin: (((prices.cookedFish || 8.61) - (prices.fish || 3.73)) / (prices.cookedFish || 8.61)) * 100,
      action: 'STEADY CONSUMER DEMAND'
    },
    {
      name: 'Paper',
      price: prices.paper || 0.21,
      burnRate: 'STRATEGIC 📜',
      burnReason: 'Burned by country governments and MUs to issue Battle Orders',
      inputName: '2x Wood',
      inputCost: (prices.wood || 0.10) * 2,
      craftMargin: (((prices.paper || 0.21) - (prices.wood || 0.10) * 2) / (prices.paper || 0.21)) * 100,
      action: 'SELL TO GOV / MU TREASURIES'
    },
    {
      name: 'Oil',
      price: prices.oil || 0.19,
      burnRate: 'LOGISTIC 🛢️',
      burnReason: 'Hourly fuel upkeep for active Military Unit Headquarters',
      inputName: '1x Petroleum',
      inputCost: (prices.petroleum || 0.089),
      craftMargin: (((prices.oil || 0.19) - (prices.petroleum || 0.089)) / (prices.oil || 0.19)) * 100,
      action: 'MU CONTRACT SUPPLY'
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-[#0f1523] border border-[#1b253b] rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#182033] pb-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500 animate-pulse" />
              WAR ROOM: ACTIVE BATTLES & MARKET IMPACT RADAR
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Live battle tracking combined with wartime commodity demand signals and crafting spreads.
            </p>
          </div>

          <button
            onClick={fetchBattles}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-[#141d2f] hover:bg-[#1b2740] border border-red-900/40 text-red-300 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'SCANNING RADAR...' : 'REFRESH BATTLES'}</span>
          </button>
        </div>

        {/* War-to-Market Quick Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 bg-[#121826] border border-red-900/30 rounded-lg">
            <span className="text-[10px] text-red-400 font-bold uppercase block">Combat Munitions Status</span>
            <span className="text-sm font-bold text-white mt-1 block">Lead & Ammo High Demand</span>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Active battles consume ammo every 2-minute tick. Ammo crafting margins currently positive.
            </span>
          </div>

          <div className="p-3 bg-[#121826] border border-amber-900/30 rounded-lg">
            <span className="text-[10px] text-amber-400 font-bold uppercase block">Logistics Burn</span>
            <span className="text-sm font-bold text-white mt-1 block">Paper & Oil Consumption</span>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Active country orders consume Paper; MU headquarters consume 1-10 Oil per hour.
            </span>
          </div>

          <div className="p-3 bg-[#121826] border border-emerald-900/30 rounded-lg">
            <span className="text-[10px] text-emerald-400 font-bold uppercase block">Market Arbitrage Advice</span>
            <span className="text-sm font-bold text-white mt-1 block">Buy Raw $\rightarrow$ Sell Processed</span>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Wartime spreads favor crafting Heavy Ammo, Pills, and Steel over holding raw materials.
            </span>
          </div>
        </div>
      </div>

      {/* Live Battle Radar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Battles List */}
        <div className="bg-[#0f1523] border border-[#1b253b] rounded-xl p-4 shadow-lg space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-[#182033] pb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-red-400" />
              LIVE CONFLICT RADAR ({battles.length} ACTIVE)
            </span>
            <span className="text-[10px] text-cyan-400 animate-pulse">2-MIN TICKS</span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {battles.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No major global wars active at this exact moment. Peace treaty in effect.
              </div>
            ) : (
              battles.map((b, idx) => {
                const battleId = b._id || b.id || `battle-${idx}`;
                const isSelected = selectedBattleId === battleId;

                const defenderRegion = b.defender?.region || 'Unknown Region';
                const defenderScore = b.defender?.wonRoundsCount || 0;
                const attackerScore = b.attacker?.wonRoundsCount || 0;
                const currentRound = defenderScore + attackerScore + 1;

                return (
                  <div
                    key={battleId}
                    onClick={() => setSelectedBattleId(battleId)}
                    className={`p-3 rounded-lg border cursor-pointer transition text-xs ${
                      isSelected
                        ? 'bg-red-950/30 border-red-500/70 shadow-md shadow-red-950/40'
                        : 'bg-[#121826] border-[#1a2335] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-white text-xs">Round {Math.min(3, currentRound)} of 3</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 font-bold border border-red-800/40">
                        WAR
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-300 my-1">
                      <span>Attacker ({attackerScore})</span>
                      <span className="text-slate-500 font-bold">VS</span>
                      <span>Defender ({defenderScore})</span>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center justify-between mt-2 pt-1 border-t border-[#1a2335]">
                      <span>Target: {defenderRegion.slice(0, 10)}...</span>
                      <span className="text-cyan-400">Inspect &gt;</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Battle Intelligence Telemetry */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-[#0f1523] border border-[#1b253b] rounded-xl p-5 shadow-lg font-mono">
            <div className="flex items-center justify-between border-b border-[#182033] pb-3 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                BATTLE PROGRESS TELEMETRY & ROUND DYNAMICS
              </h3>
              <span className="text-xs text-slate-400">
                Win Condition: First to reach <strong className="text-white">300 Terrain</strong>
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Terrain Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-1 text-[11px]">
                  <span className="text-red-400 font-bold">Attacker Terrain</span>
                  <span className="text-slate-400">Target: 300 Terrain Points</span>
                  <span className="text-blue-400 font-bold">Defender Terrain</span>
                </div>
                <div className="w-full h-4 bg-[#141b2b] rounded-full overflow-hidden flex border border-[#1e2a42]">
                  <div className="bg-red-500 h-full transition-all duration-500" style={{ width: '45%' }}></div>
                  <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: '55%' }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Current: 135 / 300</span>
                  <span>Tick Interval: Every 120 Seconds</span>
                  <span>Current: 165 / 300</span>
                </div>
              </div>

              {/* Ticking Pacing Multiplier */}
              <div className="p-3 bg-[#121826] rounded-lg border border-[#1a2335] text-[11px] space-y-1">
                <span className="text-cyan-400 font-bold block mb-1">Terrain Gain Scaling Per 2-Min Tick:</span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-[10px]">
                  <div className="p-1 rounded bg-[#090d16] border border-[#1e283d]">&lt;100: <strong className="text-white">+1</strong></div>
                  <div className="p-1 rounded bg-[#090d16] border border-[#1e283d]">100-199: <strong className="text-white">+2</strong></div>
                  <div className="p-1 rounded bg-[#090d16] border border-[#1e283d]">200-299: <strong className="text-white">+3</strong></div>
                  <div className="p-1 rounded bg-[#090d16] border border-[#1e283d]">300-399: <strong className="text-white">+4</strong></div>
                  <div className="p-1 rounded bg-[#090d16] border border-[#1e283d]">400-499: <strong className="text-white">+5</strong></div>
                  <div className="p-1 rounded bg-[#090d16] border border-[#1e283d]">500+: <strong className="text-white">+6</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* Wartime Crafting & Arbitrage Matrix */}
          <div className="bg-[#0f1523] border border-[#1b253b] rounded-xl p-5 shadow-lg font-mono">
            <div className="border-b border-[#182033] pb-3 mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                WARTIME COMMODITY SPREADS & ARBITRAGE SIGNALS
              </h3>
              <span className="text-xs text-slate-400">Updated in real-time</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#111726] text-slate-400 border-b border-[#1b253b] uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">War Commodity</th>
                    <th className="py-2.5 px-2 text-right">Spot Price</th>
                    <th className="py-2.5 px-2">Burn Rate</th>
                    <th className="py-2.5 px-2 text-right">Input Cost</th>
                    <th className="py-2.5 px-2 text-right text-emerald-400">Craft Margin</th>
                    <th className="py-2.5 px-3 text-right">Tactical Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#151c2d]">
                  {warCommoditySpreads.map((item) => (
                    <tr key={item.name} className="hover:bg-[#131b2b] transition">
                      <td className="py-3 px-3">
                        <span className="font-bold text-white block">{item.name}</span>
                        <span className="text-[10px] text-slate-400">{item.burnReason}</span>
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-white">
                        {item.price.toFixed(3)}
                      </td>
                      <td className="py-3 px-2 text-[11px] font-semibold text-amber-400">
                        {item.burnRate}
                      </td>
                      <td className="py-3 px-2 text-right text-slate-400 text-[11px]">
                        {item.inputName} ({item.inputCost.toFixed(2)})
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-emerald-400">
                        +{item.craftMargin.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                          {item.action}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
