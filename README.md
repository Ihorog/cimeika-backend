# CIMEIKA Backend

**7 Agents on Cloudflare Workers** | TypeScript + Hono + Agents SDK

## Агенти
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
```

## Language Invariant
- **UI:** Українська
- **Code:** English
- **API Messages:** Українська
- **Docs:** Українська

## Status
```
Backend: 0% → 100%
Agents: 0/7 → 7/7
Deployment: ❌ → ✅
```

## License
MIT
