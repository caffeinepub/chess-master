import React, { JSX } from 'react';
import { Board, Position, LastMove, GameResult } from '../types/chess';
import ChessSquare from './ChessSquare';

interface ChessBoardProps {
  board: Board;
  // Support both old (row, col) and new (Position) selection styles
  selectedPosition?: Position | null;
  selectedPiece?: Position | null;
  validMoves: Position[];
  checkKingPosition?: Position | null;
  onSquareClick: (row: number, col: number) => void;
  isAIThinking?: boolean;
  isAutoPlaying?: boolean;
  isGameOver?: boolean;
  gameOverMessage?: string;
  gameOver?: GameResult;
  lastMove?: LastMove | null;
  currentPlayer?: 'white' | 'black';
}

const ChessBoard: React.FC<ChessBoardProps> = ({
  board,
  selectedPosition,
  selectedPiece,
  validMoves,
  checkKingPosition,
  onSquareClick,
  isAIThinking = false,
  isAutoPlaying = false,
  isGameOver,
  gameOverMessage,
  gameOver,
  lastMove = null,
}) => {
  // Support both prop names for selected piece
  const activeSelected = selectedPiece ?? selectedPosition ?? null;
  // Support both isGameOver bool and gameOver result string
  const isOver = isGameOver ?? (gameOver !== null && gameOver !== undefined);
  const isDisabled = isAIThinking || isAutoPlaying || isOver;

  const isValidMoveSquare = (row: number, col: number): boolean => {
    return validMoves.some(pos => pos.row === row && pos.col === col);
  };

  const isSelected = (row: number, col: number): boolean => {
    return activeSelected?.row === row && activeSelected?.col === col;
  };

  const isInCheck = (row: number, col: number): boolean => {
    return checkKingPosition?.row === row && checkKingPosition?.col === col;
  };

  const isLastMoveSquare = (row: number, col: number): boolean => {
    if (!lastMove) return false;
    return (
      (lastMove.from.row === row && lastMove.from.col === col) ||
      (lastMove.to.row === row && lastMove.to.col === col)
    );
  };

  // Build game-over message from gameOver result if no explicit message provided
  const resolvedGameOverMessage = gameOverMessage ?? (() => {
    if (!gameOver) return '';
    if (gameOver === 'draw') return 'Draw!';
    return `${gameOver === 'white' ? 'White' : 'Black'} Wins!`;
  })();

  // Render board from row 7 (top/black side) down to row 0 (bottom/white side)
  const rows: JSX.Element[] = [];
  for (let row = 7; row >= 0; row--) {
    const cols: JSX.Element[] = [];
    for (let col = 0; col < 8; col++) {
      const isLight = (row + col) % 2 === 0;
      cols.push(
        <ChessSquare
          key={`${row}-${col}`}
          piece={board[row][col]}
          isLight={isLight}
          isSelected={isSelected(row, col)}
          isValidMove={isValidMoveSquare(row, col)}
          isInCheck={isInCheck(row, col)}
          isLastMove={isLastMoveSquare(row, col)}
          row={row}
          col={col}
          onClick={() => !isDisabled && onSquareClick(row, col)}
        />
      );
    }
    rows.push(
      <div key={row} className="grid grid-cols-8 w-full">
        {cols}
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[560px]">
      <div
        className="chess-board-container"
        style={{
          boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5)',
          border: '6px solid var(--chess-border)',
          borderRadius: '4px',
          overflow: 'hidden',
          width: '100%',
          opacity: isDisabled && !isOver ? 0.85 : 1,
          transition: 'opacity 0.2s ease',
          cursor: isDisabled ? 'not-allowed' : 'default',
          pointerEvents: isDisabled ? 'none' : 'auto',
        }}
      >
        {rows}
      </div>

      {/* AI Thinking overlay */}
      {isAIThinking && !isOver && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: 'rgba(0,0,0,0.45)',
            pointerEvents: 'all',
            borderRadius: '2px',
            zIndex: 10,
          }}
        >
          <div
            className="flex flex-col items-center gap-3 px-8 py-5 rounded-sm font-chess text-center"
            style={{
              background: 'var(--chess-status-bg)',
              border: '2px solid var(--chess-gold)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
            }}
          >
            <span className="text-2xl" style={{ color: 'var(--chess-gold)' }}>♟</span>
            <div className="flex flex-col items-center gap-2">
              <span
                className="font-chess text-sm tracking-widest uppercase"
                style={{ color: 'var(--chess-gold)' }}
              >
                AI is thinking
              </span>
              <div className="flex items-center gap-1.5">
                <span className="thinking-dot" style={{ background: 'var(--chess-gold)' }} />
                <span className="thinking-dot thinking-dot-2" style={{ background: 'var(--chess-gold)' }} />
                <span className="thinking-dot thinking-dot-3" style={{ background: 'var(--chess-gold)' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Over overlay */}
      {isOver && resolvedGameOverMessage && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: 'rgba(0,0,0,0.72)',
            pointerEvents: 'none',
            borderRadius: '2px',
          }}
        >
          <div
            className="flex flex-col items-center gap-3 px-8 py-6 rounded-sm font-chess text-center"
            style={{
              background: 'var(--chess-status-bg)',
              border: '2px solid var(--chess-gold)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
              maxWidth: '80%',
            }}
          >
            <span className="text-3xl" style={{ color: 'var(--chess-gold)' }}>
              {resolvedGameOverMessage.includes('Checkmate') || resolvedGameOverMessage.includes('Wins')
                ? '♔'
                : resolvedGameOverMessage.includes('Stalemate') || resolvedGameOverMessage.includes('Draw')
                ? '½'
                : '⏱'}
            </span>
            <span
              className="font-chess font-bold text-lg tracking-wide"
              style={{ color: 'var(--chess-text)' }}
            >
              {resolvedGameOverMessage}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChessBoard;
