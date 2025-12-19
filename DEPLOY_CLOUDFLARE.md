# Deploying Willow to Cloudflare Pages ☁️

Since you already have a Cloudflare account, this is the most cost-effective way to host Willow.

## 1. Push to GitHub
1. Create a new repository on GitHub (e.g., `willow-os`).
2. Follow the GitHub instructions to push your local code:
   ```bash
   git add .
   git commit -m "feat: initial willow release 🌿"
   git remote add origin https://github.com/your-username/willow-os.git
   git push -u origin main
   ```

## 2. Connect to Cloudflare Pages
1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Go to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
3. Select your GitHub repository.

## 3. Build Settings
Cloudflare will automatically detect the Vite setup. Ensure these match:
- **Framework preset:** `Vite`
- **Build command:** `npm run build`
- **Build output directory:** `dist`

## 4. Environment Variables (CRITICAL)
Before clicking **"Save and Deploy"**, you must add your Supabase credentials:
1. Click **"Environment variables"**.
2. Add your two keys from your `.env` file:
   - `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your-anon-key-here`

## 5. First Deployment
1. Click **Save and Deploy**. 🚀
2. Cloudflare will build the app and give you a URL (e.g., `willow-os.pages.dev`).

## 6. Auth Configuration (Supabase side)
To make Magic Links work on your new URL:
1. Go to your **Supabase Dashboard** -> **Authentication** -> **URL Configuration**.
2. Update the **Site URL** to your Cloudflare URL (e.g., `https://willow-os.pages.dev`).
3. Add `https://willow-os.pages.dev/**` to the **Redirect URLs**.

---
**Your app is now live, aesthetic, and completely free to run!** 🌿✨
