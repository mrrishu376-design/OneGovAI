# OneGovAI — Vercel prototype

OneGovAI is the Vercel-ready prototype of the original OneGov Streamlit project.

## Stack
- Next.js
- React
- Vercel
- Optional Gemini API route
- Browser localStorage for prototype data

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Demo accounts

Citizen:
`ramesh.kumar@gov.in` / `Citizen@2026`

Officer:
`water.officer@gov.in` / `Officer@2026`

The officer email changes by department slug, for example `revenue.officer@gov.in`.

Admin:
`admin@gov.in` / `Admin@2026`

## Gemini AI

Set this environment variable in Vercel:

`GEMINI_API_KEY`

Without it, service routing falls back to local keyword routing. The AI route is server-side, so the key is not placed in browser code.

## Important prototype limitation

This version uses browser localStorage. It is intentionally suitable for a hackathon prototype, not production.

That means:
- demo data is stored separately in each browser;
- changes are not shared between different devices;
- there is no production database;
- department integrations are simulated;
- authentication is demo-only and not production security.

For a production build, replace localStorage with a database and real authentication/identity services.

## Vercel

Import the repository into Vercel. Framework should be detected as Next.js.

No Python/Streamlit files are required for the Vercel version.
