import { NextRequest, NextResponse } from 'next/server';

// In-memory store for AI status (in production, use Redis or DB)
const aiStatus: Record<string, { status: 'idle' | 'working' | 'error'; taskTitle: string | null }> = {};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  }

  const status = aiStatus[projectId] || { status: 'idle', taskTitle: null };
  return NextResponse.json(status);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { projectId, status, taskTitle } = body;

  if (!projectId || !status) {
    return NextResponse.json({ error: 'projectId and status required' }, { status: 400 });
  }

  aiStatus[projectId] = { status, taskTitle: taskTitle || null };
  return NextResponse.json({ success: true });
}
