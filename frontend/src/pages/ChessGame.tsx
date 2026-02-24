import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChessBoard from '../components/ChessBoard';
import GameStatus from '../components/GameStatus';
import GameModeSelector from '../components/GameModeSelector';
import GameResultsPanel from '../components/GameResultsPanel';
import OnlineGameSetup from '../components/OnlineGameSetup';
import OnlineChessGame from './OnlineChessGame';
import LoginButton from '../components/LoginButton';
import PlayerIdentity from '../components/PlayerIdentity';
import PlayerStats from '../components/PlayerStats';
import Leaderboard from '../components/Leaderboard';
import ProfileSetupModal from '../components/ProfileSetupModal';
import { Button } from '../components/ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import { createInitialBoard } from '../utils/chess-setup';
import { getValidMoves } from '../utils/valid-moves';
import { getGameStatus } from '../utils/game-status';
import { getBestMove } from '../utils/ai-player';
import {
  isCastlingMove,
  applyCastlingMove,
  applyMove,
  updateCastlingRights,
  isKingInCheck,
} from '../utils/move-validation';
import {
  trackPosition,
  hasThreefoldRepetition,
  clearPositionHistory,
  type PositionHistory,
} from '../utils/position-tracker';
import { useMoveSound } from '../hooks/useMoveSound';
import { useBackgroundMusic } from '../hooks/useBackgroundMusic';
import type {
  GameState,
  GameMode,
  GameResult,
  DrawReason,
  Position,
  Board,
  CastlingRights,
} from '../types/chess';
import { Play, Trophy } from 'lucide-react';

const INITIAL_TIME = 10 * 60; // 10 minutes in seconds

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const initialCastlingRights: CastlingRights = {
  whiteKingside: true,
  whiteQueenside: true,
  blackKingside: true,
  blackQueenside: true,
};

function createInitialGameState(): GameState {
  return {
    board: createInitialBoard(),
    currentPlayer: 'white',
    selectedPiece: null,
    gameOver: null,
    isCheck: false,
    lastMove: null,
    castlingRights: initialCastlingRights,
  };
}

