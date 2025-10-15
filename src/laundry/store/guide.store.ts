import { create } from 'zustand';
import { Guide, GuideItem } from '../interfaces/guides/guides.interface';

interface GuideStore {
  currentGuide: Partial<Guide> | null;
  guideItems: GuideItem[];
  selectedClientId: string | null;

  setCurrentGuide: (guide: Partial<Guide> | null) => void;
  setSelectedClientId: (clientId: string | null) => void;
  addGuideItem: (item: GuideItem) => void;
  removeGuideItem: (epc: string) => void;
  updateGuideItem: (epc: string, updates: Partial<GuideItem>) => void;
  clearGuideItems: () => void;
  resetGuide: () => void;
}

export const useGuideStore = create<GuideStore>(set => ({
  currentGuide: null,
  guideItems: [],
  selectedClientId: null,

  setCurrentGuide: (guide: Partial<Guide> | null) => {
    set({ currentGuide: guide });
  },

  setSelectedClientId: (clientId: string | null) => {
    set({ selectedClientId: clientId });
  },

  addGuideItem: (item: GuideItem) => {
    set(state => {
      const exists = state.guideItems.some(i => i.tagEPC === item.tagEPC);
      if (exists) {
        return state;
      }
      return {
        guideItems: [...state.guideItems, item],
      };
    });
  },

  removeGuideItem: (epc: string) => {
    set(state => ({
      guideItems: state.guideItems.filter(item => item.tagEPC !== epc),
    }));
  },

  updateGuideItem: (epc: string, updates: Partial<GuideItem>) => {
    set(state => ({
      guideItems: state.guideItems.map(item =>
        item.tagEPC === epc ? { ...item, ...updates } : item
      ),
    }));
  },

  clearGuideItems: () => {
    set({ guideItems: [] });
  },

  resetGuide: () => {
    set({
      currentGuide: null,
      guideItems: [],
      selectedClientId: null,
    });
  },
}));
