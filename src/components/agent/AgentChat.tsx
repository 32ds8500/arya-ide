import React, { useState, useRef, useEffect, useCallback } from 'react';
import ToolCallDisplay from './ToolCallDisplay';
import FileOperationDisplay from './FileOperationDisplay';
import ThinkingIndicator from './ThinkingIndicator';
import StreamingText from '../chat/StreamingText';

export interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, unknown>;
  result?: string;
  status: 'running' | 'success' | 'error';
  error?: string;
}

export interface FileOperation {
  type: 'read' | 'write' | 'create' | 'delete' | 'rename';
  path: string;
  content?: string;
  diff?: string;
  status: 'pending' | 'success' | 'error';
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  fileOperations?: FileOperation[];
  isThinking?: boolean;
  isStreaming?: boolean;
}

export interface AgentChatProps {
  messages: AgentMessage[];
  onSend: (message: string) => void;
  onCancel?: () => void;
  onRetry?: (messageId: string) => void;
  isProcessing?: boolean;
}

const AgentChat: React.FC<AgentChatProps> = ({
  messages,
  onSend,
  onCancel,
  onRetry,
  isProcessing = false,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isProcessing) return;
    onSend(trimmed);
    setInput('');
  }, [input, isProcessing, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const renderMessage = (msg: AgentMessage) => {
    const isUser = msg.role === 'user';
    const isSystem = msg.role === 'system';

    if (isSystem) {
      return (
        <div key={msg.id} style={styles.systemMessage}>
          <span style={styles.systemIcon}>ℹ️</span>
          <span>{msg.content}</span>
        </div>
      );
    }

    return (
      <div
        key={msg.id}
        style={{
          ...styles.message,
          ...(isUser ? styles.userMessage : {}),
        }}
      >
        <div style={styles.avatar}>
          {isUser ? '👤' : '🤖'}
        </div>
        <div style={styles.content}>
          <div style={styles.messageHeader}>
            <span style={styles.role}>{isUser ? 'Sen' : 'Arya Asistan'}</span>
            <span style={styles.time}>
              {msg.timestamp.toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {msg.isThinking && <ThinkingIndicator />}

          {msg.content && (
            <div style={styles.textContent}>
              {msg.isStreaming ? (
                <StreamingText content={msg.content} isStreaming={true} />
              ) : (
                msg.content
              )}
            </div>
          )}

          {msg.toolCalls && msg.toolCalls.length > 0 && (
            <div style={styles.toolCalls}>
              <div style={styles.sectionLabel}>Araç Kullanımları</div>
              {msg.toolCalls.map((tc) => (
                <ToolCallDisplay key={tc.id} toolCall={tc} />
              ))}
            </div>
          )}

          {msg.fileOperations && msg.fileOperations.length > 0 && (
            <div style={styles.fileOps}>
              <div style={styles.sectionLabel}>Dosya İşlemleri</div>
              {msg.fileOperations.map((op, i) => (
                <FileOperationDisplay key={i} operation={op} />
              ))}
            </div>
          )}

          {!isUser && !msg.isStreaming && !isProcessing && (
            <div style={styles.messageActions}>
              <button
                style={styles.actionBtn}
                onClick={() => onRetry?.(msg.id)}
                title="Yeniden Dene"
              >
                🔄
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.messagesContainer}>
        {messages.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🤖</div>
            <div style={styles.emptyTitle}>Arya Asistan'a Hoş Geldiniz</div>
            <div style={styles.emptySubtitle}>
              Kodlama, hata ayıklama ve geliştirme görevlerinde size yardımcı olabilirim.
            </div>
          </div>
        )}
        {messages.map(renderMessage)}
        <div ref={messagesEndRef} />
      </div>

      <div style={styles.inputContainer}>
        <textarea
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Komutunuzu yazın..."
          rows={1}
          disabled={isProcessing}
        />
        <div style={styles.inputActions}>
          {isProcessing && onCancel && (
            <button style={styles.cancelBtn} onClick={onCancel}>
              İptal
            </button>
          )}
          <button
            style={{
              ...styles.sendBtn,
              ...(input.trim() && !isProcessing ? styles.sendBtnActive : {}),
            }}
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
          >
            {isProcessing ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#1a1b26',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 0',
  },
  message: {
    display: 'flex',
    gap: 12,
    padding: '12px 24px',
    borderBottom: '1px solid #292e42',
  },
  userMessage: {
    background: '#24283b',
  },
  systemMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 24px',
    color: '#737aa2',
    fontSize: 13,
    fontStyle: 'italic',
  },
  systemIcon: {
    fontSize: 14,
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
  messageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
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
  textContent: {
    color: '#a9b1d6',
    fontSize: 14,
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
  },
  toolCalls: {
    marginTop: 12,
  },
  fileOps: {
    marginTop: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#565f89',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  messageActions: {
    display: 'flex',
    gap: 4,
    marginTop: 8,
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    color: '#737aa2',
    fontSize: 14,
    cursor: 'pointer',
    padding: '4px',
    borderRadius: 4,
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
    padding: '12px 24px',
    background: '#1f2335',
    borderTop: '1px solid #292e42',
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    background: '#1a1b26',
    border: '1px solid #3b4261',
    borderRadius: 8,
    color: '#c0caf5',
    fontSize: 14,
    fontFamily: 'inherit',
    resize: 'none',
    outline: 'none',
    lineHeight: 1.5,
    maxHeight: 120,
  },
  inputActions: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  cancelBtn: {
    padding: '6px 12px',
    background: '#f7768e33',
    border: '1px solid #f7768e',
    borderRadius: 6,
    color: '#f7768e',
    fontSize: 13,
    cursor: 'pointer',
  },
  sendBtn: {
    padding: '6px 12px',
    background: '#292e42',
    border: 'none',
    borderRadius: 6,
    color: '#565f89',
    fontSize: 16,
    cursor: 'pointer',
  },
  sendBtnActive: {
    background: '#7aa2f733',
    color: '#7aa2f7',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#737aa2',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#c0caf5',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    maxWidth: 400,
    textAlign: 'center',
  },
};

export default React.memo(AgentChat);
