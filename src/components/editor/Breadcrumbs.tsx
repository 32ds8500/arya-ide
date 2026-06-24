import React, { useCallback } from 'react';

export interface BreadcrumbItem {
  label: string;
  path: string;
  isLast: boolean;
}

export interface BreadcrumbsProps {
  filePath: string;
  onNavigate: (path: string) => void;
}

function parseFilePath(filePath: string): BreadcrumbItem[] {
  const parts = filePath.replace(/\\/g, '/').split('/').filter(Boolean);
  return parts.map((part, index) => ({
    label: part,
    path: parts.slice(0, index + 1).join('/'),
    isLast: index === parts.length - 1,
  }));
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ filePath, onNavigate }) => {
  const items = parseFilePath(filePath);

  const getFileIcon = (name: string): string => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const icons: Record<string, string> = {
      tsx: 'TS',
      ts: 'TS',
      js: 'JS',
      jsx: 'JS',
      py: 'PY',
      html: 'H',
      css: 'C',
      json: '{}',
      md: 'M',
    };
    return icons[ext] || '📄';
  };

  return (
    <nav style={styles.breadcrumbs} aria-label="Dosya yolu">
      {items.map((item, index) => (
        <React.Fragment key={item.path}>
          {index > 0 && <span style={styles.separator}>/</span>}
          <button
            style={{
              ...styles.item,
              ...(item.isLast ? styles.lastItem : {}),
            }}
            onClick={() => onNavigate(item.path)}
            title={item.path}
          >
            {!item.isLast && (
              <span style={styles.folderIcon}>📁</span>
            )}
            {item.isLast && (
              <span style={styles.fileIcon}>{getFileIcon(item.label)}</span>
            )}
            <span>{item.label}</span>
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
};

const styles: Record<string, React.CSSProperties> = {
  breadcrumbs: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    height: 28,
    background: '#1a1b26',
    borderBottom: '1px solid #292e42',
    fontSize: 12,
    overflow: 'hidden',
    gap: 2,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'none',
    border: 'none',
    color: '#737aa2',
    fontSize: 12,
    cursor: 'pointer',
    padding: '2px 4px',
    borderRadius: 3,
    whiteSpace: 'nowrap',
    maxWidth: 200,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  lastItem: {
    color: '#c0caf5',
    fontWeight: 500,
  },
  separator: {
    color: '#3b4261',
    fontSize: 12,
  },
  folderIcon: {
    fontSize: 11,
  },
  fileIcon: {
    fontSize: 10,
    fontWeight: 700,
    fontFamily: 'monospace',
    color: '#3178c6',
  },
};

export default React.memo(Breadcrumbs);
