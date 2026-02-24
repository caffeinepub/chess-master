import { Board, Position, Player } from '../types/chess';
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
  if (piece !== '♘' && piece !== '♞') return false; // only knights

  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);

  // L-shape: 2 + 1
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
  const direction = isWhite ? 1 : -1; // white moves up (increasing row), black moves down
  const startRow = isWhite ? 1 : 6;

  const rowDiff = toRow - fromRow;
  const colDiff = Math.abs(toCol - fromCol);

  // Forward move (no capture)
  if (colDiff === 0) {
    if (rowDiff === direction) {
      return board[toRow][toCol] === null;
    }
    // Double move from start
    if (rowDiff === 2 * direction && fromRow === startRow) {
      return board[toRow][toCol] === null && board[fromRow + direction][fromCol] === null;
    }
    return false;
  }

  // Diagonal capture
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

  // Can't move to same square
  if (fromRow === toRow && fromCol === toCol) return false;

  // Can't capture own piece
  if (isSameColorPiece(board, fromRow, fromCol, toRow, toCol)) return false;

  // Bounds check
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
