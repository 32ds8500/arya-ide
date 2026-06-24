'use client';

import { useCallback } from 'react';
import { useEditorStore, useFileStore } from '../store';
import type { File, EditorLanguage } from '../types';

function detectLanguage(filename: string): EditorLanguage {
  const ext = filename.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, EditorLanguage> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    html: 'html',
    css: 'css',
    json: 'json',
    md: 'markdown',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    rb: 'ruby',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    sql: 'sql',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    xml: 'xml',
    sh: 'shell',
    bash: 'shell',
    dockerfile: 'dockerfile',
  };
  return languageMap[ext || ''] || 'plaintext';
}

export function useEditor() {
  const {
    tabs,
    activeTabId,
    openTab,
    closeTab,
    closeAllTabs,
    closeOtherTabs,
    closeTabsToRight,
    setActiveTab,
    updateTabContent,
    saveTab,
    pinTab,
    unpinTab,
    undo,
    redo,
    reorderTabs,
    splitView,
    setSplitView,
    splitDirection,
    setSplitDirection,
    splitTabs,
    setSplitTab,
    diffView,
    setDiffView,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    lineHeight,
    setLineHeight,
    tabSize,
    setTabSize,
    wordWrap,
    setWordWrap,
    minimap,
    setMinimap,
    lineNumbers,
    setLineNumbers,
    renderWhitespace,
    setRenderWhitespace,
    bracketPairColorization,
    setBracketPairColorization,
    smoothScrolling,
    setSmoothScrolling,
  } = useEditorStore();

  const activeTab = tabs.find((t) => t.id === activeTabId) || null;

  const openFile = useCallback(
    (file: File) => {
      const language = detectLanguage(file.name);
      openTab({
        fileId: file.id,
        file,
        content: file.content || '',
        originalContent: file.content || '',
        language,
        selection: null,
        cursorPosition: { line: 0, column: 0 },
      });
    },
    [openTab]
  );

  const save = useCallback(
    async (tabId?: string) => {
      const targetTabId = tabId || activeTabId;
      if (!targetTabId) return;

      const tab = tabs.find((t) => t.id === targetTabId);
      if (!tab || !tab.isDirty) return;

      saveTab(targetTabId);
      useFileStore.getState().updateFile(tab.fileId, { content: tab.content });
    },
    [activeTabId, tabs, saveTab]
  );

  const saveAll = useCallback(async () => {
    const dirtyTabs = tabs.filter((t) => t.isDirty);
    await Promise.all(dirtyTabs.map((t) => save(t.id)));
  }, [tabs, save]);

  const format = useCallback(async (tabId?: string) => {
    const targetTabId = tabId || useEditorStore.getState().activeTabId;
    if (!targetTabId) return;

    const tab = useEditorStore.getState().tabs.find((t) => t.id === targetTabId);
    if (!tab) return;

    const response = await fetch('/api/editor/format', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: tab.content,
        language: tab.language,
      }),
    });

    if (!response.ok) throw new Error('Failed to format');

    const { content: formatted } = await response.json();
    useEditorStore.getState().updateTabContent(targetTabId, formatted);
  }, []);

  const search = useCallback(
    async (query: string, caseSensitive = false, useRegex = false) => {
      const tab = useEditorStore.getState().tabs.find(
        (t) => t.id === useEditorStore.getState().activeTabId
      );
      if (!tab) return [];

      try {
        const response = await fetch('/api/editor/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: tab.content,
            query,
            caseSensitive,
            useRegex,
          }),
        });

        if (!response.ok) throw new Error('Search failed');
        return response.json();
      } catch {
        return [];
      }
    },
    []
  );

  const replace = useCallback(
    async (
      searchQuery: string,
      replaceText: string,
      caseSensitive = false,
      useRegex = false,
     replaceAll = false
    ) => {
      const tabId = useEditorStore.getState().activeTabId;
      if (!tabId) return;

      const tab = useEditorStore.getState().tabs.find((t) => t.id === tabId);
      if (!tab) return;

      try {
        const response = await fetch('/api/editor/replace', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: tab.content,
            search: searchQuery,
            replace: replaceText,
            caseSensitive,
            useRegex,
            replaceAll,
          }),
        });

        if (!response.ok) throw new Error('Replace failed');
        const { content: newContent, count } = await response.json();

        useEditorStore.getState().updateTabContent(tabId, newContent);
        return count;
      } catch {
        return 0;
      }
    },
    []
  );

  return {
    tabs,
    activeTabId,
    activeTab,
    openFile,
    closeTab,
    closeAllTabs,
    closeOtherTabs,
    closeTabsToRight,
    setActiveTab,
    updateTabContent,
    save,
    saveAll,
    format,
    search,
    replace,
    pinTab,
    unpinTab,
    undo,
    redo,
    reorderTabs,
    splitView,
    setSplitView,
    splitDirection,
    setSplitDirection,
    splitTabs,
    setSplitTab,
    diffView,
    setDiffView,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    lineHeight,
    setLineHeight,
    tabSize,
    setTabSize,
    wordWrap,
    setWordWrap,
    minimap,
    setMinimap,
    lineNumbers,
    setLineNumbers,
    renderWhitespace,
    setRenderWhitespace,
    bracketPairColorization,
    setBracketPairColorization,
    smoothScrolling,
    setSmoothScrolling,
  };
}
