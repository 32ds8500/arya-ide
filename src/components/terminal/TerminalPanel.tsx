import React, { useState, useCallback } from 'react';
import AryaTerminal, { TerminalProps } from './Terminal';
import TerminalHeader from './TerminalHeader';

export interface TerminalInstance {
  id: string;
  name: string;
}

export interface TerminalPanelProps {
  theme?: 'arya-dark' | 'arya-light';
  fontSize?: number;
  socket?: WebSocket | null;
  onCommand?: (terminalId: string, command: string) => void;
}

let terminalCounter = 0;

function createTerminal(): TerminalInstance {
  terminalCounter++;
  return {
    id: `terminal-${terminalCounter}`,
    name: `Terminal ${terminalCounter}`,
  };
}

const TerminalPanel: React.FC<TerminalPanelProps> = ({
  theme = 'arya-dark',
  fontSize = 14,
  socket,
  onCommand,
}) => {
  const [terminals, setTerminals] = useState<TerminalInstance[]>(() => [
    createTerminal(),
  ]);
  const [activeId, setActiveId] = useState<string>(() => terminals[0].id);

  const addTerminal = useCallback(() => {
    const newTerm = createTerminal();
    setTerminals((prev) => [...prev, newTerm]);
    setActiveId(newTerm.id);
  }, []);

  const closeTerminal = useCallback(
    (id: string) => {
      setTerminals((prev) => {
        const next = prev.filter((t) => t.id !== id);
        if (next.length === 0) {
          const newTerm = createTerminal();
          next.push(newTerm);
          setActiveId(newTerm.id);
        } else if (activeId === id) {
          setActiveId(next[next.length - 1].id);
        }
        return next;
      });
    },
    [activeId]
  );

  const renameTerminal = useCallback((id: string, name: string) => {
    setTerminals((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name } : t))
    );
  }, []);

  const clearTerminal = useCallback((id: string) => {
    // Clear handled by terminal ref
  }, []);

  return (
    <div style={styles.panel}>
      <TerminalHeader
        terminals={terminals}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={addTerminal}
        onClose={closeTerminal}
        onClear={clearTerminal}
        onRename={renameTerminal}
      />
      <div style={styles.terminalContainer}>
        {terminals.map((term) => (
          <div
            key={term.id}
            style={{
              ...styles.terminalWrapper,
              display: term.id === activeId ? 'block' : 'none',
            }}
          >
            <AryaTerminal
              id={term.id}
              theme={theme}
              fontSize={fontSize}
              socket={socket}
              name={term.name}
              onCommand={(cmd) => onCommand?.(term.id, cmd)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#1a1b26',
  },
  terminalContainer: {
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
};

export default React.memo(TerminalPanel);
