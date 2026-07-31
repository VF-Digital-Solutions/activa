Activa frontend — a [Next.js](https://nextjs.org) app (originally bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app)).

## Environment Variables

Copy `apps/web/.env.example` to `apps/web/.env.local` and adjust as needed:

| Variable | Scope | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_DEV_BYPASS_AUTH` | client | When `true`, skips login and auto-authenticates as a fake dev user (see `src/app/providers.tsx`). Keep `false` outside local dev. |
| `API_INTERNAL_URL` | server | Base URL the Next.js server proxies `/api/v1/*` requests to (see `next.config.ts` rewrites). Defaults to `http://localhost:8000`; set to `http://api:8000` when running via the repo-root `docker-compose.yml`, where the API is reachable at the `api` service hostname instead of `localhost`. |

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
