'use client';

import { useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFileStore } from '../store';
import type { File, FileTreeNode, CreateFileInput, UpdateFileInput } from '../types';

const FILES_KEY = 'files';
const FILE_TREE_KEY = (projectId: string) => ['files', 'tree', projectId];
const FILE_KEY = (id: string) => ['files', id];

async function fetchFiles(projectId: string): Promise<File[]> {
  const response = await fetch(`/api/projects/${projectId}/files`);
  if (!response.ok) throw new Error('Failed to fetch files');
  return response.json();
}

async function fetchFileTree(projectId: string): Promise<FileTreeNode> {
  const response = await fetch(`/api/projects/${projectId}/files/tree`);
  if (!response.ok) throw new Error('Failed to fetch file tree');
  return response.json();
}

async function fetchFileContent(fileId: string): Promise<File> {
  const response = await fetch(`/api/files/${fileId}`);
  if (!response.ok) throw new Error('Failed to fetch file');
  return response.json();
}

async function createFile(data: CreateFileInput): Promise<File> {
  const response = await fetch('/api/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create file');
  return response.json();
}

async function updateFile(id: string, data: UpdateFileInput): Promise<File> {
  const response = await fetch(`/api/files/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update file');
  return response.json();
}

async function deleteFile(id: string): Promise<void> {
  const response = await fetch(`/api/files/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete file');
}

export function useFiles(projectId: string) {
  const { setFiles } = useFileStore();

  const query = useQuery({
    queryKey: [FILES_KEY, projectId],
    queryFn: () => fetchFiles(projectId),
    enabled: !!projectId,
    staleTime: 10 * 1000,
  });

  useEffect(() => {
    if (query.data) {
      setFiles(query.data);
    }
  }, [query.data, setFiles]);

  return query;
}

export function useFileTree(projectId: string) {
  const { setFileTree } = useFileStore();

  const query = useQuery({
    queryKey: FILE_TREE_KEY(projectId),
    queryFn: () => fetchFileTree(projectId),
    enabled: !!projectId,
    staleTime: 10 * 1000,
  });

  useEffect(() => {
    if (query.data) {
      setFileTree(query.data);
    }
  }, [query.data, setFileTree]);

  return query;
}

export function useFileContent(fileId: string) {
  return useQuery({
    queryKey: FILE_KEY(fileId),
    queryFn: () => fetchFileContent(fileId),
    enabled: !!fileId,
    staleTime: Infinity,
  });
}

export function useCreateFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFile,
    onSuccess: (newFile) => {
      queryClient.invalidateQueries({ queryKey: [FILES_KEY] });
      queryClient.invalidateQueries({ queryKey: ['files', 'tree'] });
      useFileStore.getState().addFile(newFile);
    },
  });
}

export function useUpdateFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFileInput }) =>
      updateFile(id, data),
    onSuccess: (updatedFile) => {
      queryClient.invalidateQueries({ queryKey: [FILES_KEY] });
      queryClient.setQueryData(FILE_KEY(updatedFile.id), updatedFile);
      useFileStore.getState().updateFile(updatedFile.id, updatedFile);
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFile,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: [FILES_KEY] });
      queryClient.invalidateQueries({ queryKey: ['files', 'tree'] });
      queryClient.removeQueries({ queryKey: FILE_KEY(deletedId) });
      useFileStore.getState().removeFile(deletedId);
    },
  });
}
