// WarEra v0.27+ Trait & Team Synergy Evaluation Engine
// Evaluates facility coworkers and whole-portfolio candidates for team-linked traits.

import { getTraitInfo } from './employeeTraits.js';
import { getItemValuePerPp } from './marketMath.js';
import { resolveCountry, getCountryName as getWareraCountryName, getCountryFlag } from './wareraCountries.js';

export function getCountryName(code) {
  if (!code) return '';
  const resolved = resolveCountry(code);
  if (resolved?.name) return resolved.name;
  return getWareraCountryName(code) || String(code);
}

function getWorkerCountry(worker, fallback = 'HQ') {
  if (!worker) return fallback;
  const resolved = resolveCountry(worker);
  if (resolved?.code && resolved.code !== 'HQ') {
    return resolved.code;
  }
  if (worker.countryCode && typeof worker.countryCode === 'string') return worker.countryCode.toUpperCase();
  if (worker.nationalityCode && typeof worker.nationalityCode === 'string') return worker.nationalityCode.toUpperCase();
  return fallback;
}

export function getWorkerHourlyWages(w) {
  if (!w) return { basePay: 0.05, totalPay: 0.05 };
  const total = typeof w.hourlyWage === 'number'
    ? w.hourlyWage
    : (typeof w.wage === 'number'
        ? w.wage
        : (typeof w.salary === 'number' ? w.salary : (typeof w.estimate?.wage === 'number' ? w.estimate.wage : 0.05)));

  const base = typeof w.baseHourlyWage === 'number'
    ? w.baseHourlyWage
    : (typeof w.baseWage === 'number'
        ? w.baseWage
        : (typeof w.hiringWage === 'number' ? w.hiringWage : total));

  return {
    basePay: Number(base.toFixed(3)),
    totalPay: Number(total.toFixed(3))
  };
}

export function getUnboostedHappiness(w, coworkersList = []) {
  if (!w) return 50;

  let currentHappiness = typeof w.happinessBreakdown?.value === 'number'
    ? w.happinessBreakdown.value
    : (typeof w.happiness === 'number' ? w.happiness : 50);

  // 1. Check if happinessBreakdown has an explicit contribution for foreman
  const contributions = w.happinessBreakdown?.contributions || [];
  const fmContrib = contributions.find(c => c.code === 'foreman' || c.source === 'foreman' || c.reason === 'foreman');
  if (fmContrib && typeof fmContrib.delta === 'number') {
    return Math.max(0, currentHappiness - fmContrib.delta);
  }

  // 2. Check if any coworker in their facility has foreman (and isn't this worker)
  if (Array.isArray(coworkersList) && coworkersList.length > 0) {
    const hasForemanCoworker = coworkersList.some(cw => {
      if (!cw || cw === w || cw.id === w.id || cw._id === w._id || cw.name === w.name) return false;
      const traits = Array.isArray(cw.traits) ? cw.traits : [];
      return traits.some(t => (t.code || t) === 'foreman');
    });
    if (hasForemanCoworker && currentHappiness >= 9) {
      return currentHappiness - 9;
    }
  }

  return currentHappiness;
}

export function getUnboostedLuck(w, coworkersList = []) {
  if (!w) return 1;

  // 1. If breakdown explicitly specifies base and trained luck
  const baseLuck = w.breakdown?.luck?.base ?? w.base?.luck;
  const trainedLuck = w.breakdown?.luck?.trained ?? w.trained?.luck;
  if (typeof baseLuck === 'number') {
    return baseLuck + (trainedLuck || 0);
  }

  // 2. If luck contributions explicitly contain luckyCharm
  const luckContributions = w.breakdown?.luck?.contributions || [];
  const lcContrib = luckContributions.find(c => c.code === 'luckyCharm' || c.source === 'luckyCharm');
  if (lcContrib && typeof lcContrib.delta === 'number') {
    const rawLuck = w.luck ?? 1;
    return Math.max(0, rawLuck - lcContrib.delta);
  }

  // 3. If coworkers list contains an employee with luckyCharm
  if (Array.isArray(coworkersList) && coworkersList.length > 0) {
    const hasCoworkerWithLuckyCharm = coworkersList.some(cw => {
      if (!cw || cw === w || cw.id === w.id || cw._id === w._id || cw.name === w.name) return false;
      const traits = Array.isArray(cw.traits) ? cw.traits : [];
      return traits.some(t => (t.code || t) === 'luckyCharm');
    });
    if (hasCoworkerWithLuckyCharm && typeof w.luck === 'number' && w.luck >= 3) {
      return w.luck - 3;
    }
  }

  return w.luck ?? 1;
}

export function getUnboostedProduction(w, coworkersList = []) {
  if (!w) return 3;

  // 1. If breakdown explicitly specifies base and trained production
  const baseProd = w.breakdown?.production?.base ?? w.base?.production;
  const trainedProd = w.breakdown?.production?.trained ?? w.trained?.production;
  if (typeof baseProd === 'number') {
    return baseProd + (trainedProd || 0);
  }

  let curProd = w.breakdown?.production?.total ?? (w.baseProduction ?? w.production ?? 3);

  // 2. Check if contributions explicitly include coworker traits (comic, mentor, etc.)
  const contributions = w.breakdown?.production?.contributions || [];
  const comicContrib = contributions.find(c => c.code === 'comic' || c.source === 'comic');
  if (comicContrib && typeof comicContrib.delta === 'number') {
    curProd = Math.max(0, curProd - comicContrib.delta);
  }
  const mentorContrib = contributions.find(c => c.code === 'mentor' || c.source === 'mentor');
  if (mentorContrib && typeof mentorContrib.delta === 'number') {
    curProd = Math.max(0, curProd - mentorContrib.delta);
  }

  // 3. Check if coworkers list has an active comic or mentor (excluding self)
  if (Array.isArray(coworkersList) && coworkersList.length > 0) {
    const hasComicCoworker = coworkersList.some(cw => {
      if (!cw || cw === w || cw.id === w.id || cw._id === w._id || cw.name === w.name) return false;
      const traits = Array.isArray(cw.traits) ? cw.traits : [];
      return traits.some(t => (t.code || t) === 'comic');
    });
    if (hasComicCoworker && curProd >= 10 && !comicContrib) {
      curProd -= 10;
    }

    const hasMentorCoworker = coworkersList.some(cw => {
      if (!cw || cw === w || cw.id === w.id || cw._id === w._id || cw.name === w.name) return false;
      const traits = Array.isArray(cw.traits) ? cw.traits : [];
      return traits.some(t => (t.code || t) === 'mentor');
    });
    if (hasMentorCoworker && curProd >= 2 && !mentorContrib) {
      curProd -= 2;
    }
  }

  return Math.max(0, curProd);
}

