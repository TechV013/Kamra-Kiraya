import { create } from "zustand";
import type { Room } from "@/types";

interface WishlistState {
  items: string[]; // room IDs
  addToWishlist: (roomId: string) => void;
  removeFromWishlist: (roomId: string) => void;
  isWishlisted: (roomId: string) => boolean;
  setWishlist: (ids: string[]) => void;
}

export const useWishlistStore = create<WishlistState>()((set, get) => ({
  items: [],
  addToWishlist: (roomId) =>
    set((state) => ({ items: [...state.items, roomId] })),
  removeFromWishlist: (roomId) =>
    set((state) => ({ items: state.items.filter((id) => id !== roomId) })),
  isWishlisted: (roomId) => get().items.includes(roomId),
  setWishlist: (ids) => set({ items: ids }),
}));

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
