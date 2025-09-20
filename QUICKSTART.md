# 🚀 Quick Start Guide

Get your LeadAI platform up and running in minutes!

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be ready (2-3 minutes)
3. Go to **Settings > API** and copy:
   - Project URL
   - Anon public key
   - Service role key (keep this secret!)

## 3. Set Up Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase/schema.sql`
3. Paste and run the SQL to create tables and policies

## 4. Configure Environment

1. Copy `.env.local.example` to `.env.local`
2. Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you should see the landing page!

## 6. Test the Application

1. Click "Get Started" to create an account
2. Sign up with your email
3. You'll be redirected to the dashboard with 2 free audit credits
4. Click "New Audit" to test the audit flow

## 🎉 That's it!

Your LeadAI platform is now running locally.

## Next Steps

- **Add Google OAuth**: Set up Google OAuth in Supabase Auth settings
- **Customize branding**: Update colors, logos, and content
- **Deploy**: Use Vercel, Netlify, or your preferred platform
- **Add payments**: Integrate Stripe for subscription management

## Need Help?

Check the main README.md for detailed documentation and troubleshooting tips.

## Features Included

✅ User authentication (email + Google OAuth ready)  
✅ Dashboard with audit credits and history  
✅ New audit creation with 7 analysis types  
✅ Audit history with search and filtering  
✅ Account settings and profile management  
✅ Subscription plan management UI  
✅ Responsive design for all devices  
✅ Error handling and loading states  
✅ Toast notifications  
✅ AI readiness scoring system  

## Mock Data

The application includes mock audit results for testing. In production, you'll want to integrate with real AI analysis services.
