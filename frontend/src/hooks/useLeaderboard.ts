import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { PlayerStats } from '../backend';
import type { Principal } from '@dfinity/principal';

export function useLeaderboard() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Array<[Principal, PlayerStats]>>({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const data = await actor.getLeaderboard();
      return data as Array<[Principal, PlayerStats]>;
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 60000,
  });
}
