# 🎵 Interactive Writing UX Design — bard-buddy Phase 2

**Created:** 2026-03-06
**Target User:** Filip (lyricist, real-time songwriting)
**Scope:** Variant exploration, version branching, A/B testing, drag-drop structure, Czech metrics integration
**Timeline:** Phase 2 (2–3 weeks)

---

## 1. User Journey: From Idea → Variants → Polished Song

### Stage 1: Ideation & Draft (5–10 min)
Filip writes his first verse and sees:
- **Editor:** Auto-saving every 3s
- **Metrics Panel:** Syllable count [6], Singability 85%, Rhyme ending (-mnou)
- **Right Panel:** Option to generate variants with one click

### Stage 2: Variant Exploration (10–20 min)
Filip sees 3–5 Gemini suggestions in **Variant Sidebar**:
```
A) "Modrá obloha visí nad mnou"    [6 syl] [85%] [✓ current]
B) "Modré nebe šíří se ade mnou"   [6 syl] [87%] [better!]
C) "Skrytá obloha sklání ke mně"   [7 syl] [81%] [different rhyme]
```
He **clicks** variant B → editor swaps instantly (cached metrics, <100ms).
He **compares** A vs B → Compare panel shows delta: B is +2% singability.

### Stage 3: Build Full Song (20–45 min)
Filip structures his song with drag-drop:
```
Verse 1:     [branch v1.1] — "Modré nebe..."
Pre-Chorus:  [v1 active]
Chorus:      [branch v2.3] — "Vysoko, vysoko..."
Verse 2:     [v1.0] — drafting
Bridge:      [optional, notes]
```
Each section has its own variant tree.

### Stage 4: Polish & Finalize (10–15 min)
Filip checks final metrics:
- Syllable consistency: 6 per line ✓
- Singability: 87% ✓
- Rhyme scheme: ABAB ready ✓
- Stress patterns: 1st syllable emphasis = OK ✓

**Saves final v1.0** → timeline shows: Original → 4 iterations → Final.

---

## 2. Layout & Panels (Concrete Wireflow)

### Main Screen: Editor + Metrics + Variants

```
┌─────────────────────────────────────────────────────┐
│ 🎵 bard-buddy │ "Moje báseň"  [Title input]         │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Left (60%)      │ Middle (16%)  │ Right (24%, tabs) │
│ EDITOR          │ METRICS       │ [Assist][Vars]    │
│                 │               │ [Compare][Guitar] │
│                 │               │ [Timeline][Exp]   │
│ ─────────────── │ ─────────────  │ ──────────────   │
│                 │               │                  │
│ [Verse 1]       │ Summary:      │ Current Line:    │
│ "Modrá obloha   │  Lines: 12    │ "Modrá obloha... │
│  visí nad mnou" │  Avg syl: 6.2 │                  │
│  [v1][v2][v3]   │  Sing: 85%    │ Variants:        │
│ [6][85%][mnou]  │               │                  │
│  (inline badges)│ Line Detail:  │ A) "Modrá..."    │
│                 │ ┌──────────┐  │    [6][85%][mnou]│
│ Verse 2:        │ │ "Modrá"  │  │    ✓ Current    │
│ [v1][v2]        │ │ 6 syl    │  │ [pin][compare]   │
│                 │ │ 85% sing │  │                  │
│                 │ │ -mnou    │  │ B) "Modré..."   │
│                 │ │ Stress:1st│ │    [6][87%][mnou]│
│                 │ └──────────┘  │    Better! (87%) │
│                 │               │ [select][compare]│
│ ≡ [Chorus]      │               │                  │
│ "Vysoko..."     │               │ C) "Skrytá..."  │
│ [v1][v2]        │               │    [7][81%][mně]│
│ [8][88%][sky]   │               │ [select][compare]│
│                 │               │                  │
│                 │               │ [+ Generate more]│
│                 │               │                  │
│ ≡ [Bridge]      │               │                  │
│ "Mezi zvězdami" │ Note: Hover   │                  │
│ [draft]         │ any badge →   │ [+ Add manual]   │
│ [6][82%][xxx]   │ highlights    │                  │
│ ⚠ Rhyme issue   │ in editor     │                  │
│                 │               │                  │
├─────────────────────────────────────────────────────┤
│ Footer: Rows: 12 │ Chars: 450 │ Auto-save (3s) ... │
└─────────────────────────────────────────────────────┘
```

