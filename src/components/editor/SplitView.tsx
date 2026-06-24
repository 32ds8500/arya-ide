import React, { useState, useCallback, useRef, useEffect } from 'react';

export interface SplitViewProps {
  direction?: 'horizontal' | 'vertical';
  initialSizes?: number[];
  minSize?: number;
  children: React.ReactNode[];
  onSplitChange?: (sizes: number[]) => void;
}

const SplitView: React.FC<SplitViewProps> = ({
  direction = 'horizontal',
  initialSizes,
  minSize = 100,
  children,
  onSplitChange,
}) => {
  const [sizes, setSizes] = useState<number[]>(() => {
    if (initialSizes) return initialSizes;
    const count = React.Children.count(children);
    const equal = 100 / count;
    return Array(count).fill(equal);
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (index: number) => (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      setDragIndex(index);
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const isHorizontal = direction === 'horizontal';
      const totalSize = isHorizontal ? rect.width : rect.height;
      const mousePos = isHorizontal
        ? e.clientX - rect.left
        : e.clientY - rect.top;

      setSizes((prev) => {
        const newSizes = [...prev];
        const totalPercent = newSizes.reduce((a, b) => a + b, 0);
        const mousePercent = (mousePos / totalSize) * totalPercent;

        let prevSum = 0;
        for (let i = 0; i < dragIndex; i++) {
          prevSum += newSizes[i];
        }

        const beforeSize = mousePercent - prevSum;
        const afterSize = newSizes[dragIndex] + newSizes[dragIndex + 1] - beforeSize;

        const minPercent = (minSize / totalSize) * totalPercent;

        if (beforeSize >= minPercent && afterSize >= minPercent) {
          newSizes[dragIndex] = beforeSize;
          newSizes[dragIndex + 1] = afterSize;
        }

        return newSizes;
      });
    },
    [isDragging, dragIndex, direction, minSize]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onSplitChange?.(sizes);
    }
  }, [isDragging, sizes, onSplitChange]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, direction]);

  const panels = React.Children.toArray(children);
  const isHorizontal = direction === 'horizontal';

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {panels.map((panel, index) => (
        <React.Fragment key={index}>
          <div
            style={{
              [isHorizontal ? 'width' : 'height']: `${sizes[index]}%`,
              [isHorizontal ? 'minWidth' : 'minHeight']: minSize,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {panel}
          </div>
          {index < panels.length - 1 && (
            <div
              onMouseDown={handleMouseDown(index)}
              style={{
                [isHorizontal ? 'width' : 'height']: 4,
                [isHorizontal ? 'cursor' : 'cursor']: isHorizontal
                  ? 'col-resize'
                  : 'row-resize',
                background: isDragging && dragIndex === index ? '#7aa2f7' : '#292e42',
                flexShrink: 0,
                transition: isDragging ? 'none' : 'background 0.15s',
                zIndex: 10,
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default React.memo(SplitView);
