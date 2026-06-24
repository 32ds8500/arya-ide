import React, { useRef, useEffect } from 'react';

export interface MinimapProps {
  content: string;
  language?: string;
  scrollOffset?: number;
  viewportHeight?: number;
  totalLines?: number;
  onLineClick?: (lineNumber: number) => void;
}

const Minimap: React.FC<MinimapProps> = ({
  content,
  scrollOffset = 0,
  viewportHeight = 30,
  totalLines,
  onLineClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const lines = content.split('\n');
  const total = totalLines || lines.length;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);

    ctx.fillStyle = '#1a1b26';
    ctx.fillRect(0, 0, width, height);

    const lineHeight = 2;
    const charWidth = 1.2;
    const lineGap = 1;
    const startY = -scrollOffset * (lineHeight + lineGap);

    const tokenColors: Record<string, string> = {
      keyword: '#c678dd',
      string: '#98c379',
      number: '#d19a66',
      comment: '#5c6370',
      function: '#61afef',
      type: '#e5c07b',
      default: '#abb2bf',
    };

    for (let i = 0; i < lines.length; i++) {
      const y = startY + i * (lineHeight + lineGap);
      if (y + lineHeight < 0 || y > height) continue;

      const line = lines[i];
      const trimmed = line.trimStart();
      const indent = line.length - trimmed.length;

      const x = indent * charWidth;
      let color = tokenColors.default;

      if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*')) {
        color = tokenColors.comment;
      } else if (/^(import|export|const|let|var|function|class|return|if|else|for|while|switch|case|break|continue|try|catch|throw|new|this|async|await)\b/.test(trimmed)) {
        color = tokenColors.keyword;
      } else if (/^["'`]/.test(trimmed)) {
        color = tokenColors.string;
      } else if (/^\d/.test(trimmed)) {
        color = tokenColors.number;
      }

      ctx.fillStyle = `${color  }88`;
      ctx.fillRect(x, y, Math.min(trimmed.length * charWidth, width - x), lineHeight);
    }

    const viewportY = scrollOffset * (lineHeight + lineGap);
    const viewportH = viewportHeight * (lineHeight + lineGap);
    ctx.fillStyle = '#7aa2f722';
    ctx.fillRect(0, viewportY, width, viewportH);
    ctx.strokeStyle = '#7aa2f744';
    ctx.strokeRect(0, viewportY, width, viewportH);
  }, [content, scrollOffset, viewportHeight, total]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onLineClick) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const lineHeight = 3;
    const clickedLine = Math.floor(y / lineHeight) + scrollOffset;
    onLineClick(Math.max(0, Math.min(clickedLine, total - 1)));
  };

  return (
    <canvas
      ref={canvasRef}
      style={styles.minimap}
      onClick={handleClick}
    />
  );
};

const styles: Record<string, React.CSSProperties> = {
  minimap: {
    width: '100%',
    height: '100%',
    display: 'block',
    cursor: 'pointer',
  },
};

export default React.memo(Minimap);
