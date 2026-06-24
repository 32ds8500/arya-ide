import React, { useRef, useEffect, useCallback } from 'react';
import { Terminal as XTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

export interface TerminalProps {
  id: string;
  theme?: 'arya-dark' | 'arya-light';
  fontSize?: number;
  fontFamily?: string;
  onCommand?: (command: string) => void;
  onData?: (data: string) => void;
  onResize?: (cols: number, rows: number) => void;
  socket?: WebSocket | null;
  name?: string;
}

const ARYA_DARK_THEME = {
  background: '#1a1b26',
  foreground: '#c0caf5',
  cursor: '#c0caf5',
  cursorAccent: '#1a1b26',
  selectionBackground: '#283457',
  selectionForeground: '#c0caf5',
  black: '#15161e',
  red: '#f7768e',
  green: '#9ece6a',
  yellow: '#e0af68',
  blue: '#7aa2f7',
  magenta: '#bb9af7',
  cyan: '#7dcfff',
  white: '#a9b1d6',
  brightBlack: '#414868',
  brightRed: '#f7768e',
  brightGreen: '#9ece6a',
  brightYellow: '#e0af68',
  brightBlue: '#7aa2f7',
  brightMagenta: '#bb9af7',
  brightCyan: '#7dcfff',
  brightWhite: '#c0caf5',
};

const ARYA_LIGHT_THEME = {
  background: '#ffffff',
  foreground: '#343b58',
  cursor: '#343b58',
  cursorAccent: '#ffffff',
  selectionBackground: '#b6d6f2',
  black: '#24292e',
  red: '#e45649',
  green: '#50a14f',
  yellow: '#c18401',
  blue: '#4078f2',
  magenta: '#a626a4',
  cyan: '#0184bc',
  white: '#fafafa',
  brightBlack: '#696c77',
  brightRed: '#e45649',
  brightGreen: '#50a14f',
  brightYellow: '#c18401',
  brightBlue: '#4078f2',
  brightMagenta: '#a626a4',
  brightCyan: '#0184bc',
  brightWhite: '#ffffff',
};

const AryaTerminal: React.FC<TerminalProps> = ({
  id,
  theme = 'arya-dark',
  fontSize = 14,
  fontFamily = 'Cascadia Code, Fira Code, Consolas, monospace',
  onCommand,
  onData,
  onResize,
  socket,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const searchAddonRef = useRef<any>(null);
  const commandBuffer = useRef('');

  const initTerminal = useCallback(() => {
    if (!containerRef.current || termRef.current) return;

    const term = new XTerminal({
      theme: theme === 'arya-dark' ? ARYA_DARK_THEME : ARYA_LIGHT_THEME,
      fontSize,
      fontFamily,
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 10000,
      allowProposedApi: true,
      convertEol: true,
      drawBoldTextInBrightColors: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    term.onData((data: string) => {
      onData?.(data);

      if (data === '\r') {
        const command = commandBuffer.current.trim();
        if (command) {
          onCommand?.(command);
        }
        commandBuffer.current = '';
      } else if (data === '\x7f') {
        commandBuffer.current = commandBuffer.current.slice(0, -1);
      } else if (data >= ' ') {
        commandBuffer.current += data;
      }

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'data', terminalId: id, data }));
      }
    });

    term.onResize(({ cols, rows }: { cols: number; rows: number }) => {
      onResize?.(cols, rows);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({ type: 'resize', terminalId: id, cols, rows })
        );
      }
    });

    term.write('\x1b[1;36m  Arya IDE Terminal\x1b[0m\r\n');
    term.write('\x1b[90m  Yazmaya başlayın...\x1b[0m\r\n');
  }, [theme, fontSize, fontFamily, id, onCommand, onData, onResize, socket]);

  useEffect(() => {
    initTerminal();

    const observer = new ResizeObserver(() => {
      fitAddonRef.current?.fit();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
      termRef.current?.dispose();
      termRef.current = null;
    };
  }, [initTerminal]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'output' && msg.terminalId === id) {
          termRef.current?.write(msg.data);
        }
      } catch {
        // ignore
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, id]);

  const search = useCallback((query: string, options?: { regex?: boolean; caseSensitive?: boolean; wholeWord?: boolean }) => {
    searchAddonRef.current?.findNext(query, {
      regex: options?.regex,
      caseSensitive: options?.caseSensitive,
      wholeWord: options?.wholeWord,
    });
  }, []);

  const searchPrevious = useCallback((query: string) => {
    searchAddonRef.current?.findPrevious(query);
  }, []);

  return (
    <div
      ref={containerRef}
      style={styles.container}
    />
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    padding: '4px 0',
  },
};

export default React.memo(AryaTerminal);
