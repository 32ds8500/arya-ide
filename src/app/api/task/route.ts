import { NextRequest, NextResponse } from 'next/server';
import { planningEngine } from '@/ai/planner';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');
    const status = searchParams.get('status') as any;

    if (planId) {
      const plan = planningEngine.getPlan(planId);
      if (!plan) {
        return NextResponse.json({ error: 'Plan bulunamadi' }, { status: 404 });
      }
      return NextResponse.json({ plan });
    }

    const plans = planningEngine.listPlans(status);
    return NextResponse.json({ plans });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, planId, name, goal, tasks, taskId, status, result, error: taskError } = body;

    switch (action) {
      case 'create': {
        const plan = planningEngine.createPlan(name || 'Yeni Plan', goal || '', tasks || []);
        return NextResponse.json({ plan });
      }

      case 'start': {
        if (!planId) return NextResponse.json({ error: 'planId gerekli' }, { status: 400 });
        const success = planningEngine.startPlan(planId);
        return NextResponse.json({ success });
      }

      case 'updateTask': {
        if (!planId || !taskId) {
          return NextResponse.json({ error: 'planId ve taskId gerekli' }, { status: 400 });
        }
        const updated = planningEngine.updateTaskStatus(planId, taskId, status, result, taskError);
        return NextResponse.json({ success: updated });
      }

      case 'addMilestone': {
        if (!planId) return NextResponse.json({ error: 'planId gerekli' }, { status: 400 });
        const milestone = planningEngine.addMilestone(planId, body.milestoneName || '', body.description || '', body.taskIds || []);
        return NextResponse.json({ milestone });
      }

      case 'checkpoint': {
        if (!planId || !taskId) {
          return NextResponse.json({ error: 'planId ve taskId gerekli' }, { status: 400 });
        }
        const checkpoint = planningEngine.createCheckpoint(planId, taskId, body.state || 'saved', body.data || {});
        return NextResponse.json({ checkpoint });
      }

      case 'rollback': {
        if (!planId || !body.rollbackPointId) {
          return NextResponse.json({ error: 'planId ve rollbackPointId gerekli' }, { status: 400 });
        }
        const rolled = planningEngine.rollback(planId, body.rollbackPointId);
        return NextResponse.json({ success: rolled });
      }

      case 'getReadyTasks': {
        if (!planId) return NextResponse.json({ error: 'planId gerekli' }, { status: 400 });
        const readyTasks = planningEngine.getReadyTasks(planId);
        return NextResponse.json({ tasks: readyTasks });
      }

      case 'getDependencyGraph': {
        if (!planId) return NextResponse.json({ error: 'planId gerekli' }, { status: 400 });
        const graph = planningEngine.buildDependencyGraph(planId);
        return NextResponse.json({ graph });
      }

      default:
        return NextResponse.json({ error: 'Gecersiz islem' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');
    if (!planId) {
      return NextResponse.json({ error: 'planId gerekli' }, { status: 400 });
    }
    const deleted = planningEngine.deletePlan(planId);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
