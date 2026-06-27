/**
 * SkyCanvas — React component that mounts the FirecrackerEngine onto a full-screen canvas.
 * Handles resizing, click/touch events, cursor tracking, themes, and message rockets.
 */

import { useRef, useEffect, useCallback } from 'react';
import { FirecrackerEngine } from '../engine/FirecrackerEngine.js';
import { CRACKER_TYPES, CRACKER_CONFIGS } from '../engine/CrackerConfigs.js';
import { useStore } from '../store/useStore.js';

export default function SkyCanvas() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  const selectedCracker = useStore((s) => s.selectedCracker);
  const quality = useStore((s) => s.quality);
  const masterVolume = useStore((s) => s.masterVolume);
  const wind = useStore((s) => s.wind);
  const showDebug = useStore((s) => s.showDebug);
  const currentTheme = useStore((s) => s.currentTheme);
  const customBackgroundImage = useStore((s) => s.customBackgroundImage);
  const customMessage = useStore((s) => s.customMessage);
  const setActiveParticles = useStore((s) => s.setActiveParticles);
  const setMessageInputOpen = useStore((s) => s.setMessageInputOpen);
  const showCharacters   = useStore((s) => s.showCharacters);
  const characterConfig  = useStore((s) => s.characterConfig);

  const selectedCrackerRef = useRef(selectedCracker);
  selectedCrackerRef.current = selectedCracker;
  const customMessageRef = useRef(customMessage);
  customMessageRef.current = customMessage;

  // Initialize engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const engine = new FirecrackerEngine(canvas);
    engineRef.current = engine;
    engine.start();

    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      engine.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    const statsInterval = setInterval(() => {
      setActiveParticles(engine.pool.getActiveCount());
    }, 500);

    // Setup Socket.io listener for remote crackers
    const handleRemote = (data) => {
      if (engineRef.current) {
        engineRef.current.handleRemoteCracker(data);
      }
    };

    // Listen for custom event from MessageInput modal
    const handleMessageFire = (e) => {
      const { x, y, message } = e.detail;
      if (engineRef.current) {
        engineRef.current.lightCracker(CRACKER_TYPES.MESSAGE_ROCKET, x, y, message);
      }
    };
    window.addEventListener('fire-message-rocket', handleMessageFire);

    // Poll for the socket to be attached by RoomPanel
    const checkSocketInterval = setInterval(() => {
      if (window.roomSocket && !engine.onCrackerEvent) {
        // We found the socket, wire it up
        engine.onCrackerEvent = (eventData) => {
          // If connected to a room, broadcast
          if (window.roomSocket.connected) {
            window.roomSocket.emit('light-cracker', eventData);
          }
        };
        
        window.roomSocket.on('remote-cracker', handleRemote);
        clearInterval(checkSocketInterval);
      }
    }, 500);

    return () => {
      window.removeEventListener('resize', onResize);
      clearInterval(statsInterval);
      clearInterval(checkSocketInterval);
      window.removeEventListener('fire-message-rocket', handleMessageFire);
      if (window.roomSocket) {
        window.roomSocket.off('remote-cracker', handleRemote);
      }
      engine.destroy();
      engineRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync settings
  useEffect(() => { if (engineRef.current) engineRef.current.setQuality(quality); }, [quality]);
  useEffect(() => { if (engineRef.current) engineRef.current.audio.setVolume(masterVolume); }, [masterVolume]);
  useEffect(() => { if (engineRef.current) engineRef.current.setWind(wind); }, [wind]);
  useEffect(() => { if (engineRef.current) engineRef.current.showDebug = showDebug; }, [showDebug]);
  useEffect(() => { if (engineRef.current) engineRef.current.setTheme(currentTheme); }, [currentTheme]);
  useEffect(() => { if (engineRef.current) engineRef.current.setCustomBackground(customBackgroundImage); }, [customBackgroundImage]);
  useEffect(() => { if (engineRef.current) engineRef.current.setShowCharacters(showCharacters); }, [showCharacters]);
  useEffect(() => {
    if (engineRef.current) engineRef.current.characters.setCharacterConfig(characterConfig);
  }, [characterConfig]);

  // Click handler
  const handleClick = useCallback((e) => {
    const engine = engineRef.current;
    if (!engine) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const type = selectedCrackerRef.current;

    // If message rocket is selected, pass the custom message
    if (type === CRACKER_TYPES.MESSAGE_ROCKET) {
      engine.lightCracker(type, x, y, customMessageRef.current);
      return;
    }

    engine.lightCracker(type, x, y, '');
  }, []);

  // Touch handler
  const handleTouch = useCallback((e) => {
    e.preventDefault();
    const engine = engineRef.current;
    if (!engine) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const type = selectedCrackerRef.current;

    if (type === CRACKER_TYPES.MESSAGE_ROCKET) {
      engine.lightCracker(type, x, y, customMessageRef.current);
      return;
    }

    engine.lightCracker(type, x, y, '');
  }, []);

  // Cursor tracking for sparkler
  const handleMouseMove = useCallback((e) => {
    const engine = engineRef.current;
    if (!engine) return;
    const rect = canvasRef.current.getBoundingClientRect();
    engine.updateCursorPosition(e.clientX - rect.left, e.clientY - rect.top);
  }, []);

  const handleTouchMove = useCallback((e) => {
    const engine = engineRef.current;
    if (!engine) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    engine.updateCursorPosition(touch.clientX - rect.left, touch.clientY - rect.top);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="sky-canvas"
      className="fixed inset-0 w-full h-full cursor-crosshair z-0"
      onClick={handleClick}
      onTouchStart={handleTouch}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    />
  );
}
