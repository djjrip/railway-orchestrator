import { NextResponse } from 'next/server';
import { getDriver, getAllContainers, CloudProvider } from '@/lib/drivers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const providerParam = searchParams.get('provider') || 'all';

  try {
    if (providerParam === 'all') {
      const data = await getAllContainers();
      return NextResponse.json({ ...data, provider: 'all' });
    }

    const driver = getDriver(providerParam as CloudProvider);
    const data = await driver.listContainers();
    return NextResponse.json({ ...data, provider: providerParam });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Orchestrator query error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const provider = (body.provider || 'railway') as CloudProvider;
    const driver = getDriver(provider);

    const result = await driver.spinUp({
      name: body.name,
      image: body.image,
      region: body.region
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Container spin-up error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const provider = (searchParams.get('provider') || 'railway') as CloudProvider;

    if (!id) {
      return NextResponse.json({ error: 'Missing container id' }, { status: 400 });
    }

    const driver = getDriver(provider);
    const result = await driver.spinDown(id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Container teardown error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
