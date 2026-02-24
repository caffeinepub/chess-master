import { Board, Player, Position, CastlingRights } from '../types/chess';
import { getAllValidMovesForPlayer, getValidMovesForPiece } from './valid-moves';
import { applyMove, applyCastlingMove, isInCheck } from './move-validation';
import { getPieceColor } from './chess-setup';

const PIECE_VALUES: Record<string, number> = {
  '♙': 100, '♟': -100,
  '♘': 320, '♞': -320,
  '♗': 330, '♝': -330,
  '♖': 500, '♜': -500,
  '♕': 900, '♛': -900,
  '♔': 20000, '♚': -20000,
};

const PAWN_TABLE = [
  [0,0,0,0,0,0,0,0],
  [50,50,50,50,50,50,50,50],
  [10,10,20,30,30,20,10,10],
  [5,5,10,25,25,10,5,5],
  [0,0,0,20,20,0,0,0],
  [5,-5,-10,0,0,-10,-5,5],
  [5,10,10,-20,-20,10,10,5],
  [0,0,0,0,0,0,0,0]
];

const KNIGHT_TABLE = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,0,0,0,0,-20,-40],
  [-30,0,10,15,15,10,0,-30],
  [-30,5,15,20,20,15,5,-30],
  [-30,0,15,20,20,15,0,-30],
  [-30,5,10,15,15,10,5,-30],
  [-40,-20,0,5,5,0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

function evaluateBoard(board: Board): number {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const val = PIECE_VALUES[piece] ?? 0;
      score += val;
      const color = getPieceColor(piece);
      if (piece === '♙') score += PAWN_TABLE[r][c];
      if (piece === '♟') score -= PAWN_TABLE[7 - r][c];
      if (piece === '♘') score += KNIGHT_TABLE[r][c];
      if (piece === '♞') score -= KNIGHT_TABLE[7 - r][c];
    }
  }
  return score;
}

function updateCastlingRights(rights: CastlingRights, from: Position, piece: string): CastlingRights {
  const updated = { ...rights };
  if (piece === '♔') { updated.whiteKingside = false; updated.whiteQueenside = false; }
  if (piece === '♚') { updated.blackKingside = false; updated.blackQueenside = false; }
  if (from.row === 7 && from.col === 0) updated.whiteQueenside = false;
  if (from.row === 7 && from.col === 7) updated.whiteKingside = false;
  if (from.row === 0 && from.col === 0) updated.blackQueenside = false;
  if (from.row === 0 && from.col === 7) updated.blackKingside = false;
  return updated;
}

function isCastlingMove(board: Board, from: Position, to: Position, player: Player): boolean {
  const piece = board[from.row][from.col];
  if ((piece !== '♔' && piece !== '♚')) return false;
  return Math.abs(to.col - from.col) === 2;
}

function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  player: Player,
  castlingRights: CastlingRights,
  enPassantTarget: Position | null
): number {
  if (depth === 0) return evaluateBoard(board);

  const moves = getAllValidMovesForPlayer(board, player, enPassantTarget, castlingRights);
  if (moves.length === 0) {
    if (isInCheck(board, player)) {
      return isMaximizing ? -100000 : 100000;
    }
    return 0;
  }

  const opponent: Player = player === 'white' ? 'black' : 'white';

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const piece = board[move.from.row][move.from.col];
      let newBoard: Board;
      if (piece && isCastlingMove(board, move.from, move.to, player)) {
        newBoard = applyCastlingMove(board, move.from, move.to);
      } else {
        newBoard = applyMove(board, move.from, move.to, player, enPassantTarget);
      }
      const newRights = piece ? updateCastlingRights(castlingRights, move.from, piece) : castlingRights;
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, false, opponent, newRights, null);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const piece = board[move.from.row][move.from.col];
      let newBoard: Board;
      if (piece && isCastlingMove(board, move.from, move.to, player)) {
        newBoard = applyCastlingMove(board, move.from, move.to);
      } else {
        newBoard = applyMove(board, move.from, move.to, player, enPassantTarget);
      }
      const newRights = piece ? updateCastlingRights(castlingRights, move.from, piece) : castlingRights;
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, true, opponent, newRights, null);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function getBestMove(
  board: Board,
  player: Player,
  castlingRights: CastlingRights,
  enPassantTarget: Position | null,
  depth: number = 3
): { from: Position; to: Position } | null {
  const moves = getAllValidMovesForPlayer(board, player, enPassantTarget, castlingRights);
  if (moves.length === 0) return null;

  const isMaximizing = player === 'white';
  let bestMove = moves[0];
  let bestScore = isMaximizing ? -Infinity : Infinity;

  for (const move of moves) {
    const piece = board[move.from.row][move.from.col];
    let newBoard: Board;
    if (piece && isCastlingMove(board, move.from, move.to, player)) {
      newBoard = applyCastlingMove(board, move.from, move.to);
    } else {
      newBoard = applyMove(board, move.from, move.to, player, enPassantTarget);
    }
    const newRights = piece ? updateCastlingRights(castlingRights, move.from, piece) : castlingRights;
    const opponent: Player = player === 'white' ? 'black' : 'white';
    const score = minimax(newBoard, depth - 1, -Infinity, Infinity, !isMaximizing, opponent, newRights, null);

    if (isMaximizing ? score > bestScore : score < bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
