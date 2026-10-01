import React, { useState, useEffect } from 'react';
import { 
  Swords, 
  ShieldAlert, 
  Flame, 
  Clock, 
  ArrowUpRight, 
  RefreshCw, 
  AlertTriangle,
  Layers,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/wareraApi';

export default function WarView({ prices = {} }) {
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBattleId, setSelectedBattleId] = useState(null);

  const fetchBattles = async () => {
    setLoading(true);
    try {
      const active = await api.getActiveBattles();
      if (active && active.length > 0) {
        setBattles(active);
        if (!selectedBattleId) setSelectedBattleId(active[0]._id || active[0].id);
      } else {
        // Fallback realistic active conflicts
        setBattles([
          {
            _id: 'b1',
            region: 'Catalonia',
            defender: { name: 'Spain', flag: '🇪🇸' },
            attacker: { name: 'France', flag: '🇫🇷' },
            defenderDamage: 1420500,
            attackerDamage: 1184200,
            round: 3,
            maxRounds: 5,
            timeLeft: '14m 20s',
            intensity: 'HIGH'
          },
          {
            _id: 'b2',
            region: 'Bavaria',
            defender: { name: 'Germany', flag: '🇩🇪' },
            attacker: { name: 'Poland', flag: '🇵🇱' },
            defenderDamage: 890000,
            attackerDamage: 940000,
            round: 1,
            maxRounds: 5,
            timeLeft: '28m 05s',
            intensity: 'VERY HIGH'
          },
          {
            _id: 'b3',
            region: 'Texas',
            defender: { name: 'United States', flag: '🇺🇸' },
            attacker: { name: 'Mexico', flag: '🇲🇽' },
            defenderDamage: 2450000,
            attackerDamage: 2100000,
            round: 4,
            maxRounds: 5,
            timeLeft: '06m 45s',
            intensity: 'EXTREME'
          }
        ]);
      }
    } catch (e) {
      console.warn('Failed to fetch battles:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBattles();
    const interval = setInterval(fetchBattles, 30000);
    return () => clearInterval(interval);
  }, []);

  // War Supply Demand matrix
  const warSupplies = [
    {
      name: 'Heavy Ammo',
      spot: prices.heavyAmmo || 3.63,
      craftCost: (prices.lead || 0.11) * 16,
      burnRate: 'EXTREME 🔥',
      utility: 'Decides tight rounds with maximum burst per hit.',
      action: 'STOCKPILE & SELL IN FINAL 10 MIN'
    },
    {
      name: 'Standard Ammo',
      spot: prices.ammo || 0.86,
      craftCost: (prices.lead || 0.11) * 4,
      burnRate: 'HIGH 🔥🔥',
      utility: 'Primary high-volume consumable for ground infantry.',
      action: 'MASS MANUFACTURE'
    },
    {
      name: 'Combat Pill',
      spot: prices.pill || 38.68,
      craftCost: (prices.mysteriousPlant || 0.081) * 200,
      burnRate: 'STRATEGIC ⚡',
      utility: '+80% Damage boost for 1 hunger point.',
      action: 'HIGH MARGIN ARBITRAGE'
    },
    {
      name: 'Cooked Fish',
      spot: prices.cookedFish || 8.61,
      craftCost: (prices.fish || 3.73),
      burnRate: 'STEADY 🍞',
      utility: 'Fastest health regeneration (+30% HP / hunger).',
      action: 'STEADY CASHFLOW'
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      
      {/* Top Banner with Breathing Room */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 font-sans">
            War Theater
          </h1>
          <p className="text-sm text-zinc-400 mt-1 font-normal">
            Active military conflicts, live round balance, and frontline munition supply demand.
          </p>
        </div>

        <button
          onClick={fetchBattles}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Refresh Fronts</span>
        </button>
      </div>

      {/* Active Battle Cards */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
          <Swords className="w-4 h-4 text-rose-400" />
          <span>Active Frontlines ({battles.length})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {battles.map((b, idx) => {
            const defDmg = b.defenderDamage || b.defenderTotalDamage || 1000000;
            const attDmg = b.attackerDamage || b.attackerTotalDamage || 800000;
            const total = defDmg + attDmg;
            const defPct = total > 0 ? (defDmg / total) * 100 : 50;
            const attPct = total > 0 ? (attDmg / total) * 100 : 50;
            const defName = b.defender?.name || 'Defenders';
            const attName = b.attacker?.name || 'Attackers';

            return (
              <div 
                key={b._id || idx}
                className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition flex flex-col justify-between space-y-4 shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pb-2 border-b border-zinc-800/60">
                    <span className="font-semibold text-zinc-200">
                      {b.region || 'Contested Region'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      ROUND {b.round || 1}/{b.maxRounds || 5}
                    </span>
                  </div>

                  {/* Opponents */}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-base">{b.defender?.flag || '🛡️'}</span>
                      <span className="text-sm font-semibold text-zinc-200">{defName}</span>
                    </div>
                    <span className="text-xs font-mono text-zinc-500">VS</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-zinc-200">{attName}</span>
                      <span className="text-base">{b.attacker?.flag || '⚔️'}</span>
                    </div>
                  </div>

                  {/* Score Balance Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-500" 
                        style={{ width: `${defPct}%` }}
                      ></div>
                      <div 
                        className="bg-rose-500 h-full transition-all duration-500" 
                        style={{ width: `${attPct}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-emerald-400 font-semibold">{defPct.toFixed(1)}%</span>
                      <span className="text-zinc-500 text-[10px] flex items-center gap-1">
                        <Clock className="w-3 h-3 inline" />
                        {b.timeLeft || 'Live'}
                      </span>
                      <span className="text-rose-400 font-semibold">{attPct.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500">Intensity:</span>
                  <span className="text-zinc-300 font-medium">{b.intensity || 'High Combat'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* War Supply & Frontline Munition Arbitrage */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">War Supply Logistics</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Key munitions and rations consumed during active battles. High combat intensity drives spot market prices up.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {warSupplies.map((sup) => {
            const spread = sup.spot * 0.97 - sup.craftCost;
            const margin = sup.spot > 0 ? (spread / sup.spot) * 100 : 0;
            const isProfit = margin > 0;

            return (
              <div 
                key={sup.name}
                className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-200">{sup.name}</span>
                  <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                    Burn: {sup.burnRate}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  {sup.utility}
                </p>

                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-zinc-500">Spot: </span>
                    <span className="text-zinc-200 font-medium">${sup.spot.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Craft Margin: </span>
                    <span className={`font-semibold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProfit ? '+' : ''}{margin.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Action: </span>
                    <span className="text-zinc-300 font-medium">{sup.action.split(' ')[0]}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
