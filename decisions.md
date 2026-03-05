# Architecture Decision Records (ADR)

## ADR-001: Framework choice (Next.js 15)

**Status:** Accepted

**Context:** Need a framework for Czech poetry assistant with:
- API routes (Gemini integration)
- Real-time components (auto-save, live metrics)
- Full-stack integration (database + frontend)

**Decision:** Use **Next.js 15 (App Router)** with TypeScript

**Rationale:**
- ✓ Built-in API routes (`src/app/api/`) = no separate backend server
- ✓ App Router simplifies file-based routing
- ✓ Server Components support (faster initial load)
- ✓ TypeScript first-class support
- ✓ Vercel deployment ready (if needed later)
- ✓ Reuses patterns from Scholia project (existing in workspace)

**Alternatives considered:**
- SvelteKit: Good, but smaller ecosystem
- FastAPI + React: More overhead for PoC
- Remix: More opinionated, steeper learning curve

---

## ADR-002: Database choice (SQLite + Drizzle ORM)

**Status:** Accepted

**Context:** Need to store:
- Poems (title, metadata)
- Versions (content history with timestamps)
- Tags (mood, genre labels)

**Decision:** Use **SQLite** with **Drizzle ORM**

**Rationale:**
- ✓ SQLite: zero-config, file-based (`bard.db`), no server needed
- ✓ Perfect for MVP (no DevOps overhead)
- ✓ Drizzle: lightweight, type-safe, similar to Scholia
- ✓ Can upgrade to PostgreSQL later if needed
- ✓ WAL mode: better concurrent writes
- ✓ Fit in filesystem (simple backups)

**Alternatives considered:**
- PostgreSQL: Overkill for MVP, needs server
- MongoDB: Not ideal for relational versioning data
- In-memory: Would lose data on restart

---

## ADR-003: LLM integration (Gemini CLI primary, SDK fallback)

**Status:** Accepted

**Context:** Need to integrate Gemini for creative assistance (alternatives, continuation, chorus).
Options: CLI, SDK, REST API.

**Decision:** **Gemini CLI primary** (`gemini -p <prompt>`) with **SDK fallback**

**Rationale:**
- ✓ CLI: fast, subprocess model, direct bash testing
- ✓ SDK: async, typed, production-ready fallback
- ✓ Both share same API key (`GEMINI_API_KEY`)
- ✓ Exponential backoff retry for robustness
- ✓ Matches Scholia's `commentary/route.ts` pattern (proven)

**Code pattern:**
```typescript
// Primary: CLI
execFile('gemini', ['-p', prompt], { timeout: 120000 })

// Fallback: SDK  
getGenerativeModel({ model: 'gemini-2.0-flash' }).generateContent(prompt)
```

**Alternatives considered:**
- SDK-only: Less flexibility, harder to debug
- REST API: Unnecessary latency, auth complexity
- Claude API: Out of scope (different key, not in plan)

---

## ADR-004: Czech language metrics (algorithmic, no ML)

**Status:** Accepted

**Context:** Need metrics:
- Syllable count per line
- Rhyme detection
- Stress patterns
- Singability score

**Decision:** **Algorithmic approach** (no ML model, no external service)

**Rationale:**
- ✓ Fast (no API calls)
- ✓ Simple to understand and modify
- ✓ Works offline
- ✓ Sufficient for MVP feedback
- ✓ Can upgrade to ML later if needed

**Algorithms:**
1. **Syllables:** Count vowel groups (a,e,i,o,u,á,é,í,ó,ú,ů,y,ý)
2. **Stress:** Czech always stresses 1st syllable (simple rule)
3. **Rhymes:** Compare last 2-3 characters of final word
4. **Singability:** Vowel/(vowel+consonant) ratio, ideal ~0.45

**Alternatives considered:**
- Czech NLP library (Czech language tools): too heavyweight for MVP
- ML model: overkill, needs GPU
- Manual rules database: not scalable

---

## ADR-005: State management (React hooks + API routes)

**Status:** Accepted

**Context:** Manage:
- Editor content
- Selected text for assist
- Version history
- Metrics state

**Decision:** Use **React hooks** (useState, useEffect) + **API routes** (server-side state)

**Rationale:**
- ✓ No external state library needed (Context overkill for this app size)
- ✓ Automatic debouncing (useEffect cleanup)
- ✓ Database writes via API routes (secure, scalable)
- ✓ Simple component composition

**Alternatives considered:**
- Redux: Overkill for small app
- Context API: Fine, but hooks are simpler
- Zustand: Not needed for MVP

---

## ADR-006: Styling (Tailwind CSS)

**Status:** Accepted

**Context:** Need responsive UI (3-column layout: editor, metrics, assist).

**Decision:** **Tailwind CSS**

**Rationale:**
- ✓ Utility-first: fast iteration
- ✓ Built-in dark mode support (future)
- ✓ Scholia uses it (consistency)
- ✓ No CSS-in-JS overhead
- ✓ Mobile-friendly responsive classes

**Alternatives considered:**
- Styled-components: Runtime CSS, slower
- CSS Modules: More boilerplate
- Vanilla CSS: No design system

---

## ADR-007: Error handling strategy

**Status:** Accepted

**Context:** Three main failure points:
1. Gemini API (rate limit, outage)
2. Database (lock, corruption)
3. User input (empty text)

**Decision:** 
- **Gemini failures:** Exponential backoff (1s → 32s), fallback to SDK, show error to user
- **Database failures:** Log error, return 500, user can retry
- **Input validation:** Client-side checks, server-side validation

**Rationale:**
- ✓ User-friendly error messages
- ✓ Automatic retry for transient failures
- ✓ No silent failures
- ✓ Logs for debugging

---

## Next Review

These decisions should be reviewed if:
- User requests a feature that conflicts with these choices
- Performance issues arise
- Database grows beyond single-file capacity
- Multi-user concurrency is needed

Planned review: After phase 1 (MVP) is complete.
