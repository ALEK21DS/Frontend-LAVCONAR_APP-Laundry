import { create } from 'zustand';
import { ScannedTag } from '../interfaces/tags/tags.interface';

interface TagStore {
  scannedTags: ScannedTag[];
  isScanning: boolean;
  scanError: string | null;

  addScannedTag: (tag: ScannedTag) => void;
  removeScannedTag: (epc: string) => void;
  clearScannedTags: () => void;
  setIsScanning: (isScanning: boolean) => void;
  setScanError: (error: string | null) => void;
  getUniqueScannedTags: () => ScannedTag[];
}

export const useTagStore = create<TagStore>((set, get) => ({
  scannedTags: [],
  isScanning: false,
  scanError: null,

  addScannedTag: (tag: ScannedTag) => {
    set(state => {
      const existingIndex = state.scannedTags.findIndex(t => t.epc === tag.epc);

      if (existingIndex >= 0) {
        const updatedTags = [...state.scannedTags];
        updatedTags[existingIndex] = tag;
        return { scannedTags: updatedTags };
      } else {
        return { scannedTags: [...state.scannedTags, tag] };
      }
    });
  },

  removeScannedTag: (epc: string) => {
    set(state => ({
      scannedTags: state.scannedTags.filter(tag => tag.epc !== epc),
    }));
  },

  clearScannedTags: () => {
    set({ scannedTags: [] });
  },

  setIsScanning: (isScanning: boolean) => {
    set({ isScanning });
  },

  setScanError: (error: string | null) => {
    set({ scanError: error });
  },

  getUniqueScannedTags: () => {
    const tags = get().scannedTags;
    const uniqueTags = tags.reduce((acc, current) => {
      const exists = acc.find(tag => tag.epc === current.epc);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, [] as ScannedTag[]);
    return uniqueTags;
  },
}));
