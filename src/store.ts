import { create } from 'zustand';

interface AppState {
  currentUserId: string;
  currentHouseholdId: string;
  viewMode: 'mine' | 'household';
  isAddMenuOpen: boolean;
  
  setCurrentUser: (id: string) => void;
  setCurrentHousehold: (id: string) => void;
  setViewMode: (mode: 'mine' | 'household') => void;
  toggleAddMenu: (isOpen?: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Seeded mock user and household IDs
  currentUserId: 'u1',
  currentHouseholdId: 'h1',
  viewMode: 'mine',
  isAddMenuOpen: false,
  
  setCurrentUser: (id) => set({ currentUserId: id }),
  setCurrentHousehold: (id) => set({ currentHouseholdId: id }),
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleAddMenu: (isOpen) => set((state) => ({ isAddMenuOpen: isOpen !== undefined ? isOpen : !state.isAddMenuOpen })),
}));
