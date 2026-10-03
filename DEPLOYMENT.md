# OneGovAI deployment

## 1. Upload these files to GitHub

Use the generated project as the repository root. Do not keep the old Streamlit `app.py` as the Vercel entrypoint.

## 2. Vercel

Create a new Vercel project from the GitHub repository.

The project should be detected as:

- Framework: Next.js
- Build command: `next build`
- Install command: `npm install`

## 3. Gemini key

In Vercel:

Project → Settings → Environment Variables

Add:

`GEMINI_API_KEY = your Gemini API key`

Redeploy after adding it.

If the key is absent, OneGovAI still works using local service-keyword routing.

## 4. Prototype accounts

Citizen:
`ramesh.kumar@gov.in` / `Citizen@2026`

Officer:
`water.officer@gov.in` / `Officer@2026`

Admin:
`admin@gov.in` / `Admin@2026`

## 5. Important

Do not put `GEMINI_API_KEY` in `NEXT_PUBLIC_*`.

This is a prototype. Browser localStorage is used instead of a shared database.
