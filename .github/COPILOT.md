# GitHub Copilot Rules - CIMEIKA Backend

## Code Style

### TypeScript
- **Strict mode:** All compiler strict flags enabled
- **No `any`:** Use explicit types or `unknown`
- **Return types:** Mandatory for all functions
- **Prefer:** `interface` over `type` for object shapes

### Naming Conventions
- **Files:** kebab-case (`ci-agent.ts`, `health-check.ts`)
- **Classes:** PascalCase (`CiAgent`, `BaseAgent`)
- **Functions:** camelCase (`calculateScore`, `checkHealth`)
- **Constants:** UPPER_SNAKE_CASE (`DEFAULT_TIMEOUT`, `MAX_RETRIES`)
- **Interfaces:** PascalCase with `I` prefix optional (`AgentState` or `IAgentState`)

## Agent Pattern

### All agents MUST:
1. **Extend** `BaseAgent<StateType>`
2. **Implement:**
   - `getDefaultState(): StateType`
   - `calculateScore(): number`
   - `checkHealth(): Promise<HealthStatus>`
3. **Use:**
   - `this.setState(state)` for state updates
   - `this.sql<Type>` for D1 queries
   - `this.schedule()` for cron tasks
4. **Handle:**
   - `onRequest(req): Response`
   - `onConnect(ws): void`
   - `onMessage(ws, msg): void`

### Example Agent Structure
```typescript
import { BaseAgent } from './base-agent';

interface MyAgentState {
  score: number;
  lastCheck: number;
}

export class MyAgent extends BaseAgent<MyAgentState> {
  getDefaultState(): MyAgentState {
    return { score: 0, lastCheck: Date.now() };
  }

  async calculateScore(): Promise<number> {
    // Implementation
    return 0.85;
  }

  async checkHealth(): Promise<HealthStatus> {
    // Implementation
    return { status: 'healthy', timestamp: Date.now() };
  }

  async onRequest(req: Request): Promise<Response> {
    // Handle HTTP requests
    return new Response('OK');
  }
}
```

## Language Invariant

### Ukrainian Language Rules
- **UI text:** Українська (user-facing strings)
- **Code:** English (variables, functions, comments)
- **Error messages to users:** Українська
- **API field names:** English (`score`, `status`)
- **API response messages:** Українська (`"Помилка з'єднання"`)
- **Documentation:** Українська (README, docs/)
- **Commit messages:** English (`feat:`, `fix:`)

### Example
```typescript
// ✅ CORRECT
interface HealthResponse {
  status: 'healthy' | 'degraded';  // English field
  message: string;                  // Ukrainian value
}

const response: HealthResponse = {
  status: 'healthy',
  message: 'Система працює нормально'  // Ukrainian
};

// ❌ WRONG
interface HealthResponse {
  статус: 'здоровий';  // Ukrainian field names
}
```

## Security

### Mandatory Checks
- ✅ No hardcoded secrets (use `env.SECRET_NAME`)
- ✅ Input validation on all endpoints
- ✅ SQL parameterized queries (`db.prepare().bind()`)
- ✅ CORS configured (whitelist domains)
- ✅ Rate limiting (100 req/min per IP)

### Example
```typescript
// ✅ CORRECT
const stmt = db.prepare('SELECT * FROM users WHERE id = ?').bind(userId);

// ❌ WRONG
const stmt = db.prepare(`SELECT * FROM users WHERE id = ${userId}`);
```

## Testing

### Coverage Requirements
- **Unit tests:** >80% coverage
- **Integration tests:** All agents
- **Test file naming:** `*.test.ts` in `tests/` directory

### Example
```typescript
import { describe, it, expect } from 'vitest';
import { CiAgent } from '../src/agents/ci-agent';

describe('CiAgent', () => {
  it('should calculate score correctly', async () => {
    const agent = new CiAgent();
    const score = await agent.calculateScore();
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});
```

## Error Handling

### Always:
- Catch async errors
- Return meaningful Ukrainian messages
- Log errors to Analytics Engine
- Use proper HTTP status codes

### Example
```typescript
try {
  const data = await fetchExternal();
  return Response.json(data);
} catch (error) {
  console.error('External API error:', error);
  return Response.json(
    { error: 'Не вдалося отримати дані' },  // Ukrainian
    { status: 500 }
  );
}
```

## Commit Messages

### Format
```
type(scope): short description

- Detailed change 1
- Detailed change 2

Refs: #issue-number
```

### Types
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style (formatting)
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Maintenance

### Examples
```
feat(ci-agent): add health check endpoint
fix(auth): resolve token validation issue
docs(readme): update setup instructions
```

## Performance

### Best Practices
- ✅ Use `Promise.all()` for parallel operations
- ✅ Cache KV reads (5min default)
- ✅ Minimize D1 queries (batch when possible)
- ✅ Stream large R2 objects
- ✅ Set proper cache headers

### Example
```typescript
// ✅ CORRECT - Parallel
const [user, config, stats] = await Promise.all([
  env.KV.get('user'),
  env.KV.get('config'),
  env.DB.prepare('SELECT * FROM stats').first()
]);

// ❌ WRONG - Sequential
const user = await env.KV.get('user');
const config = await env.KV.get('config');
const stats = await env.DB.prepare('SELECT * FROM stats').first();
```

## AI/LLM Guidelines

### When using OpenAI SDK:
- **Always** set `max_tokens` limit
- **Always** handle rate limits (429)
- **Always** validate responses
- **Stream** responses when possible
- **Log** token usage to Analytics Engine

### Example
```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: prompt }],
  max_tokens: 500,
  stream: true
});
```

## Cloudflare Workers Specifics

### Limits to Remember
- **CPU:** 50ms per request (paid: 30s)
- **Memory:** 128MB
- **Request size:** 100MB
- **Response size:** Unlimited (streaming)
- **Durable Objects:** Unlimited storage

### Optimization
- Use Workers for routing and light processing
- Offload heavy tasks to Durable Objects
- Use `waitUntil()` for non-blocking operations
- Minimize cold start time (keep bundle small)

## Documentation

### Required in Code
- **JSDoc** for public APIs
- **Inline comments** for complex logic only
- **README** for each major module

### Example
```typescript
/**
 * Calculates agent health score based on recent activity
 * @param {number} recentChecks - Number of checks in last hour
 * @returns {Promise<number>} Health score between 0 and 1
 */
async function calculateHealthScore(recentChecks: number): Promise<number> {
  // Complex calculation logic
  return score;
}
```
