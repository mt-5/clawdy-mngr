import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-connection';
import { requirements } from '@/lib/db';
import { eq } from 'drizzle-orm';

// GET /api/requirements/[id] - Get a single requirement
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [requirement] = await db
      .select()
      .from(requirements)
      .where(eq(requirements.id, id))
      .limit(1);

    if (!requirement) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    return NextResponse.json(requirement);
  } catch (error) {
    console.error('Error fetching requirement:', error);
    return NextResponse.json({ error: 'Failed to fetch requirement' }, { status: 500 });
  }
}

// PUT /api/requirements/[id] - Update a requirement
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, status, testResult } = body;

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (testResult !== undefined) updateData.testResult = testResult;

    const [requirement] = await db
      .update(requirements)
      .set(updateData)
      .where(eq(requirements.id, id))
      .returning();

    if (!requirement) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    return NextResponse.json(requirement);
  } catch (error) {
    console.error('Error updating requirement:', error);
    return NextResponse.json({ error: 'Failed to update requirement' }, { status: 500 });
  }
}

// DELETE /api/requirements/[id] - Delete a requirement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const [requirement] = await db
      .delete(requirements)
      .where(eq(requirements.id, id))
      .returning();

    if (!requirement) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting requirement:', error);
    return NextResponse.json({ error: 'Failed to delete requirement' }, { status: 500 });
  }
}
