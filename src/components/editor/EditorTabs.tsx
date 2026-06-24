import React, { useState, useRef, useCallback, useEffect } from 'react';

export interface Tab {
  id: string;
  filePath: string;
  fileName: string;
  modified: boolean;
  language?: string;
}

export interface EditorTabsProps {
  tabs: Tab[];
  activeTabId: string | null;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabReorder: (fromIndex: number, toIndex: number) => void;
  onTabCloseOthers: (tabId: string) => void;
  onTabCloseAll: () => void;
  onCopyPath: (filePath: string) => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  tabId: string;
  filePath: string;
}

const EditorTabs: React.FC<EditorTabsProps> = ({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onTabReorder,
  onTabCloseOthers,
  onTabCloseAll,
  onCopyPath,
}) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    tabId: '',
    filePath: '',
  });
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, tab: Tab) => {
      e.preventDefault();
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        tabId: tab.id,
        filePath: tab.filePath,
      });
    },
    []
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    const handler = () => closeContextMenu();
    document.addEventListener('click', handler);
    document.addEventListener('contextmenu', handler);
    return () => {
      document.removeEventListener('click', handler);
      document.removeEventListener('contextmenu', handler);
    };
  }, [closeContextMenu]);

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (dragIndex !== null && dragIndex !== index) {
        onTabReorder(dragIndex, index);
        setDragIndex(index);
      }
    },
    [dragIndex, onTabReorder]
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
  }, []);

  const handleMiddleClick = useCallback(
    (e: React.MouseEvent, tab: Tab) => {
      if (e.button === 1) {
        e.preventDefault();
        onTabClose(tab.id);
      }
    },
    [onTabClose]
  );

  const getLanguageIcon = (language?: string): string => {
    const icons: Record<string, string> = {
      typescript: 'TS',
      javascript: 'JS',
      python: 'PY',
      html: 'H',
      css: 'C',
      json: '{}',
      markdown: 'M',
    };
    return icons[language || ''] || 'F';
  };

  return (
    <div ref={tabsRef} style={styles.tabBar}>
      <div style={styles.tabContainer}>
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            draggable
            style={{
              ...styles.tab,
              ...(tab.id === activeTabId ? styles.activeTab : {}),
              ...(dragIndex === index ? styles.dragTab : {}),
            }}
            onClick={() => onTabSelect(tab.id)}
            onMouseDown={(e) => handleMiddleClick(e, tab)}
            onContextMenu={(e) => handleContextMenu(e, tab)}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
          >
            <span
              style={{
                ...styles.langIcon,
                color:
                  tab.language === 'typescript'
                    ? '#3178c6'
                    : tab.language === 'javascript'
                    ? '#f7df1e'
                    : tab.language === 'python'
                    ? '#3776ab'
                    : '#737aa2',
              }}
            >
              {getLanguageIcon(tab.language)}
            </span>
            <span style={styles.tabName}>{tab.fileName}</span>
            {tab.modified && <span style={styles.modified}>●</span>}
            <button
              style={styles.closeButton}
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              title="Sekmeyi Kapat"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {contextMenu.visible && (
        <div
          style={{
            ...styles.contextMenu,
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            style={styles.contextMenuItem}
            onClick={() => {
              onTabClose(contextMenu.tabId);
              closeContextMenu();
            }}
          >
            Kapat
          </button>
          <button
            style={styles.contextMenuItem}
            onClick={() => {
              onTabCloseOthers(contextMenu.tabId);
              closeContextMenu();
            }}
          >
            Diğerlerini Kapat
          </button>
          <button
            style={styles.contextMenuItem}
            onClick={() => {
              onTabCloseAll();
              closeContextMenu();
            }}
          >
            Tümünü Kapat
          </button>
          <div style={styles.divider} />
          <button
            style={styles.contextMenuItem}
            onClick={() => {
              onCopyPath(contextMenu.filePath);
              closeContextMenu();
            }}
          >
            Yolu Kopyala
          </button>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  tabBar: {
    display: 'flex',
    alignItems: 'center',
    background: '#1f2335',
    borderBottom: '1px solid #292e42',
    height: 40,
    overflow: 'hidden',
    position: 'relative',
  },
  tabContainer: {
    display: 'flex',
    flex: 1,
    overflowX: 'auto',
    overflowY: 'hidden',
    scrollbarWidth: 'none',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '0 12px',
    height: 40,
    cursor: 'pointer',
    borderRight: '1px solid #292e42',
    whiteSpace: 'nowrap',
    fontSize: 13,
    color: '#737aa2',
    transition: 'background 0.15s, color 0.15s',
    userSelect: 'none',
    minWidth: 0,
    flexShrink: 0,
  },
  activeTab: {
    background: '#1a1b26',
    color: '#c0caf5',
    borderBottom: '2px solid #7aa2f7',
  },
  dragTab: {
    opacity: 0.5,
  },
  langIcon: {
    fontSize: 10,
    fontWeight: 700,
    fontFamily: 'monospace',
  },
  tabName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  modified: {
    color: '#e0af68',
    fontSize: 16,
    lineHeight: 1,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'inherit',
    fontSize: 16,
    cursor: 'pointer',
    padding: '0 2px',
    lineHeight: 1,
    opacity: 0.6,
    borderRadius: 3,
  },
  contextMenu: {
    position: 'fixed',
    background: '#1f2335',
    border: '1px solid #3b4261',
    borderRadius: 6,
    padding: '4px 0',
    zIndex: 1000,
    minWidth: 180,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
  contextMenuItem: {
    display: 'block',
    width: '100%',
    padding: '6px 16px',
    border: 'none',
    background: 'none',
    color: '#c0caf5',
    fontSize: 13,
    textAlign: 'left',
    cursor: 'pointer',
  },
  divider: {
    height: 1,
    background: '#3b4261',
    margin: '4px 0',
  },
};

export default React.memo(EditorTabs);
