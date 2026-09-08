import { NextResponse } from 'next/server';

const RAILWAY_API_URL = 'https://backboard.railway.app/graphql/v2';

async function executeRailwayGraphQL(query: string, variables: Record<string, unknown> = {}) {
  const token = process.env.RAILWAY_API_TOKEN;
  if (!token) throw new Error('RAILWAY_API_TOKEN is not defined in .env.local');

  const response = await fetch(RAILWAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: Bearer ,
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
  if (!projectId) return NextResponse.json({ error: 'RAILWAY_PROJECT_ID is not defined' }, { status: 500 });

  const query = 
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
  ;

  try {
    const data = await executeRailwayGraphQL(query, { projectId });
    const services = data.project?.services?.edges.map((edge: any) => edge.node) || [];
    return NextResponse.json({ services });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const projectId = process.env.RAILWAY_PROJECT_ID;
  if (!projectId) return NextResponse.json({ error: 'RAILWAY_PROJECT_ID is not defined' }, { status: 500 });

  try {
    const { name, image } = await request.json();
    const mutation = 
      mutation CreateService($projectId: String!, $name: String!, $source: ServiceSourceInput!) {
        serviceCreate(
          input: { projectId: $projectId, name: $name, source: $source }
        ) { id name }
      }
    ;

    const variables = {
      projectId,
      name: name || uto-container- + Math.floor(Math.random() * 10000),
      source: { image },
    };

    const data = await executeRailwayGraphQL(mutation, variables);
    return NextResponse.json({ service: data.serviceCreate });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });

    const mutation = 
      mutation DeleteService($id: String!) {
        serviceDelete(id: $id)
      }
    ;

    await executeRailwayGraphQL(mutation, { id });
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
