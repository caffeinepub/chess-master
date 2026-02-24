import { Board, Position, Player, CastlingRights } from '../types/chess';
import {
  isValidMove,
  wouldLeaveKingInCheck,
  canCastleKingside,
  canCastleQueenside,
} from './move-validation';
import { getPieceColor } from './chess-setup';

const DEFAULT_CASTLING_RIGHTS: CastlingRights = {
  whiteKingside: false,
  whiteQueenside: false,
  blackKingside: false,
  blackQueenside: false,
};

export function getValidMovesForPiece(
  board: Board,
  row: number,
  col: number,
  player: Player,
  castlingRights: CastlingRights = DEFAULT_CASTLING_RIGHTS
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

  // Add castling moves for king
  if (piece === '♔' || piece === '♚') {
    const castleRow = player === 'white' ? 0 : 7;
    if (row === castleRow && col === 4) {
      // Kingside castling → king moves to col 6
      if (canCastleKingside(board, player, castlingRights)) {
        moves.push({ row: castleRow, col: 6 });
      }
      // Queenside castling → king moves to col 2
      if (canCastleQueenside(board, player, castlingRights)) {
        moves.push({ row: castleRow, col: 2 });
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
  player: Player,
  castlingRights: CastlingRights = DEFAULT_CASTLING_RIGHTS
): Position[] {
  return getValidMovesForPiece(board, position.row, position.col, player, castlingRights);
}

export function getAllValidMovesForPlayer(
  board: Board,
  player: Player,
  castlingRights: CastlingRights = DEFAULT_CASTLING_RIGHTS
): Map<string, Position[]> {
  const allMoves = new Map<string, Position[]>();

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;
      if (getPieceColor(piece) !== player) continue;

      const moves = getValidMovesForPiece(board, row, col, player, castlingRights);
      if (moves.length > 0) {
        allMoves.set(`${row},${col}`, moves);
      }
    }
  }

  return allMoves;
}

export function hasAnyValidMoves(
  board: Board,
  player: Player,
  castlingRights: CastlingRights = DEFAULT_CASTLING_RIGHTS
): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;
      if (getPieceColor(piece) !== player) continue;

      const moves = getValidMovesForPiece(board, row, col, player, castlingRights);
      if (moves.length > 0) return true;
    }
  }
  return false;
}
