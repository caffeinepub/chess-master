import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, GameMode, Player, Position, CastlingRights } from '../types/chess';
import { createInitialBoard, getPieceColor } from '../utils/chess-setup';
import { applyMove, applyCastlingMove, isInCheck, canCastle } from '../utils/move-validation';
import { getValidMoves } from '../utils/valid-moves';
import { getGameStatus } from '../utils/game-status';
import { getBestMove } from '../utils/ai-player';
import { trackPosition, hasThreefoldRepetition, clearPositionHistory, PositionHistory } from '../utils/position-tracker';
import { useBackgroundMusic } from '../hooks/useBackgroundMusic';
import { useMoveSound } from '../hooks/useMoveSound';
import { useRecordAIMatchResult } from '../hooks/usePlayerStats';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { AIMatchResult } from '../backend';
import ChessBoard from '../components/ChessBoard';
import GameStatus from '../components/GameStatus';
import GameModeSelector from '../components/GameModeSelector';
import GameResultsPanel from '../components/GameResultsPanel';
import OnlineGameSetup from '../components/OnlineGameSetup';
import PlayerStats from '../components/PlayerStats';
import Leaderboard from '../components/Leaderboard';
import OnlineChessGame from './OnlineChessGame';

const INITIAL_CASTLING: CastlingRights = {
  whiteKingside: true, whiteQueenside: true,
  blackKingside: true, blackQueenside: true,
};

const CLOCK_SECONDS = 10 * 60; // 10 minutes

function createInitialState(): GameState {
  return {
    board: createInitialBoard(),
    currentPlayer: 'white',
    selectedPiece: null,
    validMoves: [],
    lastMove: null,
    gameOver: false,
    result: null,
    drawReason: null,
    isCheck: false,
    castlingRights: INITIAL_CASTLING,
    enPassantTarget: null,
    moveCount: 0,
  };
}

function getCheckPosition(board: GameState['board'], player: Player): Position | null {
  if (!isInCheck(board, player)) return null;
  const king = player === 'white' ? '♔' : '♚';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === king) return { row: r, col: c };
    }
  }
  return null;
}

function isCastlingMove(board: GameState['board'], from: Position, to: Position): boolean {
  const piece = board[from.row][from.col];
  return (piece === '♔' || piece === '♚') && Math.abs(to.col - from.col) === 2;
}

function updateCastlingRights(rights: CastlingRights, from: Position, piece: string): CastlingRights {
  const updated = { ...rights };
  if (piece === '♔') { updated.whiteKingside = false; updated.whiteQueenside = false; }
  if (piece === '♚') { updated.blackKingside = false; updated.blackQueenside = false; }
  if (from.row === 7 && from.col === 0) updated.whiteQueenside = false;
  if (from.row === 7 && from.col === 7) updated.whiteKingside = false;
  if (from.row === 0 && from.col === 0) updated.blackQueenside = false;
  if (from.row === 0 && from.col === 7) updated.blackKingside = false;
  return updated;
}

function getEnPassantTarget(board: GameState['board'], from: Position, to: Position, piece: string): Position | null {
  if (piece === '♙' && from.row === 6 && to.row === 4) return { row: 5, col: to.col };
  if (piece === '♟' && from.row === 1 && to.row === 3) return { row: 2, col: to.col };
  return null;
}

