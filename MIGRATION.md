# Migration Guide: Vercel Blob → Upstash Redis

## Overview

This project has been updated to use **Upstash Redis** as the primary storage backend, with **Vercel Blob** as a fallback. This guide walks you through migrating your existing data from Vercel Blob to Redis.

## Why Migrate?

- **Cost**: Redis can be more cost-effective for small-to-medium datasets
- **Performance**: Redis offers lower latency reads/writes
- **Reliability**: Upstash Redis provides built-in persistence

---

## Prerequisites

### 1. Set Up Upstash Redis

1. Go to [upstash.com](https://upstash.com) and create a free account
2. Create a new Redis database
3. Copy the **REST URL** and **REST TOKEN** from the dashboard

### 2. Add Environment Variables in Vercel

Add the following environment variables in your Vercel project settings:

| Variable Name | Value |
|---------------|-------|
| `UPSTASH_REDIS_REST_URL` | Your Upstash Redis REST URL (e.g., `https://xxx.upstash.io`) |
| `UPSTASH_REDIS_REST_TOKEN` | Your Upstash Redis REST Token |

> **Important**: Keep your `BLOB_READ_WRITE_TOKEN` for now - it's still used as fallback.

---

## Migration Steps

### Step 1: Deploy the Code

Deploy the current branch to Vercel. The new code includes:
- [`lib/redis-storage.ts`](lib/redis-storage.ts) - Redis storage implementation
- [`lib/storage-abstraction.ts`](lib/storage-abstraction.ts) - Unified storage layer
- [`app/api/migrate/route.ts`](app/api/migrate/route.ts) - Migration endpoint

### Step 2: Verify the Endpoint Works

Check the migration status:

```bash
curl -X GET https://your-project.vercel.app/api/migrate
```

Expected response:
```json
{
  "redisConfigured": true,
  "blob": {
    "playersCount": 5,
    "matchesCount": 20,
    "historyCount": 3,
    "seeded": true
  },
  "redis": null
}
```

### Step 3: Run the Migration

Execute the migration:

```bash
curl -X POST https://your-project.vercel.app/api/migrate
```

Expected response:
```json
{
  "success": true,
  "message": "Successfully migrated 5 players and 20 matches to Redis",
  "playersCount": 5,
  "matchesCount": 20
}
```

If data already exists in Redis:
```json
{
  "alreadyMigrated": true,
  "message": "Data already exists in Redis. No migration needed.",
  "playersCount": 5,
  "matchesCount": 20
}
```

### Step 4: Verify Migration Success

Check the status again:

```bash
curl -X GET https://your-project.vercel.app/api/migrate
```

Both `blob` and `redis` should now show data.

### Step 5: Test the Application

1. Visit your app at `https://your-project.vercel.app`
2. Verify players, matches, and rankings are displaying correctly
3. Try adding a new match to ensure writes work

### Step 6: (Optional) Remove Blob Dependency

Once you're confident Redis is working correctly:

1. You can remove the `BLOB_READ_WRITE_TOKEN` environment variable from Vercel
2. The app will now use Redis exclusively

---

## How It Works

### Storage Abstraction Layer

The [`lib/storage-abstraction.ts`](lib/storage-abstraction.ts) file provides:

- **Read**: Tries Redis first, falls back to Blob if Redis returns null
- **Write**: Writes to Redis first, falls back to Blob if Redis fails
- **Fallback**: If Redis isn't configured, it automatically uses Blob

```typescript
// Read flow
1. Try Redis → if data exists, return it
2. If Redis is empty/null, try Blob → return data if exists
3. If both are empty, return null

// Write flow
1. Try Redis → if successful, return
2. If Redis fails, fall back to Blob
```

### Migration Endpoint

The [`app/api/migrate/route.ts`](app/api/migrate/route.ts) endpoint:

- `POST /api/migrate` - Migrates all data from Blob to Redis (one-time)
- `GET /api/migrate` - Shows status of both stores

---

## Troubleshooting

### "Redis is not configured" Error

Make sure you added the environment variables in Vercel:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

**Redeploy** after adding variables.

### Migration Fails

Check Vercel function logs:
```bash
vercel logs your-project --follow
```

### Data Lost or Missing

Don't worry! Your original Blob data is still there. The migration is read-only - it copies data TO Redis but doesn't delete from Blob.

To restore from Blob:
1. Remove Redis data (in Upstash dashboard, delete the key `pinguipongui:data`)
2. The app will automatically fall back to Blob

---

## Rollback Plan

If something goes wrong:

1. **Keep both environment variables** initially (Blob + Redis)
2. The app will always try Redis first, fall back to Blob
3. To fully rollback: remove Redis env vars and redeploy

---

## File Changes Summary

| File | Purpose |
|------|---------|
| [`lib/redis-storage.ts`](lib/redis-storage.ts) | Redis storage using Upstash SDK |
| [`lib/storage-abstraction.ts`](lib/storage-abstraction.ts) | Unified storage with Redis-first, Blob-fallback |
| [`app/api/migrate/route.ts`](app/api/migrate/route.ts) | Migration endpoint |
| [`app/api/data/route.ts`](app/api/data/route.ts) | Updated to use abstraction |
| [`app/api/players/route.ts`](app/api/players/route.ts) | Updated to use abstraction |
| [`app/api/matches/route.ts`](app/api/matches/route.ts) | Updated to use abstraction |
| [`app/api/history/revert/route.ts`](app/api/history/revert/route.ts) | Updated to use abstraction |

---

## Questions?

- Upstash Docs: https://docs.upstash.com
- Vercel Blob: https://vercel.com/docs/storage/vercel-blob
