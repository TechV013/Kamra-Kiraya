import { create } from "zustand";
import axios from "axios";

interface ChatState {
  perBooking: Record<string, number>;
  totalUnread: number;
  loading: boolean;
  lastFetched: number;
  fetchUnread: (token: string) => Promise<void>;
  markRead: (bookingId: string) => void;
  resetAll: () => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  perBooking: {},
  totalUnread: 0,
  loading: false,
  lastFetched: 0,

  fetchUnread: async (token: string) => {
    try {
      set({ loading: true });
      const res = await axios.get("/api/messages/unread", {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ perBooking: res.data.perBooking || {}, totalUnread: res.data.total || 0, lastFetched: Date.now() });
    } catch {
      // silent
    } finally {
      set({ loading: false });
    }
  },

  markRead: (bookingId: string) => {
    set((state) => {
      const perBooking = { ...state.perBooking };
      delete perBooking[bookingId];
      const totalUnread = Object.values(perBooking).reduce((a, b) => a + b, 0);
      return { perBooking, totalUnread };
    });
  },

  resetAll: () => set({ perBooking: {}, totalUnread: 0, lastFetched: 0 }),
}));
