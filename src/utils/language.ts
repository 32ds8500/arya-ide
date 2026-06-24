export interface LanguageInfo {
  id: string;
  name: string;
  extensions: string[];
  icon: string;
  mimeTypes: string[];
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageInfo> = {
  typescript: {
    id: "typescript",
    name: "TypeScript",
    extensions: [".ts", ".tsx"],
    icon: "typescript",
    mimeTypes: ["text/typescript", "application/typescript"],
  },
  javascript: {
    id: "javascript",
    name: "JavaScript",
    extensions: [".js", ".jsx", ".mjs", ".cjs"],
    icon: "javascript",
    mimeTypes: ["text/javascript", "application/javascript"],
  },
  python: {
    id: "python",
    name: "Python",
    extensions: [".py", ".pyw"],
    icon: "python",
    mimeTypes: ["text/x-python", "application/x-python"],
  },
  rust: {
    id: "rust",
    name: "Rust",
    extensions: [".rs"],
    icon: "rust",
    mimeTypes: ["text/x-rust"],
  },
  go: {
    id: "go",
    name: "Go",
    extensions: [".go"],
    icon: "go",
    mimeTypes: ["text/x-go"],
  },
  java: {
    id: "java",
    name: "Java",
    extensions: [".java"],
    icon: "java",
    mimeTypes: ["text/x-java"],
  },
  cpp: {
    id: "cpp",
    name: "C++",
    extensions: [".cpp", ".cc", ".cxx", ".c++", ".hpp"],
    icon: "cpp",
    mimeTypes: ["text/x-c++src"],
  },
  c: {
    id: "c",
    name: "C",
    extensions: [".c", ".h"],
    icon: "c",
    mimeTypes: ["text/x-c"],
  },
  csharp: {
    id: "csharp",
    name: "C#",
    extensions: [".cs"],
    icon: "csharp",
    mimeTypes: ["text/x-csharp"],
  },
  php: {
    id: "php",
    name: "PHP",
    extensions: [".php"],
    icon: "php",
    mimeTypes: ["text/x-php"],
  },
  ruby: {
    id: "ruby",
    name: "Ruby",
    extensions: [".rb", ".erb"],
    icon: "ruby",
    mimeTypes: ["text/x-ruby"],
  },
  swift: {
    id: "swift",
    name: "Swift",
    extensions: [".swift"],
    icon: "swift",
    mimeTypes: ["text/x-swift"],
  },
  kotlin: {
    id: "kotlin",
    name: "Kotlin",
    extensions: [".kt", ".kts"],
    icon: "kotlin",
    mimeTypes: ["text/x-kotlin"],
  },
  html: {
    id: "html",
    name: "HTML",
    extensions: [".html", ".htm"],
    icon: "html",
    mimeTypes: ["text/html"],
  },
  css: {
    id: "css",
    name: "CSS",
    extensions: [".css", ".scss", ".sass", ".less"],
    icon: "css",
    mimeTypes: ["text/css"],
  },
  json: {
    id: "json",
    name: "JSON",
    extensions: [".json"],
    icon: "json",
    mimeTypes: ["application/json"],
  },
  yaml: {
    id: "yaml",
    name: "YAML",
    extensions: [".yaml", ".yml"],
    icon: "yaml",
    mimeTypes: ["text/yaml", "application/x-yaml"],
  },
  markdown: {
    id: "markdown",
    name: "Markdown",
    extensions: [".md", ".mdx"],
    icon: "markdown",
    mimeTypes: ["text/markdown"],
  },
  sql: {
    id: "sql",
    name: "SQL",
    extensions: [".sql"],
    icon: "sql",
    mimeTypes: ["text/x-sql"],
  },
  shell: {
    id: "shell",
    name: "Shell",
    extensions: [".sh", ".bash", ".zsh"],
    icon: "shell",
    mimeTypes: ["text/x-shellscript"],
  },
  dockerfile: {
    id: "dockerfile",
    name: "Dockerfile",
    extensions: ["Dockerfile", ".dockerfile"],
    icon: "docker",
    mimeTypes: ["text/x-dockerfile"],
  },
  xml: {
    id: "xml",
    name: "XML",
    extensions: [".xml"],
    icon: "xml",
    mimeTypes: ["text/xml", "application/xml"],
  },
  graphql: {
    id: "graphql",
    name: "GraphQL",
    extensions: [".graphql", ".gql"],
    icon: "graphql",
    mimeTypes: ["application/graphql"],
  },
  lua: {
    id: "lua",
    name: "Lua",
    extensions: [".lua"],
    icon: "lua",
    mimeTypes: ["text/x-lua"],
  },
  dart: {
    id: "dart",
    name: "Dart",
    extensions: [".dart"],
    icon: "dart",
    mimeTypes: ["text/x-dart"],
  },
  scala: {
    id: "scala",
    name: "Scala",
    extensions: [".scala"],
    icon: "scala",
    mimeTypes: ["text/x-scala"],
  },
  elixir: {
    id: "elixir",
    name: "Elixir",
    extensions: [".ex", ".exs"],
    icon: "elixir",
    mimeTypes: ["text/x-elixir"],
  },
  clojure: {
    id: "clojure",
    name: "Clojure",
    extensions: [".clj", ".cljs", ".cljc"],
    icon: "clojure",
    mimeTypes: ["text/x-clojure"],
  },
  text: {
    id: "text",
    name: "Plain Text",
    extensions: [".txt", ".log"],
    icon: "text",
    mimeTypes: ["text/plain"],
  },
};

const EXTENSION_MAP: Record<string, string> = {};

for (const [langId, lang] of Object.entries(SUPPORTED_LANGUAGES)) {
  for (const ext of lang.extensions) {
    EXTENSION_MAP[ext.toLowerCase()] = langId;
  }
}

export function detectLanguage(filename: string): LanguageInfo {
  const ext = `.${  filename.split(".").pop()?.toLowerCase()}`;

  if (filename === "Dockerfile" || filename.endsWith(".dockerfile")) {
    return SUPPORTED_LANGUAGES.dockerfile;
  }

  const langId = EXTENSION_MAP[ext];
  if (langId && SUPPORTED_LANGUAGES[langId]) {
    return SUPPORTED_LANGUAGES[langId];
  }

  return SUPPORTED_LANGUAGES.text;
}

export function getLanguageById(id: string): LanguageInfo | undefined {
  return SUPPORTED_LANGUAGES[id];
}

export function getLanguageIcon(filename: string): string {
  return detectLanguage(filename).icon;
}

export function getLanguageByExtension(ext: string): LanguageInfo | undefined {
  const normalized = ext.startsWith(".") ? ext : `.${ext}`;
  const langId = EXTENSION_MAP[normalized.toLowerCase()];
  return langId ? SUPPORTED_LANGUAGES[langId] : undefined;
}

export function getLanguageMimeTypes(filename: string): string[] {
  return detectLanguage(filename).mimeTypes;
}
