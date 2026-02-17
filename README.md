# Willow 🌿

A soft-productivity web app for the "Gen Z" aesthetic. **"Dump everything here. Willow will take care of it."**

## 🚀 Overview
Willow is a minimal, low-anxiety life manager that replaces rigid calendars with a fluid vertical list of "Liquid Blocks." From to-do lists to receipts to content ideas — Willow is your personal dump for everything that needs organizing. Built with "main character energy" and designed to romanticize productivity.

## ✨ Core Features
- **Liquid Stream:** Vertical drag-and-drop tasks with bouncy physics.
- **Smart NLP Input:** Type naturally (e.g., "Gym tomorrow at 5pm") and Willow extracts time and date.
- **Interactive Calendar:** Monthly calendar view with task indicators and date-based filtering.
- **Task Management:** Edit tasks inline, two-tap delete, smart date assignment.
- **Eisenhower Matrix:** Prioritize tasks with color-coded themes (Clay, Sage, Matcha, Lavender).
- **Personalized Rituals:** Time-aware greetings, atmospheric backgrounds, and "Hold to Enter" focus moment.
- **Permanent Archive:** A "Wrap Up" ritual that moves completed tasks to searchable history.
- **Paper Trail:** Receipt scanning and expense tracking (Camera/Gallery/PDF upload via Gemini AI).
- **Push Notifications:** Background alerts for upcoming and overdue tasks (Android + iOS PWA).
- **Dark Mode:** Serene nighttime theme with halation glow effects.
- **Profile Command Center:** Glassmorphism modal for settings, notifications, and identity management.
- **Mobile PWA Hardening:** Cross-platform camera, error boundaries, PKCE auth for Safari.
- **Instant Demo Mode:** 🎭 Try the app immediately with zero-config localStorage persistence.

## 🛠️ Tech Stack
- **React (Vite)** + TypeScript
- **Tailwind CSS v4** (Design System)
- **Framer Motion** (Animations)
- **dnd-kit** (Drag & Drop)
- **chrono-node** (NLP Parsing)
- **Supabase Auth** (Google OAuth PKCE + Device-based OTP)
- **Supabase Edge Functions** (Push Scheduler, Receipt Processing)
- **pg_cron + pg_net** (Scheduled push notifications)
- **Web Push / VAPID** (Background notifications)
- **Google Gemini 2.0 Flash** (Receipt AI)
- **Cloudflare Pages** (Deployment)
- **Workbox** (Service Worker + PWA)

## 📦 Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

## 📅 Roadmap

### ✅ Core Complete (v1.0)
- [x] Initial UI Foundation (Layout, Cards, Stream)
- [x] Smart NLP Input Implementation
- [x] Supabase Integration (Real-time DB)
- [x] Auth (Google OAuth PKCE + Device-based OTP)
- [x] Parking Lot & Sidebar logic
- [x] Personalization (Rituals, Time-based Greetings, Atmospheric UI)
- [x] Task Priorities (Eisenhower Matrix)
- [x] Task Archive & History Drawer
- [x] Instant Demo Mode for testers
- [x] Gemini 2.0 Flash AI Integration
- [x] Receipt Scanner & Ledger
- [x] Calendar View with Task Indicators & Management
- [x] PWA Configuration & Launch
- [x] Dynamic Greeting System (Morning/Afternoon/Evening)
- [x] Push Notifications (Web Push + pg_cron)
- [x] Overdue Notifications
- [x] Interactive Onboarding Tutorial
- [x] Header Polish & Profile Command Center 🧹
- [x] Paper Trail (Receipt Dump) 🧾
- [x] Dark Mode 🌙
- [x] Gen Z Onboarding Polish ✨
- [x] Mobile PWA Hardening (Camera, Auth, Error Handling) 📱
- [x] Task Deletion Fix (Two-Tap Confirm) 🗑️

### 🔮 Next: "Idea Dump" Expansion
- [ ] Voice Notes (Record → Auto-transcribe → Tag)
- [ ] Quick Dump Input (Brain-dump text area for ideas)
- [ ] Link / Screenshot Capture (Paste URL → Extract key info)
- [ ] AI Auto-Tagging (content, marketing, personal, finance)
- [ ] Content Calendar (Drag ideas → posting dates)
- [ ] Platform Tags (Instagram, TikTok, YouTube)
- [ ] Brand Deal Tracker
- [ ] AI Caption Generator
- [ ] Content Remix (Reel script → Tweet → Blog outline)
- [ ] Shared Boards & Collaboration
