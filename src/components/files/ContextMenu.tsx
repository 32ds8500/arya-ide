import React, { useEffect, useCallback, useRef } from 'react';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

export interface ContextMenuProps {
  items: ContextMenuItem[];
  x: number;
  y: number;
  onClose: () => void;
  visible: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  items,
  x,
  y,
  onClose,
  visible,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  const adjustedPosition = useCallback(() => {
    if (!menuRef.current) return { left: x, top: y };
    const rect = menuRef.current.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let left = x;
    let top = y;

    if (x + rect.width > viewportW) {
      left = viewportW - rect.width - 8;
    }
    if (y + rect.height > viewportH) {
      top = viewportH - rect.height - 8;
    }

    return { left: Math.max(0, left), top: Math.max(0, top) };
  }, [x, y]);

  useEffect(() => {
    if (!visible) return;

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  const pos = adjustedPosition();

  return (
    <div
      ref={menuRef}
      style={{
        ...styles.menu,
        left: pos.left,
        top: pos.top,
      }}
    >
      {items.map((item) => {
        if (item.divider) {
          return <div key={item.id} style={styles.divider} />;
        }

        return (
          <button
            key={item.id}
            style={{
              ...styles.item,
              ...(item.disabled ? styles.itemDisabled : {}),
              ...(item.danger ? styles.itemDanger : {}),
            }}
            onClick={() => {
              if (!item.disabled) {
                item.onClick?.();
                onClose();
              }
            }}
            disabled={item.disabled}
          >
            {item.icon && <span style={styles.icon}>{item.icon}</span>}
            <span style={styles.label}>{item.label}</span>
            {item.shortcut && (
              <span style={styles.shortcut}>{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  menu: {
    position: 'fixed',
    background: '#1f2335',
    border: '1px solid #3b4261',
    borderRadius: 8,
    padding: '4px 0',
    zIndex: 10000,
    minWidth: 180,
    boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
    animation: 'contextMenuFadeIn 0.1s ease-out',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '6px 12px',
    border: 'none',
    background: 'none',
    color: '#c0caf5',
    fontSize: 13,
    textAlign: 'left',
    cursor: 'pointer',
    gap: 8,
    transition: 'background 0.1s',
  },
  itemDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  itemDanger: {
    color: '#f7768e',
  },
  icon: {
    width: 16,
    textAlign: 'center',
    fontSize: 12,
    flexShrink: 0,
  },
  label: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  shortcut: {
    color: '#565f89',
    fontSize: 11,
    fontFamily: 'monospace',
    flexShrink: 0,
  },
  divider: {
    height: 1,
    background: '#3b4261',
    margin: '4px 0',
  },
};

export default React.memo(ContextMenu);
