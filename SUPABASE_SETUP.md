# Supabase Setup Guide for Willow 🌿

Follow these steps to connect your local Willow app to a live Supabase backend.

## 1. Create a Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **"New Project"**.
3. Give it a name (e.g., `Willow OS`) and set a secure database password.
4. Wait for the project to finish provisioning.

## 2. Set Up the Database Schema
1. In your Supabase Dashboard, go to the **SQL Editor** (icon that looks like `>_` on the left).
2. Click **"New Query"**.
3. Copy the content from the file in your project: `[tasks.sql](file:///Users/izura/Documents/Willow OS/supabase/migrations/tasks.sql)`.
4. Paste it into the SQL Editor and click **"Run"**.
   - *This creates the `tasks` table, sets up the Enums, and enables Row Level Security (RLS).*

## 3. Enable Realtime
*Note: The SQL script already tries to do this, but it's good to double-check.*
1. Go to **Database** -> **Publications**.
2. Ensure `supabase_realtime` is active and includes the `tasks` table.

## 4. Get Your API Keys
1. Go to **Project Settings** (gear icon) -> **API**.
2. Find the following two values:
   - **Project URL** (e.g., `https://xyz.supabase.co`)
   - **`anon` `public` API Key**

## 5. Configure Local Environment
1. Create a new file in your project root called `.env`.
2. Copy the content from `.env.example` into `.env`.
3. Replace the placeholder values with the keys you found in Step 4:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 6. Restart the App
1. Stop your terminal running `npm run dev`.
2. Start it again: `npm run dev`.
3. Willow will now automatically detect your keys and switch from "Mock Mode" to **"Real-time Phase"**! 🚀
