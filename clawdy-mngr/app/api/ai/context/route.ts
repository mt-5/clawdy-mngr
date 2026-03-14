import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-connection';
import { tasks, projects, requirements } from '@/lib/db';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

// GET /api/ai/context?projectId=xxx - Get full context for AI
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  }

  try {
    // Get project
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get all tasks
    const projectTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId));

    // Get requirements
    const projectRequirements = await db
      .select()
      .from(requirements)
      .where(eq(requirements.projectId, projectId));

    // Get docs if they exist
    let docs = '';
    const docsPath = path.join(process.cwd(), 'docs');
    try {
      if (fs.existsSync(docsPath)) {
        const files = fs.readdirSync(docsPath);
        for (const file of files) {
          if (file.endsWith('.md')) {
            docs += `\n\n# ${file}\n\n` + fs.readFileSync(path.join(docsPath, file), 'utf-8');
          }
        }
      }
    } catch {
      // Ignore errors reading docs
    }

    const context = {
      project: {
        name: project.name,
        emoji: project.emoji,
        description: project.description,
      },
      tasks: projectTasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        position: t.position,
      })),
      requirements: projectRequirements.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        status: r.status,
      })),
      docs,
    };

    return NextResponse.json(context);
  } catch (error) {
    console.error('Error fetching AI context:', error);
    return NextResponse.json({ error: 'Failed to fetch context' }, { status: 500 });
  }
}
