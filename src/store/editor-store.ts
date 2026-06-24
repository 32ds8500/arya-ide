import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EditorTab, EditorState, EditorLanguage, CursorPosition, DiffView } from '../types';

interface EditorStore extends EditorState {
  openTab: (tab: Omit<EditorTab, 'id' | 'createdAt' | 'updatedAt' | 'isDirty' | 'isPinned' | 'scrollTop' | 'scrollLeft' | 'undoStack' | 'redoStack' | 'viewState'>) => void;
  closeTab: (tabId: string) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (tabId: string) => void;
  closeTabsToRight: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  saveTab: (tabId: string) => void;
  pinTab: (tabId: string) => void;
  unpinTab: (tabId: string) => void;
  setTabLanguage: (tabId: string, language: EditorLanguage) => void;
  setCursorPosition: (tabId: string, position: CursorPosition) => void;
  setSelection: (tabId: string, selection: EditorTab['selection']) => void;
  setTabScrollPosition: (tabId: string, scrollTop: number, scrollLeft: number) => void;
  undo: (tabId: string) => void;
  redo: (tabId: string) => void;

  splitView: boolean;
  splitDirection: 'horizontal' | 'vertical';
  splitTabs: [string | null, string | null];
  setSplitView: (enabled: boolean) => void;
  setSplitDirection: (direction: 'horizontal' | 'vertical') => void;
  setSplitTab: (side: 0 | 1, tabId: string | null) => void;

  diffView: DiffView | null;
  setDiffView: (diffView: DiffView | null) => void;

  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  tabSize: number;
  wordWrap: 'on' | 'off' | 'wordWrapColumn';
  minimap: boolean;
  lineNumbers: boolean;
  renderWhitespace: 'none' | 'boundary' | 'all';
  bracketPairColorization: boolean;
  smoothScrolling: boolean;

  setFontSize: (fontSize: number) => void;
  setFontFamily: (fontFamily: string) => void;
  setLineHeight: (lineHeight: number) => void;
  setTabSize: (tabSize: number) => void;
  setWordWrap: (wordWrap: 'on' | 'off' | 'wordWrapColumn') => void;
  setMinimap: (minimap: boolean) => void;
  setLineNumbers: (lineNumbers: boolean) => void;
  setRenderWhitespace: (renderWhitespace: 'none' | 'boundary' | 'all') => void;
  setBracketPairColorization: (enabled: boolean) => void;
  setSmoothScrolling: (enabled: boolean) => void;

  reorderTabs: (fromIndex: number, toIndex: number) => void;
}

