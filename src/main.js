// =============================================================================
// main.js — Nameless Poker Companion · Electron Main Process
// =============================================================================

const {
  app,
  BrowserWindow,
  globalShortcut,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
  screen,
} = require("electron")
const path = require("path")
const fs = require("fs")
const os = require("os")

// =============================================================================
// CONFIG
// =============================================================================

const APP_URL =
  process.env.NAMELESS_URL ||
  "https://namelesspoker.com/Play_Session"

const HOTKEY = "Control+Space"

const DEFAULT_WIDTH = 750
const DEFAULT_HEIGHT = 800
const MIN_WIDTH = 440
const MIN_HEIGHT = 500

const STATE_DIR = path.join(os.homedir(), ".nameless")
const STATE_FILE = path.join(STATE_DIR, "window-state.json")

// =============================================================================
// WINDOW STATE PERSISTENCE
// =============================================================================

function loadWindowState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"))
      const displays = screen.getAllDisplays()
      const onScreen = displays.some((d) => {
        const b = d.bounds
        return (
          data.x >= b.x - 100 &&
          data.x < b.x + b.width + 100 &&
          data.y >= b.y - 100 &&
          data.y < b.y + b.height + 100
        )
      })
      if (onScreen && data.width && data.height) return data
    }
  } catch {
    // Corrupt or missing
  }
  return null
}

function saveWindowState(win) {
  if (!win || win.isDestroyed()) return
  try {
    const bounds = win.getBounds()
    if (!fs.existsSync(STATE_DIR)) {
      fs.mkdirSync(STATE_DIR, { recursive: true })
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(bounds), "utf8")
  } catch {
    // Non-critical
  }
}

// =============================================================================
// CREATE WINDOW
// =============================================================================

let mainWindow = null
let tray = null

