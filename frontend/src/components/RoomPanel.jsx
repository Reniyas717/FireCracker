/**
 * RoomPanel — UI for creating/joining multiplayer rooms via Socket.io.
 * Structured centered modal.
 */

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useStore } from '../store/useStore.js';
import { Users, X, Copy, LogOut, Loader2, Globe } from 'lucide-react';

export default function RoomPanel() {
  const roomPanelOpen = useStore((s) => s.roomPanelOpen);
  const toggleRoomPanel = useStore((s) => s.toggleRoomPanel);
  const roomCode = useStore((s) => s.roomCode);
  const setRoomCode = useStore((s) => s.setRoomCode);
  const connectedUsers = useStore((s) => s.connectedUsers);
  const setConnectedUsers = useStore((s) => s.setConnectedUsers);

  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(false);

  // We expose the socket instance on the window object so FirecrackerEngine can use it
  useEffect(() => {
    if (!window.roomSocket) {
      // Connect to the backend
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const socket = io(`${backendUrl}/rooms`, {
        autoConnect: false,
      });

      socket.on('connect', () => {
        setConnecting(false);
        setError('');
      });

      socket.on('connect_error', () => {
        setConnecting(false);
        setError('Connection failed. Backend may not be running.');
      });

      socket.on('room-state', (data) => {
        setConnectedUsers(data.users);
      });

      window.roomSocket = socket;
    }

    return () => {
      // Don't disconnect on unmount, we want the connection to persist if open
    };
  }, [setConnectedUsers]);

  if (!roomPanelOpen) return null;

  const handleCreate = () => {
    setConnecting(true);
    setError('');
    const socket = window.roomSocket;
    if (!socket.connected) socket.connect();
    
    socket.emit('create-room', (response) => {
      setConnecting(false);
      if (response.success) {
        setRoomCode(response.roomCode);
      }
    });
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!joinCode || joinCode.length !== 5) {
      setError('Please enter a valid 5-letter code.');
      return;
    }
    
    setConnecting(true);
    setError('');
    const socket = window.roomSocket;
    if (!socket.connected) socket.connect();

    socket.emit('join-room', joinCode.toUpperCase(), (response) => {
      setConnecting(false);
      if (response.success) {
        setRoomCode(response.roomCode);
        setJoinCode('');
      } else {
        setError('Failed to join room.');
      }
    });
  };

  const handleLeave = () => {
    const socket = window.roomSocket;
    if (socket && socket.connected) {
      socket.emit('leave-room', () => {
        setRoomCode(null);
        setConnectedUsers(0);
      });
    } else {
      setRoomCode(null);
      setConnectedUsers(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={toggleRoomPanel}
      />

      {/* Modal Content */}
      <div 
        className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{ minHeight: '400px' }}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <Globe size={18} className="text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-wide">Shared Sky</h2>
          </div>
          <button 
            onClick={toggleRoomPanel} 
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 flex flex-col">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-4 py-3 rounded-xl mb-6 text-center font-medium">
              {error}
            </div>
          )}

          {roomCode ? (
            <div className="flex-1 flex flex-col justify-center">
              <p className="text-sm text-white/50 text-center font-medium mb-6">You are connected to a shared sky room.</p>
              
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center relative overflow-hidden group mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <p className="text-[10px] text-white/40 mb-2 uppercase tracking-[0.2em] font-bold">Room Code</p>
                <div className="flex items-center justify-center gap-4">
                  <p className="text-4xl font-mono tracking-[0.3em] text-blue-400 drop-shadow-md ml-2 font-light">{roomCode}</p>
                  <button 
                    onClick={() => navigator.clipboard.writeText(roomCode)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all shadow-sm"
                    title="Copy Code"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex justify-between items-center bg-black/40 px-5 py-4 rounded-xl border border-white/5 mb-6">
                <span className="text-xs text-white/50 uppercase tracking-widest font-bold flex items-center gap-2">
                  <Users size={14} /> Connected
                </span>
                <div className="flex items-center gap-3">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-white font-mono text-base">{connectedUsers}</span>
                </div>
              </div>
              
              <button 
                onClick={handleLeave}
                className="w-full mt-auto flex items-center justify-center gap-2 py-4 text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-xl transition-all"
              >
                <LogOut size={16} /> Leave Room
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center">
              <button 
                onClick={handleCreate}
                disabled={connecting}
                className="w-full py-4 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition-all shadow-[0_4px_20px_rgba(79,70,229,0.3)] flex justify-center items-center gap-2 mb-6"
              >
                {connecting ? <Loader2 size={18} className="animate-spin" /> : <Globe size={18} />}
                {connecting ? 'Connecting...' : 'Create New Room'}
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="h-px bg-white/10 flex-1"></div>
                <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">or join</span>
                <div className="h-px bg-white/10 flex-1"></div>
              </div>

              <form onSubmit={handleJoin} className="flex flex-col gap-4">
                <input
                  type="text"
                  maxLength={5}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter 5-Letter Code"
                  className="w-full px-4 py-4 bg-black/40 border border-white/10 rounded-xl text-white text-center font-mono text-xl tracking-[0.3em] placeholder:text-white/20 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm focus:outline-none focus:border-blue-500/50 focus:bg-black/60 transition-all"
                />
                <button 
                  type="submit"
                  disabled={connecting || joinCode.length !== 5}
                  className="w-full py-4 text-sm font-bold text-white bg-white/10 border border-white/10 rounded-xl hover:bg-white/15 disabled:opacity-40 disabled:hover:bg-white/10 transition-all flex justify-center items-center gap-2"
                >
                  {connecting && joinCode.length === 5 ? <Loader2 size={18} className="animate-spin" /> : <Users size={18} />}
                  Join Room
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
