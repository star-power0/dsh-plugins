/**
 * Mapping from the runtime theme section (settings scope) onto a normalized
 * CustomThemeConfig. Pure and testable: the section carries the settings
 * document's resolved values (user overrides layered over the loader base);
 * fields absent while loading/unavailable fall back to the loader config.
 */
import {
  isCornerRadius, isFocusGlow, isSurfaceShadow, isWallpaperTone, resolveGlass,
  type CustomThemeConfig, type GlassLevel,
} from './config.ts'
import type { ThemeSection } from '../shared.ts'

const GLASS_LEVELS: readonly string[] = ['off', 'light', 'frosted', 'mica']

const isGlassLevel = (value: unknown): value is GlassLevel =>
  typeof value === 'string' && GLASS_LEVELS.includes(value)

/**
 * Merge a theme section over the normalized loader config.
 * @param normalized - the loader-layer normalized config (fallback).
 * @param section - the settings scope's resolved theme section.
 * @returns the effective config the applier should render.
 */
export function configFromThemeSection(
  normalized: CustomThemeConfig,
  section: ThemeSection | undefined,
): CustomThemeConfig {
  if (section === undefined) return normalized
  // darkSurfaceOpacity is the only optional CustomThemeConfig field; spread it
  // out so an explicit undefined never lands on an optional property
  // (exactOptionalPropertyTypes).
  const { darkSurfaceOpacity, ...rest } = normalized
  // String knobs treat an empty section value as "no override" (falls back to
  // the loader layer): clearing wallpaper in the settings form must revert to
  // the loader wallpaper, never silently disable the whole theme.
  const stringField = (value: string | undefined, fallback: string): string =>
    value !== undefined && value !== '' ? value : fallback
  const glass = isGlassLevel(section.glass) ? section.glass : normalized.glass
  // The settings page edits `glass`, not the derived `wallpaperBlur` field.
  // Re-resolve the radius when the runtime level differs from the loader-level
  // normalized value; this makes off/light/frosted/mica actually control blur.
  // An explicit loader wallpaperBlur remains respected until the user changes
  // the glass level in the settings scope.
  const wallpaperBlur = glass === normalized.glass
    ? normalized.wallpaperBlur
    : resolveGlass({ glass }).blur
  return {
    ...rest,
    // The dark main surface defaults to the LIVE surfaceOpacity: absent an
    // explicit darkSurfaceOpacity override (see index.ts applyTheme dropping
    // it when the raw user layer does not carry it), dragging 表面不透明度
    // moves the dark background too.
    darkSurfaceOpacity: section.darkSurfaceOpacity ?? section.surfaceOpacity ?? darkSurfaceOpacity ?? 100,
    wallpaperBlur,
    wallpaper: stringField(section.wallpaper, normalized.wallpaper),
    glass,
    accent: stringField(section.accent, normalized.accent),
    autoAccent: section.autoAccent ?? normalized.autoAccent,
    surfaceOpacity: section.surfaceOpacity ?? normalized.surfaceOpacity,
    sidebarOpacity: section.sidebarOpacity ?? normalized.sidebarOpacity,
    inputOpacity: section.inputOpacity ?? normalized.inputOpacity,
    codeBlockOpacity: section.codeBlockOpacity ?? normalized.codeBlockOpacity,
    gradient: stringField(section.gradient, normalized.gradient),
    darkScrim: section.darkScrim ?? normalized.darkScrim,
    fontFamily: stringField(section.fontFamily, normalized.fontFamily),
    codeFontFamily: stringField(section.codeFontFamily, normalized.codeFontFamily),
    fontScale: section.fontScale ?? normalized.fontScale,
    scrollbarAccent: section.scrollbarAccent ?? normalized.scrollbarAccent,
    vignette: section.vignette ?? normalized.vignette,
    // Opt-in refinement knobs: invalid/absent section values fall back to the
    // loader layer (whose neutral 'inherit' keeps the stock look).
    cornerRadius: isCornerRadius(section.cornerRadius) ? section.cornerRadius : normalized.cornerRadius,
    surfaceShadow: isSurfaceShadow(section.surfaceShadow) ? section.surfaceShadow : normalized.surfaceShadow,
    focusGlow: isFocusGlow(section.focusGlow) ? section.focusGlow : normalized.focusGlow,
    wallpaperTone: isWallpaperTone(section.wallpaperTone) ? section.wallpaperTone : normalized.wallpaperTone,
    darkAccent: stringField(section.darkAccent, normalized.darkAccent),
    // Text-ink overrides: '' in the section means "no override" and falls back
    // to the loader layer, mirroring the other string knobs.
    inkPrimary: stringField(section.inkPrimary, normalized.inkPrimary),
    inkSecondary: stringField(section.inkSecondary, normalized.inkSecondary),
    inkTertiary: stringField(section.inkTertiary, normalized.inkTertiary),
    inkCaption: stringField(section.inkCaption, normalized.inkCaption),
    inkDimmed: stringField(section.inkDimmed, normalized.inkDimmed),
    darkInkPrimary: stringField(section.darkInkPrimary, normalized.darkInkPrimary),
    darkInkSecondary: stringField(section.darkInkSecondary, normalized.darkInkSecondary),
    darkInkTertiary: stringField(section.darkInkTertiary, normalized.darkInkTertiary),
    darkInkCaption: stringField(section.darkInkCaption, normalized.darkInkCaption),
    darkInkDimmed: stringField(section.darkInkDimmed, normalized.darkInkDimmed),
  }
}