function createWindow() {
  const saved = loadWindowState()

  mainWindow = new BrowserWindow({
    width: saved?.width || DEFAULT_WIDTH,
    height: saved?.height || DEFAULT_HEIGHT,
    x: saved?.x,
    y: saved?.y,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,

    frame: false,
    alwaysOnTop: true,
    alwaysOnTopLevel: "floating",
    transparent: process.platform === "darwin",
    hasShadow: true,
    skipTaskbar: process.platform === "darwin",

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },

    backgroundColor: process.platform === "darwin" ? "#00000000" : "#0A0A12",
    titleBarStyle: "hidden",
    roundedCorners: true,
    show: false,
  })

  mainWindow.loadURL(APP_URL)

  // ── Inject CSS after page loads ──
  // CRITICAL: We delay CSS injection to let Streamlit fully initialize its
  // session and component communication before we modify the DOM. Using
  // visibility:hidden instead of display:none for sidebar keeps Streamlit's
  // initialization intact (SessionInfo, component bridge, etc).
  mainWindow.webContents.on("did-finish-load", () => {
    // Inject dark theme IMMEDIATELY — covers auth/login screen
    mainWindow.webContents.insertCSS(`
      /* Dark background everywhere */
      html, body, [data-testid="stAppViewContainer"], .stApp,
      [data-testid="stApp"], .main, .block-container {
        background: #0A0A12 !important;
        color: #E0E0E0 !important;
      }

      /* ALL text elements */
      label, .stMarkdown, .stMarkdown p, h1, h2, h3, h4, p, span, div,
      .stTextInput label, .stTextInput span,
      [data-testid="stMarkdownContainer"], [data-testid="stMarkdownContainer"] p {
        color: #E0E0E0 !important;
      }

      /* Input fields — nuclear approach for Streamlit's deep nesting */
      input, textarea, select,
      [data-baseweb="input"], [data-baseweb="input"] input,
      [data-baseweb="base-input"], [data-baseweb="base-input"] input,
      .stTextInput input, .stTextInput div[data-baseweb] input,
      div[class*="InputContainer"] input,
      div[class*="textInput"] input {
        color: #E0E0E0 !important;
        background: #1a1a28 !important;
        border-color: rgba(255,255,255,0.15) !important;
        -webkit-text-fill-color: #E0E0E0 !important;
        caret-color: #E0E0E0 !important;
      }

      /* Input wrapper/container backgrounds */
      [data-baseweb="input"], [data-baseweb="base-input"],
      .stTextInput > div, .stTextInput > div > div {
        background: #1a1a28 !important;
        border-color: rgba(255,255,255,0.15) !important;
      }

      /* Placeholder text */
      input::placeholder, textarea::placeholder {
        color: rgba(255,255,255,0.3) !important;
        -webkit-text-fill-color: rgba(255,255,255,0.3) !important;
      }

      /* Password toggle eye icon */
      button[aria-label*="password"], button[aria-label*="Password"],
      .stTextInput button {
        color: rgba(255,255,255,0.5) !important;
      }

      /* Primary buttons */
      button[kind="primary"], button[data-testid="baseButton-primary"],
      .stButton > button {
        background: linear-gradient(135deg, #22c55e, #16a34a) !important;
        color: white !important;
        -webkit-text-fill-color: white !important;
      }
    `)

    // Wait for Streamlit to fully initialize before hiding chrome
    setTimeout(() => {
      if (!mainWindow || mainWindow.isDestroyed()) return

      mainWindow.webContents.insertCSS(`
        /* === Hide Streamlit framework chrome === */
        /* IMPORTANT: Use visibility/size collapse instead of display:none  */
        /* display:none breaks Streamlit's SessionInfo initialization       */
        header[data-testid="stHeader"],
        #MainMenu,
        footer,
        .stDeployButton,
        div[data-testid="stDecoration"],
        div[data-testid="stToolbar"] {
          display: none !important;
        }

        /* Sidebar: hide visually but keep in DOM for Streamlit init */
        section[data-testid="stSidebar"],
        .stSidebar {
          visibility: hidden !important;
          position: absolute !important;
          width: 0 !important;
          height: 0 !important;
          overflow: hidden !important;
          pointer-events: none !important;
        }

        /* Sidebar toggle buttons */
        button[data-testid="stSidebarCollapsedControl"],
        [data-testid="collapsedControl"],
        [data-testid="stSidebarNav"],
        button[kind="header"],
        .css-1544g2n,
        button[aria-label="Open sidebar navigation menu"],
        .st-emotion-cache-arzcut,
        [data-testid="stAppViewContainer"] > button:first-child,
        body > div > div > div > div > button[kind="header"],
        [data-testid="stAppViewContainer"] button[kind="headerNoPadding"] {
          visibility: hidden !important;
          position: absolute !important;
          width: 0 !important;
          height: 0 !important;
          pointer-events: none !important;
        }

        /* === Window background === */
        html, body, [data-testid="stAppViewContainer"] {
          background: #0A0A12 !important;
          border-radius: 12px;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
        }

        /* === Layout spacing === */
        .main .block-container {
          padding: 28px 8px 0 8px !important;
          max-width: 100% !important;
        }
        .main {
          padding: 0 !important;
        }

        .main > div {
          padding-bottom: 0 !important;
        }
        [data-testid="stBottomBlockContainer"] {
          visibility: hidden !important;
          height: 0 !important;
          overflow: hidden !important;
        }

        /* === Tighten gaps between elements === */
        [data-testid="stVerticalBlock"] {
          gap: 4px !important;
        }

        /* === Compact session stats bar === */
        .session-bar {
          padding: 8px 10px !important;
          margin: 0 4px 4px 4px !important;
          border-radius: 8px !important;
        }
        .session-stat-value {
          font-size: 16px !important;
        }
        .session-stat-label {
          font-size: 8px !important;
        }
        .session-stat-divider {
          height: 24px !important;
        }

        /* === Premium scrollbar === */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.08);
          border-radius: 2px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.15);
        }
      `)

      // Dynamically resize iframe — gentle approach, no MutationObserver
      // Only resize, don't inject CSS into iframe (can break component comms)
      mainWindow.webContents.executeJavaScript(`
        (function() {
          function resizeIframe() {
            var iframe = document.querySelector('iframe[title="poker_input.poker_input"]');
            if (iframe) {
              try {
                var contentHeight = iframe.contentDocument.body.scrollHeight;
                if (contentHeight > 100) {
                  iframe.style.height = contentHeight + 'px';
                }
              } catch(e) {}
            }
          }
          setInterval(resizeIframe, 1000);
        })();
      `)
    }, 2000) // 2 second delay — lets Streamlit SessionInfo fully initialize

    // These can fire immediately — they don't affect Streamlit init
    mainWindow.webContents.send("window-focus-changed", mainWindow.isFocused())

    if (!loadWindowState()) {
      mainWindow.webContents.send("first-launch", true)
    }
  })

  // ── Connection failure → auto-retry ──
  mainWindow.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription) => {
      mainWindow.webContents.send("connection-error", {
        code: errorCode,
        message: errorDescription,
      })
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.loadURL(APP_URL)
        }
      }, 3000)
    }
  )

  mainWindow.once("ready-to-show", () => {
    mainWindow.show()
  })

  // Focus/blur: send state to renderer for CSS border change only
  // NO opacity change — it causes End Session button flickering
  mainWindow.on("focus", () => {
    mainWindow.webContents.send("window-focus-changed", true)
  })

  mainWindow.on("blur", () => {
    mainWindow.webContents.send("window-focus-changed", false)
  })

  let saveTimer = null
  const debouncedSave = () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => saveWindowState(mainWindow), 500)
  }
  mainWindow.on("move", debouncedSave)
  mainWindow.on("resize", debouncedSave)

  mainWindow.webContents.on("will-navigate", (event, url) => {
    const appOrigin = new URL(APP_URL).origin
    if (!url.startsWith(appOrigin)) {
      event.preventDefault()
    }
  })

  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: "deny" }
  })

  // Cmd+W hides window (reopen from tray), Cmd+Q quits
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if ((input.meta || input.control) && input.key === "w") {
      mainWindow.hide()
      event.preventDefault()
    }
    if ((input.meta || input.control) && input.key === "q") {
      app.quit()
    }
  })

  mainWindow.on("closed", () => {
    mainWindow = null
  })
}

