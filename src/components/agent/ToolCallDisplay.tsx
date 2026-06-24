import React, { useState, useCallback } from 'react';

export interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, unknown>;
  result?: string;
  status: 'running' | 'success' | 'error';
  error?: string;
}

export interface ToolCallDisplayProps {
  toolCall: ToolCall;
  onExpand?: (id: string) => void;
}

const STATUS_CONFIG = {
  running: { color: '#e0af68', icon: '⏳', label: 'Çalışıyor' },
  success: { color: '#9ece6a', icon: '✓', label: 'Başarılı' },
  error: { color: '#f7768e', icon: '✗', label: 'Hata' },
};

function formatParameters(params: Record<string, unknown>): string {
  try {
    return JSON.stringify(params, null, 2);
  } catch {
    return String(params);
  }
}

const ToolCallDisplay: React.FC<ToolCallDisplayProps> = ({
  toolCall,
  onExpand,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusConfig = STATUS_CONFIG[toolCall.status];

  const toggleExpand = useCallback(() => {
    setIsExpanded((p) => !p);
    if (!isExpanded) {
      onExpand?.(toolCall.id);
    }
  }, [isExpanded, onExpand, toolCall.id]);

  return (
    <div style={styles.container}>
      <div style={styles.header} onClick={toggleExpand}>
        <div style={styles.headerLeft}>
          <span style={styles.arrow}>{isExpanded ? '▼' : '▶'}</span>
          <span style={styles.toolIcon}>🔧</span>
          <span style={styles.toolName}>{toolCall.name}</span>
          <span
            style={{
              ...styles.statusBadge,
              color: statusConfig.color,
              borderColor: `${statusConfig.color  }44`,
              background: `${statusConfig.color  }11`,
            }}
          >
            {statusConfig.icon} {statusConfig.label}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div style={styles.details}>
          <div style={styles.section}>
            <div style={styles.sectionLabel}>Parametreler</div>
            <pre style={styles.codeBlock}>
              {formatParameters(toolCall.parameters)}
            </pre>
          </div>

          {toolCall.result && (
            <div style={styles.section}>
              <div style={styles.sectionLabel}>Sonuç</div>
              <pre style={styles.codeBlock}>{toolCall.result}</pre>
            </div>
          )}

          {toolCall.error && (
            <div style={styles.section}>
              <div style={{ ...styles.sectionLabel, color: '#f7768e' }}>
                Hata
              </div>
              <pre style={{ ...styles.codeBlock, color: '#f7768e' }}>
                {toolCall.error}
              </pre>
            </div>
          )}
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
    padding: '6px 10px',
    background: '#1f2335',
    cursor: 'pointer',
    userSelect: 'none',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  arrow: {
    fontSize: 10,
    color: '#737aa2',
    width: 12,
  },
  toolIcon: {
    fontSize: 12,
  },
  toolName: {
    fontSize: 12,
    fontWeight: 600,
    color: '#c0caf5',
    fontFamily: 'monospace',
  },
  statusBadge: {
    fontSize: 10,
    padding: '1px 6px',
    borderRadius: 4,
    border: '1px solid',
    fontWeight: 500,
  },
  details: {
    padding: '8px 10px',
    background: '#15161e',
  },
  section: {
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: '#565f89',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  codeBlock: {
    margin: 0,
    padding: '6px 10px',
    background: '#1a1b26',
    borderRadius: 4,
    fontSize: 11,
    fontFamily: 'Cascadia Code, monospace',
    color: '#a9b1d6',
    overflow: 'auto',
    maxHeight: 200,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
};

export default React.memo(ToolCallDisplay);
