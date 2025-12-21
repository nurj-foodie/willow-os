# Changelog

All notable changes to the Willow project will be documented in this file.

## [2025-12-21] - Biometrics Fix & Demo Mode

### Added
- **Instant Demo Mode:** Created a "Direct Access" flow for remote testers (specifically for the user's sister).
    - Added "Try Demo Mode" toggle to the `Auth` screen.
    - Implemented `localStorage`-based session persistence, bypassing Supabase Auth for zero-friction testing.
    - Integrated **Naming Ritual** and **Onboarding Tour** into the demo flow for a complete "first-look" experience.
- **Biometric "Direct Line" Fix:** Resolved the "Black Hole" network issue impacting both registration and login.
    - Replaced `supabase.functions.invoke` with direct `fetch` calls in `PasskeyService.ts`.
    - Added 10-second timeouts to prevent silent hangs.
    - Implemented granular debug alerts to surface precise WebAuthn errors (e.g., `Credentials Not Found`).

### Fixed
- **Biometric Prompt Hang:** Root caused and resolved an issue where Edge Function requests would hang indefinitely without throwing errors, preventing the OS biometric prompt from firing.
- **Loading State Loop:** Fixed a bug in `App.tsx` where failed profile fetches would trap users in a "Syncing Profile..." screen indefinitely. Added 5-second timeouts to all core database hooks.

## [2025-12-20] - Personalization, Priorities & Archive

### Added
- **Eisenhower Priority Matrix:** Implemented a 4-quadrant priority system for tasks.
    - Added `priority` column to Supabase `tasks` table.
    - Updated `SmartInput` with a "Dot Selector" for assigning priorities (Urgent/Important).
    - Updated `TaskCard` to dynamically color-code based on priority (Clay, Sage, Matcha, Lavender).
- **Task Archive System:**
    - Repurposed the "Wrap Up" ritual to move completed tasks to an `'archived'` status instead of resetting them.
    - Created `ArchiveDrawer` component to view task history, grouped by date.
    - Added "History" icon to the app header for accessing the archive.
- **Personalization & Rituals (Phase 3):**
    - **Atmospheric UI:** Implemented dynamic background gradients that shift based on time of day (Morning/Afternoon/Evening).
    - **Reset Ritual:** Added a full-screen entry overlay with "Hold to Focus" interaction.
    - **Smart Greetings:** Logic to welcome new users differently than returning users, with support for `display_name` persistence.

### Fixed
- **Stuck Loading State:** Resolved a critical bug where `tasksLoading` was gating the rendering of the Auth screen, causing the app to hang on "Loading your vibe..." for users with empty states. Logic now correctly checks for `user` existence before blocking UI.
- **Cross-Device Sync:** Verified and fixed session handling to allow smoother transitions between devices without "Expired Token" errors.

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
