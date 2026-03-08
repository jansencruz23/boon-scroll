# 📡 GoonScroll

**GoonScroll** is a personal AI-powered content digest app. Add RSS feeds, subreddits, newsletters, and X/Twitter accounts — then let Gemini AI classify, filter, and surface only what actually matters to you.

🔗 **Live app**: https://goon-scroll.lovable.app

---

## ✨ Features

- **50+ preset sources** — Tech news, AI/ML, Reddit communities, newsletters, X/Twitter via Nitter, cloud & security blogs
- **AI classification** — Gemini 2.5 Flash categorises every article into Free Certifications, Promos & Trials, Tech Updates, or Not Relevant
- **Smart filtering** — Confidence threshold, strictness level, interest keywords — tune the signal-to-noise ratio
- **Real-time feed** — New articles appear instantly via Supabase Realtime
- **Save & feedback** — Bookmark articles and give thumbs up/down to improve future runs
- **Digest runs** — Trigger a fetch manually or schedule automated runs; full run history with error logs
- **Dark-first UI** — Clean, animated interface with no generic AI aesthetics

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Supabase (Postgres + RLS + Realtime) |
| Edge Functions | Deno (RSS fetching + Gemini classification) |
| AI | Google Gemini 2.5 Flash |
| Auth | Supabase Auth (email/password) |

---

## 🚀 Getting Started

```sh
# Clone the repo
git clone <YOUR_GIT_URL>
cd goon-scroll

# Install dependencies
npm install

# Start the dev server
npm run dev
```

You'll need a **Gemini API key** (free at [Google AI Studio](https://aistudio.google.com)) — add it in Settings after signing up.

---

## 📁 Project Structure

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

## 🔑 Environment Variables

Managed automatically via Lovable Cloud. If self-hosting, set:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

---

## 📦 Deployment

Open [Lovable](https://lovable.dev) → **Share → Publish** for instant deployment.

For self-hosting, build with:

```sh
npm run build
# Deploy the dist/ folder to any static host (Vercel, Netlify, Cloudflare Pages, etc.)
```

---

## 📄 License

MIT
