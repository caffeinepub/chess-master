import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { usePlayerStats } from '../hooks/usePlayerStats';
import { Trophy, Target, Gamepad2 } from 'lucide-react';

export default function PlayerStats() {
  const { identity } = useInternetIdentity();
  const { data: stats, isLoading } = usePlayerStats();

  if (!identity) return null;

  if (isLoading) {
    return (
      <div className="flex gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-7 w-16 bg-chess-hover rounded-full animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="flex gap-1.5 flex-wrap">
      <div className="flex items-center gap-1 bg-chess-hover px-2 py-1 rounded-full text-xs shrink-0">
        <Trophy size={12} className="text-yellow-400" />
        <span className="font-bold">{Number(stats.points)}</span>
        <span className="text-chess-muted">pts</span>
      </div>
      <div className="flex items-center gap-1 bg-chess-hover px-2 py-1 rounded-full text-xs shrink-0">
        <Target size={12} className="text-green-400" />
        <span className="font-bold">{Number(stats.wins)}</span>
        <span className="text-chess-muted">wins</span>
      </div>
      <div className="flex items-center gap-1 bg-chess-hover px-2 py-1 rounded-full text-xs shrink-0">
        <Gamepad2 size={12} className="text-chess-accent" />
        <span className="font-bold">{Number(stats.gamesPlayed)}</span>
        <span className="text-chess-muted">played</span>
      </div>
    </div>
  );
}
