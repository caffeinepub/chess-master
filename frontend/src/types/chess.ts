export type Player = 'white' | 'black';
export type Square = string | null;
export type Board = Square[][];

export type GameMode = 'two-players' | 'one-player' | 'auto-play' | 'online';

export type GameResult = 'white' | 'black' | 'draw' | null;

export type DrawReason = 'stalemate' | 'threefold-repetition' | 'insufficient-material' | null;

export interface Position {
  row: number;
  col: number;
}

export interface CastlingRights {
  whiteKingside: boolean;
  whiteQueenside: boolean;
  blackKingside: boolean;
  blackQueenside: boolean;
}

export interface GameState {
  board: Board;
  currentPlayer: Player;
  selectedPiece: Position | null;
  validMoves: Position[];
  lastMove: { from: Position; to: Position } | null;
  gameOver: boolean;
  result: GameResult;
  drawReason: DrawReason;
  isCheck: boolean;
  castlingRights: CastlingRights;
  enPassantTarget: Position | null;
  moveCount: number;
}

export interface PlayerStatsData {
  points: number;
  wins: number;
  gamesPlayed: number;
  draws: number;
  losses: number;
}