**Key Interactions:**
- Click `[v1]` / `[v2]` → instant swap (metrics cached)
- Click `[pin]` → move to top, mark favorite
- Click `[compare]` → open Compare panel
- Click `[+ Generate more]` → Gemini API, fetch 3–5 variants
- Drag section header `≡` → reorder song structure

---

### Screen B: Compare Panel (A/B Testing)

```
┌──────────────────────────────────────────────────┐
│ < Back          Compare Variants                 │
├──────────────────────────────────────────────────┤
│ Variant A (current)    │  Variant B (alt)        │
├────────────────────────┼─────────────────────────┤
│                        │                         │
│ "Modrá obloha visí     │ "Modré nebe šíří se    │
│  nad mnou"             │  ade mnou"             │
│                        │                         │
│ Syllables: 6           │ Syllables: 6           │
│ Singability: 85%       │ Singability: 87% ✓     │
│ Rhyme: -mnou           │ Rhyme: -mnou           │
│ Stress: 1st, 4th, 7th  │ Stress: 1st, 4th, 7th  │
│                        │                         │
│ Metrics Delta:         │                         │
│ • Singability: A 85%   │                         │
│   vs B 87% (+2%)       │                         │
│ • Flow: B is more      │                         │
│   natural (8-char     │                         │
│   words flow better)  │                         │
│                        │                         │
│ Poetic Feel:           │                         │
│ A: melancholic,        │                         │
│    long vowels         │                         │
│ B: bright, flowing     │                         │
│                        │                         │
├────────────────────────┴─────────────────────────┤
│ [Choose A (keep current)]  [Choose B (swap)]     │
│ [Blend both] [Cancel]                           │
└──────────────────────────────────────────────────┘
```

---

### Screen C: Timeline / Branching Tree View

```
┌──────────────────────────────────────────────────┐
│ Timeline: Verse 1 (Branching Tree)              │
├──────────────────────────────────────────────────┤
│                                                  │
│  v1 [11:23] ──→ v2 [11:25] ──→ v3 [11:27]      │
│  "Modrá..." │    "Modré..." │    "Skrytá..."   │
│  [5 syl]    │    [6 syl] ✓  │    [7 syl]       │
│  [80%]      │    [85%]      │    [81%]         │
│             │                                   │
│             └──→ Branch: "Chorus draft" [11:26] │
│                  "Vysoko nad hvězdami"          │
│                  [8 syl] [88%]                  │
│                                                  │
│  Interactions:                                   │
│  • Click any node → load that version            │
│  • Right-click → (Branch | Rename | Delete)     │
│  • Hover → show full content + metrics          │
│  • Drag → reorder in tree (Phase 3)             │
│                                                  │
│  [Export Timeline] [Collapse All] [Expand All]  │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### Screen D: Drag & Drop Song Structure

```
┌──────────────────────────────────────────────────┐
│ Song Structure (Drag & Drop)                    │
├──────────────────────────────────────────────────┤
│                                                  │
│ 1. ≡ [Verse 1] (active v1.1)                   │
│    "Modré nebe šíří se ade mnou..."            │
│    [6 syl per line] [87% singability] ✓         │
│                                                  │
│ 2. ≡ [Pre-Chorus] (v1)                         │
│    "Vysoko, vysoko..."                         │
│    [8 syl] [88%]                               │
│                                                  │
│ 3. ≡ [Chorus] (active v2.3)                    │
│    "Modré, modré, modré nebe..."              │
│    [8 syl] [88%] [AABB rhyme] ✓                │
│                                                  │
│ 4. ≡ [Verse 2] (v1.0)                          │
│    "Sní věř zoufalů..."                        │
│    [6 syl] [84%]                               │
│                                                  │
│ 5. ≡ [Bridge] (DRAFT)                          │
│    "Mezi zvězdami..."                          │
│    [6 syl] [82%]                               │
│    ⚠ Rhyme mismatch with Verse 3               │
│                                                  │
│ [+ Add Section] [Import from Library]           │
│                                                  │
│ Overall Metrics:                                │
│ • Total lines: 14                               │
│ • Avg syllables/line: 6.2                       │
│ • Overall singability: 86%                      │
│ • Rhyme scheme: Mostly ABAB (Bridge ⚠)         │
│                                                  │
│ [Preview in Order] [Save Structure] [Reset]     │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 3. Data Model: Branching Tree (Not Linear History)

### Current Schema (Linear)
```sql
-- Problem: no branching info, all versions in flat list
versions
  id INTEGER PRIMARY KEY
  poem_id INTEGER FK
  content TEXT
  created_at INTEGER
```

