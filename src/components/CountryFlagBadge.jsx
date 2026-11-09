import React from 'react';
import { getCountryFlagTheme } from '../data/countryFlagColors';

/**
 * CountryFlagBadge
 * 
 * Displays the country flag emoji and country name on a dynamic, low-opacity
 * flag-colored background gradient with flag-waving motion and silk sheen ripple.
 * 
 * Supported for ALL in-game countries with high-contrast text readability.
 */
export default function CountryFlagBadge({
  countryCode,
  countryFlag,
  countryName,
  className = ''
}) {
  const theme = getCountryFlagTheme(countryCode);
  const displayName = countryName || theme.name || countryCode || 'Global';

  return (
    <div 
      className={`relative overflow-hidden flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-md border text-center shadow-xs select-none transition-all duration-300 animate-flag-wave ${className}`}
      style={{
        background: theme.gradient,
        borderColor: theme.borderColor,
      }}
      title={`Country: ${displayName} (${countryCode || 'HQ'})`}
    >
      {/* Silk fabric sheen wave ripple */}
      <div className="animate-flag-sheen" />

      {/* Flag Emoji with gentle wind flutter */}
      {countryFlag && (
        <span className="text-sm shrink-0 leading-none animate-flag-flutter drop-shadow-xs">
          {countryFlag}
        </span>
      )}

      {/* Crisp high-contrast Country Name */}
      <span className="text-[10px] font-black uppercase tracking-wider text-[#1a1102] font-sans truncate relative z-10 drop-shadow-[0_1px_1px_rgba(255,255,255,0.65)]">
        {displayName}
      </span>
    </div>
  );
}
