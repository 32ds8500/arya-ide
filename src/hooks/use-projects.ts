'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  PaginatedResponse,
  QueryParams,
} from '../types';

const PROJECTS_KEY = 'projects';
const PROJECT_KEY = (id: string) => ['projects', id];

async function fetchProjects(params?: QueryParams): Promise<PaginatedResponse<Project>> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    });
  }
  const response = await fetch(`/api/projects?${searchParams.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch projects');
  return response.json();
}

async function fetchProject(id: string): Promise<Project> {
  const response = await fetch(`/api/projects/${id}`);
  if (!response.ok) throw new Error('Failed to fetch project');
  return response.json();
}

async function createProject(data: CreateProjectInput): Promise<Project> {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create project');
  return response.json();
}

async function updateProject(id: string, data: UpdateProjectInput): Promise<Project> {
  const response = await fetch(`/api/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update project');
  return response.json();
}

async function deleteProject(id: string): Promise<void> {
  const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete project');
}

export function useProjects(params?: QueryParams) {
  return useQuery({
    queryKey: [PROJECTS_KEY, params],
    queryFn: () => fetchProjects(params),
    staleTime: 30 * 1000,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: PROJECT_KEY(id),
    queryFn: () => fetchProject(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProject,
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_KEY] });
      queryClient.setQueryData(PROJECT_KEY(newProject.id), newProject);
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectInput }) =>
      updateProject(id, data),
    onSuccess: (updatedProject) => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_KEY] });
      queryClient.setQueryData(PROJECT_KEY(updatedProject.id), updatedProject);
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_KEY] });
      queryClient.removeQueries({ queryKey: PROJECT_KEY(deletedId) });
    },
  });
}
