import React from 'react';
import type { GameResult, DrawReason } from '../types/chess';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Handshake, Star } from 'lucide-react';

interface GameResultsPanelProps {
  open: boolean;
  gameOver: GameResult;
  drawReason?: DrawReason;
  pointsEarned: number;
  isAuthenticated: boolean;
  onNewGame: () => void;
  onClose: () => void;
}

export default function GameResultsPanel({
  open,
  gameOver,
  drawReason,
  pointsEarned,
  isAuthenticated,
  onNewGame,
  onClose,
}: GameResultsPanelProps) {
  const getMessage = () => {
    if (gameOver === 'draw') {
      if (drawReason === 'threefold') return 'Draw – Threefold Repetition!';
      return 'Draw – Stalemate!';
    }
    if (gameOver === 'white') return 'White Wins!';
    if (gameOver === 'black') return 'Black Wins!';
    return 'Game Over';
  };

  const getIcon = () => {
    if (gameOver === 'draw') return <Handshake size={40} className="text-chess-gold/80" />;
    return <Trophy size={40} className="text-chess-gold" />;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-chess-dark border border-chess-gold/40 text-chess-cream max-w-sm text-center">
        <DialogHeader>
          <div className="flex justify-center mb-2">{getIcon()}</div>
          <DialogTitle className="text-chess-gold font-playfair text-2xl text-center">
            {getMessage()}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {isAuthenticated && pointsEarned > 0 && (
            <div className="flex items-center justify-center gap-2 py-3 rounded-lg bg-chess-gold/10 border border-chess-gold/30">
              <Star size={18} className="text-chess-gold" />
              <span className="text-chess-gold font-bold text-lg">+{pointsEarned} points earned!</span>
            </div>
          )}
          {!isAuthenticated && (
            <p className="text-chess-cream/60 text-sm">Login to earn points and track your wins!</p>
          )}
          <div className="flex gap-3">
            <Button
              onClick={onNewGame}
              className="flex-1 bg-chess-gold text-chess-dark hover:bg-chess-gold/90 font-semibold"
            >
              New Game
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-chess-gold/40 text-chess-gold/80 hover:bg-chess-gold/10"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
