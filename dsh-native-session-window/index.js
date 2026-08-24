// dsh-native-session-window — host-side native Electron session windows.
// The Web profile keeps the route inert; Desktop supplies desktopRuntime at request time.

const name = "dsh-native-session-window";
const inject = ["webServer", "workspaceRegistry"];
const SESSION_ID_PATTERN = /^[A-Za-z0-9._:-]{1,256}$/u;
const MAX_REQUEST_BODY_BYTES = 16 * 1024;
const DESKTOP_MODES = new Set(["compatibility", "advanced"]);
const DESKTOP_PLATFORMS = new Set(["darwin", "win32", "linux"]);

function isValidSessionId(value) {
  return typeof value === "string" && SESSION_ID_PATTERN.test(value);
}

function assertDesktopMode(mode) {
  if (!DESKTOP_MODES.has(mode)) throw new Error(`invalid desktop mode ${JSON.stringify(mode)}`);
  return mode;
}

function assertDesktopPlatform(platform) {
  if (!DESKTOP_PLATFORMS.has(platform)) throw new Error(`invalid desktop platform ${JSON.stringify(platform)}`);
  return platform;
}

function buildNativeSessionUrl({ port, mode, platform, sessionId }) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("native session window requires a valid Web port");
  if (!isValidSessionId(sessionId)) throw new Error("native session window requires a valid sessionId");
  const url = new URL(`http://127.0.0.1:${String(port)}/`);
  url.searchParams.set("dsh-desktop-mode", assertDesktopMode(mode));
  url.searchParams.set("dsh-desktop-platform", assertDesktopPlatform(platform));
  url.searchParams.set("dsh-session", sessionId);
  return url.href;
}

const NATIVE_WINDOW_LOAD_TIMEOUT_MS = 25_000;

/**
 * Load a window URL with a hard timeout. If the renderer is destroyed while
 * loading (window closed mid-load), loadURL can hang forever on some
 * platforms; a stuck load would keep the controller's `pending` slot occupied
 * and make every later open() for the same session a no-op until restart.
 * @returns the settled loadURL result, or rejects with a timeout error.
 */
function loadWithTimeout(window, url, timeoutMs = NATIVE_WINDOW_LOAD_TIMEOUT_MS) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("native session window load timed out")), timeoutMs);
  });
  return Promise.race([window.loadURL(url), timeout]).finally(() => clearTimeout(timer));
}

function nativeWindowOptions(spec) {
  const base = {
    title: "DeepSeek Harness Desktop",
    width: spec.width ?? 1280,
    height: spec.height ?? 840,
    minWidth: spec.minWidth ?? 900,
    minHeight: spec.minHeight ?? 640,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // Kept at the secure default: the sandbox:false experiment did not lift
      // the ~4-window Chromium renderer limit on this machine, so we restore
      // the sandboxed posture (windows only load the trusted loopback DSH app).
      sandbox: true,
      webSecurity: true,
      // Windows are created hidden (show:false) until loadURL finishes.
      // Chromium throttles hidden windows, and with several heavy windows
      // already open the Nth hidden window is throttled to near-zero and its
      // initial load never completes (renderer sits at ~0% CPU). Disable
      // throttling so every window loads at full speed while hidden.
      backgroundThrottling: false
    }
  };
  if (spec.mode === "compatibility") {
    if (spec.platform !== "win32") return base;
    // Match the desktop shell's own compatibility window on Windows: hide the
    // native title bar via Window Controls Overlay (no white strip) while the
    // native frame is kept for resizing. The renderer drag region that keeps
    // the window movable/snappable (Aero Snap) is injected by the client half.
    // backgroundMaterial is intentionally omitted: several concurrent mica
    // windows saturate the DWM compositor and make a further window's loadURL
    // hang on this machine (3+ windows). The Aqua glass theme already supplies
    // the translucent background.
    return {
      ...base,
      autoHideMenuBar: true,
      titleBarStyle: "hidden",
      titleBarOverlay: { color: "#00000000", symbolColor: "#40597a", height: 32 },
      backgroundColor: "#00000000",
      hasShadow: true,
      roundedCorners: true,
      thickFrame: true
    };
  }
  if (spec.mode !== "advanced") throw new Error(`unsupported native window mode ${spec.mode}`);
  if (spec.platform === "darwin") {
    return {
      ...base,
      titleBarStyle: "hiddenInset",
      trafficLightPosition: { x: 16, y: 16 },
      transparent: true,
      backgroundColor: "#00000000",
      vibrancy: "sidebar",
      visualEffectState: "followWindow"
    };
  }
  if (spec.platform === "win32") {
    // Same WCO treatment as compatibility mode; mica omitted for the same
    // multi-window DWM saturation reason (see compatibility branch).
    return {
      ...base,
      autoHideMenuBar: true,
      titleBarStyle: "hidden",
      titleBarOverlay: { color: "#00000000", symbolColor: "#7f858f", height: 32 },
      backgroundColor: "#00000000",
      hasShadow: true,
      roundedCorners: true,
      thickFrame: true
    };
  }
  throw new Error("advanced native session windows are unsupported on this platform");
}

