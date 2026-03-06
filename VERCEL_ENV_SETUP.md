# Adding Environment Variables to Vercel

## Quick Answer

You need to add them in the **Vercel Dashboard**, not just `.env.local`. Here's how:

### Method 1: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click **Settings** (gear icon)
4. Click **Environment Variables** in the left sidebar
5. Add each variable:

| Name | Value | Environment |
|------|-------|-------------|
| `UPSTASH_REDIS_REST_URL` | Your Upstash REST URL | Production, Preview, Development |
| `UPSTASH_REDIS_REST_TOKEN` | Your Upstash REST Token | Production, Preview, Development |

6. Click **Save**

### Method 2: Via Vercel CLI

```bash
vercel env add UPSTASH_REDIS_REST_URL
# Enter your Upstash URL when prompted

vercel env add UPSTASH_REDIS_REST_TOKEN  
# Enter your Upstash token when prompted
```

### After Adding Variables

**Important**: You must **redeploy** for the variables to take effect:

```bash
vercel --prod
```

Or trigger a new deployment from the Vercel dashboard.

---

## Why .env.local Doesn't Work in Production

`.env.local` is only used for **local development** (when running `vercel dev` or `npm run dev`). 

When you deploy to Vercel:
- Environment variables set in the Vercel Dashboard are used
- `.env.local` is **never** deployed to production

---

## Verifying It Works

After redeploying, test the migration endpoint:

```bash
curl https://your-project.vercel.app/api/migrate
```

Should return `"redisConfigured": true`.
