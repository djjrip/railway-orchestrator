# Railway API Orchestrator

A production-ready Next.js application that provisions, orchestrates, and monitors containers via Railway's GraphQL API (v2). 

This project was built to demonstrate full-stack architectural competence, emphasizing secure API proxying, robust state management, and zero-trust credential handling.

## Architecture & Security

- **Next.js App Router:** Utilizes React Server Components and edge-optimized API routes.
- **Zero-Trust GraphQL Proxy:** The Railway API token is strictly confined to the server environment. The client-side UI never interacts directly with `backboard.railway.app`. All `serviceCreate` and `serviceDelete` mutations are securely proxied through `src/app/api/railway/route.ts`.
- **Stateless Orchestration:** The backend acts as a stateless orchestrator, fetching real-time container topology directly from Railway's infrastructure rather than maintaining a fragile local database state.

## Core Features

- **Automated Provisioning:** Programmatically spins up containerized services (e.g., `nginx:alpine`) natively onto Railway infrastructure with a single click.
- **Teardown / Spin-Down:** Safely deletes services by ID via GraphQL mutations.
- **Real-Time State:** Polls the project's service edges to reflect the actual deployed state of the infrastructure.
- **Live Container Telemetry:** Dedicated stdout/stderr log stream viewer to inspect container health and initialization logs in real-time.
- **Interactive Sandbox Demo Mode:** Out-of-the-box fallback state that allows anyone to explore and test the control plane locally without an active Railway token.
- **Error Boundaries:** Explicit UI states for network failures, missing environment variables, and GraphQL mutation errors.

## Local Development

### Prerequisites
- Node.js 18+
- A [Railway Account](https://railway.app/) and an active Project.
- A Railway API Token.

### Environment Setup
Create a .env.local file in the root directory and add your credentials:
\\\nv
RAILWAY_API_TOKEN=your_token_here
RAILWAY_PROJECT_ID=your_project_id_here
\\\
*(Note: .env.local is explicitly ignored via .gitignore to prevent secret leakage).*

### Running the Orchestrator
\\\ash
npm install
npm run dev
\\\
Navigate to \http://localhost:3000\.

## CI/CD
This repository is configured with GitHub Actions (.github/workflows/ci.yml) to enforce type-safety (TypeScript), linting (ESLint), and build verification on every push.