function desktopWindowsFromOpenWindows(BrowserWindow) {
  const windows = typeof BrowserWindow.getAllWindows === "function" ? BrowserWindow.getAllWindows() : [];
  return windows.filter((candidate) => {
    try {
      if (typeof candidate?.isDestroyed === "function" && candidate.isDestroyed()) return false;
      const rawUrl = typeof candidate?.webContents?.getURL === "function" ? candidate.webContents.getURL() : "";
      if (typeof rawUrl !== "string" || rawUrl.length === 0) return false;
      const url = new URL(rawUrl);
      return DESKTOP_MODES.has(url.searchParams.get("dsh-desktop-mode"))
        && DESKTOP_PLATFORMS.has(url.searchParams.get("dsh-desktop-platform"));
    } catch {
      return false;
    }
  });
}

function desktopSpecFromOpenWindows(BrowserWindow, runtime, fallbackMode) {
  const windows = desktopWindowsFromOpenWindows(BrowserWindow);
  for (const candidate of windows) {
    try {
      // A window that is closing may already be destroyed; touching its
      // webContents then throws "Object has been destroyed", which must not
      // break opening a new session window. Guard before and during the read.
      if (typeof candidate?.isDestroyed === "function" && candidate.isDestroyed()) continue;
      const webContents = candidate?.webContents;
      const rawUrl = typeof webContents?.getURL === "function" ? webContents.getURL() : "";
      if (typeof rawUrl !== "string" || rawUrl.length === 0) continue;
      const url = new URL(rawUrl);
      const mode = url.searchParams.get("dsh-desktop-mode");
      const platform = url.searchParams.get("dsh-desktop-platform");
      if (DESKTOP_MODES.has(mode) && DESKTOP_PLATFORMS.has(platform)) return { mode, platform };
    } catch {
      // A window that has not loaded its renderer URL yet, or is closing.
    }
  }
  return {
    mode: DESKTOP_MODES.has(fallbackMode) ? fallbackMode : "compatibility",
    platform: DESKTOP_PLATFORMS.has(runtime?.platform) ? runtime.platform : "win32"
  };
}

function fitMinimumSize(window, width, height) {
  try {
    const current = typeof window.getMinimumSize === "function" ? window.getMinimumSize() : null;
    if (Array.isArray(current)) {
      const minWidth = Math.min(current[0], width);
      const minHeight = Math.min(current[1], height);
      window.setMinimumSize?.(minWidth, minHeight);
    }
  } catch {
    // Minimum size is best-effort; a window that cannot lower it still tiles.
  }
}

function tileNativeSessionWindows(BrowserWindow, screen, gap = 16) {
  if (typeof screen?.getDisplayMatching !== "function") return;
  const windows = desktopWindowsFromOpenWindows(BrowserWindow)
    .filter((window) => typeof window.getBounds === "function" && typeof window.setBounds === "function");
  if (windows.length !== 2) return;
  // Anchor on the first (oldest) DSH window — the main window — which is the
  // display the user is actually working on.
  const anchor = windows[0];
  let area;
  try {
    area = screen.getDisplayMatching(anchor.getBounds())?.workArea;
  } catch {
    return;
  }
  if (!area || area.width < 2 || area.height < 2) return;
  const safeGap = Number.isFinite(gap) ? Math.max(0, Math.min(Math.floor(gap), Math.floor(area.width / 2) - 1)) : 0;
  const totalWidth = Math.max(2, Math.floor(area.width));
  const leftWidth = Math.floor((totalWidth - safeGap) / 2);
  const rightWidth = totalWidth - safeGap - leftWidth;
  const bounds = [
    { x: area.x, y: area.y, width: leftWidth, height: area.height },
    { x: area.x + leftWidth + safeGap, y: area.y, width: rightWidth, height: area.height }
  ];
  for (const [index, window] of windows.slice(-2).entries()) {
    try {
      window.isMaximized?.() && window.unmaximize?.();
      // The windows are created with minWidth 900, which is wider than a half
      // tile on many work areas; if we do not lower the minimum first, Electron
      // clamps the width back up and the right window overflows the work area,
      // overlapping the left one. The lowered floor is kept (restoring it would
      // re-clamp the window wider than the tile).
      fitMinimumSize(window, bounds[index].width, bounds[index].height);
      window.setBounds(bounds[index]);
    } catch {
      // A window may close between discovery and tiling.
    }
  }
}

