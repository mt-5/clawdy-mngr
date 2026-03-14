import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-connection';
import { tasks } from '@/lib/db';
import { eq } from 'drizzle-orm';

// POST /api/tasks/[id]/revert - Revert AI changes
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (!task.aiSnapshot) {
      return NextResponse.json({ error: 'No AI snapshot to revert' }, { status: 400 });
    }

    const snapshot = JSON.parse(task.aiSnapshot);

    // Restore from snapshot and move to todo
    const [updated] = await db
      .update(tasks)
      .set({
        title: snapshot.title,
        description: snapshot.description,
        status: 'todo',
        aiModified: 0,
        aiSnapshot: null,
      })
      .where(eq(tasks.id, id))
      .returning();

    return NextResponse.json({ task: updated });
  } catch (error) {
    console.error('Error reverting AI:', error);
    return NextResponse.json({ error: 'Failed to revert' }, { status: 500 });
  }
}
