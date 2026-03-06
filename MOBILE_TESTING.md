# Mobile Testing Guide

## Device Setup

### iPhone Safari (Real Device)
1. Ensure your development machine and iPhone are on **same WiFi network**
2. Find your machine's local IP:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1

   # Windows
   ipconfig | findstr "IPv4 Address"
   ```
3. Start dev server:
   ```bash
   cd bard-buddy
   npm run dev
   ```
4. On iPhone, open Safari and visit: `http://<YOUR-IP>:3000`

### Chrome DevTools (Desktop Emulation)
1. Open `http://localhost:3000` in Chrome
2. Press **Cmd+Shift+M** (macOS) or **Ctrl+Shift+M** (Windows)
3. Select **iPhone 15** from device list (375×812px)

---

## Test Scenarios

### 1. Mobile Layout (Viewport < 1024px)
**Expected:**
- Full-screen editor dominates
- Bottom tab bar with 5 buttons: 📊 📜 ✨ 🎸 🔀
- No visible metrics/assist panels on sides
- Sticky bottom bar stays visible while scrolling

**Steps:**
```
1. Resize to iPhone size (< 1024px)
2. Verify editor fills screen (no side panels visible)
3. Scroll editor content
4. Verify bottom tab bar remains sticky
```

### 2. Bottom Sheet - Metrics
**Expected:**
- Tapping 📊 opens bottom sheet with metrics
- Drawer slides up smoothly from bottom
- Visual handle (drag indicator) at top
- Close button (×) at top-right
- Backdrop dims when sheet open
- Tapping backdrop closes sheet

**Steps:**
```
1. Tap 📊 Metriky button
2. Verify metrics appear in sheet
3. Scroll metrics content (should scroll within sheet)
4. Tap × button → sheet closes
5. Tap 📊 again → tap backdrop to close
```

### 3. Bottom Sheet - Assist Panel
**Expected:**
- Tapping ✨ shows Assist (Gemini suggestions)
- Selected text carries into sheet
- Suggestion buttons are touch-friendly (44px+ tall)
- Tapping suggestion inserts into editor AND closes sheet

**Steps:**
```
1. Type some text in editor
2. Long-press to select a phrase
3. Tap ✨ Asist button
4. Wait for suggestions to load
5. Tap a suggestion
6. Verify text inserted in editor
7. Verify sheet auto-closed
```

### 4. Bottom Sheet - Variants & Versions
**Expected:**
- 🔀 Varianty and 📜 Verze tabs work like Assist
- List of variants/versions appears
- Tapping item restores to editor

**Steps:**
```
1. Make several edits to build version history
2. Tap 📜 Verze button
3. Verify version list appears
4. Tap an old version → content restores, sheet closes
```

### 5. Keyboard Safety
**Expected on iPhone:**
- Bottom tab bar never covered by on-screen keyboard
- Editor content not hidden by keyboard
- Focus stays in editor textarea

**Steps:**
```
1. Start editing (tap in editor)
2. On-screen keyboard appears
3. Verify bottom tab bar still visible (above keyboard)
4. Type a few words
5. Tap inside editor again → keyboard stays visible
```

### 6. Desktop Layout (Viewport ≥ 1024px)
**Expected:**
- Original 3-column layout visible
- Bottom tab bar is hidden (`hidden lg:flex`)
- Right panel shows Assist/Guitar/Variants/Versions tabs
- Metrics visible in middle column

**Steps:**
```
1. Resize to desktop (≥ 1024px)
2. Verify 3 columns visible: Editor | Metrics | Assist
3. Verify bottom tab bar is hidden
4. Click right panel tabs (Kytara, Varianty, Verze)
```

### 7. Responsive Breakpoint (Portrait → Landscape)
**Expected on iPhone:**
- Portrait (375px): Single-column mobile layout
- Landscape (812px wide): Still single-column, but content reflows
- Bottom tab bar adapts to landscape width

**Steps:**
```
1. Start in portrait mode
2. Rotate to landscape
3. Verify editor still fullscreen (not split)
4. Verify bottom tab bar still accessible
5. Return to portrait
```

---

## Checklist (Pre-Release)

- [ ] Mobile (< 1024px): Full-screen editor, no side panels visible
- [ ] Bottom tab bar: All 5 buttons responsive (📊 Metriky, ✨ Asist, 🎸 Kytara, 🔀 Varianty, 📜 Verze)
- [ ] Bottom sheet: Smooth open/close animation
- [ ] Backdrop: Tap to close functionality
- [ ] Keyboard: Doesn't overlap editor or bottom bar
- [ ] Suggestions: Insert and auto-close sheet
- [ ] Desktop (≥ 1024px): 3-column layout unchanged
- [ ] No console errors in DevTools
- [ ] Build succeeds: `npm run build`

---

## Known Limitations

- Bottom sheet max-height is 90vh (leaves room for safe area on notched devices)
- Bottom tab bar doesn't have visual feedback (remains to implement)
- No support for split-screen iPad mode yet (Phase 2)

---

## Performance Notes

- BottomSheet uses `fixed` positioning (GPU-accelerated)
- Backdrop uses `bg-black/40` (Tailwind opacity, no runtime calc)
- No animations on scroll (avoid jank)
- All responsive classes use Tailwind breakpoints (no JS media queries)

---

## Browser Support

**Tested:**
- iPhone Safari 17.x
- Chrome DevTools mobile emulation
- Safari 15.x (macOS, responsive mode)

**Expected to work:**
- Android Chrome 120+
- Edge Mobile

---

## Troubleshooting

**Issue:** Bottom tab bar hidden on mobile
- [ ] Viewport is actually < 1024px? (Check DevTools)
- [ ] Tailwind build includes mobile breakpoints? (Check `tailwind.config.js`)

**Issue:** Bottom sheet doesn't slide up smoothly
- [ ] Check browser DevTools → Rendering → Paint flashing (should be minimal)
- [ ] Reduce animations if testing on low-end device

**Issue:** Keyboard overlaps editor content
- [ ] iOS Safari bug — scroll to bottom when keyboard appears
- [ ] May need `window.scrollIntoView()` on textarea focus (Phase 2)

---

For more info, see [README.md](./README.md) and [decisions.md](./decisions.md#adr-012-mobile-first-responsive-layout).