function createNativeSessionWindowController(options) {
  const { BrowserWindow, shell, screen, webServer, runtime } = options;
  if (typeof BrowserWindow !== "function") throw new Error("native session window requires Electron BrowserWindow");
  if (webServer?.host !== "127.0.0.1") throw new Error("native session window requires a loopback Web server");
  const windows = new Map();
  const pending = new Map();
  const releases = new Map();
  const fallbackMode = options.mode ?? "compatibility";
  const resolveSpec = options.resolveSpec ?? (() => desktopSpecFromOpenWindows(BrowserWindow, runtime, fallbackMode));

  function attachWindow(sessionId, window, origin) {
    let release = () => {};
    const onClosed = () => {
      try {
        release();
      } catch {
        // Cleanup must never throw into the event emitter; the map cleanup
        // below still runs so a later open() can create a fresh window.
      }
      if (windows.get(sessionId) === window) windows.delete(sessionId);
    };
    const preventExternalNavigation = (event) => {
      let targetOrigin;
      try {
        targetOrigin = new URL(event.url).origin;
      } catch {
        targetOrigin = undefined;
      }
      if (targetOrigin !== origin) event.preventDefault();
    };
    const onOpen = ({ url }) => {
      try {
        const target = new URL(url);
        if (["http:", "https:", "mailto:"].includes(target.protocol)) {
          shell?.openExternal?.(target.href)?.catch?.(() => {});
        }
      } catch {
        // Invalid external URLs stay blocked.
      }
      return { action: "deny" };
    };
    window.on?.("closed", onClosed);
    window.webContents?.on?.("will-frame-navigate", preventExternalNavigation);
    window.webContents?.on?.("will-redirect", preventExternalNavigation);
    window.webContents?.on?.("will-navigate", preventExternalNavigation);
    window.webContents?.setWindowOpenHandler?.(onOpen);
    release = () => {
      if (releases.get(sessionId) !== release) return;
      releases.delete(sessionId);
      // "closed" fires after the window is destroyed; touching its members throws
      // "Object has been destroyed". When destroyed, only the map cleanup above
      // matters. Partial destruction (window alive, webContents gone) must not
      // throw out of a caller, so every member access is guarded.
      if (window.isDestroyed?.()) return;
      try {
        window.off?.("closed", onClosed);
        window.webContents?.off?.("will-frame-navigate", preventExternalNavigation);
        window.webContents?.off?.("will-redirect", preventExternalNavigation);
        window.webContents?.off?.("will-navigate", preventExternalNavigation);
      } catch {
        // Window partially destroyed mid-close; nothing left to detach.
      }
    };
    releases.set(sessionId, release);
    return release;
  }

  async function open(sessionId) {
    if (!isValidSessionId(sessionId)) throw new Error("invalid sessionId");
    const existing = windows.get(sessionId);
    if (existing !== undefined && !existing.isDestroyed?.()) {
      existing.isMinimized?.() && existing.restore?.();
      existing.show?.();
      existing.focus?.();
      return { ok: true, reused: true };
    }
    if (existing !== undefined) {
      try {
        releases.get(sessionId)?.();
      } catch {
        releases.delete(sessionId);
      }
      windows.delete(sessionId);
    }
    const running = pending.get(sessionId);
    if (running !== undefined) return running;

    const attempt = (async () => {
      const spec = resolveSpec();
      const url = buildNativeSessionUrl({
        port: webServer.port,
        mode: spec.mode,
        platform: spec.platform,
        sessionId
      });
      const window = new BrowserWindow(nativeWindowOptions(spec));
      const release = attachWindow(sessionId, window, new URL(url).origin);
      windows.set(sessionId, window);
      try {
        await loadWithTimeout(window, url);
        if (window.isDestroyed?.()) throw new Error("native session window closed before loading");
        window.show?.();
        window.focus?.();
        tileNativeSessionWindows(BrowserWindow, screen);
        return { ok: true, reused: false };
      } catch (error) {
        try {
          release();
        } catch {
          // Fall through to map cleanup regardless.
        }
        if (windows.get(sessionId) === window) windows.delete(sessionId);
        if (!window.isDestroyed?.()) window.destroy?.();
        throw error;
      }
    })();
    pending.set(sessionId, attempt);
    try {
      return await attempt;
    } finally {
      if (pending.get(sessionId) === attempt) pending.delete(sessionId);
    }
  }

  function dispose() {
    const current = [...windows.entries()];
    windows.clear();
    for (const [sessionId, window] of current) {
      try {
        releases.get(sessionId)?.();
      } catch {
        releases.delete(sessionId);
      }
      if (!window.isDestroyed?.()) window.destroy?.();
    }
  }

  return { open, dispose };
}

