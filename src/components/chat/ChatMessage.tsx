import React, { useState, useCallback } from 'react';
import CodeBlock from './CodeBlock';

export interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  avatar?: string;
  isStreaming?: boolean;
}

export interface ChatMessageProps {
  message: ChatMessageData;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onInsertCode?: (code: string, language: string) => void;
  onApplyDiff?: (diff: string) => void;
}

function renderMarkdown(text: string, onInsertCode?: (code: string, language: string) => void): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const lines = text.split('\n');
  let inCodeBlock = false;
  let codeContent = '';
  let codeLanguage = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        parts.push(
          <CodeBlock
            key={`code-${i}`}
            code={codeContent.trim()}
            language={codeLanguage}
            onInsert={onInsertCode}
          />
        );
        codeContent = '';
        codeLanguage = '';
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent += `${line  }\n`;
      continue;
    }

    const rendered = renderInlineMarkdown(line);
    parts.push(
      <div key={`line-${i}`} style={line === '' ? { height: 8 } : undefined}>
        {rendered}
      </div>
    );
  }

  return parts;
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|`(.+?)`|\[(.+?)\]\((.+?)\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      parts.push(<strong key={match.index} style={{ fontWeight: 600 }}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(
        <code key={match.index} style={styles.inlineCode}>{match[3]}</code>
      );
    } else if (match[4] && match[5]) {
      parts.push(
        <a key={match.index} href={match[5]} style={styles.link} target="_blank" rel="noopener noreferrer">
          {match[4]}
        </a>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onEdit,
  onDelete,
  onInsertCode,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showActions, setShowActions] = useState(false);

  const handleSaveEdit = useCallback(() => {
    onEdit?.(message.id, editContent);
    setIsEditing(false);
  }, [message.id, editContent, onEdit]);

  const handleCancelEdit = useCallback(() => {
    setEditContent(message.content);
    setIsEditing(false);
  }, [message.content]);

  const isUser = message.role === 'user';

  return (
    <div
      style={{
        ...styles.message,
        ...(isUser ? styles.userMessage : {}),
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div style={styles.avatar}>
        {message.avatar || (isUser ? '👤' : '🤖')}
      </div>
      <div style={styles.content}>
        <div style={styles.header}>
          <span style={styles.role}>
            {isUser ? 'Sen' : 'Arya'}
          </span>
          <span style={styles.time}>{formatTime(message.timestamp)}</span>
          {showActions && !message.isStreaming && (
            <div style={styles.actions}>
              {isUser && (
                <button
                  style={styles.actionBtn}
                  onClick={() => {
                    setEditContent(message.content);
                    setIsEditing(true);
                  }}
                  title="Düzenle"
                >
                  ✏️
                </button>
              )}
              <button
                style={styles.actionBtn}
                onClick={() => onDelete?.(message.id)}
                title="Sil"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
        {isEditing ? (
          <div>
            <textarea
              style={styles.editTextarea}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
            />
            <div style={styles.editActions}>
              <button style={styles.saveBtn} onClick={handleSaveEdit}>
                Kaydet
              </button>
              <button style={styles.cancelBtn} onClick={handleCancelEdit}>
                İptal
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.body}>{renderMarkdown(message.content, onInsertCode)}</div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  message: {
    display: 'flex',
    gap: 12,
    padding: '12px 16px',
    borderBottom: '1px solid #292e42',
  },
  userMessage: {
    background: '#24283b',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: '#292e42',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  role: {
    fontWeight: 600,
    color: '#c0caf5',
    fontSize: 13,
  },
  time: {
    color: '#565f89',
    fontSize: 11,
  },
  actions: {
    display: 'flex',
    gap: 4,
    marginLeft: 'auto',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    padding: '2px 4px',
    borderRadius: 4,
    opacity: 0.7,
  },
  body: {
    color: '#a9b1d6',
    fontSize: 14,
    lineHeight: 1.6,
  },
  inlineCode: {
    background: '#292e42',
    padding: '1px 4px',
    borderRadius: 3,
    fontSize: 13,
    fontFamily: 'Cascadia Code, monospace',
    color: '#7dcfff',
  },
  link: {
    color: '#7aa2f7',
    textDecoration: 'none',
  },
  editTextarea: {
    width: '100%',
    padding: 8,
    background: '#1a1b26',
    border: '1px solid #3b4261',
    borderRadius: 6,
    color: '#c0caf5',
    fontSize: 14,
    fontFamily: 'inherit',
    resize: 'vertical',
    outline: 'none',
  },
  editActions: {
    display: 'flex',
    gap: 8,
    marginTop: 8,
  },
  saveBtn: {
    padding: '4px 12px',
    background: '#7aa2f733',
    border: '1px solid #7aa2f7',
    borderRadius: 4,
    color: '#7aa2f7',
    fontSize: 12,
    cursor: 'pointer',
  },
  cancelBtn: {
    padding: '4px 12px',
    background: 'none',
    border: '1px solid #3b4261',
    borderRadius: 4,
    color: '#737aa2',
    fontSize: 12,
    cursor: 'pointer',
  },
};

export default React.memo(ChatMessage);
