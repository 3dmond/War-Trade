import React from 'react';
import { X, RotateCcw, Check, Palette } from 'lucide-react';

export default function ChartSettingsModal({ 
  isOpen, 
  onClose, 
  settings, 
  onUpdateSettings, 
  onResetDefaults, 
  isDark 
}) {
  if (!isOpen) return null;

  const bgPresets = [
    { label: 'TV Dark', color: '#131722' },
    { label: 'Slate Navy', color: '#1e222d' },
    { label: 'OLED Black', color: '#0b0e14' },
    { label: 'Pure White', color: '#ffffff' },
    { label: 'Soft Slate', color: '#f8fafc' },
  ];

  const bullPresets = [
    { label: 'Emerald', color: '#26a69a' },
    { label: 'Green', color: '#16a34a' },
    { label: 'Neon', color: '#22c55e' },
    { label: 'Sky Blue', color: '#38bdf8' },
  ];

  const bearPresets = [
    { label: 'Coral Red', color: '#ef5350' },
    { label: 'Crimson', color: '#dc2626' },
    { label: 'Rose', color: '#f43f5e' },
    { label: 'Amber Orange', color: '#ea580c' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className={`w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden ${
        isDark ? 'bg-[#1e222d] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Modal Header */}
        <div className={`px-5 py-4 flex items-center justify-between border-b ${
          isDark ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">Chart Properties</h3>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Customize appearance, candles, and canvas colors
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-1 rounded-lg transition ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          
          {/* 1. Background Color */}
          <div className="space-y-2">
            <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Canvas Background
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={settings.bg}
                onChange={(e) => onUpdateSettings({ bg: e.target.value })}
                className="w-9 h-9 rounded-lg border border-slate-500/30 cursor-pointer shrink-0 p-0.5 bg-transparent"
              />
              <span className="font-mono text-xs text-slate-400 uppercase w-20">{settings.bg}</span>
              <div className="flex items-center space-x-1.5 flex-1 justify-end">
                {bgPresets.map((p) => (
                  <button
                    key={p.color}
                    onClick={() => onUpdateSettings({ bg: p.color })}
                    className={`w-6 h-6 rounded-md border flex items-center justify-center transition ${
                      settings.bg.toLowerCase() === p.color.toLowerCase() ? 'ring-2 ring-amber-500 scale-110' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: p.color, borderColor: isDark ? '#475569' : '#cbd5e1' }}
                    title={p.label}
                  >
                    {settings.bg.toLowerCase() === p.color.toLowerCase() && (
                      <Check className={`w-3 h-3 ${p.color === '#ffffff' || p.color === '#f8fafc' ? 'text-slate-900' : 'text-white'}`} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Bullish Candle (Up) */}
          <div className="space-y-2">
            <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Bullish Candle (Up)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={settings.upColor}
                onChange={(e) => onUpdateSettings({ upColor: e.target.value })}
                className="w-9 h-9 rounded-lg border border-slate-500/30 cursor-pointer shrink-0 p-0.5 bg-transparent"
              />
              <span className="font-mono text-xs text-slate-400 uppercase w-20">{settings.upColor}</span>
              <div className="flex items-center space-x-1.5 flex-1 justify-end">
                {bullPresets.map((p) => (
                  <button
                    key={p.color}
                    onClick={() => onUpdateSettings({ upColor: p.color })}
                    className={`w-6 h-6 rounded-md border border-black/20 flex items-center justify-center transition ${
                      settings.upColor.toLowerCase() === p.color.toLowerCase() ? 'ring-2 ring-amber-500 scale-110' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: p.color }}
                    title={p.label}
                  >
                    {settings.upColor.toLowerCase() === p.color.toLowerCase() && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Bearish Candle (Down) */}
          <div className="space-y-2">
            <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Bearish Candle (Down)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={settings.downColor}
                onChange={(e) => onUpdateSettings({ downColor: e.target.value })}
                className="w-9 h-9 rounded-lg border border-slate-500/30 cursor-pointer shrink-0 p-0.5 bg-transparent"
              />
              <span className="font-mono text-xs text-slate-400 uppercase w-20">{settings.downColor}</span>
              <div className="flex items-center space-x-1.5 flex-1 justify-end">
                {bearPresets.map((p) => (
                  <button
                    key={p.color}
                    onClick={() => onUpdateSettings({ downColor: p.color })}
                    className={`w-6 h-6 rounded-md border border-black/20 flex items-center justify-center transition ${
                      settings.downColor.toLowerCase() === p.color.toLowerCase() ? 'ring-2 ring-amber-500 scale-110' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: p.color }}
                    title={p.label}
                  >
                    {settings.downColor.toLowerCase() === p.color.toLowerCase() && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Grid Lines Toggle & Color */}
          <div className="space-y-2 pt-2 border-t border-slate-700/30">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Grid Lines
              </label>
              <button
                onClick={() => onUpdateSettings({ showGrid: !settings.showGrid })}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  settings.showGrid ? 'bg-amber-500' : isDark ? 'bg-slate-700' : 'bg-slate-300'
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  settings.showGrid ? 'translate-x-4' : 'translate-x-1'
                }`} />
              </button>
            </div>
            {settings.showGrid && (
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="color"
                  value={settings.gridColor}
                  onChange={(e) => onUpdateSettings({ gridColor: e.target.value })}
                  className="w-7 h-7 rounded border border-slate-500/30 cursor-pointer p-0.5 bg-transparent"
                />
                <span className="font-mono text-xs text-slate-400 uppercase">{settings.gridColor}</span>
              </div>
            )}
          </div>

          {/* 5. Market Bid Line (Customizable) */}
          <div className="space-y-2 pt-2 border-t border-slate-700/30">
            <div className="flex items-center justify-between">
              <div>
                <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Bid Price Line
                </label>
                <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Horizontal line for best market buy order
                </span>
              </div>
              <button
                onClick={() => onUpdateSettings({ showBidLine: settings.showBidLine === false ? true : false })}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  settings.showBidLine !== false ? 'bg-emerald-500' : isDark ? 'bg-slate-700' : 'bg-slate-300'
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  settings.showBidLine !== false ? 'translate-x-4' : 'translate-x-1'
                }`} />
              </button>
            </div>
            {settings.showBidLine !== false && (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={settings.bidLineColor || '#16a34a'}
                    onChange={(e) => onUpdateSettings({ bidLineColor: e.target.value })}
                    className="w-7 h-7 rounded border border-slate-500/30 cursor-pointer p-0.5 bg-transparent"
                  />
                  <span className="font-mono text-xs text-slate-400 uppercase">{settings.bidLineColor || '#16a34a'}</span>
                </div>
                <select
                  value={settings.bidLineStyle || 'dashed'}
                  onChange={(e) => onUpdateSettings({ bidLineStyle: e.target.value })}
                  className={`text-xs font-mono rounded px-2 py-1 border ${
                    isDark ? 'bg-[#131722] border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="dashed">Dashed Line</option>
                  <option value="solid">Solid Line</option>
                  <option value="dotted">Dotted Line</option>
                </select>
              </div>
            )}
          </div>

          {/* 6. Market Ask Line (Customizable) */}
          <div className="space-y-2 pt-2 border-t border-slate-700/30">
            <div className="flex items-center justify-between">
              <div>
                <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Ask Price Line
                </label>
                <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Horizontal line for best market sell order
                </span>
              </div>
              <button
                onClick={() => onUpdateSettings({ showAskLine: settings.showAskLine === false ? true : false })}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  settings.showAskLine !== false ? 'bg-rose-500' : isDark ? 'bg-slate-700' : 'bg-slate-300'
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  settings.showAskLine !== false ? 'translate-x-4' : 'translate-x-1'
                }`} />
              </button>
            </div>
            {settings.showAskLine !== false && (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={settings.askLineColor || '#dc2626'}
                    onChange={(e) => onUpdateSettings({ askLineColor: e.target.value })}
                    className="w-7 h-7 rounded border border-slate-500/30 cursor-pointer p-0.5 bg-transparent"
                  />
                  <span className="font-mono text-xs text-slate-400 uppercase">{settings.askLineColor || '#dc2626'}</span>
                </div>
                <select
                  value={settings.askLineStyle || 'dashed'}
                  onChange={(e) => onUpdateSettings({ askLineStyle: e.target.value })}
                  className={`text-xs font-mono rounded px-2 py-1 border ${
                    isDark ? 'bg-[#131722] border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="dashed">Dashed Line</option>
                  <option value="solid">Solid Line</option>
                  <option value="dotted">Dotted Line</option>
                </select>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className={`px-5 py-3.5 flex items-center justify-between border-t ${
          isDark ? 'bg-[#171a24] border-slate-800' : 'bg-slate-50 border-slate-100'
        }`}>
          <button
            onClick={onResetDefaults}
            className={`flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
