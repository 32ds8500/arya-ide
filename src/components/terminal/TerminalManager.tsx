'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useTerminalStore } from '@/store/terminal-store';
import type { TerminalShell, TerminalTheme } from '@/types';

export interface TerminalManagerProps {
  projectId: string;
  onCommand?: (command: string) => void;
  initialHeight?: number;
  showHeader?: boolean;
}

interface CommandHistoryItem {
  command: string;
  timestamp: string;
  exitCode?: number;
}

const SHELL_OPTIONS: { value: TerminalShell; label: string; icon: string }[] = [
  { value: 'bash', label: 'Bash', icon: '🐚' },
  { value: 'zsh', label: 'Zsh', icon: '🐚' },
  { value: 'powershell', label: 'PowerShell', icon: '💻' },
  { value: 'cmd', label: 'CMD', icon: '🖥️' },
  { value: 'fish', label: 'Fish', icon: '🐟' },
  { value: 'sh', label: 'SH', icon: '📜' },
];

const THEME_PRESETS = [
  { name: 'Tokyo Night', theme: { background: '#1a1b26', foreground: '#c0caf5', cursor: '#c0caf5', cursorAccent: '#1a1b26', selectionBackground: '#283457', black: '#15161e', red: '#f7768e', green: '#9ece6a', yellow: '#e0af68', blue: '#7aa2f7', magenta: '#bb9af7', cyan: '#7dcfff', white: '#a9b1d6', brightBlack: '#414868', brightRed: '#f7768e', brightGreen: '#9ece6a', brightYellow: '#e0af68', brightBlue: '#7aa2f7', brightMagenta: '#bb9af7', brightCyan: '#7dcfff', brightWhite: '#c0caf5' } },
  { name: 'Dracula', theme: { background: '#282a36', foreground: '#f8f8f2', cursor: '#f8f8f2', cursorAccent: '#282a36', selectionBackground: '#44475a', black: '#21222c', red: '#ff5555', green: '#50fa7b', yellow: '#f1fa8c', blue: '#bd93f9', magenta: '#ff79c6', cyan: '#8be9fd', white: '#f8f8f2', brightBlack: '#6272a4', brightRed: '#ff6e6e', brightGreen: '#69ff94', brightYellow: '#ffffa5', brightBlue: '#d6acff', brightMagenta: '#ff92df', brightCyan: '#a4ffff', brightWhite: '#ffffff' } },
  { name: 'Catppuccin', theme: { background: '#1e1e2e', foreground: '#cdd6f4', cursor: '#f5e0dc', cursorAccent: '#1e1e2e', selectionBackground: '#45475a', black: '#45475a', red: '#f38ba8', green: '#a6e3a1', yellow: '#f9e2af', blue: '#89b4fa', magenta: '#f5c2e7', cyan: '#94e2d5', white: '#bac2de', brightBlack: '#585b70', brightRed: '#f38ba8', brightGreen: '#a6e3a1', brightYellow: '#f9e2af', brightBlue: '#89b4fa', brightMagenta: '#f5c2e7', brightCyan: '#94e2d5', brightWhite: '#a6adc8' } },
];

