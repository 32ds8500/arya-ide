'use client';

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useFileStore } from '@/store/file-store';
import type { FileTreeNode, FileType } from '@/types';
import FileExplorer from './FileExplorer';
import FilePreview from './FilePreview';
import FileUpload from './FileUpload';
import ContextMenu, { type ContextMenuItem } from './ContextMenu';

export interface FileManagerProps {
  projectId: string;
  onFileOpen?: (file: FileTreeNode) => void;
  onFileSave?: (fileId: string, content: string) => void;
  initialFiles?: FileTreeNode[];
}

interface FileOperation {
  type: 'create' | 'rename' | 'delete' | 'move';
  fileId?: string;
  parentId?: string;
  name?: string;
}

const FileManager: React.FC<FileManagerProps> = ({
  projectId,
  onFileOpen,
  onFileSave,
  initialFiles = [],
}) => {
  const {
    files,
    fileTree,
    selectedFiles,
    isLoading,
    error,
    setFiles,
    setFileTree,
    selectFile,
    clearSelection,
    removeFile,
    expandFolder,
    collapseFolder,
    toggleFolder,
    refreshTree,
  } = useFileStore();

  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<FileTreeNode | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [showUpload, setShowUpload] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    file?: FileTreeNode;
  }>({ visible: false, x: 0, y: 0 });
  const [operation, setOperation] = useState<FileOperation | null>(null);
  const [operationInput, setOperationInput] = useState('');
  const [draggedFile, setDraggedFile] = useState<FileTreeNode | null>(null);

  useEffect(() => {
    if (initialFiles.length > 0) {
      setFiles(initialFiles as any);
      const tree = buildTree(initialFiles);
      setFileTree(tree);
    }
  }, [initialFiles, setFiles, setFileTree]);

  const buildTree = (nodes: FileTreeNode[]): FileTreeNode => {
    return {
      id: 'root',
      name: projectId,
      path: '/',
      type: 'directory',
      size: 0,
      children: nodes,
      depth: 0,
    };
  };

  const displayFiles = useMemo(() => {
    const convertToFileNode = (node: FileTreeNode): { id: string; name: string; path: string; type: 'file' | 'folder'; children?: { id: string; name: string; path: string; type: 'file' | 'folder'; children?: any[] }[] } => ({
      id: node.id,
      name: node.name,
      path: node.path,
      type: (node.type === 'directory' ? 'folder' : 'file') as 'file' | 'folder',
      children: node.children?.map(convertToFileNode),
    });

    if (fileTree?.children) {
      return fileTree.children.map(convertToFileNode);
    }
    if (Array.isArray(files) && files.length > 0) {
      return files.map((f) => ({
        id: f.id || f.name,
        name: f.name,
        path: f.path,
        type: (f.type === 'directory' ? 'folder' : 'file') as 'file' | 'folder',
      }));
    }
    return initialFiles.map(convertToFileNode);
  }, [fileTree, files, initialFiles]);

  const handleFileSelect = useCallback(
    (file: { id: string; name: string; path: string; type: 'file' | 'folder' }) => {
      setSelectedFileId(file.id);
      selectFile(file.id);

      const fileType = file.type === 'folder' ? 'directory' : 'file';
      if (fileType !== 'directory') {
        const treeNode: FileTreeNode = {
          id: file.id,
          name: file.name,
          path: file.path,
          type: fileType as FileType,
          size: 0,
          depth: 0,
        };
        setPreviewFile(treeNode);
        loadFileContent(treeNode);
      } else {
        toggleFolder(file.id);
      }
    },
    [selectFile, toggleFolder]
  );

  const loadFileContent = async (file: FileTreeNode) => {
    try {
      const response = await fetch(`/api/files/${file.id}/content`);
      if (response.ok) {
        const data = await response.json();
        setPreviewContent(data.content || '');
      } else {
        setPreviewContent('// Dosya içeriği yüklenemedi');
      }
    } catch {
      setPreviewContent('// Dosya içeriği yüklenemedi');
    }
  };

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, file?: FileTreeNode) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        file,
      });
    },
    []
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleNewFile = useCallback((parentId: string) => {
    setOperation({ type: 'create', parentId });
    setOperationInput('');
  }, []);

  const handleNewFolder = useCallback((parentId: string) => {
    setOperation({ type: 'create', parentId });
    setOperationInput('');
  }, []);

  const handleRename = useCallback((fileId: string) => {
    const file = findFileById(fileId);
    if (file) {
      setOperation({ type: 'rename', fileId });
      setOperationInput(file.name);
    }
  }, []);

  const handleDelete = useCallback(
    async (fileId: string) => {
      if (window.confirm('Bu dosyayı silmek istediğinize emin misiniz?')) {
        try {
          await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
          removeFile(fileId);
          if (previewFile?.id === fileId) {
            setPreviewFile(null);
            setPreviewContent('');
          }
        } catch (error) {
          console.error('Silme hatası:', error);
        }
      }
    },
    [removeFile, previewFile]
  );

  const handleCopyPath = useCallback((filePath: string) => {
    navigator.clipboard.writeText(filePath);
  }, []);

  const handleMove = useCallback(
    async (sourceId: string, targetId: string) => {
      try {
        await fetch(`/api/files/${sourceId}/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetFolderId: targetId }),
        });
        await refreshTree();
      } catch (error) {
        console.error('Taşıma hatası:', error);
      }
    },
    [refreshTree]
  );

  const handleRefresh = useCallback(() => {
    refreshTree();
  }, [refreshTree]);

  const handleUpload = useCallback(
    async (uploadedFiles: File[]) => {
      for (const file of uploadedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);

        try {
          await fetch('/api/files/upload', {
            method: 'POST',
            body: formData,
          });
        } catch (error) {
          console.error('Yükleme hatası:', error);
        }
      }
      await refreshTree();
      setShowUpload(false);
    },
    [projectId, refreshTree]
  );

  const handleOperationSubmit = useCallback(async () => {
    if (!operation || !operationInput.trim()) {
      setOperation(null);
      return;
    }

    const name = operationInput.trim();

    try {
      if (operation.type === 'create') {
        await fetch('/api/files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            projectId,
            parentId: operation.parentId,
            type: name.includes('/') ? 'directory' : 'file',
          }),
        });
      } else if (operation.type === 'rename' && operation.fileId) {
        await fetch(`/api/files/${operation.fileId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
      }
      await refreshTree();
    } catch (error) {
      console.error('İşlem hatası:', error);
    }

    setOperation(null);
    setOperationInput('');
  }, [operation, operationInput, projectId, refreshTree]);

  const findFileById = (id: string): FileTreeNode | undefined => {
    const search = (nodes: FileTreeNode[]): FileTreeNode | undefined => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = search(node.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    const sourceFiles = fileTree?.children || initialFiles;
    return search(sourceFiles);
  };

  const contextMenuItems: ContextMenuItem[] = useMemo(() => {
    const items: ContextMenuItem[] = [];

    if (contextMenu.file) {
      if (contextMenu.file.type === 'directory') {
        items.push({
          id: 'open',
          label: 'Aç',
          icon: '📂',
          onClick: () => {
            const f = contextMenu.file!;
            handleFileSelect({ id: f.id, name: f.name, path: f.path, type: 'folder' });
          },
        });
        items.push({
          id: 'new-file',
          label: 'Yeni Dosya',
          icon: '📄',
          onClick: () => handleNewFile(contextMenu.file!.id),
        });
        items.push({
          id: 'new-folder',
          label: 'Yeni Klasör',
          icon: '📁',
          onClick: () => handleNewFolder(contextMenu.file!.id),
        });
        items.push({ id: 'divider-1', label: '', divider: true });
      }

      items.push({
        id: 'rename',
        label: 'Yeniden Adlandır',
        icon: '✏️',
        shortcut: 'F2',
        onClick: () => handleRename(contextMenu.file!.id),
      });
      items.push({
        id: 'copy-path',
        label: 'Yolu Kopyala',
        icon: '📋',
        onClick: () => handleCopyPath(contextMenu.file!.path),
      });
      items.push({ id: 'divider-2', label: '', divider: true });
      items.push({
        id: 'delete',
        label: 'Sil',
        icon: '🗑️',
        shortcut: 'Del',
        danger: true,
        onClick: () => handleDelete(contextMenu.file!.id),
      });
    } else {
      items.push({
        id: 'new-file',
        label: 'Yeni Dosya',
        icon: '📄',
        onClick: () => handleNewFile('root'),
      });
      items.push({
        id: 'new-folder',
        label: 'Yeni Klasör',
        icon: '📁',
        onClick: () => handleNewFolder('root'),
      });
      items.push({ id: 'divider-1', label: '', divider: true });
      items.push({
        id: 'refresh',
        label: 'Yenile',
        icon: '🔄',
        onClick: handleRefresh,
      });
      items.push({
        id: 'upload',
        label: 'Dosya Yükle',
        icon: '📤',
        onClick: () => setShowUpload(true),
      });
      items.push({
        id: 'select-all',
        label: 'Tümünü Seç',
        icon: '☑️',
        shortcut: 'Ctrl+A',
        onClick: () => clearSelection(),
      });
    }

    return items;
  }, [
    contextMenu.file,
    handleFileSelect,
    handleNewFile,
    handleNewFolder,
    handleRename,
    handleCopyPath,
    handleDelete,
    handleRefresh,
    clearSelection,
  ]);

  const handleDragStart = useCallback((file: FileTreeNode) => {
    setDraggedFile(file);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetFile: FileTreeNode) => {
      e.preventDefault();
      if (targetFile.type === 'directory' && draggedFile?.id !== targetFile.id) {
        (e.currentTarget as HTMLElement).style.background = '#7aa2f722';
      }
    },
    [draggedFile]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.background = '';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetFile: FileTreeNode) => {
      e.preventDefault();
      (e.currentTarget as HTMLElement).style.background = '';

      if (
        draggedFile &&
        targetFile.type === 'directory' &&
        draggedFile.id !== targetFile.id
      ) {
        handleMove(draggedFile.id, targetFile.id);
      }
      setDraggedFile(null);
    },
    [draggedFile, handleMove]
  );

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <FileExplorer
          files={displayFiles}
          selectedFileId={selectedFileId}
          onFileSelect={handleFileSelect}
          onNewFile={handleNewFile}
          onNewFolder={handleNewFolder}
          onRename={handleRename}
          onDelete={handleDelete}
          onCopyPath={handleCopyPath}
          onMove={handleMove}
          onRefresh={handleRefresh}
        />
      </div>

      <div style={styles.main}>
        {previewFile ? (
          <FilePreview
            filePath={previewFile.path}
            content={previewContent}
            onClose={() => {
              setPreviewFile(null);
              setPreviewContent('');
            }}
            onDownload={() => {
              const blob = new Blob([previewContent], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = previewFile.name;
              a.click();
              URL.revokeObjectURL(url);
            }}
          />
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📂</div>
            <div style={styles.emptyText}>Dosya seçin veya yeni dosya oluşturun</div>
            <div style={styles.emptyHint}>
              Sol panelden bir dosya seçin veya sağ tıklayarak menüyü açın
            </div>
          </div>
        )}
      </div>

      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        items={contextMenuItems}
        onClose={closeContextMenu}
      />

      {showUpload && (
        <div style={styles.uploadModal}>
          <div style={styles.uploadContent}>
            <div style={styles.uploadHeader}>
              <span style={styles.uploadTitle}>Dosya Yükle</span>
              <button
                style={styles.closeBtn}
                onClick={() => setShowUpload(false)}
              >
                ×
              </button>
            </div>
            <FileUpload
              onUpload={handleUpload}
              multiple
              maxSize={50 * 1024 * 1024}
            />
          </div>
        </div>
      )}

      {operation && (
        <div style={styles.operationModal}>
          <div style={styles.operationContent}>
            <div style={styles.operationTitle}>
              {operation.type === 'create' ? 'Yeni Oluştur' : 'Yeniden Adlandır'}
            </div>
            <input
              style={styles.operationInput}
              type="text"
              value={operationInput}
              onChange={(e) => setOperationInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleOperationSubmit();
                if (e.key === 'Escape') setOperation(null);
              }}
              placeholder={
                operation.type === 'create'
                  ? 'Dosya veya klasör adı...'
                  : 'Yeni ad...'
              }
              autoFocus
            />
            <div style={styles.operationActions}>
              <button
                style={styles.cancelBtn}
                onClick={() => setOperation(null)}
              >
                İptal
              </button>
              <button style={styles.submitBtn} onClick={handleOperationSubmit}>
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingSpinner}>⏳</div>
        </div>
      )}

      {error && (
        <div style={styles.errorBanner}>
          <span>{error}</span>
          <button style={styles.errorClose} onClick={() => {}}>
            ×
          </button>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    height: '100%',
    background: '#1a1b26',
    position: 'relative',
  },
  sidebar: {
    width: 280,
    flexShrink: 0,
    borderRight: '1px solid #292e42',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#565f89',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 500,
    color: '#c0caf5',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 13,
    color: '#565f89',
  },
  uploadModal: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  uploadContent: {
    background: '#1f2335',
    borderRadius: 12,
    padding: 24,
    width: 480,
    maxHeight: '80vh',
    overflow: 'auto',
    border: '1px solid #3b4261',
  },
  uploadHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#c0caf5',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#737aa2',
    fontSize: 20,
    cursor: 'pointer',
    padding: '0 4px',
  },
  operationModal: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  operationContent: {
    background: '#1f2335',
    borderRadius: 12,
    padding: 24,
    width: 400,
    border: '1px solid #3b4261',
  },
  operationTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#c0caf5',
    marginBottom: 16,
  },
  operationInput: {
    width: '100%',
    padding: '8px 12px',
    background: '#1a1b26',
    border: '1px solid #3b4261',
    borderRadius: 6,
    color: '#c0caf5',
    fontSize: 14,
    outline: 'none',
    marginBottom: 16,
  },
  operationActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelBtn: {
    padding: '6px 16px',
    background: 'none',
    border: '1px solid #3b4261',
    borderRadius: 6,
    color: '#a9b1d6',
    fontSize: 13,
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '6px 16px',
    background: '#7aa2f7',
    border: 'none',
    borderRadius: 6,
    color: '#1a1b26',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  loadingOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(26,27,38,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9998,
  },
  loadingSpinner: {
    fontSize: 48,
    animation: 'spin 1s linear infinite',
  },
  errorBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px',
    background: '#f7768e22',
    borderTop: '1px solid #f7768e',
    color: '#f7768e',
    fontSize: 13,
  },
  errorClose: {
    background: 'none',
    border: 'none',
    color: '#f7768e',
    fontSize: 16,
    cursor: 'pointer',
  },
};

export default React.memo(FileManager);
