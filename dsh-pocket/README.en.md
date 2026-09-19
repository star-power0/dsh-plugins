# dsh-pocket · Locally customized copy

> **Source & license**: upstream [shaobeichen/dsh-pocket](https://github.com/shaobeichen/dsh-pocket)
> (**GPL-2.0**; upstream copyright and the full license text are kept in this directory's `LICENSE`).
> Installed here from the npm tarball `dsh-pocket@2.10.6` via npmmirror (**not a git clone**),
> and iterated locally since. An upstream upgrade overwrites the local changes — re-apply steps
> are in [LOCAL.md](./LOCAL.md) §3 (Chinese).

**The authoritative list of every local change lives in [LOCAL.md](./LOCAL.md)** (Chinese): change
table (ID / file / effect scope / whether an upstream upgrade overwrites it), the mobile
narrow-screen breakdown, re-apply steps for upstream upgrades, and a trap list. Code carries
`[DSH-LOCAL:<id>]` markers — `grep -rn "DSH-LOCAL:" client/ lib/` finds them all.

## Local modifications

| ID | File | Effect |
|---|---|---|
| `settings-ui` | `client/index.jsx`, `client/pocket-locales.js` (+ rebuilt `client/client.js`) | Settings "Mobile access": smartphone sidebar icon; WAN block reworked into a fixed-domain card with a "rotate password" action; LAN QR collapsed by default |
| `desktop-env-patch` | `lib/index.js` (wires `desktopEnvPatchScript` from `lib/proxy.mjs`) | When a phone/external browser hits the Desktop host, the earliest `<head>` injection supplies `dsh-desktop-mode/platform`, so the older `dsh-plugin-desktop` no longer throws and blanks the page (**removable once DSH Desktop ≥ 2.0.3**) |
| `mobile-layout` | `client/mobile/mobile.css.ts` + `mobile-apply.tsx` | All mobile narrow-screen visual fixes: hidden entries, opaque drawer/composer/popups, visible code blocks, wallpaper engine disabled, hero layout, stats row, file guard |
| `boot-cleanup` | `BOOT_CLEANUP_CSS` in `lib/proxy.mjs` | First-injection page cleanup: hide the wallpaper layer and restore the conversation column on narrow screens, covering the 0.5–1 s gap before the plugin starts (**host-level; restart the host after editing**) |
| `apk-shell` | `apk/` (subdirectory of this plugin) | Phone APK shell; `build.ps1` builds it in one step |

Key mobile fixes (full table in LOCAL.md §2):

- **Wallpaper engine disabled**: restore the theme variables it overwrote (purple `#8268c4` →
  official blue `#3964fe`, transparency → solid) and have the observer remove its DOM plus the
  `data-we-wallpaper` attribute.
- **Glass-token leak fixed**: the engine pins seven glass tokens inline on `<body>` with
  `!important`, tinting every element that reads them by inheritance (the model popup used to be
  55% see-through with chat text bleeding through). Fix: declare the official solid values on the
  consumers themselves (`body *`) — a declaration on the element beats an inherited value.
- **Official popup family covered as a group**: all six `_19372_` container variants
  (`_list_` / `_submenu_` / `_sideTop_` / `_portal_` / `_compactList_` / `_denseList_`) get solid
  fills on narrow screens, so fixing "only the one you saw" can never miss the rest again.
- **Opaque code blocks / drawer / composer**, `dsh-ide-layout` fully withdrawn with `centerCol`
  restored, `msg-nav` rail hidden, official right-hand details column hidden.

> Historical trap: `lib/proxy.mjs` once referenced `BOOT_CLEANUP_CSS` before its `const`
> declaration, tripping a TDZ error that killed the host on startup (both Web and Desktop refused
> to open). After any host-level edit, run `node --check` plus a real startup probe — see LOCAL.md §4.

## Upstream capabilities (in use here)

- **LAN access**: Settings → "Mobile access" → LAN QR; scan from a phone on the same Wi-Fi
  (the LAN IP is auto-detected; in WSL it picks the Windows physical adapter IP). One-click toggle.
- **WAN access**: this machine uses a **cloudflared named tunnel** (`pocket.starroute.me` →
  `http://127.0.0.1:3081`) and does **not** enable the built-in quick tunnel; the WAN host is
  fail-closed and always requires a password.
- **Auth**: separate 8-character LAN/WAN passwords, customizable to a fixed value; the login
  session is bound to the dsh web process, so a restart requires re-entry.
- **Live sync**: full WebSocket passthrough (computer streams, phone scrolls along), with keepalive
  and automatic reconnect.
- **Transfer compression**: large JSON responses are gzip/brotli compressed.

## Local registration (manual, never in the bundles stack)

Both the Web and Desktop profiles point `link:` at this plugin directory, and each
`cordis.patch.yml` registers one `dsh-pocket` insert (`config.port: 3081`).
**Never write it into `dsh.profile.bundles`** — a bundles-stack entry plus a manual insert makes
the loader emit `duplicate loader entry id` and the host refuses to start.

Runtime deps `qrcode` / `qrcode-terminal` are resolved in-place with `pnpm install --prod`.

## How changes take effect

- **Page-level** (`client/**` CSS / observer): run `node client/build.mjs`, then refresh the phone
  or reopen the app.
- **Host-level** (`lib/index.js` / `lib/proxy.mjs`): **restart DSH Desktop**.

## Development

```sh
node client/build.mjs      # client/index.jsx → client/client.js
node $DSH_HOME/plugin-tools/plugin-safety.mjs check    # registration health check
```

## License

GPL-2.0 (inherited from upstream). The upstream license text is in this directory's `LICENSE`;
local modifications are released under GPL-2.0 as well.

## Credits

- [shaobeichen/dsh-pocket](https://github.com/shaobeichen/dsh-pocket) — upstream project
- [mexiaosqwq/dsh-web-mobile](https://github.com/mexiaosqwq/dsh-web-mobile) (MIT) — source of the
  mobile adaptation (see `client/mobile/LICENSE.dsh-web-mobile`)
