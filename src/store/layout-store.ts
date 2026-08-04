import { create } from 'zustand'

type LayoutState = {
  collapsed: boolean
  globalTime: string
  toggleCollapsed: () => void
  setGlobalTime: (value: string) => void
}

export const useLayoutStore = create<LayoutState>((set) => ({
  collapsed: false,
  globalTime: '2024-01-15T09:00',
  toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
  setGlobalTime: (value) => set({ globalTime: value }),
}))
