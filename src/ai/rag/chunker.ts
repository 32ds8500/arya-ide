export interface ChunkingOptions {
  filePath?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  strategy?: 'lines' | 'paragraphs' | 'ast' | 'semantic';
}

export interface Chunk {
  id: string;
  filePath: string;
  chunkIndex: number;
  content: string;
  startLine: number;
  endLine: number;
  metadata: {
    totalChunks: number;
    wordCount: number;
    charCount: number;
  };
}

export function chunkFile(
  content: string,
  options: ChunkingOptions = {}
): Chunk[] {
  const {
    filePath = '',
    chunkSize = 1000,
    chunkOverlap = 200,
    strategy = 'semantic'
  } = options;

  switch (strategy) {
    case 'lines':
      return chunkByLines(content, filePath, chunkSize, chunkOverlap);
    case 'paragraphs':
      return chunkByParagraphs(content, filePath, chunkSize, chunkOverlap);
    case 'ast':
      return chunkByAST(content, filePath, chunkSize, chunkOverlap);
    case 'semantic':
    default:
      return chunkSemantic(content, filePath, chunkSize, chunkOverlap);
  }
}

function chunkByLines(
  content: string,
  filePath: string,
  chunkSize: number,
  chunkOverlap: number
): Chunk[] {
  const lines = content.split('\n');
  const chunks: Chunk[] = [];
  const linesPerChunk = Math.max(1, Math.floor(chunkSize / 50));
  const overlapLines = Math.floor(linesPerChunk * (chunkOverlap / chunkSize));

  let start = 0;
  let chunkIndex = 0;

  while (start < lines.length) {
    const end = Math.min(start + linesPerChunk, lines.length);
    const chunkContent = lines.slice(start, end).join('\n');

    if (chunkContent.trim().length > 0) {
      chunks.push(createChunk(filePath, chunkIndex, chunkContent, start + 1, end, chunks.length + 1));
      chunkIndex++;
    }

    start = end - overlapLines;
    if (start >= lines.length - overlapLines) break;
  }

  return chunks;
}

function chunkByParagraphs(
  content: string,
  filePath: string,
  chunkSize: number,
  chunkOverlap: number
): Chunk[] {
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const chunks: Chunk[] = [];
  
  let currentChunk = '';
  let currentStart = 1;
  let chunkIndex = 0;
  const lines = content.split('\n');

  for (const paragraph of paragraphs) {
    const paragraphLines = paragraph.split('\n').length;
    
    if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
      const endLine = currentStart + currentChunk.split('\n').length - 1;
      chunks.push(createChunk(filePath, chunkIndex, currentChunk.trim(), currentStart, endLine, chunks.length + 1));
      chunkIndex++;
      
      const overlapText = currentChunk.slice(-chunkOverlap);
      currentChunk = `${overlapText  }\n\n${  paragraph}`;
      currentStart = endLine - overlapText.split('\n').length + 1;
    } else {
      if (currentChunk) currentChunk += '\n\n';
      currentChunk += paragraph;
    }
  }

  if (currentChunk.trim().length > 0) {
    const startLine = lines.indexOf(currentChunk.split('\n')[0]) + 1;
    chunks.push(createChunk(filePath, chunkIndex, currentChunk.trim(), startLine, startLine + currentChunk.split('\n').length - 1, chunks.length + 1));
  }

  return chunks;
}

function chunkByAST(
  content: string,
  filePath: string,
  chunkSize: number,
  chunkOverlap: number
): Chunk[] {
  const boundaries = findASTBoundaries(content);
  
  if (boundaries.length === 0) {
    return chunkByLines(content, filePath, chunkSize, chunkOverlap);
  }

  const chunks: Chunk[] = [];
  let chunkIndex = 0;

  for (const boundary of boundaries) {
    if (boundary.content.length <= chunkSize) {
      chunks.push(createChunk(filePath, chunkIndex, boundary.content, boundary.startLine, boundary.endLine, boundaries.length));
      chunkIndex++;
    } else {
      const subChunks = chunkByLines(boundary.content, filePath, chunkSize, chunkOverlap);
      for (const subChunk of subChunks) {
        chunks.push({
          ...subChunk,
          id: `${filePath}_${chunkIndex}`,
          filePath,
          chunkIndex,
          startLine: boundary.startLine + subChunk.startLine - 1,
          endLine: boundary.startLine + subChunk.endLine - 1
        });
        chunkIndex++;
      }
    }
  }

  return chunks;
}

