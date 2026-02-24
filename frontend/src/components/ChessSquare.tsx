import React from 'react';
import { Position } from '../types/chess';

interface ChessSquareProps {
  piece: string | null;
  row: number;
  col: number;
  isSelected: boolean;
  isValidMove: boolean;
  isLastMove: boolean;
  isCheck: boolean;
  onClick: (pos: Position) => void;
  disabled?: boolean;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export default function ChessSquare({
  piece,
  row,
  col,
  isSelected,
  isValidMove,
  isLastMove,
  isCheck,
  onClick,
  disabled = false,
}: ChessSquareProps) {
  const isLight = (row + col) % 2 === 0;

  let bgClass = isLight ? 'chess-square-light' : 'chess-square-dark';
  if (isSelected) bgClass = 'chess-square-selected';
  else if (isLastMove) bgClass = isLight ? 'chess-square-lastmove-light' : 'chess-square-lastmove-dark';
  if (isCheck && piece && (piece === '♔' || piece === '♚')) bgClass = 'chess-square-check';

  const showFileLabel = row === 7;
  const showRankLabel = col === 0;

  return (
    <div
      className={`chess-square relative ${bgClass} ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
      onClick={() => !disabled && onClick({ row, col })}
      role="button"
      aria-label={`${FILES[col]}${RANKS[row]}${piece ? ` ${piece}` : ''}`}
    >
      {/* Rank label */}
      {showRankLabel && (
        <span className={`absolute top-0.5 left-0.5 text-[clamp(7px,1.2vw,11px)] font-semibold leading-none z-10 ${isLight ? 'text-chess-dark' : 'text-chess-light'} opacity-70`}>
          {RANKS[row]}
        </span>
      )}
      {/* File label */}
      {showFileLabel && (
        <span className={`absolute bottom-0.5 right-1 text-[clamp(7px,1.2vw,11px)] font-semibold leading-none z-10 ${isLight ? 'text-chess-dark' : 'text-chess-light'} opacity-70`}>
          {FILES[col]}
        </span>
      )}

      {/* Valid move dot */}
      {isValidMove && !piece && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="w-[28%] h-[28%] rounded-full bg-chess-accent opacity-60" />
        </div>
      )}
      {/* Valid capture ring */}
      {isValidMove && piece && (
        <div className="absolute inset-0 rounded-sm ring-4 ring-chess-accent ring-inset opacity-70 z-20" />
      )}

      {/* Piece */}
      {piece && (
        <span
          className="chess-piece absolute inset-0 flex items-center justify-center select-none z-30"
          style={{ fontSize: 'clamp(18px, 5vw, 44px)' }}
        >
          {piece}
        </span>
      )}
    </div>
  );
}
