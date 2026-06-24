export interface DiffLine {
  type: "add" | "remove" | "context";
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface DiffResult {
  hunks: DiffHunk[];
  additions: number;
  deletions: number;
  changes: number;
}

export function computeDiff(oldText: string, newText: string): DiffResult {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const hunks: DiffHunk[] = [];
  let additions = 0;
  let deletions = 0;

  let oldIdx = 0;
  let newIdx = 0;
  let currentHunk: DiffHunk | null = null;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    if (oldIdx < oldLines.length && newIdx < newLines.length) {
      if (oldLines[oldIdx] === newLines[newIdx]) {
        if (currentHunk) {
          hunks.push(currentHunk);
          currentHunk = null;
        }
        oldIdx++;
        newIdx++;
      } else {
        if (!currentHunk) {
          currentHunk = {
            oldStart: oldIdx + 1,
            oldLines: 0,
            newStart: newIdx + 1,
            newLines: 0,
            lines: [],
          };
        }
        currentHunk.lines.push({
          type: "remove",
          content: oldLines[oldIdx],
          oldLineNumber: oldIdx + 1,
        });
        currentHunk.oldLines++;
        deletions++;
        oldIdx++;
      }
    } else if (oldIdx < oldLines.length) {
      if (!currentHunk) {
        currentHunk = {
          oldStart: oldIdx + 1,
          oldLines: 0,
          newStart: newIdx + 1,
          newLines: 0,
          lines: [],
        };
      }
      currentHunk.lines.push({
        type: "remove",
        content: oldLines[oldIdx],
        oldLineNumber: oldIdx + 1,
      });
      currentHunk.oldLines++;
      deletions++;
      oldIdx++;
    } else {
      if (!currentHunk) {
        currentHunk = {
          oldStart: oldIdx + 1,
          oldLines: 0,
          newStart: newIdx + 1,
          newLines: 0,
          lines: [],
        };
      }
      currentHunk.lines.push({
        type: "add",
        content: newLines[newIdx],
        newLineNumber: newIdx + 1,
      });
      currentHunk.newLines++;
      additions++;
      newIdx++;
    }
  }

  if (currentHunk) {
    hunks.push(currentHunk);
  }

  return {
    hunks,
    additions,
    deletions,
    changes: additions + deletions,
  };
}

export function applyPatch(original: string, diff: DiffResult): string {
  const lines = original.split("\n");
  const result: string[] = [];
  let lineIdx = 0;

  for (const hunk of diff.hunks) {
    while (lineIdx < hunk.oldStart - 1 && lineIdx < lines.length) {
      result.push(lines[lineIdx]);
      lineIdx++;
    }

    for (const diffLine of hunk.lines) {
      if (diffLine.type === "add") {
        result.push(diffLine.content);
      } else if (diffLine.type === "remove") {
        lineIdx++;
      }
    }
  }

  while (lineIdx < lines.length) {
    result.push(lines[lineIdx]);
    lineIdx++;
  }

  return result.join("\n");
}

export function formatDiff(diff: DiffResult, opts?: { color?: boolean }): string {
  const parts: string[] = [];

  for (const hunk of diff.hunks) {
    parts.push(
      `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`
    );

    for (const line of hunk.lines) {
      if (opts?.color) {
        if (line.type === "add") {
          parts.push(`\x1b[32m+${line.content}\x1b[0m`);
        } else if (line.type === "remove") {
          parts.push(`\x1b[31m-${line.content}\x1b[0m`);
        } else {
          parts.push(` ${line.content}`);
        }
      } else {
        const prefix = line.type === "add" ? "+" : line.type === "remove" ? "-" : " ";
        parts.push(`${prefix}${line.content}`);
      }
    }
  }

  return parts.join("\n");
}

export function formatDiffStats(diff: DiffResult): string {
  const parts: string[] = [];
  if (diff.additions > 0) parts.push(`+${diff.additions}`);
  if (diff.deletions > 0) parts.push(`-${diff.deletions}`);
  return parts.join(" ");
}
