window.__ModuleLoader__.load({
  id: "dsh-workspace-picker",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    let react = require("react");

    // dsh-workspace-picker — client half.
    //
    // Desktop forces the official `browse` directory picker on Windows (see
    // the desktop profile generator), which cannot enumerate other drives
    // without typing a path. This plugin registers a higher-priority occupant
    // into both workspace directory-flow holes. On Windows it calls the
    // marketplace plugin's proven PowerShell `FolderBrowserDialog` RPC, which
    // opens the real system folder dialog (drive list included) without going
    // through the Electron-hosted native worker that the desktop profile
    // deliberately avoids. If the marketplace RPC is unavailable or fails, the
    // occupant removes itself so the official browse picker becomes visible
    // again as a usable fallback.

    const HOLE_HERO = "conversation.hero.workspace.directoryFlow";
    const HOLE_SIDEBAR = "sidebar.workspaces.directoryFlow";
    // Official browse/native occupants register at default priority 0; a lower
    // priority renders first in a single-kind slot, so this shadows them.
    const PRIORITY = -100;

    // The marketplace client wraps every RPC result twice
    // ({ ok, value: { ok, value } }); unwrap both layers.
    function unwrap(result) {
      if (!result.ok) throw new Error(result.error.message);
      return result.value;
    }
    function unwrapMarketplace(result) {
      return unwrap(unwrap(result));
    }

    /**
     * Renderless flow occupant: each rising `open` edge runs exactly one pick
     * and reports exactly one outcome (the same arming discipline the official
     * native flow uses, so re-renders while `busy` never launch a second
     * chooser). A picked path resolves via onPicked, a cancel via onCancel, and
     * a failure reports onError and retires this occupant so the official
     * browse picker takes over on the next open.
     */
    function WorkspaceNativeFlow(props) {
      const { open, pick, deactivate } = props;
      const armed = react.useRef(false);
      const outcome = react.useRef(props);
      outcome.current = props;
      const alive = react.useRef(true);
      react.useEffect(() => {
        alive.current = true;
        return () => {
          alive.current = false;
        };
      }, []);
      react.useEffect(() => {
        if (!open) {
          armed.current = false;
          return;
        }
        if (armed.current) return;
        armed.current = true;
        pick().then((path) => {
          if (!alive.current) return;
          if (path === null || path === undefined) outcome.current.onCancel();
          else outcome.current.onPicked(path);
        }, (reason) => {
          if (!alive.current) return;
          const message = reason instanceof Error ? reason.message : String(reason);
          // Surface the error through the owner's error modal, then retire our
          // occupant so the official browse picker (priority 0) becomes the
          // visible fallback on the next open.
          outcome.current.onError(message);
          try {
            deactivate();
          } catch (error) {
            // Deactivation is best-effort; the owner error modal already showed.
          }
        });
      }, [open, pick, deactivate]);
      return null;
    }

    /**
     * Client plugin body: once the marketplace remote is available, register
     * the renderless native flow into both directory-flow holes through
     * `slots.inject()` because the ui-workspace entries may activate later.
     * If the marketplace remote never appears (plugin disabled), the inject
     * never resolves and the official browse picker simply stays in place.
     */
    function apply(ctx) {
      ctx.inject(["slots", "remote", "remote.marketplace"], (scope) => {
        const disposers = [];
        const deactivate = () => {
          while (disposers.length > 0) {
            const dispose = disposers.pop();
            dispose?.();
          }
        };
        const injected = () => ({
          pick: async () => {
            const picked = unwrapMarketplace(await scope.remote.marketplace.pickDirectory());
            return picked.path;
          },
          deactivate,
        });
        const registerBoth = function* () {
          disposers.push(scope.slots.register({
            name: HOLE_HERO,
            priority: PRIORITY,
            inject: injected,
          }, WorkspaceNativeFlow));
          yield disposers[disposers.length - 1];
          disposers.push(scope.slots.register({
            name: HOLE_SIDEBAR,
            priority: PRIORITY,
            inject: injected,
          }, WorkspaceNativeFlow));
          yield disposers[disposers.length - 1];
        };
        scope.slots.inject(HOLE_HERO, () => scope.slots.inject(HOLE_SIDEBAR, registerBoth));
      });
    }

    exports.apply = apply;
    return module.exports;
  }
});
