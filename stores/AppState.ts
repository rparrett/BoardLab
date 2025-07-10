import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface AppState {
  selectedAngle: number
  setSelectedAngle: (angle: number) => void
}

export const useAppState = create<AppState>()(
  persist(
    (set) => ({
      selectedAngle: 40,
      setSelectedAngle: (angle) => set({ selectedAngle: angle }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ selectedAngle: state.selectedAngle }),
    }
  )
)