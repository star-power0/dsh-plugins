/**
 * Aqua settings page registered into the settings sidebar (`settings.section`):
 * a hero header with the master on/off switch, then every glass knob.
 */
import { IconCheckOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the `settings.section` SlotMap merge.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { AquaAppearanceRow, type AquaAppearanceRowInjected } from './AquaAppearanceRow.tsx'
import type { createAquaRowStore } from './settings-store.ts'
import css from './AquaSettingsPage.module.css'

/** Injected business face: every knob write plus the master switch. */
export interface AquaSettingsPageInjected extends AquaAppearanceRowInjected {
  /** Switch the glass layer on or off. */
  setEnabled: (enabled: boolean) => void
}

/** Full component props: runtime share + store share + locale seat + injected face. */
export type AquaSettingsPageComponentProps =
  PropsRuntime<'settings.section'> & PropsStore<ReturnType<typeof createAquaRowStore>>
  & PropsLocale<'settings.aqua'> & InjectFace<AquaSettingsPageInjected>

/** Glass glyph for the hero header. */
function AquaGlyph({ size = 25 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3c3.6 2.8 6 5.6 6 9a6 6 0 0 1-12 0c0-3.4 2.4-6.2 6-9z" />
      <path d="M9.5 14.5a3 3 0 0 0 3 3" opacity="0.7" />
      <path d="M4 9h2M18 9h2M4 15h2M18 15h2" opacity="0.55" />
    </svg>
  )
}

/**
 * Render the Aqua settings page.
 * @param props - composed slot props.
 * @returns the sidebar settings page.
 */
export function AquaSettingsPage(props: AquaSettingsPageComponentProps) {
  const { t, useStore, setEnabled } = props
  const enabled = useStore(s => s.enabled)
  return (
    <div className={css.page}>
      <header className={css.hero}>
        <div className={css.heroBadge}><AquaGlyph /></div>
        <div>
          <h1 className={css.heroTitle}>{t('aqua.title')}</h1>
          <p className={css.heroLead}>{t('aqua.description')}</p>
        </div>
      </header>

      <div className={css.master}>
        <span className={css.masterLabel}>{t('aqua.title')}</span>
        <button
          type="button"
          className={enabled ? css.toggleOn : css.toggle}
          aria-pressed={enabled}
          aria-label={`${t('aqua.title')}: ${enabled ? t('aqua.enable') : t('aqua.disable')}`}
          onClick={() => { setEnabled(!enabled) }}
        >
          <span className={css.toggleTrack} aria-hidden="true">
            <span className={css.toggleThumb}>
              {enabled && <IconCheckOutline16 />}
            </span>
          </span>
          <span className={css.toggleText}>{enabled ? t('aqua.enable') : t('aqua.disable')}</span>
        </button>
      </div>

      {enabled && <AquaAppearanceRow {...props} />}
    </div>
  )
}