### Proposed Schema (With Branching)

```sql
-- Sections (Verse 1, Verse 2, Chorus, etc.)
sections
  id INTEGER PRIMARY KEY
  poem_id INTEGER FK
  section_type TEXT ('verse', 'chorus', 'pre_chorus', 'bridge', 'intro', 'outro')
  section_number INTEGER (for multiple verses)
  display_order INTEGER (for drag & drop)
  created_at INTEGER

-- Versions with parent_id for tree structure
versions
  id INTEGER PRIMARY KEY
  poem_id INTEGER FK
  section_id INTEGER FK
  content TEXT
  parent_version_id INTEGER FK  ← CRITICAL: NULL = root, else = tree parent
  branch_label TEXT ('Chorus draft', 'Guitar section', NULL for main branch)
  is_active BOOLEAN (which variant is currently shown)
  created_at INTEGER
  metrics_cache JSON ({ syllables, singability, rhyme_endings, stress_pattern })

-- Variant metadata (for fast A/B compare UI)
variant_metadata
  id INTEGER PRIMARY KEY
  version_id INTEGER FK UNIQUE
  syllable_count INTEGER
  avg_singability FLOAT
  primary_rhyme_ending TEXT
  stress_pattern TEXT
  manual_notes TEXT
  is_favorite BOOLEAN
  created_at INTEGER
```

**Why This Works:**
1. **Spatial Orientation:** `display_order` + `section_type` → clear layout (Verse 1, Verse 2, Chorus, Bridge)
2. **Branching:** `parent_version_id` creates tree, not linear list
3. **Quick Testing:** `variant_metadata` pre-caches metrics → <100ms toggle
4. **Drag & Drop:** `display_order` is mutable, sections reorder on save
5. **Czech Metrics:** `metrics_cache` avoids re-computing on toggle

---

## 4. Keyboard Shortcuts (Power-User Features)

| Shortcut | Action |
|----------|--------|
| `Ctrl+E` | Toggle Editor/Metrics width (expand one, collapse other) |
| `Ctrl+V` | Cycle through variants of current line |
| `Ctrl+Z` / `Ctrl+Y` | Undo/Redo version history |
| `Ctrl+T` | Open Timeline / Branching tree view |
| `Ctrl+Shift+C` | Compare current + previous version |
| `Ctrl+Shift+B` | Branch current version with label |
| `Ctrl+/` | Show all shortcuts |

---

## 5. MVP vs Phase 3+ (Prioritized Fiche List)

### Phase 2 (MUST-HAVE for "interactive writing" — 2–3 weeks)

- [ ] **Variant Sidebar + Quick Toggle**
  - Display 3–5 variants in right panel
  - Each shows: syllables, singability %, rhyme ending
  - Click to swap editor content instantly (cached metrics)
  - Must achieve <100ms toggle latency

- [ ] **Metrics Caching**
  - Cache metrics in `variant_metadata` table
  - Populate on variant creation (Gemini + metrics API)
  - Use cached metrics on toggle (no re-compute)
  - Async background refresh if >1h old

- [ ] **Branching Tree UI (Simple)**
  - Replace linear version list with tree visualization
  - Add `parent_version_id` to schema (backward compat)
  - Click node → load version
  - Right-click → (Branch | Rename | Delete)
  - Visual indicators for "main branch" vs "alternative"

- [ ] **Compare Panel (A/B Side-by-Side)**
  - New modal: two variants side-by-side
  - Auto-highlight metric deltas (green = better)
  - "Choose A" / "Choose B" buttons to commit
  - Show why one is better (e.g., "+2% singability, better flow")

- [ ] **Inline Metrics Badges**
  - Per-line badges: `[6 syl]` `[85%]` `[-mnou]`
  - Color-coded singability bars (red/yellow/green)
  - Hover → highlight in metrics panel
  - Rhyme mismatch → red underline

- [ ] **Drag & Drop Block Reordering** (OPTIONAL for Phase 2, but nice-to-have)
  - Section-level drag-drop (Verse 1 ↔ Chorus)
  - Update `display_order` on drop
  - Visual feedback: ghost copy + drop zone highlight
  - Persist via API

**Estimated Effort:** 4–6 weeks (backend 4h, frontend 8–12h, testing 3–4h)

### Phase 2.5–3 (NICE-TO-HAVE, Deferred)

