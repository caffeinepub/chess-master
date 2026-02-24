import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GameState, Player, Position, CastlingRights } from '../types/chess';
import { createInitialBoard, getPieceColor } from '../utils/chess-setup';
import { applyMove, applyCastlingMove, isInCheck } from '../utils/move-validation';
import { getValidMoves } from '../utils/valid-moves';
import { getGameStatus } from '../utils/game-status';
import { trackPosition, hasThreefoldRepetition, clearPositionHistory, PositionHistory } from '../utils/position-tracker';
import { backendToFrontendBoard } from '../utils/backend-sync';
import { useOnlineGame } from '../hooks/useOnlineGame';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useMoveSound } from '../hooks/useMoveSound';
import { Color } from '../backend';
import ChessBoard from '../components/ChessBoard';
import GameStatus from '../components/GameStatus';
import GameResultsPanel from '../components/GameResultsPanel';
import { ArrowLeft, Loader2, Users } from 'lucide-react';

const INITIAL_CASTLING: CastlingRights = {
  whiteKingside: true, whiteQueenside: true,
  blackKingside: true, blackQueenside: true,
};

function createLocalState(): GameState {
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

interface OnlineChessGameProps {
  gameId: string;
  onLeave: () => void;
}

export default function OnlineChessGame({ gameId, onLeave }: OnlineChessGameProps) {
  const { identity } = useInternetIdentity();
  const { gameQuery } = useOnlineGame(gameId);
  const { playMoveSound } = useMoveSound();

  const [localState, setLocalState] = useState<GameState>(createLocalState());
  const [myColor, setMyColor] = useState<Player | null>(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(true);
  const positionHistoryRef = useRef<PositionHistory>(new Map());
  const lastSyncedMoveRef = useRef<number>(0);

  const backendGame = gameQuery.data;

  // Determine player color
  useEffect(() => {
    if (!backendGame || !identity) return;
    const myPrincipal = identity.getPrincipal().toString();
    if (backendGame.whitePlayer.toString() === myPrincipal) setMyColor('white');
    else if (backendGame.blackPlayer.toString() === myPrincipal) setMyColor('black');
  }, [backendGame, identity]);

  // Sync board from backend
  useEffect(() => {
    if (!backendGame) return;
    const isAnon = backendGame.blackPlayer.toString() === 'aaaaa-aa';
    setWaitingForOpponent(isAnon);

    if (!isAnon) {
      const frontendBoard = backendToFrontendBoard(backendGame.board);
      const currentPlayer: Player = backendGame.currentTurn === Color.white ? 'white' : 'black';

      // Only sync if board changed
      const boardStr = JSON.stringify(frontendBoard);
      const prevBoardStr = JSON.stringify(localState.board);
      if (boardStr !== prevBoardStr) {
        positionHistoryRef.current = trackPosition(positionHistoryRef.current, frontendBoard, currentPlayer);
        const isRepetition = hasThreefoldRepetition(positionHistoryRef.current, frontendBoard, currentPlayer);
        const status = getGameStatus(frontendBoard, currentPlayer, isRepetition ? 'threefold-repetition' : null);

        setLocalState(prev => ({
          ...prev,
          board: frontendBoard,
          currentPlayer,
          selectedPiece: null,
          validMoves: [],
          gameOver: status.status === 'checkmate' || status.status === 'stalemate' || status.status === 'draw',
          result: status.result,
          drawReason: status.drawReason,
          isCheck: status.status === 'check',
        }));
        playMoveSound();
      }
    }
  }, [backendGame]);

  const handleSquareClick = useCallback((pos: Position) => {
    if (!myColor || localState.gameOver || waitingForOpponent) return;
    if (localState.currentPlayer !== myColor) return;

    const { board, currentPlayer, selectedPiece, castlingRights, enPassantTarget } = localState;
    const clickedPiece = board[pos.row][pos.col];

    if (selectedPiece) {
      const isValid = localState.validMoves.some(m => m.row === pos.row && m.col === pos.col);
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

        setLocalState(prev => ({
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

      if (clickedPiece && getPieceColor(clickedPiece) === currentPlayer) {
        const moves = getValidMoves(board, pos, enPassantTarget, currentPlayer, castlingRights);
        setLocalState(prev => ({ ...prev, selectedPiece: pos, validMoves: moves }));
        return;
      }

      setLocalState(prev => ({ ...prev, selectedPiece: null, validMoves: [] }));
      return;
    }

    if (clickedPiece && getPieceColor(clickedPiece) === currentPlayer) {
      const moves = getValidMoves(board, pos, enPassantTarget, currentPlayer, castlingRights);
      setLocalState(prev => ({ ...prev, selectedPiece: pos, validMoves: moves }));
    }
  }, [localState, myColor, waitingForOpponent, playMoveSound]);

  const checkPos = localState.isCheck ? getCheckPosition(localState.board, localState.currentPlayer) : null;

  if (gameQuery.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 size={32} className="animate-spin text-chess-accent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={onLeave} className="p-2 rounded hover:bg-chess-hover transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center text-chess-panel-fg">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <p className="text-xs text-chess-muted">Game ID</p>
          <code className="text-sm font-mono font-bold text-chess-accent">{gameId}</code>
        </div>
        {myColor && (
          <div className="text-xs bg-chess-hover px-2 py-1 rounded text-chess-panel-fg">
            You: {myColor === 'white' ? '♔ White' : '♚ Black'}
          </div>
        )}
      </div>

      {waitingForOpponent ? (
        <div className="flex flex-col items-center gap-3 p-6 bg-chess-panel rounded-xl text-chess-panel-fg">
          <Users size={32} className="text-chess-accent animate-pulse" />
          <p className="text-sm font-medium">Waiting for opponent to join…</p>
          <p className="text-xs text-chess-muted">Share Game ID: <strong className="text-chess-accent">{gameId}</strong></p>
        </div>
      ) : (
        <>
          <GameStatus
            currentPlayer={localState.currentPlayer}
            gameOver={localState.gameOver}
            result={localState.result}
            drawReason={localState.drawReason}
            isCheck={localState.isCheck}
          />

          <ChessBoard
            board={localState.board}
            selectedPiece={localState.selectedPiece}
            validMoves={localState.validMoves}
            lastMove={localState.lastMove}
            checkPosition={checkPos}
            onSquareClick={handleSquareClick}
            disabled={localState.gameOver || localState.currentPlayer !== myColor}
            flipped={myColor === 'black'}
          />

          {localState.gameOver && (
            <GameResultsPanel
              result={localState.result}
              drawReason={localState.drawReason}
              onNewGame={onLeave}
              onClose={onLeave}
              currentPlayerColor={myColor}
            />
          )}
        </>
      )}
    </div>
  );
}
