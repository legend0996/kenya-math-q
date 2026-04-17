import { create } from "zustand";

interface ContestState {
  joinedContests: Record<number, boolean>;
  joinContest: (id: number) => void;
}

export const useContestStore = create<ContestState>((set) => ({
  joinedContests: {},
  joinContest: (id) => set((state) => ({
    joinedContests: { ...state.joinedContests, [id]: true },
  })),
}));
