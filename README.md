# BoonScroll

GoonScroll is a personal content digest app powered by Gemini AI. You add RSS feeds, subreddits, newsletters, and X/Twitter accounts, and it classifies every article so only the stuff that actually matters to you makes it into your feed.

Live app: https://boon-scroll.lovable.app

---

## Features

- Over 50 preset sources across tech news, AI/ML, Reddit communities, newsletters, X/Twitter via Nitter, cloud, security, hackathons, and Philippine tech
- Gemini 2.5 Flash classifies each article into Free Certifications, Promos & Trials, Tech Updates, Hackathons, or Not Relevant
- Adjustable confidence threshold, strictness level, and interest keywords to tune the signal-to-noise ratio
- Real-time feed — new articles appear without a page refresh
- Save articles and give thumbs up/down feedback to improve future runs
- Manual or scheduled digest runs with full run history and error logs
- Dark-first UI built with Tailwind CSS and shadcn/ui

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Supabase (Postgres + RLS + Realtime) |
| Edge Functions | Deno (RSS fetching + Gemini classification) |
| AI | Google Gemini 2.5 Flash |
| Auth | Supabase Auth (email/password) |

---

## Getting Started

```sh
git clone <YOUR_GIT_URL>
cd goon-scroll
npm install
npm run dev
```

You'll need a Gemini API key — it's free at [Google AI Studio](https://aistudio.google.com). Add it in Settings after signing up.

---

## Project Structure

```
src/
├── components/       # AppLayout, NavLink, ProtectedRoute, shadcn/ui
├── contexts/         # AuthContext (Supabase session)
├── hooks/            # use-toast, use-mobile
├── integrations/     # Supabase client + generated types
├── pages/            # Feed, Sources, Filters, Saved, Runs, Settings, Onboarding
supabase/
├── functions/        # digest-run edge function (RSS + Gemini)
├── migrations/       # SQL schema migrations
```

---

## Environment Variables

Managed automatically via Lovable Cloud. If self-hosting, set:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

---

## Deployment

Open [Lovable](https://lovable.dev) and hit Share → Publish for instant deployment.

For self-hosting:

```sh
npm run build
# deploy the dist/ folder to Vercel, Netlify, Cloudflare Pages, etc.
```

---

## License

MIT
