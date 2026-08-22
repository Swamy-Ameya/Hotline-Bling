# Deploying

The app needs **no environment variables and no database** to run. When
`DATABASE_URL` is absent it falls back to the seeded in-process store, so a
fresh deploy works immediately and the campus data is already there.

## Option A — Vercel dashboard (recommended, ~2 minutes, no CLI)

1. Go to **vercel.com/new**
2. Sign in with GitHub
3. Import **Swamy-Ameya/Hotline-Bling**
4. Leave every setting at its default — Next.js is detected automatically
5. **Deploy**

You get a live URL like `hotline-bling.vercel.app`. Every push to `main`
redeploys on its own from then on.

## Option B — CLI

```bash
npm i -g vercel
```

```bash
vercel --cwd "G:/Projects/outbreak-radar"
```

A browser window opens for login the first time. Accept the defaults; then
`vercel --prod` for a production URL.

---

## One thing to know about serverless

Vercel runs each request in its own short-lived function, and functions do not
share memory. So a consultation or self-report filed on the live site may not
persist between requests — it will save, return, and then be gone on the next
page load.

Every page reseeds deterministically when it finds an empty store, so the
dashboard always has a full, consistent campus on it. Nothing looks broken;
writes just do not accumulate.

**This disappears entirely once a real database is connected**, which is the
next step below.

## Connecting a real database

1. Create a Postgres database — Vercel Postgres, Neon and Supabase all work.
2. Run `db/schema.sql` against it once.
3. Add `DATABASE_URL` in the Vercel project's environment variables.
4. Rewrite the function bodies in `lib/db/index.ts` to run SQL instead of
   reading the mock.

Nothing else changes. No page, component or API route touches storage directly
— they all go through `lib/db`, which is the whole reason it was built that way.
