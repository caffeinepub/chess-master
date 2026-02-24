import { Board, Player, GameResult, DrawReason } from '../types/chess';
import { isInCheck } from './move-validation';
import { hasAnyValidMoves } from './valid-moves';

export interface GameStatusResult {
  status: 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw';
  result: GameResult;
  drawReason: DrawReason;
}

export function getGameStatus(
  board: Board,
  currentPlayer: Player,
  drawReason?: DrawReason
): GameStatusResult {
  if (drawReason) {
    return { status: 'draw', result: 'draw', drawReason };
  }

  const inCheck = isInCheck(board, currentPlayer);
  const hasMoves = hasAnyValidMoves(board, currentPlayer);

  if (!hasMoves) {
    if (inCheck) {
      const winner: GameResult = currentPlayer === 'white' ? 'black' : 'white';
      return { status: 'checkmate', result: winner, drawReason: null };
    } else {
      return { status: 'stalemate', result: 'draw', drawReason: 'stalemate' };
    }
  }

  if (inCheck) {
    return { status: 'check', result: null, drawReason: null };
  }

  return { status: 'playing', result: null, drawReason: null };
}
