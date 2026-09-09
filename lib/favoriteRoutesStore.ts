import { create } from 'zustand';
import { getFavoriteRoutes, saveFavoriteRoutes } from './storage';
import type { FavoriteRoute } from '../types';

type FavoriteRouteInput = { fromEva: string; fromName: string; toEva: string; toName: string };

function routeId(fromEva: string, toEva: string): string {
  return `${fromEva}-${toEva}`;
}

type FavoriteRoutesState = {
  favoriteRoutes: FavoriteRoute[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  isFavoriteRoute: (fromEva: string, toEva: string) => boolean;
  addFavoriteRoute: (route: FavoriteRouteInput) => Promise<void>;
  removeFavoriteRoute: (id: string) => Promise<void>;
  reorderFavoriteRoutes: (orderedIds: string[]) => Promise<void>;
};

export const useFavoriteRoutesStore = create<FavoriteRoutesState>((set, get) => ({
  favoriteRoutes: [],
  hydrated: false,

  hydrate: async () => {
    const favoriteRoutes = await getFavoriteRoutes();
    set({ favoriteRoutes, hydrated: true });
  },

  isFavoriteRoute: (fromEva, toEva) => {
    const id = routeId(fromEva, toEva);
    return get().favoriteRoutes.some((r) => r.id === id);
  },

  addFavoriteRoute: async (route) => {
    const { favoriteRoutes } = get();
    const id = routeId(route.fromEva, route.toEva);
    if (favoriteRoutes.some((r) => r.id === id)) return;
    const next: FavoriteRoute[] = [...favoriteRoutes, { id, ...route, order: favoriteRoutes.length }];
    set({ favoriteRoutes: next });
    await saveFavoriteRoutes(next);
  },

  removeFavoriteRoute: async (id) => {
    const next = get()
      .favoriteRoutes.filter((r) => r.id !== id)
      .map((r, index) => ({ ...r, order: index }));
    set({ favoriteRoutes: next });
    await saveFavoriteRoutes(next);
  },

  reorderFavoriteRoutes: async (orderedIds) => {
    const byId = new Map(get().favoriteRoutes.map((r) => [r.id, r]));
    const next = orderedIds
      .map((id) => byId.get(id))
      .filter((r): r is FavoriteRoute => Boolean(r))
      .map((r, index) => ({ ...r, order: index }));
    set({ favoriteRoutes: next });
    await saveFavoriteRoutes(next);
  },
}));
