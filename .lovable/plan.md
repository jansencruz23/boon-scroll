
# Boon Scroll — Phase 1 Build Plan

## What we're building in Phase 1
Core app scaffold with Auth, Feed, Sources, AI classification, and Run History. Email digest and Saved articles come in Phase 2.

---

## 1. Project Foundation & Design System
- Set up dark mode by default (deep navy background, warm amber accent) with light/dark toggle
- Configure Inter font, global CSS variables for category colors
- Build the "Boon Scroll" brand: scroll/wave logo motif in the sidebar header
- Left collapsible sidebar with: 🏠 Feed, 📡 Sources, 🎯 Filters, 🔖 Saved, 📊 Runs, ⚙️ Settings, and a prominent **🚀 Run Now** button

## 2. Supabase (Lovable Cloud) Setup
Enable Lovable Cloud and create the full database schema:
- **profiles** table — display_name, timezone (default: Asia/Singapore), digest_enabled, digest_frequency, digest_hour, confidence_threshold, strictness, interest_keywords, gemini_api_key
- **sources** table — name, type (rss/subreddit/website), url, rss_url, category_tags[], is_active, last_fetched_at, last_fetch_count, last_pass_count
- **categories** table — name, display_name, description, emoji, color, priority, is_active
- **articles** table — title, url (unique per user), content_preview, published_at, category_id, category_name, confidence, ai_reason, priority, tags[], is_relevant, is_saved, is_emailed, feedback, fetched_at
- **digest_runs** table — status, total_fetched, total_passed, total_errors, error_log (jsonb), email_sent, trigger
- RLS policies on all tables (users see only their own data)
- Database trigger to auto-create profile + seed default categories on sign-up

## 3. Authentication
- `/login` and `/signup` pages with Boon Scroll branding
- Protected routes — redirect to `/login` if unauthenticated, to `/feed` if authenticated
- Root `/` redirects based on auth state

## 4. Onboarding Wizard (first-time users)
3-step wizard shown after sign-up:
1. **Add Sources** — preset pack one-click button + manual add
2. **Set Interests** — keyword chips input (Docker, Python, React, etc.)
3. **Gemini API Key** — input with link to aistudio.google.com/apikey + instructions

## 5. Sources Page (`/sources`)
- Add Source form: name, type dropdown, URL, auto-generate Reddit RSS URLs, category tags (chip input), active toggle
- Source card grid: favicon, name, type badge, URL, last fetched, article counts, edit/delete/toggle actions
- **Preset pack button**: one-click adds freeCodeCamp, Dev.to, Hacker News, TechCrunch, and 3 Reddit AI subs

## 6. Filters/Preferences Page (`/filters`)
- Category list with edit/add/delete: name, description, emoji, color picker, priority (1–5), active toggle
- Default categories pre-seeded: FREE_CERTIFICATION, PROMO_OR_TRIAL, TECH_UPDATE, NOT_RELEVANT
- **Confidence threshold slider** (0.0–1.0, default 0.5)
- **Strictness toggle**: Relaxed vs. Strict
- **Interest keywords** field (comma-separated or tag chips)

## 7. AI Classification Edge Function (`digest-run`)
Supabase Edge Function triggered manually (and later by cron):
1. Fetch all active sources for the user
2. Parse each RSS feed URL (using Deno's fetch + XML parsing)
3. Deduplicate articles by URL against the `articles` table
4. For each new article, call Gemini API (`gemini-2.5-flash-preview-05-20`) with dynamic system prompt built from user's categories + interests + strictness
5. Parse JSON response → insert into `articles` table with classification results
6. Rate limit handling: 6s delay between requests, exponential backoff (5s/10s/20s) on 429
7. Handle safety filter blocks (finishReason check), malformed JSON (default NOT_RELEVANT)
8. Record a `digest_runs` entry with stats
9. Skip articles from unreachable feeds (log error, continue)

## 8. Main Feed Page (`/feed`)
- Single-column centered feed (max-width 680px) with skeleton loaders
- Article cards with: source favicon + name + relative timestamp, title (linked), content preview (200 chars), AI category badge (colored emoji pill), confidence score, AI reason, tags
- Action buttons: 🔖 Save, 👍/👎 Feedback, 🔗 Copy link, ↗️ Open original
- **Sticky top filter bar**: tabs by category, source multi-select dropdown, date range, sort (Newest, Highest confidence, Highest priority), keyword search
- "Load more" pagination
- **Realtime**: Supabase Realtime subscription pushes new articles to feed live
- Empty state with illustration + CTA to Sources page
- Banner if no Gemini API key is set

## 9. Run History Page (`/runs`)
- Table/list of past `digest_runs`: timestamp, duration, status badge, fetched count, passed count, errors
- Expandable rows showing per-source breakdown from error_log
- **Manual "Run Now" button** that invokes the `digest-run` Edge Function

## 10. Settings Page (`/settings`)
- Profile: display name, email (read-only), timezone selector
- Gemini API key input (masked, with test button)
- Digest preferences: enable toggle, frequency, hour picker
- Email address for digest
- Theme toggle (dark/light)

---

## Phase 2 (follow-up)
- Saved articles page with CSV/Markdown export
- Resend email digest (HTML template, cron scheduling)
- User feedback training loop (relevant/not-relevant signals)
