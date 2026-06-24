import React, { useState, useRef, useCallback } from 'react';

export interface SearchResult {
  filePath: string;
  fileName: string;
  matches: SearchMatch[];
}

export interface SearchMatch {
  lineNumber: number;
  lineContent: string;
  matchStart: number;
  matchEnd: number;
}

export interface SearchPanelProps {
  results: SearchResult[];
  onSearch: (query: string, options: SearchOptions) => void;
  onReplace: (query: string, replacement: string, options: SearchOptions) => void;
  onReplaceAll: (query: string, replacement: string, options: SearchOptions) => void;
  onNavigateToFile: (filePath: string, lineNumber: number) => void;
  onClose: () => void;
}

export interface SearchOptions {
  regex: boolean;
  matchCase: boolean;
  wholeWord: boolean;
  searchInDirectory: string;
}

const SearchPanel: React.FC<SearchPanelProps> = ({
  results,
  onSearch,
  onReplace,
  onReplaceAll,
  onNavigateToFile,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [options, setOptions] = useState<SearchOptions>({
    regex: false,
    matchCase: false,
    wholeWord: false,
    searchInDirectory: '',
  });
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      onSearch(query, options);
    }
  }, [query, options, onSearch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [handleSearch, onClose]
  );

  const toggleFile = useCallback((filePath: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(filePath)) {
        next.delete(filePath);
      } else {
        next.add(filePath);
      }
      return next;
    });
  }, []);

  const toggleOption = useCallback((key: keyof SearchOptions) => {
    setOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const highlightMatch = (line: string, start: number, end: number) => {
    return (
      <>
        {line.slice(0, start)}
        <mark style={styles.highlight}>{line.slice(start, end)}</mark>
        {line.slice(end)}
      </>
    );
  };

  const totalMatches = results.reduce((acc, r) => acc + r.matches.length, 0);

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.title}>Dosyalarda Ara</span>
        <button style={styles.closeBtn} onClick={onClose} title="Kapat">
          ×
        </button>
      </div>

      <div style={styles.searchRow}>
        <div style={styles.inputContainer}>
          <input
            ref={inputRef}
            type="text"
            style={styles.input}
            placeholder="Ara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <span style={styles.matchCount}>
            {totalMatches > 0 && `${totalMatches} sonuç`}
          </span>
        </div>
        <button
          style={styles.toggleReplaceBtn}
          onClick={() => setShowReplace((p) => !p)}
          title="Değiştir"
        >
          {showReplace ? '▼' : '▶'}
        </button>
      </div>

      {showReplace && (
        <div style={styles.searchRow}>
          <input
            type="text"
            style={styles.input}
            placeholder="Değiştir..."
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
      )}

      <div style={styles.optionsRow}>
        <OptionButton
          label=".*"
          title="Düzenli İfade"
          active={options.regex}
          onClick={() => toggleOption('regex')}
        />
        <OptionButton
          label="Aa"
          title="Büyük/Küçük Harf Eşleştir"
          active={options.matchCase}
          onClick={() => toggleOption('matchCase')}
        />
        <OptionButton
          label="Ab"
          title="Tam Kelime"
          active={options.wholeWord}
          onClick={() => toggleOption('wholeWord')}
        />
        <input
          type="text"
          style={styles.dirInput}
          placeholder="Klasörde ara..."
          value={options.searchInDirectory}
          onChange={(e) =>
            setOptions((p) => ({ ...p, searchInDirectory: e.target.value }))
          }
        />
      </div>

      {showReplace && (
        <div style={styles.replaceActions}>
          <button
            style={styles.actionBtn}
            onClick={() => onReplace(query, replacement, options)}
          >
            Değiştir
          </button>
          <button
            style={styles.actionBtn}
            onClick={() => onReplaceAll(query, replacement, options)}
          >
            Tümünü Değiştir
          </button>
        </div>
      )}

      <div style={styles.results}>
        {results.map((result) => (
          <div key={result.filePath}>
            <div
              style={styles.fileHeader}
              onClick={() => toggleFile(result.filePath)}
            >
              <span style={styles.fileArrow}>
                {expandedFiles.has(result.filePath) ? '▼' : '▶'}
              </span>
              <span style={styles.resultFileName}>{result.fileName}</span>
              <span style={styles.resultCount}>{result.matches.length}</span>
            </div>
            {expandedFiles.has(result.filePath) &&
              result.matches.map((match, idx) => (
                <div
                  key={idx}
                  style={styles.matchLine}
                  onClick={() =>
                    onNavigateToFile(result.filePath, match.lineNumber)
                  }
                >
                  <span style={styles.lineNumber}>{match.lineNumber}</span>
                  <span style={styles.lineContent}>
                    {highlightMatch(
                      match.lineContent,
                      match.matchStart,
                      match.matchEnd
                    )}
                  </span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const OptionButton: React.FC<{
  label: string;
  title: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, title, active, onClick }) => (
  <button
    style={{
      ...styles.optionBtn,
      ...(active ? styles.optionBtnActive : {}),
    }}
    onClick={onClick}
    title={title}
  >
    {label}
  </button>
);

const styles: Record<string, React.CSSProperties> = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    background: '#1f2335',
    borderLeft: '1px solid #292e42',
    width: 360,
    height: '100%',
    fontSize: 13,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderBottom: '1px solid #292e42',
  },
  title: {
    color: '#c0caf5',
    fontWeight: 600,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#737aa2',
    fontSize: 18,
    cursor: 'pointer',
  },
  searchRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    gap: 4,
  },
  inputContainer: {
    flex: 1,
    position: 'relative',
  },
  input: {
    width: '100%',
    padding: '6px 10px',
    background: '#1a1b26',
    border: '1px solid #3b4261',
    borderRadius: 4,
    color: '#c0caf5',
    fontSize: 13,
    outline: 'none',
  },
  matchCount: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#737aa2',
    fontSize: 11,
  },
  toggleReplaceBtn: {
    background: 'none',
    border: 'none',
    color: '#737aa2',
    fontSize: 12,
    cursor: 'pointer',
    padding: '4px 6px',
  },
  optionsRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 12px',
    gap: 4,
  },
  optionBtn: {
    padding: '2px 8px',
    background: 'none',
    border: '1px solid #3b4261',
    borderRadius: 4,
    color: '#737aa2',
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: 600,
  },
  optionBtnActive: {
    background: '#7aa2f733',
    border: '1px solid #7aa2f7',
    color: '#7aa2f7',
  },
  dirInput: {
    flex: 1,
    padding: '2px 8px',
    background: '#1a1b26',
    border: '1px solid #3b4261',
    borderRadius: 4,
    color: '#c0caf5',
    fontSize: 12,
    outline: 'none',
  },
  replaceActions: {
    display: 'flex',
    gap: 8,
    padding: '4px 12px 8px',
  },
  actionBtn: {
    padding: '4px 12px',
    background: '#7aa2f733',
    border: '1px solid #7aa2f7',
    borderRadius: 4,
    color: '#7aa2f7',
    fontSize: 12,
    cursor: 'pointer',
  },
  results: {
    flex: 1,
    overflowY: 'auto',
    padding: '4px 0',
  },
  fileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 12px',
    cursor: 'pointer',
    color: '#737aa2',
  },
  fileArrow: {
    fontSize: 10,
    width: 12,
  },
  resultFileName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  resultCount: {
    fontSize: 11,
    color: '#565f89',
  },
  matchLine: {
    display: 'flex',
    alignItems: 'center',
    padding: '2px 12px 2px 30px',
    cursor: 'pointer',
    color: '#737aa2',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  lineNumber: {
    width: 36,
    textAlign: 'right',
    marginRight: 8,
    color: '#565f89',
  },
  lineContent: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  highlight: {
    background: '#e0af6833',
    color: '#e0af68',
    borderRadius: 2,
    padding: '0 1px',
  },
};

export default React.memo(SearchPanel);
