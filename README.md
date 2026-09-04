# Jobs Feed Site (XML testing board)

Standalone Next.js site that fetches the Complete Staffing Solutions ATS **XML job feed**, lists every role, and opens a full-detail page with a properly formatted description.

## Quick start

```bash
cd jobs-feed-site
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configure the feed

Set `XML_FEED_URL` to your live feed.

## Public apply (CRM)

Also set (server-only):

```
CRM_API_URL=http://localhost:8080
JOB_APPLY_PUBLIC_SECRET=<same as CMS JOB_APPLY_PUBLIC_SECRET>
```

Job detail pages include an apply form that proxies to `POST {CRM_API_URL}/api/public/jobs/apply`. See `server/docs/PUBLIC_JOB_APPLY.md`.

## Deploy to Vercel

1. Push this folder (or the monorepo) to GitHub.
2. In Vercel: **Add New Project** → select the repo.
3. Set **Root Directory** to `jobs-feed-site`.
4. Add environment variables:
   - `XML_FEED_URL` = `https://<your-ats-domain>/jobs/feed`
   - `CRM_API_URL` = CMS backend URL
   - `JOB_APPLY_PUBLIC_SECRET` = shared secret (same as CMS)
5. Deploy.

## What you get

- Clickable job cards (title, company, location, salary, type, category)
- Search + category / job-type filters
- Detail page with every XML field and sanitized, fully formatted HTML description
- Theme aligned with Complete Staffing Solutions (Poppins, slate chrome, blue `#2563eb`, green accent)
