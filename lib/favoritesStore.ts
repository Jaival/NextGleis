import { create } from 'zustand';
import { getFavorites, saveFavorites } from './storage';
import type { FavoriteStation } from '@/types';

type FavoritesState = {
  favorites: FavoriteStation[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addFavorite: (station: Pick<FavoriteStation, 'evaNo' | 'name'>) => Promise<void>;
  removeFavorite: (evaNo: string) => Promise<void>;
  reorderFavorites: (orderedEvaNos: string[]) => Promise<void>;
  toggleHiddenLine: (evaNo: string, line: string) => Promise<void>;
};

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  hydrated: false,

  hydrate: async () => {
    try {
      set({ favorites: await getFavorites() });
    } finally {
      // Always flip `hydrated`: the root layout holds the splash screen until
      // every store reports in, so a failed read must not block startup.
      set({ hydrated: true });
    }
  },

  addFavorite: async (station) => {
    const { favorites } = get();
    if (favorites.some((f) => f.evaNo === station.evaNo)) return;
    const next: FavoriteStation[] = [
      ...favorites,
      { evaNo: station.evaNo, name: station.name, hiddenLines: [], order: favorites.length },
    ];
    set({ favorites: next });
    await saveFavorites(next);
  },

  removeFavorite: async (evaNo) => {
    const next = get()
      .favorites.filter((f) => f.evaNo !== evaNo)
      .map((f, index) => ({ ...f, order: index }));
    set({ favorites: next });
    await saveFavorites(next);
  },

  reorderFavorites: async (orderedEvaNos) => {
    const byId = new Map(get().favorites.map((f) => [f.evaNo, f]));
    const next = orderedEvaNos
      .map((evaNo) => byId.get(evaNo))
      .filter((f): f is FavoriteStation => Boolean(f))
      .map((f, index) => ({ ...f, order: index }));
    set({ favorites: next });
    await saveFavorites(next);
  },

  toggleHiddenLine: async (evaNo, line) => {
    const next = get().favorites.map((f) => {
      if (f.evaNo !== evaNo) return f;
      const hiddenLines = f.hiddenLines.includes(line)
        ? f.hiddenLines.filter((l) => l !== line)
        : [...f.hiddenLines, line];
      return { ...f, hiddenLines };
    });
    set({ favorites: next });
    await saveFavorites(next);
  },
}));
