import { Board, Position, Player, CastlingRights } from '../types/chess';
import { getPieceColor } from './chess-setup';

export function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function isEnemy(piece: string, player: Player): boolean {
  const color = getPieceColor(piece);
  return color !== null && color !== player;
}

function isFriendly(piece: string, player: Player): boolean {
  const color = getPieceColor(piece);
  return color === player;
}

export function isValidPawnMove(
  board: Board,
  from: Position,
  to: Position,
  player: Player,
  enPassantTarget: Position | null
): boolean {
  const dr = to.row - from.row;
  const dc = to.col - from.col;
  const dir = player === 'white' ? -1 : 1;
  const startRow = player === 'white' ? 6 : 1;

  if (dc === 0) {
    if (dr === dir && !board[to.row][to.col]) return true;
    if (dr === 2 * dir && from.row === startRow && !board[from.row + dir][from.col] && !board[to.row][to.col]) return true;
  } else if (Math.abs(dc) === 1 && dr === dir) {
    if (board[to.row][to.col] && isEnemy(board[to.row][to.col]!, player)) return true;
    if (enPassantTarget && enPassantTarget.row === to.row && enPassantTarget.col === to.col) return true;
  }
  return false;
}

export function isValidKnightMove(from: Position, to: Position): boolean {
  const dr = Math.abs(to.row - from.row);
  const dc = Math.abs(to.col - from.col);
  return (dr === 2 && dc === 1) || (dr === 1 && dc === 2);
}

export function isValidBishopMove(board: Board, from: Position, to: Position, player: Player): boolean {
  const dr = to.row - from.row;
  const dc = to.col - from.col;
  if (Math.abs(dr) !== Math.abs(dc)) return false;
  const rowDir = dr > 0 ? 1 : -1;
  const colDir = dc > 0 ? 1 : -1;
  let r = from.row + rowDir, c = from.col + colDir;
  while (r !== to.row || c !== to.col) {
    if (board[r][c]) return false;
    r += rowDir; c += colDir;
  }
  const target = board[to.row][to.col];
  return !target || isEnemy(target, player);
}

export function isValidRookMove(board: Board, from: Position, to: Position, player: Player): boolean {
  if (from.row !== to.row && from.col !== to.col) return false;
  const rowDir = to.row > from.row ? 1 : to.row < from.row ? -1 : 0;
  const colDir = to.col > from.col ? 1 : to.col < from.col ? -1 : 0;
  let r = from.row + rowDir, c = from.col + colDir;
  while (r !== to.row || c !== to.col) {
    if (board[r][c]) return false;
    r += rowDir; c += colDir;
  }
  const target = board[to.row][to.col];
  return !target || isEnemy(target, player);
}

export function isValidQueenMove(board: Board, from: Position, to: Position, player: Player): boolean {
  return isValidBishopMove(board, from, to, player) || isValidRookMove(board, from, to, player);
}

export function isValidKingMove(board: Board, from: Position, to: Position, player: Player): boolean {
  const dr = Math.abs(to.row - from.row);
  const dc = Math.abs(to.col - from.col);
  if (dr > 1 || dc > 1) return false;
  const target = board[to.row][to.col];
  return !target || isEnemy(target, player);
}

export function isValidMove(
  board: Board,
  from: Position,
  to: Position,
  player: Player,
  enPassantTarget: Position | null = null
): boolean {
  if (!isInBounds(to.row, to.col)) return false;
  const piece = board[from.row][from.col];
  if (!piece) return false;
  if (isFriendly(board[to.row][to.col] ?? '', player)) return false;

  switch (piece) {
    case '♙': case '♟': return isValidPawnMove(board, from, to, player, enPassantTarget);
    case '♘': case '♞': return isValidKnightMove(from, to);
    case '♗': case '♝': return isValidBishopMove(board, from, to, player);
    case '♖': case '♜': return isValidRookMove(board, from, to, player);
    case '♕': case '♛': return isValidQueenMove(board, from, to, player);
    case '♔': case '♚': return isValidKingMove(board, from, to, player);
    default: return false;
  }
}

export function applyMove(
  board: Board,
  from: Position,
  to: Position,
  player: Player,
  enPassantTarget: Position | null = null
): Board {
  const newBoard: Board = board.map(row => [...row]);
  const piece = newBoard[from.row][from.col];
  newBoard[to.row][to.col] = piece;
  newBoard[from.row][from.col] = null;

  // En passant capture
  if ((piece === '♙' || piece === '♟') && enPassantTarget &&
    to.row === enPassantTarget.row && to.col === enPassantTarget.col) {
    const captureRow = player === 'white' ? to.row + 1 : to.row - 1;
    newBoard[captureRow][to.col] = null;
  }

  // Pawn promotion
  if (piece === '♙' && to.row === 0) newBoard[to.row][to.col] = '♕';
  if (piece === '♟' && to.row === 7) newBoard[to.row][to.col] = '♛';

  return newBoard;
}

export function applyCastlingMove(board: Board, from: Position, to: Position): Board {
  const newBoard: Board = board.map(row => [...row]);
  const piece = newBoard[from.row][from.col];
  newBoard[to.row][to.col] = piece;
  newBoard[from.row][from.col] = null;

  // Move rook
  if (to.col === 6) {
    newBoard[from.row][5] = newBoard[from.row][7];
    newBoard[from.row][7] = null;
  } else if (to.col === 2) {
    newBoard[from.row][3] = newBoard[from.row][0];
    newBoard[from.row][0] = null;
  }

  return newBoard;
}

export function isSquareAttacked(board: Board, pos: Position, byPlayer: Player): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece || getPieceColor(piece) !== byPlayer) continue;
      if (isValidMove(board, { row: r, col: c }, pos, byPlayer, null)) return true;
    }
  }
  return false;
}

export function isInCheck(board: Board, player: Player): boolean {
  const king = player === 'white' ? '♔' : '♚';
  let kingPos: Position | null = null;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === king) { kingPos = { row: r, col: c }; break; }
    }
    if (kingPos) break;
  }
  if (!kingPos) return false;
  const opponent: Player = player === 'white' ? 'black' : 'white';
  return isSquareAttacked(board, kingPos, opponent);
}

export function canCastle(
  board: Board,
  player: Player,
  side: 'kingside' | 'queenside',
  castlingRights: CastlingRights
): boolean {
  const row = player === 'white' ? 7 : 0;
  const opponent: Player = player === 'white' ? 'black' : 'white';

  if (side === 'kingside') {
    if (player === 'white' && !castlingRights.whiteKingside) return false;
    if (player === 'black' && !castlingRights.blackKingside) return false;
    if (board[row][5] || board[row][6]) return false;
    if (isSquareAttacked(board, { row, col: 4 }, opponent)) return false;
    if (isSquareAttacked(board, { row, col: 5 }, opponent)) return false;
    if (isSquareAttacked(board, { row, col: 6 }, opponent)) return false;
  } else {
    if (player === 'white' && !castlingRights.whiteQueenside) return false;
    if (player === 'black' && !castlingRights.blackQueenside) return false;
    if (board[row][1] || board[row][2] || board[row][3]) return false;
    if (isSquareAttacked(board, { row, col: 4 }, opponent)) return false;
    if (isSquareAttacked(board, { row, col: 3 }, opponent)) return false;
    if (isSquareAttacked(board, { row, col: 2 }, opponent)) return false;
  }
  return true;
}
