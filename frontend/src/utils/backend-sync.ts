import type { Piece, Color, PieceType } from '../backend';

// Unicode piece map: white pieces are uppercase, black are lowercase
const PIECE_TO_UNICODE: Record<string, Record<string, string>> = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙',
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
  },
};

const UNICODE_TO_PIECE: Record<string, { color: Color; pieceType: PieceType }> = {
  '♔': { color: 'white' as Color, pieceType: 'king' as PieceType },
  '♕': { color: 'white' as Color, pieceType: 'queen' as PieceType },
  '♖': { color: 'white' as Color, pieceType: 'rook' as PieceType },
  '♗': { color: 'white' as Color, pieceType: 'bishop' as PieceType },
  '♘': { color: 'white' as Color, pieceType: 'knight' as PieceType },
  '♙': { color: 'white' as Color, pieceType: 'pawn' as PieceType },
  '♚': { color: 'black' as Color, pieceType: 'king' as PieceType },
  '♛': { color: 'black' as Color, pieceType: 'queen' as PieceType },
  '♜': { color: 'black' as Color, pieceType: 'rook' as PieceType },
  '♝': { color: 'black' as Color, pieceType: 'bishop' as PieceType },
  '♞': { color: 'black' as Color, pieceType: 'knight' as PieceType },
  '♟': { color: 'black' as Color, pieceType: 'pawn' as PieceType },
};

/**
 * Converts a frontend Unicode board to a backend Piece[][] board.
 */
export function frontendToBackendBoard(board: (string | null)[][]): (Piece | null)[][] {
  return board.map((row, rowIdx) =>
    row.map((cell, colIdx) => {
      if (!cell) return null;
      const pieceInfo = UNICODE_TO_PIECE[cell];
      if (!pieceInfo) return null;
      return {
        color: pieceInfo.color,
        pieceType: pieceInfo.pieceType,
        position: { x: BigInt(colIdx), y: BigInt(rowIdx) },
      } as Piece;
    })
  );
}

/**
 * Converts a backend Piece[][] board to a frontend Unicode board.
 */
export function backendToFrontendBoard(boardArray: (Piece | null)[][]): (string | null)[][] {
  return boardArray.map(row =>
    row.map(cell => {
      if (!cell) return null;
      const colorKey = cell.color === 'white' ? 'white' : 'black';
      const typeKey = cell.pieceType as string;
      return PIECE_TO_UNICODE[colorKey]?.[typeKey] ?? null;
    })
  );
}
