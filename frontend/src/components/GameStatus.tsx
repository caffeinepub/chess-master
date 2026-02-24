import React from 'react';
import { Player, GameResult, DrawReason } from '../types/chess';
import { Volume2, VolumeX } from 'lucide-react';

interface GameStatusProps {
  currentPlayer: Player;
  gameOver: boolean;
  result: GameResult;
  drawReason: DrawReason;
  isCheck: boolean;
  isAIThinking?: boolean;
  whiteTime?: number;
  blackTime?: number;
  isMuted?: boolean;
  onToggleMute?: () => void;
  gameMode?: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function GameStatus({
  currentPlayer,
  gameOver,
  result,
  drawReason,
  isCheck,
  isAIThinking,
  whiteTime,
  blackTime,
  isMuted,
  onToggleMute,
  gameMode,
}: GameStatusProps) {
  let statusMsg = '';
  if (gameOver) {
    if (result === 'draw') {
      statusMsg = drawReason === 'stalemate' ? 'Stalemate – Draw!' :
        drawReason === 'threefold-repetition' ? 'Threefold Repetition – Draw!' : 'Draw!';
    } else if (result) {
      statusMsg = `${result.charAt(0).toUpperCase() + result.slice(1)} wins!`;
    }
  } else if (isAIThinking) {
    statusMsg = 'AI is thinking…';
  } else if (isCheck) {
    statusMsg = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} is in check!`;
  } else {
    statusMsg = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s turn`;
  }

  return (
    <div className="flex items-center justify-between gap-2 px-2 py-1.5 bg-chess-panel rounded-lg text-chess-panel-fg">
      {/* White clock */}
      {whiteTime !== undefined && (
        <div className={`chess-clock ${currentPlayer === 'white' && !gameOver ? 'chess-clock-active' : ''}`}>
          ♔ {formatTime(whiteTime)}
        </div>
      )}

      {/* Status message */}
      <div className="flex-1 text-center text-sm font-medium truncate px-1">
        {statusMsg}
      </div>

      {/* Black clock */}
      {blackTime !== undefined && (
        <div className={`chess-clock ${currentPlayer === 'black' && !gameOver ? 'chess-clock-active' : ''}`}>
          ♚ {formatTime(blackTime)}
        </div>
      )}

      {/* Mute toggle */}
      {onToggleMute && (
        <button
          onClick={onToggleMute}
          className="p-1.5 rounded hover:bg-chess-hover transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={isMuted ? 'Unmute music' : 'Mute music'}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      )}
    </div>
  );
}
