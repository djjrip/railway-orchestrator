import { NextResponse } from 'next/server';

const RAILWAY_API_URL = 'https://backboard.railway.app/graphql/v2';

let demoServices = [
  { id: 'srv_demo_nginx_prod', name: 'edge-proxy-nginx', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'srv_demo_redis_cache', name: 'redis-state-store', createdAt: new Date(Date.now() - 7200000).toISOString() },
];

async function executeRailwayGraphQL(query: string, variables: Record<string, unknown> = {}) {
  const token = process.env.RAILWAY_API_TOKEN;
  if (!token) throw new Error('RAILWAY_API_TOKEN is not defined in .env.local');

  const response = await fetch(RAILWAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const data = await response.json();
  if (data.errors) {
    console.error('Railway API Error:', data.errors);
    throw new Error(data.errors[0]?.message || 'GraphQL Error');
  }
  return data.data;
}

export async function GET() {
  const projectId = process.env.RAILWAY_PROJECT_ID;
  const token = process.env.RAILWAY_API_TOKEN;

  if (!projectId || !token) {
    return NextResponse.json({
      services: demoServices,
      isDemo: true,
      message: 'Demo Sandbox Active (Configure RAILWAY_API_TOKEN & RAILWAY_PROJECT_ID in .env.local for live production)',
    });
  }

  const query = `
    query GetServices($projectId: String!) {
      project(id: $projectId) {
        services {
          edges {
            node {
              id
              name
              createdAt
            }
          }
        }
      }
    }
  `;

  type RailwayServiceEdge = {
    node: {
      id: string;
      name: string;
      createdAt: string;
    };
  };

  try {
    const data = await executeRailwayGraphQL(query, { projectId });
    const services = data.project?.services?.edges.map((edge: RailwayServiceEdge) => edge.node) || [];
    return NextResponse.json({ services, isDemo: false });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const projectId = process.env.RAILWAY_PROJECT_ID;
  const token = process.env.RAILWAY_API_TOKEN;

  try {
    const { name, image } = await request.json();

    if (!projectId || !token) {
      const newService = {
        id: `srv_demo_${Math.random().toString(36).substring(2, 10)}`,
        name: name || `auto-container-${Math.floor(Math.random() * 10000)}`,
        createdAt: new Date().toISOString(),
      };
      demoServices = [newService, ...demoServices];
      return NextResponse.json({ service: newService, isDemo: true });
    }

    const mutation = `
      mutation CreateService($projectId: String!, $name: String!, $source: ServiceSourceInput!) {
        serviceCreate(
          input: { projectId: $projectId, name: $name, source: $source }
        ) { id name }
      }
    `;

    const variables = {
      projectId,
      name: name || `auto-container-${Math.floor(Math.random() * 10000)}`,
      source: { image },
    };

    const data = await executeRailwayGraphQL(mutation, variables);
    return NextResponse.json({ service: data.serviceCreate, isDemo: false });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });

    const projectId = process.env.RAILWAY_PROJECT_ID;
    const token = process.env.RAILWAY_API_TOKEN;

    if (!projectId || !token) {
      demoServices = demoServices.filter((s) => s.id !== id);
      return NextResponse.json({ success: true, deletedId: id, isDemo: true });
    }

    const mutation = `
      mutation DeleteService($id: String!) {
        serviceDelete(id: $id)
      }
    `;

    await executeRailwayGraphQL(mutation, { id });
    return NextResponse.json({ success: true, deletedId: id, isDemo: false });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