- [ ] Undo/Redo for drag-drop operations
- [ ] Mini-map (bottom-right corner, shows song structure at a glance)
- [ ] Keyboard shortcuts for power users
- [ ] Export timeline as visual diagram
- [ ] Section notes/annotations (metadata per section)

### Phase 3+ (LATER, Out of Scope)

- [ ] **Audio Playback** — TTS singing simulation (external service)
- [ ] **Prosody/Tone Visualization** — Spectral display of stress patterns, emotion mapping
- [ ] **Plagiarism Detection** — Compare against known Czech songs
- [ ] **Rhythmic Pattern Matching** — Detect polyrhythms, syncopation
- [ ] **Dark Mode UI** — Design + implement throughout
- [ ] **Multi-song Library** — Create/switch between poems, browser view
- [ ] **Collaborative Editing** — Invite others, real-time sync (probably Phase 4)
- [ ] **Mobile Responsive** — Tablet-friendly layout

---

## 6. Success Metrics (How to Measure Phase 2)

### Performance Targets
- **Variant toggle:** <100ms latency (tested with Chrome DevTools)
- **Tree rendering:** <500ms for 20-node tree
- **Compare panel:** Opens within 2s of click
- **Drag-drop:** Smooth 60fps visual feedback

### Feature Adoption (Telemetry)
- >80% of sessions use variant sidebar (vs. current 0%)
- Average session time for full song writing: <35 min (vs. current >45 min)
- Users create 3+ branches per song (vs. current 0 branches)
- >60% of sessions use Compare panel

### Data Quality
- Metrics cache hit rate: >90% on variant toggle
- No stale metrics (>1h old) in UI
- Version tree integrity: no orphaned nodes
- Duplicate variants auto-dedup'd (95%+ accuracy)

---

## 7. API Routes & Schema Changes (Technical Details)

### New API Endpoints

#### `POST /api/versions` (Extend)
```javascript
// Create a branch
{
  action: "create-branch",
  parent_version_id: 5,
  section_id: 2,
  branch_label: "Chorus draft",
  content: "..."
}
// → { success: true, new_version_id: 12, tree: {...} }

// Get tree for a section
{
  action: "get-tree",
  poem_id: 1,
  section_id: 2
}
// → { tree: [ { id: 1, content: "...", children: [...] } ] }
```

#### `POST /api/variants` (NEW)
```javascript
// Generate variants via Gemini
{
  action: "generate",
  section_id: 2,
  selected_text: "Modrá obloha",
  mode: "alternatives"
}
// → { variants: [ { id: 10, content: "Modré nebe", metrics: {...} } ] }

// Cache metrics for a version
{
  action: "cache-metrics",
  version_id: 5
}
// → { metrics_cache: { syllables: 6, singability: 0.85, ... } }
```

#### `POST /api/structure` (NEW)
```javascript
// Reorder sections via drag-drop
{
  action: "reorder-sections",
  poem_id: 1,
  sections: [
    { id: 2, display_order: 1 },
    { id: 3, display_order: 2 }
  ]
}
```

### Schema Migrations

**Migration 1: Add `sections` table**
```sql
CREATE TABLE sections (
  id INTEGER PRIMARY KEY,
  poem_id INTEGER NOT NULL,
  section_type TEXT NOT NULL CHECK(section_type IN ('verse', 'chorus', 'pre_chorus', 'bridge', 'intro', 'outro')),
  section_number INTEGER,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(poem_id) REFERENCES poems(id) ON DELETE CASCADE
);
```

**Migration 2: Extend `versions` table**
```sql
ALTER TABLE versions ADD COLUMN parent_version_id INTEGER REFERENCES versions(id);
ALTER TABLE versions ADD COLUMN section_id INTEGER REFERENCES sections(id);
ALTER TABLE versions ADD COLUMN branch_label TEXT;
ALTER TABLE versions ADD COLUMN is_active BOOLEAN DEFAULT 0;
ALTER TABLE versions ADD COLUMN metrics_cache JSON;

CREATE INDEX idx_versions_parent ON versions(parent_version_id);
CREATE INDEX idx_versions_section ON versions(section_id);
CREATE INDEX idx_versions_active ON versions(poem_id, section_id, is_active);
```

**Migration 3: Add `variant_metadata` table**
```sql
CREATE TABLE variant_metadata (
  id INTEGER PRIMARY KEY,
  version_id INTEGER NOT NULL UNIQUE REFERENCES versions(id) ON DELETE CASCADE,
  syllable_count INTEGER,
  avg_singability REAL,
  primary_rhyme_ending TEXT,
  stress_pattern TEXT,
  manual_notes TEXT,
  is_favorite BOOLEAN DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_variant_favorite ON variant_metadata(is_favorite);
```

