import { Board, Position, Player, CastlingRights } from '../types/chess';
import { isWhitePiece, isBlackPiece, getPieceColor } from './chess-setup';

export function isSameColorPiece(board: Board, fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
  const fromPiece = board[fromRow][fromCol];
  const toPiece = board[toRow][toCol];
  if (!fromPiece || !toPiece) return false;
  const fromColor = getPieceColor(fromPiece);
  const toColor = getPieceColor(toPiece);
  return fromColor === toColor;
}

export function isValidKnightMove(piece: string, fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
  if (piece !== '♘' && piece !== '♞') return false;

  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);

  if ((rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2)) {
    return true;
  }
  return false;
}

export function isValidRookMove(board: Board, fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
  if (fromRow !== toRow && fromCol !== toCol) return false;

  if (fromRow === toRow) {
    const minCol = Math.min(fromCol, toCol);
    const maxCol = Math.max(fromCol, toCol);
    for (let col = minCol + 1; col < maxCol; col++) {
      if (board[fromRow][col] !== null) return false;
    }
  } else {
    const minRow = Math.min(fromRow, toRow);
    const maxRow = Math.max(fromRow, toRow);
    for (let row = minRow + 1; row < maxRow; row++) {
      if (board[row][fromCol] !== null) return false;
    }
  }
  return true;
}

export function isValidBishopMove(board: Board, fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);
  if (rowDiff !== colDiff) return false;

  const rowDir = toRow > fromRow ? 1 : -1;
  const colDir = toCol > fromCol ? 1 : -1;

  let r = fromRow + rowDir;
  let c = fromCol + colDir;
  while (r !== toRow || c !== toCol) {
    if (board[r][c] !== null) return false;
    r += rowDir;
    c += colDir;
  }
  return true;
}

export function isValidQueenMove(board: Board, fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
  return isValidRookMove(board, fromRow, fromCol, toRow, toCol) ||
    isValidBishopMove(board, fromRow, fromCol, toRow, toCol);
}

export function isValidKingMove(fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);
  return rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff > 0);
}

export function isValidPawnMove(
  board: Board,
  piece: string,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number
): boolean {
  const isWhite = isWhitePiece(piece);
  const direction = isWhite ? 1 : -1;
  const startRow = isWhite ? 1 : 6;

  const rowDiff = toRow - fromRow;
  const colDiff = Math.abs(toCol - fromCol);

  if (colDiff === 0) {
    if (rowDiff === direction) {
      return board[toRow][toCol] === null;
    }
    if (rowDiff === 2 * direction && fromRow === startRow) {
      return board[toRow][toCol] === null && board[fromRow + direction][fromCol] === null;
    }
    return false;
  }

  if (colDiff === 1 && rowDiff === direction) {
    const target = board[toRow][toCol];
    if (target !== null) {
      return isWhite ? isBlackPiece(target) : isWhitePiece(target);
    }
    return false;
  }

  return false;
}

export function isValidMove(
  board: Board,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number
): boolean {
  const piece = board[fromRow][fromCol];
  if (!piece) return false;

  if (fromRow === toRow && fromCol === toCol) return false;
  if (isSameColorPiece(board, fromRow, fromCol, toRow, toCol)) return false;
  if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) return false;

  switch (piece) {
    case '♘': case '♞':
      return isValidKnightMove(piece, fromRow, fromCol, toRow, toCol);
    case '♖': case '♜':
      return isValidRookMove(board, fromRow, fromCol, toRow, toCol);
    case '♗': case '♝':
      return isValidBishopMove(board, fromRow, fromCol, toRow, toCol);
    case '♕': case '♛':
      return isValidQueenMove(board, fromRow, fromCol, toRow, toCol);
    case '♔': case '♚':
      return isValidKingMove(fromRow, fromCol, toRow, toCol);
    case '♙': case '♟':
      return isValidPawnMove(board, piece, fromRow, fromCol, toRow, toCol);
    default:
      return false;
  }
}

export function findKing(board: Board, player: Player): Position | null {
  const kingPiece = player === 'white' ? '♔' : '♚';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (board[row][col] === kingPiece) {
        return { row, col };
      }
    }
  }
  return null;
}

export function isSquareUnderAttack(board: Board, row: number, col: number, byPlayer: Player): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const pieceColor = getPieceColor(piece);
      if (pieceColor !== byPlayer) continue;
      if (isValidMove(board, r, c, row, col)) return true;
    }
  }
  return false;
}

export function isKingInCheck(board: Board, player: Player): boolean {
  const kingPos = findKing(board, player);
  if (!kingPos) return false;
  const opponent: Player = player === 'white' ? 'black' : 'white';
  return isSquareUnderAttack(board, kingPos.row, kingPos.col, opponent);
}

