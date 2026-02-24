import React, { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useOnlineGame } from '../hooks/useOnlineGame';
import { Copy, Check, Loader2, LogIn } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface OnlineGameSetupProps {
  onGameReady: (gameId: string, playerColor: 'white' | 'black') => void;
}

function generateGameId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function OnlineGameSetup({ onGameReady }: OnlineGameSetupProps) {
  const { identity } = useInternetIdentity();
  const [createdGameId, setCreatedGameId] = useState<string | null>(null);
  const [joinId, setJoinId] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const { createGameMutation, joinGameMutation } = useOnlineGame(null);

  const isAuthenticated = !!identity;

  const handleCreate = async () => {
    setError('');
    const newId = generateGameId();
    try {
      await createGameMutation.mutateAsync(newId);
      setCreatedGameId(newId);
    } catch (e: unknown) {
      const err = e as Error;
      setError(err?.message || 'Failed to create game.');
    }
  };

  const handleJoin = async () => {
    setError('');
    const id = joinId.trim().toUpperCase();
    if (!id) {
      setError('Please enter a game ID.');
      return;
    }
    try {
      await joinGameMutation.mutateAsync(id);
      onGameReady(id, 'black');
    } catch (e: unknown) {
      const err = e as Error;
      setError(err?.message || 'Failed to join game.');
    }
  };

  const handleCopy = () => {
    if (createdGameId) {
      navigator.clipboard.writeText(createdGameId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartWaiting = () => {
    if (createdGameId) {
      onGameReady(createdGameId, 'white');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 rounded-xl border border-chess-gold/30 bg-chess-dark/60 max-w-sm mx-auto text-center">
        <div className="text-4xl">🌐</div>
        <h3 className="text-chess-gold font-playfair text-xl font-semibold">Online Multiplayer</h3>
        <p className="text-chess-cream/70 text-sm">
          You need to be logged in to play online. Please login with Internet Identity to create or join a game.
        </p>
        <div className="flex items-center gap-2 text-chess-gold/60 text-sm">
          <LogIn size={16} />
          <span>Login required</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 rounded-xl border border-chess-gold/30 bg-chess-dark/60 max-w-sm mx-auto">
      <div className="text-center">
        <div className="text-3xl mb-2">🌐</div>
        <h3 className="text-chess-gold font-playfair text-xl font-semibold">Online Multiplayer</h3>
        <p className="text-chess-cream/60 text-xs mt-1">Play chess with a friend online</p>
      </div>

      {/* Create Game */}
      <div className="space-y-3">
        <h4 className="text-chess-gold/80 text-sm font-semibold uppercase tracking-wide">Create a Game</h4>
        {!createdGameId ? (
          <Button
            onClick={handleCreate}
            disabled={createGameMutation.isPending}
            className="w-full bg-chess-gold text-chess-dark hover:bg-chess-gold/90 font-semibold"
          >
            {createGameMutation.isPending ? (
              <><Loader2 size={14} className="animate-spin mr-2" />Creating…</>
            ) : (
              '+ Create New Game'
            )}
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-chess-cream/70 text-xs">Share this Game ID with your opponent:</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 rounded-md bg-chess-dark border border-chess-gold/40 text-chess-gold font-mono font-bold text-lg tracking-widest text-center">
                {createdGameId}
              </div>
              <button
                onClick={handleCopy}
                className="p-2 rounded-md border border-chess-gold/30 text-chess-gold/70 hover:text-chess-gold hover:bg-chess-gold/10 transition-colors"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <Button
              onClick={handleStartWaiting}
              className="w-full bg-chess-gold/20 border border-chess-gold/40 text-chess-gold hover:bg-chess-gold/30 font-semibold"
            >
              Start Waiting for Opponent
            </Button>
          </div>
        )}
      </div>

      <div className="border-t border-chess-gold/20" />

      {/* Join Game */}
      <div className="space-y-3">
        <h4 className="text-chess-gold/80 text-sm font-semibold uppercase tracking-wide">Join a Game</h4>
        <div className="flex gap-2">
          <Input
            value={joinId}
            onChange={e => setJoinId(e.target.value.toUpperCase())}
            placeholder="Enter Game ID…"
            maxLength={6}
            className="bg-chess-dark/80 border-chess-gold/30 text-chess-cream placeholder:text-chess-cream/40 focus:border-chess-gold font-mono uppercase tracking-widest"
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
          />
          <Button
            onClick={handleJoin}
            disabled={joinGameMutation.isPending || !joinId.trim()}
            className="bg-chess-gold/20 border border-chess-gold/40 text-chess-gold hover:bg-chess-gold/30 font-semibold px-4"
          >
            {joinGameMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Join'}
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center bg-red-400/10 rounded-md px-3 py-2">{error}</p>
      )}
    </div>
  );
}
