import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { PlayerStats } from '../backend';
import type { Principal } from '@icp-sdk/core/principal';

export function useLeaderboard() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Array<[Principal, PlayerStats]>>({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeaderboard();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 60000,
  });
}
