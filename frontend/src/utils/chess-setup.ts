import { Board } from '../types/chess';

export function createInitialBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

  // Black pieces (row 7 = rank 8 in standard chess, top of board)
  board[7][0] = '♜'; // Black Rook
  board[7][1] = '♞'; // Black Knight
  board[7][2] = '♝'; // Black Bishop
  board[7][3] = '♛'; // Black Queen
  board[7][4] = '♚'; // Black King
  board[7][5] = '♝'; // Black Bishop
  board[7][6] = '♞'; // Black Knight
  board[7][7] = '♜'; // Black Rook

  // Black pawns
  for (let col = 0; col < 8; col++) {
    board[6][col] = '♟'; // Black Pawn
  }

  // White pawns
  for (let col = 0; col < 8; col++) {
    board[1][col] = '♙'; // White Pawn
  }

  // White pieces (row 0 = rank 1, bottom of board)
  board[0][0] = '♖'; // White Rook
  board[0][1] = '♘'; // White Knight
  board[0][2] = '♗'; // White Bishop
  board[0][3] = '♕'; // White Queen
  board[0][4] = '♔'; // White King
  board[0][5] = '♗'; // White Bishop
  board[0][6] = '♘'; // White Knight
  board[0][7] = '♖'; // White Rook

  return board;
}

export const WHITE_PIECES = new Set(['♔', '♕', '♖', '♗', '♘', '♙']);
export const BLACK_PIECES = new Set(['♚', '♛', '♜', '♝', '♞', '♟']);

export function isWhitePiece(piece: string): boolean {
  return WHITE_PIECES.has(piece);
}

export function isBlackPiece(piece: string): boolean {
  return BLACK_PIECES.has(piece);
}

export function getPieceColor(piece: string): 'white' | 'black' | null {
  if (isWhitePiece(piece)) return 'white';
  if (isBlackPiece(piece)) return 'black';
  return null;
}
