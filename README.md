# Nameless Poker — Floating Companion

A lightweight Electron desktop app that wraps the Nameless Poker web app in an always-on-top, frameless floating window with a global hotkey to toggle keyboard focus.

**This is a cockpit, not a standalone app.** Sessions are started and ended in the browser. The companion shows only the hand input interface during active play.

## Quick Start

```bash
npm install
npm start          # Points at production Railway URL
npm run dev        # Points at localhost:8501 (local Streamlit)
```

## Global Hotkey

| Platform | Hotkey |
|----------|--------|
| macOS | `Ctrl + Space` |
| Windows | `Ctrl + Space` |

Press once to switch focus to Nameless. Press again to return focus to your poker client.

## How It Works

1. Start a session in the browser (full web app)
2. Open the companion — it detects the active session and shows the play interface
3. Open your poker client full-screen
4. Ctrl+Space toggles focus between the companion and your poker table
5. End the session in the browser when done

## Building for Distribution

```bash
npm run dist:mac   # → dist/Nameless Poker-x.x.x.dmg
npm run dist:win   # → dist/Nameless Poker Setup x.x.x.exe
```

### Before building:

1. Place icons in `assets/` (see `assets/README.md`)
2. Update `APP_URL` in `src/main.js` with your production Railway URL
3. For macOS: configure code signing identity in `electron-builder.yml`
4. For macOS notarization: set `notarize: true` and Apple ID credentials

## Architecture

The app is a thin Electron shell (~280 lines of main process code). It:

- Opens a frameless, always-on-top `BrowserWindow` loading the Streamlit URL
- Registers `Ctrl+Space` as a global hotkey to toggle keyboard focus
- Injects CSS to hide Streamlit chrome (sidebar, header, footer)
- Saves/restores window position across launches
- Runs in the system tray only (not in Dock/Taskbar/Cmd+Tab)
- Sends focus/blur events to the React component for visual state changes
- Shows a pulsing hotkey badge when inactive so users always know how to return

No backend, no database, no data processing. Same Supabase auth. Same Railway deployment. If you can use the web app, this works.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NAMELESS_URL` | Production Railway URL | Override the Streamlit app URL |
