import { Board, Player } from '../types/chess';
import { isKingInCheck } from './move-validation';
import { hasAnyValidMoves } from './valid-moves';
import type { DrawReason } from '../types/chess';

export interface GameStatusResult {
  status: 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw';
  winner?: Player;
  drawReason?: DrawReason;
}

export function getGameStatus(
  board: Board,
  currentPlayer: Player,
  drawReason?: DrawReason
): GameStatusResult {
  if (drawReason) {
    return { status: 'draw', drawReason };
  }

  const hasLegalMoves = hasAnyValidMoves(board, currentPlayer);

  if (!hasLegalMoves) {
    const inCheck = isKingInCheck(board, currentPlayer);
    if (inCheck) {
      const winner: Player = currentPlayer === 'white' ? 'black' : 'white';
      return { status: 'checkmate', winner };
    } else {
      return { status: 'stalemate', drawReason: 'stalemate' };
    }
  }

  const inCheck = isKingInCheck(board, currentPlayer);
  if (inCheck) {
    return { status: 'check' };
  }

  return { status: 'playing' };
}