export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,
      openTabs: [],
      viewMode: 'tabs',
      splitDirection: 'vertical',
      splitTabs: [null, null],
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Fira Code, monospace',
      lineHeight: 1.5,
      tabSize: 2,
      wordWrap: 'off',
      minimap: true,
      lineNumbers: true,
      renderWhitespace: 'none',
      bracketPairColorization: true,
      smoothScrolling: true,
      splitView: false,
      diffView: null,

      openTab: (tabData) => {
        const { tabs, openTabs } = get();
        const existingTab = tabs.find((t) => t.fileId === tabData.fileId);

        if (existingTab) {
          set({ activeTabId: existingTab.id });
          return;
        }

        const newTab: EditorTab = {
          ...tabData,
          id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          isDirty: false,
          isPinned: false,
          scrollTop: 0,
          scrollLeft: 0,
          cursorPosition: { line: 1, column: 1 },
          selection: null,
          undoStack: [],
          redoStack: [],
          viewState: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set({
          tabs: [...tabs, newTab],
          openTabs: [...openTabs, newTab.id],
          activeTabId: newTab.id,
        });
      },

      closeTab: (tabId) => {
        const { tabs, openTabs, activeTabId } = get();
        const newOpenTabs = openTabs.filter((id) => id !== tabId);
        const newTabs = tabs.filter((t) => t.id !== tabId);

        let newActiveTabId = activeTabId;
        if (activeTabId === tabId) {
          const currentIndex = openTabs.indexOf(tabId);
          newActiveTabId =
            newOpenTabs[Math.min(currentIndex, newOpenTabs.length - 1)] || null;
        }

        set({
          tabs: newTabs,
          openTabs: newOpenTabs,
          activeTabId: newActiveTabId,
        });
      },

      closeAllTabs: () => {
        set({ tabs: [], openTabs: [], activeTabId: null });
      },

      closeOtherTabs: (tabId) => {
        const { tabs, openTabs } = get();
        const tab = tabs.find((t) => t.id === tabId);
        if (!tab) return;

        set({
          tabs: [tab],
          openTabs: [tabId],
          activeTabId: tabId,
        });
      },

      closeTabsToRight: (tabId) => {
        const { tabs, openTabs } = get();
        const index = openTabs.indexOf(tabId);
        if (index === -1) return;

        const tabsToKeep = openTabs.slice(0, index + 1);
        const newTabs = tabs.filter((t) => tabsToKeep.includes(t.id));

        set({
          tabs: newTabs,
          openTabs: tabsToKeep,
          activeTabId: tabId,
        });
      },

      setActiveTab: (tabId) => {
        set({ activeTabId: tabId });
      },

      updateTabContent: (tabId, content) => {
        const { tabs } = get();
        set({
          tabs: tabs.map((tab) =>
            tab.id === tabId
              ? { ...tab, content, isDirty: true, updatedAt: new Date().toISOString() }
              : tab
          ),
        });
      },

      saveTab: (tabId) => {
        const { tabs } = get();
        set({
          tabs: tabs.map((tab) =>
            tab.id === tabId
              ? { ...tab, originalContent: tab.content, isDirty: false }
              : tab
          ),
        });
      },

      pinTab: (tabId) => {
        const { tabs } = get();
        set({
          tabs: tabs.map((tab) =>
            tab.id === tabId ? { ...tab, isPinned: true } : tab
          ),
        });
      },

      unpinTab: (tabId) => {
        const { tabs } = get();
        set({
          tabs: tabs.map((tab) =>
            tab.id === tabId ? { ...tab, isPinned: false } : tab
          ),
        });
      },

      setTabLanguage: (tabId, language) => {
        const { tabs } = get();
        set({
          tabs: tabs.map((tab) =>
            tab.id === tabId ? { ...tab, language } : tab
          ),
        });
      },

      setCursorPosition: (tabId, position) => {
        const { tabs } = get();
        set({
          tabs: tabs.map((tab) =>
            tab.id === tabId ? { ...tab, cursorPosition: position } : tab
          ),
        });
      },

      setSelection: (tabId, selection) => {
        const { tabs } = get();
        set({
          tabs: tabs.map((tab) =>
            tab.id === tabId ? { ...tab, selection } : tab
          ),
        });
      },

      setTabScrollPosition: (tabId, scrollTop, scrollLeft) => {
        const { tabs } = get();
        set({
          tabs: tabs.map((tab) =>
            tab.id === tabId ? { ...tab, scrollTop, scrollLeft } : tab
          ),
        });
      },

      undo: (tabId) => {
        const { tabs } = get();
        const tab = tabs.find((t) => t.id === tabId);
        if (!tab || tab.undoStack.length === 0) return;

        const newUndoStack = [...tab.undoStack];
        const previousContent = newUndoStack.pop()!;
        const newRedoStack = [...tab.redoStack, tab.content];

        set({
          tabs: tabs.map((t) =>
            t.id === tabId
              ? {
                  ...t,
                  content: previousContent,
                  undoStack: newUndoStack,
                  redoStack: newRedoStack,
                  isDirty: previousContent !== t.originalContent,
                }
              : t
          ),
        });
      },

      redo: (tabId) => {
        const { tabs } = get();
        const tab = tabs.find((t) => t.id === tabId);
        if (!tab || tab.redoStack.length === 0) return;

        const newRedoStack = [...tab.redoStack];
        const nextContent = newRedoStack.pop()!;
        const newUndoStack = [...tab.undoStack, tab.content];

        set({
          tabs: tabs.map((t) =>
            t.id === tabId
              ? {
                  ...t,
                  content: nextContent,
                  undoStack: newUndoStack,
                  redoStack: newRedoStack,
                  isDirty: nextContent !== t.originalContent,
                }
              : t
          ),
        });
      },

      setSplitView: (splitView) => set({ splitView }),
      setSplitDirection: (splitDirection) => set({ splitDirection }),
      setSplitTab: (side, tabId) => {
        const { splitTabs } = get();
        const newSplitTabs: [string | null, string | null] = [...splitTabs];
        newSplitTabs[side] = tabId;
        set({ splitTabs: newSplitTabs });
      },

      setDiffView: (diffView) => set({ diffView }),

      setFontSize: (fontSize) => set({ fontSize }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setLineHeight: (lineHeight) => set({ lineHeight }),
      setTabSize: (tabSize) => set({ tabSize }),
      setWordWrap: (wordWrap) => set({ wordWrap }),
      setMinimap: (minimap) => set({ minimap }),
      setLineNumbers: (lineNumbers) => set({ lineNumbers }),
      setRenderWhitespace: (renderWhitespace) => set({ renderWhitespace }),
      setBracketPairColorization: (enabled) => set({ bracketPairColorization: enabled }),
      setSmoothScrolling: (enabled) => set({ smoothScrolling: enabled }),

      reorderTabs: (fromIndex, toIndex) => {
        const { openTabs } = get();
        const newOpenTabs = [...openTabs];
        const [removed] = newOpenTabs.splice(fromIndex, 1);
        newOpenTabs.splice(toIndex, 0, removed);
        set({ openTabs: newOpenTabs });
      },
    }),
    {
      name: 'arya-editor',
      partialize: (state) => ({
        openTabs: state.openTabs,
        tabs: state.tabs.map((tab) => ({
          id: tab.id,
          fileId: tab.fileId,
          file: tab.file,
          originalContent: tab.originalContent,
          language: tab.language,
          scrollTop: tab.scrollTop,
          scrollLeft: tab.scrollLeft,
          cursorPosition: tab.cursorPosition,
          isPinned: tab.isPinned,
        })),
        activeTabId: state.activeTabId,
        fontSize: state.fontSize,
        fontFamily: state.fontFamily,
        lineHeight: state.lineHeight,
        tabSize: state.tabSize,
        wordWrap: state.wordWrap,
        minimap: state.minimap,
        lineNumbers: state.lineNumbers,
        renderWhitespace: state.renderWhitespace,
        bracketPairColorization: state.bracketPairColorization,
        smoothScrolling: state.smoothScrolling,
        splitView: state.splitView,
        splitDirection: state.splitDirection,
        splitTabs: state.splitTabs,
      }),
    }
  )
);
