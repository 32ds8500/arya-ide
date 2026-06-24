import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface TerminalHeaderProps {
  terminals: Array<{ id: string; name: string }>;
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onClose: (id: string) => void;
  onClear: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

const TerminalHeader: React.FC<TerminalHeaderProps> = ({
  terminals,
  activeId,
  onSelect,
  onNew,
  onClose,
  onClear,
  onRename,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const startRename = useCallback((id: string, currentName: string) => {
    setRenamingId(id);
    setRenameValue(currentName);
    setDropdownOpen(false);
  }, []);

  const confirmRename = useCallback(() => {
    if (renamingId && renameValue.trim()) {
      onRename(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  }, [renamingId, renameValue, onRename]);

  return (
    <div style={styles.header}>
      <div style={styles.tabs}>
        {terminals.map((term) => (
          <div
            key={term.id}
            style={{
              ...styles.tab,
              ...(term.id === activeId ? styles.activeTab : {}),
            }}
            onClick={() => onSelect(term.id)}
          >
            {renamingId === term.id ? (
              <input
                ref={renameInputRef}
                type="text"
                style={styles.renameInput}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={confirmRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmRename();
                  if (e.key === 'Escape') setRenamingId(null);
                }}
              />
            ) : (
              <span
                onDoubleClick={() => startRename(term.id, term.name)}
              >
                {term.name}
              </span>
            )}
            <button
              style={styles.closeBtn}
              onClick={(e) => {
                e.stopPropagation();
                onClose(term.id);
              }}
              title="Terminali Kapat"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div style={styles.actions}>
        <button
          style={styles.actionBtn}
          onClick={onNew}
          title="Yeni Terminal"
        >
          +
        </button>
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            style={styles.actionBtn}
            onClick={() => setDropdownOpen((p) => !p)}
            title="Terminal Menüsü"
          >
            ▾
          </button>
          {dropdownOpen && (
            <div style={styles.dropdown}>
              {terminals.map((term) => (
                <div key={term.id} style={styles.dropdownItem}>
                  <button
                    style={styles.dropdownBtn}
                    onClick={() => {
                      onSelect(term.id);
                      setDropdownOpen(false);
                    }}
                  >
                    {term.name}
                  </button>
                  <button
                    style={styles.dropdownAction}
                    onClick={() => {
                      onClear(term.id);
                      setDropdownOpen(false);
                    }}
                    title="Temizle"
                  >
                    🧹
                  </button>
                  <button
                    style={styles.dropdownAction}
                    onClick={() => startRename(term.id, term.name)}
                    title="Yeniden Adlandır"
                  >
                    ✏️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 36,
    background: '#1f2335',
    borderBottom: '1px solid #292e42',
    padding: '0 4px',
  },
  tabs: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    overflow: 'hidden',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '0 10px',
    height: 28,
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 12,
    color: '#737aa2',
    whiteSpace: 'nowrap',
    transition: 'background 0.15s',
  },
  activeTab: {
    background: '#292e42',
    color: '#c0caf5',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'inherit',
    fontSize: 14,
    cursor: 'pointer',
    padding: '0 2px',
    opacity: 0.6,
    lineHeight: 1,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    color: '#737aa2',
    fontSize: 14,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 4,
    lineHeight: 1,
  },
  renameInput: {
    background: '#1a1b26',
    border: '1px solid #7aa2f7',
    borderRadius: 3,
    color: '#c0caf5',
    fontSize: 12,
    padding: '1px 4px',
    outline: 'none',
    width: 100,
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
    minWidth: 200,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 8px',
  },
  dropdownBtn: {
    flex: 1,
    background: 'none',
    border: 'none',
    color: '#c0caf5',
    fontSize: 12,
    textAlign: 'left',
    cursor: 'pointer',
    padding: '4px 8px',
  },
  dropdownAction: {
    background: 'none',
    border: 'none',
    color: '#737aa2',
    fontSize: 12,
    cursor: 'pointer',
    padding: '4px',
  },
};

export default React.memo(TerminalHeader);