export function applyMove(board: Board, fromRow: number, fromCol: number, toRow: number, toCol: number): Board {
  const newBoard = board.map(row => [...row]);
  newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
  newBoard[fromRow][fromCol] = null;
  return newBoard;
}

export function wouldLeaveKingInCheck(
  board: Board,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  player: Player
): boolean {
  const newBoard = applyMove(board, fromRow, fromCol, toRow, toCol);
  return isKingInCheck(newBoard, player);
}

// ─── Castling helpers ──────────────────────────────────────────────────────

/**
 * Returns true if the player can castle kingside.
 * Conditions: rights granted, squares f & g empty, king not in check,
 * king does not pass through f or land on g while under attack.
 */
export function canCastleKingside(board: Board, player: Player, castlingRights: CastlingRights): boolean {
  const opponent: Player = player === 'white' ? 'black' : 'white';
  const row = player === 'white' ? 0 : 7;
  const hasRight = player === 'white' ? castlingRights.whiteKingside : castlingRights.blackKingside;

  if (!hasRight) return false;

  // Squares between king (col 4) and rook (col 7) must be empty: f(5) and g(6)
  if (board[row][5] !== null || board[row][6] !== null) return false;

  // King must not be in check
  if (isKingInCheck(board, player)) return false;

  // King must not pass through col 5 under attack
  if (isSquareUnderAttack(board, row, 5, opponent)) return false;

  // King must not land on col 6 under attack
  if (isSquareUnderAttack(board, row, 6, opponent)) return false;

  return true;
}

/**
 * Returns true if the player can castle queenside.
 * Conditions: rights granted, squares b,c,d empty, king not in check,
 * king does not pass through d or land on c while under attack.
 */
export function canCastleQueenside(board: Board, player: Player, castlingRights: CastlingRights): boolean {
  const opponent: Player = player === 'white' ? 'black' : 'white';
  const row = player === 'white' ? 0 : 7;
  const hasRight = player === 'white' ? castlingRights.whiteQueenside : castlingRights.blackQueenside;

  if (!hasRight) return false;

  // Squares between king (col 4) and rook (col 0) must be empty: b(1), c(2), d(3)
  if (board[row][1] !== null || board[row][2] !== null || board[row][3] !== null) return false;

  // King must not be in check
  if (isKingInCheck(board, player)) return false;

  // King must not pass through col 3 under attack
  if (isSquareUnderAttack(board, row, 3, opponent)) return false;

  // King must not land on col 2 under attack
  if (isSquareUnderAttack(board, row, 2, opponent)) return false;

  return true;
}

/**
 * Detect if a king move is a castling move (king moves 2 squares horizontally).
 */
export function isCastlingMove(
  board: Board,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number
): boolean {
  const piece = board[fromRow][fromCol];
  if (piece !== '♔' && piece !== '♚') return false;
  if (fromRow !== toRow) return false;
  return Math.abs(toCol - fromCol) === 2;
}

/**
 * Apply a castling move: moves king and rook atomically.
 * Returns the new board (Board = Square[][]).
 */
export function applyCastlingMove(
  board: Board,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number
): Board {
  const newBoard: Board = board.map(row => [...row]);
  const isKingside = toCol > fromCol;

  // Move king
  newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
  newBoard[fromRow][fromCol] = null;

  // Move rook
  if (isKingside) {
    // Rook from h-file (col 7) to f-file (col 5)
    newBoard[fromRow][5] = newBoard[fromRow][7];
    newBoard[fromRow][7] = null;
  } else {
    // Rook from a-file (col 0) to d-file (col 3)
    newBoard[fromRow][3] = newBoard[fromRow][0];
    newBoard[fromRow][0] = null;
  }

  return newBoard;
}

/**
 * Update castling rights after a move.
 * Clears rights when king or rook moves from their starting squares.
 */
export function updateCastlingRights(
  castlingRights: CastlingRights,
  piece: string,
  fromRow: number,
  fromCol: number
): CastlingRights {
  const rights = { ...castlingRights };

  // White king moved
  if (piece === '♔') {
    rights.whiteKingside = false;
    rights.whiteQueenside = false;
  }
  // Black king moved
  if (piece === '♚') {
    rights.blackKingside = false;
    rights.blackQueenside = false;
  }
  // White rooks
  if (piece === '♖') {
    if (fromRow === 0 && fromCol === 7) rights.whiteKingside = false;
    if (fromRow === 0 && fromCol === 0) rights.whiteQueenside = false;
  }
  // Black rooks
  if (piece === '♜') {
    if (fromRow === 7 && fromCol === 7) rights.blackKingside = false;
    if (fromRow === 7 && fromCol === 0) rights.blackQueenside = false;
  }

  return rights;
}
