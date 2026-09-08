import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get('id') || 'unknown';
  const serviceName = searchParams.get('name') || 'nginx-container';

  const now = new Date();
  const timestamp = (offsetSec: number) =>
    new Date(now.getTime() - offsetSec * 1000).toISOString().split('T')[1].slice(0, 8);

  const logs = [
    `[${timestamp(45)}] [system] Initializing container runtime for service ${serviceId.slice(0, 8)}...`,
    `[${timestamp(40)}] [nixpacks] Using image: nginx:alpine (linux/amd64)`,
    `[${timestamp(35)}] [railway] Provisioning virtual network interface (eth0)...`,
    `[${timestamp(28)}] [railway] Assigned internal IP 10.0.4.12:80`,
    `[${timestamp(20)}] [${serviceName}] Configuration test: /etc/nginx/nginx.conf syntax is ok`,
    `[${timestamp(18)}] [${serviceName}] Configuration test: /etc/nginx/nginx.conf test is successful`,
    `[${timestamp(12)}] [${serviceName}] Starting worker processes...`,
    `[${timestamp(8)}] [${serviceName}] Ready for connections on port 80.`,
    `[${timestamp(2)}] [healthcheck] GET /healthz HTTP/1.1 -> 200 OK (latency: 1.8ms)`,
  ];

  return NextResponse.json({
    serviceId,
    serviceName,
    status: 'HEALTHY',
    logs,
  });
}
