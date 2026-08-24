// dsh-native-session-window — client-side auto-open for new-window URLs.
// The menu entry lives in the official workspace bundle; this half only opens
// the target session when a new window/tab carries ?dsh-session=<id>.
// It also installs a drag region on the conversation header so native session
// windows stay movable/snappable (Aero Snap) once the native title bar is
// hidden via Window Controls Overlay (see host nativeWindowOptions).
import { useEffect, useState } from "react";
import { jsx } from "react/jsx-runtime";

const NS = "nativeSessionWindow";
const searchParams = new URLSearchParams(window.location.search);
const targetSessionId = searchParams.get("dsh-session");
// Every desktop window (main + any number of native session windows) carries
// dsh-desktop-mode in its URL; the plain web profile does not. The drag region
// must apply to all of them so each window stays snappable.
const isDesktopWindow = searchParams.get("dsh-desktop-mode") !== null;

const css = {
  notice: {
    position: "fixed",
    top: 16,
    left: "50%",
    zIndex: 10000,
    transform: "translateX(-50%)",
    maxWidth: "min(680px, calc(100vw - 32px))",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid var(--dsw-alias-border-l2, #e5e7eb)",
    background: "var(--dsw-alias-bg-elevated, #fff)",
    color: "var(--dsw-alias-label-primary, #1f2329)",
    boxShadow: "0 8px 30px rgba(0, 0, 0, .18)",
    fontSize: 13,
    lineHeight: 1.45
  }
};

// The conversation header becomes a window drag handle (VS Code pattern): its
// empty areas move the window, interactive children stay clickable. A slim
// full-width top edge supplements it so the window can be grabbed at the very
// top from anywhere (leaving the Window Controls Overlay buttons clear).
const DRAG_STYLE = `
[data-native-session-window-drag] { -webkit-app-region: drag; user-select: none; }
[data-native-session-window-drag] button,
[data-native-session-window-drag] a,
[data-native-session-window-drag] input,
[data-native-session-window-drag] textarea,
[data-native-session-window-drag] select,
[data-native-session-window-drag] [role="button"],
[data-native-session-window-drag] [role="menuitem"],
[data-native-session-window-drag] [contenteditable="true"] { -webkit-app-region: no-drag; }
#dsh-native-session-window-drag-edge {
  position: fixed; top: 0; left: 0; right: 138px; height: 14px;
  z-index: 2147483000; -webkit-app-region: drag;
}
/* Modal (aria-modal, e.g. the settings dialog) must stay fully clickable: a
   window drag region outranks the modal's own hit-testing in Electron, so any
   button inside the drag strip's height would swallow clicks. Disable the
   drag region while a modal is open — the same exemption the upstream desktop
   shell applies to its caption row. */
html:has([aria-modal="true"]) [data-native-session-window-drag],
html:has([aria-modal="true"]) #dsh-native-session-window-drag-edge { -webkit-app-region: no-drag !important; }
`;

/**
 * Install a drag region so every desktop window stays movable/snappable (Aero
 * Snap) once the native title bar is hidden via Window Controls Overlay.
 *
 * Performance: no DOM MutationObserver (the shell mutates the DOM constantly
 * during streaming/IDE use; a subtree observer would run a lookup on every
 * change). Instead we try once on boot and then run one trivial 1s timer that
 * only re-queries when the marked header was removed by a host rebuild. The
 * timer is O(1) per tick and stops mattering once the header is marked.
 * @returns a disposer removing the injected styles and markers.
 */
function installWindowDragRegion() {
  if (!isDesktopWindow) return () => {};
  const style = document.createElement("style");
  style.dataset.plugin = "dsh-native-session-window";
  style.textContent = DRAG_STYLE;
  document.head.appendChild(style);
  const edge = document.createElement("div");
  edge.id = "dsh-native-session-window-drag-edge";
  document.body.appendChild(edge);
  let marked = null;
  const markHeader = () => {
    if (marked !== null && marked.isConnected) return;
    // Prefer the conversation header inside the center column; fall back to
    // any header hosting conversation chrome (title row / tabs).
    const inCenter = document.querySelector('[class*="centerCol"] header');
    const candidate = inCenter !== null
      ? inCenter
      : Array.from(document.querySelectorAll("header")).find((h) =>
          h.querySelector('[class*="titleRow"], [class*="tabs"]') !== null) ?? null;
    if (candidate !== null) {
      marked = candidate;
      candidate.setAttribute("data-native-session-window-drag", "");
    }
  };
  markHeader();
  // Re-mark only when needed: header not mounted yet (boot) or removed by a
  // host DOM rebuild. One cheap check per second, no per-mutation work.
  const timer = setInterval(() => {
    if (marked === null || !marked.isConnected) {
      marked = null;
      markHeader();
    }
  }, 1000);
  return () => {
    clearInterval(timer);
    style.remove();
    edge.remove();
    marked?.removeAttribute("data-native-session-window-drag");
  };
}

function TargetSessionNotice({ t, sessions }) {
  const [message, setMessage] = useState(null);
  useEffect(() => {
    if (targetSessionId === null) return undefined;
    let cancelled = false;
    let opened = false;
    let unsubscribe;
    const reconcile = () => {
      const snapshot = sessions.list.getSnapshot();
      if (snapshot.phase !== "ready") return;
      if (snapshot.byId[targetSessionId] === undefined) {
        if (!cancelled) setMessage(t("sessionMissing"));
        return;
      }
      if (!opened) {
        opened = true;
        sessions.open(targetSessionId);
      }
      if (!cancelled) setMessage(null);
    };
    unsubscribe = sessions.list.subscribe(reconcile);
    reconcile();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [sessions, t]);
  if (message === null) return null;
  return jsx("div", { role: "alert", style: css.notice, children: message });
}

const dictionaries = {
  zh: {
    sessionMissing: "目标会话不存在，无法打开。",
    openFailed: "在新窗口打开失败："
  },
  en: {
    sessionMissing: "The target session no longer exists.",
    openFailed: "Open in new window failed: "
  }
};

/**
 * Route the official "open in new window" browser fallback
 * (`window.open(location.origin + "/?dsh-session=" + id)`) to the native
 * session-window POST instead, so the Desktop never opens a broken browser tab:
 * that fallback URL drops dsh-desktop-mode and fails to boot the desktop client.
 * Only applies in desktop windows; the web profile keeps normal window.open.
 * @returns a disposer restoring the original window.open.
 */
function installNativeWindowOpenIntercept() {
  if (!isDesktopWindow) return () => {};
  const nativeOpen = window.open.bind(window);
  window.open = (url, target, features) => {
    try {
      const parsed = new URL(String(url), window.location.href);
      const sessionId = parsed.searchParams.get("dsh-session");
      if (parsed.origin === window.location.origin && sessionId !== null) {
        fetch("/session-manager/window", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId })
        }).then((r) => r.json()).then((b) => {
          if (!b.ok) window.alert(`在新窗口打开失败：${b.error || "unknown error"}`);
        }).catch((error) => {
          window.alert(`在新窗口打开失败：${error instanceof Error ? error.message : String(error)}`);
        });
        return null;
      }
    } catch {
      // Not a same-origin dsh-session URL; fall through to the original.
    }
    return nativeOpen(url, target, features);
  };
  return () => {
    window.open = nativeOpen;
  };
}

const inject = ["locale", "slots", "sessions"];

function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, dictionaries), "native-session-window: dictionaries");
  ctx.effect(() => installWindowDragRegion(), "native-session-window: drag region");
  ctx.effect(() => installNativeWindowOpenIntercept(), "native-session-window: window.open intercept");
  const t = ctx.locale.bind(NS);
  ctx.slots.inject("shell.overlay", () => ctx.slots.register({
    name: "shell.overlay",
    id: "native-session-window-notice",
    locale: NS,
    inject: () => ({ sessions: ctx.sessions })
  }, TargetSessionNotice));
}

export { apply, inject };
