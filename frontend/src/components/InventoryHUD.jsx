/**
 * InventoryHUD — Ultra-subtle bottom dock for selecting crackers.
 * Horizontal scrolling with no visible scrollbars.
 */

import { useState } from 'react';
import { CRACKER_CONFIGS, CRACKER_TYPES } from '../engine/CrackerConfigs.js';
import { CRACKER_ICON_MAP } from './CrackerIcons.jsx';
import { useStore } from '../store/useStore.js';
import { Sparkles, ArrowUp, Pencil } from 'lucide-react';

const CATEGORIES = [
  { id: 'aerial', label: 'Aerial', types: [CRACKER_TYPES.ROCKET, CRACKER_TYPES.SHOWER_WILLOW, CRACKER_TYPES.HEART_ROCKET, CRACKER_TYPES.ROMAN_CANDLE, CRACKER_TYPES.MULTI_BREAK, CRACKER_TYPES.PEONY, CRACKER_TYPES.FLOWER_BOUQUET] },
  { id: 'cakes', label: 'Cakes', types: [CRACKER_TYPES.CAKE_12, CRACKER_TYPES.CAKE_100] },
  { id: 'ground', label: 'Ground', types: [CRACKER_TYPES.ANAR, CRACKER_TYPES.CHAKRI, CRACKER_TYPES.LADI, CRACKER_TYPES.SNAKE] },
  { id: 'handheld', label: 'Handheld', types: [CRACKER_TYPES.PHULJHARI, CRACKER_TYPES.SKY_LANTERN] },
  { id: 'special', label: 'Special', types: [CRACKER_TYPES.MESSAGE_ROCKET, CRACKER_TYPES.SUTLI_BOMB, CRACKER_TYPES.STROBE] },
];

export default function InventoryHUD() {
  const selectedCracker = useStore((s) => s.selectedCracker);
  const setSelectedCracker = useStore((s) => s.setSelectedCracker);
  const setMessageInputOpen = useStore((s) => s.setMessageInputOpen);
  
  const initialCategory = CATEGORIES.find(c => c.types.includes(selectedCracker))?.id || 'aerial';
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  
  // HUD state: collapsed (just selected cracker floating) or expanded (full dock)
  const [expanded, setExpanded] = useState(true);

  const currentCategory = CATEGORIES.find((c) => c.id === activeCategory);
  const SelectedIcon = CRACKER_ICON_MAP[selectedCracker];
  const selectedConfig = CRACKER_CONFIGS[selectedCracker];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
      
      {/* Floating Toggle Button (visible when collapsed) */}
      <button 
        onClick={() => setExpanded(true)}
        className={`mb-4 flex items-center gap-3 px-6 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl transition-all duration-500 hover:bg-black/80 hover:border-white/20 hover:scale-105 ${expanded ? 'opacity-0 translate-y-10 pointer-events-none absolute' : 'opacity-100 translate-y-0'}`}
      >
        <span className="text-amber-400">
          {SelectedIcon ? <SelectedIcon size={20} /> : <Sparkles size={20} />}
        </span>
        <span className="text-xs font-bold tracking-widest uppercase text-white/90">
          {selectedConfig?.name || 'Inventory'}
        </span>
        <ArrowUp size={14} className="text-white/40 ml-2" />
      </button>

      {/* The Dock */}
      <div 
        className={`relative flex flex-col bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_10px_50px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${expanded ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto w-[90vw] max-w-2xl' : 'opacity-0 translate-y-20 scale-95 pointer-events-none w-[90vw] max-w-2xl absolute'}`}
      >
        {/* Dock Header / Categories */}
        <div className="flex items-center justify-between px-2 pt-2 pb-2 bg-white/5 border-b border-white/5">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide px-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`
                  whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all duration-300
                  ${activeCategory === cat.id
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-400'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                  }
                `}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setExpanded(false)}
            className="p-2 mr-2 rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowUp size={16} className="rotate-180" />
          </button>
        </div>

        {/* Dock Items (Horizontal Scroll) */}
        <div className="flex gap-3 p-4 overflow-x-auto scrollbar-hide items-center">
          {currentCategory?.types.map((type) => {
            const config = CRACKER_CONFIGS[type];
            if (!config) return null;
            const isSelected = selectedCracker === type;
            const IconComponent = CRACKER_ICON_MAP[type];

            return (
              <button
                key={type}
                onClick={() => setSelectedCracker(type)}
                className={`
                  relative flex-shrink-0 flex flex-col items-center justify-center w-20 h-20
                  rounded-2xl transition-all duration-300 ease-out
                  ${isSelected
                    ? 'bg-gradient-to-b from-amber-500/20 to-orange-600/10 border-2 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)] scale-105'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                  }
                `}
              >
                <span className={`mb-1 transition-all duration-300 ${isSelected ? 'text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-white/50'}`}>
                  {IconComponent ? <IconComponent size={24} /> : <span>{config.icon}</span>}
                </span>
                <span className={`text-[9px] font-bold text-center leading-tight px-1 uppercase tracking-wider ${isSelected ? 'text-amber-300' : 'text-white/40'}`}>
                  {config.name}
                </span>
                
                {config.requiresMessage && (
                  <div className="absolute top-1 right-1">
                    {isSelected ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          // Clear pending position so it doesn't auto-fire on submit
                          window.pendingRocketPosition = null; 
                          setMessageInputOpen(true);
                        }}
                        className="p-1.5 bg-amber-500 rounded-full text-black hover:bg-amber-400 hover:scale-110 transition-transform shadow-lg z-10"
                      >
                        <Pencil size={10} />
                      </button>
                    ) : (
                      <span className="flex h-1.5 w-1.5 mt-1 mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
