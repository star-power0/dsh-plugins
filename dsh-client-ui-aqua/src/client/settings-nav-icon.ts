/** Mark Aqua's settings row so the shell's fallback gear can be replaced. */
export const AQUA_SETTINGS_NAV_MARKER = 'data-dsh-aqua-settings-nav'

/**
 * Replace the generic settings icon for Aqua's own localized row.
 * @param label - Current locale-aware section label.
 * @returns Disposer for HMR and plugin teardown.
 */
export function registerAquaSettingsNavIcon(label: () => string): () => void {
  let disposed = false

  const sync = (): void => {
    if (disposed) return
    const currentLabel = label().trim()
    const buttons = document.querySelectorAll<HTMLButtonElement>('[role="dialog"] nav button')
    for (const button of buttons) {
      const matches = currentLabel.length > 0 && button.textContent?.trim() === currentLabel
      if (matches) button.setAttribute(AQUA_SETTINGS_NAV_MARKER, '')
      else button.removeAttribute(AQUA_SETTINGS_NAV_MARKER)
    }
  }

  sync()
  const observer = new MutationObserver(sync)
  observer.observe(document.body, { childList: true, subtree: true, characterData: true })

  return () => {
    disposed = true
    observer.disconnect()
    document.querySelectorAll(`[${AQUA_SETTINGS_NAV_MARKER}]`)
      .forEach(element => { element.removeAttribute(AQUA_SETTINGS_NAV_MARKER) })
  }
}
