import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-connection';
import { requirements } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

// GET /api/requirements?projectId=xxx - List requirements for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const projectRequirements = await db
      .select()
      .from(requirements)
      .where(eq(requirements.projectId, projectId))
      .orderBy(desc(requirements.createdAt));

    return NextResponse.json(projectRequirements);
  } catch (error) {
    console.error('Error fetching requirements:', error);
    return NextResponse.json({ error: 'Failed to fetch requirements' }, { status: 500 });
  }
}

// POST /api/requirements - Create a new requirement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, title, description } = body;

    if (!projectId || !title) {
      return NextResponse.json({ error: 'projectId and title are required' }, { status: 400 });
    }

    const id = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const [requirement] = await db
      .insert(requirements)
      .values({
        id,
        projectId,
        title,
        description: description || null,
      })
      .returning();

    return NextResponse.json(requirement, { status: 201 });
  } catch (error) {
    console.error('Error creating requirement:', error);
    return NextResponse.json({ error: 'Failed to create requirement' }, { status: 500 });
  }
}
