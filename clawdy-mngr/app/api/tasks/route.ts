import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-connection';
import { tasks } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';

// GET /api/tasks?projectId=xxx - List tasks for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const projectTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .orderBy(desc(tasks.position));

    return NextResponse.json(projectTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, title, description, status, requirementId } = body;

    if (!projectId || !title) {
      return NextResponse.json({ error: 'projectId and title are required' }, { status: 400 });
    }

    const id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Get max position for the column
    const existingTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .orderBy(desc(tasks.position))
      .limit(1);
    
    const maxPosition = existingTasks.length > 0 ? (existingTasks[0].position ?? 0) : 0;
    
    const [task] = await db
      .insert(tasks)
      .values({
        id,
        projectId,
        title,
        description: description || null,
        status: status || 'backlog',
        position: maxPosition + 1,
        requirementId: requirementId || null,
      })
      .returning();

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
