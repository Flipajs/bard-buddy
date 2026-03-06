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

## ADR-008: Key Detection Algorithm (Krumhansl-Schmuckler)

**Status:** Accepted

**Context:** MVP guitar mode needs to auto-detect musical key from a chord progression
(e.g., "Am G F E7" → detect key of A minor).

**Decision:** Use **Krumhansl-Schmuckler (KS) algorithm** with Pearson correlation.

**Rationale:**
- ✓ Well-established music theory foundation (40+ years of research)
- ✓ Works with chord progressions (not just MIDI notes)
- ✓ Gives confidence scores (Pearson r) — can show top 3 candidates
- ✓ No ML model needed — pure algorithmic (fast, offline)
- ✓ ~85% accuracy on common Western progressions (Czech folk/pop ideal)
- ✓ Mode-aware (detects major vs. minor)

**Algorithm sketch:**
1. Build pitch-class vector (PCV) from chord notes
2. For each of 24 candidate keys (12 roots × major/minor):
   - Rotate PCV to align with candidate tonic
   - Correlate against KS major/minor profile
3. Return candidates sorted by score

**Alternatives considered:**
- Circle-of-fifths heuristic: simpler but no confidence scores
- ML-based: overkill for MVP, needs training data
- Rule-based (Roman numeral analysis): brittle, inflexible

**Known limitations:**
- Modal interchange (bVII) lowers confidence score (musically correct)
- Chromatic chords may be mis-scored (intentional ambiguity)
- Minimum 3 chords recommended for reliable detection

---

## ADR-009: Chord Suggestions (Diatonic + Mood Weighting)

**Status:** Accepted

**Context:** After key detection, suggest next chord options that fit the detected key
and match the user's desired mood/emotion.

**Decision:** Use **diatonic chord table** (major/minor) with **mood-based degree weighting**.

**Rationale:**
- ✓ Music theory correct — harmonies stay in key, avoid clashing
- ✓ Fast & explainable — user sees why chords are suggested (degree + mood fit)
- ✓ Extensible — easy to add secondary dominants, modal interchange later
- ✓ No ML — pure lookup + sorting

**Mood mappings (7 moods):**
- `happy`: I IV V ii — bright, resolved chords
- `sad`: i VI iv ii° — minor-heavy, descending motion
- `tense`: vii° V iii vi — leading tone, unresolved dominants
- `epic`: I V VI IV — cinematic, all strong chords
- `romantic`: I vi IV ii — classic ballad/pop progression
- `dark`: i vii° VI III — minor with diminished/tension
- `neutral`: all degrees equal weight

**Harmonic minor override:** V → V7 (harmonic minor convention for authentic feel)

**Alternatives considered:**
- Random suggestions: not useful
- ML-based: overkill for MVP
- Hardcoded progressions: inflexible, not creative

---

## ADR-010: Groove Patterns (Static Library, Metadata Only)

**Status:** Accepted

**Context:** MVP needs simple groove/rhythm notation for guitar patterns
(e.g., "D DU DU" for pop strumming, "D DU" for ballad).

**Decision:** Use **static pattern library** with pure **metadata** (no audio processing).

**Rationale:**
- ✓ 6 preset patterns cover 80% of beginner/folk/pop use cases
- ✓ ASCII rendering only — no MIDI/audio engine needed
- ✓ Pattern extensibility — easy to add more patterns later
- ✓ Fits MVP scope — audio playback deferred to Phase 2
- ✓ Lightweight — no dependencies, pure data structures

**Pattern structure:**
- `GroovePattern`: id, name, timeSignature, tempo, `StrokeEvent[]`
- `StrokeEvent`: beat, subdivision, direction (D/U/x), accent flag
- Renders to ASCII: `"D! U D U"` for pop, `"D U D U"` for ballad

**Library contents (6 patterns):**
1. Basic 4/4 — 4 downstrokes (beginner)
2. Pop strum 4/4 — D-DU-DU pattern
3. Ballad 4/4 — slower DU-DU
4. Waltz 3/4 — 3-beat time
5. Folk 6/8 — compound meter (DDU DDU)
6. Travis picking — alternating bass + fingers

