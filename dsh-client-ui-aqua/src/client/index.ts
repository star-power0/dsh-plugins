/**
 * Aqua client plugin body: the toggleable glassmorphism skin. Owns the durable
 * enable flag (localStorage), applies/retracts the theme layer through
 * {@link AquaLayer}, and registers the full glass control surface into its own
 * settings section (`settings.section`):
 * One click on the master switch returns the stock UI (every layer is an
 * effect, disposed on flip).
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { BoundActions } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the `settings.section` SlotMap merge.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { AquaSettingsPage, type AquaSettingsPageInjected } from './AquaSettingsPage.tsx'
import { createAquaRowStore, type AquaSettingsPayload } from './settings-store.ts'
import { en, NS, zh } from './locales.ts'
import { AquaLayer, flushHostSync, scheduleBaselineSync, seedFromHost } from './theme-layer.ts'
import { registerAquaSettingsNavIcon } from './settings-nav-icon.ts'
// Side-effect imports: the theme-layer stylesheet (unloaded with the plugin),
// the custom Aqua settings glyph, and the self-hosted Space Grotesk @font-face.
import './aqua.module.css'
import './settings-nav-icon.module.css'
import './fonts.module.css'

/** Required services: theme override stack plus the settings section. */
export const inject = ['theme', 'slots', 'locale']

// Host-backed state seed (see theme-layer.ts): must run at module evaluation,
// BEFORE the runtime calls apply() and the layer constructor reads
// localStorage, so the very first mount already uses the persisted state.
// When the host has no state file yet, migrate this origin's localStorage up
// — but only if it actually carries state (scheduleBaselineSync), so a fresh
// profile cannot seed the store with empty defaults. The pagehide flush
// covers "flip the switch and close".
const seededFromHost = seedFromHost()
if (!seededFromHost) scheduleBaselineSync()
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('pagehide', flushHostSync)
}

/**
 * Client plugin body.
 * @param ctx - client cordis context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-aqua: settings dictionaries')

  // The layer owns its lifecycle: enable flag, token stack, and CSS attribute
  // are all effects released on disable/dispose.
  const layer = new AquaLayer(ctx)

  // The settings page owns the master switch and all appearance controls.
  const appearanceStore = createAquaRowStore()
  let appearanceBound: BoundActions<typeof appearanceStore> | undefined
  let revision = 0
  const payload = (): AquaSettingsPayload => {
    const s = layer.getSettings()
    return {
      enabled: layer.getEnabled(),
      mode: s.mode,
      blur: s.blur,
      frost: s.frost,
      fluidHue: s.fluidHue,
      fluidDepth: s.fluidDepth,
      bgBrightness: s.bgBrightness,
      dark: layer.getDark(),
      background: s.background,
      wallpaper: s.wallpaper,
      whale: s.whale,
      critters: s.critters,
      mesh: s.mesh,
      spotlight: s.spotlight,
      press: s.press,
      wallpaperBlur: s.wallpaperBlur,
      wallpaperFrost: s.wallpaperFrost,
      videoBlur: s.videoBlur,
      videoBrightness: s.videoBrightness,
    }
  }
  const sync = (): void => {
    const next = payload()
    appearanceBound?.sync(next, revision)
    revision += 1
  }
  // The Appearance switch flips the brightness knob's half-range; re-sync
  // the settings page so the row re-renders with the new range.
  ctx.effect(() => ctx.on('theme/change', () => { sync() }), 'ui-aqua: appearance scheme sync')

  const appearanceInjected = (actions: BoundActions<typeof appearanceStore>): AquaSettingsPageInjected => {
    appearanceBound = actions
    sync()
    return {
      setEnabled: (enabled) => {
        layer.setEnabled(enabled)
        sync()
      },
      setMode: (mode) => {
        layer.setMode(mode)
        sync()
      },
      setBlur: (blur) => {
        layer.setBlur(blur)
        sync()
      },
      setFrost: (frost) => {
        layer.setFrost(frost)
        sync()
      },
      setFluidHue: (fluidHue) => {
        layer.setFluidHue(fluidHue)
        sync()
      },
      setFluidDepth: (fluidDepth) => {
        layer.setFluidDepth(fluidDepth)
        sync()
      },
      setBgBrightness: (bgBrightness) => {
        layer.setBgBrightness(bgBrightness)
        sync()
      },
      setBackground: (background) => {
        layer.setBackground(background)
        sync()
      },
      setWallpaper: (wallpaper) => {
        layer.setWallpaper(wallpaper)
        sync()
      },
      setWhale: (whale) => {
        layer.setWhale(whale)
        sync()
      },
      setCritters: (critters) => {
        layer.setCritters(critters)
        sync()
      },
      setMesh: (mesh) => {
        layer.setMesh(mesh)
        sync()
      },
      setSpotlight: (spotlight) => {
        layer.setSpotlight(spotlight)
        sync()
      },
      setPress: (press) => {
        layer.setPress(press)
        sync()
      },
      setWallpaperBlur: (wallpaperBlur) => {
        layer.setWallpaperBlur(wallpaperBlur)
        sync()
      },
      setWallpaperFrost: (wallpaperFrost) => {
        layer.setWallpaperFrost(wallpaperFrost)
        sync()
      },
      setVideoBlur: (videoBlur) => {
        layer.setVideoBlur(videoBlur)
        sync()
      },
      setVideoBrightness: (videoBrightness) => {
        layer.setVideoBrightness(videoBrightness)
        sync()
      },
      authorizeVideo: () => {
        layer.authorizeVideo()
      },
    }
  }

  // Own sidebar settings page: hero + master switch + every glass knob.
  // (Moved out of the General section — the full control surface deserves a
  // dedicated section like wallpaper-engine.)
  const t = ctx.locale.bind(NS)
  ctx.effect(
    () => registerAquaSettingsNavIcon(() => t('aqua.title')),
    'ui-aqua: settings navigation icon',
  )
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'aqua',
    order: 105,
    label: () => t('aqua.title'),
    store: appearanceStore,
    locale: NS,
    inject: appearanceInjected,
  }, AquaSettingsPage))
}
