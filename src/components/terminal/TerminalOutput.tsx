import React, { useRef, useEffect, useMemo } from 'react';

export interface TerminalOutputProps {
  output: string;
  maxLines?: number;
  style?: React.CSSProperties;
}

const ANSI_COLORS: Record<string, string> = {
  '30': '#15161e',
  '31': '#f7768e',
  '32': '#9ece6a',
  '33': '#e0af68',
  '34': '#7aa2f7',
  '35': '#bb9af7',
  '36': '#7dcfff',
  '37': '#a9b1d6',
  '90': '#414868',
  '91': '#f7768e',
  '92': '#9ece6a',
  '93': '#e0af68',
  '94': '#7aa2f7',
  '95': '#bb9af7',
  '96': '#7dcfff',
  '97': '#c0caf5',
};

const BG_COLORS: Record<string, string> = {
  '40': '#15161e',
  '41': '#f7768e33',
  '42': '#9ece6a33',
  '43': '#e0af6833',
  '44': '#7aa2f733',
  '45': '#bb9af733',
  '46': '#7dcfff33',
  '47': '#a9b1d633',
};

function parseAnsi(text: string): Array<{ text: string; color?: string; bg?: string; bold?: boolean; italic?: boolean; underline?: boolean }> {
  const segments: Array<{ text: string; color?: string; bg?: string; bold?: boolean; italic?: boolean; underline?: boolean }> = [];
  const regex = /\x1b\[([0-9;]*)m/g; // eslint-disable-line no-control-regex
  let lastIndex = 0;
  let currentColor: string | undefined;
  let currentBg: string | undefined;
  let currentBold = false;
  let currentItalic = false;
  let currentUnderline = false;

  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, match.index),
        color: currentColor,
        bg: currentBg,
        bold: currentBold,
        italic: currentItalic,
        underline: currentUnderline,
      });
    }

    const codes = match[1].split(';');
    for (const code of codes) {
      switch (code) {
        case '0':
          currentColor = undefined;
          currentBg = undefined;
          currentBold = false;
          currentItalic = false;
          currentUnderline = false;
          break;
        case '1':
          currentBold = true;
          break;
        case '2':
          break;
        case '3':
          currentItalic = true;
          break;
        case '4':
          currentUnderline = true;
          break;
        default:
          if (ANSI_COLORS[code]) currentColor = ANSI_COLORS[code];
          if (BG_COLORS[code]) currentBg = BG_COLORS[code];
      }
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      color: currentColor,
      bg: currentBg,
      bold: currentBold,
      italic: currentItalic,
      underline: currentUnderline,
    });
  }

  return segments;
}

const TerminalOutput: React.FC<TerminalOutputProps> = ({
  output,
  maxLines = 1000,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const lines = useMemo(() => {
    const allLines = output.split('\n');
    return allLines.slice(-maxLines);
  }, [output, maxLines]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div ref={containerRef} style={{ ...styles.container, ...style }}>
      {lines.map((line, i) => {
        const segments = parseAnsi(line);
        return (
          <div key={i} style={styles.line}>
            {segments.length === 0 ? (
              <span>&nbsp;</span>
            ) : (
              segments.map((seg, j) => (
                <span
                  key={j}
                  style={{
                    color: seg.color,
                    backgroundColor: seg.bg,
                    fontWeight: seg.bold ? 'bold' : undefined,
                    fontStyle: seg.italic ? 'italic' : undefined,
                    textDecoration: seg.underline ? 'underline' : undefined,
                  }}
                >
                  {seg.text}
                </span>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    overflowY: 'auto',
    fontFamily: 'Cascadia Code, Fira Code, Consolas, monospace',
    fontSize: 13,
    lineHeight: 1.4,
    padding: '4px 8px',
    color: '#c0caf5',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  line: {
    minHeight: '1.4em',
  },
};

export default React.memo(TerminalOutput);