**UX tradeoff:**
- Limited to 6 presets initially (vs. infinite custom patterns)
- User can type/paste custom patterns in Phase 2
- MVP focuses on discovery of preset grooves that fit the key

**Alternatives considered:**
- Metronome/audio playback: Phase 2, too much scope for MVP
- Complex tab notation: deferred, use simpler ASCII for now
- ML-generated grooves: overkill, loss of explainability

---

## ADR-011: Variant Exploration UX (List + Timeline + Compare)

**Status:** Accepted

**Context:** For real lyric writing, user must quickly switch between drafts, understand progression,
and compare alternatives side-by-side without leaving the editor flow.

**Decision:** Add a dedicated `VariantSidebar` with three modes:
1. **Seznam (List)** — quick restore of recent versions + compact metrics
2. **Strom (Timeline)** — MVP linear timeline visualization with node selection
3. **Porovnání (Compare)** — A/B side-by-side content + metric deltas

**Rationale:**
- ✓ Minimizes context switching during writing (single right panel)
- ✓ Supports both exploration (timeline) and decision-making (A/B)
- ✓ Uses existing version data from `versions` API (no schema migration yet)
- ✓ Keeps iteration speed high while preparing for true branching DAG in next step

**Tradeoffs:**
- Timeline is currently linear (heuristic), not true branch DAG (`parent_id` missing)
- Compare is text+metrics only (no semantic diff yet)

**Alternatives considered:**
- Build full DAG schema first: more correct, slower to deliver
- Keep only version list: faster, but weak exploration UX

---

## ADR-012: Mobile-First Responsive Layout

**Status:** Accepted

**Context:** Original 3-column layout (editor + metrics + assist) is unusable on mobile (iPhone Safari).
Need live lyric-writing experience on phones without sacrificing desktop capabilities.

**Decision:** Implement **responsive breakpoint at 1024px (lg Tailwind)** with:
- **Desktop (≥1024px)**: Keep existing 3-column layout unchanged
- **Mobile (<1024px)**:
  - Full-screen editor (prioritize writing space)
  - Sticky bottom tab bar (5 buttons: Metrics, Assist, Guitar, Variants, Versions)
  - Bottom Sheet drawer (iOS-style) for tool panels
  - Touch-friendly spacing (larger buttons, 44px+ tap targets)

**Components:**
- `BottomSheet.tsx` — Reusable drawer component (backdrop, handle, close button)
- `page.tsx` — State: `mobileSheet` tracks open panel, responsive visibility with `hidden lg:flex`

**Rationale:**
- ✓ Editor gets 100% vertical space on mobile (critical for live writing)
- ✓ Bottom sheet pattern familiar to iOS users (low cognitive load)
- ✓ No desktop experience change (backward compatible)
- ✓ Tailwind `lg:hidden` / `hidden lg:flex` provides clean breakpoint
- ✓ Tab buttons are emoji-labeled for quick visual scanning
- ✓ Drawer closes on backdrop tap (standard mobile UX)

**Mobile UX Flow:**
1. Open app → full-screen editor
2. Tap "Metriky" button → bottom sheet slides up with metrics
3. Swipe down or tap × to close → back to editor
4. Tap "✨ Asist" → drawer opens with suggestions
5. Tap suggestion → inserted into editor, sheet closes automatically

**Touch Safety (iOS Safe Area):**
- `pb-8` on sheet content (avoid keyboard overlap)
- Buttons minimum 44×44px (iOS HIG recommendation)
- Sticky bottom bar fixed position (don't scroll away during typing)

**Alternatives considered:**
- Split layout (50/50 editor+tools): Too cramped on mobile, hard to write
- Full-screen tabs (each tool full screen): Too many taps, breaks flow
- Sidebar swipe drawer: Conflicts with iOS Safari gestures

---

## Next Review

These decisions should be reviewed if:
- User requests a feature that conflicts with these choices
- Performance issues arise
- Database grows beyond single-file capacity
- Multi-user concurrency is needed
- Key detection accuracy drops below 70% in real-world use
- Mobile usage patterns change (e.g., users want side-by-side metrics)

Planned review: After mobile testing with real users on iPhone Safari.
