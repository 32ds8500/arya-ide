import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface EditorToolbarProps {
  fileName: string;
  language?: string;
  isModified?: boolean;
  onSave?: () => void;
  onFormat?: () => void;
  onSearchToggle?: () => void;
  onSplitViewToggle?: () => void;
  onDiffViewToggle?: () => void;
  isSplitView?: boolean;
  isDiffView?: boolean;
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
  c: 'C',
  cpp: 'C++',
  csharp: 'C#',
  php: 'PHP',
  shell: 'Shell',
  plaintext: 'Düz Metin',
};

const LANGUAGE_COLORS: Record<string, string> = {
  typescript: '#3178c6',
  javascript: '#f7df1e',
  python: '#3776ab',
  html: '#e34c26',
  css: '#1572b6',
  json: '#292929',
  markdown: '#083fa1',
  go: '#00add8',
  rust: '#dea584',
  java: '#ed8b00',
};

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  fileName,
  language,
  isModified,
  onSave,
  onFormat,
  onSearchToggle,
  onSplitViewToggle,
  onDiffViewToggle,
  isSplitView = false,
  isDiffView = false,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const langLabel = language ? LANGUAGE_LABELS[language] || language : 'Bilinmiyor';
  const langColor = language ? LANGUAGE_COLORS[language] || '#737aa2' : '#737aa2';

  return (
    <div style={styles.toolbar}>
      <div style={styles.left}>
        <span style={styles.fileName}>
          {fileName}
          {isModified && <span style={styles.modified}> (değişiklik var)</span>}
        </span>
        <span
          style={{
            ...styles.langBadge,
            background: `${langColor}22`,
            color: langColor,
            border: `1px solid ${langColor}44`,
          }}
        >
          {langLabel}
        </span>
      </div>
      <div style={styles.right}>
        <ToolbarButton
          icon="💾"
          title="Kaydet (Ctrl+S)"
          onClick={onSave}
        />
        <ToolbarButton
          icon="🔧"
          title="Biçimlendir (Shift+Alt+F)"
          onClick={onFormat}
        />
        <ToolbarButton
          icon="🔍"
          title="Ara ve Değiştir"
          onClick={onSearchToggle}
        />
        <div style={styles.separator} />
        <ToolbarButton
          icon="⬜"
          title="Bölünmüş Görünüm"
          active={isSplitView}
          onClick={onSplitViewToggle}
        />
        <ToolbarButton
          icon=" <=>"
          title="Fark Görünümü"
          active={isDiffView}
          onClick={onDiffViewToggle}
        />
        <div style={styles.separator} />
        <div ref={settingsRef} style={{ position: 'relative' }}>
          <ToolbarButton
            icon="⚙"
            title="Ayarlar"
            onClick={() => setSettingsOpen((p) => !p)}
          />
          {settingsOpen && (
            <div style={styles.dropdown}>
              <DropdownItem label="Yazı Tipi Boyutu: 14px" />
              <DropdownItem label="Sözcük Kaydırma: Kapalı" />
              <DropdownItem label="Mini Harita: Açık" />
              <DropdownItem label="Beyaz Alan: Seçimde Göster" />
              <div style={styles.dropdownDivider} />
              <DropdownItem label="Klavye Kısayolları" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ToolbarButton: React.FC<{
  icon: string;
  title: string;
  onClick?: () => void;
  active?: boolean;
}> = ({ icon, title, onClick, active }) => (
  <button
    style={{
      ...styles.toolbarButton,
      ...(active ? styles.toolbarButtonActive : {}),
    }}
    onClick={onClick}
    title={title}
  >
    {icon}
  </button>
);

const DropdownItem: React.FC<{ label: string }> = ({ label }) => (
  <button style={styles.dropdownItem}>{label}</button>
);

const styles: Record<string, React.CSSProperties> = {
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    height: 36,
    background: '#24283b',
    borderBottom: '1px solid #292e42',
    fontSize: 13,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
  },
  fileName: {
    color: '#c0caf5',
    fontWeight: 500,
  },
  modified: {
    color: '#e0af68',
    fontSize: 12,
  },
  langBadge: {
    fontSize: 11,
    padding: '1px 6px',
    borderRadius: 4,
    fontWeight: 500,
  },
  toolbarButton: {
    background: 'none',
    border: 'none',
    color: '#737aa2',
    fontSize: 14,
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: 4,
    lineHeight: 1,
  },
  toolbarButtonActive: {
    background: '#292e42',
    color: '#7aa2f7',
  },
  separator: {
    width: 1,
    height: 16,
    background: '#3b4261',
    margin: '0 4px',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    background: '#1f2335',
    border: '1px solid #3b4261',
    borderRadius: 6,
    padding: '4px 0',
    zIndex: 1000,
    minWidth: 220,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
  dropdownItem: {
    display: 'block',
    width: '100%',
    padding: '6px 16px',
    border: 'none',
    background: 'none',
    color: '#c0caf5',
    fontSize: 13,
    textAlign: 'left',
    cursor: 'pointer',
  },
  dropdownDivider: {
    height: 1,
    background: '#3b4261',
    margin: '4px 0',
  },
};

export default React.memo(EditorToolbar);
