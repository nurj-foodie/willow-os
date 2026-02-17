# Willow 🌿 — Development Roadmap & Task Tracker
> **Last Updated:** February 17, 2026  
> **Status:** v1.0 Core Complete — Planning "Idea Dump" Expansion  
> **Philosophy:** "Dump everything here. Willow will take care of it."

---

## ✅ v1.0 — Core Complete (All Shipped)

### Foundation
- [x] Vite + React + TypeScript project setup
- [x] Tailwind CSS v4 design system ("Oat Milk & Matcha" palette)
- [x] Cloudflare Pages deployment
- [x] Supabase integration (PostgreSQL + Real-time)
- [x] PWA configuration (Workbox + Service Worker)

### Task Management
- [x] Liquid Stream (drag-and-drop with dnd-kit + Framer Motion)
- [x] Smart NLP Input (chrono-node date parsing)
- [x] Eisenhower Priority Matrix (4 color-coded levels)
- [x] Parking Lot (dateless tasks sidebar)
- [x] Interactive Calendar with task indicators
- [x] Task Edit Modal with inline editing
- [x] Two-tap delete confirmation (replaces window.confirm)
- [x] Task Archive & History Drawer
- [x] Reset Ritual (end-of-day wrap-up)

### Finance
- [x] Paper Trail (receipt scanning via Gemini 2.0 Flash)
- [x] Camera/Gallery/PDF upload
- [x] Ledger with monthly navigation
- [x] PDF export with receipt thumbnails

### Auth & Security
- [x] Google OAuth (PKCE flow for Safari compatibility)
- [x] Device-based OTP verification
- [x] Demo Mode (localStorage, zero-config)
- [x] RLS policies on all tables

### Notifications
- [x] Web Push (VAPID + Service Worker)
- [x] pg_cron scheduler (every 5 min)
- [x] Upcoming task alerts (🌿 due in 10 min)
- [x] Overdue task alerts (⏰ past due)
- [x] iOS PWA support (16.4+)

### UX & Polish
- [x] Dark Mode (halation glow, midnight palette)
- [x] Dynamic time-based greetings
- [x] Interactive onboarding tutorial ("Spotlight")
- [x] Profile Command Center (glassmorphism modal)
- [x] Error Boundary (global crash handler)
- [x] Mobile PWA Hardening (cross-platform camera, PKCE auth)

---

## 🔮 v2.0 — "Idea Dump" Expansion

> Mini-scale brain dump for content creators. Think Haven OS, but focused and mobile-first.

---

### Phase 1: Quick Capture 🧠
> **Goal:** Let users dump anything into Willow — text, voice, links — without friction.

- [ ] **Idea Dump Tab**
  - [ ] New bottom nav tab (Stream | Dump | Trail) or swipe gesture
  - [ ] Separate Supabase `ideas` table (id, user_id, content, type, tags, source_url, media_url, created_at, status)
  - [ ] Card-based idea feed (newest first)

- [ ] **Quick Text Dump**
  - [ ] Freeform text area — no structure required, just dump
  - [ ] Auto-save on blur/pause (debounced)
  - [ ] Emoji reactions (🔥 hot idea, 💡 lightbulb, 📌 pinned)

- [ ] **Voice Notes**
  - [ ] Record button in the dump input
  - [ ] MediaRecorder API → upload to Supabase Storage
  - [ ] Gemini transcription (audio → text)
  - [ ] Show transcript with playback controls

- [ ] **Link / Screenshot Capture**
  - [ ] Paste URL → fetch Open Graph metadata (title, image, description)
  - [ ] Edge Function for OG scraping
  - [ ] Visual link card with thumbnail preview
  - [ ] Screenshot upload → OCR text extraction (optional, Gemini)

**Supabase Changes:**
```sql
-- ideas table
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  content TEXT,
  type TEXT DEFAULT 'text', -- 'text', 'voice', 'link', 'image'
  tags TEXT[] DEFAULT '{}',
  source_url TEXT,
  media_url TEXT,
  transcript TEXT,
  status TEXT DEFAULT 'raw', -- 'raw', 'planned', 'in-progress', 'done'
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
```

---

### Phase 2: AI Organization 🏷️
> **Goal:** Willow automatically understands and organizes your dumps.

- [ ] **AI Auto-Tagging**
  - [ ] On idea creation, call Gemini to extract tags
  - [ ] Suggested categories: content, marketing, personal, finance, collab
  - [ ] User can accept/edit/reject suggested tags
  - [ ] Tag-based filtering in the dump feed

