import React, { useEffect, useRef, useState } from 'react';
import { useOnlineGame } from '../hooks/useOnlineGame';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import { backendToFrontendBoard } from '../utils/backend-sync';
import { getValidMoves } from '../utils/valid-moves';
import { getGameStatus } from '../utils/game-status';
import {
  trackPosition,
  hasThreefoldRepetition,
  clearPositionHistory,
  type PositionHistory,
} from '../utils/position-tracker';
import ChessBoard from '../components/ChessBoard';
import GameResultsPanel from '../components/GameResultsPanel';
import type { Position, LastMove, DrawReason, Board } from '../types/chess';
import { Loader2, Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnlineChessGameProps {
  gameId: string;
  playerColor: 'white' | 'black';
  onLeave: () => void;
}

const WHITE_PIECES = new Set(['♔', '♕', '♖', '♗', '♘', '♙']);

export default function OnlineChessGame({ gameId, playerColor, onLeave }: OnlineChessGameProps) {
  const { identity } = useInternetIdentity();
  const { data: _profile } = useGetCallerUserProfile();
  const { gameQuery } = useOnlineGame(gameId);

  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [lastMove, setLastMove] = useState<LastMove | null>(null);
  const [gameOver, setGameOver] = useState<'white' | 'black' | 'draw' | null>(null);
  const [drawReason, setDrawReason] = useState<DrawReason | undefined>(undefined);
  const [showResults, setShowResults] = useState(false);
  const [localBoard, setLocalBoard] = useState<Board | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white');
  const positionHistoryRef = useRef<PositionHistory>(clearPositionHistory());

  const backendGame = gameQuery.data;
  const isLoading = gameQuery.isLoading;

  // Sync backend state to local board
  useEffect(() => {
    if (!backendGame) return;
    const frontendBoard = backendToFrontendBoard(backendGame.board) as Board;
    setLocalBoard(frontendBoard);
    const player: 'white' | 'black' = backendGame.currentTurn === 'white' ? 'white' : 'black';
    setCurrentPlayer(player);

    // Track position for threefold repetition
    trackPosition(positionHistoryRef.current, frontendBoard, player);

    if (hasThreefoldRepetition(positionHistoryRef.current) && !gameOver) {
      setGameOver('draw');
      setDrawReason('threefold');
      setShowResults(true);
      return;
    }

    // Check game status
    const status = getGameStatus(frontendBoard, player);
    if (status.status === 'checkmate' && !gameOver) {
      setGameOver(status.winner!);
      setShowResults(true);
    } else if (status.status === 'stalemate' && !gameOver) {
      setGameOver('draw');
      setDrawReason('stalemate');
      setShowResults(true);
    }
  }, [backendGame, gameOver]);

  const isMyTurn = currentPlayer === playerColor && !gameOver;
  const board: Board = localBoard ?? Array(8).fill(null).map(() => Array(8).fill(null));

  // onSquareClick uses (row, col) to match ChessBoard's interface
  const handleSquareClick = (row: number, col: number) => {
    const position: Position = { row, col };
    if (!isMyTurn || !localBoard) return;

    const piece = localBoard[row][col];

    if (selectedPiece) {
      const isValidTarget = validMoves.some(m => m.row === row && m.col === col);
      if (isValidTarget) {
        // Apply move locally (optimistic UI)
        const newBoard: Board = localBoard.map(r => [...r]);
        newBoard[row][col] = newBoard[selectedPiece.row][selectedPiece.col];
        newBoard[selectedPiece.row][selectedPiece.col] = null;
        setLocalBoard(newBoard);
        setLastMove({ from: selectedPiece, to: position });
        setSelectedPiece(null);
        setValidMoves([]);
        // Note: In a full implementation, this would call the backend to persist the move.
        return;
      }
      setSelectedPiece(null);
      setValidMoves([]);
      return;
    }

    if (piece) {
      const pieceColor = WHITE_PIECES.has(piece) ? 'white' : 'black';
      if (pieceColor !== playerColor) return;

      const moves = getValidMoves(localBoard, position, playerColor);
      setSelectedPiece(position);
      setValidMoves(moves);
    }
  };

  const getPlayerName = (principal: { toString(): string } | undefined) => {
    if (!principal) return 'Waiting…';
    const p = principal.toString();
    if (p === 'aaaaa-aa') return 'Waiting for player…';
    return `${p.slice(0, 5)}…${p.slice(-4)}`;
  };

  const isWaiting = backendGame && backendGame.blackPlayer.toString() === 'aaaaa-aa';

  const getGameOverMessage = (): string => {
    if (!gameOver) return '';
    if (gameOver === 'draw') {
      if (drawReason === 'threefold') return 'Draw – Threefold Repetition!';
      return 'Draw – Stalemate!';
    }
    return `${gameOver === 'white' ? 'White' : 'Black'} Wins by Checkmate!`;
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-[560px]">
      {/* Players info */}
      <div
        className="flex items-center justify-between px-4 py-2 rounded-lg text-sm"
        style={{
          background: 'var(--chess-status-bg)',
          border: '1px solid var(--chess-border)',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">♔</span>
          <span style={{ color: 'var(--chess-text)' }}>{getPlayerName(backendGame?.whitePlayer)}</span>
          {playerColor === 'white' && (
            <span className="text-xs" style={{ color: 'var(--chess-gold)' }}>(You)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Users size={14} style={{ color: 'var(--chess-muted)' }} />
          <span className="text-xs" style={{ color: 'var(--chess-muted)' }}>vs</span>
        </div>
        <div className="flex items-center gap-2">
          {playerColor === 'black' && (
            <span className="text-xs" style={{ color: 'var(--chess-gold)' }}>(You)</span>
          )}
          <span style={{ color: 'var(--chess-text)' }}>{getPlayerName(backendGame?.blackPlayer)}</span>
          <span className="text-xl">♚</span>
        </div>
      </div>

      {isWaiting && (
        <div
          className="flex items-center justify-center gap-2 py-2 rounded-lg text-sm"
          style={{
            background: 'rgba(212,175,55,0.08)',
            border: '1px solid rgba(212,175,55,0.3)',
            color: 'var(--chess-gold)',
          }}
        >
          <Loader2 size={14} className="animate-spin" />
          Waiting for opponent… Share ID: <strong>{gameId}</strong>
        </div>
      )}

      {isLoading && !localBoard && (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--chess-gold)' }} />
        </div>
      )}

      {localBoard && (
        <>
          <div
            className="flex items-center justify-between px-4 py-2 rounded-lg text-sm"
            style={{
              background: 'var(--chess-status-bg)',
              border: '1px solid var(--chess-border)',
            }}
          >
            <span style={{ color: 'var(--chess-text)' }}>
              {gameOver
                ? getGameOverMessage()
                : isMyTurn
                ? '🟢 Your turn'
                : '⏳ Opponent\'s turn'}
            </span>
          </div>
          <ChessBoard
            board={board}
            selectedPiece={selectedPiece}
            validMoves={validMoves}
            isGameOver={!!gameOver}
            gameOverMessage={getGameOverMessage()}
            onSquareClick={handleSquareClick}
            lastMove={lastMove}
          />
          {!isMyTurn && !gameOver && !isWaiting && (
            <div
              className="text-center text-sm py-1"
              style={{ color: 'var(--chess-muted)' }}
            >
              Waiting for opponent's move…
            </div>
          )}
        </>
      )}

      <div className="flex gap-2 justify-center">
        <Button
          onClick={() => gameQuery.refetch()}
          variant="outline"
          size="sm"
          style={{
            borderColor: 'var(--chess-border)',
            color: 'var(--chess-gold)',
            background: 'transparent',
          }}
        >
          <RefreshCw size={14} className="mr-1" />
          Refresh
        </Button>
        <Button
          onClick={onLeave}
          variant="outline"
          size="sm"
          style={{
            borderColor: 'var(--chess-border)',
            color: 'var(--chess-muted)',
            background: 'transparent',
          }}
        >
          Leave Game
        </Button>
      </div>

      <GameResultsPanel
        open={showResults}
        gameOver={gameOver}
        drawReason={drawReason}
        pointsEarned={0}
        isAuthenticated={!!identity}
        onNewGame={onLeave}
        onClose={() => setShowResults(false)}
      />
    </div>
  );
}
