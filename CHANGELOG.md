# Changelog

All notable changes to the Willow project will be documented in this file.


## [2026-01-11] - Web Push Notifications & Deployment [16:00 UTC+8]

### Added
- **Web Push Notifications**: Complete implementation of background push notifications using VAPID and Supabase Edge Functions.
- **Service Worker**: Migrated PWA to `injectManifest` strategy with custom `sw.ts` for handling push events.
- **Push Scheduler**: Edge Function to poll for due tasks every minute and send alerts.
- **UI**: Added Notification toggle (Bell icon) in the app header and `usePushNotifications` hook.

## [2026-01-04] - Interactive Tutorial & Ground Testing Fixes [22:45 UTC+8]

### Added
- **Interactive Spotlight Tutorial:** deeply integrated "show, don't tell" guide for new users.
  - **"Baby Steps" Flow:** Highlights UI elements (Input, Calendar, Ledger) sequentially, requiring user interaction to advance.
  - **Smart Positioning:** Tooltips anchor intelligently to avoid blocking input areas.
  - **Auto-Rescue:** Detects users with "seeded" tasks who missed onboarding and launches the tour automatically.
  - **Restart Capability:** Added manual Help button to restart the tutorial anytime.
- **Enhanced Ledger Export:** PDF now includes professional headers, category breakdowns, and payment dates.
- **PWA Install Prompt:** Guidance for iOS users to add the app to their home screen.
- **Willow Leaf Icons:** Updated app branding with new logo assets.

### Changed
- **Account Deletion:** Now performs a "Deep Clean", wiping not just tasks but also Profile, Ledger, and Wellbeing data for a true hard reset.
- **Wrap the Day:** Improved summary modal logic to show completed vs incomplete counts and handle auto-rollover cleanly.
- **Authentication:** Temporarily disabled strict device verification for smoother beta testing.

### Fixed
- **Android Scanner Animation:** Replaced Framer Motion with CSS animations to fix rendering issues on some Android webviews.
- **Task Visibility:** Completed tasks now remain visible (strikethrough) until the end-of-day wrap-up, fixing the "disappearing task" confusion.
- **Input Tooltip Overlap:** Refined tutorial positioning to ensure the input bar is never obscured.
## [2025-12-30] - UX Polish: Greetings & Calendar Improvements [23:00 UTC+8]

### Added
- **Dynamic Time-Based Greetings**: Supportive messages that change throughout the day (morning/afternoon/evening)
  - Random selection from curated message pool for variety
  - Maintains "bestie vibes" tone with emojis
  - Examples: "Good Morning ☀️", "Afternoon Flow 🌤️", "Evening Reflection 🌙"

### Fixed
- **Calendar Task Indicators**: Dots now correctly appear on ALL dates with tasks
  - Previously only showed dots for currently selected date
  - Improved query to fetch all non-done tasks globally
  - Added client-side filtering for performance
  - Calendar can now show complete month view with all task indicators

## [2025-12-29] - Calendar Feature Implementation [23:00 UTC+8]

### Added
- **Interactive Calendar View**: Monthly calendar modal with task indicators and date selection
- **Smart Date Assignment**: Natural language parsing for task dates ("tomorrow", "next week", "Dec 31")
- **Task Count Indicators**: Subtle dots on calendar dates showing which days have tasks
- **Date-Based Task Filtering**: Click any date to filter tasks to that specific day
- **Task Edit Modal**: Full-featured editing modal for task title, due date, and priority
- **Task Delete**: Delete tasks directly from edit modal with confirmation dialog
- **Responsive Design**: Calendar and edit buttons optimized for both mobile and desktop
- **Today's Focus Header**: Date display showing currently selected date

### Changed
- **Removed "Non-negotiables" Section**: Replaced with calendar-based task management
- **Edit Button Only on Cards**: Moved delete button to edit modal for cleaner UI
- **Task Card Styling**: Single edit button with responsive opacity for better UX
- **Default Date Assignment**: Tasks without explicit dates default to currently selected date

### Fixed
- **State Management**: Implemented safe selectedDate state to avoid infinite reload loops
- **Parking Lot Persistence**: Parked tasks remain visible across all date selections
- **Mobile Button Visibility**: Edit buttons always visible on mobile (70% opacity), hover on desktop

## [2025-12-27] - Receipt Scanner & Ledger Enhancements [13:50 UTC+8]

### Added
- **Auto-Save Receipts**: Scanned receipts now save instantly without requiring a form submission.
- **Ledger Entry Edit/Delete**: Inline editing and deletion of ledger entries with always-visible buttons.
- **Receipt Thumbnails**: Mini image previews in Flow Log; tap to view fullscreen.
- **Duplicate Detection**: Warning dialog when scanning a receipt similar to existing entries.
- **PDF Export with Images**: Download ledger as PDF with embedded receipt thumbnails.

### Fixed
- **Thumbnail Not Rendering**: Changed from `getPublicUrl()` to `createSignedUrl()` for private storage bucket.
- **Duplicate Warning Timing**: Scanner now closes before showing confirm dialog.
- **Mobile Edit/Delete Buttons**: Made buttons always visible (no hover on touch devices).

## [2025-12-26] - Reliability & Performance Fixes [07:30 UTC+8]


### Fixed
- **Receipt Scanner Flow**: Added defensive parsing and sanitization for Gemini AI responses to prevent UI hangs.
- **Bulk Archiving**: Refactored the "Reset Ritual" to use a single batch update for archiving tasks, improving performance and reliability.
- **Category Mapping**: Automatic mapping of AI-detected categories (e.g., "Food & Drink") to Willow's internal ledger categories.
- **Mobile Receipt Scanner**: Fixed "Maximum call stack size exceeded" error when processing large receipt images (2.8MB+) by implementing chunked base64 conversion in the Edge Function.
- **Ledger Database**: Created `ledger` table in Supabase with RLS policies for storing receipt entries.

### Added
- **Demo Mode Ledger Support**: Added localStorage persistence for the Ledger to work fully offline in Demo Mode.
- **Comprehensive Logging**: Added detailed diagnostic logging throughout the receipt scanner flow for easier debugging.

## [2025-12-25] - Authentication Redesign & AI Upgrade [00:00 UTC+8]

### Changed
- **Authentication System Overhaul:** Replaced biometric/passkey login with Google OAuth for improved reliability.
    - Removed `PasskeyService.ts`, `PasskeyBanner.tsx`, and all WebAuthn Edge Functions.
    - Implemented Google OAuth with "Continue with Google" button.
    - Added device-based OTP verification for new devices (first-time only).
    - Device fingerprinting via `DeviceVerification.tsx` for seamless re-authentication on known devices.
    - Demo Mode preserved unchanged for local-only testing.
- **Gemini AI Model Upgrade:** Updated receipt scanning from `gemini-1.5-flash` (obsolete) to `gemini-2.0-flash-exp`.
    - Improved accuracy and speed for receipt data extraction.
    - Deployed updated Edge Function to production.

### Removed
- **Biometric Authentication:** Completely removed passkey/WebAuthn support.
    - Deleted `PasskeyService.ts`, `PasskeyBanner.tsx`
    - Removed `webauthn-registration` and `webauthn-authentication` Edge Functions
    - Dropped `passkeys` database table
- **Magic Link Email/OTP:** Removed email-based Magic Link flow (superseded by Google OAuth).

### Breaking Changes
- **Existing users must re-authenticate** using Google OAuth
- First login after update requires OTP verification
- Passkey credentials no longer valid

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
