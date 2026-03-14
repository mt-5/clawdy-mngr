import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-connection';
import { tasks, projects, requirements } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';

// GET /api/ai/trigger - Get current AI task or trigger new one
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  }

  // Find a task in todo with lowest position
  const todoTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(asc(tasks.position))
    .limit(1);

  if (todoTasks.length === 0) {
    return NextResponse.json({ task: null, message: 'No tasks in todo' });
  }

  return NextResponse.json({ task: todoTasks[0] });
}

// POST /api/ai/trigger - Pick a task and start working
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { projectId, taskId } = body;

  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  }

  // If taskId provided, use it; otherwise pick first todo task
  let targetTask = taskId
    ? await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1)
    : await db
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, projectId))
        .orderBy(asc(tasks.position))
        .limit(1);

  if (targetTask.length === 0) {
    return NextResponse.json({ error: 'No tasks available' }, { status: 404 });
  }

  const task = targetTask[0];

  // Store snapshot before AI modifies
  const snapshot = JSON.stringify({
    title: task.title,
    description: task.description,
  });

  // Update task status and store snapshot
  const [updated] = await db
    .update(tasks)
    .set({
      status: 'in_progress',
      aiModified: 1,
      aiSnapshot: snapshot,
    })
    .where(eq(tasks.id, task.id))
    .returning();

  return NextResponse.json({ task: updated, message: 'AI started working' });
}
