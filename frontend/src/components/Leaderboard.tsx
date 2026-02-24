import React from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { Trophy, Star, Gamepad2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LeaderboardProps {
  userProfiles?: Map<string, string>;
}

export default function Leaderboard({ userProfiles }: LeaderboardProps) {
  const { data: leaderboard, isLoading } = useLeaderboard();

  const sorted = leaderboard
    ? [...leaderboard].sort((a, b) => Number(b[1].points) - Number(a[1].points))
    : [];

  const getDisplayName = (principal: { toString(): string }) => {
    const p = principal.toString();
    if (userProfiles?.has(p)) return userProfiles.get(p)!;
    return `${p.slice(0, 5)}…${p.slice(-4)}`;
  };

  return (
    <div className="rounded-xl border border-chess-gold/30 bg-chess-dark/80 overflow-hidden">
      <div className="px-4 py-3 border-b border-chess-gold/20 flex items-center gap-2">
        <Trophy size={16} className="text-chess-gold" />
        <h3 className="text-chess-gold font-playfair font-semibold text-sm">Leaderboard</h3>
      </div>
      {isLoading ? (
        <div className="p-4 text-center text-chess-cream/50 text-sm">Loading…</div>
      ) : sorted.length === 0 ? (
        <div className="p-4 text-center text-chess-cream/50 text-sm">No players yet. Be the first!</div>
      ) : (
        <ScrollArea className="max-h-64">
          <div className="divide-y divide-chess-gold/10">
            {sorted.slice(0, 20).map(([principal, stats], idx) => (
              <div key={principal.toString()} className="flex items-center gap-3 px-4 py-2.5">
                <span className={`w-6 text-center text-xs font-bold ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-amber-600' : 'text-chess-cream/40'}`}>
                  {idx + 1}
                </span>
                <span className="flex-1 text-chess-cream/90 text-sm truncate">
                  {getDisplayName(principal)}
                </span>
                <span className="flex items-center gap-1 text-chess-gold text-xs">
                  <Star size={11} />
                  {stats.points.toString()}
                </span>
                <span className="flex items-center gap-1 text-chess-cream/50 text-xs">
                  <Trophy size={11} />
                  {stats.wins.toString()}
                </span>
                <span className="flex items-center gap-1 text-chess-cream/40 text-xs">
                  <Gamepad2 size={11} />
                  {stats.gamesPlayed.toString()}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
