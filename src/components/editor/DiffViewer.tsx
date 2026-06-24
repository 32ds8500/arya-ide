import React, { useRef, useEffect, useCallback, useState } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

export interface DiffViewerProps {
  originalContent: string;
  modifiedContent: string;
  language?: string;
  filePath?: string;
  inline?: boolean;
  theme?: 'arya-dark' | 'arya-light';
  onAccept?: (content: string) => void;
  onReject?: () => void;
  showStats?: boolean;
  readOnly?: boolean;
}

function computeStats(original: string, modified: string) {
  const origLines = original.split('\n');
  const modLines = modified.split('\n');
  let added = 0;
  let removed = 0;
  const maxLen = Math.max(origLines.length, modLines.length);
  for (let i = 0; i < maxLen; i++) {
    const o = origLines[i];
    const m = modLines[i];
    if (o === undefined && m !== undefined) added++;
    else if (o !== undefined && m === undefined) removed++;
    else if (o !== m) {
      added++;
      removed++;
    }
  }
  return { added, removed, total: origLines.length };
}

const DiffViewer: React.FC<DiffViewerProps> = ({
  originalContent,
  modifiedContent,
  language,
  filePath = 'untitled',
  inline = false,
  theme = 'arya-dark',
  onAccept,
  onReject,
  showStats = true,
  readOnly = false,
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const stats = computeStats(originalContent, modifiedContent);

  const handleMount = useCallback(
    (editor: any) => {
      editorRef.current = editor;
    },
    []
  );

  const diffOptions: editor.IDiffEditorConstructionOptions = {
    renderSideBySide: !inline,
    readOnly,
    enableSplitViewResizing: true,
    renderLineHighlight: 'all',
    ignoreTrimWhitespace: false,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    scrollbar: {
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
    },
  };

  return (
    <div style={styles.container}>
      {showStats && (
        <div style={styles.statsBar}>
          <span style={styles.statsLabel}>Fark Görünümü</span>
          <div style={styles.statsRight}>
            <span style={{ ...styles.statItem, color: '#9ece6a' }}>
              +{stats.added} eklendi
            </span>
            <span style={{ ...styles.statItem, color: '#f7768e' }}>
              -{stats.removed} kaldırıldı
            </span>
            <span style={styles.statItem}>{stats.total} satır</span>
          </div>
        </div>
      )}
      <div style={styles.editorContainer}>
        <DiffEditor
          original={originalContent}
          modified={modifiedContent}
          language={language}
          theme={theme}
          options={diffOptions}
          onMount={handleMount}
          loading={
            <div style={styles.loading}>Fark hesaplanıyor...</div>
          }
        />
      </div>
      {(onAccept || onReject) && (
        <div style={styles.actions}>
          {onAccept && (
            <button
              style={{ ...styles.actionBtn, ...styles.acceptBtn }}
              onClick={() => onAccept(modifiedContent)}
            >
              ✓ Değişiklikleri Kabul Et
            </button>
          )}
          {onReject && (
            <button
              style={{ ...styles.actionBtn, ...styles.rejectBtn }}
              onClick={onReject}
            >
              ✗ Değişiklikleri Reddet
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
  },
  statsBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 12px',
    background: '#24283b',
    borderBottom: '1px solid #292e42',
    fontSize: 12,
  },
  statsLabel: {
    color: '#737aa2',
    fontWeight: 500,
  },
  statsRight: {
    display: 'flex',
    gap: 12,
  },
  statItem: {
    color: '#737aa2',
    fontFamily: 'monospace',
  },
  editorContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  actions: {
    display: 'flex',
    gap: 8,
    padding: '8px 12px',
    background: '#24283b',
    borderTop: '1px solid #292e42',
  },
  actionBtn: {
    padding: '6px 16px',
    border: 'none',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  acceptBtn: {
    background: '#9ece6a33',
    color: '#9ece6a',
    border: '1px solid #9ece6a55',
  },
  rejectBtn: {
    background: '#f7768e33',
    color: '#f7768e',
    border: '1px solid #f7768e55',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#737aa2',
    fontSize: 14,
  },
};

export default React.memo(DiffViewer);
