"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export interface SocketOptions {
  url?: string;
  token?: string;
  projectId?: string;
}

export function initSocketClient(options?: SocketOptions): Socket {
  if (socket?.connected) return socket;

  const url = options?.url ?? process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001";

  socket = io(url, {
    auth: options?.token ? { token: options.token } : undefined,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });

  socket.on("connect", () => {
    console.log("[Socket] Connected:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("[Socket] Disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("[Socket] Connection error:", error.message);
  });

  socket.on("reconnect", (attempt) => {
    console.log("[Socket] Reconnected after", attempt, "attempts");
  });

  socket.on("reconnect_failed", () => {
    console.error("[Socket] Failed to reconnect");
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocketClient() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinProject(projectId: string) {
  socket?.emit("join:project", projectId);
}

export function leaveProject(projectId: string) {
  socket?.emit("leave:project", projectId);
}

export function onTerminalOutput(callback: (data: { terminalId: string; output: string }) => void) {
  socket?.on("terminal:output", callback);
  return () => socket?.off("terminal:output", callback);
}

export function onFileChange(callback: (data: { fileId: string; type: string; path: string }) => void) {
  socket?.on("file:change", callback);
  return () => socket?.off("file:change", callback);
}

export function onChatMessage(callback: (data: { chatId: string; message: unknown }) => void) {
  socket?.on("chat:message", callback);
  return () => socket?.off("chat:message", callback);
}

export function onNotification(callback: (data: { type: string; title: string; message: string }) => void) {
  socket?.on("notification", callback);
  return () => socket?.off("notification", callback);
}

export function emit(event: string, data?: unknown) {
  socket?.emit(event, data);
}
