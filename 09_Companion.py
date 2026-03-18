# 09_Companion.py — Desktop Companion Download Page
# Premium in-app download for the Nameless Poker floating window companion.
# Detects user platform (macOS/Windows) and shows the appropriate download.

import streamlit as st

st.set_page_config(
    page_title="Companion | Nameless Poker",
    page_icon="favicon.png",
    layout="wide",
)

from auth import require_auth
from sidebar import render_sidebar

# ---------- Auth Gate ----------
user = require_auth()
render_sidebar()

# =============================================================================
# CONFIG — Update these when releasing new versions
# =============================================================================

COMPANION_VERSION = "1.0.0"
MAC_DOWNLOAD_URL = "https://github.com/nameless-gaming/nameless-companion/releases/download/v1.0.0/Nameless-Poker-1.0.0.dmg"
WIN_DOWNLOAD_URL = "https://github.com/nameless-gaming/nameless-companion/releases/download/v1.0.0/Nameless-Poker-Setup-1.0.0.exe"
MAC_FILE_SIZE = "~85 MB"
WIN_FILE_SIZE = "~65 MB"

# =============================================================================
# PLATFORM DETECTION
# =============================================================================

def detect_platform() -> str:
    """Detect user's OS from request headers. Returns 'mac', 'windows', or 'unknown'."""
    try:
        headers = st.context.headers
        ua = headers.get("User-Agent", "") or headers.get("user-agent", "")
        ua_lower = ua.lower()
        if "macintosh" in ua_lower or "mac os" in ua_lower:
            return "mac"
        elif "windows" in ua_lower:
            return "windows"
    except Exception:
        pass
    return "unknown"

platform = detect_platform()

# =============================================================================
# CSS
# =============================================================================

st.markdown("""
<style>
/* ── Global ── */
[data-testid="stAppViewContainer"] { background: #0A0A12; }
section[data-testid="stSidebar"] { background: #0F0F1A; }

/* ── Hide Streamlit default elements ── */
div[data-testid="stDecoration"] { display: none !important; }

/* ── Page container ── */
.companion-page {
    max-width: 560px;
    margin: 0 auto;
    padding: 40px 24px 60px;
}

/* ── Hero ── */
.companion-hero {
    text-align: center;
    margin-bottom: 36px;
}
.companion-hero-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(75,163,255,0.12) 0%, rgba(75,163,255,0.04) 100%);
    border: 1px solid rgba(75,163,255,0.2);
    font-size: 24px;
    margin-bottom: 16px;
}
.companion-hero h1 {
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 24px;
    font-weight: 800;
    color: #E0E0E0;
    margin: 0 0 8px;
    letter-spacing: -0.01em;
}
.companion-hero p {
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 14px;
    color: rgba(255,255,255,0.4);
    line-height: 1.6;
    margin: 0;
}

/* ── Value props ── */
.companion-props {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 32px;
}
.companion-prop {
    background: linear-gradient(135deg, #0F0F1A 0%, #131320 100%);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 10px;
    padding: 14px 16px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
}
.companion-prop-icon {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    background: rgba(75,163,255,0.06);
}
.companion-prop-text {
    flex: 1;
}
.companion-prop-title {
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: #E0E0E0;
    margin-bottom: 2px;
}
.companion-prop-desc {
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 12px;
    color: rgba(255,255,255,0.35);
    line-height: 1.5;
}

/* ── Download section ── */
.companion-download {
    background: linear-gradient(135deg, #0F0F1A 0%, #151520 100%);
    border: 1px solid rgba(75,163,255,0.15);
    border-radius: 14px;
    padding: 28px 24px;
    text-align: center;
    margin-bottom: 32px;
}
.companion-download-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 32px;
    background: #4BA3FF;
    color: #FFFFFF;
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 700;
    border-radius: 10px;
    text-decoration: none;
    transition: all 0.15s ease;
    letter-spacing: 0.01em;
}
.companion-download-btn:hover {
    background: #5BAFFF;
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(75,163,255,0.25);
    color: #FFFFFF;
    text-decoration: none;
}
.companion-download-meta {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: rgba(255,255,255,0.25);
    margin-top: 10px;
}
.companion-download-alt {
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 12px;
    color: rgba(255,255,255,0.25);
    margin-top: 14px;
}
.companion-download-alt a {
    color: rgba(75,163,255,0.6);
    text-decoration: none;
}
.companion-download-alt a:hover {
    color: #4BA3FF;
}

/* ── Setup steps ── */
.companion-steps {
    margin-bottom: 32px;
}
.companion-steps-title {
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(255,255,255,0.3);
    margin-bottom: 14px;
}
.companion-step {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 14px;
}
.companion-step-num {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    border-radius: 7px;
    background: rgba(75,163,255,0.08);
    border: 1px solid rgba(75,163,255,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    color: #4BA3FF;
}
.companion-step-text {
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 13px;
    color: rgba(255,255,255,0.55);
    line-height: 1.5;
    padding-top: 2px;
}
.companion-step-text strong {
    color: #E0E0E0;
    font-weight: 600;
}
.companion-step-text code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #4BA3FF;
    background: rgba(75,163,255,0.08);
    padding: 2px 6px;
    border-radius: 4px;
}

/* ── How it works ── */
.companion-workflow {
    background: rgba(0,200,83,0.03);
    border: 1px solid rgba(0,200,83,0.08);
    border-radius: 10px;
    padding: 16px 18px;
    margin-bottom: 32px;
}
.companion-workflow-title {
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(0,200,83,0.6);
    margin-bottom: 10px;
}
.companion-workflow-text {
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 12px;
    color: rgba(255,255,255,0.4);
    line-height: 1.7;
}
.companion-workflow-text strong {
    color: rgba(255,255,255,0.65);
}

/* ── Footer / requirements ── */
.companion-footer {
    text-align: center;
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 11px;
    color: rgba(255,255,255,0.18);
    line-height: 1.6;
}

/* ── Electron-detected state ── */
.companion-active {
    text-align: center;
    padding: 60px 24px;
}
.companion-active-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(0,200,83,0.08);
    border: 1px solid rgba(0,200,83,0.2);
    font-size: 22px;
    margin-bottom: 14px;
}
.companion-active h2 {
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: #E0E0E0;
    margin: 0 0 6px;
}
.companion-active p {
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 13px;
    color: rgba(255,255,255,0.35);
}
</style>
""", unsafe_allow_html=True)

