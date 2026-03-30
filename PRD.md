# Willow - Product Requirements Document (PRD)

**Version:** 1.0 (Core Complete — Mobile Hardened & Notification Infrastructure)  
**Date:** February 17, 2026 (Updated)  
**Target Audience:** Gen Z / Modern Professional / Micro-Influencers ("Sofia")  
**Platform:** Web PWA (Mobile & Desktop)  
**Philosophy:** "Dump everything here. Willow will take care of it."


---

## 1. Product Vision
To create a "Low-Stakes Productivity" tool that replaces grid-based anxiety with fluid, aesthetic "blocks." It prioritizes "vibe" and "flow" over rigid scheduling.

## 2. Tech Stack
- **Frontend:** React (Vite) + TypeScript
- **Styling:** Tailwind CSS (Gen Z / Glassmorphism aesthetic)
- **Animation/Physics:** `framer-motion` + `dnd-kit` (Liquid feel)
- **Backend/Database:** Supabase (PostgreSQL + Real-time)
- **Authentication:** Supabase Auth (Google OAuth + Device-based OTP)
- **AI/NLP:** 
  - `chrono-node` (Date/Time extraction)
  - **Google Gemini 2.0 Flash** (Receipt Scanning & Advanced Extraction)
- **Deployment:** Cloudflare Pages
- **Mobile Support:** Progressive Web App (Vite PWA)

## 3. Core Features (MVP)

### A. The "Liquid Stream"
- **Requirement:** Vertical list of tasks represented as pill-shaped "Blocks".
- **Logic:** Infinite vertical canvas without hourly grids.
- **Physics:** Drag & Drop allows blocks to animate smoothly out of the way (Liquid Physics).
- **Visuals:** Rounded corners (pill shape), pastel backgrounds (Matcha, Clay, Lavender, Oat).

### B. Smart Input (NLP)
- **Requirement:** Single input bar at the bottom (Mobile) or center (Desktop).
- **Logic:** Detects dates/times as the user types (e.g., "Meet boss tomorrow at 5pm").
- **Visuals:** Highlights detected text to show it was "caught".
- **Action:** Creates task with correct timestamp and strips date text from title.

### C. The "Parking Lot"
- **Requirement:** Storage area for tasks without specific times.
- **Logic:** Sidebar on Desktop, Drawer on Mobile. Removing a time from a task moves it here.

### D. The "Reset Ritual" & Archive
- **Requirement:** End-of-day cleanup and history logging.
- **Logic:** Moves all completed tasks to the **Archive**. Uncompleted tasks stay in the stream.
- **Visuals:** Validating confetti message ("You did enough today") and a new **History Drawer** to view past wins.

### E. Personalization & Atmosphere
- **Requirement:** An app that feels "alive" and knows the user.
- **Logic:** 
  - **Google Vibe:** Secure Google OAuth login with device-based OTP verification for new devices.
  - **Dynamic Backgrounds:** Hue shifts based on time of day (Morning/Afternoon/Evening).
  - **Eisenhower Matrix:** Tasks categorized by priority (Urgent/Important) with color coding.

### F. Demo Mode (Guest Access)
- **Requirement:** Instant access for reviewers/testers without registration.
- **Logic:** Toggles between Cloud-sync and Local-only mode.
- **Visuals:** 🎭 branded "Guest" experience that still includes full Onboarding and Rituals.
### G. Interactive Onboarding ("Spotlight")
- **Requirement:** "Show, don't tell" interactive tutorial for new users.
- **Logic:**
  - **Dimmed Overlay:** Focuses attention on one element at a time.
  - **Interactive Steps:** Requires user action (e.g., "Add Task") to proceed.
  - **Features Covered:** Smart Input, Calendar, Ledger, Archive, Privacy.
  - **Robustness:** Auto-triggers for new users, manual restart option.

