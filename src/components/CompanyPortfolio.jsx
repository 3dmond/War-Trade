import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Factory, 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  Plus, 
  Trash2, 
  Sliders, 
  ArrowUpRight, 
  Layers, 
  Sparkles, 
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { RECIPES, ENGINE_UPGRADE_TIERS, STORAGE_UPGRADE_TIERS } from '../data/gameData';

export default function CompanyPortfolio({ 
  dossier, 
  prices = {}, 
  onOpenSyncModal, 
  onSelectCompanyForLabor 
}) {
  const user = dossier?.user;
  const userCompanies = dossier?.companies || [];

  const defaultCompanies = [
    {
      id: 'c1',
      name: 'Vanguard Munitions Plant #1',
      itemCode: 'ammo',
      engineLevel: 3,
      storageLevel: 3,
      activeWorkers: 2,
      workerSkillLevel: 3,
      workSessionsPerDay: 2,
      wagePerPp: 0.04
    },
    {
      id: 'c2',
      name: 'Titan Heavy Metallurgy',
      itemCode: 'steel',
      engineLevel: 2,
      storageLevel: 2,
      activeWorkers: 1,
      workerSkillLevel: 2,
      workSessionsPerDay: 2,
      wagePerPp: 0.04
    },
    {
      id: 'c3',
      name: 'Apex Pharma Synthetics',
      itemCode: 'pill',
      engineLevel: 4,
      storageLevel: 4,
      activeWorkers: 3,
      workerSkillLevel: 4,
      workSessionsPerDay: 3,
      wagePerPp: 0.045
    }
  ];

  const [companies, setCompanies] = useState(() => {
    if (userCompanies.length > 0) {
      return userCompanies.map((c, i) => ({
        id: c._id || `c-${i}`,
        name: c.name || `Facility #${i + 1}`,
        itemCode: c.itemCode || 'ammo',
        engineLevel: c.automatedEngine?.level || 1,
        storageLevel: c.storage?.level || 1,
        activeWorkers: 1,
        workerSkillLevel: 3,
        workSessionsPerDay: 2,
        wagePerPp: 0.04
      }));
    }
    return defaultCompanies;
  });

  const analyzedCompanies = useMemo(() => {
    return companies.map(comp => {
      const recipe = RECIPES.find(r => r.id === comp.itemCode) || RECIPES[0];
      const spotPrice = prices[comp.itemCode] || 1.0;
      const netSpot = spotPrice * 0.97;

      let unitRawCost = 0;
      if (recipe.inputs && recipe.inputs.length > 0) {
        recipe.inputs.forEach(inp => {
          unitRawCost += (prices[inp.id] || 0) * inp.qty;
        });
      }

      const engineTier = ENGINE_UPGRADE_TIERS.find(t => t.level === comp.engineLevel) || ENGINE_UPGRADE_TIERS[0];
      const engineDailyPp = engineTier.ppPerHour * 24;

      const ppPerSession = 10 + Math.max(0, comp.workerSkillLevel - 1) * 3;
      const laborDailyPp = comp.activeWorkers * comp.workSessionsPerDay * ppPerSession;

      const totalDailyPp = engineDailyPp + laborDailyPp;
      const unitsPerDay = recipe.pp > 0 ? (totalDailyPp / recipe.pp) : 0;

      const grossRevenue = unitsPerDay * spotPrice;
      const netRevenue = unitsPerDay * netSpot;
      const dailyRawCost = unitsPerDay * unitRawCost;
      const dailyLaborCost = laborDailyPp * comp.wagePerPp;
      const totalDailyCost = dailyRawCost + dailyLaborCost;
      const dailyNetProfit = netRevenue - totalDailyCost;
      const margin = netRevenue > 0 ? (dailyNetProfit / netRevenue) * 100 : 0;

      const storageTier = STORAGE_UPGRADE_TIERS.find(t => t.level === comp.storageLevel) || STORAGE_UPGRADE_TIERS[0];
      const storageCapacity = storageTier.capacity;
      const hoursToFillStorage = unitsPerDay > 0 ? (storageCapacity / (unitsPerDay / 24)) : 999;

      return {
        ...comp,
        recipeName: recipe.name,
        recipeCategory: recipe.category,
        recipePp: recipe.pp,
        enginePpPerHour: engineTier.ppPerHour,
        engineDailyPp,
        laborDailyPp,
        totalDailyPp,
        unitsPerDay,
        grossRevenue,
        netRevenue,
        dailyRawCost,
        dailyLaborCost,
        totalDailyCost,
        dailyNetProfit,
        margin,
        storageCapacity,
        hoursToFillStorage
      };
    });
  }, [companies, prices]);

  const portfolioSummary = useMemo(() => {
    let totalRevenue = 0;
    let totalExpense = 0;
    let totalNetProfit = 0;
    let totalDailyPp = 0;
    let totalWorkers = 0;

    analyzedCompanies.forEach(c => {
      totalRevenue += c.netRevenue;
      totalExpense += c.totalDailyCost;
      totalNetProfit += c.dailyNetProfit;
      totalDailyPp += c.totalDailyPp;
      totalWorkers += c.activeWorkers;
    });

    const netMargin = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalExpense,
      totalNetProfit,
      totalDailyPp,
      totalWorkers,
      netMargin,
      companyCount: analyzedCompanies.length
    };
  }, [analyzedCompanies]);

  const handleAddCompany = (itemCode) => {
    const newComp = {
      id: `c-${Date.now()}`,
      name: `New ${itemCode.toUpperCase()} Line`,
      itemCode,
      engineLevel: 1,
      storageLevel: 1,
      activeWorkers: 1,
      workerSkillLevel: 2,
      workSessionsPerDay: 2,
      wagePerPp: 0.04
    };
    setCompanies([...companies, newComp]);
  };

  const handleDeleteCompany = (id) => {
    setCompanies(companies.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-2">
      
      {/* Portfolio Header with Breathing Space */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
            Enterprise Portfolio
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-normal">
            Real-time balance sheet, daily manufacturing throughput, and facility upgrade ROI.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          {user?.username ? (
            <span className="text-slate-600">
              Synced to <strong className="text-slate-900">@{user.username}</strong>
            </span>
          ) : (
            <button
              onClick={onOpenSyncModal}
              className="text-amber-700 hover:text-amber-800 font-medium underline underline-offset-4"
            >
              Sync Your Real Companies
            </button>
          )}
        </div>
      </div>

      {/* High-Level Financial Snapshot Cards (Light Theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Net Cashflow */}
        <div className="bg-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="text-xs text-slate-500 font-medium">Daily Net Profit</div>
          <div className="text-3xl font-extrabold font-mono text-emerald-700 mt-2">
            +${portfolioSummary.totalNetProfit.toFixed(2)}
          </div>
          <div className="mt-3 text-xs text-slate-500 font-mono">
            Net Margin: <strong className="text-emerald-700">+{portfolioSummary.netMargin.toFixed(1)}%</strong>
          </div>
        </div>

        {/* Daily Revenue */}
        <div className="bg-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="text-xs text-slate-500 font-medium">Net Realized Revenue</div>
          <div className="text-3xl font-extrabold font-mono text-slate-900 mt-2">
            ${portfolioSummary.totalRevenue.toFixed(2)}
          </div>
          <div className="mt-3 text-xs text-slate-500 font-mono">
            Across {portfolioSummary.companyCount} facilities
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="text-xs text-slate-500 font-medium">Operating Expenses</div>
          <div className="text-3xl font-extrabold font-mono text-rose-700 mt-2">
            -${portfolioSummary.totalExpense.toFixed(2)}
          </div>
          <div className="mt-3 text-xs text-slate-500 font-mono">
            Raw materials & wages
          </div>
        </div>

        {/* Output Power */}
        <div className="bg-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="text-xs text-slate-500 font-medium">Total Production Output</div>
          <div className="text-3xl font-extrabold font-mono text-slate-900 mt-2">
            {portfolioSummary.totalDailyPp} PP/d
          </div>
          <div className="mt-3 text-xs text-slate-500 font-mono">
            {portfolioSummary.totalWorkers} active workers + Engines
          </div>
        </div>

      </div>

      {/* Facilities Breakdown List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-sans">
              Manufacturing Facilities ({analyzedCompanies.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Individual unit economics and automation status</p>
          </div>

          {/* Quick add facility button */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">Add Line:</span>
            {['ammo', 'heavyAmmo', 'bread', 'pill'].map(item => (
              <button
                key={item}
                onClick={() => handleAddCompany(item)}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-mono font-medium transition"
              >
                +{item.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {analyzedCompanies.map((comp) => {
            const isProfit = comp.dailyNetProfit > 0;
            return (
              <div 
                key={comp.id}
                className="bg-white p-5 rounded-2xl space-y-4 flex flex-col justify-between shadow-sm hover:shadow-md transition"
              >
                <div>
                  {/* Top Bar: Name & Remove */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm font-sans">{comp.name}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono font-bold uppercase">
                          {comp.itemCode}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-mono">{comp.recipeCategory}</span>
                    </div>

                    <button
                      onClick={() => handleDeleteCompany(comp.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition"
                      title="Remove facility"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Financial Snapshot */}
                  <div className="mt-4 p-3.5 bg-slate-50 rounded-xl space-y-2 text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Daily Production:</span>
                      <span className="text-slate-900 font-semibold">{comp.unitsPerDay.toFixed(1)} units/day</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Net Sales Revenue:</span>
                      <span className="text-slate-900 font-semibold">${comp.netRevenue.toFixed(2)}/day</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Raw Inputs:</span>
                      <span className="text-rose-700 font-medium">-${comp.dailyRawCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Worker Wages:</span>
                      <span className="text-rose-700 font-medium">-${comp.dailyLaborCost.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold text-sm">
                      <span className="text-slate-800 font-sans">Net Daily Profit:</span>
                      <span className={isProfit ? 'text-emerald-700' : 'text-rose-700'}>
                        {isProfit ? '+' : ''}${comp.dailyNetProfit.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Facility Status & Engine */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-slate-50 p-2.5 rounded-lg">
                      <span className="text-[10px] text-slate-500 block uppercase">Engine Automation</span>
                      <span className="text-slate-900 font-bold">Lvl {comp.engineLevel} ({comp.engineDailyPp} PP/d)</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg">
                      <span className="text-[10px] text-slate-500 block uppercase">Storage Vault</span>
                      <span className="text-slate-900 font-bold">Lvl {comp.storageLevel} ({comp.storageCapacity} cap)</span>
                    </div>
                  </div>
                </div>

                {/* Bottom link to Labor Simulator */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500">
                  <span className="text-[11px]">
                    Storage full in: {comp.hoursToFillStorage > 90 ? '90h+' : `${comp.hoursToFillStorage.toFixed(0)}h`}
                  </span>
                  <button
                    onClick={() => onSelectCompanyForLabor(comp.itemCode)}
                    className="text-amber-700 hover:text-amber-800 font-bold inline-flex items-center gap-1 transition"
                  >
                    <span>Simulate Labor</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
