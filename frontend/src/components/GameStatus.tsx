import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import type { GameResult, DrawReason } from '../types/chess';

interface GameStatusProps {
  gameOver: GameResult;
  drawReason?: DrawReason;
  isCheck: boolean;
  currentPlayer: 'white' | 'black';
  gameMode: string;
  isAIThinking?: boolean;
  whiteTime?: number;
  blackTime?: number;
  toggleMute?: () => void;
  isMuted?: boolean;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function GameStatus({
  gameOver,
  drawReason,
  isCheck,
  currentPlayer,
  gameMode,
  isAIThinking,
  whiteTime,
  blackTime,
  toggleMute,
  isMuted,
}: GameStatusProps) {
  const showClocks = whiteTime !== undefined && blackTime !== undefined;

  const getGameOverMessage = () => {
    if (!gameOver) return null;
    if (gameOver === 'draw') {
      if (drawReason === 'threefold') return '🤝 Draw – Threefold Repetition!';
      if (drawReason === 'stalemate') return '🤝 Draw – Stalemate!';
      return '🤝 Draw!';
    }
    return `🏆 ${gameOver === 'white' ? 'White' : 'Black'} Wins by Checkmate!`;
  };

  if (gameOver) {
    return (
      <div className="game-over-overlay">
        <div className="game-over-content">
          <div className="game-over-message">{getGameOverMessage()}</div>
        </div>
      </div>
    );
  }

  if (showClocks) {
    return (
      <div className="flex items-center justify-between px-4 py-2 bg-chess-dark/80 rounded-lg border border-chess-gold/30">
        <div className={`clock ${currentPlayer === 'white' ? 'clock-active' : ''}`}>
          ♔ {formatTime(whiteTime!)}
        </div>
        {toggleMute && (
          <button
            onClick={toggleMute}
            className="p-1 text-chess-gold/70 hover:text-chess-gold transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        )}
        <div className={`clock ${currentPlayer === 'black' ? 'clock-active' : ''}`}>
          ♚ {formatTime(blackTime!)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-chess-dark/80 rounded-lg border border-chess-gold/30">
      <div className="status-text">
        {isAIThinking ? (
          <span className="flex items-center gap-2">
            AI thinking
            <span className="thinking-dot" style={{ animationDelay: '0ms' }}>•</span>
            <span className="thinking-dot" style={{ animationDelay: '200ms' }}>•</span>
            <span className="thinking-dot" style={{ animationDelay: '400ms' }}>•</span>
          </span>
        ) : isCheck ? (
          <span className="text-red-400 font-bold">⚠️ Check!</span>
        ) : (
          <span>{currentPlayer === 'white' ? '♔ White' : '♚ Black'} to move</span>
        )}
      </div>
      {toggleMute && (
        <button
          onClick={toggleMute}
          className="p-1 text-chess-gold/70 hover:text-chess-gold transition-colors"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      )}
    </div>
  );
}
