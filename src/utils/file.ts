import * as path from "path";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".cjs": "text/javascript",
  ".jsx": "text/javascript",
  ".ts": "text/typescript",
  ".tsx": "text/typescript",
  ".json": "application/json",
  ".yaml": "text/yaml",
  ".yml": "text/yaml",
  ".xml": "application/xml",
  ".csv": "text/csv",
  ".md": "text/markdown",
  ".mdx": "text/markdown",
  ".txt": "text/plain",
  ".log": "text/plain",
  ".py": "text/x-python",
  ".rb": "text/x-ruby",
  ".go": "text/x-go",
  ".rs": "text/x-rust",
  ".java": "text/x-java",
  ".c": "text/x-c",
  ".cpp": "text/x-c++src",
  ".h": "text/x-c",
  ".cs": "text/x-csharp",
  ".php": "text/x-php",
  ".swift": "text/x-swift",
  ".kt": "text/x-kotlin",
  ".dart": "text/x-dart",
  ".sql": "text/x-sql",
  ".sh": "text/x-shellscript",
  ".bash": "text/x-shellscript",
  ".zsh": "text/x-shellscript",
  ".graphql": "application/graphql",
  ".gql": "application/graphql",
  ".dockerfile": "text/x-dockerfile",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
  ".zip": "application/zip",
  ".gz": "application/gzip",
  ".tar": "application/x-tar",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
};

export function getExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  if (idx === -1) return "";
  return filename.slice(idx).toLowerCase();
}

export function getMimeType(filename: string): string {
  const ext = getExtension(filename);
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

export function getFileName(filePath: string): string {
  return path.basename(filePath);
}

export function getDirectoryName(filePath: string): string {
  return path.dirname(filePath);
}

export function joinPath(...parts: string[]): string {
  return parts
    .join("/")
    .replace(/\/+/g, "/")
    .replace(/\/$/, "") || ".";
}

export function normalizePath(filePath: string): string {
  const normalized = filePath
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\.\/?/, "")
    .replace(/\/$/, "");
  return normalized || ".";
}

export function getFileExtensionGroup(filename: string): string {
  const ext = getExtension(filename);

  if ([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"].includes(ext)) return "javascript";
  if ([".py", ".pyw"].includes(ext)) return "python";
  if ([".rs"].includes(ext)) return "rust";
  if ([".go"].includes(ext)) return "go";
  if ([".java"].includes(ext)) return "java";
  if ([".c", ".h", ".cpp", ".hpp", ".cc"].includes(ext)) return "c-cpp";
  if ([".cs"].includes(ext)) return "csharp";
  if ([".rb", ".erb"].includes(ext)) return "ruby";
  if ([".php"].includes(ext)) return "php";
  if ([".swift"].includes(ext)) return "swift";
  if ([".kt", ".kts"].includes(ext)) return "kotlin";
  if ([".html", ".htm"].includes(ext)) return "web";
  if ([".css", ".scss", ".sass", ".less"].includes(ext)) return "style";
  if ([".json", ".yaml", ".yml", ".toml"].includes(ext)) return "config";
  if ([".md", ".mdx"].includes(ext)) return "docs";
  if ([".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"].includes(ext)) return "image";

  return "other";
}

export function isBinaryFile(filename: string): boolean {
  const binaryExtensions = [
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico",
    ".mp3", ".mp4", ".webm", ".ogg", ".wav",
    ".pdf", ".zip", ".gz", ".tar", ".rar",
    ".woff", ".woff2", ".ttf", ".eot",
    ".exe", ".dll", ".so", ".dylib",
    ".bin", ".dat",
  ];
  return binaryExtensions.includes(getExtension(filename));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 255);
}