/**
 * Main Trait Evaluation Function
 * Returns:
 * - isTeamTrait: boolean
 * - isRanked: boolean (whether list has 1, 2, 3 numerical ranks)
 * - personalData: { summary, status } (for personal traits)
 * - companyWorkers: array of effects on coworkers in this company
 * - allWorkers: array of effects across ALL portfolio workers, in descending order
 */
export function evaluateTraitSynergy(
  traitInput, 
  worker, 
  company = {}, 
  portfolioWorkers = [], 
  ratePerPp = 0.06, 
  portfolioCompanies = []
) {
  const traitInfo = getTraitInfo(traitInput);
  const code = traitInfo.code;
  const isTeamTrait = Boolean(traitInfo.isCoworkerLinked);

  const isSameWorker = (w, target) => {
    if (!w || !target) return false;
    if (w === target) return true;
    if (w.id && target.id && w.id === target.id) return true;
    if (w._id && target._id && w._id === target._id) return true;
    if (w.name && target.name && w.name === target.name) return true;
    return false;
  };

  // Active coworkers in the current company facility (excluding self and managers)
  const currentCompanyWorkers = (company.enrichedWorkers || company.employees || company.workers || [])
    .filter(w => !w.isManager && w.role !== 'Manager' && !isSameWorker(w, worker));

  // All workers across the portfolio (excluding self and managers) - includes company workers!
  const allPortfolioWorkers = (portfolioWorkers || [])
    .filter(w => !w.isManager && w.role !== 'Manager' && !isSameWorker(w, worker));

  // Distinct portfolio companies
  const allCompanies = (portfolioCompanies && portfolioCompanies.length > 0)
    ? portfolioCompanies
    : Array.from(new Map(
        allPortfolioWorkers
          .filter(w => w.companyId)
          .map(w => [w.companyId, { id: w.companyId, name: w.companyName, countryCode: w.countryCode }])
      ).values());

  const workerCountry = getWorkerCountry(worker, company.countryCode || 'HQ');
  const workerProd = worker.baseProduction ?? worker.production ?? 3;
  const workerHappiness = worker.happiness ?? 50;

  // Initialize result
  const result = {
    code,
    name: traitInfo.name,
    icon: traitInfo.icon,
    description: traitInfo.description,
    category: traitInfo.categoryLabel,
    isTeamTrait,
    isRanked: true,
    isNegative: traitInfo.isNegative,
    personalData: null,
    companyWorkers: [],
    allWorkers: []
  };

  // =========================================================================
  // 1. PERSONAL TRAITS & AGE/TENURE TRAITS
  // =========================================================================
  if (!isTeamTrait && code !== 'expat' && code !== 'homesick') {
    let summary = traitInfo.description;
    let status = 'Active personal modifier';

    const hiredDays = typeof worker.hiredDays === 'number' 
      ? worker.hiredDays 
      : (typeof worker.daysAtCompany === 'number' ? worker.daysAtCompany : (typeof worker.tenureDays === 'number' ? worker.tenureDays : 5));
    const age = typeof worker.age === 'number' ? worker.age : 28;

    if (code === 'anchor') {
      summary = 'Never quits. Suffers -50% output if Happiness drops below 30.';
      status = workerHappiness >= 30 
        ? `Current Happiness: ${workerHappiness}% (Safe ≥ 30%)` 
        : `Current Happiness: ${workerHappiness}% (⚠️ Penalty: -50% Output)`;
    } else if (code === 'handy') {
      const hasTool = Boolean(worker.toolItem || worker.tool);
      summary = 'Gives +40% output while holding a tool.';
      status = hasTool ? 'Equipped with hardware tool (Active: +40% PP)' : 'No tool equipped (Inactive)';
    } else if (code === 'improviser') {
      const hasTool = Boolean(worker.toolItem || worker.tool);
      summary = 'Gives +25% output while holding no tool.';
      status = !hasTool ? 'No tool equipped (Active: +25% PP)' : 'Tool equipped (Inactive)';
    } else if (code === 'patriot') {
      summary = 'Gives +2 PP and +10 Happiness when working in homeland core region.';
      const isHomeland = workerCountry === (company.countryCode || 'HQ');
      status = isHomeland ? `Assigned to homeland [${getCountryName(workerCountry)}] (Active: +2 PP, +10 HAP)` : 'Assigned abroad (Inactive)';
    } else if (code === 'veteran') {
      summary = 'Gives +20% output after 30 days at same company.';
      status = hiredDays < 30
        ? `${30 - hiredDays} days left until +20% output`
        : `30+ days passed (${hiredDays}d) → Active: +20% output`;
    } else if (code === 'diamondInTheRough') {
      summary = 'Gives +1 to one stat every 10 days at same company (up to +4).';
      const unlocked = Math.min(4, Math.floor(hiredDays / 10));
      if (unlocked < 4) {
        const daysLeft = 10 - (hiredDays % 10);
        status = `${daysLeft} days left until next +1 stat (${unlocked}/4 unlocked)`;
      } else {
        status = `40+ days passed (${hiredDays}d) → Max (+4 stats unlocked)`;
      }
    } else if (code === 'lateBloomer') {
      summary = 'Gives +2 per 10 years past age 40, up to +6.';
      if (age < 40) {
        status = `${40 - age} years left until +2 boost (at age 40)`;
      } else if (age < 60) {
        const nextAge = (Math.floor(age / 10) + 1) * 10;
        const currentBonus = Math.min(6, (Math.floor((age - 40) / 10) + 1) * 2);
        status = `${nextAge - age} years left until next +2 boost (at age ${nextAge}, currently +${currentBonus})`;
      } else {
        status = `Age ${age} → Max +6 boost reached`;
      }
    } else if (code === 'earlyBloomer') {
      summary = 'Gives +6 until age 40, then -2 per 10 years, reducing to nothing at age 60.';
      if (age < 40) {
        status = `${40 - age} years left of +6 boost (reduces by -2 at age 40)`;
      } else if (age < 60) {
        const nextAge = (Math.floor(age / 10) + 1) * 10;
        status = `${nextAge - age} years left until boost reduces by -2 (at age ${nextAge})`;
      } else {
        status = `Age ${age} → Boost expired (0 PP)`;
      }
    } else if (code === 'creatureOfHabit') {
      summary = 'Gives -30% output for 3 days after being transferred to a new company.';
      const transferDays = typeof worker.daysSinceTransfer === 'number' ? worker.daysSinceTransfer : hiredDays;
      status = transferDays < 3
        ? `${3 - transferDays} days left until -30% penalty lifts`
        : `3+ days passed (${transferDays}d) → Penalty lifted (Normal output)`;
    } else if (code === 'burnout') {
      summary = 'Gives -1 to all stats every 20 days at the same company, up to -3.';
      const penaltyCount = Math.min(3, Math.floor(hiredDays / 20));
      if (penaltyCount < 3) {
        const daysLeft = 20 - (hiredDays % 20);
        status = `${daysLeft} days left until next -1 penalty to all stats (${penaltyCount}/3 applied)`;
      } else {
        status = `60+ days passed (${hiredDays}d) → Max penalty (-3 to all stats) reached`;
      }
    } else if (code === 'wornOut') {
      summary = 'Gives -2 per 10 years past age 50, up to -6.';
      if (age < 50) {
        status = `${50 - age} years left until first -2 penalty (at age 50)`;
      } else if (age < 70) {
        const nextAge = (Math.floor(age / 10) + 1) * 10;
        status = `${nextAge - age} years left until next -2 penalty (at age ${nextAge})`;
      } else {
        status = `Age ${age} → Max -6 penalty reached`;
      }
    } else if (code === 'loyal') {
      summary = 'Halves all Happiness morale losses.';
      status = 'Active (Morale defense)';
    } else if (code === 'taxShy') {
      summary = 'Loses -1% per 1% employee tax (up to -30%).';
      status = `Current facility tax applied`;
    }

    result.personalData = { summary, status };
    return result;
  }

  // =========================================================================
  // 2. EXPAT & HOMESICK (GEOGRAPHY RELATIONS)
  // =========================================================================

  // EXPAT: Gives +2 when working abroad. List companies they could work in!
  if (code === 'expat') {
    result.isTeamTrait = true;
    result.isRanked = false;
    result.companySectionTitle = 'Current Assignment:';
    result.allSectionTitle = 'Foreign Companies to Work in (+2 PP):';

    const isAbroad = workerCountry !== (company.countryCode || 'HQ');
    result.companyWorkers = [{
      name: company.name || 'Current Company',
      companyName: company.name,
      companyId: company.id,
      changeText: isAbroad 
        ? `Abroad in ${getCountryName(company.countryCode)} (+2 Active)` 
        : `Homeland in ${getCountryName(workerCountry)} (Inactive)`
    }];

    // List all foreign companies across the portfolio
    const foreignCompanies = allCompanies.filter(c => {
      const cCountry = (c.countryCode || 'HQ').toUpperCase();
      return cCountry !== workerCountry;
    });

    result.allWorkers = foreignCompanies.map(c => ({
      name: c.name,
      companyName: c.name,
      companyId: c.id,
      countryName: getCountryName(c.countryCode),
      changeText: `${getCountryName(c.countryCode)} (+2 PP)`
    }));

    return result;
  }

  // HOMESICK: Gives -2 and -10 when working abroad. Full country names.
  if (code === 'homesick') {
    result.isTeamTrait = true;
    result.isRanked = false;
    result.isNegative = true;
    result.companySectionTitle = 'Current Assignment:';
    result.allSectionTitle = `Homeland Facilities in ${getCountryName(workerCountry)}:`;

    const isAbroad = workerCountry !== (company.countryCode || 'HQ');
    result.companyWorkers = [{
      name: company.name || 'Current Company',
      companyName: company.name,
      companyId: company.id,
      isNegativeConflict: isAbroad,
      changeText: isAbroad 
        ? `Abroad in ${getCountryName(company.countryCode)} (-2 PP, -10 HAP)` 
        : `Homeland in ${getCountryName(workerCountry)} (Safe)`
    }];

    if (isAbroad) {
      // List domestic companies in homeland that they could transfer to
      const domesticCompanies = allCompanies.filter(c => {
        const cCountry = (c.countryCode || 'HQ').toUpperCase();
        return cCountry === workerCountry;
      });

      result.allWorkers = domesticCompanies.map(c => ({
        name: c.name,
        companyName: c.name,
        companyId: c.id,
        countryName: getCountryName(c.countryCode),
        changeText: `${c.name} (Homeland)`
      }));
    } else {
      result.allWorkers = [];
    }

    return result;
  }

  // =========================================================================
  // 3. TEAM TRAITS (Coworker-linked relations)
  // =========================================================================

  // MANAGEMENT (Manager trait): +2% production per management level to all workers
  if (code === 'management' || worker.isManager) {
    const mgrLevel = worker.managementLevel || worker.potential || company?.manager?.managementLevel || 1;
    const bonusPct = mgrLevel * 2;
    result.name = `Management Lv.${mgrLevel}`;
    result.icon = '👔';
    result.description = `Scales all facility workers' production by continuous +${bonusPct}% bonus.`;
    result.isTeamTrait = true;
    result.isRanked = true;

    result.companyWorkers = currentCompanyWorkers
      .map(w => {
        const cur = w.breakdown?.production?.total ?? (w.baseProduction || 3);
        const boosted = Number((cur * (1 + bonusPct / 100)).toFixed(1));
        return {
          name: w.name || w.username,
          countryName: getCountryName(getWorkerCountry(w, company.countryCode)),
          score: boosted,
          changeText: `${cur} → ${boosted} (+${bonusPct}%)`
        };
      })
      .sort((a, b) => b.score - a.score);

    result.allWorkers = allPortfolioWorkers
      .map(w => {
        const cur = w.breakdown?.production?.total ?? (w.baseProduction || 3);
        const boosted = Number((cur * (1 + bonusPct / 100)).toFixed(1));
        return {
          name: w.name || w.username,
          countryName: getCountryName(getWorkerCountry(w)),
          companyName: w.companyName || company.name,
          score: boosted,
          changeText: `${cur} → ${boosted} (+${bonusPct}%)`
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((w, i) => ({ ...w, rank: i + 1 }));

    return result;
  }

  // LUCKY CHARM: +3 Luck to coworkers (Ranked descending by resulting Luck)
  if (code === 'luckyCharm') {
    result.isRanked = true;

    // a) on workers in the company
    result.companyWorkers = currentCompanyWorkers
      .map(w => {
        const unboosted = getUnboostedLuck(w, currentCompanyWorkers);
        const boosted = unboosted + 3;
        return {
          name: w.name || w.username,
          countryName: getCountryName(getWorkerCountry(w, company.countryCode)),
          score: boosted,
          changeText: `${unboosted} → ${boosted} (+3)`
        };
      })
      .sort((a, b) => b.score - a.score);

    // b) across all workers - remove any active luckyCharm boost from a coworker, add +3, then sort descending
    result.allWorkers = allPortfolioWorkers
      .map(w => {
        const unboosted = getUnboostedLuck(w, allPortfolioWorkers);
        const boosted = unboosted + 3;
        const prod = w.breakdown?.production?.total ?? (w.baseProduction || 3);
        return {
          name: w.name || w.username,
          countryName: getCountryName(getWorkerCountry(w)),
          companyName: w.companyName || company.name,
          score: boosted,
          prodScore: prod,
          changeText: `${unboosted} → ${boosted} (+3)`
        };
      })
      .sort((a, b) => (b.score - a.score) || (b.prodScore - a.prodScore))
      .map((w, i) => ({ ...w, rank: i + 1 }));

    return result;
  }

  // FOREMAN: +9 Happiness to coworkers (as confirmed by in-game WarEra rules)
  if (code === 'foreman') {
    result.name = 'Foreman';
    result.icon = '📋';
    result.description = 'Grants +9 Happiness to every active coworker in the facility.';
    result.isRanked = true;

    // a) on workers in the company
    result.companyWorkers = currentCompanyWorkers
      .map(w => {
        const unboosted = getUnboostedHappiness(w, currentCompanyWorkers);
        const boosted = Math.min(100, unboosted + 9);
        return {
          name: w.name || w.username,
          countryName: getCountryName(getWorkerCountry(w, company.countryCode)),
          score: boosted,
          changeText: `${unboosted} → ${boosted} (+9)`
        };
      })
      .sort((a, b) => b.score - a.score);

    // b) across all workers in portfolio (unboost first, then apply +9, sort descending)
    result.allWorkers = allPortfolioWorkers
      .map(w => {
        const unboosted = getUnboostedHappiness(w, allPortfolioWorkers);
        const boosted = Math.min(100, unboosted + 9);
        const prod = w.breakdown?.production?.total ?? (w.baseProduction || 3);
        return {
          name: w.name || w.username,
          countryName: getCountryName(getWorkerCountry(w)),
          companyName: w.companyName || company.name,
          score: boosted,
          prodScore: prod,
          changeText: `${unboosted} → ${boosted} (+9)`
        };
      })
      .sort((a, b) => (b.score - a.score) || (b.prodScore - a.prodScore))
      .map((w, i) => ({ ...w, rank: i + 1 }));

    return result;
  }

  // COMIC: +10 Happiness to coworkers, -1 to self (list in order of most happiness to least)
  if (code === 'comic') {
    result.isRanked = true;

    // a) on workers in the company (strip active boosts first, apply +10 Happiness, sort descending: most to least)
    result.companyWorkers = currentCompanyWorkers
      .map(w => {
        const unboosted = getUnboostedHappiness(w, currentCompanyWorkers);
        const boosted = Math.min(100, unboosted + 10);
        return {
          name: w.name || w.username,
          countryName: getCountryName(getWorkerCountry(w, company.countryCode)),
          companyName: company.name,
          companyId: company.id,
          score: boosted,
          changeText: `${unboosted} → ${boosted} (+10)`
        };
      })
      .sort((a, b) => b.score - a.score);

    // b) across all workers (strip active boosts first, add +10 Happiness, sort descending: most to least)
    result.allWorkers = allPortfolioWorkers
      .map(w => {
        const unboosted = getUnboostedHappiness(w, allPortfolioWorkers);
        const boosted = Math.min(100, unboosted + 10);
        return {
          name: w.name || w.username,
          countryName: getCountryName(getWorkerCountry(w)),
          companyName: w.companyName || company.name,
          companyId: w.companyId,
          score: boosted,
          changeText: `${unboosted} → ${boosted} (+10)`
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((w, i) => ({ ...w, rank: i + 1 }));

    return result;
  }

  // MENTOR: +2 to WEAKER coworkers, -1 for themselves (list weaker coworkers in ascending order: weaker the better)
  if (code === 'mentor') {
    result.isRanked = true;
    const mentorUnboostedProd = getUnboostedProduction(worker, currentCompanyWorkers);

    // a) on weaker workers in the company (strip active boosts first, filter strictly weaker, sort ascending)
    result.companyWorkers = currentCompanyWorkers
      .map(w => {
        const unboosted = getUnboostedProduction(w, currentCompanyWorkers);
        return {
          name: w.name || w.username,
          countryName: getCountryName(getWorkerCountry(w, company.countryCode)),
          companyName: company.name,
          companyId: company.id,
          unboosted,
          boosted: unboosted + 2,
          score: unboosted,
          changeText: `${unboosted} → ${unboosted + 2} (+2)`
        };
      })
      .filter(w => w.unboosted < mentorUnboostedProd)
      .sort((a, b) => a.score - b.score); // Ascending: weaker the better!

    // b) across all weaker workers in portfolio (strip active boosts first, filter strictly weaker, sort ascending)
    result.allWorkers = allPortfolioWorkers
      .map(w => {
        const unboosted = getUnboostedProduction(w, allPortfolioWorkers);
        return {
          name: w.name || w.username,
          countryName: getCountryName(getWorkerCountry(w)),
          companyName: w.companyName || company.name,
          companyId: w.companyId,
          unboosted,
          boosted: unboosted + 2,
          score: unboosted,
          changeText: `${unboosted} → ${unboosted + 2} (+2)`
        };
      })
      .filter(w => w.unboosted < mentorUnboostedProd)
      .sort((a, b) => a.score - b.score) // Ascending: weaker the better!
      .map((w, i) => ({ ...w, rank: i + 1 }));

    return result;
  }

  // COSMOPOLITAN: +2 PP per foreign coworker (up to +4)
  if (code === 'cosmopolitan') {
    result.isRanked = false; // Name and country only, no ranking

    // a) in this company: list foreign coworkers present (name on left, country on right)
    result.companyWorkers = currentCompanyWorkers
      .filter(w => getWorkerCountry(w, company.countryCode) !== workerCountry)
      .map(w => {
        const c = getWorkerCountry(w, company.countryCode);
        return {
          name: w.name || w.username,
          countryName: getCountryName(c),
          companyName: company.name,
          companyId: company.id,
          changeText: getCountryName(c) // Country only on right
        };
      });

    // b) across all workers: list foreign workers across portfolio (name on left, country on right)
    result.allWorkers = allPortfolioWorkers
      .filter(w => getWorkerCountry(w) !== workerCountry)
      .map(w => {
        const c = getWorkerCountry(w);
        return {
          name: w.name || w.username,
          countryName: getCountryName(c),
          companyName: w.companyName || company.name,
          companyId: w.companyId,
          changeText: getCountryName(c) // Country only on right
        };
      });

    return result;
  }

  // NATIONALIST: return list of compatriots across different companies (no country needed, clickable company, no rank)
  if (code === 'nationalist') {
    result.isRanked = false;

    // a) In this company
    result.companyWorkers = currentCompanyWorkers
      .filter(w => getWorkerCountry(w, company.countryCode) === workerCountry)
      .map(w => ({
        name: w.name || w.username,
        companyName: company.name,
        companyId: company.id,
        changeText: company.name
      }));

    // b) Across different companies
    result.allWorkers = allPortfolioWorkers
      .filter(w => getWorkerCountry(w) === workerCountry)
      .map(w => ({
        name: w.name || w.username,
        companyName: w.companyName || company.name,
        companyId: w.companyId,
        changeText: w.companyName || company.name
      }));

    return result;
  }

  // BAND OF BROTHERS: Male employees (title by sex, clickable company link, no rank)
  if (code === 'bandOfBrothers') {
    result.isRanked = false;
    result.companySectionTitle = 'Male Employees in Company:';
    result.allSectionTitle = 'Male Employees Across:';

    result.companyWorkers = currentCompanyWorkers
      .filter(w => (w.gender || 'male').toLowerCase() === 'male')
      .map(w => ({
        name: w.name || w.username,
        companyName: company.name,
        companyId: company.id,
        changeText: company.name
      }));

    result.allWorkers = allPortfolioWorkers
      .filter(w => (w.gender || 'male').toLowerCase() === 'male')
      .map(w => ({
        name: w.name || w.username,
        companyName: w.companyName || company.name,
        companyId: w.companyId,
        changeText: w.companyName || company.name
      }));

    return result;
  }

  // GIRL POWER: Female employees (title by sex, clickable company link, no rank)
  if (code === 'girlPower') {
    result.isRanked = false;
    result.companySectionTitle = 'Female Employees in Company:';
    result.allSectionTitle = 'Female Employees Across:';

    result.companyWorkers = currentCompanyWorkers
      .filter(w => (w.gender || '').toLowerCase() === 'female')
      .map(w => ({
        name: w.name || w.username,
        companyName: company.name,
        companyId: company.id,
        changeText: company.name
      }));

    result.allWorkers = allPortfolioWorkers
      .filter(w => (w.gender || '').toLowerCase() === 'female')
      .map(w => ({
        name: w.name || w.username,
        companyName: w.companyName || company.name,
        companyId: w.companyId,
        changeText: w.companyName || company.name
      }));

    return result;
  }

  // XENOPHOBE: include workers they're COMPATIBLE with; highlight foreign workmate to be removed (red X and red highlight)
  if (code === 'xenophobe') {
    result.isRanked = false;
    result.isNegative = true;
    result.companySectionTitle = 'Coworkers in Company:';
    result.allSectionTitle = 'Compatible Employees Across Portfolio:';

    result.companyWorkers = currentCompanyWorkers.map(w => {
      const isForeign = getWorkerCountry(w, company.countryCode) !== workerCountry;
      return {
        name: w.name || w.username,
        isNegativeConflict: isForeign, // Red highlight & red ✕
        companyName: company.name,
        companyId: company.id,
        changeText: isForeign ? 'Remove' : 'Compatible'
      };
    });

    // Across portfolio: list compatible domestic workers
    result.allWorkers = allPortfolioWorkers
      .filter(w => getWorkerCountry(w) === workerCountry)
      .map(w => ({
        name: w.name || w.username,
        companyName: w.companyName || company.name,
        companyId: w.companyId,
        changeText: w.companyName || company.name
      }));

    return result;
  }

  // NEMESIS: Identify and highlight if any in company, return who they SHOULDN'T work with across portfolio
  if (code === 'nemesis') {
    result.isRanked = false;
    result.isNegative = true;
    result.companySectionTitle = 'Coworkers in Company:';
    result.allSectionTitle = "Workers They Shouldn't Work With:";

    const nemesisTarget = worker.nemesis || worker.nemesisName || worker.nemesisId;

    result.companyWorkers = currentCompanyWorkers.map(w => {
      const isNemesis = nemesisTarget 
        ? (w.id === nemesisTarget || w.name === nemesisTarget || w.username === nemesisTarget)
        : false;
      return {
        name: w.name || w.username,
        isNegativeConflict: isNemesis, // Red highlight & red ✕
        companyName: company.name,
        companyId: company.id,
        changeText: isNemesis ? 'Nemesis' : 'Safe'
      };
    });

    result.allWorkers = allPortfolioWorkers
      .filter(w => {
        if (!nemesisTarget) return false;
        return w.id === nemesisTarget || w.name === nemesisTarget || w.username === nemesisTarget;
      })
      .map(w => ({
        name: w.name || w.username,
        isNegativeConflict: true, // Red highlight & red ✕
        companyName: w.companyName || company.name,
        companyId: w.companyId,
        changeText: w.companyName || company.name
      }));

    return result;
  }

  // MISANDRIST: Highlight male coworker to be removed, offer female replacements across portfolio
  if (code === 'misandrist') {
    result.isRanked = false;
    result.isNegative = true;
    result.companySectionTitle = 'Coworkers in Company:';
    result.allSectionTitle = 'Compatible Replacements Across Portfolio:';

    const hasMaleCoworker = currentCompanyWorkers.some(w => (w.gender || 'male').toLowerCase() === 'male');

    result.companyWorkers = currentCompanyWorkers.map(w => {
      const isMale = (w.gender || 'male').toLowerCase() === 'male';
      return {
        name: w.name || w.username,
        isNegativeConflict: isMale, // Red highlight & red ✕
        companyName: company.name,
        companyId: company.id,
        changeText: isMale ? 'Remove' : 'Compatible'
      };
    });

    // If has male coworker, offer female replacements; if none present, no need for this
    if (hasMaleCoworker) {
      result.allWorkers = allPortfolioWorkers
        .filter(w => (w.gender || '').toLowerCase() === 'female')
        .map(w => ({
          name: w.name || w.username,
          companyName: w.companyName || company.name,
          companyId: w.companyId,
          changeText: w.companyName || company.name
        }));
    } else {
      result.allWorkers = [];
    }

    return result;
  }

  // MISOGYNIST: Highlight female coworker to be removed, offer male replacements across portfolio
  if (code === 'misogynist') {
    result.isRanked = false;
    result.isNegative = true;
    result.companySectionTitle = 'Coworkers in Company:';
    result.allSectionTitle = 'Compatible Replacements Across Portfolio:';

    const hasFemaleCoworker = currentCompanyWorkers.some(w => (w.gender || '').toLowerCase() === 'female');

    result.companyWorkers = currentCompanyWorkers.map(w => {
      const isFemale = (w.gender || '').toLowerCase() === 'female';
      return {
        name: w.name || w.username,
        isNegativeConflict: isFemale, // Red highlight & red ✕
        companyName: company.name,
        companyId: company.id,
        changeText: isFemale ? 'Remove' : 'Compatible'
      };
    });

    // If has female coworker, offer male replacements; if none present, no need for this
    if (hasFemaleCoworker) {
      result.allWorkers = allPortfolioWorkers
        .filter(w => (w.gender || 'male').toLowerCase() === 'male')
        .map(w => ({
          name: w.name || w.username,
          companyName: w.companyName || company.name,
          companyId: w.companyId,
          changeText: w.companyName || company.name
        }));
    } else {
      result.allWorkers = [];
    }

    return result;
  }

  // BULLY: -10 Happiness to coworkers in facility. No across-company employees needed.
  if (code === 'bully') {
    result.isRanked = false;
    result.isNegative = true;
    result.companySectionTitle = 'Coworkers in Company:';
    result.companyWorkers = currentCompanyWorkers.map(w => {
      const unboosted = getUnboostedHappiness(w, currentCompanyWorkers);
      const boosted = Math.max(0, unboosted - 10);
      return {
        name: w.name || w.username,
        countryName: getCountryName(getWorkerCountry(w, company.countryCode)),
        companyName: company.name,
        companyId: company.id,
        isNegativeConflict: true, // Red warning highlight & red ✕
        changeText: `${unboosted} → ${boosted} (-10)`
      };
    });
    result.allWorkers = [];
    return result;
  }

  // ENVIOUS: -5 per better-paid coworker (up to -10).
  // In company: highlight better-paid coworkers.
  // Across portfolio: show workers earning less than him in descending order.
  // Rank, Name, Base pay, Total pay in BTC/hr.
  // Earning more than target: red; earning less: green; same: orange.
  if (code === 'envious') {
    result.isRanked = true;
    result.isNegative = true;
    result.companySectionTitle = 'Coworkers in Company:';
    result.allSectionTitle = 'Workers Earning Less Than Him (Ranked):';

    const myWages = getWorkerHourlyWages(worker);
    const myTotal = myWages.totalPay;

    result.companyWorkers = currentCompanyWorkers.map(w => {
      const cwWages = getWorkerHourlyWages(w);
      const isBetterPaid = cwWages.totalPay > myTotal;
      const isSamePaid = cwWages.totalPay === myTotal;
      const colorClass = isBetterPaid 
        ? 'text-red-700 bg-red-500/15' 
        : (isSamePaid ? 'text-amber-800 bg-amber-500/15' : 'text-emerald-800 bg-emerald-500/15');
      return {
        name: w.name || w.username,
        companyName: company.name,
        companyId: company.id,
        isNegativeConflict: isBetterPaid,
        wageData: {
          basePay: cwWages.basePay.toFixed(3),
          totalPay: cwWages.totalPay.toFixed(3),
          colorClass
        },
        changeText: `${cwWages.basePay.toFixed(3)} / ${cwWages.totalPay.toFixed(3)} BTC/h`
      };
    });

    result.allWorkers = allPortfolioWorkers
      .map(w => {
        const cwWages = getWorkerHourlyWages(w);
        return {
          name: w.name || w.username,
          companyName: w.companyName || company.name,
          companyId: w.companyId,
          basePay: cwWages.basePay,
          totalPay: cwWages.totalPay,
          wageData: {
            basePay: cwWages.basePay.toFixed(3),
            totalPay: cwWages.totalPay.toFixed(3),
            colorClass: 'text-emerald-800 bg-emerald-500/15'
          },
          changeText: `${cwWages.basePay.toFixed(3)} / ${cwWages.totalPay.toFixed(3)} BTC/h`
        };
      })
      .filter(w => w.totalPay < myTotal)
      .sort((a, b) => b.totalPay - a.totalPay)
      .map((w, i) => ({ ...w, rank: i + 1 }));

    return result;
  }

  // PRIMA DONNA: +20% when paid more than every coworker; -10 when not.
  // In company: highlight coworkers earning more or equal.
  // Across portfolio: list wages like Envious trait (Rank, Name, Base pay, Total pay, green/red/orange).
  if (code === 'primaDonna') {
    result.isRanked = true;
    result.companySectionTitle = 'Coworkers in Company:';
    result.allSectionTitle = 'Workers Earning Less Than Him (Ranked):';

    const myWages = getWorkerHourlyWages(worker);
    const myTotal = myWages.totalPay;

    result.companyWorkers = currentCompanyWorkers.map(w => {
      const cwWages = getWorkerHourlyWages(w);
      const isHigherOrEqual = cwWages.totalPay >= myTotal;
      const isSamePaid = cwWages.totalPay === myTotal;
      const colorClass = cwWages.totalPay > myTotal 
        ? 'text-red-700 bg-red-500/15' 
        : (isSamePaid ? 'text-amber-800 bg-amber-500/15' : 'text-emerald-800 bg-emerald-500/15');
      return {
        name: w.name || w.username,
        companyName: company.name,
        companyId: company.id,
        isNegativeConflict: isHigherOrEqual, // Highlights coworkers preventing the +20% bonus
        wageData: {
          basePay: cwWages.basePay.toFixed(3),
          totalPay: cwWages.totalPay.toFixed(3),
          colorClass
        },
        changeText: `${cwWages.basePay.toFixed(3)} / ${cwWages.totalPay.toFixed(3)} BTC/h`
      };
    });

    result.allWorkers = allPortfolioWorkers
      .map(w => {
        const cwWages = getWorkerHourlyWages(w);
        return {
          name: w.name || w.username,
          companyName: w.companyName || company.name,
          companyId: w.companyId,
          basePay: cwWages.basePay,
          totalPay: cwWages.totalPay,
          wageData: {
            basePay: cwWages.basePay.toFixed(3),
            totalPay: cwWages.totalPay.toFixed(3),
            colorClass: 'text-emerald-800 bg-emerald-500/15'
          },
          changeText: `${cwWages.basePay.toFixed(3)} / ${cwWages.totalPay.toFixed(3)} BTC/h`
        };
      })
      .filter(w => w.totalPay < myTotal)
      .sort((a, b) => b.totalPay - a.totalPay)
      .map((w, i) => ({ ...w, rank: i + 1 }));

    return result;
  }

  // JINX: -2 Luck to coworkers.
  // Show the effect, removing any active bonuses first. No suggestions yet.
  if (code === 'jinx') {
    result.isRanked = true;
    result.isNegative = true;
    result.companySectionTitle = 'Coworkers in Company:';
    result.allSectionTitle = 'Across All Workers (Ranked):';

    result.companyWorkers = currentCompanyWorkers
      .map(w => {
        const unboosted = getUnboostedLuck(w, currentCompanyWorkers);
        const boosted = Math.max(0, unboosted - 2);
        return {
          name: w.name || w.username,
          countryName: getCountryName(getWorkerCountry(w, company.countryCode)),
          companyName: company.name,
          companyId: company.id,
          score: boosted,
          changeText: `${unboosted} → ${boosted} (-2)`
        };
      })
      .sort((a, b) => b.score - a.score);

    result.allWorkers = allPortfolioWorkers
      .map(w => {
        const unboosted = getUnboostedLuck(w, allPortfolioWorkers);
        const boosted = Math.max(0, unboosted - 2);
        return {
          name: w.name || w.username,
          countryName: getCountryName(getWorkerCountry(w)),
          companyName: w.companyName || company.name,
          companyId: w.companyId,
          score: boosted,
          changeText: `${unboosted} → ${boosted} (-2)`
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((w, i) => ({ ...w, rank: i + 1 }));

    return result;
  }

  // TRAINER: 2 extra training sessions per day to coworkers.
  // Show coworkers in company and rank employees across portfolio by remaining growth potential slots.
  if (code === 'trainer') {
    result.isRanked = true;
    result.companySectionTitle = 'Coworkers in Company:';
    result.allSectionTitle = 'Remaining Growth Potential (Ranked):';

    result.companyWorkers = currentCompanyWorkers.map(w => {
      const maxSlots = w.potentialMax || 8;
      const used = w.potential || 0;
      const slotsLeft = Math.max(0, maxSlots - used);
      return {
        name: w.name || w.username,
        countryName: getCountryName(getWorkerCountry(w, company.countryCode)),
        companyName: company.name,
        companyId: company.id,
        score: slotsLeft,
        changeText: `${slotsLeft} slots left`
      };
    }).sort((a, b) => b.score - a.score);

    result.allWorkers = allPortfolioWorkers.map(w => {
      const maxSlots = w.potentialMax || 8;
      const used = w.potential || 0;
      const slotsLeft = Math.max(0, maxSlots - used);
      return {
        name: w.name || w.username,
        countryName: getCountryName(getWorkerCountry(w)),
        companyName: w.companyName || company.name,
        companyId: w.companyId,
        score: slotsLeft,
        changeText: `${slotsLeft} slots left`
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((w, i) => ({ ...w, rank: i + 1 }));

    return result;
  }

  // LONER: +100% output and +5 Happiness when working alone.
  // Show status in facility (active +100% if alone, or highlight blocking coworkers).
  // Across portfolio: list empty facilities (0 workers). If none, "No empty facility in portfolio".
  if (code === 'loner') {
    result.isRanked = false;
    const isAlone = currentCompanyWorkers.length === 0;

    if (isAlone) {
      result.companySectionTitle = 'Facility Status:';
      result.companyWorkers = [{
        name: 'Working Alone',
        changeText: 'Active: +100% PP, +5 HAP'
      }];
    } else {
      result.companySectionTitle = 'Blocking Coworkers in Company:';
      result.companyWorkers = currentCompanyWorkers.map(w => ({
        name: w.name || w.username,
        companyName: company.name,
        companyId: company.id,
        isNegativeConflict: true, // Red ✕ & highlight
        changeText: 'Blocks +100%'
      }));
    }

    result.allSectionTitle = 'Empty Facilities in Portfolio:';
    
    // Find facilities with 0 workers
    const emptyCompanies = allCompanies.filter(c => {
      const count = (c.enrichedWorkers || c.employees || c.workers || []).length;
      return count === 0;
    });

    result.allWorkers = emptyCompanies.map(c => ({
      name: c.name,
      companyName: c.name,
      companyId: c.id,
      countryName: getCountryName(c.countryCode),
      changeText: '0 Workers (Empty)'
    }));

    return result;
  }

  // SOCIABLE: +25% per coworker up to +50%, -10 when working alone.
  // Show current coworkers and active bonus.
  // Across portfolio: list companies with 2+ workers.
  if (code === 'sociable') {
    result.isRanked = false;
    result.companySectionTitle = 'Coworkers in Company:';
    result.allSectionTitle = 'Companies with 2+ Coworkers (+50%):';

    const count = currentCompanyWorkers.length;
    const bonusText = count >= 2 ? '+50% Output (Max)' : (count === 1 ? '+25% Output' : '-10 HAP (Alone)');

    if (count === 0) {
      result.companyWorkers = [{
        name: 'Working Alone',
        isNegativeConflict: true,
        changeText: '-10 HAP Penalty'
      }];
    } else {
      result.companyWorkers = currentCompanyWorkers.map(w => ({
        name: w.name || w.username,
        companyName: company.name,
        companyId: company.id,
        changeText: bonusText
      }));
    }

    // Companies with 2+ workers
    const multiWorkerCompanies = allCompanies.filter(c => {
      const wCount = (c.enrichedWorkers || c.employees || c.workers || []).length;
      return wCount >= 2;
    });

    result.allWorkers = multiWorkerCompanies.map(c => {
      const wCount = (c.enrichedWorkers || c.employees || c.workers || []).length;
      return {
        name: c.name,
        companyName: c.name,
        companyId: c.id,
        changeText: `${wCount} Coworkers (+50%)`
      };
    });

    return result;
  }

  // RIVAL: +3 while another worker out-produces them; -1 when nobody out-produces them.
  // Compare unboosted output to coworkers.
  // Across portfolio: list top producers who out-produce this worker (ideal rival pairings).
  if (code === 'rival') {
    result.isRanked = true;
    result.companySectionTitle = 'Coworkers in Company:';
    result.allSectionTitle = 'Workers Out-Producing Him (Ranked):';

    const myProd = getUnboostedProduction(worker, currentCompanyWorkers);

    result.companyWorkers = currentCompanyWorkers.map(w => {
      const cwProd = getUnboostedProduction(w, currentCompanyWorkers);
      const isOutproducer = cwProd > myProd;
      return {
        name: w.name || w.username,
        companyName: company.name,
        companyId: company.id,
        score: cwProd,
        changeText: isOutproducer ? `${cwProd} PP (+3 Active)` : `${cwProd} PP (Lower)`
      };
    }).sort((a, b) => b.score - a.score);

    result.allWorkers = allPortfolioWorkers
      .map(w => {
        const cwProd = getUnboostedProduction(w, allPortfolioWorkers);
        return {
          name: w.name || w.username,
          companyName: w.companyName || company.name,
          companyId: w.companyId,
          score: cwProd,
          changeText: `${cwProd} PP (+3 Rival)`
        };
      })
      .filter(w => w.score > myProd)
      .sort((a, b) => b.score - a.score)
      .map((w, i) => ({ ...w, rank: i + 1 }));

    return result;
  }

  // OLD FRIENDS: Only applies if they have a friend, look for their friend across portfolio
  if (code === 'oldFriends') {
    result.isRanked = false;
    result.companySectionTitle = 'Friends in Company:';
    result.allSectionTitle = 'Assigned Friend in Portfolio:';

    const friendTarget = worker.friend || worker.friendName || worker.friendId;

    if (friendTarget) {
      result.companyWorkers = currentCompanyWorkers
        .filter(w => w.id === friendTarget || w.name === friendTarget || w.username === friendTarget)
        .map(w => ({
          name: w.name || w.username,
          companyName: company.name,
          companyId: company.id,
          changeText: '+15% Output'
        }));

      result.allWorkers = allPortfolioWorkers
        .filter(w => w.id === friendTarget || w.name === friendTarget || w.username === friendTarget)
        .map(w => ({
          name: w.name || w.username,
          companyName: w.companyName || company.name,
          companyId: w.companyId,
          changeText: w.companyName || company.name
        }));
    } else {
      result.companyWorkers = [];
      result.allWorkers = [];
    }

    return result;
  }

  // SWEETHEARTS: Only applies if they have a sweetheart, look for their sweetheart across portfolio
  if (code === 'sweethearts') {
    result.isRanked = false;
    result.companySectionTitle = 'Sweethearts in Company:';
    result.allSectionTitle = 'Assigned Sweetheart in Portfolio:';

    const sweetheartTarget = worker.sweetheart || worker.sweetheartName || worker.sweetheartId || worker.partner;

    if (sweetheartTarget) {
      result.companyWorkers = currentCompanyWorkers
        .filter(w => w.id === sweetheartTarget || w.name === sweetheartTarget || w.username === sweetheartTarget)
        .map(w => ({
          name: w.name || w.username,
          companyName: company.name,
          companyId: company.id,
          changeText: '+20% Output'
        }));

      result.allWorkers = allPortfolioWorkers
        .filter(w => w.id === sweetheartTarget || w.name === sweetheartTarget || w.username === sweetheartTarget)
        .map(w => ({
          name: w.name || w.username,
          companyName: w.companyName || company.name,
          companyId: w.companyId,
          changeText: w.companyName || company.name
        }));
    } else {
      result.companyWorkers = [];
      result.allWorkers = [];
    }

    return result;
  }

  // DEFAULT TEAM FALLBACK
  result.companyWorkers = currentCompanyWorkers.map(w => ({
    name: w.name || w.username,
    countryCode: getWorkerCountry(w, company.countryCode),
    countryName: getCountryName(getWorkerCountry(w, company.countryCode)),
    changeText: `Active facility peer`
  }));

  result.allWorkers = allPortfolioWorkers
    .map(w => ({
      name: w.name || w.username,
      countryCode: getWorkerCountry(w),
      countryName: getCountryName(getWorkerCountry(w)),
      companyName: w.companyName || company.name,
      score: w.baseProduction || 3,
      changeText: `Facility peer (${w.baseProduction || 3} PP)`
    }))
    .sort((a, b) => b.score - a.score)
    .map((w, i) => ({ ...w, rank: i + 1 }));

  return result;
}
