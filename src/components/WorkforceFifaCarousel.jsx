import React, { useState, useEffect, useCallback, useRef } from 'react';
import EmployeeFifaCard from './EmployeeFifaCard';

/**
 * WorkforceFifaCarousel
 * 
 * Delivers a continuous, smooth 3D cylinder carousel motion:
 * - Persistent card rendering in DOM (zero unmounting/remounting, zero layout jumps).
 * - Exact mathematical 3D centering (translate3d with -50%, -50% so cards are never sunk or offset).
 * - Responsive side offsets so peeking cards stay within stage bounds without clipping.
 * - Hardware-accelerated CSS 3D transforms (600ms cubic-bezier).
 * - Transparent click-shield on side cards to make whole peeking cards one-click navigable.
 * - No arrow buttons on the cards.
 * - Clickable employee name indicators, generously spaced on tablet & desktop.
 * - Mobile view hides text names to conserve vertical screen space.
 */
export default function WorkforceFifaCarousel({
  workers = [],
  company,
  portfolioWorkers = [],
  portfolioCompanies = [],
  onSelectCompany,
  activeWorkerIdx = 0,
  onWorkerChange,
  activeTheme
}) {
  const totalWorkers = workers?.length || 0;
  
  // Safe clamped index
  const safeIdx = Math.min(
    Math.max(0, activeWorkerIdx),
    Math.max(0, totalWorkers - 1)
  );

  const [currentIndex, setCurrentIndex] = useState(safeIdx);
  const [animatingFromIdx, setAnimatingFromIdx] = useState(null);
  const [animatingToIdx, setAnimatingToIdx] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [shineKey, setShineKey] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const animTimerRef = useRef(null);

  // Track window resize for responsive card spacing
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync external index changes
  useEffect(() => {
    if (activeWorkerIdx !== currentIndex && !isTransitioning) {
      setCurrentIndex(safeIdx);
    }
  }, [activeWorkerIdx, safeIdx, isTransitioning]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (animTimerRef.current) {
        clearTimeout(animTimerRef.current);
      }
    };
  }, []);

  // Navigation selector
  const handleSelectWorker = useCallback((targetIdx) => {
    if (targetIdx === currentIndex || targetIdx < 0 || targetIdx >= totalWorkers || isTransitioning) {
      return;
    }

    setIsTransitioning(true);
    setAnimatingFromIdx(currentIndex);
    setAnimatingToIdx(targetIdx);
    setCurrentIndex(targetIdx);

    if (typeof onWorkerChange === 'function') {
      onWorkerChange(targetIdx);
    }

    if (animTimerRef.current) {
      clearTimeout(animTimerRef.current);
    }

    // After 600ms transition finishes, reset transition state and trigger gold shine on center card
    animTimerRef.current = setTimeout(() => {
      setIsTransitioning(false);
      setAnimatingFromIdx(null);
      setAnimatingToIdx(null);
      setShineKey(k => k + 1);
    }, 600);
  }, [currentIndex, totalWorkers, isTransitioning, onWorkerChange]);

  // Keyboard left/right navigation
  const handleKeyDown = useCallback((e) => {
    if (totalWorkers <= 1 || isTransitioning) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIdx = (currentIndex - 1 + totalWorkers) % totalWorkers;
      handleSelectWorker(prevIdx);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIdx = (currentIndex + 1) % totalWorkers;
      handleSelectWorker(nextIdx);
    }
  }, [totalWorkers, isTransitioning, currentIndex, handleSelectWorker]);

  if (totalWorkers === 0) {
    return null;
  }

  // Responsive geometry calculations
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;
  const sideX = isMobile ? 120 : isTablet ? 145 : 160;
  const centerScale = 1.0;
  const sideScale = isMobile ? 0.78 : 0.82;

  /**
   * Computes 3D transform & visual properties for each worker card.
   * - High visibility: center card has brightness(1.05), side cards have brightness(0.96) so they are never muddy or dark!
   * - Strict vertical boundary: cards are centered in the stage with plenty of room above the selector pills.
   */
  const getCardTransform = (index) => {
    // Single card
    if (totalWorkers === 1) {
      return {
        transform: 'translate3d(-50%, -50%, 0) scale(1)',
        zIndex: 30,
        opacity: 1,
        pointerEvents: 'auto'
      };
    }

    // Two cards: Smooth slide between center and peeking side
    if (totalWorkers === 2) {
      const isCenter = index === currentIndex;
      if (isCenter) {
        return {
          transform: 'translate3d(-50%, -50%, 0) scale(1) rotateY(0deg)',
          zIndex: 30,
          opacity: 1,
          pointerEvents: 'auto'
        };
      } else {
        const xOffset = currentIndex === 0 ? sideX : -sideX;
        const rotY = currentIndex === 0 ? 10 : -10;
        return {
          transform: `translate3d(calc(-50% + ${xOffset}px), -50%, -40px) scale(${sideScale}) rotateY(${rotY}deg)`,
          zIndex: 20,
          opacity: 0.94,
          pointerEvents: 'auto'
        };
      }
    }

    // Three or more cards: 3D Cylinder Movement
    let slot = (index - currentIndex) % totalWorkers;
    if (slot < 0) slot += totalWorkers;

    // Slot 0: Front Center Stage (100% native 1:1 scale for crystal-clear razor-sharp rendering)
    if (slot === 0) {
      return {
        transform: 'translate3d(-50%, -50%, 0) scale(1) rotateY(0deg)',
        zIndex: isTransitioning && animatingToIdx === index ? 35 : 30,
        opacity: 1,
        pointerEvents: 'auto'
      };
    }

    // Slot 1: Right peeking card
    if (slot === 1) {
      return {
        transform: `translate3d(calc(-50% + ${sideX}px), -50%, -40px) scale(${sideScale}) rotateY(12deg)`,
        zIndex: isTransitioning && animatingFromIdx === index ? 22 : 18,
        opacity: 0.94,
        pointerEvents: 'auto'
      };
    }

    // Last Slot (e.g. Slot 2 for N=3): Left peeking card
    if (slot === totalWorkers - 1) {
      return {
        transform: `translate3d(calc(-50% - ${sideX}px), -50%, -40px) scale(${sideScale}) rotateY(-12deg)`,
        zIndex: isTransitioning && animatingFromIdx === index ? 22 : 18,
        opacity: 0.94,
        pointerEvents: 'auto'
      };
    }

    // Any extra workers (N > 3): hidden in the deep background
    return {
      transform: 'translate3d(-50%, -50%, -180px) scale(0.60)',
      zIndex: 5,
      opacity: 0,
      pointerEvents: 'none'
    };
  };

  return (
    <div 
      className="relative w-full select-none focus:outline-hidden"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* 3D Perspective Card Stage with calibrated height for complete vertical clearance */}
      <div 
        className="fifa-card-perspective-stage relative w-full h-[425px] sm:h-[445px] flex items-center justify-center isolate overflow-visible my-1"
        style={{ perspective: '1100px', transformStyle: 'preserve-3d' }}
      >
        {/* Render each worker persistently in DOM with smooth cylinder positioning */}
        {workers.map((worker, idx) => {
          const isCenter = idx === currentIndex;
          const cardStyle = getCardTransform(idx);

          return (
            <div
              key={worker.userId || worker.id || idx}
              className={`absolute left-1/2 top-1/2 origin-center transition-all duration-[600ms] ease-[cubic-bezier(0.25,1,0.5,1)] w-[295px] xs:w-[315px] sm:w-[330px] ${isTransitioning ? 'will-change-transform' : ''}`}
              style={cardStyle}
            >
              <div className="relative rounded-2xl overflow-hidden drop-shadow-[0_20px_45px_rgba(0,0,0,0.85)]">
                {/* FIFA Metallic Gold Light Beam Sweep across active center card */}
                {isCenter && shineKey > 0 && (
                  <div key={shineKey} className="animate-fifa-shine" />
                )}

                <EmployeeFifaCard 
                  worker={worker}
                  company={company}
                  portfolioWorkers={portfolioWorkers}
                  portfolioCompanies={portfolioCompanies}
                  onSelectCompany={onSelectCompany}
                />

                {/* Click shield for side cards: one-tap switch into center */}
                {!isCenter && (
                  <div 
                    className="absolute inset-0 z-50 cursor-pointer rounded-2xl bg-transparent hover:bg-white/5 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectWorker(idx);
                    }}
                    title={`Click to view: ${worker.name || worker.username || 'Employee'}`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Roster Quick Selector Indicator Bar (Guaranteed clearance below card stage) */}
      {totalWorkers > 1 && (
        <div className="mt-4 sm:mt-5 pb-1">
          {/* Mobile view: Minimal sleek dot indicators (no names) */}
          <div className="flex sm:hidden items-center justify-center gap-2.5 px-4">
            {workers.map((w, idx) => (
              <button
                key={w.id || w.userId || idx}
                type="button"
                onClick={() => handleSelectWorker(idx)}
                disabled={isTransitioning}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentIndex 
                    ? 'w-7 bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]' 
                    : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
                aria-label={`Select Employee ${idx + 1}`}
              />
            ))}
          </div>

          {/* Tablet & Desktop: Clickable names, well spaced */}
          <div className="hidden sm:flex items-center justify-center gap-4 sm:gap-6 px-4 flex-wrap">
            {workers.map((w, idx) => {
              const isActive = idx === currentIndex;
              const name = w.name || w.username || `Worker #${idx + 1}`;
              const prod = w.breakdown?.production?.total || w.baseProduction || w.production || '';

              return (
                <button
                  key={w.id || w.userId || idx}
                  type="button"
                  onClick={() => handleSelectWorker(idx)}
                  disabled={isTransitioning}
                  className={`flex items-center space-x-2.5 px-4 py-2 rounded-xl text-xs font-mono transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500/30 via-amber-400/20 to-amber-500/30 text-amber-300 border border-amber-400/70 shadow-[0_0_15px_rgba(245,158,11,0.25)] font-bold scale-105'
                      : 'bg-slate-900/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                  }`}
                  title={`Switch to: ${name}`}
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
                  <span className="font-sans font-bold tracking-tight text-slate-100">{name}</span>
                  {prod ? (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${isActive ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                      {prod} PP
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