### H. Web Push Notifications
- **Requirement:** Background alerts for due and overdue tasks.
- **Logic:**
  - **VAPID Security:** Authenticated communication between Server and Browser.
  - **Local Timezone:** Service Worker calculates display time locally to ensure accuracy.
  - **Smart Scheduling:** `pg_cron` triggers Edge Function every 30 minutes to find tasks due soon.
  - **Auto-Cleanup:** Daily setup purges execution logs to prevent Supabase Disk IO depletion.
  - **Overdue Alerts:** Separately notifies for missed tasks with distinct ⏰ messaging.
  - **Cross-Platform:** Works on Android PWA and iOS 16.4+ PWA (Home Screen installed).

### I. Profile Command Center (Header Refactor)
- **Requirement:** Clean, decluttered UI with a centralized settings home.
- **Logic:**
  - **Avatar Trigger:** Clicking user avatar opens the glass modal.
  - **Unified Actions:** Notifications, Privacy, Archive, and Account Actions all live here.
  - **Inline Editing:** Update Display Name directly in the modal.

### J. Mobile PWA Hardening
- **Requirement:** Reliable cross-platform experience on Android and iOS.
- **Logic:**
  - **Platform Camera:** Android uses in-app `getUserMedia` (avoids PWA kill); iOS uses native `capture`.
  - **Error Boundary:** Global React crash handler shows error + Reload instead of blank screen.
  - **PKCE Auth:** OAuth uses code exchange (not hash fragments) for Safari compatibility.
  - **Two-Tap Delete:** Inline confirmation replaces `window.confirm` (unreliable on mobile).
  - **API Safety:** Service Worker uses `NetworkFirst` for all Supabase/API calls.

## 4. Design Guidelines ("The Vibe")
- **Palette:** 
  - Background: `#FDFCF8` (Oat Milk/Cream)
  - Text: `#2D2D2D` (Soft Charcoal)
  - Accents: Sage Green, Muted Clay, Pale Lavender.
- **Typography:** Mix of clean Sans-Serif (Inter) and trendy Serif (Playfair Display).
- **Interactions:** Bouncy, forgiving, and "romanticized." No red text for errors/overdue items.

## 5. Future Vision — "Idea Dump" Expansion

Willow's core philosophy — **"Dump everything here, Willow takes care of it"** — extends naturally beyond tasks and receipts into the content creator ecosystem.

### Phase 1: Idea Dump (Quick Capture)
- **Voice Notes:** Record voice memos → Willow transcribes and tags them automatically.
- **Quick Dump Input:** A brain-dump text area for content ideas, captions, random thoughts.
- **Screenshot/Link Capture:** Paste a URL or screenshot → Willow extracts the key info.
- **Tags & Categories:** Auto-tag ideas as "content", "marketing", "personal", "finance" using AI.

### Phase 2: Content Calendar
- **Post Scheduler View:** Visual calendar of planned content (Instagram, TikTok, YouTube).
- **Drag Ideas → Calendar:** Move brain-dumped ideas to specific posting dates.
- **Platform Tags:** Mark content for specific platforms with recommended post times.
- **Status Tracking:** Draft → Filmed → Edited → Scheduled → Posted.

### Phase 3: Marketing Dashboard
- **Brand Deal Tracker:** Log collaborations, rates, deliverables, deadlines.
- **Income Tracker:** Extend Paper Trail for influencer income (sponsorships, affiliates).
- **Media Kit:** Auto-generate a simple media kit from tracked stats.

### Phase 4: AI Copilot
- **Caption Generator:** AI suggests captions based on dumped ideas and past content.
- **Hashtag Recommendations:** Platform-specific hashtag suggestions.
- **Content Remix:** Turn one idea into multiple formats (Reel script → Tweet → Blog outline).
- **Trend Alerts:** Notify when a saved topic starts trending.

### Phase 5: Collaboration
- **Shared Boards:** Invite collaborators to shared idea dumps.
- **Comments & Reactions:** Team feedback on ideas before filming.
- **Media Uploads:** Attach raw footage, photos, and drafts to ideas.
