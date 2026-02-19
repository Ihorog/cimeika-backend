# CIMEIKA Backend

**7 Agents on Cloudflare Workers** | TypeScript + Hono + Agents SDK

## Про Cimeika

**Cimeika** - це екосистема інтелектуальних агентів для творчості та управління контентом.

### Ресурси
- 🌐 **Вебсайт:** [cimeika.com.ua](https://cimeika.com.ua) | [www.cimeika.com.ua](https://www.cimeika.com.ua)
- 💻 **GitHub:** [@Ihorog](https://github.com/Ihorog)
- 🤗 **HuggingFace:** [@Ihorog](https://huggingface.co/Ihorog) | [API](https://huggingface.co/spaces/Ihorog/cimeika-api)
- 📧 **Контакти:** iglu963@gmail.com | cimeika.com.ua@gmail.com

### Пов'язані проєкти
- [cit](https://github.com/Ihorog/cit) - Центральний інтерфейс
- [ciwiki](https://github.com/Ihorog/ciwiki) - Wiki система
- [cimeika-unified](https://github.com/Ihorog/cimeika-unified) - Уніфікований інтерфейс
- [cimeika-app](https://github.com/Ihorog/cimeika-app) - Мобільний застосунок
- [alisa-pwa-4](https://github.com/Ihorog/alisa-pwa-4) - PWA застосунок
- [media](https://github.com/Ihorog/media) - Медіа ресурси

## Агенти (7)
- 🧠 **Ci** - Оркестрація та моніторинг
- 📅 **Подія** - Події та тригери
- 💭 **Настрій** - Відстеження настрою
- 💡 **Маля** - Ідеї та творчість
- 📖 **Казкар** - Історії та наратив
- ⏰ **Календар** - Час та ритми
- 🖼️ **Галерея** - Зображення (R2)

## Tech Stack
- **Runtime:** Cloudflare Workers
- **Language:** TypeScript 5.x (strict mode)
- **Framework:** Hono ^4.0.0
- **AI:** OpenAI SDK ^4.77.0
- **Agents:** `agents` SDK
- **Storage:** KV, D1, R2, Analytics Engine

## API Endpoints

### Core
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check (status, checks, agents count) |
| `/api/status` | GET | Detailed system + agent status |
| `/api/manifest` | GET | API documentation listing |

### Agent Endpoints
Each of the 7 agents exposes:
| Pattern | Method | Description |
|---------|--------|-------------|
| `/api/agents/{agent}/status` | GET | Agent status |
| `/api/agents/{agent}` | POST | Send message to agent |

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Cloudflare Resources
```bash
# KV Namespaces
wrangler kv:namespace create CONFIG
wrangler kv:namespace create AUTH_TOKENS

# D1 Database
wrangler d1 create cimeika

# R2 Bucket
wrangler r2 bucket create cimeika-files
```

### 3. Update wrangler.jsonc
Fill in the IDs from previous commands.

### 4. Set Secrets
```bash
wrangler secret put GITHUB_TOKEN
wrangler secret put OPENAI_API_KEY
wrangler secret put HUGGINGFACE_TOKEN
wrangler secret put VERCEL_TOKEN
```

### 5. Run Locally
```bash
npm run dev
```

### 6. Deploy
```bash
npm run deploy
```

## Development

### Type Checking
```bash
npm run types
```

### Testing
```bash
npm test
npm run test:coverage
```

## Monitoring

### Health Check
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

### Metrics
- Metrics are written to the **Analytics Engine** (`ANALYTICS` binding).
- `logMetric(env, name, value, tags)` – low-level metric write.
- `reportEndpointMetric(env, endpoint, method, status, durationMs)` – per-request latency/status.
- `reportAgentStatus(env, agent, uptime, errors)` – agent health.
- `alert(env, message, severity)` – high-priority alert persisted to KV + Analytics.

## Architecture
```
src/
├── index.ts              # Entry point, routing
├── agents/               # 7 Durable Objects
│   ├── base-agent.ts
│   ├── ci-agent.ts
│   ├── podiya-agent.ts
│   ├── nastriy-agent.ts
│   ├── malya-agent.ts
│   ├── kazkar-agent.ts
│   ├── kalendar-agent.ts
│   └── gallery-agent.ts
├── integrations/         # External APIs
│   ├── github.ts
│   ├── huggingface.ts
│   └── vercel.ts
├── middleware/           # Auth, CORS, Rate Limit
├── types/                # TypeScript definitions
└── lib/                  # Utilities
    ├── health-check.ts   # getHealthStatus, verifyDeployment
    └── monitoring.ts     # logMetric, reportError, alert, …
```

## Language Invariant
- **UI:** Українська
- **Code:** English
- **API Messages:** Українська
- **Docs:** Українська

## Status
```
Backend: 100%
Agents: 7/7
Monitoring: ✅
Deployment: ✅ (pending Cloudflare resources)
```

## License
MIT
