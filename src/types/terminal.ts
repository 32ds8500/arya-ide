import { BaseEntity } from './common';

export type TerminalShell = 'bash' | 'zsh' | 'powershell' | 'cmd' | 'fish' | 'sh';

export type TerminalStatus = 'running' | 'stopped' | 'error' | 'paused';

export interface TerminalSession extends BaseEntity {
  name: string;
  projectId: string;
  shell: TerminalShell;
  status: TerminalStatus;
  cwd: string;
  env: Record<string, string>;
  pid?: number;
  exitCode?: number;
  title: string;
  color: string;
  isSplit: boolean;
  createdAt: string;
  lastActivityAt: string;
}

export interface TerminalCommand {
  id: string;
  sessionId: string;
  command: string;
  args: string[];
  cwd: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  isRunning: boolean;
  pid?: number;
}

export interface TerminalOutput {
  sessionId: string;
  commandId?: string;
  content: string;
  type: 'stdout' | 'stderr' | 'system';
  timestamp: string;
}

export interface TerminalConfig {
  fontSize: number;
  fontFamily: string;
  theme: TerminalTheme;
  cursorStyle: 'block' | 'underline' | 'bar';
  cursorBlink: boolean;
  scrollback: number;
  lineHeight: number;
  allowProposedApi: boolean;
}

export interface TerminalTheme {
  background: string;
  foreground: string;
  cursor: string;
  cursorAccent: string;
  selectionBackground: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

export interface CreateTerminalInput {
  projectId: string;
  shell?: TerminalShell;
  name?: string;
  cwd?: string;
  env?: Record<string, string>;
}

export interface SendCommandInput {
  sessionId: string;
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
}
