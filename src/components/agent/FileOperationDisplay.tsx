import React, { useState, useCallback, useMemo } from 'react';

export interface FileOperation {
  type: 'read' | 'write' | 'create' | 'delete' | 'rename';
  path: string;
  content?: string;
  diff?: string;
  oldPath?: string;
  status: 'pending' | 'success' | 'error';
}

export interface FileOperationDisplayProps {
  operation: FileOperation;
}

const OPERATION_CONFIG = {
  read: { icon: '📖', color: '#7aa2f7', label: 'Okundu' },
  write: { icon: '✏️', color: '#e0af68', label: 'Yazıldı' },
  create: { icon: '➕', color: '#9ece6a', label: 'Oluşturuldu' },
  delete: { icon: '🗑️', color: '#f7768e', label: 'Silindi' },
  rename: { icon: '📝', color: '#bb9af7', label: 'Yeniden Adlandırıldı' },
};

function parseDiff(diff: string): Array<{
  type: 'add' | 'remove' | 'context';
  content: string;
  lineNumber?: number;
}> {
  const lines = diff.split('\n');
  const result: Array<{
    type: 'add' | 'remove' | 'context';
    content: string;
    lineNumber?: number;
  }> = [];
  let lineNum = 0;

  for (const line of lines) {
    if (line.startsWith('+')) {
      lineNum++;
      result.push({ type: 'add', content: line.slice(1), lineNumber: lineNum });
    } else if (line.startsWith('-')) {
      result.push({ type: 'remove', content: line.slice(1) });
    } else if (line.startsWith('@@')) {
      continue;
    } else {
      lineNum++;
      result.push({ type: 'context', content: line.startsWith(' ') ? line.slice(1) : line, lineNumber: lineNum });
    }
  }

  return result;
}

const FileOperationDisplay: React.FC<FileOperationDisplayProps> = ({
  operation,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = OPERATION_CONFIG[operation.type];

  const diffLines = useMemo(() => {
    if (!operation.diff) return [];
    return parseDiff(operation.diff);
  }, [operation.diff]);

  const toggleExpand = useCallback(() => {
    setIsExpanded((p) => !p);
  }, []);

  const getFileName = (path: string) => {
    return path.split(/[/\\]/).pop() || path;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header} onClick={toggleExpand}>
        <span style={styles.arrow}>{isExpanded ? '▼' : '▶'}</span>
        <span style={styles.icon}>{config.icon}</span>
        <div style={styles.info}>
          <div style={styles.pathRow}>
            <span style={styles.fileName}>{getFileName(operation.path)}</span>
            <span
              style={{
                ...styles.statusDot,
                color: config.color,
              }}
            >
              ●
            </span>
          </div>
          <div style={styles.meta}>
            <span style={{ color: config.color }}>{config.label}</span>
            <span style={styles.path}>{operation.path}</span>
          </div>
        </div>
      </div>

      {isExpanded && operation.diff && diffLines.length > 0 && (
        <div style={styles.diffContainer}>
          {diffLines.map((line, i) => (
            <div
              key={i}
              style={{
                ...styles.diffLine,
                ...(line.type === 'add' ? styles.diffAdd : {}),
                ...(line.type === 'remove' ? styles.diffRemove : {}),
              }}
            >
              <span style={styles.diffPrefix}>
                {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
              </span>
              <span style={styles.diffContent}>{line.content}</span>
            </div>
          ))}
        </div>
      )}

      {isExpanded && operation.content && !operation.diff && (
        <div style={styles.contentPreview}>
          <pre style={styles.contentCode}>{operation.content}</pre>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    borderRadius: 6,
    border: '1px solid #292e42',
    overflow: 'hidden',
    marginBottom: 6,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    background: '#1f2335',
    cursor: 'pointer',
    userSelect: 'none',
  },
  arrow: {
    fontSize: 10,
    color: '#737aa2',
    width: 12,
    flexShrink: 0,
  },
  icon: {
    fontSize: 14,
    flexShrink: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  pathRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  fileName: {
    fontSize: 12,
    fontWeight: 600,
    color: '#c0caf5',
    fontFamily: 'monospace',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  statusDot: {
    fontSize: 8,
    flexShrink: 0,
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 10,
    marginTop: 2,
  },
  path: {
    color: '#414868',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  diffContainer: {
    background: '#15161e',
    borderTop: '1px solid #292e42',
    maxHeight: 300,
    overflow: 'auto',
  },
  diffLine: {
    display: 'flex',
    fontFamily: 'Cascadia Code, monospace',
    fontSize: 11,
    lineHeight: 1.5,
    padding: '0 10px',
  },
  diffAdd: {
    background: '#9ece6a11',
    color: '#9ece6a',
  },
  diffRemove: {
    background: '#f7768e11',
    color: '#f7768e',
  },
  diffPrefix: {
    width: 16,
    textAlign: 'center',
    color: '#565f89',
    flexShrink: 0,
  },
  diffContent: {
    flex: 1,
    whiteSpace: 'pre',
  },
  contentPreview: {
    background: '#15161e',
    borderTop: '1px solid #292e42',
    maxHeight: 200,
    overflow: 'auto',
    padding: '6px 10px',
  },
  contentCode: {
    margin: 0,
    fontSize: 11,
    fontFamily: 'Cascadia Code, monospace',
    color: '#a9b1d6',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
};

export default React.memo(FileOperationDisplay);
