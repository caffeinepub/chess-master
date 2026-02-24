import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChessBoard from '../components/ChessBoard';
import GameStatus from '../components/GameStatus';
import GameModeSelector from '../components/GameModeSelector';
import LoginButton from '../components/LoginButton';
import PlayerIdentity from '../components/PlayerIdentity';
import PlayerStats from '../components/PlayerStats';
import ProfileSetupModal from '../components/ProfileSetupModal';
import GameResultsPanel from '../components/GameResultsPanel';
import Leaderboard from '../components/Leaderboard';
import OnlineGameSetup from '../components/OnlineGameSetup';
import OnlineChessGame from './OnlineChessGame';
import { createInitialBoard } from '../utils/chess-setup';
import { getValidMoves } from '../utils/valid-moves';
import { getGameStatus } from '../utils/game-status';
import { getBestMove } from '../utils/ai-player';
import { useMoveSound } from '../hooks/useMoveSound';
import { useBackgroundMusic } from '../hooks/useBackgroundMusic';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  trackPosition,
  hasThreefoldRepetition,
  clearPositionHistory,
  type PositionHistory,
} from '../utils/position-tracker';
import type { GameState, GameMode, Position, DrawReason } from '../types/chess';
import { Trophy, BarChart2 } from 'lucide-react';

const INITIAL_TIME = 600; // 10 minutes per player

function createInitialGameState(): GameState {
  return {
    board: createInitialBoard(),
    currentPlayer: 'white',
    selectedPiece: null,
    gameOver: null,
    isCheck: false,
    lastMove: null,
  };
}

