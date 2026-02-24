import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { GameState as BackendGameState } from '../backend';

export function useOnlineGame(gameId: string | null) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const gameQuery = useQuery<BackendGameState | null>({
    queryKey: ['onlineGame', gameId],
    queryFn: async () => {
      if (!actor || !gameId) return null;
      try {
        return await actor.getGameState(gameId);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !actorFetching && !!gameId && !!identity,
    refetchInterval: 1500,
  });

  const createGameMutation = useMutation({
    mutationFn: async (newGameId: string) => {
      if (!actor || !identity) throw new Error('Not authenticated');
      const principal = identity.getPrincipal();
      await actor.createGame(newGameId, principal);
      return newGameId;
    },
  });

  const joinGameMutation = useMutation({
    mutationFn: async (joinGameId: string) => {
      if (!actor || !identity) throw new Error('Not authenticated');
      await actor.joinGame(joinGameId);
      return joinGameId;
    },
  });

  const invalidateGame = () => {
    queryClient.invalidateQueries({ queryKey: ['onlineGame', gameId] });
  };

  return {
    gameQuery,
    createGameMutation,
    joinGameMutation,
    invalidateGame,
    currentPrincipal: identity?.getPrincipal(),
  };
}
