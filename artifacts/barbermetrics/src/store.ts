import { create } from "zustand";

type Tab = "home" | "timer" | "appointments" | "analysis" | "reports" | "settings";

interface AppState {
  currentTab: Tab;
  setCurrentTab: (tab: Tab) => void;
  
  // Timer State
  timerStartedAt: number | null;
  timerDuration: number;
  timerRunning: boolean;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentTab: "home",
  setCurrentTab: (tab) => set({ currentTab: tab }),

  timerStartedAt: null,
  timerDuration: 0,
  timerRunning: false,
  startTimer: () => set({ timerRunning: true, timerStartedAt: Date.now() }),
  stopTimer: () => set({ timerRunning: false }),
  resetTimer: () => set({ timerRunning: false, timerDuration: 0, timerStartedAt: null }),
  tickTimer: () => set((state) => ({ timerDuration: state.timerDuration + 1 })),
}));
