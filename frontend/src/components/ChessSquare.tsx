import React from 'react';
import { isWhitePiece, isBlackPiece } from '../utils/chess-setup';

interface ChessSquareProps {
  piece: string | null;
  isLight: boolean;
  isSelected: boolean;
  isValidMove: boolean;
  isInCheck: boolean;
  isLastMove?: boolean;
  row: number;
  col: number;
  onClick: () => void;
}

const ChessSquare: React.FC<ChessSquareProps> = ({
  piece,
  isLight,
  isSelected,
  isValidMove,
  isInCheck,
  isLastMove = false,
  row,
  col,
  onClick,
}) => {
  const getSquareClass = () => {
    let base = 'chess-square relative flex items-center justify-center cursor-pointer select-none transition-all duration-150 ';

    if (isSelected) {
      base += 'bg-chess-selected ';
    } else if (isInCheck) {
      base += 'bg-chess-check ';
    } else if (isLight) {
      base += 'bg-chess-light ';
    } else {
      base += 'bg-chess-dark ';
    }

    return base;
  };

  const getPieceColor = (): string => {
    if (!piece) return '';
    if (isWhitePiece(piece)) return 'var(--chess-piece-white)';
    if (isBlackPiece(piece)) return 'var(--chess-piece-black)';
    return '';
  };

  const getPieceShadow = (): string => {
    if (!piece) return 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))';
    if (isWhitePiece(piece)) {
      return 'drop-shadow(0 0 1.5px rgba(60,40,0,0.7)) drop-shadow(0 2px 3px rgba(0,0,0,0.6))';
    }
    return 'drop-shadow(0 0 1.5px rgba(180,200,255,0.4)) drop-shadow(0 2px 3px rgba(0,0,0,0.7))';
  };

  const showCoordCol = row === 0;
  const showCoordRow = col === 0;
  const colLabels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const rowLabels = ['1', '2', '3', '4', '5', '6', '7', '8'];

  return (
    <div
      className={getSquareClass()}
      onClick={onClick}
      style={{ aspectRatio: '1 / 1' }}
    >
      {/* Last move highlight */}
      {isLastMove && !isSelected && !isInCheck && (
        <div
          className="absolute inset-0 pointer-events-none z-0 last-move-highlight"
        />
      )}

      {/* Valid move indicator */}
      {isValidMove && (
        <div
          className={`absolute inset-0 flex items-center justify-center pointer-events-none z-10`}
        >
          {piece ? (
            <div className="absolute inset-0 border-4 border-chess-gold opacity-80 rounded-sm" />
          ) : (
            <div className="w-[34%] h-[34%] rounded-full bg-chess-gold opacity-70" />
          )}
        </div>
      )}

      {/* Coordinate labels */}
      {showCoordRow && (
        <span className="absolute top-0.5 left-1 text-[10px] font-semibold opacity-60 z-20 font-chess"
          style={{ color: isLight ? 'var(--chess-dark-text)' : 'var(--chess-light-text)' }}>
          {rowLabels[row]}
        </span>
      )}
      {showCoordCol && (
        <span className="absolute bottom-0.5 right-1 text-[10px] font-semibold opacity-60 z-20 font-chess"
          style={{ color: isLight ? 'var(--chess-dark-text)' : 'var(--chess-light-text)' }}>
          {colLabels[col]}
        </span>
      )}

      {/* Piece */}
      {piece && (
        <span
          className="chess-piece z-20 leading-none select-none"
          style={{
            fontSize: 'clamp(24px, 5vw, 52px)',
            color: getPieceColor(),
            filter: getPieceShadow(),
            textShadow: 'none',
          }}
        >
          {piece}
        </span>
      )}
    </div>
  );
};

export default ChessSquare;
