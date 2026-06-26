/**
 * Zustand store — UI state only.
 * Never stores per-frame particle data.
 */

import { create } from 'zustand';
import { CRACKER_TYPES } from '../engine/CrackerConfigs.js';
import { THEME_IDS } from '../engine/ThemeConfigs.js';

export const useStore = create((set, get) => ({
  // Selected cracker type
  selectedCracker: CRACKER_TYPES.ROCKET,
  setSelectedCracker: (type) => set({ selectedCracker: type }),

  // Custom message for message rockets
  customMessage: '',
  setCustomMessage: (msg) => set({ customMessage: msg }),

  // Theme
  currentTheme: THEME_IDS.DIWALI_NIGHT,
  setTheme: (themeId) => set({ currentTheme: themeId }),

  // Settings
  quality: 'high',
  setQuality: (q) => set({ quality: q }),

  masterVolume: 0.7,
  setMasterVolume: (v) => set({ masterVolume: v }),

  wind: 0,
  setWind: (w) => set({ wind: w }),

  // Custom Theme Upload
  customBackgroundImage: null,
  setCustomBackgroundImage: (img) => set({ customBackgroundImage: img }),

  reduceMotion: false,
  setReduceMotion: (b) => set({ reduceMotion: b }),

  showDebug: false,
  toggleDebug: () => set((s) => ({ showDebug: !s.showDebug })),

  // Panels
  settingsOpen: false,
  toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),

  messageInputOpen: false,
  setMessageInputOpen: (b) => set({ messageInputOpen: b }),

  roomPanelOpen: false,
  toggleRoomPanel: () => set((s) => ({ roomPanelOpen: !s.roomPanelOpen })),

  // Room state
  roomCode: null,
  setRoomCode: (code) => set({ roomCode: code }),
  connectedUsers: 0,
  setConnectedUsers: (n) => set({ connectedUsers: n }),

  // Stats
  activeParticles: 0,
  setActiveParticles: (n) => set({ activeParticles: n }),
}));
