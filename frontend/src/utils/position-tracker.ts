// Utility for tracking board positions to detect threefold repetition

export type PositionHistory = Map<string, number>;

/**
 * Serializes the board state + active player into a string key.
 * Uses the Unicode piece characters directly since that's what the frontend board uses.
 */
export function serializePosition(board: (string | null)[][], activePlayer: 'white' | 'black'): string {
  const boardStr = board.map(row => row.map(cell => cell ?? '.').join('')).join('|');
  return `${activePlayer}:${boardStr}`;
}

/**
 * Records the current position in the history map.
 * Returns the updated map (mutates in place for performance).
 */
export function trackPosition(
  positionHistory: PositionHistory,
  board: (string | null)[][],
  activePlayer: 'white' | 'black'
): PositionHistory {
  const key = serializePosition(board, activePlayer);
  const count = positionHistory.get(key) ?? 0;
  positionHistory.set(key, count + 1);
  return positionHistory;
}

/**
 * Returns true if any position has occurred 3 or more times.
 */
export function hasThreefoldRepetition(positionHistory: PositionHistory): boolean {
  for (const count of positionHistory.values()) {
    if (count >= 3) return true;
  }
  return false;
}

/**
 * Returns a fresh empty position history map.
 */
export function clearPositionHistory(): PositionHistory {
  return new Map<string, number>();
}
