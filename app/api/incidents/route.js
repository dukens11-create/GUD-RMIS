export const dynamic = 'force-static';

import { NextResponse } from 'next/server';
import { getAll, create } from '@/lib/firestore';
import { COLLECTIONS } from '@/lib/constants';

export async function GET() {
  try {
    const incidents = await getAll(COLLECTIONS.INCIDENTS);
    return NextResponse.json(incidents);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const id = await create(COLLECTIONS.INCIDENTS, body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
