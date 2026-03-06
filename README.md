# 🎵 bard-buddy

Czech poetry & lyrics writing assistant powered by AI, with version control and linguistic metrics.

## Features

✨ **Core MVP (Phase 1)**
- **Editor** - Auto-save every 3 seconds, version history with one-click restore
- **Czech Metrics** - Syllable counting, rhyme detection, stress patterns, singability scoring
- **Creative Assistance** - Gemini AI for verse alternatives, continuation, chorus generation
- **Version Control** - Full history of changes with timeline view (like essay.app)

🚀 **Coming Soon (Phase 2+)**
- Tone & emotion mapping with visual coloring
- Inspiration import with anti-copycat detection
- Rhythmic pattern matching
- Experiment/test mode for A/B testing
- Dark mode UI

## Quick Start

### Prerequisites
```bash
node --version     # v20+
npm --version      # v10+
export GEMINI_API_KEY="your-key-here"
which gemini       # Should exist (gemini CLI)
```

### Setup & Run

```bash
cd bard-buddy
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture

### Desktop Layout (≥1024px)
```
3-Panel Layout:
┌─────────────────┬──────────────┬─────────────────┐
│                 │              │                 │
│  Editor         │  Metrics     │  Assist Panel   │
│  (auto-save)    │  (syllables, │  (Gemini        │
│                 │   rhymes,    │   suggestions)  │
│                 │   stress)    │                 │
│                 │              │  Variants &     │
│                 │              │  Versions       │
└─────────────────┴──────────────┴─────────────────┘
```

### Mobile Layout (<1024px)
```
Full-Screen Editor + Bottom Sheet Tools:

┌─────────────────────────────┐
│  Title                      │
├─────────────────────────────┤
│                             │
│      EDITOR                 │
│     (100% height)           │
│                             │
├─────────────────────────────┤
│📊│✨│🎸│🔀│📜│  ← Tab Bar
└─────────────────────────────┘
     ↓ Tap Tab → Bottom Sheet ↓
┌─────────────────────────────┐
│ ─ ─ ─ Metriky              ×│
├─────────────────────────────┤
│  Metrics Panel (scrollable) │
│  (drag down to close)       │
└─────────────────────────────┘
```

**Tech Stack:**
- **Frontend:** Next.js 15, React, Tailwind CSS (mobile-first responsive)
- **Backend:** Next.js API Routes (Node.js)
- **Database:** SQLite + Drizzle ORM
- **LLM:** Google Gemini (CLI + SDK)
- **Metrics:** Algorithmic (no ML needed)
- **Mobile UI:** Bottom Sheet drawer (iOS-style), responsive `lg:hidden` breakpoint

## API Endpoints

### `POST /api/metrics`
Analyze poetry for Czech linguistic metrics.
```json
{
  "text": "Modrá obloha visí nad mnou"
}
```

### `POST /api/assist`
Generate creative suggestions via Gemini.
```json
{
  "text": "Večer padá tichý",
  "mode": "alternatives|continuation|chorus"
}
```

### `POST /api/versions`
Manage poem versions.
```json
{
  "action": "save-version|get-versions|create-poem",
  "poemId": 1,
  "content": "..."
}
```

## Czech Language Support

**Metrics calculated algorithmically:**
- **Syllables:** Count vowel groups (a,e,i,o,u,á,é,í,ó,ú,ů,y,ý)
- **Stress:** First syllable (Czech rule)
- **Rhymes:** Last 2-3 characters similarity
- **Singability:** Vowel/consonant ratio (ideal ~0.45)

## Documentation

- **[RUNBOOK.md](./RUNBOOK.md)** - Setup, testing, troubleshooting
- **[decisions.md](./decisions.md)** - Architecture decision records (ADR-001 to ADR-007)

## GitHub Issues

- **Epics:** [#1-5](https://github.com/Flipajs/bard-buddy/issues?q=is%3Aissue+label%3Aepic)
- **MVP Tasks:** [#6-13](https://github.com/Flipajs/bard-buddy/issues?q=is%3Aissue+label%3Amvp)

## Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build
npm start

# Lint
npm run lint
```

## Mobile Testing

### iPhone Safari (localhost)
1. **Desktop machine:** `npm run dev` (starts on `http://localhost:3000`)
2. **Same WiFi network:** On iPhone, visit `http://<your-machine-ip>:3000`
   ```bash
   # Find your machine IP
   ifconfig | grep "inet "  # macOS/Linux
   ipconfig               # Windows
   ```
3. **Test flows:**
   - **Edit mode:** Tap and hold to select text for suggestions
   - **Bottom sheet:** Tap any of 5 tabs (📊 Metriky, ✨ Asist, 🎸 Kytara, 🔀 Varianty, 📜 Verze)
   - **Drawer gesture:** Swipe down or tap × to close sheet
   - **Keyboard:** Type in editor, verify bottom bar doesn't overlap

### Chrome DevTools (Emulation)
```bash
# Simulate mobile on desktop
npm run dev
# Open http://localhost:3000
# Press Ctrl+Shift+M (Windows) or Cmd+Shift+M (macOS) to toggle device toolbar
# Select "iPhone 15" or similar (375×812 viewport)
```

### Key Mobile UX Checkpoints
- ✓ Editor is full-screen (no horizontal scroll)
- ✓ Bottom tab bar is always sticky (visible while scrolling editor)
- ✓ Each sheet closes smoothly after action (e.g., insert suggestion)
- ✓ Safe area respected (no content under notch/home bar)
- ✓ Text inputs are keyboard-safe (not covered by on-screen keyboard)

## Troubleshooting

**"GEMINI_API_KEY is not set"**
```bash
export GEMINI_API_KEY="your-api-key"
npm run dev
```

**"gemini: command not found"**
```bash
# Ensure gemini CLI is in PATH
which gemini
# If not found, add ~/.npm-global/bin to PATH
export PATH="$HOME/.npm-global/bin:$PATH"
```

See [RUNBOOK.md](./RUNBOOK.md) for more troubleshooting.

## License

MIT

---

Built with ❤️ for Czech poets and lyricists.