export default function ChessGame() {
  const [gameMode, setGameMode] = useState<GameMode>('two-players');
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [whiteTime, setWhiteTime] = useState(CLOCK_SECONDS);
  const [blackTime, setBlackTime] = useState(CLOCK_SECONDS);
  const [onlineGameId, setOnlineGameId] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const positionHistoryRef = useRef<PositionHistory>(new Map());
  const clockRef = useRef<number | null>(null);
  const autoPlayRef = useRef<number | null>(null);

  const { startMusic, stopMusic, toggleMute, isMuted } = useBackgroundMusic();
  const { playMoveSound } = useMoveSound();
  const { mutate: recordAIResult } = useRecordAIMatchResult();
  const { identity } = useInternetIdentity();

  // Start music on first interaction
  useEffect(() => {
    const handler = () => { startMusic(); document.removeEventListener('click', handler); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [startMusic]);

  // Clock countdown
  useEffect(() => {
    if (gameState.gameOver || gameMode === 'auto-play') {
      if (clockRef.current) clearInterval(clockRef.current);
      return;
    }
    clockRef.current = window.setInterval(() => {
      if (gameState.currentPlayer === 'white') {
        setWhiteTime(t => {
          if (t <= 1) {
            setGameState(prev => ({ ...prev, gameOver: true, result: 'black', drawReason: null }));
            return 0;
          }
          return t - 1;
        });
      } else {
        setBlackTime(t => {
          if (t <= 1) {
            setGameState(prev => ({ ...prev, gameOver: true, result: 'white', drawReason: null }));
            return 0;
          }
          return t - 1;
        });
      }
    }, 1000);
    return () => { if (clockRef.current) clearInterval(clockRef.current); };
  }, [gameState.currentPlayer, gameState.gameOver, gameMode]);

  // AI move
  const makeAIMove = useCallback((state: GameState) => {
    setIsAIThinking(true);
    setTimeout(() => {
      const move = getBestMove(state.board, state.currentPlayer, state.castlingRights, state.enPassantTarget, 3);
      if (!move) {
        setIsAIThinking(false);
        return;
      }
      const piece = state.board[move.from.row][move.from.col];
      let newBoard = isCastlingMove(state.board, move.from, move.to)
        ? applyCastlingMove(state.board, move.from, move.to)
        : applyMove(state.board, move.from, move.to, state.currentPlayer, state.enPassantTarget);

      const newCastling = piece ? updateCastlingRights(state.castlingRights, move.from, piece) : state.castlingRights;
      const newEP = piece ? getEnPassantTarget(state.board, move.from, move.to, piece) : null;
      const nextPlayer: Player = state.currentPlayer === 'white' ? 'black' : 'white';

      positionHistoryRef.current = trackPosition(positionHistoryRef.current, newBoard, nextPlayer);
      const isRepetition = hasThreefoldRepetition(positionHistoryRef.current, newBoard, nextPlayer);

      const status = getGameStatus(newBoard, nextPlayer, isRepetition ? 'threefold-repetition' : null);

      playMoveSound();

      const newState: GameState = {
        ...state,
        board: newBoard,
        currentPlayer: nextPlayer,
        selectedPiece: null,
        validMoves: [],
        lastMove: move,
        gameOver: status.status === 'checkmate' || status.status === 'stalemate' || status.status === 'draw',
        result: status.result,
        drawReason: status.drawReason,
        isCheck: status.status === 'check',
        castlingRights: newCastling,
        enPassantTarget: newEP,
        moveCount: state.moveCount + 1,
      };

      setGameState(newState);
      setIsAIThinking(false);

      // Record result for vs AI mode
      if (gameMode === 'one-player' && newState.gameOver && identity) {
        if (newState.result === 'draw') recordAIResult(AIMatchResult.draw);
        else if (newState.result === 'white') recordAIResult(AIMatchResult.win); // player is white
        else recordAIResult(AIMatchResult.loss);
      }
    }, 400);
  }, [playMoveSound, gameMode, identity, recordAIResult]);

  // Auto-play
  useEffect(() => {
    if (gameMode !== 'auto-play' || gameState.gameOver) {
      if (autoPlayRef.current) clearTimeout(autoPlayRef.current);
      return;
    }
    autoPlayRef.current = window.setTimeout(() => {
      makeAIMove(gameState);
    }, 600);
    return () => { if (autoPlayRef.current) clearTimeout(autoPlayRef.current); };
  }, [gameMode, gameState, makeAIMove]);

  // vs AI: trigger AI move when it's black's turn
  useEffect(() => {
    if (gameMode !== 'one-player' || gameState.currentPlayer !== 'black' || gameState.gameOver || isAIThinking) return;
    makeAIMove(gameState);
  }, [gameMode, gameState.currentPlayer, gameState.gameOver, isAIThinking, makeAIMove, gameState]);

  const handleSquareClick = useCallback((pos: Position) => {
    if (gameState.gameOver || isAIThinking) return;
    if (gameMode === 'auto-play') return;
    if (gameMode === 'one-player' && gameState.currentPlayer === 'black') return;

    const { board, currentPlayer, selectedPiece, castlingRights, enPassantTarget } = gameState;
    const clickedPiece = board[pos.row][pos.col];

    // If a piece is selected and clicking a valid move
    if (selectedPiece) {
      const isValid = gameState.validMoves.some(m => m.row === pos.row && m.col === pos.col);
      if (isValid) {
        const piece = board[selectedPiece.row][selectedPiece.col];
        let newBoard = isCastlingMove(board, selectedPiece, pos)
          ? applyCastlingMove(board, selectedPiece, pos)
          : applyMove(board, selectedPiece, pos, currentPlayer, enPassantTarget);

        const newCastling = piece ? updateCastlingRights(castlingRights, selectedPiece, piece) : castlingRights;
        const newEP = piece ? getEnPassantTarget(board, selectedPiece, pos, piece) : null;
        const nextPlayer: Player = currentPlayer === 'white' ? 'black' : 'white';

        positionHistoryRef.current = trackPosition(positionHistoryRef.current, newBoard, nextPlayer);
        const isRepetition = hasThreefoldRepetition(positionHistoryRef.current, newBoard, nextPlayer);

        const status = getGameStatus(newBoard, nextPlayer, isRepetition ? 'threefold-repetition' : null);

        playMoveSound();

        setGameState(prev => ({
          ...prev,
          board: newBoard,
          currentPlayer: nextPlayer,
          selectedPiece: null,
          validMoves: [],
          lastMove: { from: selectedPiece, to: pos },
          gameOver: status.status === 'checkmate' || status.status === 'stalemate' || status.status === 'draw',
          result: status.result,
          drawReason: status.drawReason,
          isCheck: status.status === 'check',
          castlingRights: newCastling,
          enPassantTarget: newEP,
          moveCount: prev.moveCount + 1,
        }));
        return;
      }

      // Deselect or select new piece
      if (clickedPiece && getPieceColor(clickedPiece) === currentPlayer) {
        const moves = getValidMoves(board, pos, enPassantTarget, currentPlayer, castlingRights);
        setGameState(prev => ({ ...prev, selectedPiece: pos, validMoves: moves }));
        return;
      }

      setGameState(prev => ({ ...prev, selectedPiece: null, validMoves: [] }));
      return;
    }

    // Select piece
    if (clickedPiece && getPieceColor(clickedPiece) === currentPlayer) {
      const moves = getValidMoves(board, pos, enPassantTarget, currentPlayer, castlingRights);
      setGameState(prev => ({ ...prev, selectedPiece: pos, validMoves: moves }));
    }
  }, [gameState, isAIThinking, gameMode, playMoveSound]);

  const handleNewGame = useCallback(() => {
    positionHistoryRef.current = clearPositionHistory(positionHistoryRef.current);
    setGameState(createInitialState());
    setWhiteTime(CLOCK_SECONDS);
    setBlackTime(CLOCK_SECONDS);
    setIsAIThinking(false);
    setOnlineGameId(null);
  }, []);

  const handleModeChange = useCallback((mode: GameMode) => {
    setGameMode(mode);
    handleNewGame();
  }, [handleNewGame]);

  const checkPos = gameState.isCheck ? getCheckPosition(gameState.board, gameState.currentPlayer) : null;

  // Points earned for result panel
  const getPointsEarned = () => {
    if (!identity) return 0;
    if (gameMode !== 'one-player') return 0;
    if (gameState.result === 'white') return 10;
    if (gameState.result === 'draw') return 3;
    return 0;
  };

  // Online mode
  if (gameMode === 'online') {
    if (!onlineGameId) {
      return (
        <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
          <GameModeSelector selectedMode={gameMode} onSelectMode={handleModeChange} isAuthenticated={!!identity} />
          <OnlineGameSetup onGameReady={setOnlineGameId} />
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
        <GameModeSelector selectedMode={gameMode} onSelectMode={handleModeChange} isAuthenticated={!!identity} />
        <OnlineChessGame gameId={onlineGameId} onLeave={() => setOnlineGameId(null)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3 max-w-lg mx-auto w-full">
      {/* Mode selector */}
      <GameModeSelector selectedMode={gameMode} onSelectMode={handleModeChange} isAuthenticated={!!identity} />

      {/* Player stats */}
      {identity && <PlayerStats />}

      {/* Game status */}
      <GameStatus
        currentPlayer={gameState.currentPlayer}
        gameOver={gameState.gameOver}
        result={gameState.result}
        drawReason={gameState.drawReason}
        isCheck={gameState.isCheck}
        isAIThinking={isAIThinking}
        whiteTime={whiteTime}
        blackTime={blackTime}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        gameMode={gameMode}
      />

      {/* Chess board */}
      <ChessBoard
        board={gameState.board}
        selectedPiece={gameState.selectedPiece}
        validMoves={gameState.validMoves}
        lastMove={gameState.lastMove}
        checkPosition={checkPos}
        onSquareClick={handleSquareClick}
        disabled={gameState.gameOver || isAIThinking || gameMode === 'auto-play'}
        isAIThinking={isAIThinking}
      />

      {/* Leaderboard toggle */}
      <button
        onClick={() => setShowLeaderboard(v => !v)}
        className="text-xs text-chess-accent underline text-center py-1"
      >
        {showLeaderboard ? 'Hide Leaderboard' : 'Show Leaderboard'}
      </button>

      {showLeaderboard && (
        <div className="bg-chess-panel rounded-xl border border-chess-border overflow-hidden">
          <h3 className="font-display font-bold text-sm px-3 py-2 border-b border-chess-border text-chess-panel-fg">
            🏆 Leaderboard
          </h3>
          <Leaderboard />
        </div>
      )}

      {/* Game result panel */}
      {gameState.gameOver && (
        <GameResultsPanel
          result={gameState.result}
          drawReason={gameState.drawReason}
          pointsEarned={getPointsEarned()}
          onNewGame={handleNewGame}
          currentPlayerColor={gameMode === 'one-player' ? 'white' : undefined}
        />
      )}
    </div>
  );
}
