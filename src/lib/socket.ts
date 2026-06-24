import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { createClient } from "@redis/client";
import { logger } from "./logger";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

let io: Server | null = null;

export interface TerminalData {
  projectId: string;
  command: string;
  output: string;
  exitCode?: number;
}

export interface FileChangeData {
  projectId: string;
  fileId: string;
  type: "create" | "update" | "delete";
  path: string;
}

export function initSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket: Socket) => {
    logger.info({ socketId: socket.id }, "Client connected");

    socket.on("join:project", (projectId: string) => {
      socket.join(`project:${projectId}`);
      logger.debug({ socketId: socket.id, projectId }, "Joined project room");
    });

    socket.on("leave:project", (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on("terminal:input", (data: { projectId: string; terminalId: string; input: string }) => {
      io?.to(`project:${data.projectId}`).emit("terminal:output", {
        terminalId: data.terminalId,
        output: data.input,
      });
    });

    socket.on("terminal:resize", (data: { projectId: string; terminalId: string; cols: number; rows: number }) => {
      io?.to(`project:${data.projectId}`).emit("terminal:resize", data);
    });

    socket.on("disconnect", (reason) => {
      logger.info({ socketId: socket.id, reason }, "Client disconnected");
    });

    socket.on("error", (error) => {
      logger.error({ socketId: socket.id, error: error.message }, "Socket error");
    });
  });

  logger.info("Socket.IO server initialized");
  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}

export function emitToProject(projectId: string, event: string, data: unknown) {
  io?.to(`project:${projectId}`).emit(event, data);
}

export function emitToUser(userId: string, event: string, data: unknown) {
  io?.to(`user:${userId}`).emit(event, data);
}

export function broadcast(event: string, data: unknown) {
  io?.emit(event, data);
}

export function joinUserRoom(socketId: string, userId: string) {
  const socket = io?.sockets.sockets.get(socketId);
  if (socket) {
    socket.join(`user:${userId}`);
  }
}

export function disconnectSocket(socketId: string) {
  const socket = io?.sockets.sockets.get(socketId);
  if (socket) {
    socket.disconnect(true);
  }
}

export function closeSocket() {
  if (io) {
    io.close();
    io = null;
  }
}
