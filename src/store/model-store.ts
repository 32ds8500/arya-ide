import { create } from 'zustand';
import type { AIProvider, AIModel } from '../types';

interface ModelStore {
  selectedProvider: string | null;
  selectedModel: string | null;
  availableProviders: AIProvider[];
  availableModels: AIModel[];
  isLoading: boolean;
  error: string | null;

  setProvider: (providerId: string) => void;
  setModel: (modelId: string) => void;
  setProviders: (providers: AIProvider[]) => void;
  setModels: (models: AIModel[]) => void;
  loadProviders: () => Promise<void>;
  loadModels: (providerId: string) => Promise<void>;
  loadAllModels: () => Promise<void>;
  addProvider: (provider: AIProvider) => void;
  removeProvider: (providerId: string) => void;
  updateProvider: (providerId: string, updates: Partial<AIProvider>) => void;
  getModelsByProvider: (providerId: string) => AIModel[];
  getSelectedModelInfo: () => AIModel | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useModelStore = create<ModelStore>()((set, get) => ({
  selectedProvider: null,
  selectedModel: null,
  availableProviders: [],
  availableModels: [],
  isLoading: false,
  error: null,

  setProvider: (providerId) => {
    set({ selectedProvider: providerId });
    const models = get().getModelsByProvider(providerId);
    if (models.length > 0 && !models.find((m) => m.id === get().selectedModel)) {
      set({ selectedModel: models[0].id });
    }
  },

  setModel: (modelId) => {
    set({ selectedModel: modelId });
    const model = get().availableModels.find((m) => m.id === modelId);
    if (model) {
      set({ selectedProvider: model.providerId });
    }
  },

  setProviders: (providers) => set({ availableProviders: providers }),

  setModels: (models) => set({ availableModels: models }),

  loadProviders: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/ai/providers');
      if (!response.ok) throw new Error('Failed to load providers');
      const providers = await response.json();
      set({ availableProviders: providers, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load providers',
      });
    }
  },

  loadModels: async (providerId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/ai/providers/${providerId}/models`);
      if (!response.ok) throw new Error('Failed to load models');
      const models = await response.json();

      set((state) => {
        const otherModels = state.availableModels.filter(
          (m) => m.providerId !== providerId
        );
        return {
          availableModels: [...otherModels, ...models],
          isLoading: false,
        };
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load models',
      });
    }
  },

  loadAllModels: async () => {
    set({ isLoading: true, error: null });
    try {
      const [providersRes, modelsRes] = await Promise.all([
        fetch('/api/ai/providers'),
        fetch('/api/ai/models'),
      ]);

      if (!providersRes.ok || !modelsRes.ok) {
        throw new Error('Failed to load AI configuration');
      }

      const providers = await providersRes.json();
      const models = await modelsRes.json();

      set({
        availableProviders: providers,
        availableModels: models,
        isLoading: false,
      });

      if (providers.length > 0 && !get().selectedProvider) {
        set({ selectedProvider: providers[0].id });
      }
      if (models.length > 0 && !get().selectedModel) {
        set({ selectedModel: models[0].id });
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load AI configuration',
      });
    }
  },

  addProvider: (provider) => {
    set((state) => ({
      availableProviders: [...state.availableProviders, provider],
    }));
  },

  removeProvider: (providerId) => {
    set((state) => ({
      availableProviders: state.availableProviders.filter((p) => p.id !== providerId),
      availableModels: state.availableModels.filter((m) => m.providerId !== providerId),
      selectedProvider:
        state.selectedProvider === providerId ? null : state.selectedProvider,
    }));
  },

  updateProvider: (providerId, updates) => {
    set((state) => ({
      availableProviders: state.availableProviders.map((p) =>
        p.id === providerId ? { ...p, ...updates } : p
      ),
    }));
  },

  getModelsByProvider: (providerId) => {
    return get().availableModels.filter((m) => m.providerId === providerId);
  },

  getSelectedModelInfo: () => {
    const { selectedModel, availableModels } = get();
    return availableModels.find((m) => m.id === selectedModel) || null;
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
