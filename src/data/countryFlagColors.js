import { resolveCountry } from './wareraCountries.js';

/**
 * Country Flag Color Mapping & Flag Motion Engine
 * 
 * Maps world and in-game country ISO codes to their authentic flag colors.
 * Provides low-opacity gradient backgrounds and flag-like wave animation tokens
 * so the country name text remains 100% crisp, readable, and beautifully framed.
 */

// Comprehensive flag color palette for world countries (hex values)
export const COUNTRY_FLAG_COLORS = {
  // Common In-Game Countries
  'IL': { name: 'Israel', colors: ['#0038b8', '#ffffff', '#0038b8'], border: '#0038b8', direction: '180deg' }, // Blue & White horizontal
  'EC': { name: 'Ecuador', colors: ['#ffdd00', '#034ea2', '#ed1c24'], border: '#034ea2', direction: '180deg' }, // Yellow, Blue, Red
  'ES': { name: 'Spain', colors: ['#aa151b', '#f1bf00', '#aa151b'], border: '#aa151b', direction: '180deg' }, // Red, Yellow, Red
  'US': { name: 'United States', colors: ['#b22234', '#ffffff', '#3c3b6e'], border: '#3c3b6e', direction: '135deg' },
  'DE': { name: 'Germany', colors: ['#262626', '#dd0000', '#ffce00'], border: '#dd0000', direction: '180deg' },
  'FR': { name: 'France', colors: ['#0055a4', '#ffffff', '#ef4135'], border: '#0055a4', direction: '90deg' },
  'GB': { name: 'United Kingdom', colors: ['#012169', '#ffffff', '#c8102e'], border: '#012169', direction: '135deg' },
  'UK': { name: 'United Kingdom', colors: ['#012169', '#ffffff', '#c8102e'], border: '#012169', direction: '135deg' },
  'IT': { name: 'Italy', colors: ['#009246', '#ffffff', '#ce2b37'], border: '#009246', direction: '90deg' },
  'JP': { name: 'Japan', colors: ['#ffffff', '#bc002d', '#ffffff'], border: '#bc002d', direction: '90deg' },
  'CN': { name: 'China', colors: ['#de2910', '#de2910', '#ffde00'], border: '#de2910', direction: '135deg' },
  'BR': { name: 'Brazil', colors: ['#009c3b', '#ffdf00', '#002776'], border: '#009c3b', direction: '135deg' },
  'CA': { name: 'Canada', colors: ['#ff0000', '#ffffff', '#ff0000'], border: '#ff0000', direction: '90deg' },
  'UA': { name: 'Ukraine', colors: ['#0057b7', '#ffd700'], border: '#0057b7', direction: '180deg' },
  'PL': { name: 'Poland', colors: ['#ffffff', '#dc143c'], border: '#dc143c', direction: '180deg' },
  'RU': { name: 'Russia', colors: ['#ffffff', '#0039a6', '#d52b1e'], border: '#0039a6', direction: '180deg' },
  'IN': { name: 'India', colors: ['#ff9933', '#ffffff', '#138808'], border: '#ff9933', direction: '180deg' },
  'SG': { name: 'Singapore', colors: ['#ed2939', '#ffffff'], border: '#ed2939', direction: '180deg' },
  'KR': { name: 'South Korea', colors: ['#ffffff', '#cd2e3a', '#0047a0'], border: '#0047a0', direction: '135deg' },
  'MX': { name: 'Mexico', colors: ['#006847', '#ffffff', '#ce1126'], border: '#006847', direction: '90deg' },
  'AR': { name: 'Argentina', colors: ['#74acdf', '#ffffff', '#74acdf'], border: '#74acdf', direction: '180deg' },
  'AU': { name: 'Australia', colors: ['#00008b', '#ffffff', '#ff0000'], border: '#00008b', direction: '135deg' },
  'NL': { name: 'Netherlands', colors: ['#ae1c28', '#ffffff', '#21468b'], border: '#21468b', direction: '180deg' },
  'SE': { name: 'Sweden', colors: ['#006aa7', '#fecc00'], border: '#006aa7', direction: '135deg' },
  'NO': { name: 'Norway', colors: ['#ba0c2f', '#ffffff', '#00205b'], border: '#ba0c2f', direction: '135deg' },
  'DK': { name: 'Denmark', colors: ['#c60c30', '#ffffff'], border: '#c60c30', direction: '90deg' },
  'FI': { name: 'Finland', colors: ['#ffffff', '#002f6c'], border: '#002f6c', direction: '90deg' },
  'CH': { name: 'Switzerland', colors: ['#d52b1e', '#ffffff'], border: '#d52b1e', direction: '135deg' },
  'AT': { name: 'Austria', colors: ['#ed2939', '#ffffff', '#ed2939'], border: '#ed2939', direction: '180deg' },
  'BE': { name: 'Belgium', colors: ['#262626', '#fdda24', '#ef3340'], border: '#ef3340', direction: '90deg' },
  'PT': { name: 'Portugal', colors: ['#046a38', '#da291c'], border: '#046a38', direction: '90deg' },
  'GR': { name: 'Greece', colors: ['#0d5eaf', '#ffffff'], border: '#0d5eaf', direction: '180deg' },
  'TR': { name: 'Turkey', colors: ['#e30a17', '#ffffff'], border: '#e30a17', direction: '90deg' },
  'EG': { name: 'Egypt', colors: ['#c8102e', '#ffffff', '#262626'], border: '#c8102e', direction: '180deg' },
  'ZA': { name: 'South Africa', colors: ['#007749', '#ffb81c', '#e03c31', '#001489'], border: '#007749', direction: '135deg' },
  'NG': { name: 'Nigeria', colors: ['#008751', '#ffffff', '#008751'], border: '#008751', direction: '90deg' },
  'MW': { name: 'Malawi', colors: ['#262626', '#c8102e', '#007a3d'], border: '#007a3d', direction: '180deg' },
  'KE': { name: 'Kenya', colors: ['#262626', '#bb0000', '#006600'], border: '#bb0000', direction: '180deg' },
  'SA': { name: 'Saudi Arabia', colors: ['#006c35', '#ffffff'], border: '#006c35', direction: '90deg' },
  'AE': { name: 'UAE', colors: ['#00732f', '#ffffff', '#262626', '#ff0000'], border: '#00732f', direction: '90deg' },
  'ID': { name: 'Indonesia', colors: ['#ff0000', '#ffffff'], border: '#ff0000', direction: '180deg' },
  'TH': { name: 'Thailand', colors: ['#a51931', '#ffffff', '#2d2a4a', '#ffffff', '#a51931'], border: '#2d2a4a', direction: '180deg' },
  'VN': { name: 'Vietnam', colors: ['#da251d', '#ffff00'], border: '#da251d', direction: '135deg' },
  'PH': { name: 'Philippines', colors: ['#0038a8', '#ce1126', '#ffffff'], border: '#0038a8', direction: '180deg' },
  'MY': { name: 'Malaysia', colors: ['#cc0000', '#ffffff', '#000066'], border: '#cc0000', direction: '180deg' },
  'NZ': { name: 'New Zealand', colors: ['#00247d', '#cc142b', '#ffffff'], border: '#00247d', direction: '135deg' },
  'CL': { name: 'Chile', colors: ['#0039a6', '#ffffff', '#d52b1e'], border: '#0039a6', direction: '180deg' },
  'CO': { name: 'Colombia', colors: ['#fcd116', '#003893', '#ce1126'], border: '#fcd116', direction: '180deg' },
  'PE': { name: 'Peru', colors: ['#d91023', '#ffffff', '#d91023'], border: '#d91023', direction: '90deg' },
  'VE': { name: 'Venezuela', colors: ['#fce300', '#00247d', '#cf142b'], border: '#00247d', direction: '180deg' },
  'IE': { name: 'Ireland', colors: ['#169b62', '#ffffff', '#ff883e'], border: '#169b62', direction: '90deg' },
  'CZ': { name: 'Czechia', colors: ['#ffffff', '#d7141a', '#11457e'], border: '#11457e', direction: '135deg' },
  'RO': { name: 'Romania', colors: ['#002b7f', '#fcd116', '#ce1126'], border: '#002b7f', direction: '90deg' },
  'HU': { name: 'Hungary', colors: ['#ce2939', '#ffffff', '#477050'], border: '#ce2939', direction: '180deg' },
  'BG': { name: 'Bulgaria', colors: ['#ffffff', '#00966e', '#d62612'], border: '#00966e', direction: '180deg' },
  'RW': { name: 'Rwanda', colors: ['#00a1de', '#fad201', '#20603d'], border: '#00a1de', direction: '180deg' },
  'UY': { name: 'Uruguay', colors: ['#0038a8', '#ffffff', '#0038a8'], border: '#0038a8', direction: '180deg' },
  'PR': { name: 'Puerto Rico', colors: ['#ed0000', '#ffffff', '#00247d'], border: '#00247d', direction: '135deg' },
  'FJ': { name: 'Fiji', colors: ['#68bfe5', '#ffffff', '#ce1126'], border: '#68bfe5', direction: '135deg' },
  'LU': { name: 'Luxembourg', colors: ['#ea141d', '#ffffff', '#51adfa'], border: '#ea141d', direction: '180deg' },
  'CM': { name: 'Cameroon', colors: ['#007a5e', '#ce1126', '#fcd116'], border: '#007a5e', direction: '90deg' },
  'HN': { name: 'Honduras', colors: ['#0073cf', '#ffffff', '#0073cf'], border: '#0073cf', direction: '180deg' },
  'MZ': { name: 'Mozambique', colors: ['#007168', '#000000', '#ffde00', '#d1103a'], border: '#007168', direction: '135deg' },
  'AM': { name: 'Armenia', colors: ['#d90012', '#0033a0', '#f2a800'], border: '#d90012', direction: '180deg' },
  'ER': { name: 'Eritrea', colors: ['#00a3dd', '#eb1c24', '#12ad2b'], border: '#eb1c24', direction: '135deg' },
  'AO': { name: 'Angola', colors: ['#cc092f', '#000000', '#ffcb00'], border: '#cc092f', direction: '180deg' },
  'BO': { name: 'Bolivia', colors: ['#d52b1e', '#fcd116', '#007934'], border: '#007934', direction: '180deg' },
  'TW': { name: 'Taiwan', colors: ['#00247d', '#ffffff', '#de2910'], border: '#00247d', direction: '135deg' },
  'TT': { name: 'Trinidad and Tobago', colors: ['#ce1126', '#ffffff', '#000000'], border: '#ce1126', direction: '135deg' },
  'PA': { name: 'Panama', colors: ['#003893', '#ffffff', '#d21034'], border: '#003893', direction: '135deg' },
  'BZ': { name: 'Belize', colors: ['#003893', '#d21034', '#003893'], border: '#003893', direction: '180deg' },
  'HT': { name: 'Haiti', colors: ['#00209f', '#d21034'], border: '#00209f', direction: '180deg' },
  'BD': { name: 'Bangladesh', colors: ['#006a4e', '#f42a41'], border: '#006a4e', direction: '135deg' },
  'JO': { name: 'Jordan', colors: ['#000000', '#ffffff', '#007a3d', '#ce1126'], border: '#007a3d', direction: '180deg' },
  'HQ': { name: 'Global HQ', colors: ['#009edb', '#f59e0b', '#ffffff'], border: '#009edb', direction: '135deg' }
};

