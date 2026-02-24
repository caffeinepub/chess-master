import React, { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useCreateGame, useJoinGame } from '../hooks/useOnlineGame';
import { Copy, LogIn } from 'lucide-react';

interface OnlineGameSetupProps {
  onGameReady: (gameId: string) => void;
}

function generateGameId(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export default function OnlineGameSetup({ onGameReady }: OnlineGameSetupProps) {
  const { identity } = useInternetIdentity();
  const { createGameMutation } = useCreateGame();
  const { joinGameMutation } = useJoinGame();
  const [joinId, setJoinId] = useState('');
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!identity) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 bg-chess-panel rounded-xl text-chess-panel-fg">
        <LogIn size={32} className="text-chess-accent" />
        <p className="text-center text-sm">Please log in to play online multiplayer games.</p>
      </div>
    );
  }

  const handleCreate = async () => {
    const gameId = generateGameId();
    try {
      await createGameMutation.mutateAsync({
        gameId,
        whitePlayer: identity.getPrincipal(),
      });
      setCreatedId(gameId);
    } catch (e: any) {
      console.error('Create game error:', e);
    }
  };

  const handleJoin = async () => {
    if (!joinId.trim()) return;
    try {
      await joinGameMutation.mutateAsync(joinId.trim().toUpperCase());
      onGameReady(joinId.trim().toUpperCase());
    } catch (e: any) {
      console.error('Join game error:', e);
    }
  };

  const handleCopy = () => {
    if (createdId) {
      navigator.clipboard.writeText(createdId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartCreated = () => {
    if (createdId) onGameReady(createdId);
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-chess-panel rounded-xl text-chess-panel-fg">
      <h3 className="font-display font-bold text-lg text-center">Online Multiplayer</h3>

      {/* Create game */}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleCreate}
          disabled={createGameMutation.isPending}
          className="min-h-[44px] bg-chess-accent text-chess-accent-fg rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {createGameMutation.isPending ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating…</>
          ) : 'Create New Game'}
        </button>

        {createdId && (
          <div className="bg-chess-hover rounded-lg p-3 flex flex-col gap-2">
            <p className="text-xs text-chess-muted">Share this Game ID with your opponent:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-chess-bg text-chess-accent font-mono text-lg font-bold px-3 py-1 rounded text-center">
                {createdId}
              </code>
              <button onClick={handleCopy} className="p-2 hover:bg-chess-border rounded min-w-[44px] min-h-[44px] flex items-center justify-center">
                <Copy size={16} />
              </button>
            </div>
            {copied && <p className="text-xs text-chess-accent text-center">Copied!</p>}
            <button
              onClick={handleStartCreated}
              className="min-h-[44px] bg-chess-hover border border-chess-border text-chess-panel-fg rounded-lg font-medium hover:bg-chess-border transition-colors"
            >
              Wait for Opponent
            </button>
          </div>
        )}
        {createGameMutation.isError && (
          <p className="text-xs text-red-400 text-center">{(createGameMutation.error as Error).message}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-chess-border" />
        <span className="text-xs text-chess-muted">or</span>
        <div className="flex-1 h-px bg-chess-border" />
      </div>

      {/* Join game */}
      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={joinId}
          onChange={e => setJoinId(e.target.value.toUpperCase())}
          placeholder="Enter Game ID"
          className="min-h-[44px] px-3 py-2 bg-chess-bg border border-chess-border rounded-lg text-chess-panel-fg placeholder:text-chess-muted font-mono text-center text-lg focus:outline-none focus:border-chess-accent"
          maxLength={8}
          style={{ fontSize: '16px' }}
        />
        <button
          onClick={handleJoin}
          disabled={joinGameMutation.isPending || !joinId.trim()}
          className="min-h-[44px] bg-chess-panel border border-chess-accent text-chess-accent rounded-lg font-semibold hover:bg-chess-accent hover:text-chess-accent-fg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {joinGameMutation.isPending ? (
            <><div className="w-4 h-4 border-2 border-chess-accent border-t-transparent rounded-full animate-spin" /> Joining…</>
          ) : 'Join Game'}
        </button>
        {joinGameMutation.isError && (
          <p className="text-xs text-red-400 text-center">{(joinGameMutation.error as Error).message}</p>
        )}
      </div>
    </div>
  );
}
