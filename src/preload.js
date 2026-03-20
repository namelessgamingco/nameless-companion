// =============================================================================
// preload.js — Nameless Poker Companion · Preload Script
// =============================================================================
// Exposes a safe API to the renderer (Streamlit/React) via contextBridge.
// Injects the inactive-state hotkey badge, first-launch overlay, and
// reconnecting state. All visual elements match the app's premium design.
// =============================================================================

const { contextBridge, ipcRenderer } = require("electron")

// =============================================================================
// EXPOSED API: window.namelessCompanion
// =============================================================================

contextBridge.exposeInMainWorld("namelessCompanion", {
  isElectron: true,
  getPlatform: () => ipcRenderer.invoke("get-platform"),
  minimizeWindow: () => ipcRenderer.send("window-minimize"),
  hideWindow: () => ipcRenderer.send("window-hide"),

  onFocusChange: (callback) => {
    const handler = (_event, isFocused) => callback(isFocused)
    ipcRenderer.on("window-focus-changed", handler)
    return () => ipcRenderer.removeListener("window-focus-changed", handler)
  },

  onFirstLaunch: (callback) => {
    const handler = (_event, isFirst) => callback(isFirst)
    ipcRenderer.on("first-launch", handler)
    return () => ipcRenderer.removeListener("first-launch", handler)
  },

  onConnectionError: (callback) => {
    const handler = (_event, error) => callback(error)
    ipcRenderer.on("connection-error", handler)
    return () => ipcRenderer.removeListener("connection-error", handler)
  },
})

// =============================================================================
// DOM INJECTION — runs after page loads
// =============================================================================

