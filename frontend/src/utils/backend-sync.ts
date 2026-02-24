import { Board } from '../types/chess';
import { Piece, PieceType, Color } from '../backend';

const unicodeToPieceType: Record<string, PieceType> = {
  '♙': PieceType.pawn, '♟': PieceType.pawn,
  '♘': PieceType.knight, '♞': PieceType.knight,
  '♗': PieceType.bishop, '♝': PieceType.bishop,
  '♖': PieceType.rook, '♜': PieceType.rook,
  '♕': PieceType.queen, '♛': PieceType.queen,
  '♔': PieceType.king, '♚': PieceType.king,
};

const unicodeToColor: Record<string, Color> = {
  '♙': Color.white, '♘': Color.white, '♗': Color.white,
  '♖': Color.white, '♕': Color.white, '♔': Color.white,
  '♟': Color.black, '♞': Color.black, '♝': Color.black,
  '♜': Color.black, '♛': Color.black, '♚': Color.black,
};

const pieceTypeToUnicode: Record<string, Record<string, string>> = {
  [PieceType.pawn]: { [Color.white]: '♙', [Color.black]: '♟' },
  [PieceType.knight]: { [Color.white]: '♘', [Color.black]: '♞' },
  [PieceType.bishop]: { [Color.white]: '♗', [Color.black]: '♝' },
  [PieceType.rook]: { [Color.white]: '♖', [Color.black]: '♜' },
  [PieceType.queen]: { [Color.white]: '♕', [Color.black]: '♛' },
  [PieceType.king]: { [Color.white]: '♔', [Color.black]: '♚' },
};

export function frontendToBackendBoard(board: Board): Array<Array<Piece | null>> {
  return board.map((row, r) =>
    row.map((sq, c) => {
      if (!sq) return null;
      return {
        pieceType: unicodeToPieceType[sq],
        color: unicodeToColor[sq],
        position: { x: BigInt(c), y: BigInt(r) },
      } as Piece;
    })
  );
}

export function backendToFrontendBoard(backendBoard: Array<Array<Piece | null>>): Board {
  return backendBoard.map(row =>
    row.map(piece => {
      if (!piece) return null;
      return pieceTypeToUnicode[piece.pieceType]?.[piece.color] ?? null;
    })
  );
}
