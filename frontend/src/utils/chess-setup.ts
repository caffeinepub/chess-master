import { Board, Player } from '../types/chess';

export function createInitialBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

  // Black pieces (top)
  board[0][0] = '♜'; board[0][1] = '♞'; board[0][2] = '♝'; board[0][3] = '♛';
  board[0][4] = '♚'; board[0][5] = '♝'; board[0][6] = '♞'; board[0][7] = '♜';
  for (let c = 0; c < 8; c++) board[1][c] = '♟';

  // White pieces (bottom)
  board[7][0] = '♖'; board[7][1] = '♘'; board[7][2] = '♗'; board[7][3] = '♕';
  board[7][4] = '♔'; board[7][5] = '♗'; board[7][6] = '♘'; board[7][7] = '♖';
  for (let c = 0; c < 8; c++) board[6][c] = '♙';

  return board;
}

export function getPieceColor(piece: string): Player | null {
  if (!piece) return null;
  const whitePieces = '♔♕♖♗♘♙';
  const blackPieces = '♚♛♜♝♞♟';
  if (whitePieces.includes(piece)) return 'white';
  if (blackPieces.includes(piece)) return 'black';
  return null;
}

export function isWhitePiece(piece: string): boolean {
  return getPieceColor(piece) === 'white';
}

export function isBlackPiece(piece: string): boolean {
  return getPieceColor(piece) === 'black';
}