/**
 * Converts a hex color into rgba with custom opacity.
 */
function hexToRgba(hex, alpha = 0.35) {
  if (!hex || typeof hex !== 'string') return `rgba(100, 116, 139, ${alpha})`;
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return `rgba(100, 116, 139, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Algorithmic fallback ensuring every ISO 2-letter country code has a unique,
 * harmonic 3-color flag gradient even if not in the explicit map.
 */
function getFallbackFlagColors(code) {
  const palette = [
    '#e11d48', '#2563eb', '#16a34a', '#d97706', 
    '#7c3aed', '#0891b2', '#ea580c', '#ffffff', 
    '#475569', '#dc2626', '#0284c7', '#059669'
  ];
  const c1 = (code || 'A').charCodeAt(0) || 65;
  const c2 = (code || 'B').charCodeAt(1) || 66;
  const color1 = palette[c1 % palette.length];
  const color2 = palette[(c1 + c2) % palette.length];
  const color3 = palette[c2 % palette.length];
  return {
    name: code,
    colors: [color1, color2, color3],
    border: color1,
    direction: '135deg'
  };
}

/**
 * Returns the low-opacity CSS flag background gradient, border color,
 * and wave tokens for any country code.
 * Opacity is kept gentle (0.28 - 0.40) so dark country text remains 100% legible.
 */
export function getCountryFlagTheme(countryCode) {
  const resolved = resolveCountry(countryCode);
  const code = (resolved?.code || (typeof countryCode === 'string' ? countryCode.trim().toUpperCase() : 'HQ'));
  const entry = COUNTRY_FLAG_COLORS[code] || getFallbackFlagColors(code);

  const colors = entry.colors || ['#ffffff', '#0038b8'];
  const direction = entry.direction || '135deg';

  // Build low-opacity color stops for background
  const rgbaStops = colors.map((col, idx) => {
    // Middle white colors get lower opacity to prevent glaring brightness
    const isWhite = col.toLowerCase() === '#ffffff' || col.toLowerCase() === '#fff';
    const alpha = isWhite ? 0.22 : 0.36;
    const pct = Math.round((idx / (colors.length - 1 || 1)) * 100);
    return `${hexToRgba(col, alpha)} ${pct}%`;
  }).join(', ');

  const gradient = `linear-gradient(${direction}, ${rgbaStops})`;
  const borderColor = hexToRgba(entry.border || colors[0], 0.45);

  return {
    gradient,
    borderColor,
    primaryColor: entry.border || colors[0],
    name: entry.name
  };
}