---

## 8. Frontend Component Structure

### New Components

1. **VariantSidebar** (`src/components/VariantSidebar.tsx`)
   - Displays 3–5 variants of current line
   - Shows metrics for each: syllables, singability, rhyme
   - "Pin" / "Select" / "Compare" buttons
   - "Generate more" button triggers Gemini API

2. **ComparePanel** (`src/components/ComparePanel.tsx`)
   - Modal: A/B side-by-side comparison
   - Auto-highlights metric deltas
   - "Choose A" / "Choose B" / "Blend" buttons
   - Shows why one variant is better

3. **TimelineView** (`src/components/TimelineView.tsx`)
   - Branching tree visualization (D3.js or custom)
   - Click node → load version
   - Right-click → context menu (branch, rename, delete)
   - Collapsible tree for >20 nodes

4. **StructureEditor** (`src/components/StructureEditor.tsx`)
   - Drag-drop section reordering
   - Displays sections: Verse 1, Verse 2, Chorus, Bridge, etc.
   - Shows inline metrics per section
   - "Add Section" / "Remove Section" buttons

### Modified Components

- **Editor.tsx** — Add inline metric badges per line, drag-drop support for blocks
- **MetricsPanel.tsx** — Add cache invalidation, show metrics for all variants
- **page.tsx (Home)** — Refactor state management, add tab for Timeline, Compare

---

## 9. Backwards Compatibility & Migration Strategy

**For existing poems (created before Phase 2):**
- Auto-assign all versions to "Verse 1" (section_id = 1)
- Treat all as root versions (`parent_version_id = NULL`)
- No data loss, seamless migration

**API breaking changes:** None (use new `action` types in existing routes)

**Fallback for stale metrics:** If `variant_metadata` is missing/corrupted, fallback to live API call

---

## 10. Testing Strategy

### Unit Tests
- Metrics caching logic (dedup, stale checks)
- Tree traversal (find parent, list children, orphan detection)
- Drag-drop reorder logic (index updates, persistence)

### Integration Tests
- Create variant → cache metrics → toggle → metrics appear instantly
- Branch creation → check `parent_version_id` integrity
- Reorder sections → check `display_order` reflects in UI
- Compare panel → highlight delta correctly

### E2E Tests (Playwright)
- Full user journey: write → generate variants → compare → select → structure → save
- Variant toggle latency <100ms (measure with timing API)
- Tree rendering for 20+ nodes <500ms

### Performance Benchmarks
- Toggle variant: <100ms (Chrome DevTools)
- Generate 5 variants: <15s (Gemini API)
- Render tree with 20 nodes: <500ms

---

## 11. Rollout & Monitoring Plan

### Phase 2 Rollout (Week 1–3)

1. **Week 1:** Backend APIs + schema (4h dev, 1h testing)
   - `POST /api/variants`, `POST /api/structure`
   - Run migrations (backward compat check)
   - Internal testing with sample data

2. **Week 2:** Frontend components (8h dev, 2h testing)
   - VariantSidebar, ComparePanel, TimelineView
   - Drag-drop reorder
   - Metrics caching integration

3. **Week 3:** Polish + e2e testing (2h testing, 1h bug fixes)
   - Latency benchmarks
   - User feedback loop
   - Deploy to production

### Monitoring
- **Metrics cache hit rate** (dashboard metric)
- **Toggle latency** (client-side timing instrumentation)
- **Error rates** (API 500s, variant generation timeouts)
- **User adoption** (analytics: variant sidebar clicks, Compare panel opens)

### Rollback Plan
- If variant toggle >200ms latency → disable metrics caching, revert to live API
- If tree rendering >1s → simplify visualization (pagination for large trees)
- If too many 500 errors → disable branching temporarily, revert schema

---

## References

- **GitHub Issues:** See Phase 2 Epic #16 (Interactive Writing UX)
- **ADR:** ADR-011 (Branching tree model) — will be added to decisions.md
- **Architecture:** Built on Phase 1 MVP (Next.js, SQLite, Gemini, Czech metrics)

---

**Next Steps:**
1. Review & approve this design
2. Create GitHub issues from sections 5 (MVP checklist)
3. Assign to Phase 2 epic
4. Prioritize: Variant Sidebar > Metrics Caching > Branching UI > Compare Panel > Drag-Drop
5. Begin Week 1 backend work
