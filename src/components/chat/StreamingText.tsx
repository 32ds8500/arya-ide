import React, { useState, useEffect, useRef, useMemo } from 'react';

export interface StreamingTextProps {
  content: string;
  isStreaming?: boolean;
  speed?: number;
  showCursor?: boolean;
  onComplete?: () => void;
}

const StreamingText: React.FC<StreamingTextProps> = ({
  content,
  isStreaming = false,
  speed = 20,
  showCursor = true,
  onComplete,
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedContent(content);
      setIsComplete(true);
      return;
    }

    indexRef.current = 0;
    setDisplayedContent('');
    setIsComplete(false);

    timerRef.current = setInterval(() => {
      if (indexRef.current < content.length) {
        const chunk = content.slice(0, indexRef.current + 1);
        setDisplayedContent(chunk);
        indexRef.current++;
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsComplete(true);
        onComplete?.();
      }
    }, speed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [content, isStreaming, speed, onComplete]);

  useEffect(() => {
    if (!isStreaming && content !== displayedContent) {
      setDisplayedContent(content);
      setIsComplete(true);
    }
  }, [content, isStreaming]);

  const renderMarkdown = (text: string) => {
    const parts: React.ReactNode[] = [];
    const lines = text.split('\n');
    let inCode = false;
    let codeContent = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('```')) {
        if (inCode) {
          parts.push(
            <pre key={`code-${i}`} style={styles.codeBlock}>
              <code>{codeContent}</code>
            </pre>
          );
          codeContent = '';
          inCode = false;
        } else {
          inCode = true;
        }
        continue;
      }
      if (inCode) {
        codeContent += `${line  }\n`;
        continue;
      }

      let rendered: React.ReactNode;
      const boldRegex = /\*\*(.+?)\*\*/g;
      const codeRegex = /`(.+?)`/g;

      const spans: React.ReactNode[] = [];
      let lastIdx = 0;
      let match;

      const combined = new RegExp(`(${boldRegex.source}|${codeRegex.source})`, 'g');
      while ((match = combined.exec(line)) !== null) {
        if (match.index > lastIdx) {
          spans.push(line.slice(lastIdx, match.index));
        }
        if (match[0].startsWith('**')) {
          spans.push(<strong key={match.index} style={{ fontWeight: 600 }}>{match[1]}</strong>);
        } else {
          spans.push(
            <code key={match.index} style={styles.inlineCode}>{match[1]}</code>
          );
        }
        lastIdx = combined.lastIndex;
      }
      if (lastIdx < line.length) {
        spans.push(line.slice(lastIdx));
      }

      rendered = spans.length > 0 ? spans : line;

      parts.push(
        <div key={`line-${i}`} style={line === '' ? { height: 8 } : undefined}>
          {rendered}
        </div>
      );
    }
    return parts;
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {renderMarkdown(displayedContent)}
        {isStreaming && !isComplete && showCursor && (
          <span style={styles.cursor}>|</span>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontSize: 14,
    lineHeight: 1.6,
    color: '#a9b1d6',
  },
  content: {
    whiteSpace: 'pre-wrap',
  },
  cursor: {
    display: 'inline-block',
    color: '#7aa2f7',
    animation: 'blink 1s step-end infinite',
    fontWeight: 'bold',
  },
  codeBlock: {
    margin: '8px 0',
    padding: '8px 12px',
    background: '#15161e',
    borderRadius: 6,
    fontSize: 13,
    fontFamily: 'Cascadia Code, monospace',
    overflow: 'auto',
    border: '1px solid #292e42',
  },
  inlineCode: {
    background: '#292e42',
    padding: '1px 4px',
    borderRadius: 3,
    fontSize: 13,
    fontFamily: 'Cascadia Code, monospace',
    color: '#7dcfff',
  },
};

export default React.memo(StreamingText);
