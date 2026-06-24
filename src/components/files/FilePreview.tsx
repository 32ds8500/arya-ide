import React, { useMemo } from 'react';

export interface FilePreviewProps {
  filePath: string;
  content?: string;
  mimeType?: string;
  onDownload?: () => void;
  onClose?: () => void;
}

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'];
const MARKDOWN_EXTENSIONS = ['md', 'markdown'];
const PDF_EXTENSIONS = ['pdf'];
const CODE_EXTENSIONS = [
  'ts', 'tsx', 'js', 'jsx', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp',
  'h', 'hpp', 'cs', 'php', 'swift', 'kt', 'scala', 'html', 'css', 'scss',
  'less', 'json', 'xml', 'yaml', 'yml', 'sh', 'bash', 'sql', 'dockerfile',
  'toml', 'ini', 'env', 'txt',
];

function getExtension(filePath: string): string {
  return filePath.split('.').pop()?.toLowerCase() || '';
}

function getPreviewType(filePath: string): 'image' | 'markdown' | 'pdf' | 'code' | 'unknown' {
  const ext = getExtension(filePath);
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
  if (MARKDOWN_EXTENSIONS.includes(ext)) return 'markdown';
  if (PDF_EXTENSIONS.includes(ext)) return 'pdf';
  if (CODE_EXTENSIONS.includes(ext)) return 'code';
  return 'unknown';
}

function renderMarkdown(content: string): React.ReactNode[] {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} style={styles.h1}>{line.slice(2)}</h1>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} style={styles.h2}>{line.slice(3)}</h2>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} style={styles.h3}>{line.slice(4)}</h3>);
    } else if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} style={styles.mdCodeBlock}>
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={i} style={styles.mdLi}>{line.slice(2)}</li>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 8 }} />);
    } else {
      elements.push(
        <p key={i} style={styles.mdP}>{line}</p>
      );
    }
  }

  return elements;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  filePath,
  content,
  onDownload,
  onClose,
}) => {
  const previewType = getPreviewType(filePath);
  const fileName = filePath.split(/[/\\]/).pop() || filePath;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.fileName}>{fileName}</span>
        <div style={styles.actions}>
          {onDownload && (
            <button style={styles.actionBtn} onClick={onDownload}>
              İndir
            </button>
          )}
          {onClose && (
            <button style={styles.closeBtn} onClick={onClose}>
              ×
            </button>
          )}
        </div>
      </div>

      <div style={styles.previewArea}>
        {previewType === 'image' && content && (
          <div style={styles.imageContainer}>
            <img
              src={content}
              alt={fileName}
              style={styles.image}
            />
          </div>
        )}

        {previewType === 'markdown' && content && (
          <div style={styles.markdownContainer}>
            {renderMarkdown(content)}
          </div>
        )}

        {previewType === 'pdf' && content && (
          <iframe
            src={content}
            style={styles.pdfViewer}
            title={fileName}
          />
        )}

        {previewType === 'code' && content && (
          <pre style={styles.codePreview}>{content}</pre>
        )}

        {previewType === 'unknown' && (
          <div style={styles.unknownType}>
            <span style={styles.unknownIcon}>📄</span>
            <span>Bu dosya türü önizlenemiyor</span>
          </div>
        )}

        {!content && previewType !== 'unknown' && (
          <div style={styles.loading}>Yükleniyor...</div>
        )}
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
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px',
    background: '#1f2335',
    borderBottom: '1px solid #292e42',
  },
  fileName: {
    color: '#c0caf5',
    fontSize: 13,
    fontWeight: 500,
  },
  actions: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  actionBtn: {
    padding: '4px 10px',
    background: '#7aa2f733',
    border: '1px solid #7aa2f7',
    borderRadius: 4,
    color: '#7aa2f7',
    fontSize: 12,
    cursor: 'pointer',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#737aa2',
    fontSize: 18,
    cursor: 'pointer',
  },
  previewArea: {
    flex: 1,
    overflow: 'auto',
    padding: 16,
  },
  imageContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  image: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    borderRadius: 4,
  },
  markdownContainer: {
    maxWidth: 720,
    margin: '0 auto',
    color: '#a9b1d6',
    fontSize: 14,
    lineHeight: 1.7,
  },
  h1: {
    fontSize: 24,
    fontWeight: 700,
    color: '#c0caf5',
    marginBottom: 12,
    marginTop: 24,
  },
  h2: {
    fontSize: 20,
    fontWeight: 600,
    color: '#c0caf5',
    marginBottom: 8,
    marginTop: 20,
  },
  h3: {
    fontSize: 16,
    fontWeight: 600,
    color: '#c0caf5',
    marginBottom: 6,
    marginTop: 16,
  },
  mdP: {
    margin: '4px 0',
  },
  mdLi: {
    marginLeft: 20,
    listStyle: 'disc',
  },
  mdCodeBlock: {
    background: '#15161e',
    padding: '8px 12px',
    borderRadius: 6,
    fontSize: 13,
    fontFamily: 'Cascadia Code, monospace',
    overflow: 'auto',
    border: '1px solid #292e42',
    margin: '8px 0',
  },
  pdfViewer: {
    width: '100%',
    height: '100%',
    border: 'none',
  },
  codePreview: {
    margin: 0,
    fontSize: 13,
    fontFamily: 'Cascadia Code, Fira Code, monospace',
    lineHeight: 1.5,
    color: '#a9b1d6',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  unknownType: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#737aa2',
    gap: 12,
  },
  unknownIcon: {
    fontSize: 48,
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#737aa2',
  },
};

export default React.memo(FilePreview);
