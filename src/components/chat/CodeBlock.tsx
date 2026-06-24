import React, { useState, useCallback, useMemo } from 'react';

export interface CodeBlockProps {
  code: string;
  language?: string;
  fileName?: string;
  showLineNumbers?: boolean;
  onCopy?: (code: string) => void;
  onInsert?: (code: string, language: string) => void;
  onApplyDiff?: (code: string) => void;
  maxLines?: number;
}

const LANGUAGE_LABELS: Record<string, string> = {
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  python: 'Python',
  html: 'HTML',
  css: 'CSS',
  json: 'JSON',
  yaml: 'YAML',
  go: 'Go',
  rust: 'Rust',
  java: 'Java',
  bash: 'Bash',
  shell: 'Shell',
  sql: 'SQL',
  markdown: 'Markdown',
  xml: 'XML',
};

const SYNTAX_COLORS: Record<string, string> = {
  keyword: '#c678dd',
  string: '#98c379',
  number: '#d19a66',
  comment: '#5c6370',
  function: '#61afef',
  type: '#e5c07b',
  variable: '#e06c75',
  operator: '#56b6c2',
  punctuation: '#abb2bf',
  default: '#abb2bf',
};

function tokenizeLine(line: string): Array<{ text: string; color: string }> {
  const tokens: Array<{ text: string; color: string }> = [];
  const keywords = /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new|this|typeof|instanceof|interface|type|enum|extends|implements|public|private|protected|static|readonly|void|null|undefined|true|false)\b/g;
  const strings = /(["'`])(?:(?!\1).)*?\1/g;
  const comments = /(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm;
  const numbers = /\b\d+\.?\d*\b/g;

  const remaining = line;

  const replacements: Array<{ start: number; end: number; color: string }> = [];

  let match;
  const tempStr = line;

  for (const regex of [comments, strings, keywords, numbers]) {
    const r = new RegExp(regex.source, regex.flags);
    while ((match = r.exec(tempStr)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      let overlaps = false;
      for (const existing of replacements) {
        if (start < existing.end && end > existing.start) {
          overlaps = true;
          break;
        }
      }
      if (!overlaps) {
        let color = SYNTAX_COLORS.default;
        if (regex === comments) color = SYNTAX_COLORS.comment;
        else if (regex === strings) color = SYNTAX_COLORS.string;
        else if (regex === keywords) color = SYNTAX_COLORS.keyword;
        else if (regex === numbers) color = SYNTAX_COLORS.number;
        replacements.push({ start, end, color });
      }
    }
  }

  replacements.sort((a, b) => a.start - b.start);

  let pos = 0;
  for (const rep of replacements) {
    if (pos < rep.start) {
      tokens.push({ text: line.slice(pos, rep.start), color: SYNTAX_COLORS.default });
    }
    tokens.push({ text: line.slice(rep.start, rep.end), color: rep.color });
    pos = rep.end;
  }
  if (pos < line.length) {
    tokens.push({ text: line.slice(pos), color: SYNTAX_COLORS.default });
  }

  return tokens.length > 0 ? tokens : [{ text: line, color: SYNTAX_COLORS.default }];
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  fileName,
  showLineNumbers = true,
  onCopy,
  onInsert,
  onApplyDiff,
  maxLines = 500,
}) => {
  const [copied, setCopied] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const lines = useMemo(() => {
    const allLines = code.split('\n');
    if (!showAll && allLines.length > maxLines) {
      return allLines.slice(0, maxLines);
    }
    return allLines;
  }, [code, showAll, maxLines]);

  const hasMore = code.split('\n').length > maxLines;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      onCopy?.(code);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, [code, onCopy]);

  const langLabel = language ? LANGUAGE_LABELS[language] || language : '';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          {langLabel && <span style={styles.langBadge}>{langLabel}</span>}
          {fileName && <span style={styles.fileName}>{fileName}</span>}
        </div>
        <div style={styles.headerRight}>
          <button style={styles.headerBtn} onClick={handleCopy} title="Kopyala">
            {copied ? '✓ Kopyalandı' : '📋 Kopyala'}
          </button>
          {onInsert && (
            <button
              style={styles.headerBtn}
              onClick={() => onInsert(code, language || '')}
              title="Editöre Ekle"
            >
              ➕ Ekle
            </button>
          )}
          {onApplyDiff && (
            <button
              style={styles.headerBtn}
              onClick={() => onApplyDiff(code)}
              title="Diff Olarak Uygula"
            >
              📝 Uygula
            </button>
          )}
        </div>
      </div>
      <div style={styles.codeContainer}>
        <pre style={styles.code}>
          {lines.map((line, i) => {
            const tokens = tokenizeLine(line);
            return (
              <div key={i} style={styles.codeLine}>
                {showLineNumbers && (
                  <span style={styles.lineNumber}>{i + 1}</span>
                )}
                <span style={styles.lineContent}>
                  {tokens.map((token, j) => (
                    <span key={j} style={{ color: token.color }}>
                      {token.text}
                    </span>
                  ))}
                </span>
              </div>
            );
          })}
        </pre>
      </div>
      {hasMore && !showAll && (
        <button style={styles.showMore} onClick={() => setShowAll(true)}>
          Tümünü Göster ({code.split('\n').length} satır)
        </button>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    margin: '8px 0',
    borderRadius: 8,
    overflow: 'hidden',
    border: '1px solid #292e42',
    background: '#15161e',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 12px',
    background: '#1f2335',
    borderBottom: '1px solid #292e42',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  langBadge: {
    fontSize: 11,
    padding: '1px 6px',
    background: '#7aa2f722',
    color: '#7aa2f7',
    borderRadius: 3,
    fontWeight: 600,
  },
  fileName: {
    fontSize: 12,
    color: '#737aa2',
  },
  headerBtn: {
    background: 'none',
    border: 'none',
    color: '#737aa2',
    fontSize: 11,
    cursor: 'pointer',
    padding: '2px 8px',
    borderRadius: 3,
  },
  codeContainer: {
    overflow: 'auto',
    maxHeight: 400,
  },
  code: {
    margin: 0,
    padding: '8px 0',
    fontSize: 13,
    fontFamily: 'Cascadia Code, Fira Code, Consolas, monospace',
    lineHeight: 1.5,
  },
  codeLine: {
    display: 'flex',
    padding: '0 12px',
    minHeight: '1.5em',
  },
  lineNumber: {
    width: 40,
    textAlign: 'right',
    paddingRight: 12,
    color: '#414868',
    userSelect: 'none',
    flexShrink: 0,
  },
  lineContent: {
    flex: 1,
    whiteSpace: 'pre',
  },
  showMore: {
    display: 'block',
    width: '100%',
    padding: '6px 0',
    background: '#1f2335',
    border: 'none',
    borderTop: '1px solid #292e42',
    color: '#7aa2f7',
    fontSize: 12,
    cursor: 'pointer',
    textAlign: 'center',
  },
};

export default React.memo(CodeBlock);
