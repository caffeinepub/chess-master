import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { PlayerStats } from '../backend';

export function usePlayerStats() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const principal = identity?.getPrincipal();

  return useQuery<PlayerStats | null>({
    queryKey: ['playerStats', principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return null;
      try {
        return await actor.getPlayerStats(principal);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !actorFetching && !!principal,
    refetchInterval: 30000,
  });
}
