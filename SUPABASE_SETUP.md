# Supabase CORS Configuration Guide

If you're experiencing CORS errors when deploying to Vercel or other platforms, follow these steps:

## Fix CORS Errors

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Configure Authentication URLs**
   - Go to: **Authentication** > **URL Configuration**
   - Under **Site URL**, add:
     - For development: `http://localhost:3000`
     - For production: `https://your-domain.vercel.app` (or your custom domain)
   
3. **Add Redirect URLs**
   - Under **Redirect URLs**, add:
     - `http://localhost:3000/**` (for development)
     - `https://your-domain.vercel.app/**` (for production)
     - `https://*.vercel.app/**` (to allow all Vercel preview deployments)

4. **Save Changes**
   - Click "Save" at the bottom of the page

## Environment Variables

Make sure your `.env.local` (for development) and Vercel environment variables (for production) include:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Verify Configuration

After updating the URLs:
1. Wait a few minutes for changes to propagate
2. Clear your browser cache
3. Try logging in again

## Common Issues

- **CORS errors**: Make sure your production domain is in the Redirect URLs list
- **Network errors**: Verify your environment variables are set correctly in Vercel
- **Auth not working**: Check that email confirmation is disabled (or verify your email)

