import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Trash2, 
  Copy, 
  Palette, 
  Minus, 
  Check, 
  Sliders, 
  X,
  Maximize2
} from 'lucide-react';

export default function ChartDrawingsOverlay({
  chart,
  mainSeries,
  activeTool,
  setActiveTool,
  isDark = true,
  containerRef
}) {
  const [drawings, setDrawings] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  
  // Drag / Create state
  const [drawingState, setDrawingState] = useState(null); 
  // { mode: 'creating' | 'moving' | 'resizing', id, handleIndex, startX, startY, origPoints }

  const [, setTick] = useState(0);
  const forceUpdate = useCallback(() => setTick(t => t + 1), []);

  // Preset Colors for Drawing Tools
  const colorPresets = [
    '#38bdf8', // Sky Blue
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#f43f5e', // Rose
    '#a855f7', // Purple
    '#ffffff', // White
  ];

  // Helper: Convert (time, price) to pixel (x, y)
  const toPixels = useCallback((point) => {
    if (!chart || !mainSeries || !point) return { x: 0, y: 0 };
    try {
      const timeScale = chart.timeScale();
      const x = timeScale.timeToCoordinate(point.time);
      const y = mainSeries.priceToCoordinate(point.price);
      return { 
        x: x !== null ? x : -9999, 
        y: y !== null ? y : -9999 
      };
    } catch (e) {
      return { x: -9999, y: -9999 };
    }
  }, [chart, mainSeries]);

  // Helper: Convert pixel (x, y) to (time, price)
  const toChartCoords = useCallback((pixelX, pixelY) => {
    if (!chart || !mainSeries) return { time: Math.floor(Date.now() / 1000), price: 0 };
    try {
      const timeScale = chart.timeScale();
      const time = timeScale.coordinateToTime(pixelX);
      const price = mainSeries.coordinateToPrice(pixelY);
      return { 
        time: time !== null ? time : Math.floor(Date.now() / 1000), 
        price: price !== null ? price : 0 
      };
    } catch (e) {
      return { time: Math.floor(Date.now() / 1000), price: 0 };
    }
  }, [chart, mainSeries]);

  // Subscribe to chart zoom / pan to recompute SVG coordinates
  useEffect(() => {
    if (!chart) return;
    const timeScale = chart.timeScale();
    const handleRangeChange = () => {
      forceUpdate();
    };
    timeScale.subscribeVisibleLogicalRangeChange(handleRangeChange);
    return () => {
      timeScale.unsubscribeVisibleLogicalRangeChange(handleRangeChange);
    };
  }, [chart, forceUpdate]);

  // Keyboard shortcuts: Ctrl+D to duplicate, Delete/Backspace to delete, Esc to cancel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        setDrawings(prev => prev.filter(d => d.id !== selectedId));
        setSelectedId(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedId) {
        e.preventDefault();
        setDrawings(prev => {
          const item = prev.find(d => d.id === selectedId);
          if (!item) return prev;
          const cloned = {
            ...item,
            id: `draw-${Date.now()}`,
            points: item.points.map(p => ({
              time: p.time,
              price: p.price * 1.015 // slightly offset
            }))
          };
          setSelectedId(cloned.id);
          return [...prev, cloned];
        });
      }
      if (e.key === 'Escape') {
        setActiveTool('cursor');
        setSelectedId(null);
        setDrawingState(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, setActiveTool]);

  // Subscribe to chart clicks on empty space to deselect
  useEffect(() => {
    if (!chart) return;
    const handleClick = () => {
      setSelectedId(null);
    };
    chart.subscribeClick(handleClick);
    return () => {
      try {
        chart.unsubscribeClick(handleClick);
      } catch (e) {}
    };
  }, [chart]);

  // Window event listeners while creating, resizing, or moving drawings
  useEffect(() => {
    if (!drawingState) return;

    const handleWindowMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const coords = toChartCoords(x, y);

      setDrawings(prev => prev.map(d => {
        if (d.id !== drawingState.id) return d;

        if (drawingState.mode === 'creating') {
          const nextPoints = [...d.points];
          nextPoints[drawingState.handleIndex] = coords;
          if (d.type === 'channel' && nextPoints.length === 3) {
            nextPoints[2] = { time: coords.time, price: coords.price * 1.02 };
          }
          return { ...d, points: nextPoints };
        }

        if (drawingState.mode === 'resizing') {
          const nextPoints = [...d.points];
          nextPoints[drawingState.handleIndex] = coords;
          return { ...d, points: nextPoints };
        }

        if (drawingState.mode === 'moving') {
          const deltaX = x - drawingState.startX;
          const deltaY = y - drawingState.startY;

          const nextPoints = drawingState.origPoints.map(p => {
            const ptPixels = toPixels(p);
            const newPt = toChartCoords(ptPixels.x + deltaX, ptPixels.y + deltaY);
            return newPt;
          });

          return { ...d, points: nextPoints };
        }

        return d;
      }));
    };

    const handleWindowMouseUp = () => {
      if (drawingState.mode === 'creating') {
        setActiveTool('cursor');
      }
      setDrawingState(null);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [drawingState, toChartCoords, toPixels, setActiveTool]);

  // Mouse Handlers for Drawing
  const handleSvgMouseDown = (e) => {
    if (!containerRef.current || !chart || !mainSeries) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const coords = toChartCoords(x, y);

    // If an active drawing tool is selected (not cursor)
    if (activeTool && activeTool !== 'cursor') {
      const newId = `draw-${Date.now()}`;
      let initialPoints = [coords, coords];
      if (activeTool === 'channel') {
        initialPoints = [coords, coords, { time: coords.time, price: coords.price * 1.02 }];
      }

      const newDrawing = {
        id: newId,
        type: activeTool,
        points: initialPoints,
        color: '#38bdf8',
        strokeWidth: 2,
        strokeDash: 'solid',
        fillOpacity: 0.15
      };

      setDrawings(prev => [...prev, newDrawing]);
      setSelectedId(newId);
      setDrawingState({
        mode: 'creating',
        id: newId,
        handleIndex: 1,
        startX: x,
        startY: y
      });
      return;
    }
  };

  // Start Resizing a Handle
  const startResize = (e, drawingId, handleIndex) => {
    e.stopPropagation();
    setSelectedId(drawingId);
    setDrawingState({
      mode: 'resizing',
      id: drawingId,
      handleIndex
    });
  };

  // Start Moving the Whole Drawing
  const startMove = (e, drawing) => {
    e.stopPropagation();
    setSelectedId(drawing.id);
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDrawingState({
      mode: 'moving',
      id: drawing.id,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      origPoints: [...drawing.points]
    });
  };

  // Action Bar Handlers
  const selectedDrawing = drawings.find(d => d.id === selectedId);

  const updateSelected = (updates) => {
    setDrawings(prev => prev.map(d => d.id === selectedId ? { ...d, ...updates } : d));
  };

  const duplicateSelected = () => {
    if (!selectedDrawing) return;
    const cloned = {
      ...selectedDrawing,
      id: `draw-${Date.now()}`,
      points: selectedDrawing.points.map(p => ({
        time: p.time,
        price: p.price * 1.015
      }))
    };
    setDrawings(prev => [...prev, cloned]);
    setSelectedId(cloned.id);
  };

  const deleteSelected = () => {
    setDrawings(prev => prev.filter(d => d.id !== selectedId));
    setSelectedId(null);
  };

  // Position for floating mini toolbar above the selected drawing
  const getSelectedToolbarPos = () => {
    if (!selectedDrawing) return { x: 50, y: 50 };
    const p1 = toPixels(selectedDrawing.points[0]);
    const p2 = toPixels(selectedDrawing.points[1] || selectedDrawing.points[0]);
    const minX = Math.min(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    return {
      x: Math.max(10, Math.min(minX, 600)),
      y: Math.max(10, minY - 45)
    };
  };

  return (
    <div 
      className="absolute inset-0 pointer-events-none select-none overflow-hidden"
      style={{ zIndex: 10 }}
    >
      <svg
        className={`w-full h-full ${
          activeTool !== 'cursor' ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'
        }`}
        onMouseDown={handleSvgMouseDown}
      >
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#38bdf8" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Render each drawing */}
        {drawings.map(d => {
          const isSel = d.id === selectedId;
          const p1 = toPixels(d.points[0]);
          const p2 = toPixels(d.points[1]);
          const p3 = d.points[2] ? toPixels(d.points[2]) : null;

          return (
            <g key={d.id} className="cursor-pointer pointer-events-auto">
              
              {/* 1. TREND LINE */}
              {d.type === 'trendline' && (
                <g>
                  {/* Invisible wide hit test area for easy clicking */}
                  <line
                    x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                    stroke="transparent"
                    strokeWidth="14"
                    onMouseDown={(e) => startMove(e, d)}
                  />
                  {/* Visual Line */}
                  <line
                    x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                    stroke={d.color}
                    strokeWidth={d.strokeWidth}
                    strokeDasharray={d.strokeDash === 'dashed' ? '5 5' : 'none'}
                    onMouseDown={(e) => startMove(e, d)}
                  />
                </g>
              )}

              {/* 2. PARALLEL CHANNEL */}
              {d.type === 'channel' && p3 && (
                <g>
                  {(() => {
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const cOffset = p3.y - p1.y;
                    const p1Top = { x: p1.x, y: p1.y + cOffset };
                    const p2Top = { x: p2.x, y: p2.y + cOffset };
                    const p1Mid = { x: p1.x, y: p1.y + cOffset / 2 };
                    const p2Mid = { x: p2.x, y: p2.y + cOffset / 2 };

                    return (
                      <>
                        {/* Shaded channel area */}
                        <polygon
                          points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p2Top.x},${p2Top.y} ${p1Top.x},${p1Top.y}`}
                          fill={d.color}
                          fillOpacity={d.fillOpacity || 0.12}
                          onMouseDown={(e) => startMove(e, d)}
                        />
                        {/* Base line */}
                        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={d.color} strokeWidth={d.strokeWidth} />
                        {/* Top line */}
                        <line x1={p1Top.x} y1={p1Top.y} x2={p2Top.x} y2={p2Top.y} stroke={d.color} strokeWidth={d.strokeWidth} />
                        {/* Midline (dashed) */}
                        <line x1={p1Mid.x} y1={p1Mid.y} x2={p2Mid.x} y2={p2Mid.y} stroke={d.color} strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
                      </>
                    );
                  })()}
                </g>
              )}

              {/* 3. FIBONACCI RETRACEMENT */}
              {d.type === 'fibRetracement' && (
                <g onMouseDown={(e) => startMove(e, d)}>
                  {(() => {
                    const levels = [
                      { ratio: 0.0, label: '0.0% (High)', color: '#787b86' },
                      { ratio: 0.236, label: '23.6%', color: '#f43f5e' },
                      { ratio: 0.382, label: '38.2%', color: '#f59e0b' },
                      { ratio: 0.500, label: '50.0%', color: '#10b981' },
                      { ratio: 0.618, label: '61.8% (Golden)', color: '#38bdf8' },
                      { ratio: 0.786, label: '78.6%', color: '#8b5cf6' },
                      { ratio: 1.000, label: '100.0% (Low)', color: '#787b86' },
                    ];

                    const minX = Math.min(p1.x, p2.x);
                    const maxX = Math.max(p1.x, p2.x);
                    const width = Math.max(80, maxX - minX);

                    return levels.map((lvl, idx) => {
                      const y = p1.y + (p2.y - p1.y) * lvl.ratio;
                      const nextLvl = levels[idx + 1];
                      const nextY = nextLvl ? p1.y + (p2.y - p1.y) * nextLvl.ratio : null;

                      return (
                        <g key={lvl.ratio}>
                          {/* Shaded band between levels */}
                          {nextY !== null && (
                            <rect
                              x={minX}
                              y={Math.min(y, nextY)}
                              width={width}
                              height={Math.abs(nextY - y)}
                              fill={lvl.color}
                              fillOpacity={0.08}
                            />
                          )}
                          {/* Level Line */}
                          <line
                            x1={minX} y1={y} x2={maxX} y2={y}
                            stroke={lvl.color}
                            strokeWidth="1"
                            strokeDasharray={lvl.ratio === 0.618 ? 'none' : '3 3'}
                          />
                          {/* Level Label */}
                          <text
                            x={maxX + 6}
                            y={y + 3}
                            fill={lvl.color}
                            fontSize="10"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {lvl.label}
                          </text>
                        </g>
                      );
                    });
                  })()}
                </g>
              )}

              {/* 4. FIBONACCI EXTENSION / REVERSAL */}
              {d.type === 'fibExtension' && (
                <g onMouseDown={(e) => startMove(e, d)}>
                  {(() => {
                    const extLevels = [
                      { ratio: 1.000, label: '1.000 (Base)', color: '#787b86' },
                      { ratio: 1.272, label: '1.272 (Target 1)', color: '#38bdf8' },
                      { ratio: 1.414, label: '1.414', color: '#10b981' },
                      { ratio: 1.618, label: '1.618 (Golden Ext)', color: '#f59e0b' },
                      { ratio: 2.000, label: '2.000 (Double)', color: '#a855f7' },
                      { ratio: 2.618, label: '2.618 (Super Ext)', color: '#f43f5e' },
                    ];
                    const minX = Math.min(p1.x, p2.x);
                    const maxX = Math.max(p1.x, p2.x);

                    return extLevels.map(lvl => {
                      const y = p1.y - (p1.y - p2.y) * (lvl.ratio - 1);
                      return (
                        <g key={lvl.ratio}>
                          <line
                            x1={minX} y1={y} x2={maxX} y2={y}
                            stroke={lvl.color}
                            strokeWidth="1.2"
                            strokeDasharray="4 2"
                          />
                          <text
                            x={maxX + 6} y={y + 3}
                            fill={lvl.color}
                            fontSize="10"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {lvl.label}
                          </text>
                        </g>
                      );
                    });
                  })()}
                </g>
              )}

              {/* 5. RECTANGLE (Support / Resistance Box) */}
              {d.type === 'rectangle' && (
                <g onMouseDown={(e) => startMove(e, d)}>
                  <rect
                    x={Math.min(p1.x, p2.x)}
                    y={Math.min(p1.y, p2.y)}
                    width={Math.abs(p2.x - p1.x)}
                    height={Math.abs(p2.y - p1.y)}
                    fill={d.color}
                    fillOpacity={d.fillOpacity || 0.15}
                    stroke={d.color}
                    strokeWidth={d.strokeWidth}
                    strokeDasharray={d.strokeDash === 'dashed' ? '4 4' : 'none'}
                    rx="3"
                  />
                </g>
              )}

              {/* 6. CIRCLE */}
              {d.type === 'circle' && (
                <g onMouseDown={(e) => startMove(e, d)}>
                  {(() => {
                    const radius = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                    return (
                      <circle
                        cx={p1.x}
                        cy={p1.y}
                        r={Math.max(4, radius)}
                        fill={d.color}
                        fillOpacity={d.fillOpacity || 0.15}
                        stroke={d.color}
                        strokeWidth={d.strokeWidth}
                      />
                    );
                  })()}
                </g>
              )}

              {/* 7. RULER (MEASURE TOOL) */}
              {d.type === 'ruler' && (
                <g onMouseDown={(e) => startMove(e, d)}>
                  {(() => {
                    const price1 = d.points[0].price;
                    const price2 = d.points[1].price;
                    const deltaPrice = price2 - price1;
                    const deltaPct = price1 > 0 ? (deltaPrice / price1) * 100 : 0;
                    const isPos = deltaPrice >= 0;
                    const minX = Math.min(p1.x, p2.x);
                    const minY = Math.min(p1.y, p2.y);
                    const width = Math.abs(p2.x - p1.x);
                    const height = Math.abs(p2.y - p1.y);

                    return (
                      <>
                        <rect
                          x={minX} y={minY} width={width} height={height}
                          fill={isPos ? '#10b981' : '#f43f5e'}
                          fillOpacity="0.12"
                          stroke={isPos ? '#10b981' : '#f43f5e'}
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />
                        {/* Ruler Readout Pill */}
                        <g transform={`translate(${(p1.x + p2.x) / 2 - 60}, ${(p1.y + p2.y) / 2 - 14})`}>
                          <rect
                            width="120"
                            height="28"
                            rx="6"
                            fill={isDark ? '#1e222d' : '#ffffff'}
                            stroke={isPos ? '#10b981' : '#f43f5e'}
                            strokeWidth="1.5"
                          />
                          <text
                            x="60" y="18"
                            fill={isPos ? '#10b981' : '#f43f5e'}
                            fontSize="11"
                            fontFamily="monospace"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            {isPos ? '+' : ''}{deltaPrice.toFixed(4)} ({deltaPct.toFixed(2)}%)
                          </text>
                        </g>
                      </>
                    );
                  })()}
                </g>
              )}

              {/* SELECTION HANDLES & ANCHOR POINTS */}
              {isSel && (
                <g>
                  {d.points.map((pt, idx) => {
                    const ptPix = toPixels(pt);
                    return (
                      <circle
                        key={idx}
                        cx={ptPix.x}
                        cy={ptPix.y}
                        r="5"
                        fill="#ffffff"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                        className="cursor-move pointer-events-auto"
                        onMouseDown={(e) => startResize(e, d.id, idx)}
                      />
                    );
                  })}
                </g>
              )}

            </g>
          );
        })}
      </svg>

      {/* FLOATING ACTION TOOLBAR WHEN A DRAWING IS SELECTED (TradingView Style) */}
      {selectedDrawing && (
        <div
          className="absolute z-50 pointer-events-auto flex items-center space-x-2 px-3 py-1.5 rounded-xl shadow-xl text-xs font-mono border"
          style={{
            left: `${getSelectedToolbarPos().x}px`,
            top: `${getSelectedToolbarPos().y}px`,
            backgroundColor: isDark ? '#1e222d' : '#ffffff',
            borderColor: isDark ? '#2a2e39' : '#e2e8f0',
            color: isDark ? '#d1d4dc' : '#1e293b'
          }}
        >
          {/* Color palette */}
          <div className="flex items-center space-x-1 pr-2 border-r border-slate-700/30">
            {colorPresets.map(c => (
              <button
                key={c}
                onClick={() => updateSelected({ color: c })}
                className="w-4 h-4 rounded-full transition transform hover:scale-115 flex items-center justify-center"
                style={{ backgroundColor: c }}
              >
                {selectedDrawing.color === c && (
                  <Check className="w-2.5 h-2.5 text-black" />
                )}
              </button>
            ))}
          </div>

          {/* Stroke Width Toggle */}
          <button
            onClick={() => updateSelected({ strokeWidth: selectedDrawing.strokeWidth === 3 ? 1 : selectedDrawing.strokeWidth + 1 })}
            className="px-2 py-0.5 rounded hover:bg-slate-700/20 text-xs font-bold"
            title="Stroke Width"
          >
            {selectedDrawing.strokeWidth}px
          </button>

          {/* Solid / Dashed Toggle */}
          <button
            onClick={() => updateSelected({ strokeDash: selectedDrawing.strokeDash === 'solid' ? 'dashed' : 'solid' })}
            className="px-2 py-0.5 rounded hover:bg-slate-700/20 text-xs"
            title="Line Style"
          >
            {selectedDrawing.strokeDash === 'solid' ? 'Solid' : 'Dashed'}
          </button>

          {/* Duplicate Button (Ctrl+D) */}
          <button
            onClick={duplicateSelected}
            className="p-1 hover:bg-slate-700/20 rounded transition text-slate-400 hover:text-white"
            title="Duplicate (Ctrl+D)"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button */}
          <button
            onClick={deleteSelected}
            className="p-1 hover:bg-rose-500/20 rounded transition text-rose-500 hover:text-rose-400"
            title="Delete (Del / Backspace)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}
