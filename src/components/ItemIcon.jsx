import React from 'react';

/**
 * ItemIcon - Crisp custom vector SVG representations of all 24 WarEra trading commodities.
 * Modeled accurately after the in-game art, silhouettes, and color palettes.
 */
export default function ItemIcon({ itemCode, size = 20, className = '', showBorder = false }) {
  // Safely normalize size whether passed as numeric pixels or tailwind class string
  let pixelSize = 20;
  if (typeof size === 'number' && !isNaN(size)) {
    pixelSize = size;
  } else if (typeof size === 'string') {
    if (size.includes('w-3.5') || size.includes('h-3.5')) pixelSize = 14;
    else if (size.includes('w-3') || size.includes('h-3')) pixelSize = 12;
    else if (size.includes('w-4') || size.includes('h-4')) pixelSize = 16;
    else if (size.includes('w-5') || size.includes('h-5')) pixelSize = 20;
    else if (size.includes('w-6') || size.includes('h-6')) pixelSize = 24;
    else if (size.includes('w-8') || size.includes('h-8')) pixelSize = 32;
    else {
      const parsed = parseInt(size, 10);
      pixelSize = !isNaN(parsed) && parsed > 0 ? parsed : 16;
    }
  }

  // Normalize alias pairs
  const code = (itemCode === 'mysteriousPlant') ? 'coca' : (itemCode === 'pill') ? 'cocain' : itemCode;

  const renderSvg = () => {
    switch (code) {
      // --- CASES ---
      case 'case2': // Military Tactical Case (Dark heavy reinforced crate)
        return (
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <rect x="3" y="8" width="26" height="18" rx="3" fill="#24292e" stroke="#161a1d" strokeWidth="1.5" />
            <rect x="5" y="10" width="22" height="6" fill="#32383e" rx="1.5" />
            <line x1="3" y1="16" x2="29" y2="16" stroke="#0f1215" strokeWidth="1.5" />
            {/* Latches */}
            <rect x="8" y="14" width="4" height="4" rx="1" fill="#eab308" stroke="#ca8a04" strokeWidth="0.8" />
            <rect x="20" y="14" width="4" height="4" rx="1" fill="#eab308" stroke="#ca8a04" strokeWidth="0.8" />
            {/* Handle */}
            <path d="M12 8V6C12 5.44772 12.4477 5 13 5H19C19.5523 5 20 5.44772 20 6V8" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
            {/* Corner steel brackets */}
            <path d="M3 12V8H7" stroke="#64748b" strokeWidth="1.5" />
            <path d="M29 12V8H25" stroke="#64748b" strokeWidth="1.5" />
            <path d="M3 22V26H7" stroke="#64748b" strokeWidth="1.5" />
            <path d="M29 22V26H25" stroke="#64748b" strokeWidth="1.5" />
          </svg>
        );

      case 'case1': // Standard Military Ammo Case (Olive green)
        return (
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <rect x="4" y="9" width="24" height="17" rx="2" fill="#2d4a27" stroke="#1c3018" strokeWidth="1.5" />
            <rect x="6" y="11" width="20" height="5" fill="#3d5c36" rx="1" />
            <line x1="4" y1="16" x2="28" y2="16" stroke="#1c3018" strokeWidth="1.2" />
            {/* Yellow tactical stencil */}
            <rect x="8" y="19" width="6" height="1.5" fill="#facc15" opacity="0.8" />
            {/* Metal Latch */}
            <rect x="14" y="14" width="4" height="4" rx="0.8" fill="#94a3b8" stroke="#475569" strokeWidth="0.8" />
            {/* Heavy Carry Handle */}
            <path d="M11 9V6C11 5.44772 11.4477 5 12 5H20C20.5523 5 21 5.44772 21 6V9" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );

      case 'woodenCase': // Wooden Shipping Crate
        return (
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <rect x="4" y="8" width="24" height="18" rx="2" fill="#85532a" stroke="#523218" strokeWidth="1.5" />
            {/* Horizontal wood planks */}
            <line x1="4" y1="14" x2="28" y2="14" stroke="#523218" strokeWidth="1.2" />
            <line x1="4" y1="20" x2="28" y2="20" stroke="#523218" strokeWidth="1.2" />
            {/* Cross reinforcement planks */}
            <line x1="5" y1="9" x2="27" y2="25" stroke="#683d1c" strokeWidth="1.5" opacity="0.6" />
            {/* Corner steel brackets with rivets */}
            <rect x="4" y="8" width="4" height="4" fill="#64748b" />
            <rect x="24" y="8" width="4" height="4" fill="#64748b" />
            <rect x="4" y="22" width="4" height="4" fill="#64748b" />
            <rect x="24" y="22" width="4" height="4" fill="#64748b" />
            <circle cx="6" cy="10" r="0.8" fill="#e2e8f0" />
            <circle cx="26" cy="10" r="0.8" fill="#e2e8f0" />
            <circle cx="6" cy="24" r="0.8" fill="#e2e8f0" />
            <circle cx="26" cy="24" r="0.8" fill="#e2e8f0" />
          </svg>
        );

      // --- CRAFT ---
      case 'scraps': // Salvaged Scrap Metal Sheets & Pipe
        return (
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {/* Bent metal sheet 1 */}
            <polygon points="5,22 14,8 24,14 18,26" fill="#64748b" stroke="#334155" strokeWidth="1.2" />
            {/* Curved pipe */}
            <path d="M12 25 C16 23, 20 18, 25 10" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
            {/* Sharp jagged shard */}
            <polygon points="12,18 27,24 22,27" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
            {/* Bolt rivet */}
            <circle cx="10" cy="15" r="1.2" fill="#e2e8f0" stroke="#334155" strokeWidth="0.8" />
          </svg>
        );

      // --- BUFFS ---
      case 'cocain': // Combat Pill (Red & White capsule)
        return (
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <g transform="rotate(-35 16 16)">
              {/* White half */}
              <rect x="9" y="8" width="14" height="8" rx="7" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
              {/* Red half */}
              <rect x="9" y="16" width="14" height="8" rx="7" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.2" />
              {/* Seam line */}
              <line x1="9" y1="16" x2="23" y2="16" stroke="#991b1b" strokeWidth="1.5" />
              {/* Gloss highlight */}
              <path d="M11 11C11 11 12 9.5 14 9.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
            </g>
          </svg>
        );

      case 'coca': // Coca Leaf
        return (
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {/* Leaf Body */}
            <path d="M16 4 C24 10, 26 21, 16 28 C6 21, 8 10, 16 4 Z" fill="#22c55e" stroke="#15803d" strokeWidth="1.5" />
            {/* Central Stem & Vein */}
            <path d="M16 6 V29" stroke="#86efac" strokeWidth="1.5" strokeLinecap="round" />
            {/* Side Veins */}
            <path d="M16 12 Q20 10 22 13" stroke="#86efac" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
            <path d="M16 17 Q20 15 22 18" stroke="#86efac" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
            <path d="M16 12 Q12 10 10 13" stroke="#86efac" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
            <path d="M16 17 Q12 15 10 18" stroke="#86efac" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
          </svg>
        );

      // --- AMMO ---
      case 'heavyAmmo': // 3 Heavy Rifle Cartridges
        return (
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {/* Bullet 1 (Left) */}
            <g transform="translate(-5, 0)">
              <rect x="13" y="11" width="4" height="15" rx="1" fill="#eab308" stroke="#a16207" strokeWidth="0.8" />
              <path d="M13 11 Q15 4 17 11 Z" fill="#ca8a04" stroke="#a16207" strokeWidth="0.8" />
              <line x1="13" y1="23" x2="17" y2="23" stroke="#713f12" strokeWidth="0.8" />
            </g>
            {/* Bullet 2 (Center) */}
            <g transform="translate(0, -2)">
              <rect x="14" y="11" width="4" height="16" rx="1" fill="#facc15" stroke="#a16207" strokeWidth="0.8" />
              <path d="M14 11 Q16 3 18 11 Z" fill="#eab308" stroke="#a16207" strokeWidth="0.8" />
              <line x1="14" y1="24" x2="18" y2="24" stroke="#713f12" strokeWidth="0.8" />
            </g>
            {/* Bullet 3 (Right) */}
            <g transform="translate(5, 0)">
              <rect x="15" y="11" width="4" height="15" rx="1" fill="#eab308" stroke="#a16207" strokeWidth="0.8" />
              <path d="M15 11 Q17 4 19 11 Z" fill="#ca8a04" stroke="#a16207" strokeWidth="0.8" />
              <line x1="15" y1="23" x2="19" y2="23" stroke="#713f12" strokeWidth="0.8" />
            </g>
          </svg>
        );

      case 'ammo': // 2 Standard Rifle Cartridges
        return (
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {/* Left bullet */}
            <g transform="translate(-2, 0)">
              <rect x="12" y="12" width="4.5" height="14" rx="1" fill="#eab308" stroke="#a16207" strokeWidth="0.9" />
              <path d="M12 12 Q14.25 5 16.5 12 Z" fill="#ca8a04" stroke="#a16207" strokeWidth="0.9" />
              <line x1="12" y1="23" x2="16.5" y2="23" stroke="#713f12" strokeWidth="0.9" />
            </g>
            {/* Right bullet */}
            <g transform="translate(3, -2)">
              <rect x="13.5" y="12" width="4.5" height="14" rx="1" fill="#facc15" stroke="#a16207" strokeWidth="0.9" />
              <path d="M13.5 12 Q15.75 5 18 12 Z" fill="#eab308" stroke="#a16207" strokeWidth="0.9" />
              <line x1="13.5" y1="23" x2="18" y2="23" stroke="#713f12" strokeWidth="0.9" />
            </g>
          </svg>
        );

      case 'lightAmmo': // 1 Pistol Bullet
        return (
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <g transform="translate(0, 1)">
              {/* Shell Casing */}
              <rect x="11.5" y="13" width="9" height="12" rx="1" fill="#eab308" stroke="#a16207" strokeWidth="1.2" />
              <line x1="11.5" y1="21.5" x2="20.5" y2="21.5" stroke="#713f12" strokeWidth="1" />
              {/* Rounded 9mm Bullet Head */}
              <path d="M12 13 C12 8, 20 8, 20 13 Z" fill="#ca8a04" stroke="#a16207" strokeWidth="1.2" />
              {/* Primer Rim */}
              <rect x="11" y="24" width="10" height="2" rx="0.5" fill="#ca8a04" stroke="#713f12" strokeWidth="0.8" />
            </g>
          </svg>
        );

      case 'lead': // Lead Ore Chunk (Dark gray mineral rock)
        return (
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <polygon points="16,6 25,11 27,21 19,27 8,24 5,14" fill="#334155" stroke="#1e293b" strokeWidth="1.5" />
            {/* Facets */}
            <polygon points="16,6 19,15 25,11" fill="#475569" opacity="0.9" />
            <polygon points="19,15 27,21 19,27" fill="#1e293b" opacity="0.8" />
            <polygon points="16,6 8,14 19,15" fill="#64748b" opacity="0.9" />
            <polygon points="8,14 5,14 8,24" fill="#1e293b" />
            {/* Specular glint */}
            <circle cx="16" cy="11" r="1" fill="#e2e8f0" opacity="0.8" />
          </svg>
        );

      // --- FOOD ---
      case 'cookedFish': // Cooked Pink Salmon Cutlet
        return (
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {/* Salmon Steak U-shape */}
            <path d="M7 12 C7 8, 12 7, 16 9 C20 7, 25 8, 25 12 C25 19, 21 26, 16 27 C11 26, 7 19, 7 12 Z" fill="#f87171" stroke="#dc2626" strokeWidth="1.5" />
            {/* Center cavity */}
            <ellipse cx="16" cy="16" rx="3.5" ry="5" fill="#991b1b" stroke="#7f1d1d" strokeWidth="1" />
            {/* Curved White Fat Grain Lines */}
            <path d="M10 13 Q13 17 10 21" stroke="#fef2f2" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
            <path d="M22 13 Q19 17 22 21" stroke="#fef2f2" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
            <circle cx="16" cy="16" r="1.5" fill="#fecaca" />
          </svg>
        );

      case 'steak': // Grilled Beef Steak
        return (
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M7 15 C6 10, 13 6, 21 8 C27 10, 27 18, 22 23 C16 27, 8 23, 7 15 Z" fill="#991b1b" stroke="#581c1c" strokeWidth="1.5" />
            <ellipse cx="16" cy="15" rx="8" ry="6" fill="#b91c1c" />
            {/* Charcoal Grill Grid Marks */}
            <line x1="10" y1="11" x2="22" y2="19" stroke="#450a0a" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="14" y1="9" x2="24" y2="16" stroke="#450a0a" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="10" y1="18" x2="21" y2="11" stroke="#450a0a" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="13" y1="21" x2="24" y2="14" stroke="#450a0a" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        );

      case 'bread': // Golden Baguette
        return (
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <g transform="rotate(-30 16 16)">
              {/* Baguette body */}
              <rect x="6" y="11" width="20" height="10" rx="5" fill="#d97706" stroke="#92400e" strokeWidth="1.5" />
              {/* Slits */}
              <line x1="11" y1="12" x2="13" y2="20" stroke="#fef3c7" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="16" y1="12" x2="18" y2="20" stroke="#fef3c7" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="21" y1="12" x2="23" y2="20" stroke="#fef3c7" strokeWidth="1.8" strokeLinecap="round" />
            </g>
          </svg>
        );

      case 'fish': // Whole Raw Atlantic Salmon
        return (
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {/* Fish Body */}
            <path d="M26 16 C22 10, 12 11, 6 16 C12 21, 22 22, 26 16 Z" fill="#38bdf8" stroke="#0369a1" strokeWidth="1.4" />
            {/* Pink Belly */}
            <path d="M8 16 C13 19, 21 19, 24 16 C21 21, 12 21, 8 16 Z" fill="#f472b6" opacity="0.9" />
            {/* Tail Fin */}
            <polygon points="25,16 29,11 28,16 29,21" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
            {/* Dorsal Fin */}
            <polygon points="14,12 18,8 20,12" fill="#0284c7" />
            {/* Eye */}
            <circle cx="10" cy="15" r="1.2" fill="#0f172a" />
            <circle cx="9.8" cy="14.8" r="0.4" fill="#ffffff" />
          </svg>
        );

      case 'livestock': // Dairy Cow
        return (
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {/* Body */}
            <rect x="7" y="11" width="16" height="10" rx="3" fill="#ffffff" stroke="#1e293b" strokeWidth="1.3" />
            {/* Black patches */}
            <path d="M10 11 Q12 15 15 13 Q16 11 15 11 Z" fill="#0f172a" />
            <path d="M18 16 Q20 20 23 18 L23 15 Q21 15 18 16 Z" fill="#0f172a" />
            {/* Head */}
            <rect x="20" y="8" width="7" height="8" rx="2" fill="#ffffff" stroke="#1e293b" strokeWidth="1.2" />
            <ellipse cx="25" cy="14" rx="2" ry="1.5" fill="#f472b6" />
            {/* Horns */}
            <path d="M22 8 L21 6" stroke="#ca8a04" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M25 8 L26 6" stroke="#ca8a04" strokeWidth="1.2" strokeLinecap="round" />
            {/* Legs */}
            <line x1="9" y1="21" x2="9" y2="27" stroke="#1e293b" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="13" y1="21" x2="13" y2="27" stroke="#1e293b" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="17" y1="21" x2="17" y2="27" stroke="#1e293b" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="21" y1="21" x2="21" y2="27" stroke="#1e293b" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        );

      case 'grain': // Burlap Sack of Golden Wheat
        return (
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {/* Sack */}
            <path d="M7 16 C6 25, 8 28, 16 28 C24 28, 26 25, 25 16 C25 12, 23 11, 16 11 C9 11, 7 12, 7 16 Z" fill="#d97706" stroke="#92400e" strokeWidth="1.5" />
            {/* Overflowing Golden Grains */}
            <ellipse cx="16" cy="11" rx="7" ry="4" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
            {/* Grain texture */}
            <circle cx="13" cy="10" r="0.8" fill="#a16207" />
            <circle cx="16" cy="11" r="0.8" fill="#a16207" />
            <circle cx="19" cy="10" r="0.8" fill="#a16207" />
            {/* Sack tie rope */}
            <path d="M10 13 Q16 15 22 13" stroke="#78350f" strokeWidth="1.2" />
          </svg>
        );

      // --- CONSTRUCTION ---
      case 'concrete': // 2-Hole Cinder Block
        return (
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <rect x="5" y="10" width="22" height="14" rx="1.5" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
            {/* 2 Hollow Holes */}
            <rect x="8" y="13" width="6" height="8" rx="1" fill="#334155" stroke="#1e293b" strokeWidth="1" />
            <rect x="18" y="13" width="6" height="8" rx="1" fill="#334155" stroke="#1e293b" strokeWidth="1" />
            {/* Center Divider Ridge */}
            <line x1="16" y1="10" x2="16" y2="24" stroke="#64748b" strokeWidth="1" />
          </svg>
        );

      case 'limestone': // White/Chalky Limestone Boulder
        return (
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <polygon points="15,6 25,10 27,20 20,27 9,25 5,16" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
            <polygon points="15,6 18,16 25,10" fill="#f8fafc" />
            <polygon points="18,16 27,20 20,27" fill="#cbd5e1" />
            <polygon points="15,6 9,15 18,16" fill="#ffffff" />
            <polygon points="9,15 5,16 9,25" fill="#cbd5e1" />
          </svg>
        );

      case 'steel': // Structural Steel I-Beam
        return (
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {/* Top flange */}
            <polygon points="6,9 26,9 23,12 9,12" fill="#64748b" stroke="#334155" strokeWidth="1.2" />
            {/* Vertical web */}
            <rect x="14" y="12" width="4" height="10" fill="#475569" stroke="#334155" strokeWidth="1.2" />
            {/* Bottom flange */}
            <polygon points="9,22 23,22 26,25 6,25" fill="#64748b" stroke="#334155" strokeWidth="1.2" />
            {/* Steel metallic bevel highlights */}
            <line x1="6" y1="9" x2="26" y2="9" stroke="#94a3b8" strokeWidth="1" />
            <line x1="6" y1="25" x2="26" y2="25" stroke="#94a3b8" strokeWidth="1" />
          </svg>
        );

      case 'iron': // Stack of 3 Iron/Metal Ingots
        return (
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {/* Ingot 1 (Bottom Left) */}
            <polygon points="5,24 16,24 18,21 7,21" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
            <polygon points="5,24 7,21 7,18 5,21" fill="#64748b" />
            {/* Ingot 2 (Bottom Right) */}
            <polygon points="14,24 25,24 27,21 16,21" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
            {/* Ingot 3 (Top Center) */}
            <polygon points="10,18 21,18 23,15 12,15" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
            <line x1="12" y1="15" x2="23" y2="15" stroke="#ffffff" strokeWidth="0.8" />
          </svg>
        );

      case 'paper': // Stack of Paper / Blueprint Sheets
        return (
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {/* Bottom sheet */}
            <rect x="6" y="12" width="18" height="15" rx="1" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
            {/* Middle sheet */}
            <rect x="7" y="10" width="18" height="15" rx="1" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
            {/* Top sheet */}
            <rect x="8" y="8" width="18" height="15" rx="1" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
            {/* Text lines */}
            <line x1="11" y1="12" x2="22" y2="12" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
            <line x1="11" y1="15" x2="19" y2="15" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
            <line x1="11" y1="18" x2="21" y2="18" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
          </svg>
        );

      case 'wood': // 3 Stacked Timber Logs
        return (
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {/* Log 1 (Bottom Left) */}
            <rect x="5" y="18" width="16" height="7" rx="3.5" fill="#78350f" stroke="#451a03" strokeWidth="1" />
            <circle cx="21" cy="21.5" r="3.5" fill="#b45309" stroke="#451a03" strokeWidth="1" />
            <circle cx="21" cy="21.5" r="1.8" stroke="#78350f" strokeWidth="0.8" />
            {/* Log 2 (Bottom Right) */}
            <rect x="9" y="18" width="16" height="7" rx="3.5" fill="#78350f" stroke="#451a03" strokeWidth="1" />
            <circle cx="25" cy="21.5" r="3.5" fill="#b45309" stroke="#451a03" strokeWidth="1" />
            <circle cx="25" cy="21.5" r="1.8" stroke="#78350f" strokeWidth="0.8" />
            {/* Log 3 (Top Center) */}
            <rect x="7" y="12" width="16" height="7" rx="3.5" fill="#92400e" stroke="#451a03" strokeWidth="1" />
            <circle cx="23" cy="15.5" r="3.5" fill="#d97706" stroke="#451a03" strokeWidth="1" />
            <circle cx="23" cy="15.5" r="1.8" stroke="#78350f" strokeWidth="0.8" />
          </svg>
        );

      case 'oil': // 55-Gallon Black Oil Drum
        return (
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {/* Drum Barrel Body */}
            <rect x="8" y="7" width="16" height="19" rx="2" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
            {/* Metal Ribs */}
            <line x1="8" y1="13" x2="24" y2="13" stroke="#475569" strokeWidth="1.5" />
            <line x1="8" y1="19" x2="24" y2="19" stroke="#475569" strokeWidth="1.5" />
            {/* Oil drop stencil logo */}
            <path d="M16 14 C17 15.5, 18 16.5, 18 17.5 C18 18.6, 17.1 19.5, 16 19.5 C14.9 19.5, 14 18.6, 14 17.5 C14 16.5, 15 15.5, 16 14 Z" fill="#38bdf8" />
          </svg>
        );

      case 'petroleum': // Dark Crude Oil Droplet
        return (
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M16 5 C18 10, 24 16, 24 20 C24 24.4, 20.4 28, 16 28 C11.6 28, 8 24.4, 8 20 C8 16, 14 10, 16 5 Z" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
            {/* Specular Highlight */}
            <path d="M13 18 C12.5 19, 12.5 21, 13.5 22.5" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
            <circle cx="14" cy="16" r="0.8" fill="#ffffff" />
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="16" cy="16" r="10" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
            <text x="16" y="20" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">?</text>
          </svg>
        );
    }
  };

  return (
    <div
      style={{ 
        width: `${pixelSize}px`, 
        height: `${pixelSize}px`,
        minWidth: `${pixelSize}px`,
        minHeight: `${pixelSize}px`,
        maxWidth: `${pixelSize}px`,
        maxHeight: `${pixelSize}px`
      }}
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden ${
        showBorder ? 'p-0.5 rounded-lg bg-slate-800/40 border border-slate-700/50 shadow-xs' : ''
      } ${className}`}
      title={code}
    >
      {renderSvg()}
    </div>
  );
}
