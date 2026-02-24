import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { GameState } from '../backend';
import type { Principal } from '@dfinity/principal';

export function useOnlineGame(gameId: string | null) {
  const { actor, isFetching: actorFetching } = useActor();

  const gameQuery = useQuery<GameState | null>({
    queryKey: ['gameState', gameId],
    queryFn: async () => {
      if (!actor || !gameId) return null;
      return actor.getGameState(gameId);
    },
    enabled: !!actor && !actorFetching && !!gameId,
    refetchInterval: 1500,
  });

  return { gameQuery };
}

export function useCreateGame() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const createGameMutation = useMutation({
    mutationFn: async ({ gameId, whitePlayer }: { gameId: string; whitePlayer: Principal }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createGame(gameId, whitePlayer);
    },
    onSuccess: (_, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: ['gameState', gameId] });
    },
  });

  return { createGameMutation };
}

export function useJoinGame() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const joinGameMutation = useMutation({
    mutationFn: async (gameId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.joinGame(gameId);
    },
    onSuccess: (_, gameId) => {
      queryClient.invalidateQueries({ queryKey: ['gameState', gameId] });
    },
  });

  return { joinGameMutation };
}
