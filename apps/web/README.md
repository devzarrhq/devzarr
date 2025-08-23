# Devzarr Web App

This is the main Next.js app for Devzarr, the indie bazaar for developers.

## Tech Stack

- Next.js (App Router)
- Supabase (auth + db)
- TailwindCSS
- Stripe
- shadcn/ui (UI components)
- Monorepo: `/apps/web`, `/packages/ui`, `/packages/types`

## Getting Started

1. Install dependencies from the root:
   ```
   pnpm install
   ```
2. Run the web app:
   ```
   pnpm --filter web dev
   ```