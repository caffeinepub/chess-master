// Core piece/board types (kept for backward compatibility with existing utils)
export type Piece = string; // Unicode chess symbols
export type Square = Piece | null;
export type Board = Square[][];
export type Player = 'white' | 'black';

export type GameMode = 'two-players' | 'one-player' | 'auto-play' | 'online';
export type GameResult = 'white' | 'black' | 'draw' | null;
export type DrawReason = 'stalemate' | 'threefold';

export interface Position {
  row: number;
  col: number;
}

export interface LastMove {
  from: Position;
  to: Position;
}

export interface GameState {
  board: Board;
  currentPlayer: Player;
  selectedPiece: Position | null;
  gameOver: GameResult;
  drawReason?: DrawReason;
  isCheck: boolean;
  lastMove: LastMove | null;
  // Online game fields
  gameId?: string;
  whitePlayer?: string;
  blackPlayer?: string;
  playerColor?: Player;
}
