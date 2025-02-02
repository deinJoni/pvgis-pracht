# PVGIS Pracht

This is a monorepo project containing a frontend application, backend server, and shared packages.

## Prerequisites

- Node.js (v18 or higher recommended)
- [pnpm](https://pnpm.io/) (v9.1.2 or higher)

## Project Structure

```
.
├── apps/
│   ├── frontend/    # React frontend application
│   └── backend/     # Backend server
└── packages/
    └── shared/      # Shared types and utilities
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pvgis-pracht
```

2. Install dependencies:
```bash
pnpm install
```

This will install all dependencies for the frontend, backend, and shared packages.

## Development

To run both frontend and backend in development mode:

```bash
pnpm dev
```

This will start:
- Frontend development server
- Backend development server

### Running Individual Services

To run services individually:

Frontend:
```bash
pnpm --filter frontend dev
```

Backend:
```bash
pnpm --filter backend dev
```

## Building for Production

To build all packages:

```bash
pnpm build
```

To build individual packages:

```bash
pnpm --filter frontend build
pnpm --filter backend build
pnpm --filter shared build
```

## License

ISC 