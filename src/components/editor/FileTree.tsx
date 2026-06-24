import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  language?: string;
  expanded?: boolean;
}

export interface FileTreeProps {
  files: FileNode[];
  selectedFileId: string | null;
  onFileSelect: (file: FileNode) => void;
  onNewFile?: (parentId: string) => void;
  onNewFolder?: (parentId: string) => void;
  onRename?: (fileId: string) => void;
  onDelete?: (fileId: string) => void;
  onCopyPath?: (filePath: string) => void;
  onMove?: (sourceId: string, targetId: string) => void;
  searchFilter?: string;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  nodeId: string;
  nodeType: 'file' | 'folder';
  nodePath: string;
}

const FILE_ICONS: Record<string, string> = {
  typescript: 'TS',
  javascript: 'JS',
  python: 'PY',
  html: 'H',
  css: 'C',
  json: '{}',
  markdown: 'M',
  folder: '📁',
  folderOpen: '📂',
};

function getFileIcon(node: FileNode): string {
  if (node.type === 'folder') {
    return node.expanded ? FILE_ICONS.folderOpen : FILE_ICONS.folder;
  }
  return FILE_ICONS[node.language || ''] || '📄';
}

const FileTree: React.FC<FileTreeProps> = ({
  files,
  selectedFileId,
  onFileSelect,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
  onCopyPath,
  onMove,
  searchFilter,
}) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    nodeId: '',
    nodeType: 'file',
    nodePath: '',
  });
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const treeRef = useRef<HTMLDivElement>(null);

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, node: FileNode) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        nodeId: node.id,
        nodeType: node.type,
        nodePath: node.path,
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
    return () => document.removeEventListener('click', handler);
  }, [closeContextMenu]);

  const handleDragStart = useCallback(
    (e: React.DragEvent, node: FileNode) => {
      e.dataTransfer.setData('text/plain', node.id);
      e.dataTransfer.effectAllowed = 'move';
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, node: FileNode) => {
      e.preventDefault();
      if (node.type === 'folder') {
        e.dataTransfer.dropEffect = 'move';
        setDragOverId(node.id);
      }
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, targetNode: FileNode) => {
      e.preventDefault();
      const sourceId = e.dataTransfer.getData('text/plain');
      if (sourceId && targetNode.type === 'folder' && sourceId !== targetNode.id) {
        onMove?.(sourceId, targetNode.id);
      }
      setDragOverId(null);
    },
    [onMove]
  );

  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
  }, []);

  const matchesFilter = useCallback(
    (node: FileNode): boolean => {
      if (!searchFilter) return true;
      const filter = searchFilter.toLowerCase();
      if (node.name.toLowerCase().includes(filter)) return true;
      if (node.type === 'folder' && node.children) {
        return node.children.some(matchesFilter);
      }
      return false;
    },
    [searchFilter]
  );

  const filteredFiles = useMemo(
    () => (searchFilter ? files.filter(matchesFilter) : files),
    [files, searchFilter, matchesFilter]
  );

  const renderNode = useCallback(
    (node: FileNode, depth: number = 0) => {
      if (!matchesFilter(node)) return null;

      const isExpanded = expandedFolders.has(node.id) || !!searchFilter;
      const isSelected = node.id === selectedFileId;
      const isDragOver = dragOverId === node.id;

      return (
        <div key={node.id}>
          <div
            style={{
              ...styles.treeItem,
              paddingLeft: depth * 16 + 8,
              background: isSelected
                ? '#283457'
                : isDragOver
                ? '#292e4288'
                : 'transparent',
              borderLeft: isSelected ? '2px solid #7aa2f7' : '2px solid transparent',
            }}
            onClick={() => {
              if (node.type === 'folder') {
                toggleFolder(node.id);
              } else {
                onFileSelect(node);
              }
            }}
            onContextMenu={(e) => handleContextMenu(e, node)}
            draggable
            onDragStart={(e) => handleDragStart(e, node)}
            onDragOver={(e) => handleDragOver(e, node)}
            onDrop={(e) => handleDrop(e, node)}
            onDragLeave={handleDragLeave}
          >
            {node.type === 'folder' && (
              <span style={styles.arrow}>{isExpanded ? '▼' : '▶'}</span>
            )}
            <span style={styles.icon}>{getFileIcon(node)}</span>
            <span style={styles.fileName}>{node.name}</span>
          </div>
          {node.type === 'folder' && isExpanded && node.children && (
            <div>
              {node.children.map((child) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    },
    [
      expandedFolders,
      selectedFileId,
      dragOverId,
      searchFilter,
      matchesFilter,
      toggleFolder,
      onFileSelect,
      handleContextMenu,
      handleDragStart,
      handleDragOver,
      handleDrop,
      handleDragLeave,
    ]
  );

  return (
    <div ref={treeRef} style={styles.tree}>
      {filteredFiles.map((node) => renderNode(node))}

      {contextMenu.visible && (
        <div
          style={{
            ...styles.contextMenu,
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          {contextMenu.nodeType === 'folder' && (
            <>
              <ContextMenuItem
                label="Yeni Dosya"
                onClick={() => {
                  onNewFile?.(contextMenu.nodeId);
                  closeContextMenu();
                }}
              />
              <ContextMenuItem
                label="Yeni Klasör"
                onClick={() => {
                  onNewFolder?.(contextMenu.nodeId);
                  closeContextMenu();
                }}
              />
              <div style={styles.divider} />
            </>
          )}
          <ContextMenuItem
            label="Yeniden Adlandır"
            onClick={() => {
              onRename?.(contextMenu.nodeId);
              closeContextMenu();
            }}
          />
          <ContextMenuItem
            label="Sil"
            onClick={() => {
              onDelete?.(contextMenu.nodeId);
              closeContextMenu();
            }}
          />
          <div style={styles.divider} />
          <ContextMenuItem
            label="Yolu Kopyala"
            onClick={() => {
              onCopyPath?.(contextMenu.nodePath);
              closeContextMenu();
            }}
          />
        </div>
      )}
    </div>
  );
};

const ContextMenuItem: React.FC<{
  label: string;
  onClick: () => void;
}> = ({ label, onClick }) => (
  <button style={styles.contextMenuItem} onClick={onClick}>
    {label}
  </button>
);

const styles: Record<string, React.CSSProperties> = {
  tree: {
    padding: '4px 0',
    fontSize: 13,
  },
  treeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 8px',
    cursor: 'pointer',
    color: '#c0caf5',
    transition: 'background 0.1s',
    userSelect: 'none',
    borderLeft: '2px solid transparent',
  },
  arrow: {
    fontSize: 10,
    color: '#737aa2',
    width: 12,
    textAlign: 'center',
  },
  icon: {
    fontSize: 12,
    width: 16,
    textAlign: 'center',
    flexShrink: 0,
  },
  fileName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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

export default React.memo(FileTree);