# =============================================================================
# RENDER
# =============================================================================

# Build platform-specific download section
if platform == "mac":
    primary_url = MAC_DOWNLOAD_URL
    primary_label = "Download for macOS"
    primary_icon = "⬇"
    primary_meta = f"v{COMPANION_VERSION} · {MAC_FILE_SIZE} · macOS 12+"
    alt_label = "Looking for Windows?"
    alt_url = WIN_DOWNLOAD_URL
elif platform == "windows":
    primary_url = WIN_DOWNLOAD_URL
    primary_label = "Download for Windows"
    primary_icon = "⬇"
    primary_meta = f"v{COMPANION_VERSION} · {WIN_FILE_SIZE} · Windows 10+"
    alt_label = "Looking for macOS?"
    alt_url = MAC_DOWNLOAD_URL
else:
    primary_url = MAC_DOWNLOAD_URL
    primary_label = "Download for macOS"
    primary_icon = "⬇"
    primary_meta = f"v{COMPANION_VERSION} · {MAC_FILE_SIZE} · macOS 12+"
    alt_label = "Download for Windows"
    alt_url = WIN_DOWNLOAD_URL

# The page
st.markdown(f"""
<div class="companion-page">

    <!-- HERO -->
    <div class="companion-hero">
        <div class="companion-hero-icon">♠</div>
        <h1>Nameless Companion</h1>
        <p>Float Nameless on top of your poker table.<br/>Switch focus with a single hotkey.</p>
    </div>

    <!-- VALUE PROPS -->
    <div class="companion-props">
        <div class="companion-prop">
            <div class="companion-prop-icon">📌</div>
            <div class="companion-prop-text">
                <div class="companion-prop-title">Always-on-top floating window</div>
                <div class="companion-prop-desc">Sits on your poker table. No more switching tabs or hunting for the right window.</div>
            </div>
        </div>
        <div class="companion-prop">
            <div class="companion-prop-icon">⚡</div>
            <div class="companion-prop-text">
                <div class="companion-prop-title">Ctrl+Space instant focus toggle</div>
                <div class="companion-prop-desc">Two keys, one hand, 0.2 seconds. Your right hand never leaves the mouse.</div>
            </div>
        </div>
        <div class="companion-prop">
            <div class="companion-prop-icon">🎯</div>
            <div class="companion-prop-text">
                <div class="companion-prop-title">Works with every poker platform</div>
                <div class="companion-prop-desc">Stake, ACR, PokerStars, CoinPoker, Bovada, Ignition, GGPoker — all of them.</div>
            </div>
        </div>
    </div>

    <!-- DOWNLOAD -->
    <div class="companion-download">
        <a href="{primary_url}" class="companion-download-btn" target="_blank">
            {primary_icon}&nbsp;&nbsp;{primary_label}
        </a>
        <div class="companion-download-meta">{primary_meta}</div>
        <div class="companion-download-alt">
            <a href="{alt_url}" target="_blank">{alt_label}</a>
        </div>
    </div>

    <!-- SETUP STEPS -->
    <div class="companion-steps">
        <div class="companion-steps-title">Setup</div>
        <div class="companion-step">
            <div class="companion-step-num">1</div>
            <div class="companion-step-text"><strong>Install</strong> — Open the downloaded file and drag Nameless Poker to Applications.</div>
        </div>
        <div class="companion-step">
            <div class="companion-step-num">2</div>
            <div class="companion-step-text"><strong>Launch & log in</strong> — Open the app. A floating window appears. Log in with your existing account.</div>
        </div>
        <div class="companion-step">
            <div class="companion-step-num">3</div>
            <div class="companion-step-text"><strong>Position & play</strong> — Drag the window to a corner of your poker table. Press <code>Ctrl+Space</code> to toggle focus.</div>
        </div>
    </div>

    <!-- HOW IT WORKS -->
    <div class="companion-workflow">
        <div class="companion-workflow-title">How it works with the app</div>
        <div class="companion-workflow-text">
            <strong>Start sessions in the browser</strong> as usual — pick your stakes, set your buy-in.
            The companion detects the active session and shows your play interface.
            <strong>Play hands through the companion</strong> using the hotkey to switch focus.
            When you're done, <strong>end the session in the browser</strong>.
            <br/><br/>
            The companion is your cockpit during play. Everything else — history, stats, settings — stays in the full app.
        </div>
    </div>

    <!-- FOOTER -->
    <div class="companion-footer">
        macOS 12+ or Windows 10+ · No special permissions required<br/>
        The companion is optional. Your browser experience is unchanged without it.
    </div>

</div>
""", unsafe_allow_html=True)
