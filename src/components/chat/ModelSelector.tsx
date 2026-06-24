import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface Model {
  id: string;
  name: string;
  provider: string;
  capabilities: string[];
  maxTokens?: number;
  isDefault?: boolean;
}

export interface ModelSelectorProps {
  models: Model[];
  selectedModelId: string;
  onSelect: (modelId: string) => void;
  disabled?: boolean;
}

function groupByProvider(models: Model[]): Map<string, Model[]> {
  const groups = new Map<string, Model[]>();
  for (const model of models) {
    if (!groups.has(model.provider)) {
      groups.set(model.provider, []);
    }
    groups.get(model.provider)!.push(model);
  }
  return groups;
}

const CAPABILITY_COLORS: Record<string, string> = {
  'kod': '#9ece6a',
  'metin': '#7aa2f7',
  'çok-modalli': '#bb9af7',
  'hızlı': '#e0af68',
  'uygun': '#7dcfff',
};

const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModelId,
  onSelect,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedModel = models.find((m) => m.id === selectedModelId);

  const grouped = groupByProvider(models);

  const filteredGroups = new Map<string, Model[]>();
  for (const [provider, providerModels] of grouped) {
    const filtered = providerModels.filter(
      (m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.provider.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filtered.length > 0) {
      filteredGroups.set(provider, filtered);
    }
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = useCallback(
    (modelId: string) => {
      onSelect(modelId);
      setIsOpen(false);
      setSearchQuery('');
    },
    [onSelect]
  );

  return (
    <div ref={containerRef} style={styles.container}>
      <button
        style={{
          ...styles.trigger,
          ...(disabled ? styles.triggerDisabled : {}),
        }}
        onClick={() => !disabled && setIsOpen((p) => !p)}
        disabled={disabled}
      >
        <div style={styles.triggerContent}>
          {selectedModel && (
            <>
              <span style={styles.triggerProvider}>{selectedModel.provider}</span>
              <span style={styles.triggerName}>{selectedModel.name}</span>
              {selectedModel.isDefault && (
                <span style={styles.defaultBadge}>varsayılan</span>
              )}
            </>
          )}
          {!selectedModel && (
            <span style={styles.placeholder}>Model seçin</span>
          )}
        </div>
        <span style={styles.arrow}>{isOpen ? '▴' : '▾'}</span>
      </button>

      {isOpen && (
        <div style={styles.dropdown}>
          <div style={styles.searchContainer}>
            <input
              ref={searchInputRef}
              type="text"
              style={styles.searchInput}
              placeholder="Model ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={styles.modelList}>
            {Array.from(filteredGroups.entries()).map(([provider, providerModels]) => (
              <div key={provider}>
                <div style={styles.providerLabel}>{provider}</div>
                {providerModels.map((model) => (
                  <div
                    key={model.id}
                    style={{
                      ...styles.modelItem,
                      ...(model.id === selectedModelId
                        ? styles.modelItemActive
                        : {}),
                    }}
                    onClick={() => handleSelect(model.id)}
                  >
                    <div style={styles.modelInfo}>
                      <span style={styles.modelName}>{model.name}</span>
                      {model.isDefault && (
                        <span style={styles.defaultDot}>●</span>
                      )}
                    </div>
                    <div style={styles.capabilities}>
                      {model.capabilities.map((cap) => (
                        <span
                          key={cap}
                          style={{
                            ...styles.capabilityBadge,
                            color: CAPABILITY_COLORS[cap] || '#737aa2',
                            borderColor: `${CAPABILITY_COLORS[cap] || '#737aa2'  }44`,
                            background: `${CAPABILITY_COLORS[cap] || '#737aa2'  }11`,
                          }}
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                    {model.maxTokens && (
                      <span style={styles.maxTokens}>
                        {model.maxTokens.toLocaleString('tr-TR')} token
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}

            {filteredGroups.size === 0 && (
              <div style={styles.empty}>Model bulunamadı</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
  },
  trigger: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '6px 10px',
    background: '#1a1b26',
    border: '1px solid #3b4261',
    borderRadius: 6,
    color: '#c0caf5',
    fontSize: 13,
    cursor: 'pointer',
    outline: 'none',
    gap: 8,
  },
  triggerDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  triggerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  triggerProvider: {
    color: '#737aa2',
    fontSize: 11,
  },
  triggerName: {
    color: '#c0caf5',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  defaultBadge: {
    fontSize: 10,
    padding: '1px 4px',
    background: '#9ece6a22',
    color: '#9ece6a',
    borderRadius: 3,
  },
  placeholder: {
    color: '#565f89',
  },
  arrow: {
    color: '#737aa2',
    fontSize: 10,
    flexShrink: 0,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    background: '#1f2335',
    border: '1px solid #3b4261',
    borderRadius: 8,
    zIndex: 1000,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    maxHeight: 400,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  searchContainer: {
    padding: '8px',
    borderBottom: '1px solid #292e42',
  },
  searchInput: {
    width: '100%',
    padding: '6px 10px',
    background: '#1a1b26',
    border: '1px solid #3b4261',
    borderRadius: 4,
    color: '#c0caf5',
    fontSize: 12,
    outline: 'none',
  },
  modelList: {
    overflowY: 'auto',
    padding: '4px 0',
  },
  providerLabel: {
    padding: '6px 12px 4px',
    fontSize: 11,
    fontWeight: 600,
    color: '#565f89',
    textTransform: 'uppercase',
  },
  modelItem: {
    padding: '8px 12px',
    cursor: 'pointer',
    transition: 'background 0.1s',
  },
  modelItemActive: {
    background: '#292e42',
  },
  modelInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  modelName: {
    color: '#c0caf5',
    fontSize: 13,
    fontWeight: 500,
  },
  defaultDot: {
    color: '#9ece6a',
    fontSize: 8,
  },
  capabilities: {
    display: 'flex',
    gap: 4,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  capabilityBadge: {
    fontSize: 10,
    padding: '1px 6px',
    borderRadius: 4,
    border: '1px solid',
    fontWeight: 500,
  },
  maxTokens: {
    fontSize: 10,
    color: '#414868',
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    color: '#565f89',
    padding: '16px 0',
    fontSize: 13,
  },
};

export default React.memo(ModelSelector);
