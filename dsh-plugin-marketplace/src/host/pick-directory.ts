/** Electron-safe single-directory chooser for the marketplace Host.
 *  The official native picker spawns its Win32 worker with
 *  `process.execPath`, which under the DSH Desktop (Electron) host is the
 *  Electron executable and can never run the worker as plain Node — the
 *  dialog would never open. This module replaces that path on win32 with a
 *  plain `powershell.exe` + FolderBrowserDialog invocation (STA, base64
 *  encoded output so CJK paths survive), and falls back to the official
 *  native capability on other platforms where the choosers are external
 *  commands (osascript / zenity / kdialog) unaffected by execPath.
 */

import { spawn } from 'node:child_process'

/** Structural view of the Host `ctx.directoryPicker` capability union.
 *  The official package's .d.ts is not shipped to Desktop, so this module
 *  only relies on the runtime shape: kind + (for native) pick().
 */
export interface DirectoryPickerCapability {
  kind: string
  pick?: (signal: AbortSignal) => Promise<string | null>
}

/** FolderBrowserDialog script; the selected path is emitted as UTF-8 base64. */
export function windowsFolderDialogScript(): string {
  return [
    'Add-Type -AssemblyName System.Windows.Forms',
    '$d = New-Object System.Windows.Forms.FolderBrowserDialog',
    "$d.Description = 'Select Workspace Directory'",
    '$d.ShowNewFolderButton = $true',
    'if ($d.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK -and $d.SelectedPath) {',
    '  [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($d.SelectedPath))',
    '}',
  ].join('\n')
}

export interface PickDirectoryInternals {
  platform?: NodeJS.Platform
  spawner?: typeof spawn
}

/** Open a Windows folder dialog through powershell.exe; null on cancel. */
export async function pickWindowsDirectory(
  signal: AbortSignal,
  internals: PickDirectoryInternals = {},
): Promise<string | null> {
  const spawner = internals.spawner ?? spawn
  return await new Promise<string | null>((resolve, reject) => {
    const child = spawner('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-STA',
      '-Command',
      windowsFolderDialogScript(),
    ], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    let settled = false
    child.stdout?.on('data', (chunk: Buffer) => { stdout += chunk.toString('utf8') })
    child.stderr?.on('data', (chunk: Buffer) => { stderr += chunk.toString('utf8') })
    const onAbort = (): void => { child.kill() }
    signal.addEventListener('abort', onAbort, { once: true })
    const finish = (outcome: () => void): void => {
      if (settled) return
      settled = true
      signal.removeEventListener('abort', onAbort)
      outcome()
    }
    child.on('error', (error) => {
      finish(() => reject(error))
    })
    child.on('close', (code) => {
      finish(() => {
        if (signal.aborted) {
          reject(new Error('native directory picker aborted'))
          return
        }
        if (code !== 0) {
          reject(new Error('win32 folder dialog failed: ' + (stderr.trim() !== '' ? stderr.trim() : 'exit code ' + code)))
          return
        }
        const encoded = stdout.trim()
        resolve(encoded === '' ? null : Buffer.from(encoded, 'base64').toString('utf8'))
      })
    })
  })
}

/** Pick a directory on the current platform; null when the user cancels. */
export async function pickDirectoryPath(
  capability: DirectoryPickerCapability | undefined,
  signal: AbortSignal,
  internals: PickDirectoryInternals = {},
): Promise<string | null> {
  const platform = internals.platform ?? process.platform
  if (platform === 'win32') return await pickWindowsDirectory(signal, internals)
  if (capability !== undefined && capability.kind === 'native' && capability.pick !== undefined) {
    return await capability.pick(signal)
  }
  throw new Error('host.pickDirectory needs the native capability; no native chooser is available on ' + platform)
}
