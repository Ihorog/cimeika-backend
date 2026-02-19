# CIMEIKA Backend - Deployment Guide

## 📦 Implementation Complete

✅ **All TypeScript strict mode checks passing**  
✅ **All tests passing**  
✅ **GitHub Actions workflows configured**  
✅ **Health check and monitoring utilities ready**

---

## 🚀 Deployment Steps

### Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

### Step 2: Login to Cloudflare

```bash
wrangler login
```

### Step 3: Create KV Namespaces

```bash
wrangler kv:namespace create CONFIG
wrangler kv:namespace create AUTH_TOKENS
```

Update `wrangler.jsonc` with the IDs from the output.

### Step 4: Create D1 Database

```bash
wrangler d1 create cimeika
wrangler d1 execute cimeika --file=./src/lib/db-schema.sql
```

Update `wrangler.jsonc` with the database ID.

### Step 5: Create R2 Bucket

```bash
wrangler r2 bucket create cimeika-files
```

### Step 6: Set Secrets

```bash
wrangler secret put GITHUB_TOKEN
wrangler secret put OPENAI_API_KEY
wrangler secret put HUGGINGFACE_TOKEN
wrangler secret put VERCEL_TOKEN
```

### Step 7: Deploy to Cloudflare Workers

```bash
npm run deploy
```

### Step 8: Verify Deployment

```bash
curl https://cimeika-backend.workers.dev/api/health
```

Expected response:
```json
{
  "status": "UP",
  "timestamp": "2026-02-19T18:00:00.000Z",
  "version": "0.1.0",
  "environment": "production",
  "agents": 7,
  "checks": { "kv": true, "analytics": true, "database": true }
}
```

---

## 🔧 GitHub Actions Setup

### Required Secrets

Add to repository: Settings → Secrets and variables → Actions

1. **CLOUDFLARE_API_TOKEN** – Cloudflare Dashboard → My Profile → API Tokens (Edit Cloudflare Workers template)
2. **CLOUDFLARE_ACCOUNT_ID** – Cloudflare Dashboard → Workers & Pages → Overview

### Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `deploy.yml` | Push to `main` | Deploy to Cloudflare Workers |
| `test.yml` | PR / push | Run test suite & type checks |
| `health-check.yml` | Schedule (every 5 min) | Monitor `/api/health` endpoint |

---

## 📊 API Endpoints

### Core Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/health` | GET | ❌ | Health check (KV, DB, Analytics) |
| `/api/status` | GET | ❌ | Detailed system + agent status |
| `/api/manifest` | GET | ❌ | API documentation |

### Agent Endpoints (7 agents)

Each agent (`ci`, `podiya`, `nastriy`, `malya`, `kazkar`, `kalendar`, `gallery`) exposes:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/agents/{agent}/status` | GET | ❌ | Agent status |
| `/api/agents/{agent}` | POST | ✅ | Send message to agent |

---

## 📈 Production Monitoring

### Health Check Utility

`src/lib/health-check.ts` exposes two functions:

```typescript
import { getHealthStatus, verifyDeployment } from './lib/health-check';

// Get current health (probes KV, D1, Analytics)
const health = await getHealthStatus(env);
// → { status: 'UP', checks: { kv, analytics, database }, ... }

// Verify all agent endpoints are reachable after deployment
const verification = await verifyDeployment(env);
// → { ok: true, agentsReachable: [...], agentsFailed: [] }
```

### Monitoring Utility

`src/lib/monitoring.ts` exposes:

```typescript
import {
  logMetric,
  reportError,
  reportAgentStatus,
  reportEndpointMetric,
  alert
} from './lib/monitoring';

// Custom metric
await logMetric(env, 'my_metric', 42, { tag: 'value' });

// Endpoint latency
await reportEndpointMetric(env, '/api/health', 'GET', 200, 12);

// Agent uptime + error count
await reportAgentStatus(env, 'ci', uptimeSeconds, errorCount);

// High-priority alert (persisted to KV + Analytics)
await alert(env, 'Database connection timeout', 'critical');
```

### Viewing Metrics

- Cloudflare Dashboard → Workers & Pages → cimeika-backend → **Analytics Engine**
- Last alert stored in KV key `last_alert` (expires after 24 h)

### Deployment Runbook

**Regular deploy:**
```bash
npm run deploy
curl https://cimeika-backend.workers.dev/api/health
```

**Rollback:**
```bash
# List recent deployments
wrangler deployments list
# Roll back to a specific deployment
wrangler rollback <deployment-id>
```

**Emergency – disable auth:**
```bash
# Temporarily allow all requests (removes AUTH middleware)
# Edit src/index.ts → remove createAuthMiddleware() line → redeploy
```

---

## 🔐 Authentication

Protected endpoints require a Bearer token:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://cimeika-backend.workers.dev/api/agents/ci
```

Add tokens to AUTH_TOKENS KV:
```bash
wrangler kv:key put --binding=AUTH_TOKENS "your-token" \
  '{"user":"admin","created":"2026-02-19T00:00:00.000Z"}'
```

---

## 🛠️ Local Development

```bash
npm install
npm run dev
# In another terminal:
curl http://localhost:8787/api/health
```

---

## 📝 Database Schema

Tables in D1 (`cimeika`):
- `users` – User accounts
- `agent_states` – Persistent agent states
- `events` – Inter-agent communication log
- `analytics` – Analytics events
- `health_checks` – Health check history

```bash
wrangler d1 execute cimeika --command "SELECT * FROM agent_states"
```

---

## ✅ Success Criteria

- [ ] `GET /api/health` returns `{ "status": "UP" }`
- [ ] All 7 agents respond to `/api/agents/{agent}/status`
- [ ] `getHealthStatus()` reports `checks.kv = true`
- [ ] `getHealthStatus()` reports `checks.database = true`
- [ ] Rate limiting returns 429 after >100 req/min
- [ ] CORS headers present on all responses
- [ ] GitHub Actions deploy workflow succeeds
- [ ] Health check workflow runs every 5 minutes

---

## 🐛 Troubleshooting

### "Durable Object binding not found"
Ensure all 7 DO bindings are in `wrangler.jsonc` and redeploy.

### "Database query failed"
```bash
wrangler d1 execute cimeika --file=./src/lib/db-schema.sql
```

### "KV namespace not found"
Create namespaces and update `wrangler.jsonc` with correct IDs.

### Health check shows `checks.kv = false`
Verify KV namespace IDs match `wrangler.jsonc`. Check `wrangler kv:namespace list`.

### Health check shows `checks.database = false`
Run the schema migration and verify D1 database ID in `wrangler.jsonc`.

---

**Status:** ✅ Ready for Deployment  
**Version:** 0.1.0  
**Last Updated:** 2026-02-19



## Нові таблиці (v0.2.0)

Після оновлення схеми виконати міграцію:

```bash
wrangler d1 execute cimeika --file=./src/lib/db-schema.sql
```

Нові таблиці:
- `mood_entries` — записи настрою (NastriyAgent)
- `ideas` — ідеї (MalyaAgent)
- `stories` — легенди/історії (KazkarAgent)
- `calendar_events` — події календаря (KalendarAgent)

Оновлена таблиця:
- `agent_states` — додано колонки `uptime_seconds`, `message_count`, `error_count`
