import React from 'react';
import ChessSquare from './ChessSquare';
import { Board, Position } from '../types/chess';

interface ChessBoardProps {
  board: Board;
  selectedPiece: Position | null;
  validMoves: Position[];
  lastMove: { from: Position; to: Position } | null;
  checkPosition: Position | null;
  onSquareClick: (pos: Position) => void;
  disabled?: boolean;
  isAIThinking?: boolean;
  flipped?: boolean;
}

export default function ChessBoard({
  board,
  selectedPiece,
  validMoves,
  lastMove,
  checkPosition,
  onSquareClick,
  disabled = false,
  isAIThinking = false,
  flipped = false,
}: ChessBoardProps) {
  const rows = flipped ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const cols = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  const isValidMovePos = (row: number, col: number) =>
    validMoves.some(m => m.row === row && m.col === col);

  const isLastMove = (row: number, col: number) =>
    !!(lastMove && ((lastMove.from.row === row && lastMove.from.col === col) ||
      (lastMove.to.row === row && lastMove.to.col === col)));

  const isCheck = (row: number, col: number) =>
    !!(checkPosition && checkPosition.row === row && checkPosition.col === col);

  return (
    <div className="relative chess-board-container">
      <div className="chess-board grid grid-cols-8 border-2 border-chess-border shadow-chess">
        {rows.map(row =>
          cols.map(col => (
            <ChessSquare
              key={`${row}-${col}`}
              piece={board[row][col]}
              row={row}
              col={col}
              isSelected={!!(selectedPiece && selectedPiece.row === row && selectedPiece.col === col)}
              isValidMove={isValidMovePos(row, col)}
              isLastMove={isLastMove(row, col)}
              isCheck={isCheck(row, col)}
              onClick={onSquareClick}
              disabled={disabled}
            />
          ))
        )}
      </div>

      {isAIThinking && (
        <div className="absolute inset-0 bg-chess-overlay flex items-center justify-center rounded z-40">
          <div className="bg-chess-panel text-chess-panel-fg px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-chess-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">AI thinking…</span>
          </div>
        </div>
      )}
    </div>
  );
}
