# PokerInput.tsx — Electron Companion Integration

**Total: ~30 lines added, 0 lines removed.**
**All changes are gated behind `isElectron` — the browser experience is unaffected.**

---

## CHANGE 1: Electron Detection + Window State

**Location:** After line 970 (after `const audioEnabledFromPython = ...`)

**Find this line:**
```tsx
  const audioEnabledFromPython = !!(args["audio_enabled"])  // Session-level audio output toggle
```

**Add immediately after it:**
```tsx

  // ── Electron Companion Detection ──
  const isElectron = !!(window as any).namelessCompanion?.isElectron
  const [windowActive, setWindowActive] = useState(true)

  useEffect(() => {
    if (!isElectron) return
    const api = (window as any).namelessCompanion
    const cleanup = api.onFocusChange((isFocused: boolean) => {
      setWindowActive(isFocused)
    })
    return cleanup
  }, [isElectron])
```

---

## CHANGE 2: Prompt Text — Electron Hotkey Hint

**Location:** Line ~3793, the `case "showing_decision"` block in `getPrompt()`

**Find this block:**
```tsx
      case "showing_decision": {
              if (!decision) return "Calculating..."
              const d2 = decision.display.toUpperCase()
              const isAllIn2 = d2.includes("ALL-IN") || d2.includes("ALL IN")
              const isAgg = !isAllIn2 && ["RAISE", "BET", "RE-RAISE", "3-BET", "4-BET", "ISO"].some(
                (a) => d2.includes(a)
              )
              const isChk = d2.includes("CHECK")
              const isFld = d2.includes("FOLD")
              const isCall = d2.includes("CALL")
              
              if (isFld || isAllIn2) {
                return "Hand complete · Press Space to start new hand"
              }
              if (isAgg) {
                return "Press R if they re-raised · Space for new hand · or continue to next street →"
              }
              if (isChk && gameState.street !== "preflop") {
                return "Press B if they bet · Space for new hand · or continue to next street →"
              }
              if (isCall) {
                return "Press Space for new hand · or continue to next street →"
              }
              return "Press Space for new hand · or continue to next street →"
            }
```

**Replace with:**
```tsx
      case "showing_decision": {
              if (!decision) return "Calculating..."
              const d2 = decision.display.toUpperCase()
              const isAllIn2 = d2.includes("ALL-IN") || d2.includes("ALL IN")
              const isAgg = !isAllIn2 && ["RAISE", "BET", "RE-RAISE", "3-BET", "4-BET", "ISO"].some(
                (a) => d2.includes(a)
              )
              const isChk = d2.includes("CHECK")
              const isFld = d2.includes("FOLD")
              const isCall = d2.includes("CALL")

              // In Electron, append hotkey reminder for switching back to poker client
              const isMacOS = navigator.platform.toUpperCase().includes("MAC")
              const sw = isElectron ? ` · ${isMacOS ? "⌃Space" : "Ctrl+Space"} to switch` : ""

              if (isFld || isAllIn2) {
                return `Hand complete · Press Space to start new hand${sw}`
              }
              if (isAgg) {
                return `Press R if they re-raised · Space for new hand · or continue →${sw}`
              }
              if (isChk && gameState.street !== "preflop") {
                return `Press B if they bet · Space for new hand · or continue →${sw}`
              }
              if (isCall) {
                return `Press Space for new hand · or continue →${sw}`
              }
              return `Press Space for new hand · or continue →${sw}`
            }
```

---

## CHANGE 3: Draggable Header — Two-Table Mode

**Location:** Line ~4480 (the two-table return block's header)

**Find:**
```tsx
        <div style={S.header}>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.03em", fontFamily: theme.mono }}>
            NAMELESS POKER
          </div>
```

**Replace with:**
```tsx
        <div style={S.header} className={isElectron ? "nameless-drag-region" : undefined}>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.03em", fontFamily: theme.mono }}>
            NAMELESS POKER
          </div>
```

**Then:** Add `className={isElectron ? "nameless-no-drag" : undefined}` to every `<button` tag
that is a direct child of the header `<div>` in this two-table block. There are several buttons
(Close T2, overlay toggle ?, audio toggle). Each one gets the className prop added.

Example — find each button opening tag like:
```tsx
            <button
              onClick={handleCloseTable2}
              style={{
```
And add the className:
```tsx
            <button
              className={isElectron ? "nameless-no-drag" : undefined}
              onClick={handleCloseTable2}
              style={{
```

---

## CHANGE 4: Draggable Header — Single-Table Mode

**Location:** Line ~5891 (the single-table return block's header)

**Find:**
```tsx
      <div style={S.header}>
        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.03em", fontFamily: theme.mono }}>
          NAMELESS POKER
        </div>
```

**Replace with:**
```tsx
      <div style={S.header} className={isElectron ? "nameless-drag-region" : undefined}>
        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.03em", fontFamily: theme.mono }}>
          NAMELESS POKER
        </div>
```

**Then:** Same pattern — add `className={isElectron ? "nameless-no-drag" : undefined}` to every
`<button` that's a direct child of this header div (+ Table 2 toggle, ? button, audio button).

---

## CHANGE 5: Container Bottom Padding for Hotkey Badge

The pulsing badge overlays the bottom area of the window. Add padding so content
doesn't get hidden behind it when the badge is visible.

**Two-table container (line ~4464):**

**Find:**
```tsx
      <div ref={containerRef} style={{ ...S.container, padding: "16px 20px" }} tabIndex={0}>
```

**Replace with:**
```tsx
      <div ref={containerRef} style={{ ...S.container, padding: "16px 20px", paddingBottom: isElectron ? 48 : 16 }} tabIndex={0}>
```

**Single-table container (line ~5875):**

**Find:**
```tsx
    <div ref={containerRef} style={S.container} tabIndex={0}>
```

**Replace with:**
```tsx
    <div ref={containerRef} style={{ ...S.container, paddingBottom: isElectron ? 48 : undefined }} tabIndex={0}>
```

---

## SUMMARY

| # | Location | What | Lines Added |
|---|----------|------|-------------|
| 1 | After line 970 | `isElectron` detection + `windowActive` state + useEffect listener | 10 |
| 2 | Line ~3793 | Prompt text with Electron hotkey hint appended | 3 (net) |
| 3 | Line ~4480 | Draggable header className (two-table mode) | 1 + per-button classNames |
| 4 | Line ~5891 | Draggable header className (single-table mode) | 1 + per-button classNames |
| 5 | Lines ~4464, ~5875 | Container bottom padding for badge clearance | 2 |

All Electron paths check `isElectron` which is `false` in any normal browser.
The `windowActive` state is available for future use (e.g., pausing animations
when inactive) but currently the visual dimming is handled by Electron's
`setOpacity(0.6)` and the preload script's badge injection.
