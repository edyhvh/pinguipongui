# Testing Migration in Vercel Preview

## How Preview Works

Every push to your branch creates a **Preview deployment** with its own URL (e.g., `https://pinguipongui-git-jobs-xxx.vercel.app`).

## Steps to Test in Preview

### 1. Deploy to Preview

Simply push your branch or open a PR:
```bash
git push origin jobs
```

Vercel will create a Preview deployment. **Get the actual URL from the Vercel dashboard** (it will be something like `https://pinguipongui-git-jobs-abc123.vercel.app`).

### 2. Add Environment Variables for Preview

In Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `UPSTASH_REDIS_REST_URL` | Your Upstash URL | **Preview** |
| `UPSTASH_REDIS_REST_TOKEN` | Your Upstash token | **Preview** |

Make sure to select **Preview** (not Production).

> **Important**: If you already added them for "All" or "Production", that's fine - they'll work in preview too.

### 3. Run Migration on Preview

**Replace `YOUR_PREVIEW_URL` with your actual Vercel preview URL:**
```bash
curl -X POST https://YOUR_PREVIEW_URL/api/migrate
```

### 4. Test the App

Visit **your preview URL** and verify:
- Players are showing
- Matches are showing
- Rankings work
- You can add a new match

### 5. Verify Data Isolation

Check the status (replace with your preview URL):
```bash
curl https://YOUR_PREVIEW_URL/api/migrate
```

Both `blob` and `redis` should have your migrated data.

---

## Key Point: Preview ≠ Production

The Preview deployment uses:
- **A separate Redis database** (if you use the same Upstash credentials, it will share data with production)
- **Same Blob storage** (your existing Vercel Blob data)

### To Test Safely (with separate Redis):

1. Create a **separate Upstash database** for testing
2. Add its credentials only for Preview environment
3. Migration will copy Blob data to the test Redis
4. Production remains untouched

---

## After Testing Works

1. **Promote to Production**: Merge your branch to main
2. **Add Production env vars** (if not already added for All)
3. **Run migration on production**:
   ```bash
   curl -X POST https://your-project.vercel.app/api/migrate
   ```

Or just add env vars for "All environments" from the start - the preview will use Redis and your local dev will too (reading from `.env.local`).
