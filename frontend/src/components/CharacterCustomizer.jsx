/**
 * CharacterCustomizer — slide-in panel for customizing your igniter character.
 * Options: gender, skin tone, clothing color/style, hair color/style, face photo.
 */

import { useRef } from 'react';
import { useStore } from '../store/useStore.js';
import { X, User, Upload, Trash2 } from 'lucide-react';

// ─── Preset options ────────────────────────────────────────────────────────────

const SKIN_TONES = [
  { label: 'Fair',     value: '#F5CBA7' },
  { label: 'Light',    value: '#E8A87C' },
  { label: 'Medium',   value: '#C68642' },
  { label: 'Tan',      value: '#A0522D' },
  { label: 'Brown',    value: '#7B3F00' },
  { label: 'Deep',     value: '#4A2311' },
];

const HAIR_COLORS = [
  { label: 'Black',  value: '#1A0A00' },
  { label: 'Dark',   value: '#3B1F0C' },
  { label: 'Brown',  value: '#6B3A2A' },
  { label: 'Auburn', value: '#922724' },
  { label: 'Grey',   value: '#888888' },
  { label: 'White',  value: '#E8E8E8' },
];

const CLOTHING_COLORS = [
  { label: 'Saffron', value: '#E8572A' },
  { label: 'Crimson', value: '#C0392B' },
  { label: 'Royal',   value: '#2E4EBF' },
  { label: 'Emerald', value: '#1A7A4A' },
  { label: 'Gold',    value: '#D4A017' },
  { label: 'Purple',  value: '#7B2D8B' },
  { label: 'Teal',    value: '#177A7A' },
  { label: 'Maroon',  value: '#800020' },
];

const MALE_HAIR_STYLES   = ['Short Crop', 'Side Part', 'Curly', 'Buzz Cut'];
const FEMALE_HAIR_STYLES = ['Long Straight', 'Bun', 'Wavy Braid', 'Short Bob'];

const MALE_CLOTHING   = [
  { label: 'Kurta',   value: 'kurta'  },
  { label: 'T-Shirt', value: 'tshirt' },
];
const FEMALE_CLOTHING = [
  { label: 'Salwar',  value: 'salwar' },
  { label: 'Saree',   value: 'saree'  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2 mt-5 first:mt-0">
      {children}
    </p>
  );
}

