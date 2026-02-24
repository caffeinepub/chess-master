import React from 'react';
import { GameMode } from '../types/chess';
import { Users, Bot, Zap, Globe } from 'lucide-react';

interface GameModeSelectorProps {
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  isAuthenticated?: boolean;
}

const MODES: { mode: GameMode; label: string; icon: React.ReactNode; desc: string }[] = [
  { mode: 'two-players', label: 'Two Players', icon: <Users size={20} />, desc: 'Local multiplayer' },
  { mode: 'one-player', label: 'vs AI', icon: <Bot size={20} />, desc: 'Play against AI' },
  { mode: 'auto-play', label: 'Auto Play', icon: <Zap size={20} />, desc: 'Watch AI vs AI' },
  { mode: 'online', label: 'Online', icon: <Globe size={20} />, desc: 'Play online' },
];

export default function GameModeSelector({ selectedMode, onSelectMode, isAuthenticated }: GameModeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {MODES.map(({ mode, label, icon, desc }) => {
        const isActive = selectedMode === mode;
        const needsAuth = mode === 'online' && !isAuthenticated;
        return (
          <button
            key={mode}
            onClick={() => onSelectMode(mode)}
            className={`
              flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all min-h-[64px]
              ${isActive
                ? 'border-chess-accent bg-chess-accent/10 text-chess-accent'
                : 'border-chess-border bg-chess-panel text-chess-panel-fg hover:border-chess-accent/50 hover:bg-chess-hover'
              }
              ${needsAuth ? 'opacity-60' : ''}
            `}
            title={needsAuth ? 'Login required for online play' : label}
          >
            {icon}
            <span className="text-xs font-semibold">{label}</span>
            <span className="text-[10px] opacity-60 hidden sm:block">{needsAuth ? 'Login required' : desc}</span>
          </button>
        );
      })}
    </div>
  );
}
