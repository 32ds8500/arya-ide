export function extractCodeBlocks(markdown: string): Array<{
  language: string;
  code: string;
  startLine?: number;
}> {
  const blocks: Array<{ language: string; code: string; startLine?: number }> = [];
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;

  const lines = markdown.split("\n");
  const currentLine = 1;

  while ((match = regex.exec(markdown)) !== null) {
    const beforeMatch = markdown.slice(0, match.index);
    const lineOffset = beforeMatch.split("\n").length;

    blocks.push({
      language: match[1] ?? "text",
      code: match[2].trimEnd(),
      startLine: lineOffset,
    });
  }

  return blocks;
}

export function extractLinks(markdown: string): Array<{
  text: string;
  url: string;
  isImage?: boolean;
}> {
  const links: Array<{ text: string; url: string; isImage?: boolean }> = [];
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  let match;

  while ((match = imageRegex.exec(markdown)) !== null) {
    links.push({ text: match[1], url: match[2], isImage: true });
  }

  while ((match = linkRegex.exec(markdown)) !== null) {
    if (!markdown.slice(Math.max(0, match.index - 1), match.index).startsWith("!")) {
      links.push({ text: match[1], url: match[2] });
    }
  }

  return links;
}

export function extractHeadings(markdown: string): Array<{
  level: number;
  text: string;
  id: string;
}> {
  const headings: Array<{ level: number; text: string; id: string }> = [];
  const regex = /^(#{1,6})\s+(.+)$/gm;
  let match;

  while ((match = regex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].replace(/[*_`~]/g, "").trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    headings.push({ level, text, id });
  }

  return headings;
}

export function extractFrontmatter(markdown: string): {
  data: Record<string, unknown>;
  content: string;
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);

  if (!match) {
    return { data: {}, content: markdown };
  }

  const data: Record<string, unknown> = {};
  const lines = match[1].split("\n");

  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    let value: unknown = line.slice(colonIdx + 1).trim();

    if (value === "true") value = true;
    else if (value === "false") value = false;
    else if (!isNaN(Number(value))) value = Number(value);

    data[key] = value;
  }

  return { data, content: match[2] };
}

export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/---+/g, "")
    .trim();
}

export function formatMarkdown(text: string): string {
  return text
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function renderInlineCode(code: string): string {
  return code.replace(/`([^`]+)`/g, "<code>$1</code>");
}

export function truncateMarkdown(markdown: string, maxLength: number): string {
  if (markdown.length <= maxLength) return markdown;

  const stripped = stripMarkdown(markdown);
  if (stripped.length <= maxLength) return stripped;

  return `${stripped.slice(0, maxLength - 3)  }...`;
}
