import React from 'react';
import { GameResult, DrawReason } from '../types/chess';
import { Trophy, Minus, X } from 'lucide-react';

interface GameResultsPanelProps {
  result: GameResult;
  drawReason: DrawReason;
  pointsEarned?: number;
  onNewGame: () => void;
  onClose?: () => void;
  currentPlayerColor?: 'white' | 'black' | null;
}

export default function GameResultsPanel({
  result,
  drawReason,
  pointsEarned,
  onNewGame,
  onClose,
  currentPlayerColor,
}: GameResultsPanelProps) {
  const isWin = currentPlayerColor && result === currentPlayerColor;
  const isDraw = result === 'draw';
  const isLoss = currentPlayerColor && !isDraw && result !== currentPlayerColor;

  let title = '';
  let subtitle = '';
  let icon: React.ReactNode = null;
  let colorClass = '';

  if (isDraw) {
    title = 'Draw!';
    subtitle =
      drawReason === 'stalemate'
        ? 'Stalemate'
        : drawReason === 'threefold-repetition'
        ? 'Threefold Repetition'
        : 'Game Drawn';
    icon = <Minus size={48} className="text-chess-accent" />;
    colorClass = 'text-chess-accent';
  } else if (isWin) {
    title = 'You Win!';
    subtitle = 'Congratulations!';
    icon = <Trophy size={48} className="text-yellow-400" />;
    colorClass = 'text-yellow-400';
  } else if (isLoss) {
    title = 'You Lose';
    subtitle = 'Better luck next time!';
    icon = <X size={48} className="text-red-400" />;
    colorClass = 'text-red-400';
  } else {
    title =
      result === 'white' ? 'White Wins!' : result === 'black' ? 'Black Wins!' : 'Game Over';
    subtitle = '';
    icon = <Trophy size={48} className="text-yellow-400" />;
    colorClass = 'text-yellow-400';
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-chess-panel text-chess-panel-fg rounded-2xl shadow-2xl max-w-xs w-full p-6 flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-2">
          {icon}
          <h2 className={`text-2xl font-bold font-display ${colorClass}`}>{title}</h2>
          {subtitle && <p className="text-sm text-chess-muted">{subtitle}</p>}
        </div>

        {pointsEarned !== undefined && pointsEarned > 0 && (
          <div className="bg-chess-accent/20 rounded-lg px-4 py-2 text-center">
            <span className="text-chess-accent font-bold text-lg">+{pointsEarned} pts</span>
          </div>
        )}

        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={onNewGame}
            className="w-full min-h-[48px] bg-chess-accent text-chess-accent-fg rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            New Game
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="w-full min-h-[48px] bg-chess-hover text-chess-panel-fg rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
