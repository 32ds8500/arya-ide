import { create } from 'zustand';
import type { TerminalSession, TerminalShell, TerminalOutput, TerminalConfig } from '../types';

interface TerminalStore {
  terminals: TerminalSession[];
  activeTerminalId: string | null;
  outputs: Record<string, TerminalOutput[]>;
  config: TerminalConfig;

  createTerminal: (projectId: string, shell?: TerminalShell, name?: string) => TerminalSession;
  closeTerminal: (terminalId: string) => void;
  closeAllTerminals: () => void;
  setActiveTerminal: (terminalId: string) => void;
  updateTerminal: (terminalId: string, updates: Partial<TerminalSession>) => void;
  executeCommand: (terminalId: string, command: string) => Promise<void>;
  appendOutput: (terminalId: string, output: TerminalOutput) => void;
  clearOutput: (terminalId: string) => void;
  clearAllOutputs: () => void;
  splitTerminal: (terminalId: string) => TerminalSession;
  renameTerminal: (terminalId: string, name: string) => void;
  setTerminalColor: (terminalId: string, color: string) => void;
  updateConfig: (config: Partial<TerminalConfig>) => void;
}

export const useTerminalStore = create<TerminalStore>()((set, get) => ({
  terminals: [],
  activeTerminalId: null,
  outputs: {},
  config: {
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Fira Code, monospace',
    theme: {
      background: '#1e1e2e',
      foreground: '#cdd6f4',
      cursor: '#f5e0dc',
      cursorAccent: '#1e1e2e',
      selectionBackground: '#45475a',
      black: '#1e1e2e',
      red: '#f38ba8',
      green: '#a6e3a1',
      yellow: '#f9e2af',
      blue: '#89b4fa',
      magenta: '#f5c2e7',
      cyan: '#94e2d5',
      white: '#bac2de',
      brightBlack: '#585b70',
      brightRed: '#f38ba8',
      brightGreen: '#a6e3a1',
      brightYellow: '#f9e2af',
      brightBlue: '#89b4fa',
      brightMagenta: '#f5c2e7',
      brightCyan: '#94e2d5',
      brightWhite: '#a6adc8',
    },
    cursorStyle: 'block',
    cursorBlink: true,
    scrollback: 10000,
    lineHeight: 1.2,
    allowProposedApi: true,
  },

  createTerminal: (projectId, shell = 'bash', name) => {
    const terminal: TerminalSession = {
      id: `term-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name || `Terminal ${get().terminals.length + 1}`,
      projectId,
      shell,
      status: 'running',
      cwd: '~',
      env: {},
      title: name || `Terminal ${get().terminals.length + 1}`,
      color: '#89b4fa',
      isSplit: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };

    set((state) => ({
      terminals: [...state.terminals, terminal],
      activeTerminalId: terminal.id,
      outputs: { ...state.outputs, [terminal.id]: [] },
    }));

    return terminal;
  },

  closeTerminal: (terminalId) => {
    set((state) => {
      const newTerminals = state.terminals.filter((t) => t.id !== terminalId);
      const newOutputs = { ...state.outputs };
      delete newOutputs[terminalId];

      let newActiveId = state.activeTerminalId;
      if (state.activeTerminalId === terminalId) {
        newActiveId = newTerminals.length > 0 ? newTerminals[newTerminals.length - 1].id : null;
      }

      return {
        terminals: newTerminals,
        activeTerminalId: newActiveId,
        outputs: newOutputs,
      };
    });
  },

  closeAllTerminals: () => {
    set({ terminals: [], activeTerminalId: null, outputs: {} });
  },

  setActiveTerminal: (terminalId) => {
    set({ activeTerminalId: terminalId });
  },

  updateTerminal: (terminalId, updates) => {
    set((state) => ({
      terminals: state.terminals.map((t) =>
        t.id === terminalId ? { ...t, ...updates } : t
      ),
    }));
  },

  executeCommand: async (terminalId, command) => {
    const outputId = `out-${Date.now()}`;

    get().appendOutput(terminalId, {
      sessionId: terminalId,
      content: `$ ${command}\n`,
      type: 'system',
      timestamp: new Date().toISOString(),
    });

    set((state) => ({
      terminals: state.terminals.map((t) =>
        t.id === terminalId
          ? { ...t, lastActivityAt: new Date().toISOString() }
          : t
      ),
    }));

    try {
      const response = await fetch('/api/terminal/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: terminalId, command }),
      });

      if (!response.ok) throw new Error('Command execution failed');

      const result = await response.json();

      if (result.stdout) {
        get().appendOutput(terminalId, {
          sessionId: terminalId,
          commandId: outputId,
          content: result.stdout,
          type: 'stdout',
          timestamp: new Date().toISOString(),
        });
      }

      if (result.stderr) {
        get().appendOutput(terminalId, {
          sessionId: terminalId,
          commandId: outputId,
          content: result.stderr,
          type: 'stderr',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      get().appendOutput(terminalId, {
        sessionId: terminalId,
        commandId: outputId,
        content: error instanceof Error ? error.message : 'Command failed',
        type: 'stderr',
        timestamp: new Date().toISOString(),
      });
    }
  },

  appendOutput: (terminalId, output) => {
    set((state) => ({
      outputs: {
        ...state.outputs,
        [terminalId]: [...(state.outputs[terminalId] || []), output],
      },
    }));
  },

  clearOutput: (terminalId) => {
    set((state) => ({
      outputs: { ...state.outputs, [terminalId]: [] },
    }));
  },

  clearAllOutputs: () => {
    set((state) => {
      const outputs: Record<string, TerminalOutput[]> = {};
      Object.keys(state.outputs).forEach((key) => {
        outputs[key] = [];
      });
      return { outputs };
    });
  },

  splitTerminal: (terminalId) => {
    const sourceTerminal = get().terminals.find((t) => t.id === terminalId);
    if (!sourceTerminal) {
      throw new Error('Terminal not found');
    }

    const newTerminal: TerminalSession = {
      ...sourceTerminal,
      id: `term-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${sourceTerminal.name} (Split)`,
      isSplit: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };

    set((state) => ({
      terminals: [...state.terminals, newTerminal],
      activeTerminalId: newTerminal.id,
      outputs: { ...state.outputs, [newTerminal.id]: [] },
    }));

    return newTerminal;
  },

  renameTerminal: (terminalId, name) => {
    get().updateTerminal(terminalId, { name, title: name });
  },

  setTerminalColor: (terminalId, color) => {
    get().updateTerminal(terminalId, { color });
  },

  updateConfig: (configUpdates) => {
    set((state) => ({
      config: { ...state.config, ...configUpdates },
    }));
  },
}));
