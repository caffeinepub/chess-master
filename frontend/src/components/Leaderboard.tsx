import React from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useQuery } from '@tanstack/react-query';
import { useActor } from '../hooks/useActor';
import { Trophy, Medal, Award } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy size={14} className="text-yellow-400" />;
  if (rank === 2) return <Medal size={14} className="text-gray-300" />;
  if (rank === 3) return <Award size={14} className="text-amber-600" />;
  return <span className="text-xs text-chess-muted w-3.5 text-center">{rank}</span>;
}

export default function Leaderboard() {
  const { data: leaderboard, isLoading, isError } = useLeaderboard();
  const { actor } = useActor();

  // Fetch profiles for display names
  const { data: profiles } = useQuery({
    queryKey: ['leaderboardProfiles', leaderboard?.map(([p]) => p.toString())],
    queryFn: async () => {
      if (!actor || !leaderboard) return {};
      const map: Record<string, string> = {};
      await Promise.all(
        leaderboard.map(async ([principal]) => {
          try {
            const profile = await actor.getUserProfile(principal);
            if (profile?.name) map[principal.toString()] = profile.name;
          } catch {
            // ignore
          }
        })
      );
      return map;
    },
    enabled: !!actor && !!leaderboard && leaderboard.length > 0,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-8 bg-chess-hover rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-center text-sm text-chess-muted p-4">Failed to load leaderboard.</p>;
  }

  const sorted = [...(leaderboard ?? [])].sort((a, b) => Number(b[1].points) - Number(a[1].points));

  if (sorted.length === 0) {
    return <p className="text-center text-sm text-chess-muted p-4">No players yet. Be the first!</p>;
  }

  return (
    <ScrollArea className="h-64">
      <div className="flex flex-col gap-1 p-2">
        {sorted.map(([principal, stats], idx) => {
          const rank = idx + 1;
          const pid = principal.toString();
          const name = profiles?.[pid] || pid.substring(0, 8) + '…';
          return (
            <div key={pid} className="grid grid-cols-[24px_1fr_48px_40px_40px] items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-chess-hover transition-colors text-chess-panel-fg">
              <div className="flex items-center justify-center shrink-0">
                <RankIcon rank={rank} />
              </div>
              <span className="text-sm font-medium truncate">{name}</span>
              <span className="text-xs font-bold text-chess-accent text-right">{Number(stats.points)}</span>
              <span className="text-xs text-chess-muted text-right">{Number(stats.wins)}W</span>
              <span className="text-xs text-chess-muted text-right">{Number(stats.gamesPlayed)}G</span>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
