'use client';

import { useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useModelStore } from '../store';
import type { AIProvider, AIModel } from '../types';

async function fetchProviders(): Promise<AIProvider[]> {
  const response = await fetch('/api/ai/providers');
  if (!response.ok) throw new Error('Failed to fetch providers');
  return response.json();
}

async function fetchModels(providerId?: string): Promise<AIModel[]> {
  const params = providerId ? `?providerId=${providerId}` : '';
  const response = await fetch(`/api/ai/models${params}`);
  if (!response.ok) throw new Error('Failed to fetch models');
  return response.json();
}

export function useProviders() {
  const { setProviders, addProvider, removeProvider, updateProvider } = useModelStore();

  const query = useQuery({
    queryKey: ['ai', 'providers'],
    queryFn: fetchProviders,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data) {
      setProviders(query.data);
    }
  }, [query.data, setProviders]);

  return {
    ...query,
    providers: query.data ?? [],
    addProvider,
    removeProvider,
    updateProvider,
  };
}

export function useModels(providerId?: string) {
  const { setModels } = useModelStore();

  const query = useQuery({
    queryKey: ['ai', 'models', providerId],
    queryFn: () => fetchModels(providerId),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data) {
      setModels(query.data);
    }
  }, [query.data, setModels]);

  return {
    ...query,
    models: query.data ?? [],
  };
}

export function useSelectModel() {
  const {
    selectedProvider,
    selectedModel,
    availableModels,
    setProvider,
    setModel,
    getModelsByProvider,
    getSelectedModelInfo,
  } = useModelStore();

  const selectModel = useCallback(
    (modelId: string) => {
      setModel(modelId);
    },
    [setModel]
  );

  const selectProvider = useCallback(
    (providerId: string) => {
      setProvider(providerId);
    },
    [setProvider]
  );

  const modelsForProvider = useCallback(
    (providerId: string) => {
      return getModelsByProvider(providerId);
    },
    [getModelsByProvider]
  );

  return {
    selectedProvider,
    selectedModel,
    availableModels,
    selectedModelInfo: getSelectedModelInfo(),
    selectModel,
    selectProvider,
    modelsForProvider,
  };
}
