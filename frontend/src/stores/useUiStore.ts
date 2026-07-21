import { create } from "zustand";

interface UiState {
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;

  chatSidebarCollapsed: boolean;
  toggleChatSidebar: () => void;

  primarySidebarCollapsed: boolean;
  togglePrimarySidebar: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () =>
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

  chatSidebarCollapsed: false,
  toggleChatSidebar: () =>
    set((state) => ({ chatSidebarCollapsed: !state.chatSidebarCollapsed })),

  primarySidebarCollapsed: false,
  togglePrimarySidebar: () =>
    set((state) => ({
      primarySidebarCollapsed: !state.primarySidebarCollapsed,
    })),
}));