function chunkSemantic(
  content: string,
  filePath: string,
  chunkSize: number,
  chunkOverlap: number
): Chunk[] {
  const boundaries = findSemanticBoundaries(content);
  
  if (boundaries.length <= 1) {
    return chunkByLines(content, filePath, chunkSize, chunkOverlap);
  }

  const chunks: Chunk[] = [];
  let currentChunk = '';
  let currentStart = 1;
  let chunkIndex = 0;

  for (let i = 0; i < boundaries.length; i++) {
    const boundary = boundaries[i];
    
    if (currentChunk.length + boundary.content.length > chunkSize && currentChunk.length > 0) {
      chunks.push(createChunk(filePath, chunkIndex, currentChunk.trim(), currentStart, boundary.startLine - 1, boundaries.length));
      chunkIndex++;
      
      const overlapText = currentChunk.slice(-chunkOverlap);
      currentChunk = `${overlapText  }\n${  boundary.content}`;
      currentStart = boundary.startLine - overlapText.split('\n').length + 1;
    } else {
      if (currentChunk) currentChunk += '\n';
      currentChunk += boundary.content;
      if (currentStart === 0) currentStart = boundary.startLine;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(createChunk(filePath, chunkIndex, currentChunk.trim(), currentStart, content.split('\n').length, boundaries.length));
  }

  return chunks;
}

interface SemanticBoundary {
  content: string;
  startLine: number;
  endLine: number;
  type: 'function' | 'class' | 'import' | 'comment' | 'code';
}

function findSemanticBoundaries(content: string): SemanticBoundary[] {
  const lines = content.split('\n');
  const boundaries: SemanticBoundary[] = [];
  let currentBlock = '';
  let currentStart = 0;
  let currentType: SemanticBoundary['type'] = 'code';
  let braceCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
      if (currentBlock && currentType !== 'import') {
        boundaries.push({ content: currentBlock, startLine: currentStart + 1, endLine: i, type: currentType });
        currentBlock = '';
      }
      currentType = 'import';
      if (!currentBlock) currentStart = i;
      currentBlock += `${line  }\n`;
      continue;
    }

    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      if (currentBlock && currentType !== 'comment') {
        boundaries.push({ content: currentBlock, startLine: currentStart + 1, endLine: i, type: currentType });
        currentBlock = '';
      }
      currentType = 'comment';
      if (!currentBlock) currentStart = i;
      currentBlock += `${line  }\n`;
      continue;
    }

    if (trimmed.match(/^(export\s+)?(async\s+)?function\s+/) || trimmed.match(/^(export\s+)?(const|let|var)\s+\w+\s*=\s*(async\s+)?\(/)) {
      if (currentBlock) {
        boundaries.push({ content: currentBlock, startLine: currentStart + 1, endLine: i, type: currentType });
        currentBlock = '';
      }
      currentType = 'function';
      currentStart = i;
      currentBlock += `${line  }\n`;
      braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      continue;
    }

    if (trimmed.match(/^(export\s+)?(abstract\s+)?class\s+/)) {
      if (currentBlock) {
        boundaries.push({ content: currentBlock, startLine: currentStart + 1, endLine: i, type: currentType });
        currentBlock = '';
      }
      currentType = 'class';
      currentStart = i;
      currentBlock += `${line  }\n`;
      braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      continue;
    }

    if (currentType === 'function' || currentType === 'class') {
      braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      currentBlock += `${line  }\n`;

      if (braceCount <= 0 && currentBlock.includes('{')) {
        boundaries.push({ content: currentBlock, startLine: currentStart + 1, endLine: i + 1, type: currentType });
        currentBlock = '';
        currentType = 'code';
        braceCount = 0;
      }
      continue;
    }

    if (currentBlock && (currentType === 'import' || currentType === 'comment')) {
      boundaries.push({ content: currentBlock, startLine: currentStart + 1, endLine: i, type: currentType });
      currentBlock = '';
    }

    if (!currentBlock) currentStart = i;
    currentType = 'code';
    currentBlock += `${line  }\n`;
  }

  if (currentBlock.trim()) {
    boundaries.push({ content: currentBlock, startLine: currentStart + 1, endLine: lines.length, type: currentType });
  }

  return boundaries;
}

function findASTBoundaries(content: string): SemanticBoundary[] {
  return findSemanticBoundaries(content);
}

function createChunk(
  filePath: string,
  chunkIndex: number,
  content: string,
  startLine: number,
  endLine: number,
  totalChunks: number
): Chunk {
  const words = content.split(/\s+/).filter(w => w.length > 0);
  return {
    id: `${filePath}_${chunkIndex}`,
    filePath,
    chunkIndex,
    content,
    startLine,
    endLine,
    metadata: {
      totalChunks,
      wordCount: words.length,
      charCount: content.length
    }
  };
}
