export const dynamic = 'force-static';

import { NextResponse } from 'next/server';
import { getLoads, createLoad } from '@/lib/firestore';

export async function GET() {
  try {
    const loads = await getLoads();
    return NextResponse.json(loads);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const id = await createLoad(body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
