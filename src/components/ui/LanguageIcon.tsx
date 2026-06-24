import * as React from "react";
import { cn } from "@/lib/utils";

type Language =
  | "javascript"
  | "typescript"
  | "python"
  | "go"
  | "rust"
  | "java"
  | "c"
  | "cpp"
  | "csharp"
  | "ruby"
  | "php"
  | "swift"
  | "kotlin"
  | "html"
  | "css"
  | "json"
  | "yaml"
  | "markdown"
  | "sql"
  | "bash"
  | "docker"
  | "graphql";

interface LanguageIconProps {
  language: Language;
  className?: string;
  size?: number;
}

const languageConfig: Record<Language, { color: string; label: string; letter: string }> = {
  javascript: { color: "#F7DF1E", label: "JavaScript", letter: "JS" },
  typescript: { color: "#3178C6", label: "TypeScript", letter: "TS" },
  python: { color: "#3776AB", label: "Python", letter: "PY" },
  go: { color: "#00ADD8", label: "Go", letter: "Go" },
  rust: { color: "#DEA584", label: "Rust", letter: "Rs" },
  java: { color: "#ED8B00", label: "Java", letter: "Ja" },
  c: { color: "#A8B9CC", label: "C", letter: "C" },
  cpp: { color: "#00599C", label: "C++", letter: "C+" },
  csharp: { color: "#239120", label: "C#", letter: "C#" },
  ruby: { color: "#CC342D", label: "Ruby", letter: "Rb" },
  php: { color: "#777BB4", label: "PHP", letter: "Ph" },
  swift: { color: "#FA7343", label: "Swift", letter: "Sw" },
  kotlin: { color: "#7F52FF", label: "Kotlin", letter: "Kt" },
  html: { color: "#E34F26", label: "HTML", letter: "H5" },
  css: { color: "#1572B6", label: "CSS", letter: "CS" },
  json: { color: "#292929", label: "JSON", letter: "{}" },
  yaml: { color: "#CB171E", label: "YAML", letter: "YA" },
  markdown: { color: "#083FA1", label: "Markdown", letter: "MD" },
  sql: { color: "#4479A1", label: "SQL", letter: "SQ" },
  bash: { color: "#4EAA25", label: "Bash", letter: "SH" },
  docker: { color: "#2496ED", label: "Docker", letter: "DK" },
  graphql: { color: "#E10098", label: "GraphQL", letter: "GQ" },
};

export function LanguageIcon({ language, className, size = 20 }: LanguageIconProps) {
  const config = languageConfig[language] ?? {
    color: "#6B7280",
    label: language,
    letter: language.slice(0, 2).toUpperCase(),
  };

  return (
    <div
      className={cn("inline-flex items-center justify-center rounded font-mono font-bold", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        backgroundColor: `${config.color  }20`,
        color: config.color,
      }}
      title={config.label}
    >
      {config.letter}
    </div>
  );
}

export function getLanguageFromFilename(filename: string): Language | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  const mapping: Record<string, Language> = {
    js: "javascript",
    jsx: "javascript",
    mjs: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    go: "go",
    rs: "rust",
    java: "java",
    c: "c",
    h: "c",
    cpp: "cpp",
    cxx: "cpp",
    hpp: "cpp",
    cs: "csharp",
    rb: "ruby",
    php: "php",
    swift: "swift",
    kt: "kotlin",
    html: "html",
    htm: "html",
    css: "css",
    scss: "css",
    less: "css",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    md: "markdown",
    sql: "sql",
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    dockerfile: "docker",
    graphql: "graphql",
    gql: "graphql",
  };
  return ext ? (mapping[ext] ?? null) : null;
}
