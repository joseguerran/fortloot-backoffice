# FortLoot Backoffice

Admin dashboard for managing the FortLoot platform.

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Radix UI
- Docker

## Setup

1. Copy `.env.example` to `.env` and configure variables
2. Install dependencies: `npm install`
3. Start: `npm start`

## Development

```bash
npm run dev
```

## Docker

```bash
docker build -t fortloot-backoffice .
docker run -p 3002:3002 --env-file .env fortloot-backoffice
```

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL
- `PORT` - Port to run on (default: 3002)
