import React, { useState, useCallback, useRef, useMemo } from 'react';
import FileTree, { FileNode } from '../editor/FileTree';

export interface FileExplorerProps {
  files: FileNode[];
  selectedFileId: string | null;
  onFileSelect: (file: FileNode) => void;
  onNewFile?: (parentId: string) => void;
  onNewFolder?: (parentId: string) => void;
  onRename?: (fileId: string) => void;
  onDelete?: (fileId: string) => void;
  onCopyPath?: (filePath: string) => void;
  onMove?: (sourceId: string, targetId: string) => void;
  onRefresh?: () => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  selectedFileId,
  onFileSelect,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
  onCopyPath,
  onMove,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const toggleSearch = useCallback(() => {
    if (!isCollapsed) {
      setSearchQuery('');
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
    setIsCollapsed((p) => !p);
  }, [isCollapsed]);

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files;
    return files;
  }, [files, searchQuery]);

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <span style={styles.title}>Dosya Gezgini</span>
        <div style={styles.actions}>
          {onNewFile && (
            <button
              style={styles.toolbarBtn}
              onClick={() => onNewFile('root')}
              title="Yeni Dosya"
            >
              📄+
            </button>
          )}
          {onNewFolder && (
            <button
              style={styles.toolbarBtn}
              onClick={() => onNewFolder('root')}
              title="Yeni Klasör"
            >
              📁+
            </button>
          )}
          {onRefresh && (
            <button
              style={styles.toolbarBtn}
              onClick={onRefresh}
              title="Yenile"
            >
              🔄
            </button>
          )}
        </div>
      </div>

      <div style={styles.searchBar}>
        <input
          ref={searchInputRef}
          type="text"
          style={styles.searchInput}
          placeholder="Dosya ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div style={styles.treeContainer}>
        <FileTree
          files={filteredFiles}
          selectedFileId={selectedFileId}
          onFileSelect={onFileSelect}
          onNewFile={onNewFile}
          onNewFolder={onNewFolder}
          onRename={onRename}
          onDelete={onDelete}
          onCopyPath={onCopyPath}
          onMove={onMove}
          searchFilter={searchQuery}
        />
      </div>

      <div style={styles.statusBar}>
        <span>{files.length} öğe</span>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#1f2335',
    borderRight: '1px solid #292e42',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderBottom: '1px solid #292e42',
  },
  title: {
    fontWeight: 600,
    color: '#c0caf5',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  actions: {
    display: 'flex',
    gap: 2,
  },
  toolbarBtn: {
    background: 'none',
    border: 'none',
    color: '#737aa2',
    fontSize: 12,
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: 4,
  },
  searchBar: {
    padding: '6px 8px',
  },
  searchInput: {
    width: '100%',
    padding: '4px 8px',
    background: '#1a1b26',
    border: '1px solid #3b4261',
    borderRadius: 4,
    color: '#c0caf5',
    fontSize: 12,
    outline: 'none',
  },
  treeContainer: {
    flex: 1,
    overflowY: 'auto',
  },
  statusBar: {
    padding: '4px 12px',
    borderTop: '1px solid #292e42',
    fontSize: 11,
    color: '#414868',
  },
};

export default React.memo(FileExplorer);