export default function ChessGame() {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [gameMode, setGameMode] = useState<GameMode>('two-players');
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [whiteTime, setWhiteTime] = useState(INITIAL_TIME);
  const [blackTime, setBlackTime] = useState(INITIAL_TIME);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [onlineGameId, setOnlineGameId] = useState<string | null>(null);
  const [onlinePlayerColor, setOnlinePlayerColor] = useState<'white' | 'black'>('white');

  const positionHistoryRef = useRef<PositionHistory>(clearPositionHistory());
  const autoPlayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refs to hold latest state for use inside setTimeout callbacks (avoids stale closures)
  const gameStateRef = useRef<GameState>(gameState);
  const gameModeRef = useRef<GameMode>('two-players');
  const isAIThinkingRef = useRef(false);
  const isAuthenticatedRef = useRef(false);

  const { playMoveSound } = useMoveSound();
  const { toggleMute, isMuted } = useBackgroundMusic();
  const { identity } = useInternetIdentity();

  const isAuthenticated = !!identity;

  // Keep refs in sync with state
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    gameModeRef.current = gameMode;
  }, [gameMode]);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  // Timer logic
  useEffect(() => {
    if (gameState.gameOver || gameMode === 'auto-play' || gameMode === 'online') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      if (gameStateRef.current.currentPlayer === 'white') {
        setWhiteTime(t => {
          if (t <= 1) {
            setGameState(prev => ({ ...prev, gameOver: 'black' }));
            setShowResults(true);
            setPointsEarned(0);
            return 0;
          }
          return t - 1;
        });
      } else {
        setBlackTime(t => {
          if (t <= 1) {
            setGameState(prev => ({ ...prev, gameOver: 'white' }));
            setShowResults(true);
            setPointsEarned(0);
            return 0;
          }
          return t - 1;
        });
      }
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState.currentPlayer, gameState.gameOver, gameMode]);

  const applyMoveAndCheck = useCallback(
    (prevState: GameState, from: Position, to: Position): GameState => {
      const newBoard = prevState.board.map(r => [...r]);
      newBoard[to.row][to.col] = newBoard[from.row][from.col];
      newBoard[from.row][from.col] = null;

      // Pawn promotion
      if (newBoard[to.row][to.col] === '♙' && to.row === 7) newBoard[to.row][to.col] = '♕';
      if (newBoard[to.row][to.col] === '♟' && to.row === 0) newBoard[to.row][to.col] = '♛';

      const nextPlayer: 'white' | 'black' = prevState.currentPlayer === 'white' ? 'black' : 'white';

      // Track position for threefold repetition
      trackPosition(positionHistoryRef.current, newBoard, nextPlayer);

      if (hasThreefoldRepetition(positionHistoryRef.current)) {
        return {
          ...prevState,
          board: newBoard,
          currentPlayer: nextPlayer,
          selectedPiece: null,
          gameOver: 'draw',
          drawReason: 'threefold' as DrawReason,
          isCheck: false,
          lastMove: { from, to },
        };
      }

      const status = getGameStatus(newBoard, nextPlayer);

      let gameOver: GameState['gameOver'] = null;
      let drawReason: DrawReason | undefined = undefined;
      let isCheck = false;

      if (status.status === 'checkmate') {
        gameOver = status.winner!;
      } else if (status.status === 'stalemate') {
        gameOver = 'draw';
        drawReason = 'stalemate';
      } else if (status.status === 'check') {
        isCheck = true;
      }

      return {
        ...prevState,
        board: newBoard,
        currentPlayer: nextPlayer,
        selectedPiece: null,
        gameOver,
        drawReason,
        isCheck,
        lastMove: { from, to },
      };
    },
    []
  );

  const handleGameOver = useCallback(
    (newState: GameState) => {
      if (!newState.gameOver) return;
      let pts = 0;
      if (isAuthenticatedRef.current) {
        pts = newState.gameOver === 'draw' ? 3 : 10;
      }
      setPointsEarned(pts);
      setShowResults(true);
    },
    []
  );

  const handleMove = useCallback(
    (from: Position, to: Position) => {
      playMoveSound();
      setGameState(prev => {
        const newState = applyMoveAndCheck(prev, from, to);
        if (newState.gameOver) {
          setTimeout(() => handleGameOver(newState), 100);
        }
        return newState;
      });
      setValidMoves([]);
    },
    [applyMoveAndCheck, handleGameOver, playMoveSound]
  );

  const handleNewGame = useCallback(() => {
    // Cancel any pending AI timeouts
    if (autoPlayRef.current) {
      clearTimeout(autoPlayRef.current);
      autoPlayRef.current = null;
    }
    isAIThinkingRef.current = false;
    positionHistoryRef.current = clearPositionHistory();
    const newState = createInitialGameState();
    setGameState(newState);
    setValidMoves([]);
    setIsAIThinking(false);
    setWhiteTime(INITIAL_TIME);
    setBlackTime(INITIAL_TIME);
    setShowResults(false);
    setPointsEarned(0);
    // Track initial position
    trackPosition(positionHistoryRef.current, newState.board, newState.currentPlayer);
  }, []);

  const handleModeChange = useCallback((mode: GameMode) => {
    setGameMode(mode);
    if (mode !== 'online') {
      setOnlineGameId(null);
      handleNewGame();
    }
  }, [handleNewGame]);

  // onSquareClick uses (row, col) to match ChessBoard's interface
  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      const position: Position = { row, col };
      if (gameState.gameOver) return;
      if (gameMode === 'auto-play') return;
      if (gameMode === 'one-player' && gameState.currentPlayer === 'black') return;
      if (isAIThinking) return;

      const { board, currentPlayer, selectedPiece } = gameState;
      const piece = board[row][col];

      if (selectedPiece) {
        const isValidTarget = validMoves.some(
          m => m.row === row && m.col === col
        );
        if (isValidTarget) {
          handleMove(selectedPiece, position);
          return;
        }
        setGameState(prev => ({ ...prev, selectedPiece: null }));
        setValidMoves([]);
        return;
      }

      if (piece) {
        const isWhitePiece = ['♔', '♕', '♖', '♗', '♘', '♙'].includes(piece);
        const pieceColor = isWhitePiece ? 'white' : 'black';
        if (pieceColor !== currentPlayer) return;

        const moves = getValidMoves(board, position, currentPlayer);
        setGameState(prev => ({ ...prev, selectedPiece: position }));
        setValidMoves(moves);
      }
    },
    [gameState, gameMode, isAIThinking, validMoves, handleMove]
  );

  // ─── AI move for one-player mode ───────────────────────────────────────────
  // Triggered only when currentPlayer flips to 'black' in one-player mode.
  // Uses refs inside the setTimeout to read the latest state and avoid stale closures.
  // isAIThinking is intentionally NOT in the dependency array to prevent the
  // cleanup from cancelling the pending timer when isAIThinking state changes.
  useEffect(() => {
    if (
      gameMode !== 'one-player' ||
      gameState.currentPlayer !== 'black' ||
      gameState.gameOver
    ) return;

    // Guard against double-scheduling using a ref
    if (isAIThinkingRef.current) return;
    isAIThinkingRef.current = true;
    setIsAIThinking(true);

    const delay = 1500 + Math.random() * 1500;
    const timer = setTimeout(() => {
      // Read latest state from ref to avoid stale closure
      const currentState = gameStateRef.current;

      // Abort if game ended or mode changed while we were waiting
      if (currentState.gameOver || gameModeRef.current !== 'one-player') {
        isAIThinkingRef.current = false;
        setIsAIThinking(false);
        return;
      }

      const aiMove = getBestMove(currentState.board, 'black');
      if (aiMove) {
        playMoveSound();
        setGameState(prev => {
          const newState = applyMoveAndCheck(prev, aiMove.from, aiMove.to);
          if (newState.gameOver) {
            setTimeout(() => handleGameOver(newState), 100);
          }
          return newState;
        });
      }
      isAIThinkingRef.current = false;
      setIsAIThinking(false);
    }, delay);

    // Only clean up if the component unmounts or mode/gameOver changes,
    // NOT when isAIThinking changes (that would cancel the pending move).
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameMode, gameState.currentPlayer, gameState.gameOver]);

  // ─── Auto-play mode ────────────────────────────────────────────────────────
  // Uses a self-scheduling pattern with refs to avoid stale closures.
  // The effect only starts/stops the loop; the loop itself reads from refs.
  useEffect(() => {
    if (gameMode !== 'auto-play') return;

    let cancelled = false;

    const scheduleNextMove = () => {
      if (cancelled) return;

      const delay = 600 + Math.random() * 300;
      autoPlayRef.current = setTimeout(() => {
        if (cancelled) return;

        // Read latest state from refs
        const currentState = gameStateRef.current;

        if (currentState.gameOver || gameModeRef.current !== 'auto-play') {
          return;
        }

        setIsAIThinking(true);

        // Small additional thinking delay for visual feedback
        const thinkDelay = 400 + Math.random() * 400;
        autoPlayRef.current = setTimeout(() => {
          if (cancelled) return;

          const latestState = gameStateRef.current;
          if (latestState.gameOver || gameModeRef.current !== 'auto-play') {
            setIsAIThinking(false);
            return;
          }

          const aiMove = getBestMove(latestState.board, latestState.currentPlayer);
          if (aiMove) {
            playMoveSound();
            setGameState(prev => {
              const newState = applyMoveAndCheck(prev, aiMove.from, aiMove.to);
              if (newState.gameOver) {
                setTimeout(() => handleGameOver(newState), 100);
              }
              return newState;
            });
          }

          setIsAIThinking(false);

          // Schedule the next move after state has been committed
          // Use a short delay to let React process the state update
          if (!cancelled) {
            scheduleNextMove();
          }
        }, thinkDelay);
      }, delay);
    };

    scheduleNextMove();

    return () => {
      cancelled = true;
      if (autoPlayRef.current) {
        clearTimeout(autoPlayRef.current);
        autoPlayRef.current = null;
      }
      setIsAIThinking(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameMode, gameState.gameOver]);

  // Track initial position on mount
  useEffect(() => {
    trackPosition(positionHistoryRef.current, gameState.board, gameState.currentPlayer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showClocks = gameMode !== 'auto-play' && gameMode !== 'online';

  // Build game-over message for board overlay
  const getGameOverMessage = (): string => {
    const { gameOver, drawReason } = gameState;
    if (!gameOver) return '';
    if (gameOver === 'draw') {
      if (drawReason === 'threefold') return 'Draw – Threefold Repetition!';
      return 'Draw – Stalemate!';
    }
    return `${gameOver === 'white' ? 'White' : 'Black'} Wins by Checkmate!`;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--chess-bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b"
        style={{
          background: 'var(--chess-status-bg)',
          borderColor: 'var(--chess-border)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">♛</span>
            <h1
              className="font-chess text-xl font-bold tracking-wide hidden sm:block"
              style={{ color: 'var(--chess-gold)' }}
            >
              Chess Master
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {isAuthenticated && <PlayerStats />}
            <PlayerIdentity />
            <LoginButton />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* Left panel */}
        <aside className="lg:w-64 flex flex-col gap-4">
          <GameModeSelector currentMode={gameMode} onModeChange={handleModeChange} />

          {gameMode !== 'online' && (
            <button
              onClick={handleNewGame}
              className="w-full py-2 rounded-md text-sm font-medium transition-colors"
              style={{
                border: '1px solid var(--chess-border)',
                color: 'var(--chess-gold)',
                background: 'transparent',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,175,55,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              ↺ New Game
            </button>
          )}

          <button
            onClick={() => setShowLeaderboard(v => !v)}
            className="w-full py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
            style={{
              border: `1px solid ${showLeaderboard ? 'var(--chess-gold)' : 'var(--chess-border)'}`,
              color: showLeaderboard ? 'var(--chess-gold)' : 'var(--chess-muted)',
              background: showLeaderboard ? 'rgba(212,175,55,0.08)' : 'transparent',
            }}
          >
            <Trophy size={14} />
            Leaderboard
          </button>

          {showLeaderboard && <Leaderboard />}

          {gameMode !== 'online' && (
            <div
              className="rounded-xl p-4 text-xs space-y-1"
              style={{
                border: '1px solid var(--chess-border)',
                background: 'var(--chess-status-bg)',
                color: 'var(--chess-muted)',
              }}
            >
              <p
                className="font-semibold text-xs uppercase tracking-wide mb-2"
                style={{ color: 'var(--chess-gold)', opacity: 0.8 }}
              >
                How to Play
              </p>
              <p>• Click a piece to select it</p>
              <p>• Click a highlighted square to move</p>
              <p>• Capture the opponent's king to win</p>
              {gameMode === 'one-player' && <p>• You play as White vs AI</p>}
              {gameMode === 'auto-play' && <p>• Watch AI vs AI battle</p>}
              {gameMode === 'two-players' && <p>• Take turns with a friend</p>}
            </div>
          )}
        </aside>

        {/* Main game area */}
        <section className="flex-1 flex flex-col gap-4 items-center">
          {gameMode === 'online' ? (
            onlineGameId ? (
              <OnlineChessGame
                gameId={onlineGameId}
                playerColor={onlinePlayerColor}
                onLeave={() => setOnlineGameId(null)}
              />
            ) : (
              <OnlineGameSetup
                onGameReady={(id, color) => {
                  setOnlineGameId(id);
                  setOnlinePlayerColor(color);
                }}
              />
            )
          ) : (
            <>
              <GameStatus
                gameOver={gameState.gameOver}
                drawReason={gameState.drawReason}
                isCheck={gameState.isCheck}
                currentPlayer={gameState.currentPlayer}
                gameMode={gameMode}
                isAIThinking={isAIThinking}
                whiteTime={showClocks ? whiteTime : undefined}
                blackTime={showClocks ? blackTime : undefined}
                toggleMute={toggleMute}
                isMuted={isMuted}
              />
              <ChessBoard
                board={gameState.board}
                selectedPiece={gameState.selectedPiece}
                validMoves={validMoves}
                isAIThinking={isAIThinking}
                isAutoPlaying={gameMode === 'auto-play' && !gameState.gameOver}
                isGameOver={!!gameState.gameOver}
                gameOverMessage={getGameOverMessage()}
                onSquareClick={handleSquareClick}
                lastMove={gameState.lastMove}
              />
            </>
          )}
        </section>

        {/* Right panel - stats */}
        {isAuthenticated && (
          <aside className="lg:w-48 flex flex-col gap-4">
            <div
              className="rounded-xl p-4 space-y-3"
              style={{
                border: '1px solid var(--chess-border)',
                background: 'var(--chess-status-bg)',
              }}
            >
              <div
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'var(--chess-gold)', opacity: 0.8 }}
              >
                <BarChart2 size={13} />
                Your Stats
              </div>
              <PlayerStats />
            </div>
          </aside>
        )}
      </main>

      {/* Footer */}
      <footer
        className="py-4 text-center text-xs"
        style={{
          borderTop: '1px solid var(--chess-border)',
          background: 'var(--chess-status-bg)',
          color: 'var(--chess-muted)',
          opacity: 0.8,
        }}
      >
        <p>
          © {new Date().getFullYear()} Chess Master &nbsp;·&nbsp; Built with{' '}
          <span style={{ color: 'oklch(0.65 0.22 25)' }}>♥</span> using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window !== 'undefined' ? window.location.hostname : 'chess-master'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--chess-gold)', opacity: 0.7 }}
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      {/* Modals */}
      <ProfileSetupModal />
      <GameResultsPanel
        open={showResults}
        gameOver={gameState.gameOver}
        drawReason={gameState.drawReason}
        pointsEarned={pointsEarned}
        isAuthenticated={isAuthenticated}
        onNewGame={() => {
          setShowResults(false);
          handleNewGame();
        }}
        onClose={() => setShowResults(false)}
      />
    </div>
  );
}
