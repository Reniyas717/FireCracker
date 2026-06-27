import SkyCanvas from './components/SkyCanvas.jsx';
import InventoryHUD from './components/InventoryHUD.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import MessageInput from './components/MessageInput.jsx';
import RoomPanel from './components/RoomPanel.jsx';
import CharacterCustomizer from './components/CharacterCustomizer.jsx';
import { useStore } from './store/useStore.js';
import { Settings, Users, User } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';

function App() {
  const toggleRoomPanel  = useStore((s) => s.toggleRoomPanel);
  const toggleSettings   = useStore((s) => s.toggleSettings);
  const toggleCustomizer = useStore((s) => s.toggleCustomizer);
  const characterConfig  = useStore((s) => s.characterConfig);

  return (
    <div className="w-screen h-screen overflow-hidden bg-black font-sans text-white selection:bg-amber-500/30">
      {/* Full-screen night sky canvas */}
      <SkyCanvas />

      {/* Top Navigation HUD */}
      <header className="fixed top-0 left-0 right-0 h-16 z-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none flex items-center justify-between px-6">
        
        {/* Branding */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-br from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-transparent drop-shadow-md">
            FIRECRACKER
          </h1>
          <p className="text-[10px] text-white/40 font-semibold tracking-[0.2em] uppercase mt-0.5">
            Virtual Night Sky
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 pointer-events-auto">

          {/* Character customizer button — shows face preview if photo set */}
          <button
            onClick={toggleCustomizer}
            className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-amber-500/15 hover:border-amber-500/30 transition-all duration-300 backdrop-blur-md text-white/70 hover:text-amber-400 group overflow-hidden"
            title="Customize Character"
          >
            {characterConfig.faceImage ? (
              <img
                src={characterConfig.faceImage}
                alt="character"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <User size={18} className="group-hover:scale-110 transition-transform" />
            )}
            {/* Gender indicator dot */}
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black text-[6px] flex items-center justify-center font-bold ${
              characterConfig.gender === 'female' ? 'bg-pink-500' : 'bg-blue-500'
            }`} />
          </button>

          <button
            onClick={toggleRoomPanel}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 hover:border-white/20 transition-all duration-300 backdrop-blur-md text-white/70 hover:text-white group"
            title="Multiplayer Room"
          >
            <Users size={18} className="group-hover:scale-110 transition-transform" />
          </button>
          
          <button
            onClick={toggleSettings}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 hover:border-white/20 transition-all duration-300 backdrop-blur-md text-white/70 hover:text-white group"
            title="Settings"
          >
            <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
          </button>
        </div>
      </header>

      {/* Instruction hint */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none select-none opacity-30 hover:opacity-0 transition-opacity duration-700">
        <p className="text-white/50 text-sm font-medium tracking-wide text-center animate-pulse drop-shadow-lg">
          Select a cracker below, then click anywhere on the sky ✨
        </p>
      </div>

      {/* Inventory HUD */}
      <InventoryHUD />

      {/* UI Panels */}
      <SettingsPanel />
      <MessageInput />
      <RoomPanel />
      <CharacterCustomizer />
      <Analytics />
    </div>
  );
}

export default App;
