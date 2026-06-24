import { NextRequest, NextResponse } from 'next/server';
import { orchestrator } from '@/ai/subagents';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const id = searchParams.get('id');

    switch (action) {
      case 'list': {
        const agents = orchestrator.listActive();
        return NextResponse.json({ agents });
      }

      case 'listAll': {
        const agents = orchestrator.listAll();
        return NextResponse.json({ agents });
      }

      case 'status': {
        if (!id) {
          return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
        }
        const status = orchestrator.getAgentStatus(id);
        return NextResponse.json({ status });
      }

      case 'wait': {
        if (!id) {
          return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
        }
        const timeout = parseInt(searchParams.get('timeout') || '300000');
        const result = await orchestrator.waitForAgent(id, timeout);
        return NextResponse.json({ result });
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
    const { action, id, type, prompt, context, parentId, timeout, maxRetries, model, provider, tools, newConfig } = body;

    switch (action) {
      case 'spawn': {
        if (!prompt) {
          return NextResponse.json({ error: 'prompt gerekli' }, { status: 400 });
        }
        const subagentId = await orchestrator.spawnAgent({
          id: id || `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          type: type || 'builder',
          prompt,
          context,
          parentId,
          timeout,
          maxRetries,
          model,
          provider,
          tools
        });
        return NextResponse.json({ id: subagentId });
      }

      case 'terminate': {
        if (!id) {
          return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
        }
        const success = await orchestrator.terminateAgent(id);
        return NextResponse.json({ success });
      }

      case 'pause': {
        if (!id) {
          return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
        }
        const success = orchestrator.pauseAgent(id);
        return NextResponse.json({ success });
      }

      case 'resume': {
        if (!id) {
          return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
        }
        const success = orchestrator.resumeAgent(id);
        return NextResponse.json({ success });
      }

      case 'handoff': {
        if (!id) {
          return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
        }
        const newId = await orchestrator.handoffAgent(id, newConfig || {});
        return NextResponse.json({ id: newId });
      }

      default:
        return NextResponse.json({ error: 'Gecersiz islem' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
