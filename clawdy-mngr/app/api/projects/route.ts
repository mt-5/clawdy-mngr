import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-connection';
import { projects } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

// GET /api/projects - List all projects
export async function GET() {
  try {
    const allProjects = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt));
    return NextResponse.json(allProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, emoji, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const id = `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const [project] = await db
      .insert(projects)
      .values({
        id,
        name,
        emoji: emoji || '📁',
        description: description || null,
      })
      .returning();

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
