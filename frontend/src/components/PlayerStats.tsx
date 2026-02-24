import React from 'react';
import { usePlayerStats } from '../hooks/usePlayerStats';
import { Trophy, Star } from 'lucide-react';

export default function PlayerStats() {
  const { data: stats, isLoading } = usePlayerStats();

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 px-3 py-1.5 rounded-md bg-chess-dark/60 border border-chess-gold/20 text-sm text-chess-gold/50">
        Loading stats…
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-md bg-chess-dark/60 border border-chess-gold/20 text-sm">
      <span className="flex items-center gap-1 text-chess-gold">
        <Star size={13} />
        <span className="font-bold">{stats.points.toString()}</span>
        <span className="text-chess-gold/60 text-xs">pts</span>
      </span>
      <span className="flex items-center gap-1 text-chess-gold/80">
        <Trophy size={13} />
        <span className="font-bold">{stats.wins.toString()}</span>
        <span className="text-chess-gold/60 text-xs">wins</span>
      </span>
    </div>
  );
}
