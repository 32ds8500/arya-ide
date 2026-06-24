import React, { useState, useCallback, useMemo } from 'react';

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

export interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onSearch?: (query: string) => void;
}

function groupByDate(sessions: ChatSession[]): Map<string, ChatSession[]> {
  const groups = new Map<string, ChatSession[]>();
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.setDate(now.getDate() - 1)).toDateString();

  for (const session of sessions) {
    const dateStr = session.timestamp.toDateString();
    let label: string;
    if (dateStr === today) {
      label = 'Bugün';
    } else if (dateStr === yesterday) {
      label = 'Dün';
    } else {
      label = session.timestamp.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label)!.push(session);
  }

  return groups;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  activeSessionId,
  onSelect,
  onNew,
  onDelete,
  onSearch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);

  const filteredSessions = useMemo(() => {
    if (!searchQuery) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.lastMessage.toLowerCase().includes(q)
    );
  }, [sessions, searchQuery]);

  const grouped = useMemo(() => groupByDate(filteredSessions), [filteredSessions]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      setContextMenu({ id, x: e.clientX, y: e.clientY });
    },
    []
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  return (
    <div style={styles.sidebar}>
      <div style={styles.header}>
        <span style={styles.title}>Sohbetler</span>
        <button
          style={styles.newBtn}
          onClick={onNew}
          title="Yeni Sohbet"
        >
          +
        </button>
      </div>

      <div style={styles.searchContainer}>
        <input
          type="text"
          style={styles.searchInput}
          placeholder="Sohbet ara..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            onSearch?.(e.target.value);
          }}
        />
      </div>

      <div style={styles.sessionList}>
        {Array.from(grouped.entries()).map(([dateLabel, dateSessions]) => (
          <div key={dateLabel}>
            <div style={styles.dateLabel}>{dateLabel}</div>
            {dateSessions.map((session) => (
              <div
                key={session.id}
                style={{
                  ...styles.sessionItem,
                  ...(session.id === activeSessionId
                    ? styles.activeSession
                    : {}),
                }}
                onClick={() => onSelect(session.id)}
                onContextMenu={(e) => handleContextMenu(e, session.id)}
              >
                <div style={styles.sessionTitle}>{session.title}</div>
                <div style={styles.sessionPreview}>{session.lastMessage}</div>
                <div style={styles.sessionMeta}>
                  <span>{formatTime(session.timestamp)}</span>
                  <span>{session.messageCount} mesaj</span>
                </div>
              </div>
            ))}
          </div>
        ))}
        {filteredSessions.length === 0 && (
          <div style={styles.empty}>Sohbet bulunamadı</div>
        )}
      </div>

      {contextMenu && (
        <>
          <div
            style={styles.overlay}
            onClick={closeContextMenu}
          />
          <div
            style={{
              ...styles.contextMenu,
              left: contextMenu.x,
              top: contextMenu.y,
            }}
          >
            <button
              style={styles.contextMenuItem}
              onClick={() => {
                onSelect(contextMenu.id);
                closeContextMenu();
              }}
            >
              Aç
            </button>
            <button
              style={styles.contextMenuItem}
              onClick={() => {
                navigator.clipboard.writeText(
                  sessions.find((s) => s.id === contextMenu.id)?.title || ''
                );
                closeContextMenu();
              }}
            >
              Başlığı Kopyala
            </button>
            <div style={styles.divider} />
            <button
              style={{ ...styles.contextMenuItem, color: '#f7768e' }}
              onClick={() => {
                onDelete(contextMenu.id);
                closeContextMenu();
              }}
            >
              Sil
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    width: 280,
    height: '100%',
    background: '#1f2335',
    borderRight: '1px solid #292e42',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid #292e42',
  },
  title: {
    fontWeight: 600,
    color: '#c0caf5',
    fontSize: 14,
  },
  newBtn: {
    background: '#7aa2f733',
    border: '1px solid #7aa2f7',
    color: '#7aa2f7',
    fontSize: 16,
    cursor: 'pointer',
    width: 28,
    height: 28,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    padding: '8px 12px',
  },
  searchInput: {
    width: '100%',
    padding: '6px 10px',
    background: '#1a1b26',
    border: '1px solid #3b4261',
    borderRadius: 6,
    color: '#c0caf5',
    fontSize: 13,
    outline: 'none',
  },
  sessionList: {
    flex: 1,
    overflowY: 'auto',
    padding: '4px 8px',
  },
  dateLabel: {
    padding: '8px 8px 4px',
    fontSize: 11,
    fontWeight: 600,
    color: '#565f89',
    textTransform: 'uppercase',
  },
  sessionItem: {
    padding: '8px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    marginBottom: 2,
  },
  activeSession: {
    background: '#292e42',
  },
  sessionTitle: {
    color: '#c0caf5',
    fontSize: 13,
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  sessionPreview: {
    color: '#737aa2',
    fontSize: 12,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginTop: 2,
  },
  sessionMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#414868',
    fontSize: 11,
    marginTop: 4,
  },
  empty: {
    textAlign: 'center',
    color: '#565f89',
    padding: '24px 0',
    fontSize: 13,
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  contextMenu: {
    position: 'fixed',
    background: '#1f2335',
    border: '1px solid #3b4261',
    borderRadius: 6,
    padding: '4px 0',
    zIndex: 1000,
    minWidth: 160,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
  contextMenuItem: {
    display: 'block',
    width: '100%',
    padding: '6px 16px',
    border: 'none',
    background: 'none',
    color: '#c0caf5',
    fontSize: 13,
    textAlign: 'left',
    cursor: 'pointer',
  },
  divider: {
    height: 1,
    background: '#3b4261',
    margin: '4px 0',
  },
};

export default React.memo(ChatSidebar);