export default function ChessGame() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();

  const showProfileSetup = isAuthenticated && !profileLoading && profileFetched && userProfile === null;

  const [gameMode, setGameMode] = useState<GameMode>('two-players');
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [whiteTime, setWhiteTime] = useState(INITIAL_TIME);
  const [blackTime, setBlackTime] = useState(INITIAL_TIME);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [showOnlineSetup, setShowOnlineSetup] = useState(false);
  const [onlineGameId, setOnlineGameId] = useState<string | null>(null);
  const [onlinePlayerColor, setOnlinePlayerColor] = useState<'white' | 'black'>('white');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const { playMoveSound } = useMoveSound();
  const { startMusic, toggleMute, isMuted, isPlaying } = useBackgroundMusic();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const positionHistoryRef = useRef<PositionHistory>(clearPositionHistory());
  const gameStateRef = useRef<GameState>(gameState);
  const gameModeRef = useRef<GameMode>(gameMode);
  const gameStartedRef = useRef(gameStarted);
  const isAiThinkingRef = useRef(false);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { gameModeRef.current = gameMode; }, [gameMode]);
  useEffect(() => { gameStartedRef.current = gameStarted; }, [gameStarted]);

  // Timer logic — only runs when gameStarted is true
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!gameStarted || gameState.gameOver || gameMode === 'auto-play' || gameMode === 'online') {
      return;
    }

    timerRef.current = setInterval(() => {
      const current = gameStateRef.current;
      if (current.gameOver || !gameStartedRef.current) {
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }
      if (current.currentPlayer === 'white') {
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
  }, [gameStarted, gameState.gameOver, gameState.currentPlayer, gameMode]);

  // AI move for one-player mode
  useEffect(() => {
    if (!gameStarted) return;
    if (gameMode !== 'one-player') return;
    if (gameState.currentPlayer !== 'black') return;
    if (gameState.gameOver) return;
    if (isAiThinkingRef.current) return;

    isAiThinkingRef.current = true;
    setIsAiThinking(true);

    const delay = 800 + Math.random() * 1200;
    const timer = setTimeout(() => {
      const current = gameStateRef.current;
      if (current.gameOver || gameModeRef.current !== 'one-player' || !gameStartedRef.current) {
        isAiThinkingRef.current = false;
        setIsAiThinking(false);
        return;
      }

      const aiMove = getBestMove(current.board, 'black', current.castlingRights);
      if (aiMove) {
        playMoveSound();
        setGameState(prev => {
          const { from, to } = aiMove;
          let newBoard: Board;
          if (isCastlingMove(prev.board, from.row, from.col, to.row, to.col)) {
            newBoard = applyCastlingMove(prev.board, from.row, from.col, to.row, to.col);
          } else {
            newBoard = applyMove(prev.board, from.row, from.col, to.row, to.col);
            // Pawn promotion
            if (newBoard[to.row][to.col] === '♟' && to.row === 0) newBoard[to.row][to.col] = '♛';
          }
          const movingPiece = prev.board[from.row][from.col];
          const newCastlingRights = movingPiece
            ? updateCastlingRights(prev.castlingRights, movingPiece, from.row, from.col)
            : prev.castlingRights;

          trackPosition(positionHistoryRef.current, newBoard, 'white');
          if (hasThreefoldRepetition(positionHistoryRef.current)) {
            setTimeout(() => { setShowResults(true); setPointsEarned(isAuthenticated ? 3 : 0); }, 100);
            return { ...prev, board: newBoard, currentPlayer: 'white', selectedPiece: null, gameOver: 'draw', drawReason: 'threefold' as DrawReason, isCheck: false, lastMove: { from, to }, castlingRights: newCastlingRights };
          }

          const status = getGameStatus(newBoard, 'white');
          let gameOver: GameResult = null;
          let drawReason: DrawReason | undefined;
          let isCheck = false;
          if (status.status === 'checkmate') { gameOver = status.winner!; }
          else if (status.status === 'stalemate') { gameOver = 'draw'; drawReason = 'stalemate'; }
          else if (status.status === 'check') { isCheck = true; }

          if (gameOver) {
            const pts = gameOver === 'draw' ? (isAuthenticated ? 3 : 0) : (isAuthenticated ? 10 : 0);
            setTimeout(() => { setShowResults(true); setPointsEarned(pts); }, 100);
          }
          return { ...prev, board: newBoard, currentPlayer: 'white', selectedPiece: null, gameOver, drawReason, isCheck, lastMove: { from, to }, castlingRights: newCastlingRights };
        });
      }
      isAiThinkingRef.current = false;
      setIsAiThinking(false);
    }, delay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted, gameMode, gameState.currentPlayer, gameState.gameOver]);

  // Auto-play mode
  useEffect(() => {
    if (!gameStarted) return;
    if (gameMode !== 'auto-play') return;
    if (gameState.gameOver) return;
    if (isAiThinkingRef.current) return;

    isAiThinkingRef.current = true;
    setIsAiThinking(true);

    const delay = 600 + Math.random() * 900;
    const timer = setTimeout(() => {
      const current = gameStateRef.current;
      if (current.gameOver || gameModeRef.current !== 'auto-play' || !gameStartedRef.current) {
        isAiThinkingRef.current = false;
        setIsAiThinking(false);
        return;
      }

      const aiMove = getBestMove(current.board, current.currentPlayer, current.castlingRights);
      if (aiMove) {
        playMoveSound();
        setGameState(prev => {
          const { from, to } = aiMove;
          let newBoard: Board;
          if (isCastlingMove(prev.board, from.row, from.col, to.row, to.col)) {
            newBoard = applyCastlingMove(prev.board, from.row, from.col, to.row, to.col);
          } else {
            newBoard = applyMove(prev.board, from.row, from.col, to.row, to.col);
            if (newBoard[to.row][to.col] === '♙' && to.row === 7) newBoard[to.row][to.col] = '♕';
            if (newBoard[to.row][to.col] === '♟' && to.row === 0) newBoard[to.row][to.col] = '♛';
          }
          const movingPiece = prev.board[from.row][from.col];
          const newCastlingRights = movingPiece
            ? updateCastlingRights(prev.castlingRights, movingPiece, from.row, from.col)
            : prev.castlingRights;

          const nextPlayer: 'white' | 'black' = prev.currentPlayer === 'white' ? 'black' : 'white';
          trackPosition(positionHistoryRef.current, newBoard, nextPlayer);
          if (hasThreefoldRepetition(positionHistoryRef.current)) {
            setTimeout(() => { setShowResults(true); setPointsEarned(0); }, 300);
            return { ...prev, board: newBoard, currentPlayer: nextPlayer, selectedPiece: null, gameOver: 'draw', drawReason: 'threefold' as DrawReason, isCheck: false, lastMove: { from, to }, castlingRights: newCastlingRights };
          }

          const status = getGameStatus(newBoard, nextPlayer);
          let gameOver: GameResult = null;
          let drawReason: DrawReason | undefined;
          let isCheck = false;
          if (status.status === 'checkmate') { gameOver = status.winner!; }
          else if (status.status === 'stalemate') { gameOver = 'draw'; drawReason = 'stalemate'; }
          else if (status.status === 'check') { isCheck = true; }

          if (gameOver) {
            setTimeout(() => { setShowResults(true); setPointsEarned(0); }, 300);
          }
          return { ...prev, board: newBoard, currentPlayer: nextPlayer, selectedPiece: null, gameOver, drawReason, isCheck, lastMove: { from, to }, castlingRights: newCastlingRights };
        });
      }
      isAiThinkingRef.current = false;
      setIsAiThinking(false);
    }, delay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted, gameMode, gameState.currentPlayer, gameState.gameOver]);

  const handleStartGame = useCallback(() => {
    setGameStarted(true);
    if (!isPlaying) startMusic();
  }, [isPlaying, startMusic]);

  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      if (!gameStarted) return;
      if (gameState.gameOver) return;
      if (gameMode === 'auto-play') return;
      if (gameMode === 'one-player' && gameState.currentPlayer === 'black') return;
      if (isAiThinking) return;

      const position: Position = { row, col };
      const { board, currentPlayer, selectedPiece, castlingRights } = gameState;
      const piece = board[row][col];

      if (selectedPiece) {
        const isValidTarget = validMoves.some(m => m.row === row && m.col === col);
        if (isValidTarget) {
          playMoveSound();
          setGameState(prev => {
            const from = selectedPiece;
            const to = position;
            let newBoard: Board;
            if (isCastlingMove(prev.board, from.row, from.col, to.row, to.col)) {
              newBoard = applyCastlingMove(prev.board, from.row, from.col, to.row, to.col);
            } else {
              newBoard = applyMove(prev.board, from.row, from.col, to.row, to.col);
              // Pawn promotion
              if (newBoard[to.row][to.col] === '♙' && to.row === 7) newBoard[to.row][to.col] = '♕';
              if (newBoard[to.row][to.col] === '♟' && to.row === 0) newBoard[to.row][to.col] = '♛';
            }

            const movingPiece = prev.board[from.row][from.col];
            const newCastlingRights = movingPiece
              ? updateCastlingRights(prev.castlingRights, movingPiece, from.row, from.col)
              : prev.castlingRights;

            const nextPlayer: 'white' | 'black' = prev.currentPlayer === 'white' ? 'black' : 'white';

            trackPosition(positionHistoryRef.current, newBoard, nextPlayer);
            if (hasThreefoldRepetition(positionHistoryRef.current)) {
              const pts = isAuthenticated ? 3 : 0;
              setTimeout(() => { setShowResults(true); setPointsEarned(pts); }, 100);
              return { ...prev, board: newBoard, currentPlayer: nextPlayer, selectedPiece: null, gameOver: 'draw', drawReason: 'threefold' as DrawReason, isCheck: false, lastMove: { from, to }, castlingRights: newCastlingRights };
            }

            const status = getGameStatus(newBoard, nextPlayer);
            let gameOver: GameResult = null;
            let drawReason: DrawReason | undefined;
            let isCheck = false;
            if (status.status === 'checkmate') { gameOver = status.winner!; }
            else if (status.status === 'stalemate') { gameOver = 'draw'; drawReason = 'stalemate'; }
            else if (status.status === 'check') { isCheck = true; }

            if (gameOver) {
              const pts = gameOver === 'draw' ? (isAuthenticated ? 3 : 0) : (isAuthenticated ? 10 : 0);
              setTimeout(() => { setShowResults(true); setPointsEarned(pts); }, 100);
            }
            return { ...prev, board: newBoard, currentPlayer: nextPlayer, selectedPiece: null, gameOver, drawReason, isCheck, lastMove: { from, to }, castlingRights: newCastlingRights };
          });
          setValidMoves([]);
          return;
        }
        // Clicked on own piece — reselect
        if (piece) {
          const isWhitePiece = '♔♕♖♗♘♙'.includes(piece);
          const pieceColor = isWhitePiece ? 'white' : 'black';
          if (pieceColor === currentPlayer) {
            setGameState(prev => ({ ...prev, selectedPiece: position }));
            setValidMoves(getValidMoves(board, position, currentPlayer, castlingRights));
            return;
          }
        }
        setGameState(prev => ({ ...prev, selectedPiece: null }));
        setValidMoves([]);
        return;
      }

      if (piece) {
        const isWhitePiece = '♔♕♖♗♘♙'.includes(piece);
        const pieceColor = isWhitePiece ? 'white' : 'black';
        if (pieceColor !== currentPlayer) return;
        setGameState(prev => ({ ...prev, selectedPiece: position }));
        setValidMoves(getValidMoves(board, position, currentPlayer, castlingRights));
      }
    },
    [gameStarted, gameState, gameMode, isAiThinking, validMoves, playMoveSound, isAuthenticated]
  );

  const handleNewGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    isAiThinkingRef.current = false;
    setIsAiThinking(false);
    positionHistoryRef.current = clearPositionHistory();
    const newState = createInitialGameState();
    setGameState(newState);
    setValidMoves([]);
    setWhiteTime(INITIAL_TIME);
    setBlackTime(INITIAL_TIME);
    setShowResults(false);
    setPointsEarned(0);
    setGameStarted(false);
  }, []);

  const handleModeChange = useCallback((mode: GameMode) => {
    if (mode === 'online') {
      setGameMode(mode);
      setShowOnlineSetup(true);
      setOnlineGameId(null);
      return;
    }
    setGameMode(mode);
    setShowOnlineSetup(false);
    setOnlineGameId(null);
    if (timerRef.current) clearInterval(timerRef.current);
    isAiThinkingRef.current = false;
    setIsAiThinking(false);
    positionHistoryRef.current = clearPositionHistory();
    const newState = createInitialGameState();
    setGameState(newState);
    setValidMoves([]);
    setWhiteTime(INITIAL_TIME);
    setBlackTime(INITIAL_TIME);
    setShowResults(false);
    setPointsEarned(0);
    setGameStarted(false);
  }, []);

  const handleGameReady = useCallback((gameId: string, color: 'white' | 'black') => {
    setOnlineGameId(gameId);
    setOnlinePlayerColor(color);
    setShowOnlineSetup(false);
  }, []);

  const handleLeaveOnline = useCallback(() => {
    setGameMode('two-players');
    setOnlineGameId(null);
    setShowOnlineSetup(false);
    handleNewGame();
  }, [handleNewGame]);

  // Derive check state for board highlight
  const checkKingPosition: Position | null = (() => {
    if (!gameState.isCheck || gameState.gameOver) return null;
    const kingPiece = gameState.currentPlayer === 'white' ? '♔' : '♚';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (gameState.board[r][c] === kingPiece) return { row: r, col: c };
      }
    }
    return null;
  })();

  const getGameOverMessage = (): string => {
    const { gameOver, drawReason } = gameState;
    if (!gameOver) return '';
    if (gameOver === 'draw') {
      if (drawReason === 'threefold') return 'Draw – Threefold Repetition!';
      return 'Draw – Stalemate!';
    }
    return `${gameOver === 'white' ? 'White' : 'Black'} Wins by Checkmate!`;
  };

  const showClocks = gameMode !== 'auto-play' && gameMode !== 'online';

  if (gameMode === 'online' && onlineGameId) {
    return (
      <OnlineChessGame
        gameId={onlineGameId}
        playerColor={onlinePlayerColor}
        onLeave={handleLeaveOnline}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--chess-bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b"
        style={{ background: 'var(--chess-status-bg)', borderColor: 'var(--chess-border)' }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/assets/generated/chess-khelo-online-logo.dim_256x256.png"
              alt="Chess Khelo Online Logo"
              className="h-11 w-11 object-contain drop-shadow-md"
            />
            <h1
              className="font-chess text-xl font-bold tracking-wide hidden sm:block"
              style={{ color: 'var(--chess-gold)' }}
            >
              Chess Khelo Online
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLeaderboard(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors"
              style={{
                color: showLeaderboard ? 'var(--chess-gold)' : 'var(--chess-text-muted)',
                background: showLeaderboard ? 'var(--chess-gold-dim)' : 'transparent',
              }}
            >
              <Trophy size={15} />
              <span className="hidden sm:inline">Leaderboard</span>
            </button>
            <PlayerStats />
            <PlayerIdentity />
            <LoginButton />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {showProfileSetup && <ProfileSetupModal />}

        {showLeaderboard && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-chess text-2xl font-bold" style={{ color: 'var(--chess-gold)' }}>
                Leaderboard
              </h2>
              <button
                onClick={() => setShowLeaderboard(false)}
                className="text-sm px-3 py-1 rounded transition-colors"
                style={{ color: 'var(--chess-text-muted)' }}
              >
                ✕ Close
              </button>
            </div>
            <Leaderboard />
          </div>
        )}

        {gameMode === 'online' && showOnlineSetup ? (
          <OnlineGameSetup onGameReady={handleGameReady} />
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
            {/* Left panel */}
            <div className="flex flex-col gap-4 lg:w-56 w-full">
              <GameModeSelector currentMode={gameMode} onModeChange={handleModeChange} />

              {showClocks && (
                <div
                  className="rounded-lg p-4 border"
                  style={{ background: 'var(--chess-status-bg)', borderColor: 'var(--chess-border)' }}
                >
                  <div className="text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--chess-text-muted)' }}>
                    Clocks
                  </div>
                  <div className="space-y-2">
                    <div className={`flex items-center justify-between px-3 py-2 rounded ${gameStarted && gameState.currentPlayer === 'white' && !gameState.gameOver ? 'ring-1 ring-chess-gold' : ''}`}
                      style={{ background: 'var(--chess-bg)' }}>
                      <span className="text-sm" style={{ color: 'var(--chess-text)' }}>♔ White</span>
                      <span className={`font-mono font-bold text-lg ${!gameStarted ? 'opacity-50' : ''}`}
                        style={{ color: gameStarted && gameState.currentPlayer === 'white' && !gameState.gameOver ? 'var(--chess-gold)' : 'var(--chess-text)' }}>
                        {formatTime(whiteTime)}
                      </span>
                    </div>
                    <div className={`flex items-center justify-between px-3 py-2 rounded ${gameStarted && gameState.currentPlayer === 'black' && !gameState.gameOver ? 'ring-1 ring-chess-gold' : ''}`}
                      style={{ background: 'var(--chess-bg)' }}>
                      <span className="text-sm" style={{ color: 'var(--chess-text)' }}>♚ Black</span>
                      <span className={`font-mono font-bold text-lg ${!gameStarted ? 'opacity-50' : ''}`}
                        style={{ color: gameStarted && gameState.currentPlayer === 'black' && !gameState.gameOver ? 'var(--chess-gold)' : 'var(--chess-text)' }}>
                        {formatTime(blackTime)}
                      </span>
                    </div>
                  </div>
                  {!gameStarted && (
                    <p className="text-xs mt-2 text-center" style={{ color: 'var(--chess-text-muted)' }}>
                      Timers start on game begin
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Board area */}
            <div className="flex flex-col items-center gap-4 flex-1">
              <GameStatus
                gameOver={gameState.gameOver}
                drawReason={gameState.drawReason}
                isCheck={gameState.isCheck}
                currentPlayer={gameState.currentPlayer}
                gameMode={gameMode}
                isAIThinking={isAiThinking}
                whiteTime={showClocks ? whiteTime : undefined}
                blackTime={showClocks ? blackTime : undefined}
                toggleMute={toggleMute}
                isMuted={isMuted}
                gameStarted={gameStarted}
              />

              <div className="relative">
                <ChessBoard
                  board={gameState.board}
                  selectedPiece={gameState.selectedPiece}
                  validMoves={gameStarted ? validMoves : []}
                  checkKingPosition={checkKingPosition}
                  onSquareClick={handleSquareClick}
                  isAIThinking={isAiThinking}
                  isAutoPlaying={gameMode === 'auto-play'}
                  isGameOver={!!gameState.gameOver}
                  gameOver={gameState.gameOver}
                  gameOverMessage={getGameOverMessage()}
                  lastMove={gameState.lastMove}
                  currentPlayer={gameState.currentPlayer}
                  gameStarted={gameStarted}
                />

                {/* Start Game overlay */}
                {!gameStarted && !gameState.gameOver && (
                  <div
                    className="absolute inset-0 flex items-center justify-center z-20"
                    style={{ background: 'rgba(0,0,0,0.45)', borderRadius: '4px' }}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Button
                        onClick={handleStartGame}
                        size="lg"
                        className="font-chess font-bold text-base px-8 py-5 rounded-sm shadow-2xl transition-all duration-150 hover:scale-105 active:scale-95"
                        style={{
                          background: 'var(--chess-gold)',
                          color: 'var(--chess-dark)',
                          border: '2px solid var(--chess-gold)',
                        }}
                      >
                        <Play className="mr-2 h-5 w-5 fill-current" />
                        Start Game
                      </Button>
                      <p className="text-white/70 text-xs font-medium tracking-wide">
                        Click to begin the match
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* New Game button */}
              {(gameState.gameOver || gameStarted) && (
                <button
                  onClick={handleNewGame}
                  className="px-6 py-2 rounded text-sm font-medium transition-colors border"
                  style={{
                    borderColor: 'var(--chess-gold)',
                    color: 'var(--chess-gold)',
                    background: 'transparent',
                  }}
                >
                  New Game
                </button>
              )}
            </div>

            {/* Right spacer for layout balance */}
            <div className="lg:w-56 w-full" />
          </div>
        )}
      </main>

      {/* Game Results Panel */}
      {showResults && gameState.gameOver && (
        <GameResultsPanel
          open={showResults}
          gameOver={gameState.gameOver}
          drawReason={gameState.drawReason}
          pointsEarned={pointsEarned}
          isAuthenticated={isAuthenticated}
          onNewGame={() => { handleNewGame(); }}
          onClose={() => setShowResults(false)}
        />
      )}

      {/* Footer */}
      <footer
        className="border-t py-3 px-4 text-center text-xs"
        style={{ borderColor: 'var(--chess-border)', color: 'var(--chess-text-muted)', background: 'var(--chess-status-bg)' }}
      >
        © {new Date().getFullYear()} Chess Khelo Online &nbsp;·&nbsp; Built with{' '}
        <span style={{ color: '#e05' }}>♥</span> using{' '}
        <a
          href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'chess-khelo-online')}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--chess-gold)' }}
          className="hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
