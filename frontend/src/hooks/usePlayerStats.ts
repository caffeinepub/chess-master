import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { PlayerStats, AIMatchResult } from '../backend';
import { useInternetIdentity } from './useInternetIdentity';

export function usePlayerStats() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<PlayerStats>({
    queryKey: ['playerStats'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getPlayerStats();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: 2,
    refetchInterval: 30000,
  });
}

export function useRecordAIMatchResult() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (result: AIMatchResult) => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordAIMatchResult(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playerStats'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}
