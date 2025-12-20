# Supabase OTP Setup Guide

To enable 6-digit OTP codes for Willow, you need to update your email template in the Supabase Dashboard.

### 1. Go to Supabase Dashboard
Navigate to [Supabase Dashboard](https://supabase.com/dashboard/project/_/auth/templates) -> **Authentication** -> **Email Templates**.

### 2. Update Magic Link Template
Select the **Magic Link** template and update the **Message (Body)**. 

Since we are moving to OTP, you should include the `{{ .Token }}` variable. Here is a "Willow-style" template you can use:

```html
<div style="font-family: serif; color: #2D2D2D; background-color: #FDFCF8; padding: 40px; border-radius: 20px;">
  <h1 style="color: #2D2D2D;">Willow 🌿</h1>
  <p style="font-style: italic; color: #2D2D2D80;">Reclaim your space. Sync your vibe.</p>
  
  <div style="margin: 40px 0; padding: 20px; background-color: #D1E2C466; border-radius: 100px; text-align: center; font-size: 32px; letter-spacing: 10px; font-weight: bold;">
    {{ .Token }}
  </div>
  
  <p style="font-size: 14px; color: #2D2D2D66;">
    Enter this 6-digit code in the Willow app to continue.
  </p>
  
  <hr style="border: none; border-top: 1px solid #E8D5C433; margin: 30px 0;" />
  
  <p style="font-size: 12px; color: #2D2D2D33;">
    If you didn't request this, you can safely ignore this email.
  </p>
</div>
```

### 3. Save Changes
Click **Save** at the bottom of the page. 

> [!TIP]
> This template uses the same color palette (Oat Milk/Matcha) as the app to keep the experience seamless. Once you've updated this, the code I'm about to implement in the app will be able to verify these 6-digit codes!
