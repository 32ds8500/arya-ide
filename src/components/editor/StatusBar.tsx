import React, { useState, useCallback } from 'react';

export interface StatusBarProps {
  line?: number;
  column?: number;
  language?: string;
  encoding?: string;
  lineEnding?: string;
  gitBranch?: string;
  errors?: number;
  warnings?: number;
  onClickLanguage?: () => void;
  onClickEncoding?: () => void;
  onClickLineEnding?: () => void;
  onClickGit?: () => void;
  onClickErrors?: () => void;
}

const LANGUAGE_LABELS: Record<string, string> = {
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  python: 'Python',
  html: 'HTML',
  css: 'CSS',
  json: 'JSON',
  markdown: 'Markdown',
  yaml: 'YAML',
  go: 'Go',
  rust: 'Rust',
  java: 'Java',
  plaintext: 'Düz Metin',
};

const StatusBar: React.FC<StatusBarProps> = ({
  line = 1,
  column = 1,
  language = 'plaintext',
  encoding = 'UTF-8',
  lineEnding = 'LF',
  gitBranch,
  errors = 0,
  warnings = 0,
  onClickLanguage,
  onClickEncoding,
  onClickLineEnding,
  onClickGit,
  onClickErrors,
}) => {
  return (
    <div style={styles.statusBar}>
      <div style={styles.left}>
        {gitBranch && (
          <StatusItem
            icon="⑂"
            label={gitBranch}
            onClick={onClickGit}
            title="Git Dalı"
          />
        )}
        {(errors > 0 || warnings > 0) && (
          <StatusItem
            icon="⚠"
            label={`${errors} hata, ${warnings} uyarı`}
            onClick={onClickErrors}
            color={errors > 0 ? '#f7768e' : '#e0af68'}
            title="Hatalar ve Uyarılar"
          />
        )}
      </div>
      <div style={styles.right}>
        <StatusItem
          label={`Satır ${line}, Sütun ${column}`}
          title="Satır ve Sütun"
        />
        <StatusItem
          label={LANGUAGE_LABELS[language] || language}
          onClick={onClickLanguage}
          title="Dil Seçimi"
        />
        <StatusItem
          label={encoding}
          onClick={onClickEncoding}
          title="Kodlama"
        />
        <StatusItem
          label={lineEnding}
          onClick={onClickLineEnding}
          title="Satır Sonu"
        />
        <StatusItem
          icon="✓"
          label="Arya IDE"
          title="Arya IDE"
        />
      </div>
    </div>
  );
};

const StatusItem: React.FC<{
  icon?: string;
  label: string;
  onClick?: () => void;
  color?: string;
  title?: string;
}> = ({ icon, label, onClick, color, title }) => (
  <button
    style={{
      ...styles.statusItem,
      ...(color ? { color } : {}),
    }}
    onClick={onClick}
    title={title}
  >
    {icon && <span style={styles.statusIcon}>{icon}</span>}
    <span>{label}</span>
  </button>
);

const styles: Record<string, React.CSSProperties> = {
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 24,
    background: '#7aa2f7',
    color: '#1a1b26',
    fontSize: 12,
    padding: '0 8px',
    userSelect: 'none',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'none',
    border: 'none',
    color: 'inherit',
    fontSize: 12,
    cursor: 'pointer',
    padding: '0 6px',
    height: 24,
    lineHeight: 1,
  },
  statusIcon: {
    fontSize: 12,
  },
};

export default React.memo(StatusBar);