function service(ctx, name) {
  return typeof ctx.get === "function" ? ctx.get(name) : undefined;
}

async function sessionExists(ctx, sessionId) {
  const liveAgents = service(ctx, "agents");
  if (liveAgents?.get?.(sessionId) !== undefined) return true;
  const persistence = service(ctx, "sessionPersistence");
  if (persistence?.list) {
    const headers = await persistence.list();
    if (headers.some((header) => header?.id === sessionId)) return true;
  }
  const registry = ctx.workspaceRegistry;
  if (registry?.list?.().some((workspace) => workspace.sessionIds.includes(sessionId))) return true;
  return registry?.archivedSessionIds?.includes(sessionId) === true;
}

function apply(ctx, config = {}) {
  let controller;
  let controllerPromise;

  async function getController() {
    const runtime = service(ctx, "desktopRuntime");
    if (runtime === undefined) return null;
    if (controller !== undefined) return controller;
    controllerPromise ??= (async () => {
      const electron = await import("electron");
      const created = createNativeSessionWindowController({
        BrowserWindow: electron.BrowserWindow,
        shell: electron.shell,
        screen: electron.screen,
        webServer: ctx.webServer,
        runtime,
        mode: config.mode ?? "compatibility",
        resolveSpec: () => desktopSpecFromOpenWindows(electron.BrowserWindow, runtime, config.mode ?? "compatibility")
      });
      controller = created;
      return created;
    })();
    try {
      return await controllerPromise;
    } catch (error) {
      controllerPromise = undefined;
      throw error;
    }
  }

  ctx.effect(
    () => ctx.webServer.register({
      kind: "exact",
      path: "/session-manager/window/status",
      handler: async (req, res) => {
        const send = (code, body) => {
          res.writeHead(code, { "content-type": "application/json; charset=utf-8" });
          res.end(JSON.stringify(body));
        };
        if (req.method !== "GET") {
          send(404, { ok: false, error: "not found" });
          return;
        }
        send(200, { ok: true, available: service(ctx, "desktopRuntime") !== undefined });
      }
    }),
    "dsh-native-session-window: status route"
  );
  ctx.effect(
    () => ctx.webServer.register({
      kind: "exact",
      path: "/session-manager/window",
      handler: async (req, res) => {
        const send = (code, body) => {
          res.writeHead(code, { "content-type": "application/json; charset=utf-8" });
          res.end(JSON.stringify(body));
        };
        if (req.method !== "POST") {
          send(404, { ok: false, error: "not found" });
          return;
        }
        const expectedOrigin = `http://${ctx.webServer.host}:${String(ctx.webServer.port)}`;
        if (req.headers?.origin !== expectedOrigin) {
          send(403, { ok: false, error: "origin not allowed" });
          return;
        }
        let text = "";
        let bytes = 0;
        for await (const chunk of req) {
          bytes += Buffer.byteLength(chunk);
          if (bytes > MAX_REQUEST_BODY_BYTES) {
            send(413, { ok: false, error: "request body too large" });
            return;
          }
          text += chunk;
        }
        let body;
        try {
          body = JSON.parse(text || "{}");
        } catch {
          send(400, { ok: false, error: "invalid json body" });
          return;
        }
        const sessionId = body?.sessionId;
        if (!isValidSessionId(sessionId)) {
          send(400, { ok: false, error: "invalid sessionId" });
          return;
        }
        try {
          if (service(ctx, "desktopRuntime") === undefined) {
            send(404, { ok: false, error: "native session windows are available in DSH Desktop only" });
            return;
          }
          if (!(await sessionExists(ctx, sessionId))) {
            send(404, { ok: false, error: "session not found" });
            return;
          }
          const native = await getController();
          if (native === null) {
            send(404, { ok: false, error: "native session windows are unavailable" });
            return;
          }
          send(200, await native.open(sessionId));
        } catch (error) {
          send(500, { ok: false, error: error instanceof Error ? error.message : String(error) });
        }
      }
    }),
    "dsh-native-session-window: route"
  );
  ctx.effect(
    () => () => controller?.dispose(),
    "dsh-native-session-window: windows"
  );
}

export {
  apply,
  buildNativeSessionUrl,
  createNativeSessionWindowController,
  inject,
  isValidSessionId,
  loadWithTimeout,
  name,
  nativeWindowOptions,
  tileNativeSessionWindows
};