function SwatchRow({ options, selected, onSelect, shape = 'circle' }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isActive = selected === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            title={opt.label}
            className={`relative transition-all duration-200 ${
              shape === 'circle' ? 'w-7 h-7 rounded-full' : 'px-3 py-1.5 rounded-lg text-[11px] font-semibold'
            } ${isActive ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
            style={shape === 'circle' ? { background: opt.value } : { background: opt.value, color: '#fff' }}
          >
            {shape !== 'circle' && opt.label}
          </button>
        );
      })}
    </div>
  );
}

function StylePills({ options, selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt, i) => {
        const val = typeof opt === 'string' ? i : opt.value;
        const lbl = typeof opt === 'string' ? opt : opt.label;
        const isActive = selected === val;
        return (
          <button
            key={val}
            onClick={() => onSelect(val)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 border ${
              isActive
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80'
            }`}
          >
            {lbl}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CharacterCustomizer() {
  const customizerOpen   = useStore((s) => s.customizerOpen);
  const toggleCustomizer = useStore((s) => s.toggleCustomizer);
  const characterConfig  = useStore((s) => s.characterConfig);
  const setCharacterConfig = useStore((s) => s.setCharacterConfig);

  const fileInputRef = useRef(null);

  if (!customizerOpen) return null;

  const cfg = characterConfig;

  const update = (patch) => setCharacterConfig(patch);

  // ─── Face photo ──────────────────────────────────────────────────────────────
  const handleFaceUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => update({ faceImage: ev.target.result });
    reader.readAsDataURL(file);
  };

  const removeFacePhoto = () => {
    update({ faceImage: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const hairStyles = cfg.gender === 'male' ? MALE_HAIR_STYLES : FEMALE_HAIR_STYLES;
  const clothingOptions = cfg.gender === 'male' ? MALE_CLOTHING : FEMALE_CLOTHING;
  // Make sure clothing style is valid for current gender
  const validClothingStyle = clothingOptions.find(c => c.value === cfg.clothingStyle)
    ? cfg.clothingStyle
    : clothingOptions[0].value;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-end p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={toggleCustomizer}
      />

      {/* Panel — slides in from right */}
      <div className="relative z-10 w-full sm:w-96 h-[90vh] sm:h-[85vh] bg-black/85 backdrop-blur-3xl border border-white/10 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <User size={15} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">My Character</h2>
              <p className="text-[10px] text-white/40">Customize your igniter</p>
            </div>
          </div>
          <button
            onClick={toggleCustomizer}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1 scrollbar-hide">

          {/* Gender */}
          <SectionLabel>Gender</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: '♂ Male',   value: 'male'   },
              { label: '♀ Female', value: 'female' },
            ].map((g) => (
              <button
                key={g.value}
                onClick={() => {
                  update({
                    gender: g.value,
                    clothingStyle: g.value === 'male' ? 'kurta' : 'salwar',
                    hairStyle: 0,
                  });
                }}
                className={`py-3 rounded-2xl text-sm font-bold border transition-all duration-200 ${
                  cfg.gender === g.value
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Face photo */}
          <SectionLabel>Face Photo (optional)</SectionLabel>
          <div className="flex items-center gap-3">
            {cfg.faceImage ? (
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-amber-500/50 flex-shrink-0">
                <img src={cfg.faceImage} alt="face" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center flex-shrink-0">
                <User size={20} className="text-white/30" />
              </div>
            )}
            <div className="flex flex-col gap-2 flex-1">
              <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs text-white/70 hover:text-white">
                <Upload size={12} />
                {cfg.faceImage ? 'Change Photo' : 'Upload Your Face'}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFaceUpload}
                />
              </label>
              {cfg.faceImage && (
                <button
                  onClick={removeFacePhoto}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors text-xs text-red-400"
                >
                  <Trash2 size={12} />
                  Remove Photo
                </button>
              )}
            </div>
          </div>
          {cfg.faceImage && (
            <p className="text-[10px] text-white/30 mt-1">Your face will appear on the character's head 🎭</p>
          )}

          {/* Skin tone */}
          <SectionLabel>Skin Tone</SectionLabel>
          <SwatchRow
            options={SKIN_TONES}
            selected={cfg.skinTone}
            onSelect={(v) => update({ skinTone: v })}
          />

          {/* Hair color */}
          <SectionLabel>Hair Color</SectionLabel>
          <SwatchRow
            options={HAIR_COLORS}
            selected={cfg.hairColor}
            onSelect={(v) => update({ hairColor: v })}
          />

          {/* Hair style */}
          <SectionLabel>Hair Style</SectionLabel>
          <StylePills
            options={hairStyles}
            selected={cfg.hairStyle}
            onSelect={(v) => update({ hairStyle: v })}
          />

          {/* Clothing style */}
          <SectionLabel>Clothing Style</SectionLabel>
          <StylePills
            options={clothingOptions}
            selected={validClothingStyle}
            onSelect={(v) => update({ clothingStyle: v })}
          />

          {/* Clothing color */}
          <SectionLabel>Clothing Color</SectionLabel>
          <div className="grid grid-cols-4 gap-2">
            {CLOTHING_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => update({ clothingColor: c.value })}
                title={c.label}
                style={{ background: c.value }}
                className={`h-9 rounded-xl text-[10px] font-semibold text-white/80 transition-all duration-200 ${
                  cfg.clothingColor === c.value
                    ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-black scale-105'
                    : 'opacity-75 hover:opacity-100 hover:scale-105'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Preview hint */}
          <div className="mt-6 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/15">
            <p className="text-[11px] text-amber-400/70 text-center leading-relaxed">
              ✨ Place a cracker to see your character walk in and light it!
            </p>
          </div>

          <div className="h-4" /> {/* Bottom padding */}
        </div>
      </div>
    </div>
  );
}
