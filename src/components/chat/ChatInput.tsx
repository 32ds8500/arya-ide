import React, { useState, useRef, useCallback, useEffect } from 'react';

export interface ChatInputProps {
  onSend: (message: string, files?: File[]) => void;
  models?: Array<{ id: string; name: string; provider: string }>;
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  models = [],
  selectedModel,
  onModelChange,
  disabled = false,
  placeholder = 'Mesajınızı yazın...',
}) => {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [message, adjustHeight]);

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed && files.length === 0) return;
    onSend(trimmed, files.length > 0 ? files : undefined);
    setMessage('');
    setFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message, files, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      style={{
        ...styles.container,
        ...(isDragging ? styles.dragging : {}),
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {files.length > 0 && (
        <div style={styles.files}>
          {files.map((file, index) => (
            <div key={index} style={styles.fileChip}>
              <span style={styles.fileName}>📎 {file.name}</span>
              <button
                style={styles.removeFile}
                onClick={() => removeFile(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={styles.inputRow}>
        <button
          style={styles.attachBtn}
          onClick={() => fileInputRef.current?.click()}
          title="Dosya Ekle"
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        <textarea
          ref={textareaRef}
          style={styles.textarea}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
        />

        <button
          style={{
            ...styles.sendBtn,
            ...(message.trim() || files.length > 0
              ? styles.sendBtnActive
              : {}),
          }}
          onClick={handleSend}
          disabled={disabled || (!message.trim() && files.length === 0)}
          title="Gönder (Enter)"
        >
          ➤
        </button>
      </div>

      {models.length > 0 && (
        <div style={styles.modelRow}>
          <span style={styles.modelLabel}>Model:</span>
          <select
            style={styles.modelSelect}
            value={selectedModel || ''}
            onChange={(e) => onModelChange?.(e.target.value)}
          >
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.provider} / {model.name}
              </option>
            ))}
          </select>
          <span style={styles.hint}>Enter ile gönder, Shift+Enter ile yeni satır</span>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '12px 16px',
    background: '#1f2335',
    borderTop: '1px solid #292e42',
  },
  drag: {
    border: '2px dashed #7aa2f7',
    borderRadius: 8,
  },
  files: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  fileChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 8px',
    background: '#292e42',
    borderRadius: 4,
    fontSize: 12,
    color: '#c0caf5',
  },
  fileName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 150,
  },
  removeFile: {
    background: 'none',
    border: 'none',
    color: '#737aa2',
    cursor: 'pointer',
    fontSize: 14,
    padding: 0,
    lineHeight: 1,
  },
  inputRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
    background: '#1a1b26',
    border: '1px solid #3b4261',
    borderRadius: 8,
    padding: '8px 12px',
  },
  attachBtn: {
    background: 'none',
    border: 'none',
    color: '#737aa2',
    fontSize: 18,
    cursor: 'pointer',
    padding: '2px',
    lineHeight: 1,
    flexShrink: 0,
  },
  textarea: {
    flex: 1,
    background: 'none',
    border: 'none',
    color: '#c0caf5',
    fontSize: 14,
    fontFamily: 'inherit',
    resize: 'none',
    outline: 'none',
    lineHeight: 1.5,
    maxHeight: 200,
  },
  sendBtn: {
    background: '#292e42',
    border: 'none',
    color: '#565f89',
    fontSize: 18,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 6,
    lineHeight: 1,
    flexShrink: 0,
    transition: 'background 0.15s, color 0.15s',
  },
  sendBtnActive: {
    background: '#7aa2f733',
    color: '#7aa2f7',
  },
  modelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    fontSize: 12,
  },
  modelLabel: {
    color: '#565f89',
  },
  modelSelect: {
    padding: '2px 8px',
    background: '#1a1b26',
    border: '1px solid #3b4261',
    borderRadius: 4,
    color: '#c0caf5',
    fontSize: 12,
    outline: 'none',
  },
  hint: {
    marginLeft: 'auto',
    color: '#414868',
    fontSize: 11,
  },
};

export default React.memo(ChatInput);
