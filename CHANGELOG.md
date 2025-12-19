# Changelog

All notable changes to the Willow project will be documented in this file.

## [2025-12-19] - Initial Foundation & Core UI

### Added
- **Project Structure:** Initialized Vite + React + TypeScript project.
- **Design System:** Configured Tailwind CSS with custom "Oat Milk & Matcha" palette and global styles.
- **Layout:** Created consistent shell with Serif headers and soft cream background.
- **Liquid Stream:** Implemented vertical task list with `dnd-kit` and `framer-motion` support for smooth reordering.
- **Task Cards:** Pill-shaped task components with color themes and status toggles.
- **Smart Input:** Integrated `chrono-node` for real-time NLP date/time parsing with dynamic "Caught" badge.
- **Supabase Integration:** Implemented real-time persistence layer with Supabase. Added PostgreSQL schema, `useTasks` hook, and optimistic UI for reordering.
- **Authentication:** Integrated Magic Link sign-in. Tasks are now synced and secured per user.
- **Parking Lot:** Created a persistent sidebar for dateless tasks with cross-container drag-and-drop.
- **Reset Ritual:** Added end-of-day rollover logic with confetti animations and comforting feedback.
- **Mobile PWA:** Configured `vite-plugin-pwa` for native standalone mobile experience.
- **Deployment:** Successfully deployed to Cloudflare Pages (willow-os.pages.dev).
- **Mock Mode:** Robust fallback to LocalStorage when Supabase keys are not present.

- **Supabase Initialization (Bug):** Fixed crash when `VITE_SUPABASE_URL` was empty by implementing a conditional client and "Mock Mode" fallback. [Timestamp: 22:30]
- **Git Leak (Security):** Fixed `.gitignore` to exclude `.env` files and purged repository history to secure API keys. [Timestamp: 23:10]
- **Cloudflare Build (Bug):** Resolved `vitepress` build conflict and `verbatimModuleSyntax` errors during deployment. [Timestamp: 23:40]
- **Relative Imports (Bug):** Fixed path resolution errors in `Auth.tsx` for production bundles. [Timestamp: 23:30]

### Build Stats
- **Primary Dependencies:** `framer-motion`, `dnd-kit`, `chrono-node`, `lucide-react`, `tailwindcss@4`.
- **Port:** Local server running on `http://localhost:5174`.
