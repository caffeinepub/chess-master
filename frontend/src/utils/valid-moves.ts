import { Board, Position, Player, CastlingRights } from '../types/chess';
import { isValidMove, applyMove, isInCheck, canCastle } from './move-validation';
import { getPieceColor } from './chess-setup';

export function getValidMovesForPiece(
  board: Board,
  pos: Position,
  player: Player,
  enPassantTarget: Position | null = null,
  castlingRights?: CastlingRights
): Position[] {
  const moves: Position[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const to = { row: r, col: c };
      if (isValidMove(board, pos, to, player, enPassantTarget)) {
        const newBoard = applyMove(board, pos, to, player, enPassantTarget);
        if (!isInCheck(newBoard, player)) {
          moves.push(to);
        }
      }
    }
  }

  // Castling
  if (castlingRights) {
    const piece = board[pos.row][pos.col];
    if ((piece === '♔' && player === 'white') || (piece === '♚' && player === 'black')) {
      const row = player === 'white' ? 7 : 0;
      if (pos.row === row && pos.col === 4) {
        if (canCastle(board, player, 'kingside', castlingRights)) {
          moves.push({ row, col: 6 });
        }
        if (canCastle(board, player, 'queenside', castlingRights)) {
          moves.push({ row, col: 2 });
        }
      }
    }
  }

  return moves;
}

export function getValidMoves(
  board: Board,
  pos: Position,
  enPassantTarget: Position | null,
  player: Player,
  castlingRights?: CastlingRights
): Position[] {
  const piece = board[pos.row][pos.col];
  if (!piece || getPieceColor(piece) !== player) return [];
  return getValidMovesForPiece(board, pos, player, enPassantTarget, castlingRights);
}

export function getAllValidMovesForPlayer(
  board: Board,
  player: Player,
  enPassantTarget: Position | null = null,
  castlingRights?: CastlingRights
): { from: Position; to: Position }[] {
  const moves: { from: Position; to: Position }[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece || getPieceColor(piece) !== player) continue;
      const pieceMoves = getValidMovesForPiece(board, { row: r, col: c }, player, enPassantTarget, castlingRights);
      for (const to of pieceMoves) {
        moves.push({ from: { row: r, col: c }, to });
      }
    }
  }
  return moves;
}

export function hasAnyValidMoves(
  board: Board,
  player: Player,
  enPassantTarget: Position | null = null,
  castlingRights?: CastlingRights
): boolean {
  return getAllValidMovesForPlayer(board, player, enPassantTarget, castlingRights).length > 0;
}
