import { NextResponse } from 'next/server';
import { getMockTrees } from '@/lib/api/mock/trees';

/** GET /api/trees/[id] — single tree detail (#532, #533). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tree = getMockTrees().find((t) => t.id === id || t.treeId === id);

  if (!tree) {
    return NextResponse.json({ error: 'TREE_NOT_FOUND' }, { status: 404 });
  }

  return NextResponse.json({ tree });
}
