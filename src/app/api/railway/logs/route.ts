import { NextResponse } from 'next/server';

const RAILWAY_API_URL = 'https://backboard.railway.app/graphql/v2';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get('id') || 'unknown';
  const serviceName = searchParams.get('name') || 'service';
  const deploymentId = searchParams.get('deploymentId');

  const token = process.env.RAILWAY_API_TOKEN;

  // Real Production Execution if RAILWAY_API_TOKEN is provided
  if (token && deploymentId) {
    const query = `
      query GetDeploymentLogs($deploymentId: String!, $limit: Int) {
        deploymentLogs(deploymentId: $deploymentId, limit: $limit) {
          timestamp
          message
          severity
        }
      }
    `;

    try {
      const response = await fetch(RAILWAY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query,
          variables: { deploymentId, limit: 100 },
        }),
      });

      const data = await response.json();
      if (data.data?.deploymentLogs) {
        const liveLogs = data.data.deploymentLogs.map(
          (l: { timestamp: string; message: string; severity?: string }) =>
            `[${l.timestamp.split('T')[1]?.slice(0, 8) || 'LIVE'}] [${l.severity || 'info'}] ${l.message}`
        );
        return NextResponse.json({
          serviceId,
          serviceName,
          status: 'ONLINE',
          isDemo: false,
          logs: liveLogs,
        });
      }
    } catch (err) {
      console.error('Failed to query live Railway deployment logs:', err);
    }
  }

  // Offline Sandbox Fallback when no token is present
  const now = new Date();
  const timestamp = (offsetSec: number) =>
    new Date(now.getTime() - offsetSec * 1000).toISOString().split('T')[1].slice(0, 8);

  const logs = [
    `[${timestamp(45)}] [system] (SANDBOX MODE: No RAILWAY_API_TOKEN provided)`,
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
    status: 'SANDBOX',
    isDemo: true,
    logs,
  });
}
