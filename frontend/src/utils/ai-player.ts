import { Board, Player, Position, CastlingRights } from '../types/chess';
import { getAllValidMovesForPlayer } from './valid-moves';
import { applyMove, applyCastlingMove, isCastlingMove, isKingInCheck, updateCastlingRights } from './move-validation';
import { getPieceColor } from './chess-setup';

export interface AIMove {
  from: Position;
  to: Position;
}

// Material values
const PIECE_VALUES: Record<string, number> = {
  '♙': 100, '♟': 100,     // pawns
  '♘': 320, '♞': 320,     // knights
  '♗': 330, '♝': 330,     // bishops
  '♖': 500, '♜': 500,     // rooks
  '♕': 900, '♛': 900,     // queens
  '♔': 20000, '♚': 20000, // kings
};

// Positional bonus tables (from white's perspective, row 0 = rank 8)
const PAWN_TABLE = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0],
];

const KNIGHT_TABLE = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50],
];

const BISHOP_TABLE = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20],
];

const ROOK_TABLE = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [0,  0,  0,  5,  5,  0,  0,  0],
];

const QUEEN_TABLE = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [-5,  0,  5,  5,  5,  5,  0, -5],
  [0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  0,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20],
];

const KING_MIDDLE_TABLE = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [20, 20,  0,  0,  0,  0, 20, 20],
  [20, 30, 10,  0,  0, 10, 30, 20],
];

function getPositionalBonus(piece: string, row: number, col: number): number {
  // For black pieces, mirror the table vertically
  const isBlack = getPieceColor(piece) === 'black';
  const r = isBlack ? 7 - row : row;

  switch (piece) {
    case '♙': case '♟': return PAWN_TABLE[r][col];
    case '♘': case '♞': return KNIGHT_TABLE[r][col];
    case '♗': case '♝': return BISHOP_TABLE[r][col];
    case '♖': case '♜': return ROOK_TABLE[r][col];
    case '♕': case '♛': return QUEEN_TABLE[r][col];
    case '♔': case '♚': return KING_MIDDLE_TABLE[r][col];
    default: return 0;
  }
}

// Evaluate the board from the perspective of `player` (positive = good for player)
function evaluateBoard(board: Board, player: Player): number {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const color = getPieceColor(piece);
      const value = (PIECE_VALUES[piece] ?? 0) + getPositionalBonus(piece, r, c);
      if (color === player) {
        score += value;
      } else {
        score -= value;
      }
    }
  }
  return score;
}

// Apply a move (regular or castling) and return the new board
function applyAIMove(board: Board, fromRow: number, fromCol: number, toRow: number, toCol: number): Board {
  if (isCastlingMove(board, fromRow, fromCol, toRow, toCol)) {
    return applyCastlingMove(board, fromRow, fromCol, toRow, toCol);
  }
  return applyMove(board, fromRow, fromCol, toRow, toCol);
}

// Minimax with alpha-beta pruning
function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  player: Player,
  opponent: Player,
  castlingRights: CastlingRights
): number {
  if (depth === 0) {
    return evaluateBoard(board, player);
  }

  const currentMover: Player = isMaximizing ? player : opponent;
  const allMoves = getAllValidMovesForPlayer(board, currentMover, castlingRights);

  if (allMoves.size === 0) {
    if (isKingInCheck(board, currentMover)) {
      return isMaximizing ? -100000 + depth : 100000 - depth;
    }
    return 0;
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    outer: for (const [posKey, destinations] of allMoves) {
      const [rowStr, colStr] = posKey.split(',');
      const fromRow = parseInt(rowStr);
      const fromCol = parseInt(colStr);
      const movingPiece = board[fromRow][fromCol];
      for (const to of destinations) {
        const newBoard = applyAIMove(board, fromRow, fromCol, to.row, to.col);
        if (newBoard[to.row][to.col] === '♙' && to.row === 7) newBoard[to.row][to.col] = '♕';
        if (newBoard[to.row][to.col] === '♟' && to.row === 0) newBoard[to.row][to.col] = '♛';

        const newRights = movingPiece
          ? updateCastlingRights(castlingRights, movingPiece, fromRow, fromCol)
          : castlingRights;

        const evalScore = minimax(newBoard, depth - 1, alpha, beta, false, player, opponent, newRights);
        if (evalScore > maxEval) maxEval = evalScore;
        if (evalScore > alpha) alpha = evalScore;
        if (beta <= alpha) break outer;
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    outer: for (const [posKey, destinations] of allMoves) {
      const [rowStr, colStr] = posKey.split(',');
      const fromRow = parseInt(rowStr);
      const fromCol = parseInt(colStr);
      const movingPiece = board[fromRow][fromCol];
      for (const to of destinations) {
        const newBoard = applyAIMove(board, fromRow, fromCol, to.row, to.col);
        if (newBoard[to.row][to.col] === '♙' && to.row === 7) newBoard[to.row][to.col] = '♕';
        if (newBoard[to.row][to.col] === '♟' && to.row === 0) newBoard[to.row][to.col] = '♛';

        const newRights = movingPiece
          ? updateCastlingRights(castlingRights, movingPiece, fromRow, fromCol)
          : castlingRights;

        const evalScore = minimax(newBoard, depth - 1, alpha, beta, true, player, opponent, newRights);
        if (evalScore < minEval) minEval = evalScore;
        if (evalScore < beta) beta = evalScore;
        if (beta <= alpha) break outer;
      }
    }
    return minEval;
  }
}

export function selectAIMove(
  board: Board,
  player: Player,
  castlingRights?: CastlingRights
): AIMove | null {
  const rights: CastlingRights = castlingRights ?? {
    whiteKingside: false,
    whiteQueenside: false,
    blackKingside: false,
    blackQueenside: false,
  };

  const allMoves = getAllValidMovesForPlayer(board, player, rights);
  if (allMoves.size === 0) return null;

  const opponent: Player = player === 'white' ? 'black' : 'white';
  const DEPTH = 3;

  let bestMove: AIMove | null = null;
  let bestScore = -Infinity;

  for (const [posKey, destinations] of allMoves) {
    const [rowStr, colStr] = posKey.split(',');
    const from: Position = { row: parseInt(rowStr), col: parseInt(colStr) };
    const movingPiece = board[from.row][from.col];

    for (const to of destinations) {
      const newBoard = applyAIMove(board, from.row, from.col, to.row, to.col);
      if (newBoard[to.row][to.col] === '♙' && to.row === 7) newBoard[to.row][to.col] = '♕';
      if (newBoard[to.row][to.col] === '♟' && to.row === 0) newBoard[to.row][to.col] = '♛';

      const newRights = movingPiece
        ? updateCastlingRights(rights, movingPiece, from.row, from.col)
        : rights;

      const score = minimax(newBoard, DEPTH - 1, -Infinity, Infinity, false, player, opponent, newRights);
      const noisyScore = score + Math.random() * 0.5;

      if (noisyScore > bestScore) {
        bestScore = noisyScore;
        bestMove = { from, to };
      }
    }
  }

  return bestMove;
}

/**
 * Alias for selectAIMove — used by ChessGame.tsx.
 */
export function getBestMove(
  board: Board,
  player: Player,
  castlingRights?: CastlingRights
): AIMove | null {
  return selectAIMove(board, player, castlingRights);
}
