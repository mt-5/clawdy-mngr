import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-connection';
import { tasks } from '@/lib/db';
import { eq } from 'drizzle-orm';

// POST /api/ai/stop - Stop AI and move task back to todo
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { taskId } = body;

  if (!taskId) {
    return NextResponse.json({ error: 'taskId required' }, { status: 400 });
  }

  try {
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Move back to todo
    const [updated] = await db
      .update(tasks)
      .set({
        status: 'todo',
      })
      .where(eq(tasks.id, taskId))
      .returning();

    return NextResponse.json({ task: updated, message: 'AI stopped' });
  } catch (error) {
    console.error('Error stopping AI:', error);
    return NextResponse.json({ error: 'Failed to stop AI' }, { status: 500 });
  }
}
