import { NextResponse } from 'next/server';
import { getDriver, CloudProvider } from '@/lib/drivers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const provider = (searchParams.get('provider') || 'railway') as CloudProvider;

  if (!id) {
    return NextResponse.json({ error: 'Missing container id' }, { status: 400 });
  }

  try {
    const driver = getDriver(provider);
    const logs = await driver.getLogs(id);
    return NextResponse.json({ logs, provider, containerId: id });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Telemetry logs error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