- [ ] **Smart Search**
  - [ ] Full-text search across all ideas
  - [ ] Filter by type (text/voice/link), tags, date range, status
  - [ ] "Related ideas" — show similar dumps when viewing one

- [ ] **Idea → Task Conversion**
  - [ ] "Make this a task" button on any idea
  - [ ] Pre-fills task title from idea content
  - [ ] Links idea to task (idea.task_id reference)

---

### Phase 3: Content Calendar 📅
> **Goal:** Plan when and where to post content.

- [ ] **Calendar View for Content**
  - [ ] Monthly/weekly view showing planned posts
  - [ ] Drag ideas from dump onto calendar dates
  - [ ] Color-coded by platform

- [ ] **Platform Tags**
  - [ ] Instagram, TikTok, YouTube, Twitter/X, Blog
  - [ ] Platform icons on calendar cards
  - [ ] Recommended post times per platform (config)

- [ ] **Status Pipeline**
  - [ ] Draft → Filmed → Edited → Scheduled → Posted
  - [ ] Visual progress indicator on each content card
  - [ ] Filter calendar by status

---

### Phase 4: Creator Tools 💼
> **Goal:** Track the business side of content creation.

- [ ] **Brand Deal Tracker**
  - [ ] Log collaborations (brand, rate, deliverables, deadline)
  - [ ] Status: Pitched → Negotiating → Accepted → Delivered → Paid
  - [ ] Integration with Paper Trail for income tracking

- [ ] **Income Dashboard**
  - [ ] Extend ledger for sponsorship/affiliate income
  - [ ] Monthly income summary (content vs receipts)
  - [ ] Simple charts (bar/line)

- [ ] **Simple Media Kit**
  - [ ] Auto-generate from tracked stats
  - [ ] Export as PDF or shareable link

---

### Phase 5: AI Copilot ✨
> **Goal:** Willow helps create content, not just organize it.

- [ ] **Caption Generator**
  - [ ] Select an idea → Gemini generates platform-specific captions
  - [ ] Tone presets (casual, professional, witty, inspirational)
  - [ ] Copy-to-clipboard

- [ ] **Hashtag Recommendations**
  - [ ] Platform-specific hashtag suggestions
  - [ ] Trending vs evergreen hashtag balance

- [ ] **Content Remix**
  - [ ] One idea → multiple format outputs
  - [ ] Reel script / Tweet thread / Blog outline / Story slides
  - [ ] Save each remix as a new linked idea

---

### Phase 6: Collaboration 🤝
> **Goal:** Work with others on content planning (future).

- [ ] **Shared Boards**
  - [ ] Invite collaborators via email
  - [ ] Shared idea dump spaces
  - [ ] Permission levels (view/edit/admin)

- [ ] **Comments & Reactions**
  - [ ] Team feedback on ideas
  - [ ] Threaded comments

- [ ] **Media Uploads**
  - [ ] Attach raw footage, photos, drafts to ideas
  - [ ] Supabase Storage integration

---

## 🛠️ Technical Debt & Maintenance

- [ ] Set up Git author config (currently using hostname default)
- [ ] Add automated tests (Vitest for hooks, Playwright for E2E)
- [ ] Performance audit (Lighthouse PWA score)
- [ ] Accessibility audit (screen reader, keyboard nav)
- [ ] Clean up PUSH_NOTIFICATION_SETUP.sql from repo (move to docs/)

---

## 📋 Session Quick-Start Guide

> When starting a new session, share this with the assistant:

**"We're working on Willow OS. Check `/TASKS.md` for the current roadmap. Last session completed [phase/feature]. Continue from the next unchecked item."**

### Key Files:
| File | Purpose |
|------|---------|
| `TASKS.md` | This roadmap (source of truth) |
| `PRD.md` | Product requirements & design philosophy |
| `CHANGELOG.md` | Shipped features by date |
| `README.md` | Overview & tech stack |
| `.env` | Environment variables (VAPID, Supabase) |
| `supabase/functions/` | Edge functions (push-scheduler, process-receipt) |

### Current State (Feb 17, 2026):
- **v1.0 Core:** ✅ All shipped and working
- **Next up:** Phase 1 — Quick Capture (Idea Dump Tab, Quick Text Dump)
- **Infra ready:** Supabase, Gemini AI, Push Notifications, PWA
