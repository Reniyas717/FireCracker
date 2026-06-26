/**
 * SettingsPanel — Structured centered modal for app configuration.
 */

import { useStore } from '../store/useStore.js';
import { THEME_LIST } from '../engine/ThemeConfigs.js';
import { X, Volume2, Wind, Activity, Zap, Check } from 'lucide-react';

export default function SettingsPanel() {
  const settingsOpen = useStore((s) => s.settingsOpen);
  const toggleSettings = useStore((s) => s.toggleSettings);
  const quality = useStore((s) => s.quality);
  const setQuality = useStore((s) => s.setQuality);
  const masterVolume = useStore((s) => s.masterVolume);
  const setMasterVolume = useStore((s) => s.setMasterVolume);
  const wind = useStore((s) => s.wind);
  const setWind = useStore((s) => s.setWind);
  const reduceMotion = useStore((s) => s.reduceMotion);
  const setReduceMotion = useStore((s) => s.setReduceMotion);
  const showDebug = useStore((s) => s.showDebug);
  const toggleDebug = useStore((s) => s.toggleDebug);
  const currentTheme = useStore((s) => s.currentTheme);
  const setTheme = useStore((s) => s.setTheme);
  const customBackgroundImage = useStore((s) => s.customBackgroundImage);
  const setCustomBackgroundImage = useStore((s) => s.setCustomBackgroundImage);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCustomBackgroundImage(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!settingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={toggleSettings}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-black/80 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/30">
              <Zap size={18} className="text-amber-400" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-wide">Environment Settings</h2>
          </div>
          <button 
            onClick={toggleSettings} 
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="px-6 py-6 overflow-y-auto scrollbar-hide">
          
          {/* Theme Selector */}
          <div className="mb-8">
            <label className="text-[11px] text-white/50 uppercase tracking-widest font-bold flex items-center gap-2 mb-3">
              Sky Theme
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Custom Upload Button */}
              <label className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 text-center overflow-hidden group cursor-pointer
                ${customBackgroundImage
                  ? 'border-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.2)] bg-amber-500/10'
                  : 'border-dashed border-white/20 hover:border-white/40 hover:bg-white/5'
                }
              `}>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                {customBackgroundImage ? (
                  <div className="absolute inset-0 opacity-40 bg-cover bg-center" style={{ backgroundImage: `url(${customBackgroundImage})` }} />
                ) : null}
                <div className="relative z-10 flex flex-col items-center justify-center gap-1">
                  <span className={`text-xs font-bold ${customBackgroundImage ? 'text-amber-300' : 'text-white/60'}`}>
                    Upload Image
                  </span>
                  <span className="text-[10px] text-white/40 leading-tight">Custom BG</span>
                </div>
              </label>

              {/* Default Themes */}
              {THEME_LIST.map((theme) => {
                const isActive = currentTheme === theme.id;
                const topColor = theme.sky.gradient[0].color;
                const bottomColor = theme.sky.gradient[theme.sky.gradient.length - 1].color;
                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setTheme(theme.id);
                      setCustomBackgroundImage(null); // clear custom bg when standard theme picked
                    }}
                    className={`relative flex flex-col items-start p-3 rounded-xl border transition-all duration-300 text-left overflow-hidden group
                      ${isActive && !customBackgroundImage
                        ? 'border-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                        : 'border-white/10 hover:border-white/20'
                      }
                    `}
                  >
                    {/* Background representation */}
                    <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity" style={{ background: `linear-gradient(180deg, ${topColor}, ${bottomColor})` }} />
                    
                    <div className="relative z-10 flex w-full items-center justify-between">
                      <span className={`text-xs font-bold ${isActive && !customBackgroundImage ? 'text-amber-300' : 'text-white'}`}>
                        {theme.name}
                      </span>
                      {isActive && !customBackgroundImage && <Check size={14} className="text-amber-400" />}
                    </div>
                    <span className="relative z-10 text-[10px] text-white/60 mt-1 leading-tight">{theme.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sliders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            
            {/* Volume */}
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 shadow-sm">
              <label className="text-[11px] text-white/50 uppercase tracking-widest font-bold flex items-center gap-2 mb-3">
                <Volume2 size={14} /> Master Volume
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={masterVolume}
                  onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer accent-amber-500 hover:accent-amber-400 transition-all"
                />
                <span className="text-xs font-mono text-white/80 w-10 text-right">{Math.round(masterVolume * 100)}%</span>
              </div>
            </div>

            {/* Wind */}
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 shadow-sm">
              <label className="text-[11px] text-white/50 uppercase tracking-widest font-bold flex items-center gap-2 mb-3">
                <Wind size={14} /> Wind Direction
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range" min="-100" max="100" step="5"
                  value={wind}
                  onChange={(e) => setWind(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all"
                />
                <span className="text-xs font-mono text-white/80 w-10 text-right">{wind > 0 ? 'E' : wind < 0 ? 'W' : '--'} {Math.abs(wind)}</span>
              </div>
            </div>
            
          </div>

          {/* Quality & Performance */}
          <div className="pt-6 border-t border-white/10">
            <label className="text-[11px] text-white/50 uppercase tracking-widest font-bold flex items-center gap-2 mb-4">
              <Activity size={14} /> Performance
            </label>
            
            <div className="bg-black/40 rounded-2xl p-1 flex border border-white/10">
              {['low', 'medium', 'high'].map((q) => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 capitalize
                    ${quality === q
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                    }
                  `}
                >
                  {q}
                </button>
              ))}
            </div>

            <div className="flex gap-4 mt-6">
              <button 
                onClick={() => setReduceMotion(!reduceMotion)}
                className={`flex-1 flex items-center justify-between p-4 rounded-2xl border transition-colors ${reduceMotion ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
              >
                <span className={`text-xs font-semibold ${reduceMotion ? 'text-amber-400' : 'text-white/70'}`}>Reduce Motion</span>
                <div className={`w-8 h-4 rounded-full transition-colors relative ${reduceMotion ? 'bg-amber-500' : 'bg-white/20'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${reduceMotion ? 'translate-x-4' : 'translate-x-1'}`} />
                </div>
              </button>
              
              <button 
                onClick={toggleDebug}
                className={`flex-1 flex items-center justify-between p-4 rounded-2xl border transition-colors ${showDebug ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
              >
                <span className={`text-xs font-semibold ${showDebug ? 'text-green-400' : 'text-white/70'}`}>Show Stats</span>
                <div className={`w-8 h-4 rounded-full transition-colors relative ${showDebug ? 'bg-green-500' : 'bg-white/20'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${showDebug ? 'translate-x-4' : 'translate-x-1'}`} />
                </div>
              </button>
            </div>
            
          </div>
          
        </div>
      </div>
    </div>
  );
}
