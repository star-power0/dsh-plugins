window.__ModuleLoader__.load({
	id: "dsh-native-session-window",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.js
var client_exports = {};
__export(client_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(client_exports);
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var NS = "nativeSessionWindow";
var searchParams = new URLSearchParams(window.location.search);
var targetSessionId = searchParams.get("dsh-session");
var isDesktopWindow = searchParams.get("dsh-desktop-mode") !== null;
var css = {
  notice: {
    position: "fixed",
    top: 16,
    left: "50%",
    zIndex: 1e4,
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
var DRAG_STYLE = `
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
   drag region while a modal is open \u2014 the same exemption the upstream desktop
   shell applies to its caption row. */
html:has([aria-modal="true"]) [data-native-session-window-drag],
html:has([aria-modal="true"]) #dsh-native-session-window-drag-edge { -webkit-app-region: no-drag !important; }
`;
function installWindowDragRegion() {
  if (!isDesktopWindow) return () => {
  };
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
    const inCenter = document.querySelector('[class*="centerCol"] header');
    const candidate = inCenter !== null ? inCenter : Array.from(document.querySelectorAll("header")).find((h) => h.querySelector('[class*="titleRow"], [class*="tabs"]') !== null) ?? null;
    if (candidate !== null) {
      marked = candidate;
      candidate.setAttribute("data-native-session-window-drag", "");
    }
  };
  markHeader();
  const timer = setInterval(() => {
    if (marked === null || !marked.isConnected) {
      marked = null;
      markHeader();
    }
  }, 1e3);
  return () => {
    clearInterval(timer);
    style.remove();
    edge.remove();
    marked?.removeAttribute("data-native-session-window-drag");
  };
}
function TargetSessionNotice({ t, sessions }) {
  const [message, setMessage] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
    if (targetSessionId === null) return void 0;
    let cancelled = false;
    let opened = false;
    let unsubscribe;
    const reconcile = () => {
      const snapshot = sessions.list.getSnapshot();
      if (snapshot.phase !== "ready") return;
      if (snapshot.byId[targetSessionId] === void 0) {
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
  return (0, import_jsx_runtime.jsx)("div", { role: "alert", style: css.notice, children: message });
}
var dictionaries = {
  zh: {
    sessionMissing: "\u76EE\u6807\u4F1A\u8BDD\u4E0D\u5B58\u5728\uFF0C\u65E0\u6CD5\u6253\u5F00\u3002",
    openFailed: "\u5728\u65B0\u7A97\u53E3\u6253\u5F00\u5931\u8D25\uFF1A"
  },
  en: {
    sessionMissing: "The target session no longer exists.",
    openFailed: "Open in new window failed: "
  }
};
function installNativeWindowOpenIntercept() {
  if (!isDesktopWindow) return () => {
  };
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
          if (!b.ok) window.alert(`\u5728\u65B0\u7A97\u53E3\u6253\u5F00\u5931\u8D25\uFF1A${b.error || "unknown error"}`);
        }).catch((error) => {
          window.alert(`\u5728\u65B0\u7A97\u53E3\u6253\u5F00\u5931\u8D25\uFF1A${error instanceof Error ? error.message : String(error)}`);
        });
        return null;
      }
    } catch {
    }
    return nativeOpen(url, target, features);
  };
  return () => {
    window.open = nativeOpen;
  };
}
var inject = ["locale", "slots", "sessions"];
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL2NsaWVudC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gZHNoLW5hdGl2ZS1zZXNzaW9uLXdpbmRvdyBcdTIwMTQgY2xpZW50LXNpZGUgYXV0by1vcGVuIGZvciBuZXctd2luZG93IFVSTHMuXG4vLyBUaGUgbWVudSBlbnRyeSBsaXZlcyBpbiB0aGUgb2ZmaWNpYWwgd29ya3NwYWNlIGJ1bmRsZTsgdGhpcyBoYWxmIG9ubHkgb3BlbnNcbi8vIHRoZSB0YXJnZXQgc2Vzc2lvbiB3aGVuIGEgbmV3IHdpbmRvdy90YWIgY2FycmllcyA/ZHNoLXNlc3Npb249PGlkPi5cbi8vIEl0IGFsc28gaW5zdGFsbHMgYSBkcmFnIHJlZ2lvbiBvbiB0aGUgY29udmVyc2F0aW9uIGhlYWRlciBzbyBuYXRpdmUgc2Vzc2lvblxuLy8gd2luZG93cyBzdGF5IG1vdmFibGUvc25hcHBhYmxlIChBZXJvIFNuYXApIG9uY2UgdGhlIG5hdGl2ZSB0aXRsZSBiYXIgaXNcbi8vIGhpZGRlbiB2aWEgV2luZG93IENvbnRyb2xzIE92ZXJsYXkgKHNlZSBob3N0IG5hdGl2ZVdpbmRvd09wdGlvbnMpLlxuaW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsganN4IH0gZnJvbSBcInJlYWN0L2pzeC1ydW50aW1lXCI7XG5cbmNvbnN0IE5TID0gXCJuYXRpdmVTZXNzaW9uV2luZG93XCI7XG5jb25zdCBzZWFyY2hQYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpO1xuY29uc3QgdGFyZ2V0U2Vzc2lvbklkID0gc2VhcmNoUGFyYW1zLmdldChcImRzaC1zZXNzaW9uXCIpO1xuLy8gRXZlcnkgZGVza3RvcCB3aW5kb3cgKG1haW4gKyBhbnkgbnVtYmVyIG9mIG5hdGl2ZSBzZXNzaW9uIHdpbmRvd3MpIGNhcnJpZXNcbi8vIGRzaC1kZXNrdG9wLW1vZGUgaW4gaXRzIFVSTDsgdGhlIHBsYWluIHdlYiBwcm9maWxlIGRvZXMgbm90LiBUaGUgZHJhZyByZWdpb25cbi8vIG11c3QgYXBwbHkgdG8gYWxsIG9mIHRoZW0gc28gZWFjaCB3aW5kb3cgc3RheXMgc25hcHBhYmxlLlxuY29uc3QgaXNEZXNrdG9wV2luZG93ID0gc2VhcmNoUGFyYW1zLmdldChcImRzaC1kZXNrdG9wLW1vZGVcIikgIT09IG51bGw7XG5cbmNvbnN0IGNzcyA9IHtcbiAgbm90aWNlOiB7XG4gICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgICB0b3A6IDE2LFxuICAgIGxlZnQ6IFwiNTAlXCIsXG4gICAgekluZGV4OiAxMDAwMCxcbiAgICB0cmFuc2Zvcm06IFwidHJhbnNsYXRlWCgtNTAlKVwiLFxuICAgIG1heFdpZHRoOiBcIm1pbig2ODBweCwgY2FsYygxMDB2dyAtIDMycHgpKVwiLFxuICAgIHBhZGRpbmc6IFwiMTBweCAxNHB4XCIsXG4gICAgYm9yZGVyUmFkaXVzOiAxMCxcbiAgICBib3JkZXI6IFwiMXB4IHNvbGlkIHZhcigtLWRzdy1hbGlhcy1ib3JkZXItbDIsICNlNWU3ZWIpXCIsXG4gICAgYmFja2dyb3VuZDogXCJ2YXIoLS1kc3ctYWxpYXMtYmctZWxldmF0ZWQsICNmZmYpXCIsXG4gICAgY29sb3I6IFwidmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnksICMxZjIzMjkpXCIsXG4gICAgYm94U2hhZG93OiBcIjAgOHB4IDMwcHggcmdiYSgwLCAwLCAwLCAuMTgpXCIsXG4gICAgZm9udFNpemU6IDEzLFxuICAgIGxpbmVIZWlnaHQ6IDEuNDVcbiAgfVxufTtcblxuLy8gVGhlIGNvbnZlcnNhdGlvbiBoZWFkZXIgYmVjb21lcyBhIHdpbmRvdyBkcmFnIGhhbmRsZSAoVlMgQ29kZSBwYXR0ZXJuKTogaXRzXG4vLyBlbXB0eSBhcmVhcyBtb3ZlIHRoZSB3aW5kb3csIGludGVyYWN0aXZlIGNoaWxkcmVuIHN0YXkgY2xpY2thYmxlLiBBIHNsaW1cbi8vIGZ1bGwtd2lkdGggdG9wIGVkZ2Ugc3VwcGxlbWVudHMgaXQgc28gdGhlIHdpbmRvdyBjYW4gYmUgZ3JhYmJlZCBhdCB0aGUgdmVyeVxuLy8gdG9wIGZyb20gYW55d2hlcmUgKGxlYXZpbmcgdGhlIFdpbmRvdyBDb250cm9scyBPdmVybGF5IGJ1dHRvbnMgY2xlYXIpLlxuY29uc3QgRFJBR19TVFlMRSA9IGBcbltkYXRhLW5hdGl2ZS1zZXNzaW9uLXdpbmRvdy1kcmFnXSB7IC13ZWJraXQtYXBwLXJlZ2lvbjogZHJhZzsgdXNlci1zZWxlY3Q6IG5vbmU7IH1cbltkYXRhLW5hdGl2ZS1zZXNzaW9uLXdpbmRvdy1kcmFnXSBidXR0b24sXG5bZGF0YS1uYXRpdmUtc2Vzc2lvbi13aW5kb3ctZHJhZ10gYSxcbltkYXRhLW5hdGl2ZS1zZXNzaW9uLXdpbmRvdy1kcmFnXSBpbnB1dCxcbltkYXRhLW5hdGl2ZS1zZXNzaW9uLXdpbmRvdy1kcmFnXSB0ZXh0YXJlYSxcbltkYXRhLW5hdGl2ZS1zZXNzaW9uLXdpbmRvdy1kcmFnXSBzZWxlY3QsXG5bZGF0YS1uYXRpdmUtc2Vzc2lvbi13aW5kb3ctZHJhZ10gW3JvbGU9XCJidXR0b25cIl0sXG5bZGF0YS1uYXRpdmUtc2Vzc2lvbi13aW5kb3ctZHJhZ10gW3JvbGU9XCJtZW51aXRlbVwiXSxcbltkYXRhLW5hdGl2ZS1zZXNzaW9uLXdpbmRvdy1kcmFnXSBbY29udGVudGVkaXRhYmxlPVwidHJ1ZVwiXSB7IC13ZWJraXQtYXBwLXJlZ2lvbjogbm8tZHJhZzsgfVxuI2RzaC1uYXRpdmUtc2Vzc2lvbi13aW5kb3ctZHJhZy1lZGdlIHtcbiAgcG9zaXRpb246IGZpeGVkOyB0b3A6IDA7IGxlZnQ6IDA7IHJpZ2h0OiAxMzhweDsgaGVpZ2h0OiAxNHB4O1xuICB6LWluZGV4OiAyMTQ3NDgzMDAwOyAtd2Via2l0LWFwcC1yZWdpb246IGRyYWc7XG59XG4vKiBNb2RhbCAoYXJpYS1tb2RhbCwgZS5nLiB0aGUgc2V0dGluZ3MgZGlhbG9nKSBtdXN0IHN0YXkgZnVsbHkgY2xpY2thYmxlOiBhXG4gICB3aW5kb3cgZHJhZyByZWdpb24gb3V0cmFua3MgdGhlIG1vZGFsJ3Mgb3duIGhpdC10ZXN0aW5nIGluIEVsZWN0cm9uLCBzbyBhbnlcbiAgIGJ1dHRvbiBpbnNpZGUgdGhlIGRyYWcgc3RyaXAncyBoZWlnaHQgd291bGQgc3dhbGxvdyBjbGlja3MuIERpc2FibGUgdGhlXG4gICBkcmFnIHJlZ2lvbiB3aGlsZSBhIG1vZGFsIGlzIG9wZW4gXHUyMDE0IHRoZSBzYW1lIGV4ZW1wdGlvbiB0aGUgdXBzdHJlYW0gZGVza3RvcFxuICAgc2hlbGwgYXBwbGllcyB0byBpdHMgY2FwdGlvbiByb3cuICovXG5odG1sOmhhcyhbYXJpYS1tb2RhbD1cInRydWVcIl0pIFtkYXRhLW5hdGl2ZS1zZXNzaW9uLXdpbmRvdy1kcmFnXSxcbmh0bWw6aGFzKFthcmlhLW1vZGFsPVwidHJ1ZVwiXSkgI2RzaC1uYXRpdmUtc2Vzc2lvbi13aW5kb3ctZHJhZy1lZGdlIHsgLXdlYmtpdC1hcHAtcmVnaW9uOiBuby1kcmFnICFpbXBvcnRhbnQ7IH1cbmA7XG5cbi8qKlxuICogSW5zdGFsbCBhIGRyYWcgcmVnaW9uIHNvIGV2ZXJ5IGRlc2t0b3Agd2luZG93IHN0YXlzIG1vdmFibGUvc25hcHBhYmxlIChBZXJvXG4gKiBTbmFwKSBvbmNlIHRoZSBuYXRpdmUgdGl0bGUgYmFyIGlzIGhpZGRlbiB2aWEgV2luZG93IENvbnRyb2xzIE92ZXJsYXkuXG4gKlxuICogUGVyZm9ybWFuY2U6IG5vIERPTSBNdXRhdGlvbk9ic2VydmVyICh0aGUgc2hlbGwgbXV0YXRlcyB0aGUgRE9NIGNvbnN0YW50bHlcbiAqIGR1cmluZyBzdHJlYW1pbmcvSURFIHVzZTsgYSBzdWJ0cmVlIG9ic2VydmVyIHdvdWxkIHJ1biBhIGxvb2t1cCBvbiBldmVyeVxuICogY2hhbmdlKS4gSW5zdGVhZCB3ZSB0cnkgb25jZSBvbiBib290IGFuZCB0aGVuIHJ1biBvbmUgdHJpdmlhbCAxcyB0aW1lciB0aGF0XG4gKiBvbmx5IHJlLXF1ZXJpZXMgd2hlbiB0aGUgbWFya2VkIGhlYWRlciB3YXMgcmVtb3ZlZCBieSBhIGhvc3QgcmVidWlsZC4gVGhlXG4gKiB0aW1lciBpcyBPKDEpIHBlciB0aWNrIGFuZCBzdG9wcyBtYXR0ZXJpbmcgb25jZSB0aGUgaGVhZGVyIGlzIG1hcmtlZC5cbiAqIEByZXR1cm5zIGEgZGlzcG9zZXIgcmVtb3ZpbmcgdGhlIGluamVjdGVkIHN0eWxlcyBhbmQgbWFya2Vycy5cbiAqL1xuZnVuY3Rpb24gaW5zdGFsbFdpbmRvd0RyYWdSZWdpb24oKSB7XG4gIGlmICghaXNEZXNrdG9wV2luZG93KSByZXR1cm4gKCkgPT4ge307XG4gIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuICBzdHlsZS5kYXRhc2V0LnBsdWdpbiA9IFwiZHNoLW5hdGl2ZS1zZXNzaW9uLXdpbmRvd1wiO1xuICBzdHlsZS50ZXh0Q29udGVudCA9IERSQUdfU1RZTEU7XG4gIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuICBjb25zdCBlZGdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgZWRnZS5pZCA9IFwiZHNoLW5hdGl2ZS1zZXNzaW9uLXdpbmRvdy1kcmFnLWVkZ2VcIjtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlZGdlKTtcbiAgbGV0IG1hcmtlZCA9IG51bGw7XG4gIGNvbnN0IG1hcmtIZWFkZXIgPSAoKSA9PiB7XG4gICAgaWYgKG1hcmtlZCAhPT0gbnVsbCAmJiBtYXJrZWQuaXNDb25uZWN0ZWQpIHJldHVybjtcbiAgICAvLyBQcmVmZXIgdGhlIGNvbnZlcnNhdGlvbiBoZWFkZXIgaW5zaWRlIHRoZSBjZW50ZXIgY29sdW1uOyBmYWxsIGJhY2sgdG9cbiAgICAvLyBhbnkgaGVhZGVyIGhvc3RpbmcgY29udmVyc2F0aW9uIGNocm9tZSAodGl0bGUgcm93IC8gdGFicykuXG4gICAgY29uc3QgaW5DZW50ZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbY2xhc3MqPVwiY2VudGVyQ29sXCJdIGhlYWRlcicpO1xuICAgIGNvbnN0IGNhbmRpZGF0ZSA9IGluQ2VudGVyICE9PSBudWxsXG4gICAgICA/IGluQ2VudGVyXG4gICAgICA6IEFycmF5LmZyb20oZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcImhlYWRlclwiKSkuZmluZCgoaCkgPT5cbiAgICAgICAgICBoLnF1ZXJ5U2VsZWN0b3IoJ1tjbGFzcyo9XCJ0aXRsZVJvd1wiXSwgW2NsYXNzKj1cInRhYnNcIl0nKSAhPT0gbnVsbCkgPz8gbnVsbDtcbiAgICBpZiAoY2FuZGlkYXRlICE9PSBudWxsKSB7XG4gICAgICBtYXJrZWQgPSBjYW5kaWRhdGU7XG4gICAgICBjYW5kaWRhdGUuc2V0QXR0cmlidXRlKFwiZGF0YS1uYXRpdmUtc2Vzc2lvbi13aW5kb3ctZHJhZ1wiLCBcIlwiKTtcbiAgICB9XG4gIH07XG4gIG1hcmtIZWFkZXIoKTtcbiAgLy8gUmUtbWFyayBvbmx5IHdoZW4gbmVlZGVkOiBoZWFkZXIgbm90IG1vdW50ZWQgeWV0IChib290KSBvciByZW1vdmVkIGJ5IGFcbiAgLy8gaG9zdCBET00gcmVidWlsZC4gT25lIGNoZWFwIGNoZWNrIHBlciBzZWNvbmQsIG5vIHBlci1tdXRhdGlvbiB3b3JrLlxuICBjb25zdCB0aW1lciA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICBpZiAobWFya2VkID09PSBudWxsIHx8ICFtYXJrZWQuaXNDb25uZWN0ZWQpIHtcbiAgICAgIG1hcmtlZCA9IG51bGw7XG4gICAgICBtYXJrSGVhZGVyKCk7XG4gICAgfVxuICB9LCAxMDAwKTtcbiAgcmV0dXJuICgpID0+IHtcbiAgICBjbGVhckludGVydmFsKHRpbWVyKTtcbiAgICBzdHlsZS5yZW1vdmUoKTtcbiAgICBlZGdlLnJlbW92ZSgpO1xuICAgIG1hcmtlZD8ucmVtb3ZlQXR0cmlidXRlKFwiZGF0YS1uYXRpdmUtc2Vzc2lvbi13aW5kb3ctZHJhZ1wiKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gVGFyZ2V0U2Vzc2lvbk5vdGljZSh7IHQsIHNlc3Npb25zIH0pIHtcbiAgY29uc3QgW21lc3NhZ2UsIHNldE1lc3NhZ2VdID0gdXNlU3RhdGUobnVsbCk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHRhcmdldFNlc3Npb25JZCA9PT0gbnVsbCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBsZXQgY2FuY2VsbGVkID0gZmFsc2U7XG4gICAgbGV0IG9wZW5lZCA9IGZhbHNlO1xuICAgIGxldCB1bnN1YnNjcmliZTtcbiAgICBjb25zdCByZWNvbmNpbGUgPSAoKSA9PiB7XG4gICAgICBjb25zdCBzbmFwc2hvdCA9IHNlc3Npb25zLmxpc3QuZ2V0U25hcHNob3QoKTtcbiAgICAgIGlmIChzbmFwc2hvdC5waGFzZSAhPT0gXCJyZWFkeVwiKSByZXR1cm47XG4gICAgICBpZiAoc25hcHNob3QuYnlJZFt0YXJnZXRTZXNzaW9uSWRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKCFjYW5jZWxsZWQpIHNldE1lc3NhZ2UodChcInNlc3Npb25NaXNzaW5nXCIpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKCFvcGVuZWQpIHtcbiAgICAgICAgb3BlbmVkID0gdHJ1ZTtcbiAgICAgICAgc2Vzc2lvbnMub3Blbih0YXJnZXRTZXNzaW9uSWQpO1xuICAgICAgfVxuICAgICAgaWYgKCFjYW5jZWxsZWQpIHNldE1lc3NhZ2UobnVsbCk7XG4gICAgfTtcbiAgICB1bnN1YnNjcmliZSA9IHNlc3Npb25zLmxpc3Quc3Vic2NyaWJlKHJlY29uY2lsZSk7XG4gICAgcmVjb25jaWxlKCk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGNhbmNlbGxlZCA9IHRydWU7XG4gICAgICB1bnN1YnNjcmliZT8uKCk7XG4gICAgfTtcbiAgfSwgW3Nlc3Npb25zLCB0XSk7XG4gIGlmIChtZXNzYWdlID09PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIGpzeChcImRpdlwiLCB7IHJvbGU6IFwiYWxlcnRcIiwgc3R5bGU6IGNzcy5ub3RpY2UsIGNoaWxkcmVuOiBtZXNzYWdlIH0pO1xufVxuXG5jb25zdCBkaWN0aW9uYXJpZXMgPSB7XG4gIHpoOiB7XG4gICAgc2Vzc2lvbk1pc3Npbmc6IFwiXHU3NkVFXHU2ODA3XHU0RjFBXHU4QkREXHU0RTBEXHU1QjU4XHU1NzI4XHVGRjBDXHU2NUUwXHU2Q0Q1XHU2MjUzXHU1RjAwXHUzMDAyXCIsXG4gICAgb3BlbkZhaWxlZDogXCJcdTU3MjhcdTY1QjBcdTdBOTdcdTUzRTNcdTYyNTNcdTVGMDBcdTU5MzFcdThEMjVcdUZGMUFcIlxuICB9LFxuICBlbjoge1xuICAgIHNlc3Npb25NaXNzaW5nOiBcIlRoZSB0YXJnZXQgc2Vzc2lvbiBubyBsb25nZXIgZXhpc3RzLlwiLFxuICAgIG9wZW5GYWlsZWQ6IFwiT3BlbiBpbiBuZXcgd2luZG93IGZhaWxlZDogXCJcbiAgfVxufTtcblxuLyoqXG4gKiBSb3V0ZSB0aGUgb2ZmaWNpYWwgXCJvcGVuIGluIG5ldyB3aW5kb3dcIiBicm93c2VyIGZhbGxiYWNrXG4gKiAoYHdpbmRvdy5vcGVuKGxvY2F0aW9uLm9yaWdpbiArIFwiLz9kc2gtc2Vzc2lvbj1cIiArIGlkKWApIHRvIHRoZSBuYXRpdmVcbiAqIHNlc3Npb24td2luZG93IFBPU1QgaW5zdGVhZCwgc28gdGhlIERlc2t0b3AgbmV2ZXIgb3BlbnMgYSBicm9rZW4gYnJvd3NlciB0YWI6XG4gKiB0aGF0IGZhbGxiYWNrIFVSTCBkcm9wcyBkc2gtZGVza3RvcC1tb2RlIGFuZCBmYWlscyB0byBib290IHRoZSBkZXNrdG9wIGNsaWVudC5cbiAqIE9ubHkgYXBwbGllcyBpbiBkZXNrdG9wIHdpbmRvd3M7IHRoZSB3ZWIgcHJvZmlsZSBrZWVwcyBub3JtYWwgd2luZG93Lm9wZW4uXG4gKiBAcmV0dXJucyBhIGRpc3Bvc2VyIHJlc3RvcmluZyB0aGUgb3JpZ2luYWwgd2luZG93Lm9wZW4uXG4gKi9cbmZ1bmN0aW9uIGluc3RhbGxOYXRpdmVXaW5kb3dPcGVuSW50ZXJjZXB0KCkge1xuICBpZiAoIWlzRGVza3RvcFdpbmRvdykgcmV0dXJuICgpID0+IHt9O1xuICBjb25zdCBuYXRpdmVPcGVuID0gd2luZG93Lm9wZW4uYmluZCh3aW5kb3cpO1xuICB3aW5kb3cub3BlbiA9ICh1cmwsIHRhcmdldCwgZmVhdHVyZXMpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcGFyc2VkID0gbmV3IFVSTChTdHJpbmcodXJsKSwgd2luZG93LmxvY2F0aW9uLmhyZWYpO1xuICAgICAgY29uc3Qgc2Vzc2lvbklkID0gcGFyc2VkLnNlYXJjaFBhcmFtcy5nZXQoXCJkc2gtc2Vzc2lvblwiKTtcbiAgICAgIGlmIChwYXJzZWQub3JpZ2luID09PSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICYmIHNlc3Npb25JZCAhPT0gbnVsbCkge1xuICAgICAgICBmZXRjaChcIi9zZXNzaW9uLW1hbmFnZXIvd2luZG93XCIsIHtcbiAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgIGhlYWRlcnM6IHsgXCJjb250ZW50LXR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSxcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHNlc3Npb25JZCB9KVxuICAgICAgICB9KS50aGVuKChyKSA9PiByLmpzb24oKSkudGhlbigoYikgPT4ge1xuICAgICAgICAgIGlmICghYi5vaykgd2luZG93LmFsZXJ0KGBcdTU3MjhcdTY1QjBcdTdBOTdcdTUzRTNcdTYyNTNcdTVGMDBcdTU5MzFcdThEMjVcdUZGMUEke2IuZXJyb3IgfHwgXCJ1bmtub3duIGVycm9yXCJ9YCk7XG4gICAgICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgIHdpbmRvdy5hbGVydChgXHU1NzI4XHU2NUIwXHU3QTk3XHU1M0UzXHU2MjUzXHU1RjAwXHU1OTMxXHU4RDI1XHVGRjFBJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIE5vdCBhIHNhbWUtb3JpZ2luIGRzaC1zZXNzaW9uIFVSTDsgZmFsbCB0aHJvdWdoIHRvIHRoZSBvcmlnaW5hbC5cbiAgICB9XG4gICAgcmV0dXJuIG5hdGl2ZU9wZW4odXJsLCB0YXJnZXQsIGZlYXR1cmVzKTtcbiAgfTtcbiAgcmV0dXJuICgpID0+IHtcbiAgICB3aW5kb3cub3BlbiA9IG5hdGl2ZU9wZW47XG4gIH07XG59XG5cbmNvbnN0IGluamVjdCA9IFtcImxvY2FsZVwiLCBcInNsb3RzXCIsIFwic2Vzc2lvbnNcIl07XG5cbmZ1bmN0aW9uIGFwcGx5KGN0eCkge1xuICBjdHguZWZmZWN0KCgpID0+IGN0eC5sb2NhbGUucmVnaXN0ZXIoTlMsIGRpY3Rpb25hcmllcyksIFwibmF0aXZlLXNlc3Npb24td2luZG93OiBkaWN0aW9uYXJpZXNcIik7XG4gIGN0eC5lZmZlY3QoKCkgPT4gaW5zdGFsbFdpbmRvd0RyYWdSZWdpb24oKSwgXCJuYXRpdmUtc2Vzc2lvbi13aW5kb3c6IGRyYWcgcmVnaW9uXCIpO1xuICBjdHguZWZmZWN0KCgpID0+IGluc3RhbGxOYXRpdmVXaW5kb3dPcGVuSW50ZXJjZXB0KCksIFwibmF0aXZlLXNlc3Npb24td2luZG93OiB3aW5kb3cub3BlbiBpbnRlcmNlcHRcIik7XG4gIGNvbnN0IHQgPSBjdHgubG9jYWxlLmJpbmQoTlMpO1xuICBjdHguc2xvdHMuaW5qZWN0KFwic2hlbGwub3ZlcmxheVwiLCAoKSA9PiBjdHguc2xvdHMucmVnaXN0ZXIoe1xuICAgIG5hbWU6IFwic2hlbGwub3ZlcmxheVwiLFxuICAgIGlkOiBcIm5hdGl2ZS1zZXNzaW9uLXdpbmRvdy1ub3RpY2VcIixcbiAgICBsb2NhbGU6IE5TLFxuICAgIGluamVjdDogKCkgPT4gKHsgc2Vzc2lvbnM6IGN0eC5zZXNzaW9ucyB9KVxuICB9LCBUYXJnZXRTZXNzaW9uTm90aWNlKSk7XG59XG5cbmV4cG9ydCB7IGFwcGx5LCBpbmplY3QgfTtcbiJd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

		return module.exports;
	}
});
//# sourceMappingURL=client.js.map
