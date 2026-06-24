'use client';

import { useCallback, useEffect } from 'react';
import { useTerminalStore } from '../store';
import type { TerminalShell, TerminalSession, TerminalOutput } from '../types';

interface UseTerminalOptions {
  projectId: string;
  shell?: TerminalShell;
  autoCreate?: boolean;
}

export function useTerminal({ projectId, shell = 'bash', autoCreate = true }: UseTerminalOptions) {
  const {
    terminals,
    activeTerminalId,
    outputs,
    config,
    createTerminal,
    closeTerminal,
    closeAllTerminals,
    setActiveTerminal,
    executeCommand,
    clearOutput,
    clearAllOutputs,
    splitTerminal,
    renameTerminal,
    setTerminalColor,
    updateConfig,
  } = useTerminalStore();

  const activeTerminal = terminals.find((t) => t.id === activeTerminalId) || null;
  const activeOutput = activeTerminalId ? outputs[activeTerminalId] || [] : [];

  useEffect(() => {
    if (autoCreate && terminals.length === 0 && projectId) {
      createTerminal(projectId, shell);
    }
  }, [autoCreate, terminals.length, projectId, shell, createTerminal]);

  const create = useCallback(
    (customShell?: TerminalShell, name?: string) => {
      return createTerminal(projectId, customShell || shell, name);
    },
    [projectId, shell, createTerminal]
  );

  const close = useCallback(
    (terminalId: string) => {
      closeTerminal(terminalId);
    },
    [closeTerminal]
  );

  const sendCommand = useCallback(
    async (command: string, terminalId?: string) => {
      const targetId = terminalId || activeTerminalId;
      if (!targetId) throw new Error('No active terminal');
      await executeCommand(targetId, command);
    },
    [activeTerminalId, executeCommand]
  );

  const getOutput = useCallback(
    (terminalId: string): TerminalOutput[] => {
      return outputs[terminalId] || [];
    },
    [outputs]
  );

  const clear = useCallback(
    (terminalId?: string) => {
      const targetId = terminalId || activeTerminalId;
      if (!targetId) return;
      clearOutput(targetId);
    },
    [activeTerminalId, clearOutput]
  );

  const split = useCallback(
    (terminalId?: string) => {
      const targetId = terminalId || activeTerminalId;
      if (!targetId) throw new Error('No terminal to split');
      return splitTerminal(targetId);
    },
    [activeTerminalId, splitTerminal]
  );

  const rename = useCallback(
    (name: string, terminalId?: string) => {
      const targetId = terminalId || activeTerminalId;
      if (!targetId) return;
      renameTerminal(targetId, name);
    },
    [activeTerminalId, renameTerminal]
  );

  const setColor = useCallback(
    (color: string, terminalId?: string) => {
      const targetId = terminalId || activeTerminalId;
      if (!targetId) return;
      setTerminalColor(targetId, color);
    },
    [activeTerminalId, setTerminalColor]
  );

  return {
    terminals,
    activeTerminal,
    activeTerminalId,
    activeOutput,
    outputs,
    config,
    create,
    close,
    closeAll: closeAllTerminals,
    setActive: setActiveTerminal,
    sendCommand,
    getOutput,
    clear,
    clearAll: clearAllOutputs,
    split,
    rename,
    setColor,
    updateConfig,
  };
}
