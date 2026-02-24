import React from 'react';
import type { GameMode } from '../types/chess';

interface GameModeSelectorProps {
  currentMode: GameMode;
  onModeChange: (mode: GameMode) => void;
}

export default function GameModeSelector({ currentMode, onModeChange }: GameModeSelectorProps) {
  const modes: { mode: GameMode; label: string; icon: string }[] = [
    { mode: 'two-players', label: 'Two Players', icon: '♟' },
    { mode: 'one-player', label: 'vs AI', icon: '🤖' },
    { mode: 'auto-play', label: 'Auto Play', icon: '▶' },
    { mode: 'online', label: 'Online', icon: '🌐' },
  ];

  return (
    <div className="flex gap-2 flex-wrap justify-center">
      {modes.map(({ mode, label, icon }) => (
        <button
          key={mode}
          onClick={() => onModeChange(mode)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all border ${
            currentMode === mode
              ? 'bg-chess-gold text-chess-dark border-chess-gold font-bold shadow-chess'
              : 'border-chess-gold/30 text-chess-gold/70 hover:border-chess-gold/60 hover:text-chess-gold hover:bg-chess-gold/5'
          }`}
        >
          <span className="mr-1">{icon}</span>
          {label}
        </button>
      ))}
    </div>
  );
}
