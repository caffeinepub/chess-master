import { Board, Position, Player } from '../types/chess';
import { isValidMove, wouldLeaveKingInCheck } from './move-validation';
import { getPieceColor } from './chess-setup';

export function getValidMovesForPiece(
  board: Board,
  row: number,
  col: number,
  player: Player
): Position[] {
  const piece = board[row][col];
  if (!piece) return [];
  if (getPieceColor(piece) !== player) return [];

  const moves: Position[] = [];

  for (let toRow = 0; toRow < 8; toRow++) {
    for (let toCol = 0; toCol < 8; toCol++) {
      if (isValidMove(board, row, col, toRow, toCol)) {
        if (!wouldLeaveKingInCheck(board, row, col, toRow, toCol, player)) {
          moves.push({ row: toRow, col: toCol });
        }
      }
    }
  }

  return moves;
}

/**
 * Alias for getValidMovesForPiece using a Position object.
 */
export function getValidMoves(
  board: Board,
  position: Position,
  player: Player
): Position[] {
  return getValidMovesForPiece(board, position.row, position.col, player);
}

export function getAllValidMovesForPlayer(board: Board, player: Player): Map<string, Position[]> {
  const allMoves = new Map<string, Position[]>();

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;
      if (getPieceColor(piece) !== player) continue;

      const moves = getValidMovesForPiece(board, row, col, player);
      if (moves.length > 0) {
        allMoves.set(`${row},${col}`, moves);
      }
    }
  }

  return allMoves;
}

export function hasAnyValidMoves(board: Board, player: Player): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;
      if (getPieceColor(piece) !== player) continue;

      const moves = getValidMovesForPiece(board, row, col, player);
      if (moves.length > 0) return true;
    }
  }
  return false;
}
