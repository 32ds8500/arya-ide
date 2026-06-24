import React, { useState, useRef, useCallback } from 'react';

export interface FileUploadProps {
  onUpload: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  disabled?: boolean;
}

interface UploadedFile {
  file: File;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  accept,
  multiple = true,
  maxSize = 10 * 1024 * 1024,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (maxSize && file.size > maxSize) {
        return `Dosya çok büyük. Maksimum: ${(maxSize / 1024 / 1024).toFixed(1)} MB`;
      }
      return null;
    },
    [maxSize]
  );

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const newUploaded: UploadedFile[] = [];

      for (const file of fileArray) {
        const error = validateFile(file);
        newUploaded.push({
          file,
          progress: error ? 0 : 100,
          status: error ? 'error' : 'done',
          error: error || undefined,
        });
      }

      setUploadedFiles((prev) => [...prev, ...newUploaded]);

      const validFiles = fileArray.filter((f) => !validateFile(f));
      if (validFiles.length > 0) {
        onUpload(validFiles);
      }
    },
    [validateFile, onUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (!disabled && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [disabled, processFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [processFiles]
  );

  const removeFile = useCallback((index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.dropZone,
          ...(isDragging ? styles.dropZoneActive : {}),
          ...(disabled ? styles.dropZoneDisabled : {}),
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          disabled={disabled}
        />
        <div style={styles.dropIcon}>
          {isDragging ? '📥' : '📁'}
        </div>
        <div style={styles.dropText}>
          {isDragging
            ? 'Dosyaları buraya bırakın'
            : 'Dosya seçmek için tıklayın veya sürükleyin'}
        </div>
        {maxSize && (
          <div style={styles.dropHint}>
            Maksimum dosya boyutu: {formatSize(maxSize)}
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div style={styles.fileList}>
          {uploadedFiles.map((uf, index) => (
            <div
              key={index}
              style={{
                ...styles.fileItem,
                ...(uf.status === 'error' ? styles.fileItemError : {}),
              }}
            >
              <div style={styles.fileInfo}>
                <span style={styles.fileIcon}>
                  {uf.status === 'done' ? '✓' : uf.status === 'error' ? '✗' : '⏳'}
                </span>
                <div style={styles.fileDetails}>
                  <span style={styles.fileName}>{uf.file.name}</span>
                  <span style={styles.fileSize}>{formatSize(uf.file.size)}</span>
                </div>
              </div>
              {uf.status === 'uploading' && (
                <div style={styles.progressBar}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${uf.progress}%`,
                    }}
                  />
                </div>
              )}
              {uf.error && (
                <span style={styles.errorMessage}>{uf.error}</span>
              )}
              <button
                style={styles.removeBtn}
                onClick={() => removeFile(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  dropZone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 24px',
    border: '2px dashed #3b4261',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
  },
  dropZoneActive: {
    borderColor: '#7aa2f7',
    background: '#7aa2f711',
  },
  dropZoneDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  dropIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  dropText: {
    color: '#c0caf5',
    fontSize: 14,
    fontWeight: 500,
  },
  dropHint: {
    color: '#565f89',
    fontSize: 12,
    marginTop: 4,
  },
  fileList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: '#1f2335',
    borderRadius: 6,
    border: '1px solid #292e42',
  },
  fileItemError: {
    borderColor: '#f7768e44',
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  fileIcon: {
    fontSize: 14,
    flexShrink: 0,
  },
  fileDetails: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  fileName: {
    color: '#c0caf5',
    fontSize: 13,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  fileSize: {
    color: '#565f89',
    fontSize: 11,
  },
  progressBar: {
    width: 80,
    height: 4,
    background: '#292e42',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: '#7aa2f7',
    borderRadius: 2,
    transition: 'width 0.3s',
  },
  errorMessage: {
    color: '#f7768e',
    fontSize: 11,
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#737aa2',
    fontSize: 16,
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
    flexShrink: 0,
  },
};

export default React.memo(FileUpload);
