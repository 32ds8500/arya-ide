import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { stat, readdir } from 'fs/promises';
import { join, basename } from 'path';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'info';
    const path = searchParams.get('path') || process.cwd();

    switch (action) {
      case 'info': {
        try {
          const stats = await stat(path);
          const isDir = stats.isDirectory();

          let gitInfo: any = {};
          try {
            const { stdout: branch } = await execAsync('git branch --show-current', { cwd: path, timeout: 5000 });
            const { stdout: remote } = await execAsync('git remote get-url origin', { cwd: path, timeout: 5000 }).catch(() => ({ stdout: '' }));
            const { stdout: status } = await execAsync('git status --porcelain', { cwd: path, timeout: 5000 });
            const changedFiles = status.trim().split('\n').filter(Boolean).length;

            gitInfo = {
              branch: branch.trim(),
              remote: remote.trim(),
              changedFiles,
              isRepo: true
            };
          } catch {
            gitInfo = { isRepo: false };
          }

          let languages: Record<string, number> = {};
          if (isDir) {
            try {
              const entries = await readdir(path, { withFileTypes: true });
              const extensions: Record<string, number> = {};

              for (const entry of entries) {
                if (entry.isFile()) {
                  const ext = entry.name.split('.').pop() || 'unknown';
                  extensions[ext] = (extensions[ext] || 0) + 1;
                }
              }

              const extToLang: Record<string, string> = {
                ts: 'TypeScript', tsx: 'TypeScript', js: 'JavaScript', jsx: 'JavaScript',
                py: 'Python', rb: 'Ruby', go: 'Go', rs: 'Rust', java: 'Java',
                cpp: 'C++', c: 'C', cs: 'C#', php: 'PHP', swift: 'Swift',
                kt: 'Kotlin', html: 'HTML', css: 'CSS', json: 'JSON', md: 'Markdown'
              };

              for (const [ext, count] of Object.entries(extensions)) {
                const lang = extToLang[ext] || ext;
                languages[lang] = (languages[lang] || 0) + count;
              }
            } catch {
              // okunamayan dizin
            }
          }

          return NextResponse.json({
            path,
            name: basename(path),
            isDirectory: isDir,
            size: stats.size,
            git: gitInfo,
            languages
          });
        } catch (error: any) {
          return NextResponse.json({ error: `Yol okunamadi: ${error.message}` }, { status: 404 });
        }
      }

      case 'tree': {
        try {
          const maxDepth = parseInt(searchParams.get('depth') || '3');
          const tree = await buildFileTree(path, 0, maxDepth);
          return NextResponse.json({ tree });
        } catch (error: any) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }

      case 'branches': {
        try {
          const { stdout } = await execAsync('git branch -a', { cwd: path, timeout: 5000 });
          const branches = stdout.split('\n').filter(Boolean).map(b => b.trim());
          return NextResponse.json({ branches });
        } catch (error: any) {
          return NextResponse.json({ error: `Git dal bilgisi alinamadi: ${error.message}` }, { status: 500 });
        }
      }

      case 'log': {
        try {
          const count = parseInt(searchParams.get('count') || '20');
          const { stdout } = await execAsync(`git log --oneline -${count}`, { cwd: path, timeout: 10000 });
          const commits = stdout.split('\n').filter(Boolean).map(line => {
            const [hash, ...messageParts] = line.split(' ');
            return { hash, message: messageParts.join(' ') };
          });
          return NextResponse.json({ commits });
        } catch (error: any) {
          return NextResponse.json({ error: `Git log alinamadi: ${error.message}` }, { status: 500 });
        }
      }

      default:
        return NextResponse.json({ error: 'Gecersiz islem' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, path } = body;

    switch (action) {
      case 'clone': {
        const { url, targetPath } = body;
        if (!url) {
          return NextResponse.json({ error: 'URL gerekli' }, { status: 400 });
        }
        const target = targetPath || basename(url.replace('.git', ''));
        await execAsync(`git clone ${url} ${target}`, { timeout: 120000 });
        return NextResponse.json({ success: true, path: target });
      }

      case 'init': {
        if (!path) {
          return NextResponse.json({ error: 'path gerekli' }, { status: 400 });
        }
        await execAsync('git init', { cwd: path, timeout: 10000 });
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Gecersiz islem' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function buildFileTree(dirPath: string, depth: number, maxDepth: number): Promise<any[]> {
  if (depth >= maxDepth) return [];

  const entries = await readdir(dirPath, { withFileTypes: true });
  const tree: any[] = [];

  const ignoreDirs = ['node_modules', '.git', '.next', 'dist', 'build', '.idea'];

  for (const entry of entries) {
    if (ignoreDirs.includes(entry.name)) continue;

    const fullPath = join(dirPath, entry.name);

    if (entry.isDirectory()) {
      const children = await buildFileTree(fullPath, depth + 1, maxDepth);
      tree.push({
        name: entry.name,
        type: 'directory',
        path: fullPath,
        children
      });
    } else {
      tree.push({
        name: entry.name,
        type: 'file',
        path: fullPath
      });
    }
  }

  return tree;
}
