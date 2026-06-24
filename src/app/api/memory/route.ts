import { NextRequest, NextResponse } from 'next/server';
import { memoryManager } from '@/ai/memory';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'search';
    const query = searchParams.get('q') || '';
    const scope = searchParams.get('scope') as any;
    const type = searchParams.get('type') as any;
    const limit = parseInt(searchParams.get('limit') || '10');

    switch (action) {
      case 'search': {
        const results = memoryManager.searchMemory({ text: query, scope, type, limit });
        return NextResponse.json({ results });
      }

      case 'rank': {
        const ranked = memoryManager.rankMemories(query, limit);
        return NextResponse.json({ results: ranked });
      }

      case 'stats': {
        const stats = memoryManager.getStats();
        return NextResponse.json({ stats });
      }

      case 'list': {
        const store = memoryManager.getStore(scope || 'global');
        const entries = store.list(scope, type);
        return NextResponse.json({ entries });
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
    const { action, key, content, scope, type, tags, scopeId, id } = body;

    switch (action) {
      case 'save': {
        if (!key || !content) {
          return NextResponse.json({ error: 'key ve content gerekli' }, { status: 400 });
        }
        const entry = memoryManager.saveMemory({ key, content, scope, type, tags, scopeId });
        return NextResponse.json({ entry });
      }

      case 'retrieve': {
        if (!id) {
          return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
        }
        const entry = memoryManager.retrieveMemory(id, scope);
        return NextResponse.json({ entry });
      }

      case 'delete': {
        if (!id) {
          return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
        }
        const deleted = memoryManager.deleteMemory(id);
        return NextResponse.json({ success: deleted });
      }

      case 'archive': {
        if (!id) {
          return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
        }
        const archived = memoryManager.archiveMemory(id);
        return NextResponse.json({ success: archived });
      }

      case 'export': {
        const data = memoryManager.exportAll();
        return NextResponse.json({ data });
      }

      case 'import': {
        if (!body.data) {
          return NextResponse.json({ error: 'data gerekli' }, { status: 400 });
        }
        memoryManager.importAll(body.data);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Gecersiz islem' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
