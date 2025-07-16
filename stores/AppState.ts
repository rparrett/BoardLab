import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClimbFilters } from '../contexts/DatabaseProvider';

interface AppState {
  climbFilters: ClimbFilters;
  setClimbFilters: (filters: ClimbFilters) => void;
  setAngle: (angle: number) => void;
  setSearchText: (searchText: string) => void;
  setGrades: (grades: number[]) => void;
  setSetAtCurrentAngle: (setAtCurrentAngle: boolean) => void;

  // Climb creation state
  climbInProgress: Map<number, number>; // placement ID -> role ID
  setClimbInProgress: (placements: Map<number, number>) => void;
  updatePlacement: (placementId: number, roleId: number) => void;
  removePlacement: (placementId: number) => void;
  clearClimbInProgress: () => void;

  // Last viewed climb
  lastViewedClimb: string | null; // climb UUID
  setLastViewedClimb: (climbUuid: string) => void;

  // Cached container dimensions for BoardDisplay
  cachedContainerDimensions: { width: number; height: number } | null;
  setCachedContainerDimensions: (dimensions: {
    width: number;
    height: number;
  }) => void;
}

export const useAppState = create<AppState>()(
  persist(
    set => ({
      climbFilters: {
        angle: 40,
        search: '',
        grades: [],
        setAtCurrentAngle: false,
      },
      setClimbFilters: filters => set({ climbFilters: filters }),
      setAngle: angle =>
        set(state => ({ climbFilters: { ...state.climbFilters, angle } })),
      setSearchText: searchText =>
        set(state => ({
          climbFilters: { ...state.climbFilters, search: searchText },
        })),
      setGrades: grades =>
        set(state => ({
          climbFilters: { ...state.climbFilters, grades },
        })),
      setSetAtCurrentAngle: setAtCurrentAngle =>
        set(state => ({
          climbFilters: { ...state.climbFilters, setAtCurrentAngle },
        })),

      // Climb creation state
      climbInProgress: new Map<number, number>(),
      setClimbInProgress: placements => set({ climbInProgress: placements }),
      updatePlacement: (placementId, roleId) =>
        set(state => {
          const newMap = new Map(state.climbInProgress);
          newMap.set(placementId, roleId);
          return { climbInProgress: newMap };
        }),
      removePlacement: placementId =>
        set(state => {
          const newMap = new Map(state.climbInProgress);
          newMap.delete(placementId);
          return { climbInProgress: newMap };
        }),
      clearClimbInProgress: () => set({ climbInProgress: new Map() }),

      // Last viewed climb
      lastViewedClimb: null,
      setLastViewedClimb: climbUuid => set({ lastViewedClimb: climbUuid }),

      // Cached container dimensions for BoardDisplay
      cachedContainerDimensions: null,
      setCachedContainerDimensions: dimensions =>
        set({ cachedContainerDimensions: dimensions }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        climbFilters: state.climbFilters,
        climbInProgress: Array.from(state.climbInProgress.entries()),
        lastViewedClimb: state.lastViewedClimb,
      }),
      onRehydrateStorage: () => state => {
        if (state?.climbInProgress) {
          // Convert array back to Map on rehydration
          state.climbInProgress = new Map(state.climbInProgress as any);
        }
      },
    },
  ),
);
