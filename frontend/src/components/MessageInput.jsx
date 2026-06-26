/**
 * MessageInput — modal that appears when "Message Rocket" is selected and sky is clicked.
 * Fires the rocket immediately after setting the message.
 */

import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore.js';
import { Send, X } from 'lucide-react';

export default function MessageInput() {
  const messageInputOpen = useStore((s) => s.messageInputOpen);
  const setMessageInputOpen = useStore((s) => s.setMessageInputOpen);
  const customMessage = useStore((s) => s.customMessage);
  const setCustomMessage = useStore((s) => s.setCustomMessage);

  const [inputValue, setInputValue] = useState(customMessage || '');

  // Auto focus input when opened
  useEffect(() => {
    if (messageInputOpen) {
      setInputValue(customMessage || ''); // Reset to existing message on open
      setTimeout(() => {
        const input = document.getElementById('message-input');
        if (input) input.focus();
      }, 50);
    }
  }, [messageInputOpen, customMessage]);

  if (!messageInputOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputValue.trim().slice(0, 15);
    
    // Save to global store
    setCustomMessage(trimmed);

    // If there is a pending position (i.e. clicked sky before setting message)
    if (trimmed && window.pendingRocketPosition) {
      const { x, y } = window.pendingRocketPosition;
      const event = new CustomEvent('fire-message-rocket', { detail: { x, y, message: trimmed } });
      window.dispatchEvent(event);
      window.pendingRocketPosition = null;
    }
    
    setMessageInputOpen(false);
  };

  const handleCancel = () => {
    window.pendingRocketPosition = null;
    setMessageInputOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleCancel}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/30">
              <Send size={18} className="text-amber-400" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-wide">Write Message</h2>
          </div>
          <button 
            type="button"
            onClick={handleCancel} 
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-sm text-white/50 font-medium mb-6">
            Up to 15 characters — it will appear in the sky when the rocket bursts.
          </p>

          <input
            id="message-input"
            type="text"
            maxLength={15}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Happy Diwali!"
            className="w-full px-4 py-4 bg-black/40 border border-white/10 rounded-xl text-white text-center font-bold text-xl tracking-wide placeholder:text-white/20 placeholder:font-normal focus:outline-none focus:border-amber-500/50 focus:bg-black/60 transition-all mb-2"
          />

          <div className="flex justify-between items-center mb-6 px-1">
            <span className="text-[11px] text-white/30 font-bold uppercase tracking-widest">
              {inputValue.length}/15 Characters
            </span>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-4 text-sm font-bold text-white/60 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="flex-1 py-4 text-sm font-bold text-black bg-gradient-to-r from-amber-400 to-orange-400 rounded-xl hover:from-amber-300 hover:to-orange-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_4px_20px_rgba(251,191,36,0.3)] flex justify-center items-center gap-2"
            >
              {window.pendingRocketPosition ? 'Fire Rocket' : 'Save Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
