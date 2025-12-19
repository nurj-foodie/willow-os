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
- **Mock Data:** Replaced local mock data with Supabase real-time stream.

### Fixed
- **Tailwind v4 Integration (Bug):** Fixed critical error where Vite failed to process Tailwind v4 directives. Added `@tailwindcss/postcss` and eventually pivoted to the `@tailwindcss/vite` plugin for native v4 support. [Timestamp: 21:10]
- **CSS Pre-processing (Bug):** Resolved "Internal Server Error" caused by unprocessed `@tailwind` and `@apply` rules in `index.css`. [Timestamp: 21:15]
- **TypeScript Types (Bug):** Fixed `verbatimModuleSyntax` errors by using `import type` for all type declarations. [Timestamp: 21:05]
- **Component Sync:** Fixed state synchronization in `LiquidStream` to ensure props update internal state correctly. [Timestamp: 21:12]
- **Position Ranking:** Implemented fractional indexing (Float) for tasks to allow infinite reordering without conflict. [Timestamp: 21:40]

### Build Stats
- **Primary Dependencies:** `framer-motion`, `dnd-kit`, `chrono-node`, `lucide-react`, `tailwindcss@4`.
- **Port:** Local server running on `http://localhost:5174`.
