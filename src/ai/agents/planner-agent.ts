import { BaseAgent } from './base-agent';
import { AgentConfig, TaskPlan, TaskNode, Milestone, Checkpoint } from './types';

const PLANNER_SYSTEM_PROMPT = `Sen bir Planlama Agent'sın. Görevleri analiz edip alt görevlere ayırıyorsun.

Sorumlulukların:
- Karmaşık görevleri basit adımlara böl
- Görevler arası bağımlılıkları belirle
- Sıralı执行 planı oluştur
- Kilometre taşları ve kontrol noktaları tanımla

Çıktı formatın JSON olmalı:
{
  "goal": "ana_görev",
  "tasks": [
    {
      "id": "t1",
      "title": "görev başlığı",
      "description": "açıklama",
      "dependencies": [],
      "subtasks": []
    }
  ],
  "milestones": [
    {
      "id": "m1",
      "name": "kilometre taşı adı",
      "tasks": ["t1", "t2"]
    }
  ]
}

Her zaman Türkçe düşün ve yanıt ver. Görevleri mantıksal sıraya koy.`;

export class PlannerAgent extends BaseAgent {
  constructor(config: Partial<AgentConfig> = {}) {
    super({
      id: config.id || `planner_${Date.now()}`,
      type: 'planner',
      name: config.name || 'Planlama Agent',
      systemPrompt: PLANNER_SYSTEM_PROMPT,
      tools: config.tools || ['file_read', 'search_files', 'ripgrep_search'],
      maxSteps: config.maxSteps || 5,
      model: config.model || 'llama3.2',
      provider: config.provider || 'ollama',
      ...config
    });
  }

  getSystemPrompt(): string {
    return PLANNER_SYSTEM_PROMPT;
  }

  async execute(input: string): Promise<string> {
    return super.execute(`Bu görevi analiz et ve bir plan oluştur:\n\n${input}`);
  }

  async createPlan(goal: string): Promise<TaskPlan> {
    const result = await this.execute(goal);

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          id: `plan_${Date.now()}`,
          goal: parsed.goal || goal,
          tasks: this.parseTasks(parsed.tasks || []),
          milestones: this.parseMilestones(parsed.milestones || [], parsed.tasks || []),
          checkpoints: [],
          createdAt: new Date()
        };
      }
    } catch {
      // JSON parse hatası
    }

    return {
      id: `plan_${Date.now()}`,
      goal,
      tasks: [{
        id: 't1',
        title: goal,
        description: result,
        dependencies: [],
        status: 'pending',
        subtasks: []
      }],
      milestones: [],
      checkpoints: [],
      createdAt: new Date()
    };
  }

  private parseTasks(tasks: any[]): TaskNode[] {
    return (tasks || []).map((t: any) => ({
      id: t.id || `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: t.title || 'Görev',
      description: t.description || '',
      dependencies: t.dependencies || [],
      status: 'pending' as const,
      subtasks: this.parseTasks(t.subtasks || [])
    }));
  }

  private parseMilestones(milestones: any[], tasks: any[]): Milestone[] {
    return (milestones || []).map((m: any) => ({
      id: m.id || `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: m.name || 'Kilometre Taşı',
      tasks: m.tasks || [],
      completed: false
    }));
  }
}