const TerminalManager: React.FC<TerminalManagerProps> = ({
  projectId,
  onCommand,
  initialHeight = 300,
  showHeader = true,
}) => {
  const {
    terminals,
    activeTerminalId,
    outputs,
    config,
    createTerminal,
    closeTerminal,
    setActiveTerminal,
    executeCommand,
    clearOutput,
    splitTerminal,
    renameTerminal,
    updateConfig,
  } = useTerminalStore();

  const [showSettings, setShowSettings] = useState(false);
  const [showNewTerminalMenu, setShowNewTerminalMenu] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [commandHistory, setCommandHistory] = useState<CommandHistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [height] = useState(initialHeight);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const terminalRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (terminals.length === 0) {
      createTerminal(projectId, 'bash');
    }
  }, [terminals.length, projectId, createTerminal]);

  const activeTerminal = useMemo(
    () => terminals.find((t) => t.id === activeTerminalId) || null,
    [terminals, activeTerminalId]
  );

  const activeOutput = useMemo(
    () => (activeTerminalId ? outputs[activeTerminalId] || [] : []),
    [outputs, activeTerminalId]
  );

  const handleNewTerminal = useCallback(
    (shell?: TerminalShell) => {
      createTerminal(projectId, shell || 'bash');
      setShowNewTerminalMenu(false);
    },
    [projectId, createTerminal]
  );

  const handleCloseTerminal = useCallback(
    (id: string) => {
      closeTerminal(id);
    },
    [closeTerminal]
  );

  const handleRename = useCallback(
    (id: string, name: string) => {
      renameTerminal(id, name);
      setRenamingId(null);
    },
    [renameTerminal]
  );

  const handleClear = useCallback(
    (id?: string) => {
      const targetId = id || activeTerminalId;
      if (targetId) clearOutput(targetId);
    },
    [activeTerminalId, clearOutput]
  );

  const handleSplit = useCallback(
    (id?: string) => {
      const targetId = id || activeTerminalId;
      if (targetId) splitTerminal(targetId);
    },
    [activeTerminalId, splitTerminal]
  );

  const handleExecuteCommand = useCallback(
    async (command: string) => {
      if (!activeTerminalId) return;

      const trimmedCommand = command.trim();
      if (!trimmedCommand) return;

      setCommandHistory((prev) => [
        ...prev,
        { command: trimmedCommand, timestamp: new Date().toISOString() },
      ]);
      setHistoryIndex(-1);

      onCommand?.(trimmedCommand);

      try {
        await executeCommand(activeTerminalId, trimmedCommand);
      } catch (error) {
        console.error('Command execution error:', error);
      }
    },
    [activeTerminalId, executeCommand, onCommand]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        const value = (e.target as HTMLInputElement).value;
        if (value.trim()) {
          handleExecuteCommand(value);
          (e.target as HTMLInputElement).value = '';
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (commandHistory.length > 0) {
          const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
          setHistoryIndex(newIndex);
          const cmd = commandHistory[commandHistory.length - 1 - newIndex];
          if (cmd && inputRef.current) {
            inputRef.current.value = cmd.command;
          }
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          const cmd = commandHistory[commandHistory.length - 1 - newIndex];
          if (cmd && inputRef.current) {
            inputRef.current.value = cmd.command;
          }
        } else {
          setHistoryIndex(-1);
          if (inputRef.current) {
            inputRef.current.value = '';
          }
        }
      } else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        handleClear();
      } else if (e.key === 'c' && e.ctrlKey) {
        if (inputRef.current?.value) {
          inputRef.current.value = '';
        }
      }
    },
    [commandHistory, historyIndex, handleExecuteCommand, handleClear]
  );

  const startRename = useCallback((id: string, currentName: string) => {
    setRenamingId(id);
    setRenameValue(currentName);
  }, []);

  const confirmRename = useCallback(() => {
    if (renamingId && renameValue.trim()) {
      handleRename(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  }, [renamingId, renameValue, handleRename]);

  const handleThemeChange = useCallback(
    (themeName: string) => {
      const preset = THEME_PRESETS.find((t) => t.name === themeName);
      if (preset) {
        updateConfig({ theme: preset.theme as TerminalTheme });
      }
    },
    [updateConfig]
  );

  if (isCollapsed) {
    return (
      <div style={styles.collapsedBar}>
        <button
          style={styles.expandBtn}
          onClick={() => setIsCollapsed(false)}
          title="Terminali Genişlet"
        >
          ▲ Terminal
        </button>
        <span style={styles.collapsedInfo}>
          {terminals.length} terminal açık
        </span>
      </div>
    );
  }

  return (
    <div style={{ ...styles.container, height }}>
      {showHeader && (
        <div style={styles.header}>
          <div style={styles.tabs}>
            {terminals.map((term) => (
              <div
                key={term.id}
                style={{
                  ...styles.tab,
                  ...(term.id === activeTerminalId ? styles.activeTab : {}),
                  borderLeft: `3px solid ${term.color || '#7aa2f7'}`,
                }}
                onClick={() => setActiveTerminal(term.id)}
              >
                {renamingId === term.id ? (
                  <input
                    type="text"
                    style={styles.renameInput}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={confirmRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmRename();
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <>
                    <span
                      style={styles.tabName}
                      onDoubleClick={() => startRename(term.id, term.name)}
                    >
                      {term.name}
                    </span>
                    <span style={styles.shellBadge}>
                      {SHELL_OPTIONS.find((s) => s.value === term.shell)?.icon || '🐚'}
                    </span>
                  </>
                )}
                <button
                  style={styles.closeTabBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseTerminal(term.id);
                  }}
                  title="Terminali Kapat"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div style={styles.actions}>
            <div style={{ position: 'relative' }}>
              <button
                style={styles.actionBtn}
                onClick={() => setShowNewTerminalMenu((p) => !p)}
                title="Yeni Terminal"
              >
                +
              </button>
              {showNewTerminalMenu && (
                <div style={styles.dropdown}>
                  {SHELL_OPTIONS.map((shell) => (
                    <button
                      key={shell.value}
                      style={styles.dropdownItem}
                      onClick={() => handleNewTerminal(shell.value)}
                    >
                      <span>{shell.icon}</span>
                      <span>{shell.label}</span>
                    </button>
                  ))}
                  <div style={styles.dropdownDivider} />
                  <button
                    style={styles.dropdownItem}
                    onClick={() => {
                      handleSplit();
                      setShowNewTerminalMenu(false);
                    }}
                  >
                    <span>↔️</span>
                    <span>Split</span>
                  </button>
                </div>
              )}
            </div>

            <button
              style={styles.actionBtn}
              onClick={() => handleClear()}
              title="Temizle (Ctrl+L)"
            >
              🧹
            </button>

            <button
              style={styles.actionBtn}
              onClick={() => setShowSettings((p) => !p)}
              title="Ayarlar"
            >
              ⚙️
            </button>

            <button
              style={styles.actionBtn}
              onClick={() => setIsCollapsed(true)}
              title="Küçült"
            >
              ▼
            </button>
          </div>
        </div>
      )}

      {showSettings && (
        <div style={styles.settingsPanel}>
          <div style={styles.settingsGroup}>
            <label style={styles.settingsLabel}>Tema</label>
            <select
              style={styles.settingsSelect}
              onChange={(e) => handleThemeChange(e.target.value)}
            >
              {THEME_PRESETS.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.settingsGroup}>
            <label style={styles.settingsLabel}>Yazı Boyutu</label>
            <input
              type="range"
              min="10"
              max="20"
              value={config.fontSize}
              onChange={(e) => updateConfig({ fontSize: parseInt(e.target.value) })}
              style={styles.settingsRange}
            />
            <span style={styles.settingsValue}>{config.fontSize}px</span>
          </div>

          <div style={styles.settingsGroup}>
            <label style={styles.settingsLabel}>Cursor</label>
            <select
              style={styles.settingsSelect}
              value={config.cursorStyle}
              onChange={(e) =>
                updateConfig({ cursorStyle: e.target.value as 'block' | 'underline' | 'bar' })
              }
            >
              <option value="block">Block</option>
              <option value="underline">Underline</option>
              <option value="bar">Bar</option>
            </select>
          </div>

          <div style={styles.settingsGroup}>
            <label style={styles.settingsLabel}>Cursor Yanıp Sönme</label>
            <input
              type="checkbox"
              checked={config.cursorBlink}
              onChange={(e) => updateConfig({ cursorBlink: e.target.checked })}
            />
          </div>

          <div style={styles.settingsGroup}>
            <label style={styles.settingsLabel}>Scrollback</label>
            <input
              type="number"
              min="1000"
              max="50000"
              value={config.scrollback}
              onChange={(e) => updateConfig({ scrollback: parseInt(e.target.value) })}
              style={styles.settingsInput}
            />
          </div>
        </div>
      )}

      <div style={styles.terminalArea}>
        {terminals.map((term) => (
          <div
            key={term.id}
            style={{
              ...styles.terminalWrapper,
              display: term.id === activeTerminalId ? 'block' : 'none',
            }}
            ref={(el) => {
              if (el) terminalRefs.current.set(term.id, el);
            }}
          >
            <div style={styles.terminalContent}>
              {activeOutput.length > 0 && (
                <div style={styles.outputLog}>
                  {activeOutput.map((output, i) => (
                    <div
                      key={i}
                      style={{
                        ...styles.outputLine,
                        color: output.type === 'stderr' ? '#f7768e' : output.type === 'system' ? '#7aa2f7' : '#c0caf5',
                      }}
                    >
                      {output.content}
                    </div>
                  ))}
                </div>
              )}

              <div style={styles.inputLine}>
                <span style={styles.prompt}>
                  <span style={styles.promptUser}>arya</span>
                  <span style={styles.promptAt}>@</span>
                  <span style={styles.promptHost}>terminal</span>
                  <span style={styles.promptColon}>:</span>
                  <span style={styles.promptPath}>~</span>
                  <span style={styles.promptSymbol}>$</span>
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  style={styles.commandInput}
                  placeholder="Komut yazın..."
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
              </div>
            </div>
          </div>
        ))}

        {terminals.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💻</div>
            <div style={styles.emptyText}>Terminal açın</div>
            <div style={styles.emptyHint}>
              + butonuna tıklayarak yeni bir terminal açın
            </div>
          </div>
        )}
      </div>

      <div style={styles.resizeHandle} onMouseDown={() => {}}>
        <div style={styles.resizeBar} />
      </div>

      <div style={styles.statusBar}>
        <span style={styles.statusText}>
          {activeTerminal?.shell || 'bash'} • {terminals.length} terminal
        </span>
        {activeTerminal && (
          <span style={styles.statusText}>
            {activeTerminal.status === 'running' ? '●' : '○'} {activeTerminal.name}
          </span>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    background: '#1a1b26',
    borderTop: '1px solid #292e42',
    position: 'relative',
  },
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
    flex: 1,
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '0 10px',
    height: 28,
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 12,
    color: '#737aa2',
    whiteSpace: 'nowrap',
    transition: 'background 0.15s',
    maxWidth: 150,
  },
  activeTab: {
    background: '#292e42',
    color: '#c0caf5',
  },
  tabName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  shellBadge: {
    fontSize: 10,
    opacity: 0.7,
  },
  closeTabBtn: {
    background: 'none',
    border: 'none',
    color: 'inherit',
    fontSize: 14,
    cursor: 'pointer',
    padding: '0 2px',
    opacity: 0.6,
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
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    background: '#1f2335',
    border: '1px solid #3b4261',
    borderRadius: 6,
    padding: '4px 0',
    zIndex: 1000,
    minWidth: 160,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '6px 12px',
    background: 'none',
    border: 'none',
    color: '#c0caf5',
    fontSize: 12,
    cursor: 'pointer',
    textAlign: 'left',
  },
  dropdownDivider: {
    height: 1,
    background: '#3b4261',
    margin: '4px 0',
  },
  settingsPanel: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '8px 12px',
    background: '#1f2335',
    borderBottom: '1px solid #292e42',
    flexWrap: 'wrap',
  },
  settingsGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  settingsLabel: {
    fontSize: 11,
    color: '#737aa2',
  },
  settingsSelect: {
    background: '#1a1b26',
    border: '1px solid #3b4261',
    borderRadius: 4,
    color: '#c0caf5',
    fontSize: 11,
    padding: '2px 6px',
    outline: 'none',
  },
  settingsRange: {
    width: 80,
    height: 4,
  },
  settingsValue: {
    fontSize: 11,
    color: '#737aa2',
    minWidth: 30,
  },
  settingsInput: {
    width: 60,
    background: '#1a1b26',
    border: '1px solid #3b4261',
    borderRadius: 4,
    color: '#c0caf5',
    fontSize: 11,
    padding: '2px 6px',
    outline: 'none',
  },
  terminalArea: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  terminalWrapper: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  terminalContent: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    fontFamily: 'Cascadia Code, Fira Code, Consolas, monospace',
    fontSize: 13,
    overflow: 'auto',
  },
  outputLog: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 12px',
  },
  outputLine: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    lineHeight: 1.4,
  },
  inputLine: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 12px 8px',
    gap: 8,
  },
  prompt: {
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    fontSize: 13,
    whiteSpace: 'nowrap',
    userSelect: 'none',
  },
  promptUser: {
    color: '#9ece6a',
    fontWeight: 600,
  },
  promptAt: {
    color: '#737aa2',
  },
  promptHost: {
    color: '#7aa2f7',
    fontWeight: 600,
  },
  promptColon: {
    color: '#737aa2',
  },
  promptPath: {
    color: '#e0af68',
    fontWeight: 600,
  },
  promptSymbol: {
    color: '#c0caf5',
    marginLeft: 4,
  },
  commandInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#c0caf5',
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#565f89',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: 500,
    color: '#c0caf5',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 12,
    color: '#565f89',
  },
  resizeHandle: {
    height: 6,
    background: '#1f2335',
    cursor: 'ns-resize',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resizeBar: {
    width: 40,
    height: 2,
    background: '#3b4261',
    borderRadius: 1,
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '2px 12px',
    background: '#1f2335',
    borderTop: '1px solid #292e42',
    fontSize: 11,
    color: '#565f89',
  },
  statusText: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  collapsedBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 32,
    background: '#1f2335',
    borderTop: '1px solid #292e42',
    padding: '0 12px',
  },
  expandBtn: {
    background: 'none',
    border: 'none',
    color: '#737aa2',
    fontSize: 12,
    cursor: 'pointer',
  },
  collapsedInfo: {
    fontSize: 11,
    color: '#565f89',
  },
};

export default React.memo(TerminalManager);
