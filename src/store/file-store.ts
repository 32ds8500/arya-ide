import { create } from 'zustand';
import type { File, FileTreeNode, FileType } from '../types';

interface FileStore {
  files: File[];
  fileTree: FileTreeNode | null;
  selectedFiles: string[];
  expandedFolders: Set<string>;
  activeFile: File | null;
  isLoading: boolean;
  error: string | null;

  setFiles: (files: File[]) => void;
  addFile: (file: File) => void;
  updateFile: (fileId: string, updates: Partial<File>) => void;
  removeFile: (fileId: string) => void;

  setFileTree: (tree: FileTreeNode) => void;
  refreshTree: () => Promise<void>;

  selectFile: (fileId: string, multiSelect?: boolean) => void;
  deselectFile: (fileId: string) => void;
  clearSelection: () => void;
  selectAll: () => void;

  expandFolder: (folderId: string) => void;
  collapseFolder: (folderId: string) => void;
  toggleFolder: (folderId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;

  setActiveFile: (file: File | null) => void;
  searchFiles: (query: string) => File[];
  getFilesByType: (type: FileType) => File[];
  getFileByPath: (path: string) => File | undefined;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const collectFolderIds = (node: FileTreeNode): string[] => {
  const ids: string[] = [];
  if (node.type === 'directory' && node.children) {
    ids.push(node.id);
    node.children.forEach((child) => {
      ids.push(...collectFolderIds(child));
    });
  }
  return ids;
};

export const useFileStore = create<FileStore>()((set, get) => ({
  files: [],
  fileTree: null,
  selectedFiles: [],
  expandedFolders: new Set<string>(),
  activeFile: null,
  isLoading: false,
  error: null,

  setFiles: (files) => set({ files }),

  addFile: (file) => {
    set((state) => ({ files: [...state.files, file] }));
  },

  updateFile: (fileId, updates) => {
    set((state) => ({
      files: state.files.map((f) => (f.id === fileId ? { ...f, ...updates } : f)),
      activeFile:
        state.activeFile?.id === fileId
          ? { ...state.activeFile, ...updates }
          : state.activeFile,
    }));
  },

  removeFile: (fileId) => {
    set((state) => ({
      files: state.files.filter((f) => f.id !== fileId),
      selectedFiles: state.selectedFiles.filter((id) => id !== fileId),
      activeFile: state.activeFile?.id === fileId ? null : state.activeFile,
    }));
  },

  setFileTree: (tree) => set({ fileTree: tree }),

  refreshTree: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/files/tree');
      if (!response.ok) throw new Error('Failed to refresh file tree');
      const tree = await response.json();
      set({ fileTree: tree, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh',
      });
    }
  },

  selectFile: (fileId, multiSelect = false) => {
    set((state) => {
      if (multiSelect) {
        const isSelected = state.selectedFiles.includes(fileId);
        return {
          selectedFiles: isSelected
            ? state.selectedFiles.filter((id) => id !== fileId)
            : [...state.selectedFiles, fileId],
        };
      }
      return { selectedFiles: [fileId] };
    });
  },

  deselectFile: (fileId) => {
    set((state) => ({
      selectedFiles: state.selectedFiles.filter((id) => id !== fileId),
    }));
  },

  clearSelection: () => set({ selectedFiles: [] }),

  selectAll: () => {
    set((state) => ({
      selectedFiles: state.files.map((f) => f.id),
    }));
  },

  expandFolder: (folderId) => {
    set((state) => {
      const newExpanded = new Set(state.expandedFolders);
      newExpanded.add(folderId);
      return { expandedFolders: newExpanded };
    });
  },

  collapseFolder: (folderId) => {
    set((state) => {
      const newExpanded = new Set(state.expandedFolders);
      newExpanded.delete(folderId);
      return { expandedFolders: newExpanded };
    });
  },

  toggleFolder: (folderId) => {
    const { expandedFolders } = get();
    if (expandedFolders.has(folderId)) {
      get().collapseFolder(folderId);
    } else {
      get().expandFolder(folderId);
    }
  },

  expandAll: () => {
    const { fileTree } = get();
    if (!fileTree) return;
    const allFolderIds = collectFolderIds(fileTree);
    set({ expandedFolders: new Set(allFolderIds) });
  },

  collapseAll: () => set({ expandedFolders: new Set<string>() }),

  setActiveFile: (file) => set({ activeFile: file }),

  searchFiles: (query) => {
    const { files } = get();
    const lowerQuery = query.toLowerCase();
    return files.filter(
      (f) =>
        f.name.toLowerCase().includes(lowerQuery) ||
        f.path.toLowerCase().includes(lowerQuery)
    );
  },

  getFilesByType: (type) => {
    const { files } = get();
    return files.filter((f) => f.type === type);
  },

  getFileByPath: (path) => {
    const { files } = get();
    return files.find((f) => f.path === path);
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
