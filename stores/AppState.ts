import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  selectedAngle: number;
  setSelectedAngle: (angle: number) => void;

  // Climb creation state
  climbInProgress: Map<number, number>; // placement ID -> role ID
  setClimbInProgress: (placements: Map<number, number>) => void;
  updatePlacement: (placementId: number, roleId: number) => void;
  removePlacement: (placementId: number) => void;
  clearClimbInProgress: () => void;
}

export const useAppState = create<AppState>()(
  persist(
    set => ({
      selectedAngle: 40,
      setSelectedAngle: angle => set({ selectedAngle: angle }),

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
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        selectedAngle: state.selectedAngle,
        climbInProgress: Array.from(state.climbInProgress.entries()),
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
