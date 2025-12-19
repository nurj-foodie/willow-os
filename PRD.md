# Willow - Product Requirements Document (PRD)

**Version:** 0.1 (Alpha)  
**Date:** December 2025  
**Target Audience:** Gen Z / Modern Professional ("Sofia")  
**Platform:** Web PWA (Mobile & Desktop)

---

## 1. Product Vision
To create a "Low-Stakes Productivity" tool that replaces grid-based anxiety with fluid, aesthetic "blocks." It prioritizes "vibe" and "flow" over rigid scheduling.

## 2. Tech Stack
- **Frontend:** React (Vite) + TypeScript
- **Styling:** Tailwind CSS (Gen Z / Glassmorphism aesthetic)
- **Animation/Physics:** `framer-motion` + `dnd-kit` (Liquid feel)
- **Backend/Database:** Supabase (PostgreSQL)
- **NLP:** `chrono-node` (Date/Time extraction)

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

### D. The "Reset Ritual"
- **Requirement:** End-of-day cleanup.
- **Logic:** Moves all uncompleted tasks from "Today" to "Tomorrow".
- **Visuals:** Validating message ("You did enough today") to reduce guilt.

## 4. Design Guidelines ("The Vibe")
- **Palette:** 
  - Background: `#FDFCF8` (Oat Milk/Cream)
  - Text: `#2D2D2D` (Soft Charcoal)
  - Accents: Sage Green, Muted Clay, Pale Lavender.
- **Typography:** Mix of clean Sans-Serif (Inter) and trendy Serif (Playfair Display).
- **Interactions:** Bouncy, forgiving, and "romanticized." No red text for errors/overdue items.
