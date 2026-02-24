import { Board, Player } from '../types/chess';

export type PositionHistory = Map<string, number>;

export function serializePosition(board: Board, player: Player): string {
  return board.map(row => row.map(sq => sq ?? '.').join('')).join('|') + ':' + player;
}

export function trackPosition(history: PositionHistory, board: Board, player: Player): PositionHistory {
  const key = serializePosition(board, player);
  const count = (history.get(key) ?? 0) + 1;
  history.set(key, count);
  return history;
}

export function hasThreefoldRepetition(history: PositionHistory, board: Board, player: Player): boolean {
  const key = serializePosition(board, player);
  return (history.get(key) ?? 0) >= 3;
}

export function clearPositionHistory(history: PositionHistory): PositionHistory {
  history.clear();
  return history;
}
