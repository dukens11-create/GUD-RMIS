export const dynamic = 'force-static';

import { NextResponse } from 'next/server';
import { getDrivers, createDriver } from '@/lib/firestore';

export async function GET() {
  try {
    const drivers = await getDrivers();
    return NextResponse.json(drivers);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const id = await createDriver(body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
