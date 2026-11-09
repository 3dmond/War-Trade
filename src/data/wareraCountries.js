import staticCountries from './wareraCountriesData.js';

// In-memory registries for instant O(1) resolution across ID, code, and name
const countriesById = new Map();
const countriesByCode = new Map();
const countriesByName = new Map();

/**
 * Pure, non-recursive converter: 2-letter ISO code -> Unicode regional indicator flag emoji
 */
export function codeToFlag(code) {
  if (!code || typeof code !== 'string') return '🌐';
  const clean = code.trim().toUpperCase();
  if (clean.length !== 2 || clean === 'HQ') return '🌐';
  try {
    const codePoints = clean
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🌐';
  }
}

// Populate from verified in-game database of all 181 countries
Object.values(staticCountries).forEach(c => {
  if (!c || !c.code) return;
  const normalized = {
    id: c.id || c._id,
    name: c.name,
    code: c.code.toUpperCase()
  };
  if (normalized.id) {
    countriesById.set(normalized.id, normalized);
    countriesById.set(String(normalized.id).toLowerCase(), normalized);
  }
  countriesByCode.set(normalized.code, normalized);
  if (normalized.name) countriesByName.set(normalized.name.toLowerCase().trim(), normalized);
});

/**
 * Universal Country Resolver.
 * Accepts:
 *  - MongoDB ObjectId string (e.g. "6813b6d446e731854c7ac7be")
 *  - 2-letter ISO code (e.g. "BG", "bg", "il")
 *  - English country name (e.g. "Bulgaria", "Israel")
 *  - Worker or Country Object (e.g. { nationality: "...", countryCode: "..." })
 * Returns:
 *  { id: string|null, name: string, code: string, flag: string }
 */
export function resolveCountry(input) {
  if (!input) return null;

  // 1. If object passed, inspect its country properties
  if (typeof input === 'object') {
    if (input.code && input.name) {
      const code = input.code.toUpperCase();
      return {
        id: input.id || input._id || null,
        name: input.name,
        code,
        flag: codeToFlag(code)
      };
    }
    // For workers, strictly prioritize authentic citizenship/nationality
    const candidate = 
      input.nationality || 
      input.citizenship || 
      input.nationalityId || 
      input.nationalityCode || 
      input.homeland ||
      input.origin ||
      input.countryCode || 
      input.country;
    if (candidate && candidate !== input) {
      const res = resolveCountry(candidate);
      if (res && res.code !== 'HQ') return res;
    }
  }

  if (typeof input !== 'string') return null;
  const clean = input.trim();
  if (!clean) return null;

  // 2. Exact match in countriesById (MongoDB ObjectId lookup - case insensitive)
  const lowerClean = clean.toLowerCase();
  if (countriesById.has(clean)) {
    const c = countriesById.get(clean);
    return { ...c, flag: codeToFlag(c.code) };
  }
  if (countriesById.has(lowerClean)) {
    const c = countriesById.get(lowerClean);
    return { ...c, flag: codeToFlag(c.code) };
  }

  // 3. Exact match in countriesByCode (2-letter ISO code)
  const upper = clean.toUpperCase();
  if (countriesByCode.has(upper)) {
    const c = countriesByCode.get(upper);
    return { ...c, flag: codeToFlag(c.code) };
  }

  // 4. Exact match in countriesByName (English country name)
  const lower = clean.toLowerCase();
  if (countriesByName.has(lower)) {
    const c = countriesByName.get(lower);
    return { ...c, flag: codeToFlag(c.code) };
  }

  // 5. Fallback for 2-letter ISO using Intl.DisplayNames
  if (upper.length === 2 && upper !== 'HQ') {
    let name = upper;
    try {
      const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
      name = regionNames.of(upper) || upper;
    } catch {}
    return {
      id: null,
      name,
      code: upper,
      flag: codeToFlag(upper)
    };
  }

  return {
    id: clean,
    name: clean,
    code: 'HQ',
    flag: '🌐'
  };
}

/**
 * Universal Country Flag emoji resolver from 2-letter ISO code, MongoDB country ID, or object.
 */
export function getCountryFlag(codeOrId) {
  if (!codeOrId) return '🌐';
  if (typeof codeOrId === 'string') {
    const clean = codeOrId.trim();
    if (clean.length === 2) return codeToFlag(clean);
    if (countriesById.has(clean)) {
      return codeToFlag(countriesById.get(clean).code);
    }
  }
  const resolved = resolveCountry(codeOrId);
  return resolved?.flag || '🌐';
}

/**
 * Universal Country Name resolver from 2-letter ISO code or MongoDB country ID.
 */
export function getCountryName(codeOrId) {
  if (!codeOrId) return '';
  if (typeof codeOrId === 'string') {
    const clean = codeOrId.trim();
    if (countriesById.has(clean)) {
      return countriesById.get(clean).name;
    }
    const upper = clean.toUpperCase();
    if (countriesByCode.has(upper)) {
      return countriesByCode.get(upper).name;
    }
    if (clean.length === 2) {
      try {
        const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
        const name = regionNames.of(upper);
        if (name) return name;
      } catch {}
    }
  }
  const resolved = resolveCountry(codeOrId);
  return resolved?.name || (typeof codeOrId === 'string' ? codeOrId : '');
}

/**
 * Register or update country in memory from live API response.
 */
export function registerCountry(c) {
  if (!c || !c.code) return;
  const normalized = {
    id: c._id || c.id,
    name: c.name,
    code: c.code.toUpperCase()
  };
  if (normalized.id) countriesById.set(normalized.id, normalized);
  countriesByCode.set(normalized.code, normalized);
  if (normalized.name) countriesByName.set(normalized.name.toLowerCase().trim(), normalized);
}

export default {
  resolveCountry,
  getCountryFlag,
  getCountryName,
  codeToFlag,
  registerCountry
};