// =============================================================================
// GLOBAL HOTKEY
// =============================================================================

function registerHotkey() {
  const success = globalShortcut.register(HOTKEY, toggleFocus)
  if (!success) {
    console.error("Failed to register hotkey: " + HOTKEY)
  }
}

function toggleFocus() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow()
    return
  }

  if (mainWindow.isFocused()) {
    // Return focus to previous app
    if (process.platform === "darwin") {
      mainWindow.blur()
    } else {
      // Windows: just blur — the OS returns focus to the previous window
      mainWindow.blur()
    }
  } else {
    // Bring Nameless to front
    if (process.platform === "darwin") {
      app.show()
    }
    mainWindow.show()
    mainWindow.focus()
  }
}

// =============================================================================
// SYSTEM TRAY
// =============================================================================

function createTray() {
  const iconPath = path.join(__dirname, "..", "assets", "tray-icon.png")
  let trayIcon

  if (fs.existsSync(iconPath)) {
    trayIcon = nativeImage
      .createFromPath(iconPath)
      .resize({ width: 18, height: 18 })
    if (process.platform === "darwin") {
      trayIcon.setTemplateImage(true)
    }
  } else {
    const mainIconPath = path.join(__dirname, "..", "assets", "icon.png")
    if (fs.existsSync(mainIconPath)) {
      trayIcon = nativeImage
        .createFromPath(mainIconPath)
        .resize({ width: 18, height: 18 })
      if (process.platform === "darwin") {
        trayIcon.setTemplateImage(true)
      }
    } else {
      trayIcon = nativeImage.createEmpty()
    }
  }

  tray = new Tray(trayIcon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show / Hide",
      click: () => {
        if (!mainWindow || mainWindow.isDestroyed()) {
          createWindow()
        } else if (mainWindow.isVisible()) {
          mainWindow.hide()
        } else {
          mainWindow.show()
          mainWindow.focus()
        }
      },
    },
    { type: "separator" },
    { label: "Hotkey: Ctrl+Space", enabled: false },
    { type: "separator" },
    { label: "Quit Nameless", click: () => app.quit() },
  ])

  tray.setToolTip("Nameless Poker")
  tray.setContextMenu(contextMenu)

  tray.on("click", () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      createWindow()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

// =============================================================================
// IPC
// =============================================================================

ipcMain.on("window-minimize", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.minimize()
  }
})

ipcMain.on("window-hide", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide()
  }
})

ipcMain.handle("get-platform", () => ({
  platform: process.platform,
  hotkeyDisplay: "Ctrl + Space",
  hotkeyRaw: HOTKEY,
}))

// =============================================================================
// APP LIFECYCLE
// =============================================================================

if (process.platform === "darwin") {
  app.dock?.hide()
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

app.whenReady().then(() => {
  createWindow()
  createTray()
  registerHotkey()
})

app.on("window-all-closed", () => {})

app.on("activate", () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow()
  }
})

app.on("will-quit", () => {
  globalShortcut.unregisterAll()
  if (mainWindow) saveWindowState(mainWindow)
})