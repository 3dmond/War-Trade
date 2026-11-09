import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import EmployeeFifaCard from './EmployeeFifaCard';

/**
 * WorkforceFifaCarousel
 * 
 * Delivers a continuous, smooth 3D cylinder showcase window display:
 * - Scaled window display on mobile so side cards peek clearly within screen bounds.
 * - Hardware-accelerated CSS 3D transforms (600ms cubic-bezier).
 * - Touch swipe / sliding gestures to seamlessly flip between workers.
 * - Front-push popup view on click with close 'X' button.
 * - One-click switch on side peeking cards.
 * - Clickable employee name indicators on desktop, sleek dot pills on mobile.
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
  const [popupWorker, setPopupWorker] = useState(null);
  
  const animTimerRef = useRef(null);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);

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

  // Touch Swipe Handlers for mobile sliding
  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e) => {
    if (!e.changedTouches || !e.changedTouches[0] || totalWorkers <= 1 || isTransitioning) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;

    // Minimum swipe threshold 38px, predominantly horizontal
    if (Math.abs(deltaX) > 38 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      if (deltaX < 0) {
        // Swipe Left -> next worker
        handleSelectWorker((currentIndex + 1) % totalWorkers);
      } else {
        // Swipe Right -> previous worker
        handleSelectWorker((currentIndex - 1 + totalWorkers) % totalWorkers);
      }
    }
  };

  if (totalWorkers === 0) {
    return null;
  }

  // Responsive geometry calculations:
  // On mobile (<640px), pushed further back in the screen like a window display so adjacent cards peek clearly!
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;
  const sideX = isMobile ? 88 : isTablet ? 145 : 160;
  const centerScale = isMobile ? 0.82 : 1.0;
  const sideScale = isMobile ? 0.65 : 0.82;

  /**
   * Computes 3D transform & visual properties for each worker card.
   */
  const getCardTransform = (index) => {
    // Single card
    if (totalWorkers === 1) {
      return {
        transform: `translate3d(-50%, -50%, 0) scale(${centerScale})`,
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
          transform: `translate3d(-50%, -50%, 0) scale(${centerScale}) rotateY(0deg)`,
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

    // Slot 0: Front Center Stage
    if (slot === 0) {
      return {
        transform: `translate3d(-50%, -50%, 0) scale(${centerScale}) rotateY(0deg)`,
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

    // Last Slot: Left peeking card
    if (slot === totalWorkers - 1) {
      return {
        transform: `translate3d(calc(-50% - ${sideX}px), -50%, -40px) scale(${sideScale}) rotateY(-12deg)`,
        zIndex: isTransitioning && animatingFromIdx === index ? 22 : 18,
        opacity: 0.94,
        pointerEvents: 'auto'
      };
    }

    // Any extra workers: hidden in the deep background
    return {
      transform: 'translate3d(-50%, -50%, -180px) scale(0.55)',
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
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D Perspective Card Stage (Window Display) */}
      <div 
        className="fifa-card-perspective-stage relative w-full h-[375px] xs:h-[395px] sm:h-[445px] flex items-center justify-center isolate overflow-visible my-1"
        style={{ perspective: '1100px', transformStyle: 'preserve-3d' }}
      >
        {/* Render each worker persistently in DOM with smooth cylinder positioning */}
        {workers.map((worker, idx) => {
          const isCenter = idx === currentIndex;
          const cardStyle = getCardTransform(idx);

          return (
            <div
              key={worker.userId || worker.id || idx}
              className={`absolute left-1/2 top-1/2 origin-center transition-all duration-[600ms] ease-[cubic-bezier(0.25,1,0.5,1)] w-[280px] xs:w-[305px] sm:w-[330px] ${isTransitioning ? 'will-change-transform' : ''}`}
              style={cardStyle}
            >
              <div 
                className={`relative rounded-2xl overflow-hidden drop-shadow-[0_20px_45px_rgba(0,0,0,0.85)] ${isCenter ? 'cursor-pointer hover:brightness-105 active:scale-[0.99] transition-transform' : ''}`}
                onClick={() => {
                  if (isCenter) {
                    setPopupWorker(worker);
                  }
                }}
              >
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

                {/* Center card click hint (mobile & desktop) */}
                {isCenter && (
                  <div className="absolute top-2 right-2 z-40 bg-black/60 backdrop-blur-xs text-amber-300 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border border-amber-400/30 flex items-center gap-1 shadow-sm">
                    <Eye className="w-2.5 h-2.5" />
                    <span>Inspect</span>
                  </div>
                )}

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

      {/* Roster Quick Selector Indicator Bar */}
      {totalWorkers > 1 && (
        <div className="mt-3 sm:mt-5 pb-1">
          {/* Mobile view: Minimal sleek dot indicators with swipe hint */}
          <div className="flex sm:hidden flex-col items-center justify-center gap-1.5 px-4">
            <div className="flex items-center justify-center gap-2.5">
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
            <span className="text-[10px] font-mono text-slate-400">
              Swipe left/right to slide • Tap card to inspect
            </span>
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

      {/* FRONT PUSH MODAL POPUP VIEW (ON CLICK CENTER CARD) */}
      {popupWorker && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setPopupWorker(null)}
        >
          <div 
            className="relative max-w-[370px] w-full my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close 'X' Button */}
            <button
              type="button"
              onClick={() => setPopupWorker(null)}
              className="absolute -top-3.5 -right-3.5 z-50 w-9 h-9 rounded-full bg-slate-900 border-2 border-amber-400 text-white shadow-2xl flex items-center justify-center cursor-pointer hover:bg-slate-800 active:scale-90 transition"
              title="Close worker view"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-amber-300" />
            </button>

            {/* Front 1:1 Full-scale FIFA Card */}
            <EmployeeFifaCard
              worker={popupWorker}
              company={company}
              portfolioWorkers={portfolioWorkers}
              portfolioCompanies={portfolioCompanies}
              onSelectCompany={(compId) => {
                setPopupWorker(null);
                onSelectCompany?.(compId);
              }}
            />

            {/* Navigator inside popup when multiple workers */}
            {totalWorkers > 1 && (
              <div className="flex items-center justify-between pt-3 px-1 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => {
                    const prevIdx = (currentIndex - 1 + totalWorkers) % totalWorkers;
                    handleSelectWorker(prevIdx);
                    setPopupWorker(workers[prevIdx]);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-300 font-bold hover:bg-slate-800 active:scale-95 transition cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <span className="text-slate-300 font-bold">
                  {currentIndex + 1} / {totalWorkers}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = (currentIndex + 1) % totalWorkers;
                    handleSelectWorker(nextIdx);
                    setPopupWorker(workers[nextIdx]);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-300 font-bold hover:bg-slate-800 active:scale-95 transition cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
