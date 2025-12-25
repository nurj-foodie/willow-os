# Willow - Product Requirements Document (PRD)

**Version:** 0.2 (Alpha)  
**Date:** December 26, 2025 (Updated)  
**Target Audience:** Gen Z / Modern Professional ("Sofia")  
**Platform:** Web PWA (Mobile & Desktop)

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

## 4. Design Guidelines ("The Vibe")
- **Palette:** 
  - Background: `#FDFCF8` (Oat Milk/Cream)
  - Text: `#2D2D2D` (Soft Charcoal)
  - Accents: Sage Green, Muted Clay, Pale Lavender.
- **Typography:** Mix of clean Sans-Serif (Inter) and trendy Serif (Playfair Display).
- **Interactions:** Bouncy, forgiving, and "romanticized." No red text for errors/overdue items.