window.addEventListener("DOMContentLoaded", () => {
  document.documentElement.classList.add("nameless-electron")

  const isMac = navigator.platform.toUpperCase().includes("MAC")
  const hotkeyText = "Ctrl + Space"

  // ── Master stylesheet ──
  const style = document.createElement("style")
  style.textContent = `
    /* ================================================================
       ELECTRON-ONLY STYLES — Nameless Companion
       ================================================================ */

    /* ── Draggable regions ── */
    .nameless-electron .nameless-drag-region {
      -webkit-app-region: drag;
    }
    .nameless-electron .nameless-no-drag {
      -webkit-app-region: no-drag;
    }

    /* ── Window border (active/inactive) ── */
    .nameless-electron body {
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      transition: border-color 0.2s ease;
    }
    .nameless-electron.window-active body {
      border-color: #4BA3FF;
    }
    .nameless-electron.window-inactive body {
      border-color: rgba(255, 255, 255, 0.06);
    }

    /* Subtle dim when inactive — CSS only, no window opacity change */
    .nameless-electron.window-inactive [data-testid="stAppViewContainer"] {
      opacity: 0.7;
      transition: opacity 0.2s ease;
    }
    .nameless-electron.window-active [data-testid="stAppViewContainer"] {
      opacity: 1;
      transition: opacity 0.2s ease;
    }

    /* ================================================================
       INACTIVE STATE — Centered pulsing hotkey badge
       ================================================================ */

    .nameless-hotkey-badge {
      position: fixed;
      bottom: 48px;
      left: 50%;
      transform: translateX(-50%) scale(1);
      z-index: 99999;
      pointer-events: none;

      /* Pill shape */
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px 36px;
      border-radius: 18px;

      /* Glass dark background */
      background: rgba(10, 10, 18, 0.88);
      border: 1px solid rgba(75, 163, 255, 0.25);
      box-shadow:
        0 0 20px rgba(75, 163, 255, 0.08),
        0 4px 24px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);

      /* Hidden by default */
      opacity: 0;
      visibility: hidden;
    }

    .nameless-hotkey-badge.visible {
      opacity: 1;
      visibility: visible;
      animation: badgeBreathe 2s ease-in-out infinite;
    }

    @keyframes badgeBreathe {
      0%, 100% {
        opacity: 0.85;
        transform: translateX(-50%) scale(1);
      }
      50% {
        opacity: 1;
        transform: translateX(-50%) scale(1.04);
      }
    }

    .nameless-hotkey-badge .badge-hotkey {
      font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
      font-size: 26px;
      font-weight: 800;
      color: #6BB8FF;
      letter-spacing: 0.05em;
      line-height: 1;
      text-shadow: 0 0 12px rgba(75, 163, 255, 0.4);
    }

    .nameless-hotkey-badge .badge-label {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 12px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.65);
      text-transform: uppercase;
      letter-spacing: 0.12em;
      margin-top: 6px;
    }

    /* ================================================================
       FIRST LAUNCH OVERLAY
       ================================================================ */

    .nameless-first-launch {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(10, 10, 18, 0.94);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 100000;
      text-align: center;
      padding: 32px;
      opacity: 1;
      transition: opacity 0.25s ease;
    }
    .nameless-first-launch.hiding {
      opacity: 0;
      pointer-events: none;
    }
    .nameless-first-launch .fl-icon {
      font-size: 32px;
      margin-bottom: 16px;
      opacity: 0.8;
    }
    .nameless-first-launch .fl-title {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: #E0E0E0;
      margin-bottom: 10px;
      letter-spacing: 0.01em;
    }
    .nameless-first-launch .fl-body {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.45);
      line-height: 1.7;
      max-width: 280px;
    }
    .nameless-first-launch .fl-hotkey {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      color: #4BA3FF;
    }
    .nameless-first-launch .fl-dismiss {
      margin-top: 20px;
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 10px;
      color: rgba(255, 255, 255, 0.2);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    /* ================================================================
       RECONNECTING STATE
       ================================================================ */

    .nameless-reconnecting {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: #0A0A12;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 100001;
      font-family: 'Inter', -apple-system, sans-serif;
    }
    .nameless-reconnecting .recon-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(75, 163, 255, 0.15);
      border-top-color: #4BA3FF;
      border-radius: 50%;
      animation: reconSpin 0.8s linear infinite;
      margin-bottom: 14px;
    }
    @keyframes reconSpin {
      to { transform: rotate(360deg); }
    }
    .nameless-reconnecting .recon-text {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.35);
      letter-spacing: 0.04em;
    }
  `
  document.head.appendChild(style)

  // ── Create the hotkey badge (hidden by default) ──
  const badge = document.createElement("div")
  badge.className = "nameless-hotkey-badge"
  badge.id = "nameless-hotkey-badge"
  badge.innerHTML = `
    <span class="badge-hotkey">${hotkeyText}</span>
    <span class="badge-label">to return</span>
  `
  document.body.appendChild(badge)

  // ── Create a permanent drag bar at the top of the window ──
  const dragBar = document.createElement("div")
  dragBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 32px;
    -webkit-app-region: drag;
    z-index: 99998;
    pointer-events: auto;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 4px;
  `
  document.body.appendChild(dragBar)

  // ── Window control buttons (close + minimize) ──
  const controls = document.createElement("div")
  controls.style.cssText = `
    display: flex;
    gap: 6px;
    -webkit-app-region: no-drag;
    padding: 4px;
  `

  const makeBtn = (label, hoverColor, onClick) => {
    const btn = document.createElement("button")
    btn.textContent = label
    btn.style.cssText = `
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: rgba(255,255,255,0.35);
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      -webkit-app-region: no-drag;
      transition: background 0.15s, color 0.15s;
    `
    btn.addEventListener("mouseenter", () => {
      btn.style.background = hoverColor
      btn.style.color = "#ffffff"
    })
    btn.addEventListener("mouseleave", () => {
      btn.style.background = "transparent"
      btn.style.color = "rgba(255,255,255,0.35)"
    })
    btn.addEventListener("click", onClick)
    return btn
  }

  const minimizeBtn = makeBtn("─", "rgba(255,255,255,0.1)", () => {
    ipcRenderer.send("window-minimize")
  })

  const closeBtn = makeBtn("✕", "rgba(255,68,68,0.3)", () => {
    ipcRenderer.send("window-hide")
  })

  controls.appendChild(minimizeBtn)
  controls.appendChild(closeBtn)
  dragBar.appendChild(controls)

  // ── Focus / Blur state management ──
  ipcRenderer.on("window-focus-changed", (_event, isFocused) => {
    const root = document.documentElement
    const badgeEl = document.getElementById("nameless-hotkey-badge")

    if (isFocused) {
      root.classList.add("window-active")
      root.classList.remove("window-inactive")
      if (badgeEl) badgeEl.classList.remove("visible")
    } else {
      root.classList.remove("window-active")
      root.classList.add("window-inactive")
      if (badgeEl) badgeEl.classList.add("visible")
    }
  })

  // ── First launch overlay ──
  ipcRenderer.on("first-launch", () => {
    const overlay = document.createElement("div")
    overlay.className = "nameless-first-launch"
    overlay.innerHTML = `
      <div class="fl-icon">♠</div>
      <div class="fl-title">Nameless Companion</div>
      <div class="fl-body">
        Drag this window to a corner of your poker table.<br/><br/>
        Press <span class="fl-hotkey">${hotkeyText}</span> anytime to switch here.
      </div>
      <div class="fl-dismiss">click anywhere to dismiss</div>
    `
    document.body.appendChild(overlay)

    const dismiss = () => {
      overlay.classList.add("hiding")
      setTimeout(() => overlay.remove(), 250)
    }

    // Auto-dismiss after 4 seconds
    const timer = setTimeout(dismiss, 4000)

    // Dismiss on click or keypress
    overlay.addEventListener("click", () => {
      clearTimeout(timer)
      dismiss()
    })
    document.addEventListener(
      "keydown",
      () => {
        clearTimeout(timer)
        dismiss()
      },
      { once: true }
    )
  })

  // ── Reconnecting overlay ──
  let reconnectOverlay = null

  ipcRenderer.on("connection-error", () => {
    if (reconnectOverlay) return
    reconnectOverlay = document.createElement("div")
    reconnectOverlay.className = "nameless-reconnecting"
    reconnectOverlay.innerHTML = `
      <div class="recon-spinner"></div>
      <div class="recon-text">Reconnecting</div>
    `
    document.body.appendChild(reconnectOverlay)

    // Remove when Streamlit loads
    const observer = new MutationObserver(() => {
      if (document.querySelector("[data-testid='stAppViewContainer']")) {
        reconnectOverlay?.remove()
        reconnectOverlay = null
        observer.disconnect()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
  })
})