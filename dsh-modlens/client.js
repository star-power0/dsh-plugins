// Unified client bundle for the ModLens engine and image guard.
// The private factories stay isolated, while DSH sees one public module ID.
window.__ModuleLoader__.load({
  id: 'dsh-modlens',
  factory: (require) => {
    const engine = (() => {
      var module = { exports: {} }
      var exports = module.exports
          var module = { exports: {} }
          var exports = module.exports
      
          function imageFilesOf(event) {
            var items = event.clipboardData?.items
            if (!items) return []
            var files = []
            for (var i = 0; i < items.length; i++) {
              var item = items[i]
              if (item.kind !== 'file') continue
              var file = item.getAsFile()
              if (file && /^image\//.test(file.type)) files.push(file)
            }
            return files
          }
      
          function insertText(target, text) {
            var el = target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') ? target : document.activeElement
            if (!el || (el.tagName !== 'TEXTAREA' && el.tagName !== 'INPUT')) return
            el.focus()
            // execCommand fires the input event React's controlled textarea needs;
            // the prototype-setter dance is the fallback for engines dropping it.
            var inserted = false
            try {
              inserted = document.execCommand('insertText', false, text)
            } catch {
              inserted = false
            }
            if (!inserted) {
              var proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype
              var setter = Object.getOwnPropertyDescriptor(proto, 'value').set
              setter.call(el, el.value + text)
              el.dispatchEvent(new Event('input', { bubbles: true }))
            }
          }
      
          function uploadOne(file) {
            return file.arrayBuffer().then((buffer) =>
              fetch('/modlens/paste', { method: 'POST', body: buffer }).then((res) => {
                if (!res.ok) {
                  return res
                    .json()
                    .catch(() => ({}))
                    .then((body) => {
                      var error = new Error(body.error || `paste upload failed (${res.status})`)
                      error.status = res.status
                      throw error
                    })
                }
                return res.json()
              }),
            )
          }
      
          function currentModelLabel() {
            var buttons = document.querySelectorAll('button[aria-label]')
            for (var i = 0; i < buttons.length; i++) {
              var label = buttons[i].getAttribute('aria-label') || ''
              if (/选择模型|select model|current model/i.test(label)) return label
            }
            return ''
          }
      
          // Whether to take a paste over is the HOST's call (GET /modlens/paste
          // with the selector label; the host resolves it against real model
          // metadata). A name regex here once declared every vision model it did
          // not recognize text-only and hijacked its native paste. The verdict is
          // cached per label and refreshed in the background; until a label has a
          // cached `true`, pastes stay native — the safe direction for both a
          // vision model (keeps its thumbnail) and a text-only one (keeps only its
          // old error message, once). A 404 means the route is off (pasteToPath:
          // false, or no host half), so the client stands down entirely instead of
          // swallowing pastes into a dead endpoint.
          var routeAvailable = true
          var verdicts = {}
          // A verdict older than this is UNKNOWN again, even while a refresh is in
          // flight: the route's model metadata can change mid-session (discovery
          // sweeps, provider mounts), and acting on a long-stale `true` is exactly
          // the vision-model hijack this design exists to prevent. The bound is a
          // backstop, since every focus and paste re-asks anyway.
          var VERDICT_MAX_AGE_MS = 60000
      
          function refreshVerdict(label) {
            if (!routeAvailable) return
            var cached = verdicts[label]
            // Dedupe only on an in-flight request, never on freshness: the host's
            // model inventory can change under an unchanged label (a same-named
            // route mounting mid-session), so every focus and paste re-asks and a
            // stale answer survives at most one local round-trip.
            if (cached?.pending) return
            var entry = { pending: true, takeover: cached ? cached.takeover : false, at: cached ? cached.at : 0 }
            verdicts[label] = entry
            fetch(`/modlens/paste?model=${encodeURIComponent(label)}`)
              .then((res) => {
                if (res.status === 404) {
                  routeAvailable = false
                  entry.pending = false
                  return null
                }
                if (!res.ok) throw new Error(`policy ${res.status}`)
                return res.json()
              })
              .then((body) => {
                entry.pending = false
                if (body) {
                  entry.takeover = body.takeover === true
                  entry.at = Date.now()
                }
              })
              .catch(() => {
                entry.pending = false
              })
          }
      
          // A paste needs the composer focused first, so a focus-time prefetch has
          // the verdict ready before the first paste can land.
          function onFocusIn() {
            refreshVerdict(currentModelLabel())
          }
      
          function onPaste(event) {
            if (!routeAvailable) return
            var files = imageFilesOf(event)
            if (files.length === 0) return
            var label = currentModelLabel()
            var cached = verdicts[label]
            refreshVerdict(label)
            // No fresh confirmed host verdict: leave the paste native. Wrong only
            // for a text-only model's very first paste, and self-correcting.
            if (!cached || cached.at === 0 || cached.takeover !== true || Date.now() - cached.at > VERDICT_MAX_AGE_MS) return
            // Take the paste before the composer's intake starts an attachment (and
            // with it the host-side image admission a text-only model fails).
            event.preventDefault()
            event.stopImmediatePropagation()
            var target = event.target
            Promise.all(files.map(uploadOne))
              .then((results) => {
                var text = results
                  .map((r) => r.path)
                  .filter(Boolean)
                  .join(' ')
                if (text) insertText(target, `${text} `)
              })
              .catch((error) => {
                // A 404 here means the route vanished AFTER a verdict confirmed it
                // (plugin disposed mid-session): that race can cost this one paste
                // — preventDefault already ran — but never another. Stand down and
                // forget every verdict, so the next paste goes native immediately.
                if (error && error.status === 404) {
                  routeAvailable = false
                  verdicts = {}
                }
                console.error(`[modlens] paste-to-path failed: ${error?.message ? error.message : error}`)
              })
          }
      
          // The settings card (issue #39). dsh renders a fixed set of plugin cards
          // and does not enumerate settings namespaces, so a card is contributed
          // through the `settings.plugin.item` slot rather than by declaring a
          // schema. It reads and writes the host route above, which owns
          // ~/.modlens/config.json: the browser never sees an API key, and never
          // sends a blank one back over a stored key.
          var ENGINES = ['antigravity-cli', 'gemini-api', 'openai', 'anthropic', 'claude-cli']
          var REUSE = ['claude', 'codex', 'opencode', 'pi', 'grok']
      
          // Two short label sets rather than a locale bundle: the card has a dozen
          // strings, and a bundle would be more machinery than the thing it labels.
          var TEXT = {
            en: {
              title: 'Vision engine (ModLens)',
              subtitle: 'Vision engine provider configuration.',
              openConfig: 'Open config file',
              automatic: 'Automatic (failover chain decides)',
              pickToConfigure: 'Pick an engine above to configure its key and endpoint.',
              engine: 'Engine',
              apiKey: 'API key',
              baseUrl: 'Base URL',
              model: 'Model',
              stored: 'stored, leave empty to keep it',
              unset: 'not set',
              fallback: 'provider default',
              save: 'Save',
              saving: 'saving...',
              saved: 'saved',
              loading: 'loading...',
              discard: 'Discard',
              cliNote: 'This engine signs in through its own CLI: no key, no endpoint.',
              autoTitle: 'Auto mode',
              autoHint: 'Reuse the vision engines already on this machine.',
              found: 'found',
              notLoggedIn: 'found, not signed in',
              notFound: 'not on this machine',
              envSourced:
                'These come from environment variables. Saving copies them into the config file, which then becomes this engine’s only source.',
            },
            zh: {
              title: '视觉引擎（ModLens）',
              subtitle: '视觉引擎提供商配置。',
              openConfig: '打开配置文件',
              automatic: '自动（不固定，由故障转移链决定）',
              pickToConfigure: '在上面选一个引擎，才能配置它的密钥和地址。',
              engine: '引擎',
              apiKey: 'API 密钥',
              baseUrl: '接口地址',
              model: '模型',
              stored: '已保存，留空即不改动',
              unset: '未设置',
              fallback: '使用该引擎默认值',
              save: '保存',
              saving: '保存中…',
              saved: '已保存',
              loading: '加载中…',
              discard: '放弃修改',
              cliNote: '该引擎通过自己的 CLI 登录，无需密钥和接口地址。',
              autoTitle: 'auto 模式',
              autoHint: '自动复用本机已有视觉引擎。',
              found: '已找到',
              notLoggedIn: '已找到，未登录',
              notFound: '本机没有',
              envSourced: '这些值来自环境变量。保存会把它们写进配置文件，此后该引擎只认配置文件。',
            },
          }
      
          function labels() {
            var lang = (document.documentElement.lang || navigator.language || 'en').toLowerCase()
            return lang.indexOf('zh') === 0 ? TEXT.zh : TEXT.en
          }
      
          // The next draft when the engine changes or a summary arrives. The three
          // engine fields belong to the newly selected engine; the reuse grants are
          // the user's pending answers and survive an engine switch, since granting
          // codex has nothing to do with which engine reads the images.
          function nextDraft(summary, provider, keepReuse) {
            // provider '' is its own answer: not pinned, the failover chain
            // decides. There is then no single engine whose key belongs in these
            // fields, so they stay empty and the card says how to get them back.
            var engine = summary.engines[provider] || { baseUrl: '', model: '' }
            return {
              provider: provider,
              apiKey: '',
              baseUrl: engine.baseUrl,
              model: engine.model,
              reuse: Object.assign({}, keepReuse || summary.reuse),
            }
          }
      
          // What one save is actually about. The pin travels only when the select
          // moved; the engine fields only when they were edited. A save that always
          // carried both pinned an engine nobody chose and wrote the values the
          // card loaded back over whatever the file holds now.
          function savePayload(summary, draft) {
            var payload = { reuse: {} }
            REUSE.forEach((name) => {
              if (draft.reuse[name] !== summary.reuse[name]) {
                payload.reuse[name] = draft.reuse[name]
              }
            })
            if (draft.provider !== summary.provider) {
              payload.provider = draft.provider
            }
            var pristine = nextDraft(summary, draft.provider, draft.reuse)
            var engineEdited = draft.apiKey !== '' || draft.baseUrl !== pristine.baseUrl || draft.model !== pristine.model
            if (draft.provider !== '' && engineEdited) {
              payload.engine = draft.provider
              payload.apiKey = draft.apiKey
              payload.baseUrl = draft.baseUrl
              payload.model = draft.model
            }
            return payload
          }
      
          function ConfigCard(react, ui) {
            var h = react.createElement
            var Input = ui.Input
      
            // The chrome is the native plugin card's, value for value (border,
            // layer backgrounds, 12px radius, header row with a rotating chevron,
            // footer with discard ghost + save primary), so this card reads as a
            // sibling of the built-in three rather than a lodger.
            var chevron = (open) =>
              h(
                'svg',
                {
                  width: 16,
                  height: 16,
                  viewBox: '0 0 16 16',
                  style: {
                    color: 'var(--dsw-alias-label-tertiary, rgba(127,127,127,0.8))',
                    flex: 'none',
                    transition: 'transform .16s',
                    transform: open ? 'rotate(180deg)' : 'none',
                  },
                },
                h('path', {
                  d: 'M4 6l4 4 4-4',
                  fill: 'none',
                  stroke: 'currentColor',
                  strokeWidth: 1.5,
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                }),
              )
      
            return function ModlensCard() {
              var t = labels()
              var openState = react.useState(false)
              var summaryState = react.useState(null)
              var draftState = react.useState(null)
              var noteState = react.useState('')
              var open = openState[0]
              var summary = summaryState[0]
              var draft = draftState[0]
              var note = noteState[0]
      
              var seed = (next, provider, keepReuse) => nextDraft(next, provider, keepReuse)
      
              var load = react.useCallback(() => {
                // discover: the self-check probing which local harnesses exist to
                // be borrowed. Paid once per expand, cached host-side.
                fetch('/modlens/config?discover=1')
                  .then((r) =>
                    r.json().then((body) => {
                      if (!r.ok) throw new Error(body.error || 'load failed')
                      return body
                    }),
                  )
                  .then((next) => {
                    summaryState[1](next)
                    draftState[1](seed(next, next.provider))
                    noteState[1]('')
                  })
                  .catch((error) => {
                    noteState[1](String(error.message ? error.message : error))
                  })
              }, [])
      
              react.useEffect(() => {
                if (open && summary === null) load()
              }, [open, summary, load])
      
              // A row wrapping ONE control is a label, which names that control. A
              // row wrapping a set of them must not be: the label becomes the first
              // checkbox's accessible name and swallows the whole section's prose.
              // Those rows are a named group instead.
              var fieldRow = (label, control, key, groupName) =>
                h(
                  groupName ? 'div' : 'label',
                  {
                    key: key,
                    role: groupName ? 'group' : undefined,
                    'aria-label': groupName || undefined,
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      padding: '12px 0',
                      borderTop: '1px solid var(--dsw-alias-border-l2, rgba(127,127,127,0.35))',
                    },
                  },
                  h('div', { style: { fontSize: '13px', color: 'var(--dsw-alias-label-secondary, inherit)' } }, label),
                  control,
                )
      
              var body = null
              if (open) {
                if (summary === null || draft === null) {
                  body = h(
                    'div',
                    {
                      style: {
                        padding: '12px 0',
                        color: 'var(--dsw-alias-label-tertiary, rgba(127,127,127,0.8))',
                        fontSize: '13px',
                      },
                    },
                    note || t.loading,
                  )
                } else {
                  var keyless = (summary.keyless || []).indexOf(draft.provider) >= 0
                  var current = summary.engines[draft.provider] || { hasKey: false }
                  var pristine = seed(summary, draft.provider)
                  var dirty =
                    draft.provider !== summary.provider ||
                    draft.apiKey !== '' ||
                    draft.baseUrl !== pristine.baseUrl ||
                    draft.model !== pristine.model ||
                    REUSE.some((name) => draft.reuse[name] !== summary.reuse[name])
      
                  var set = (key, value) => {
                    var next = Object.assign({}, draft)
                    next[key] = value
                    draftState[1](next)
                    noteState[1]('')
                  }
      
                  var textField = (label, key, type, placeholder) =>
                    fieldRow(
                      label,
                      h(Input, {
                        type: type,
                        value: draft[key],
                        placeholder: placeholder,
                        onChange: (event) => {
                          set(key, event.target.value)
                        },
                      }),
                      key,
                    )
      
                  // Auto mode: the probes say which harnesses exist on this
                  // machine. Found ones get a checkbox with their status; missing
                  // ones are named as absent so the list explains itself.
                  var probes = Array.isArray(summary.discovery) ? summary.discovery : null
                  // Being listed means being found: an absent harness is simply
                  // not shown, and only "not signed in" earns a note.
                  var autoRows = REUSE.filter((name) => {
                    if (!probes) return true
                    var probe = probes.find((candidate) => candidate.harness === name)
                    return probe ? probe.cliFound : false
                  }).map((name) => {
                    var probe = probes && probes.find((candidate) => candidate.harness === name)
                    return h(
                      'label',
                      {
                        key: name,
                        style: {
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '13px',
                        },
                      },
                      h('input', {
                        type: 'checkbox',
                        checked: Boolean(draft.reuse[name]),
                        onChange: (event) => {
                          var next = Object.assign({}, draft.reuse)
                          next[name] = event.target.checked
                          set('reuse', next)
                        },
                      }),
                      h('span', null, name),
                      probe && probe.loggedIn === false
                        ? h(
                            'span',
                            {
                              style: {
                                color: 'var(--dsw-alias-label-tertiary, rgba(127,127,127,0.8))',
                                fontSize: '12px',
                              },
                            },
                            t.notLoggedIn,
                          )
                        : null,
                    )
                  })
      
                  body = h(
                    'div',
                    null,
                    fieldRow(
                      t.engine,
                      h(
                        'select',
                        {
                          value: draft.provider,
                          onChange: (event) => {
                            draftState[1](seed(summary, event.target.value, draft.reuse))
                            noteState[1]('')
                          },
                          style: {
                            appearance: 'none',
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--dsw-alias-border-l2, rgba(127,127,127,0.35))',
                            background: 'transparent',
                            color: 'inherit',
                            font: 'inherit',
                            fontSize: '13px',
                          },
                        },
                        [h('option', { key: '', value: '' }, t.automatic)].concat(
                          ENGINES.map((name) => h('option', { key: name, value: name }, name)),
                        ),
                      ),
                      'engine',
                    ),
                    draft.provider === ''
                      ? fieldRow(
                          t.apiKey,
                          h(
                            'div',
                            {
                              style: {
                                fontSize: '13px',
                                color: 'var(--dsw-alias-label-tertiary, rgba(127,127,127,0.8))',
                              },
                            },
                            t.pickToConfigure,
                          ),
                          'unpinned',
                        )
                      : keyless
                        ? fieldRow(
                            t.apiKey,
                            h(
                              'div',
                              {
                                style: { fontSize: '13px', color: 'var(--dsw-alias-label-tertiary, rgba(127,127,127,0.8))' },
                              },
                              t.cliNote,
                            ),
                            'clinote',
                          )
                        : textField(t.apiKey, 'apiKey', 'password', current.hasKey ? t.stored : t.unset),
                    draft.provider === '' || keyless ? null : textField(t.baseUrl, 'baseUrl', 'text', t.fallback),
                    draft.provider === '' ? null : textField(t.model, 'model', 'text', t.fallback),
                    // Where these values are coming from, said once, because the
                    // first save moves them: an engine the file names takes its
                    // settings from the file alone.
                    draft.provider === '' || current.source !== 'env'
                      ? null
                      : fieldRow(
                          '',
                          h(
                            'div',
                            {
                              style: {
                                fontSize: '13px',
                                color: 'var(--dsw-alias-label-tertiary, rgba(127,127,127,0.8))',
                              },
                            },
                            t.envSourced,
                          ),
                          'envsourced',
                        ),
                    fieldRow(
                      h(
                        'span',
                        null,
                        t.autoTitle,
                        h(
                          'span',
                          {
                            style: {
                              color: 'var(--dsw-alias-label-tertiary, rgba(127,127,127,0.8))',
                              fontWeight: 400,
                              marginLeft: '8px',
                            },
                          },
                          t.autoHint,
                        ),
                      ),
                      h(
                        'div',
                        { style: { display: 'flex', flexWrap: 'wrap', gap: '10px 18px', paddingTop: '2px' } },
                        autoRows,
                      ),
                      'auto',
                      t.autoTitle,
                    ),
                    h(
                      'div',
                      {
                        key: 'footer',
                        style: {
                          borderTop: '1px solid var(--dsw-alias-border-l2, rgba(127,127,127,0.35))',
                          display: 'flex',
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '12px 0 4px',
                        },
                      },
                      h(
                        'a',
                        {
                          href: '#',
                          onClick: (event) => {
                            event.preventDefault()
                            fetch('/modlens/config', {
                              method: 'POST',
                              headers: { 'content-type': 'application/json' },
                              body: JSON.stringify({ open: true }),
                            }).catch(() => {})
                          },
                          style: {
                            fontSize: '12px',
                            color: 'var(--dsw-alias-label-tertiary, rgba(127,127,127,0.8))',
                            textDecoration: 'underline',
                            textUnderlineOffset: '2px',
                          },
                        },
                        t.openConfig,
                      ),
                      h(
                        'span',
                        {
                          role: 'status',
                          style: {
                            marginRight: 'auto',
                            marginLeft: '10px',
                            fontSize: '12px',
                            color: 'var(--dsw-alias-label-tertiary, rgba(127,127,127,0.8))',
                          },
                        },
                        note,
                      ),
                      h(
                        'button',
                        {
                          type: 'button',
                          disabled: !dirty || note === t.saving,
                          onClick: () => {
                            draftState[1](seed(summary, summary.provider))
                            noteState[1]('')
                          },
                          style: {
                            appearance: 'none',
                            font: 'inherit',
                            fontSize: '13px',
                            lineHeight: 1.5,
                            cursor: dirty ? 'pointer' : 'default',
                            border: '1px solid var(--dsw-alias-border-l2, rgba(127,127,127,0.35))',
                            borderRadius: '8px',
                            padding: '5px 14px',
                            background: 'none',
                            color: 'var(--dsw-alias-label-secondary, inherit)',
                            opacity: dirty ? 1 : 0.4,
                          },
                        },
                        t.discard,
                      ),
                      h(
                        'button',
                        {
                          type: 'button',
                          disabled: !dirty || note === t.saving,
                          onClick: () => {
                            noteState[1](t.saving)
                            var payload = savePayload(summary, draft)
                            fetch('/modlens/config', {
                              method: 'POST',
                              headers: { 'content-type': 'application/json' },
                              body: JSON.stringify(payload),
                            })
                              .then((r) =>
                                r.json().then((payload) => {
                                  if (!r.ok) throw new Error(payload.error || 'save failed')
                                  return payload
                                }),
                              )
                              .then((next) => {
                                // The save response carries no discovery; keep the
                                // probes already on screen.
                                next.discovery = summary.discovery
                                summaryState[1](next)
                                draftState[1](seed(next, next.provider))
                                noteState[1](t.saved)
                              })
                              .catch((error) => {
                                noteState[1](String(error.message ? error.message : error))
                              })
                          },
                          style: {
                            appearance: 'none',
                            font: 'inherit',
                            fontSize: '13px',
                            lineHeight: 1.5,
                            cursor: dirty ? 'pointer' : 'default',
                            border: '1px solid transparent',
                            borderRadius: '8px',
                            padding: '5px 14px',
                            background: 'var(--dsw-alias-label-primary, currentColor)',
                            color: 'var(--dsw-alias-bg-layer-3, rgba(127,127,127,0.05))',
                            opacity: dirty ? 1 : 0.4,
                          },
                        },
                        t.save,
                      ),
                    ),
                  )
                }
              }
      
              return h(
                'div',
                {
                  style: {
                    border: '1px solid var(--dsw-alias-border-l2, rgba(127,127,127,0.35))',
                    background: open
                      ? 'var(--dsw-alias-bg-layer-2, rgba(127,127,127,0.10))'
                      : 'var(--dsw-alias-bg-layer-3, rgba(127,127,127,0.05))',
                    borderRadius: '12px',
                    transition: 'border-color .16s, background .16s',
                  },
                },
                h(
                  'button',
                  {
                    type: 'button',
                    'aria-expanded': open,
                    onClick: () => {
                      openState[1](!open)
                    },
                    style: {
                      appearance: 'none',
                      width: '100%',
                      font: 'inherit',
                      color: 'inherit',
                      textAlign: 'left',
                      cursor: 'pointer',
                      background: 'none',
                      border: 0,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                    },
                  },
                  h(
                    'div',
                    { style: { flex: 1, minWidth: 0 } },
                    h('div', { style: { fontSize: '14px', fontWeight: 600 } }, t.title),
                    h(
                      'div',
                      {
                        style: {
                          color: 'var(--dsw-alias-label-tertiary, rgba(127,127,127,0.8))',
                          fontSize: '13px',
                          lineHeight: 1.5,
                        },
                      },
                      t.subtitle,
                    ),
                  ),
                  chevron(open),
                ),
                open ? h('div', { style: { margin: '0 16px', paddingBottom: '8px' } }, body) : null,
              )
            }
          }
      
          function registerCard(ctx) {
            // Reaching for an undeclared service throws in cordis, so the optional
            // dependency rides a scoped ctx.inject: the closure runs where slots
            // exists and never runs where it does not, exactly as the host half
            // takes webServer.
            if (typeof ctx.inject !== 'function') return
            ctx.inject(['slots'], (scope) => {
              // The card and its route live and die together: with the host route
              // off (settingsCard: false, or no web profile) a card would only
              // render an error, which is not what turning a feature off means.
              // Any response at all proves the route exists; only a 404 or a
              // network failure reads as absent.
              fetch('/modlens/config')
                .then((response) => {
                  if (response.status === 404) return
                  try {
                    mountCard(scope)
                  } catch (error) {
                    console.error('[modlens] settings card skipped: ' + error)
                  }
                })
                .catch(() => {})
            })
          }
      
          function mountCard(ctx) {
            var react
            try {
              react = require('react')
            } catch (error) {
              console.error('[modlens] settings card skipped: ' + error)
              return
            }
            var ui = require('@deepseek-ai/dsh-client-ui-primitives')
            var Card = ConfigCard(react, ui)
            ctx.slots.inject('settings.plugin.item', function* () {
              yield ctx.slots.register({ name: 'settings.plugin.item', id: 'modlens', order: 30 }, Card)
            })
          }
      
          function apply(ctx) {
            registerCard(ctx)
            document.addEventListener('paste', onPaste, true)
            document.addEventListener('focusin', onFocusIn, true)
            // cordis effect: unregister on plugin disposal (HMR, profile reload).
            if (typeof ctx.effect === 'function') {
              ctx.effect(
                () => () => {
                  document.removeEventListener('paste', onPaste, true)
                  document.removeEventListener('focusin', onFocusIn, true)
                },
                'modlens: paste-to-path listener',
              )
            }
          }
      
          exports.apply = apply
          // Exposed for the repo's tests only; not part of the plugin contract.
          exports.__card = { nextDraft: nextDraft, savePayload: savePayload }
          // `slots` is optional, so it is not required here: registerCard checks.
          exports.inject = []
          return module.exports
        
      return module.exports
    })()

    const guard = (() => {
      var module = { exports: {} }
      var exports = module.exports
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
      
      // ../DeepSeekHarness/dsh-home/profiles/plugins/dsh-modlens-guard/src/client.js
      var client_exports = {};
      __export(client_exports, {
        ModlensGuardSection: () => ModlensGuardSection,
        NS: () => NS,
        apply: () => apply,
        inject: () => inject
      });
      module.exports = __toCommonJS(client_exports);
      var import_react = require("react");
      var import_jsx_runtime = require("react/jsx-runtime");
      var NS = "settings.modlens-guard";
      var TONE = {
        ready: { fg: "#0f7b3f", bg: "rgba(16,163,74,0.12)", border: "rgba(16,163,74,0.35)" },
        unconfigured: { fg: "#8a5300", bg: "rgba(217,119,6,0.12)", border: "rgba(217,119,6,0.35)" },
        failing: { fg: "#b3261e", bg: "rgba(220,38,38,0.12)", border: "rgba(220,38,38,0.35)" },
        off: { fg: "#5b6270", bg: "rgba(107,114,128,0.12)", border: "rgba(107,114,128,0.35)" }
      };
      var css = {
        section: { maxWidth: 760, color: "var(--dsw-alias-label-primary, #1f2329)", fontFamily: "inherit" },
        hero: { display: "flex", alignItems: "center", gap: 14, marginBottom: 12 },
        heroIcon: { flex: "none", color: "var(--dsw-alias-label-tertiary, #6b7280)" },
        heroTitle: { fontSize: 20, fontWeight: 650, letterSpacing: 0.2 },
        heroMeta: { fontSize: 14, color: "var(--dsw-alias-label-tertiary, #6b7280)" },
        lead: { fontSize: 15, lineHeight: 1.7, color: "var(--dsw-alias-label-tertiary, #6b7280)", margin: "0 0 18px" },
        card: {
          border: "1px solid var(--dsw-alias-border-strong, #e5e7eb)",
          borderRadius: 10,
          padding: 18,
          marginBottom: 16,
          display: "flex",
          flexDirection: "column",
          gap: 14
        },
        row: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
        badge: {
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 14px",
          borderRadius: 999,
          fontSize: 15,
          fontWeight: 650,
          border: "1px solid"
        },
        dot: { width: 9, height: 9, borderRadius: 999, background: "currentColor" },
        hint: { fontSize: 15, lineHeight: 1.7 },
        grid: { display: "grid", gridTemplateColumns: "minmax(110px, 180px) 1fr", gap: "10px 18px", fontSize: 15 },
        key: { color: "var(--dsw-alias-label-tertiary, #6b7280)" },
        val: { wordBreak: "break-word" },
        err: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 14 },
        btn: {
          padding: "8px 16px",
          fontSize: 15,
          borderRadius: 8,
          cursor: "pointer",
          border: "1px solid var(--dsw-alias-border-strong, #e5e7eb)",
          background: "transparent",
          color: "inherit"
        },
        foot: { fontSize: 14, lineHeight: 1.7, color: "var(--dsw-alias-label-tertiary, #6b7280)" }
      };
      function HeroIcon() {
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { width: "34", height: "34", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", "aria-hidden": "true", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z", strokeLinecap: "round", strokeLinejoin: "round" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m4 7.5 8 4.5 8-4.5M12 12v9", strokeLinecap: "round", strokeLinejoin: "round" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "12", r: "2.1", fill: "currentColor", stroke: "none" })
        ] });
      }
      function stamp(value, never) {
        if (!value) return never;
        try {
          return new Intl.DateTimeFormat(void 0, { dateStyle: "medium", timeStyle: "medium" }).format(new Date(value));
        } catch {
          return String(value);
        }
      }
      function ModlensGuardSection({ t }) {
        const [status, setStatus] = (0, import_react.useState)(null);
        const [error, setError] = (0, import_react.useState)("");
        const [loading, setLoading] = (0, import_react.useState)(true);
        const [probing, setProbing] = (0, import_react.useState)(false);
        const load = (0, import_react.useCallback)(async () => {
          setLoading(true);
          try {
            const res = await fetch("/modlens-guard/status");
            const body = await res.json();
            if (!res.ok || body.ok !== true) throw new Error(body.error || `HTTP ${res.status}`);
            setStatus(body.status);
            setError("");
          } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
          } finally {
            setLoading(false);
          }
        }, []);
        const probe = (0, import_react.useCallback)(async () => {
          setProbing(true);
          try {
            const res = await fetch("/modlens-guard/probe", { method: "POST" });
            const body = await res.json();
            setStatus(body.status ?? null);
            if (!res.ok || body.ok !== true) throw new Error(body.result?.error || body.error || `HTTP ${res.status}`);
            setError("");
          } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
          } finally {
            setProbing(false);
          }
        }, []);
        (0, import_react.useEffect)(() => {
          void load();
          const timer = window.setInterval(() => void load(), 15e3);
          return () => window.clearInterval(timer);
        }, [load]);
        const state = status?.state ?? "off";
        const tone = TONE[state] ?? TONE.off;
        const stateLabel = t(
          state === "ready" ? "stateReady" : state === "unconfigured" ? "stateUnconfigured" : state === "failing" ? "stateFailing" : "stateOff"
        );
        const stateHint = t(
          state === "ready" ? "readyHint" : state === "unconfigured" ? "unconfiguredHint" : state === "failing" ? "failingHint" : "offHint"
        );
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.section, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.hero, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.heroIcon, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeroIcon, {}) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.heroTitle, children: t("nav") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.heroMeta, children: t("heroMeta") })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: css.lead, children: t("lead") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.card, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.row, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { ...css.badge, color: tone.fg, background: tone.bg, borderColor: tone.border }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.dot }),
                stateLabel
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: css.btn, onClick: () => void probe(), disabled: loading || probing, children: probing ? t("probing") : t("refresh") })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.hint, children: stateHint }),
            error !== "" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { ...css.hint, color: TONE.failing.fg }, children: `${t("loadFailed")}: ${error}` }),
            status !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.grid, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.key, children: t("bridge") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.val, children: status.pluginLoaded ? t("bridgeOn") : t("bridgeOff") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.key, children: t("engines") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.val, children: status.engines?.length > 0 ? status.engines.join(", ") : t("none") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.key, children: t("pinned") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.val, children: status.pinned || t("pinnedAuto") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.key, children: t("visionModels") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.val, children: status.visionProviders?.length > 0 ? status.visionProviders.join(", ") : t("none") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.key, children: t("lastProbe") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.val, children: status.probeAt ? stamp(status.probeAt, t("never")) : t("never") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.key, children: t("probeResult") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.val, children: status.probeOk === null ? t("never") : status.probeOk ? t("probeOk") : t("probeFailed") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.key, children: t("probeEngine") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.val, children: status.probeProvider || t("none") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.key, children: t("probeModel") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.val, children: status.probeModel || t("none") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.key, children: t("probeDuration") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.val, children: typeof status.probeDurationMs === "number" ? t("probeDurationValue").replace("{ms}", String(status.probeDurationMs)) : t("never") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.key, children: t("lastOk") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.val, children: stamp(status.lastOkAt, t("never")) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.key, children: t("lastFail") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.val, children: stamp(status.lastFailAt, t("never")) }),
              status.lastError && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.key, children: t("lastError") }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { ...css.val, ...css.err }, children: status.lastError })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.key, children: t("counters") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.val, children: t("countersValue").replace("{reads}", String(status.reads ?? 0)).replace("{failures}", String(status.failures ?? 0)).replace("{blocks}", String(status.blocks ?? 0)) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.foot, children: t("configHint") })
          ] })
        ] });
      }
      function ModlensTurnStatus({ matched, sessionId }) {
        const [status, setStatus] = (0, import_react.useState)(null);
        const turn = matched;
        (0, import_react.useEffect)(() => {
          if (!turn || !Number.isInteger(turn.turn)) return void 0;
          let cancelled = false;
          let timer;
          const load = async () => {
            try {
              const response = await fetch(`/modlens-guard/turn-status?turn=${encodeURIComponent(String(turn.turn))}&sessionId=${encodeURIComponent(sessionId)}`);
              const body = await response.json();
              const next = body.status ?? null;
              if (cancelled) return;
              setStatus(next);
              if (next?.state === "ready" || next?.state === "failed") {
                if (timer) window.clearInterval(timer);
              }
            } catch {
            }
          };
          void load();
          timer = window.setInterval(() => void load(), 500);
          return () => {
            cancelled = true;
            if (timer) window.clearInterval(timer);
          };
        }, [turn, sessionId]);
        if (!status || status.state !== "ready" && status.state !== "failed") return null;
        const failed = status.state === "failed";
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "div",
          {
            style: {
              color: failed ? TONE.failing.fg : "var(--dsw-alias-label-tertiary, #6b7280)",
              fontSize: 13,
              lineHeight: 1.5,
              margin: "6px 0 0 2px"
            },
            children: failed ? "ModLens \xB7 \u56FE\u7247\u8BFB\u53D6\u5931\u8D25" : "ModLens \xB7 \u5DF2\u8BFB\u53D6\u56FE\u7247"
          }
        );
      }
      function ModlensTurnTail({ matched, sessionId }) {
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModlensTurnStatus, { matched, sessionId });
      }
      var inject = ["slots", "locale"];
      var NS_DICT = {
        zh: {
          nav: "\u89C6\u89C9\u72B6\u6001",
          heroMeta: "\u7EAF\u6587\u672C\u6A21\u578B\u7684\u56FE\u7247\u8BC6\u522B\u72B6\u6001",
          lead: "\u7EAF\u6587\u672C\u6A21\u578B\u6536\u5230\u56FE\u7247\u65F6\uFF0C\u7531 ModLens \u5728\u53D1\u9001\u524D\u628A\u56FE\u7247\u8F6C\u6210\u6587\u5B57\u8BC1\u636E\uFF1B\u539F\u751F\u591A\u6A21\u6001\u6A21\u578B\u4E0D\u53D7\u5F71\u54CD\u3002\u6B64\u9875\u663E\u793A\u8BC6\u522B\u94FE\u8DEF\u5F53\u524D\u662F\u5426\u53EF\u7528\u3002",
          stateReady: "\u53EF\u7528",
          stateUnconfigured: "\u672A\u914D\u7F6E",
          stateFailing: "\u8BC6\u522B\u5931\u8D25",
          stateOff: "\u672A\u52A0\u8F7D",
          readyHint: "\u7EAF\u6587\u672C\u6A21\u578B\u53D1\u9001\u56FE\u7247\u65F6\u4F1A\u81EA\u52A8\u8BC6\u522B\uFF1B\u53EF\u968F\u65F6\u6267\u884C\u63A2\u67E5\u786E\u8BA4\u5F53\u524D\u5F15\u64CE\u771F\u5B9E\u53EF\u7528\u3002",
          unconfiguredHint: "\u5C1A\u672A\u914D\u7F6E\u89C6\u89C9\u5F15\u64CE\u3002\u7EAF\u6587\u672C\u6A21\u578B\u53D1\u9001\u56FE\u7247\u65F6\u4E0D\u4F1A\u88AB\u8BC6\u522B\uFF0C\u6A21\u578B\u4F1A\u660E\u786E\u6536\u5230\u201C\u56FE\u7247\u672A\u88AB\u8BFB\u53D6\u201D\u7684\u63D0\u793A\uFF0C\u4E0D\u4F1A\u51ED\u7A7A\u731C\u6D4B\u56FE\u7247\u5185\u5BB9\u3002",
          failingHint: "\u6700\u8FD1\u4E00\u6B21\u8BC6\u522B\u6216\u63A2\u67E5\u5931\u8D25\u3002\u70B9\u51FB\u201C\u63A2\u67E5\u201D\u4F1A\u771F\u5B9E\u8C03\u7528\u5F53\u524D\u89C6\u89C9\u5F15\u64CE\uFF1B\u6210\u529F\u540E\u7ACB\u5373\u6062\u590D\u4E3A\u53EF\u7528\u3002",
          offHint: "ModLens \u672A\u5B89\u88C5\u6216\u672A\u52A0\u8F7D\uFF0C\u56FE\u7247\u65E0\u6CD5\u88AB\u8BC6\u522B\u3002",
          bridge: "\u8BC6\u522B\u6865",
          bridgeOn: "\u5DF2\u52A0\u8F7D",
          bridgeOff: "\u672A\u52A0\u8F7D",
          engines: "\u53EF\u7528\u5F15\u64CE",
          pinned: "\u5DF2\u56FA\u5B9A\u5F15\u64CE",
          visionModels: "\u89C6\u89C9\u6865\u6A21\u578B",
          lastProbe: "\u6700\u8FD1\u63A2\u67E5",
          probeResult: "\u63A2\u67E5\u7ED3\u679C",
          probeOk: "\u53EF\u7528",
          probeFailed: "\u4E0D\u53EF\u7528",
          probeEngine: "\u63A2\u67E5\u5F15\u64CE",
          probeModel: "\u63A2\u67E5\u6A21\u578B",
          probeDuration: "\u63A2\u67E5\u8017\u65F6",
          probeDurationValue: "{ms} ms",
          pinnedAuto: "\u81EA\u52A8\uFF08\u6545\u969C\u8F6C\u79FB\u94FE\uFF09",
          none: "\u65E0",
          lastOk: "\u6700\u8FD1\u6210\u529F",
          lastFail: "\u6700\u8FD1\u5931\u8D25",
          lastError: "\u6700\u540E\u9519\u8BEF",
          counters: "\u7D2F\u8BA1",
          countersValue: "\u6210\u529F {reads} / \u5931\u8D25 {failures} / \u672A\u8BC6\u522B {blocks}",
          never: "\u4ECE\u672A",
          refresh: "\u5237\u65B0\u72B6\u6001\u5E76\u63A2\u67E5",
          probing: "\u63A2\u67E5\u4E2D\u2026",
          loading: "\u52A0\u8F7D\u4E2D\u2026",
          loadFailed: "\u65E0\u6CD5\u8BFB\u53D6\u72B6\u6001",
          configHint: "\u5F15\u64CE\u914D\u7F6E\u5728\u201C\u8BBE\u7F6E \u2192 \u63D2\u4EF6 \u2192 \u89C6\u89C9\u5F15\u64CE\uFF08ModLens\uFF09\u201D\u4E2D\u4FEE\u6539\u3002\u539F\u751F\u591A\u6A21\u6001\u6A21\u578B\u59CB\u7EC8\u4F7F\u7528\u81EA\u8EAB\u80FD\u529B\uFF0C\u4E0D\u7ECF\u8FC7\u6B64\u94FE\u8DEF\u3002"
        },
        en: {
          nav: "Vision Status",
          heroMeta: "Image reading status for text-only models",
          lead: "When a text-only model receives an image, ModLens converts it to text evidence before the request is sent. Native multimodal models are untouched. This page shows whether that bridge works.",
          stateReady: "Ready",
          stateUnconfigured: "Not configured",
          stateFailing: "Failing",
          stateOff: "Not loaded",
          readyHint: "Images sent to a text-only model are read automatically. Run a probe at any time to verify the active engine.",
          unconfiguredHint: "No vision engine is configured. Images sent to a text-only model are not read; the model is told explicitly that the image was not read and will not guess at its contents.",
          failingHint: "The latest image read or probe failed. Run a probe to call the current vision engine; a successful probe immediately restores Ready.",
          offHint: "ModLens is not installed or not loaded, so images cannot be read.",
          bridge: "Bridge",
          bridgeOn: "Loaded",
          bridgeOff: "Not loaded",
          engines: "Usable engines",
          pinned: "Pinned engine",
          visionModels: "Vision bridge models",
          lastProbe: "Last probe",
          probeResult: "Probe result",
          probeOk: "Ready",
          probeFailed: "Unavailable",
          probeEngine: "Probe engine",
          probeModel: "Probe model",
          probeDuration: "Probe duration",
          probeDurationValue: "{ms} ms",
          pinnedAuto: "Automatic (failover chain)",
          none: "None",
          lastOk: "Last success",
          lastFail: "Last failure",
          lastError: "Last error",
          counters: "Totals",
          countersValue: "{reads} read / {failures} failed / {blocks} unread",
          never: "Never",
          refresh: "Refresh and probe",
          probing: "Probing\u2026",
          loading: "Loading\u2026",
          loadFailed: "Cannot read status",
          configHint: "Configure engines under Settings \u2192 Plugins \u2192 Vision engine (ModLens). Native multimodal models always use their own capability and never pass through this bridge."
        }
      };
      function apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, NS_DICT), "modlens-guard: copy dictionaries");
        const t = ctx.locale.bind(NS);
        const injected = () => ({ t });
        ctx.slots.inject(
          "conversation.chat.turnTail",
          () => ctx.slots.register(
            {
              name: "conversation.chat.turnTail",
              select: (owner) => owner?.turn ?? null,
              locale: NS
            },
            ModlensTurnTail
          )
        );
        ctx.slots.inject(
          "settings.section",
          () => ctx.slots.register(
            {
              name: "settings.section",
              id: "modlens-guard",
              order: 12,
              label: () => t("nav"),
              inject: injected
            },
            ModlensGuardSection
          )
        );
      }
      //# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vRGVlcFNlZWtIYXJuZXNzL2RzaC1ob21lL3Byb2ZpbGVzL3BsdWdpbnMvZHNoLW1vZGxlbnMtZ3VhcmQvc3JjL2NsaWVudC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gZHNoLW1vZGxlbnMtZ3VhcmQgXHUyMDE0XHUyMDE0IGNsaWVudCBcdTdBRUZcdUZGMDhcdTZENEZcdTg5QzhcdTU2NjhcdUZGMDlcbi8vIFx1NTcyOFx1OEJCRVx1N0Y2RVx1OTg3NVx1NkNFOFx1NTE4Q1x1MzAwQ1x1ODlDNlx1ODlDOVx1NzJCNlx1NjAwMVx1MzAwRHNlY3Rpb25cdUZGMUFcdTY2M0VcdTc5M0FcdTdFQUZcdTY1ODdcdTY3MkNcdTZBMjFcdTU3OEJcdTc2ODRcdTU2RkVcdTcyNDdcdThCQzZcdTUyMkJcdTk0RkVcdThERUZcdTY2MkZcdTU0MjZcdTUzRUZcdTc1MjhcdTMwMDJcbi8vIFx1N0VBRlx1NjU4N1x1NjcyQ1x1NkEyMVx1NTc4Qlx1NjUzNlx1NTIzMFx1NTZGRVx1NzI0N1x1NjVGNlx1NzUzMSBNb2RMZW5zIFx1NTcyOFx1NTNEMVx1OTAwMVx1NTI0RFx1OEY2Q1x1NTE5OVx1RkYxQlx1NTM5Rlx1NzUxRlx1NTkxQVx1NkEyMVx1NjAwMVx1NkEyMVx1NTc4Qlx1NEUwRFx1NTNEN1x1NUY3MVx1NTRDRFx1MzAwMlxuaW1wb3J0IHsgdXNlU3RhdGUsIHVzZUVmZmVjdCwgdXNlQ2FsbGJhY2sgfSBmcm9tIFwicmVhY3RcIjtcblxuY29uc3QgTlMgPSBcInNldHRpbmdzLm1vZGxlbnMtZ3VhcmRcIjtcblxuY29uc3QgVE9ORSA9IHtcbiAgcmVhZHk6IHsgZmc6IFwiIzBmN2IzZlwiLCBiZzogXCJyZ2JhKDE2LDE2Myw3NCwwLjEyKVwiLCBib3JkZXI6IFwicmdiYSgxNiwxNjMsNzQsMC4zNSlcIiB9LFxuICB1bmNvbmZpZ3VyZWQ6IHsgZmc6IFwiIzhhNTMwMFwiLCBiZzogXCJyZ2JhKDIxNywxMTksNiwwLjEyKVwiLCBib3JkZXI6IFwicmdiYSgyMTcsMTE5LDYsMC4zNSlcIiB9LFxuICBmYWlsaW5nOiB7IGZnOiBcIiNiMzI2MWVcIiwgYmc6IFwicmdiYSgyMjAsMzgsMzgsMC4xMilcIiwgYm9yZGVyOiBcInJnYmEoMjIwLDM4LDM4LDAuMzUpXCIgfSxcbiAgb2ZmOiB7IGZnOiBcIiM1YjYyNzBcIiwgYmc6IFwicmdiYSgxMDcsMTE0LDEyOCwwLjEyKVwiLCBib3JkZXI6IFwicmdiYSgxMDcsMTE0LDEyOCwwLjM1KVwiIH1cbn07XG5cbmNvbnN0IGNzcyA9IHtcbiAgc2VjdGlvbjogeyBtYXhXaWR0aDogNzYwLCBjb2xvcjogXCJ2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgIzFmMjMyOSlcIiwgZm9udEZhbWlseTogXCJpbmhlcml0XCIgfSxcbiAgaGVybzogeyBkaXNwbGF5OiBcImZsZXhcIiwgYWxpZ25JdGVtczogXCJjZW50ZXJcIiwgZ2FwOiAxNCwgbWFyZ2luQm90dG9tOiAxMiB9LFxuICBoZXJvSWNvbjogeyBmbGV4OiBcIm5vbmVcIiwgY29sb3I6IFwidmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNmI3MjgwKVwiIH0sXG4gIGhlcm9UaXRsZTogeyBmb250U2l6ZTogMjAsIGZvbnRXZWlnaHQ6IDY1MCwgbGV0dGVyU3BhY2luZzogMC4yIH0sXG4gIGhlcm9NZXRhOiB7IGZvbnRTaXplOiAxNCwgY29sb3I6IFwidmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNmI3MjgwKVwiIH0sXG4gIGxlYWQ6IHsgZm9udFNpemU6IDE1LCBsaW5lSGVpZ2h0OiAxLjcsIGNvbG9yOiBcInZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzZiNzI4MClcIiwgbWFyZ2luOiBcIjAgMCAxOHB4XCIgfSxcbiAgY2FyZDoge1xuICAgIGJvcmRlcjogXCIxcHggc29saWQgdmFyKC0tZHN3LWFsaWFzLWJvcmRlci1zdHJvbmcsICNlNWU3ZWIpXCIsXG4gICAgYm9yZGVyUmFkaXVzOiAxMCxcbiAgICBwYWRkaW5nOiAxOCxcbiAgICBtYXJnaW5Cb3R0b206IDE2LFxuICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgIGZsZXhEaXJlY3Rpb246IFwiY29sdW1uXCIsXG4gICAgZ2FwOiAxNFxuICB9LFxuICByb3c6IHsgZGlzcGxheTogXCJmbGV4XCIsIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsIGdhcDogMTIsIGZsZXhXcmFwOiBcIndyYXBcIiB9LFxuICBiYWRnZToge1xuICAgIGRpc3BsYXk6IFwiaW5saW5lLWZsZXhcIixcbiAgICBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLFxuICAgIGdhcDogOCxcbiAgICBwYWRkaW5nOiBcIjZweCAxNHB4XCIsXG4gICAgYm9yZGVyUmFkaXVzOiA5OTksXG4gICAgZm9udFNpemU6IDE1LFxuICAgIGZvbnRXZWlnaHQ6IDY1MCxcbiAgICBib3JkZXI6IFwiMXB4IHNvbGlkXCJcbiAgfSxcbiAgZG90OiB7IHdpZHRoOiA5LCBoZWlnaHQ6IDksIGJvcmRlclJhZGl1czogOTk5LCBiYWNrZ3JvdW5kOiBcImN1cnJlbnRDb2xvclwiIH0sXG4gIGhpbnQ6IHsgZm9udFNpemU6IDE1LCBsaW5lSGVpZ2h0OiAxLjcgfSxcbiAgZ3JpZDogeyBkaXNwbGF5OiBcImdyaWRcIiwgZ3JpZFRlbXBsYXRlQ29sdW1uczogXCJtaW5tYXgoMTEwcHgsIDE4MHB4KSAxZnJcIiwgZ2FwOiBcIjEwcHggMThweFwiLCBmb250U2l6ZTogMTUgfSxcbiAga2V5OiB7IGNvbG9yOiBcInZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzZiNzI4MClcIiB9LFxuICB2YWw6IHsgd29yZEJyZWFrOiBcImJyZWFrLXdvcmRcIiB9LFxuICBlcnI6IHsgZm9udEZhbWlseTogXCJ1aS1tb25vc3BhY2UsIFNGTW9uby1SZWd1bGFyLCBNZW5sbywgbW9ub3NwYWNlXCIsIGZvbnRTaXplOiAxNCB9LFxuICBidG46IHtcbiAgICBwYWRkaW5nOiBcIjhweCAxNnB4XCIsXG4gICAgZm9udFNpemU6IDE1LFxuICAgIGJvcmRlclJhZGl1czogOCxcbiAgICBjdXJzb3I6IFwicG9pbnRlclwiLFxuICAgIGJvcmRlcjogXCIxcHggc29saWQgdmFyKC0tZHN3LWFsaWFzLWJvcmRlci1zdHJvbmcsICNlNWU3ZWIpXCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIGNvbG9yOiBcImluaGVyaXRcIlxuICB9LFxuICBmb290OiB7IGZvbnRTaXplOiAxNCwgbGluZUhlaWdodDogMS43LCBjb2xvcjogXCJ2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2YjcyODApXCIgfVxufTtcblxuZnVuY3Rpb24gSGVyb0ljb24oKSB7XG4gIHJldHVybiAoXG4gICAgPHN2ZyB3aWR0aD1cIjM0XCIgaGVpZ2h0PVwiMzRcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2VXaWR0aD1cIjEuN1wiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPlxuICAgICAgPHBhdGggZD1cIk00IDcuNSAxMiAzbDggNC41djlMMTIgMjFsLTgtNC41elwiIHN0cm9rZUxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZUxpbmVqb2luPVwicm91bmRcIiAvPlxuICAgICAgPHBhdGggZD1cIm00IDcuNSA4IDQuNSA4LTQuNU0xMiAxMnY5XCIgc3Ryb2tlTGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiIC8+XG4gICAgICA8Y2lyY2xlIGN4PVwiMTJcIiBjeT1cIjEyXCIgcj1cIjIuMVwiIGZpbGw9XCJjdXJyZW50Q29sb3JcIiBzdHJva2U9XCJub25lXCIgLz5cbiAgICA8L3N2Zz5cbiAgKTtcbn1cblxuZnVuY3Rpb24gc3RhbXAodmFsdWUsIG5ldmVyKSB7XG4gIGlmICghdmFsdWUpIHJldHVybiBuZXZlcjtcbiAgdHJ5IHtcbiAgICByZXR1cm4gbmV3IEludGwuRGF0ZVRpbWVGb3JtYXQodW5kZWZpbmVkLCB7IGRhdGVTdHlsZTogXCJtZWRpdW1cIiwgdGltZVN0eWxlOiBcIm1lZGl1bVwiIH0pLmZvcm1hdChuZXcgRGF0ZSh2YWx1ZSkpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gU3RyaW5nKHZhbHVlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBNb2RsZW5zR3VhcmRTZWN0aW9uKHsgdCB9KSB7XG4gIGNvbnN0IFtzdGF0dXMsIHNldFN0YXR1c10gPSB1c2VTdGF0ZShudWxsKTtcbiAgY29uc3QgW2Vycm9yLCBzZXRFcnJvcl0gPSB1c2VTdGF0ZShcIlwiKTtcbiAgY29uc3QgW2xvYWRpbmcsIHNldExvYWRpbmddID0gdXNlU3RhdGUodHJ1ZSk7XG4gIGNvbnN0IFtwcm9iaW5nLCBzZXRQcm9iaW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcblxuICBjb25zdCBsb2FkID0gdXNlQ2FsbGJhY2soYXN5bmMgKCkgPT4ge1xuICAgIHNldExvYWRpbmcodHJ1ZSk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKFwiL21vZGxlbnMtZ3VhcmQvc3RhdHVzXCIpO1xuICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICBpZiAoIXJlcy5vayB8fCBib2R5Lm9rICE9PSB0cnVlKSB0aHJvdyBuZXcgRXJyb3IoYm9keS5lcnJvciB8fCBgSFRUUCAke3Jlcy5zdGF0dXN9YCk7XG4gICAgICBzZXRTdGF0dXMoYm9keS5zdGF0dXMpO1xuICAgICAgc2V0RXJyb3IoXCJcIik7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgc2V0RXJyb3IoZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgfVxuICB9LCBbXSk7XG5cbiAgY29uc3QgcHJvYmUgPSB1c2VDYWxsYmFjayhhc3luYyAoKSA9PiB7XG4gICAgc2V0UHJvYmluZyh0cnVlKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goXCIvbW9kbGVucy1ndWFyZC9wcm9iZVwiLCB7IG1ldGhvZDogXCJQT1NUXCIgfSk7XG4gICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIHNldFN0YXR1cyhib2R5LnN0YXR1cyA/PyBudWxsKTtcbiAgICAgIGlmICghcmVzLm9rIHx8IGJvZHkub2sgIT09IHRydWUpIHRocm93IG5ldyBFcnJvcihib2R5LnJlc3VsdD8uZXJyb3IgfHwgYm9keS5lcnJvciB8fCBgSFRUUCAke3Jlcy5zdGF0dXN9YCk7XG4gICAgICBzZXRFcnJvcihcIlwiKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBzZXRFcnJvcihlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSkpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRQcm9iaW5nKGZhbHNlKTtcbiAgICB9XG4gIH0sIFtdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIHZvaWQgbG9hZCgpO1xuICAgIGNvbnN0IHRpbWVyID0gd2luZG93LnNldEludGVydmFsKCgpID0+IHZvaWQgbG9hZCgpLCAxNTAwMCk7XG4gICAgcmV0dXJuICgpID0+IHdpbmRvdy5jbGVhckludGVydmFsKHRpbWVyKTtcbiAgfSwgW2xvYWRdKTtcblxuICBjb25zdCBzdGF0ZSA9IHN0YXR1cz8uc3RhdGUgPz8gXCJvZmZcIjtcbiAgY29uc3QgdG9uZSA9IFRPTkVbc3RhdGVdID8/IFRPTkUub2ZmO1xuICBjb25zdCBzdGF0ZUxhYmVsID0gdChcbiAgICBzdGF0ZSA9PT0gXCJyZWFkeVwiID8gXCJzdGF0ZVJlYWR5XCIgOiBzdGF0ZSA9PT0gXCJ1bmNvbmZpZ3VyZWRcIiA/IFwic3RhdGVVbmNvbmZpZ3VyZWRcIiA6IHN0YXRlID09PSBcImZhaWxpbmdcIiA/IFwic3RhdGVGYWlsaW5nXCIgOiBcInN0YXRlT2ZmXCJcbiAgKTtcbiAgY29uc3Qgc3RhdGVIaW50ID0gdChcbiAgICBzdGF0ZSA9PT0gXCJyZWFkeVwiID8gXCJyZWFkeUhpbnRcIiA6IHN0YXRlID09PSBcInVuY29uZmlndXJlZFwiID8gXCJ1bmNvbmZpZ3VyZWRIaW50XCIgOiBzdGF0ZSA9PT0gXCJmYWlsaW5nXCIgPyBcImZhaWxpbmdIaW50XCIgOiBcIm9mZkhpbnRcIlxuICApO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBzdHlsZT17Y3NzLnNlY3Rpb259PlxuICAgICAgPGRpdiBzdHlsZT17Y3NzLmhlcm99PlxuICAgICAgICA8c3BhbiBzdHlsZT17Y3NzLmhlcm9JY29ufT5cbiAgICAgICAgICA8SGVyb0ljb24gLz5cbiAgICAgICAgPC9zcGFuPlxuICAgICAgICA8ZGl2PlxuICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy5oZXJvVGl0bGV9Pnt0KFwibmF2XCIpfTwvZGl2PlxuICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy5oZXJvTWV0YX0+e3QoXCJoZXJvTWV0YVwiKX08L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxwIHN0eWxlPXtjc3MubGVhZH0+e3QoXCJsZWFkXCIpfTwvcD5cblxuICAgICAgPGRpdiBzdHlsZT17Y3NzLmNhcmR9PlxuICAgICAgICA8ZGl2IHN0eWxlPXtjc3Mucm93fT5cbiAgICAgICAgICA8c3BhbiBzdHlsZT17eyAuLi5jc3MuYmFkZ2UsIGNvbG9yOiB0b25lLmZnLCBiYWNrZ3JvdW5kOiB0b25lLmJnLCBib3JkZXJDb2xvcjogdG9uZS5ib3JkZXIgfX0+XG4gICAgICAgICAgICA8c3BhbiBzdHlsZT17Y3NzLmRvdH0gLz5cbiAgICAgICAgICAgIHtzdGF0ZUxhYmVsfVxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBzdHlsZT17Y3NzLmJ0bn0gb25DbGljaz17KCkgPT4gdm9pZCBwcm9iZSgpfSBkaXNhYmxlZD17bG9hZGluZyB8fCBwcm9iaW5nfT5cbiAgICAgICAgICAgIHtwcm9iaW5nID8gdChcInByb2JpbmdcIikgOiB0KFwicmVmcmVzaFwiKX1cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBzdHlsZT17Y3NzLmhpbnR9PntzdGF0ZUhpbnR9PC9kaXY+XG4gICAgICAgIHtlcnJvciAhPT0gXCJcIiAmJiA8ZGl2IHN0eWxlPXt7IC4uLmNzcy5oaW50LCBjb2xvcjogVE9ORS5mYWlsaW5nLmZnIH19PntgJHt0KFwibG9hZEZhaWxlZFwiKX06ICR7ZXJyb3J9YH08L2Rpdj59XG5cbiAgICAgICAge3N0YXR1cyAhPT0gbnVsbCAmJiAoXG4gICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLmdyaWR9PlxuICAgICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLmtleX0+e3QoXCJicmlkZ2VcIil9PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IHN0eWxlPXtjc3MudmFsfT57c3RhdHVzLnBsdWdpbkxvYWRlZCA/IHQoXCJicmlkZ2VPblwiKSA6IHQoXCJicmlkZ2VPZmZcIil9PC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy5rZXl9Pnt0KFwiZW5naW5lc1wiKX08L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy52YWx9PntzdGF0dXMuZW5naW5lcz8ubGVuZ3RoID4gMCA/IHN0YXR1cy5lbmdpbmVzLmpvaW4oXCIsIFwiKSA6IHQoXCJub25lXCIpfTwvZGl2PlxuXG4gICAgICAgICAgICA8ZGl2IHN0eWxlPXtjc3Mua2V5fT57dChcInBpbm5lZFwiKX08L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy52YWx9PntzdGF0dXMucGlubmVkIHx8IHQoXCJwaW5uZWRBdXRvXCIpfTwvZGl2PlxuXG4gICAgICAgICAgICA8ZGl2IHN0eWxlPXtjc3Mua2V5fT57dChcInZpc2lvbk1vZGVsc1wiKX08L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy52YWx9PntzdGF0dXMudmlzaW9uUHJvdmlkZXJzPy5sZW5ndGggPiAwID8gc3RhdHVzLnZpc2lvblByb3ZpZGVycy5qb2luKFwiLCBcIikgOiB0KFwibm9uZVwiKX08L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLmtleX0+e3QoXCJsYXN0UHJvYmVcIil9PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IHN0eWxlPXtjc3MudmFsfT57c3RhdHVzLnByb2JlQXQgPyBzdGFtcChzdGF0dXMucHJvYmVBdCwgdChcIm5ldmVyXCIpKSA6IHQoXCJuZXZlclwiKX08L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLmtleX0+e3QoXCJwcm9iZVJlc3VsdFwiKX08L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy52YWx9PntzdGF0dXMucHJvYmVPayA9PT0gbnVsbCA/IHQoXCJuZXZlclwiKSA6IHN0YXR1cy5wcm9iZU9rID8gdChcInByb2JlT2tcIikgOiB0KFwicHJvYmVGYWlsZWRcIil9PC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy5rZXl9Pnt0KFwicHJvYmVFbmdpbmVcIil9PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IHN0eWxlPXtjc3MudmFsfT57c3RhdHVzLnByb2JlUHJvdmlkZXIgfHwgdChcIm5vbmVcIil9PC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy5rZXl9Pnt0KFwicHJvYmVNb2RlbFwiKX08L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy52YWx9PntzdGF0dXMucHJvYmVNb2RlbCB8fCB0KFwibm9uZVwiKX08L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLmtleX0+e3QoXCJwcm9iZUR1cmF0aW9uXCIpfTwvZGl2PlxuICAgICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLnZhbH0+e3R5cGVvZiBzdGF0dXMucHJvYmVEdXJhdGlvbk1zID09PSBcIm51bWJlclwiID8gdChcInByb2JlRHVyYXRpb25WYWx1ZVwiKS5yZXBsYWNlKFwie21zfVwiLCBTdHJpbmcoc3RhdHVzLnByb2JlRHVyYXRpb25NcykpIDogdChcIm5ldmVyXCIpfTwvZGl2PlxuXG4gICAgICAgICAgICA8ZGl2IHN0eWxlPXtjc3Mua2V5fT57dChcImxhc3RPa1wiKX08L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy52YWx9PntzdGFtcChzdGF0dXMubGFzdE9rQXQsIHQoXCJuZXZlclwiKSl9PC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy5rZXl9Pnt0KFwibGFzdEZhaWxcIil9PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IHN0eWxlPXtjc3MudmFsfT57c3RhbXAoc3RhdHVzLmxhc3RGYWlsQXQsIHQoXCJuZXZlclwiKSl9PC9kaXY+XG5cbiAgICAgICAgICAgIHtzdGF0dXMubGFzdEVycm9yICYmIChcbiAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXtjc3Mua2V5fT57dChcImxhc3RFcnJvclwiKX08L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IC4uLmNzcy52YWwsIC4uLmNzcy5lcnIgfX0+e3N0YXR1cy5sYXN0RXJyb3J9PC9kaXY+XG4gICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLmtleX0+e3QoXCJjb3VudGVyc1wiKX08L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy52YWx9PlxuICAgICAgICAgICAgICB7dChcImNvdW50ZXJzVmFsdWVcIilcbiAgICAgICAgICAgICAgICAucmVwbGFjZShcIntyZWFkc31cIiwgU3RyaW5nKHN0YXR1cy5yZWFkcyA/PyAwKSlcbiAgICAgICAgICAgICAgICAucmVwbGFjZShcIntmYWlsdXJlc31cIiwgU3RyaW5nKHN0YXR1cy5mYWlsdXJlcyA/PyAwKSlcbiAgICAgICAgICAgICAgICAucmVwbGFjZShcIntibG9ja3N9XCIsIFN0cmluZyhzdGF0dXMuYmxvY2tzID8/IDApKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIDxkaXYgc3R5bGU9e2Nzcy5mb290fT57dChcImNvbmZpZ0hpbnRcIil9PC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxuZnVuY3Rpb24gTW9kbGVuc1R1cm5TdGF0dXMoeyBtYXRjaGVkLCBzZXNzaW9uSWQgfSkge1xuICBjb25zdCBbc3RhdHVzLCBzZXRTdGF0dXNdID0gdXNlU3RhdGUobnVsbCk7XG4gIGNvbnN0IHR1cm4gPSBtYXRjaGVkO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCF0dXJuIHx8ICFOdW1iZXIuaXNJbnRlZ2VyKHR1cm4udHVybikpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgbGV0IGNhbmNlbGxlZCA9IGZhbHNlO1xuICAgIGxldCB0aW1lcjtcbiAgICBjb25zdCBsb2FkID0gYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChgL21vZGxlbnMtZ3VhcmQvdHVybi1zdGF0dXM/dHVybj0ke2VuY29kZVVSSUNvbXBvbmVudChTdHJpbmcodHVybi50dXJuKSl9JnNlc3Npb25JZD0ke2VuY29kZVVSSUNvbXBvbmVudChzZXNzaW9uSWQpfWApO1xuICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgICAgICBjb25zdCBuZXh0ID0gYm9keS5zdGF0dXMgPz8gbnVsbDtcbiAgICAgICAgaWYgKGNhbmNlbGxlZCkgcmV0dXJuO1xuICAgICAgICBzZXRTdGF0dXMobmV4dCk7XG4gICAgICAgIGlmIChuZXh0Py5zdGF0ZSA9PT0gXCJyZWFkeVwiIHx8IG5leHQ/LnN0YXRlID09PSBcImZhaWxlZFwiKSB7XG4gICAgICAgICAgaWYgKHRpbWVyKSB3aW5kb3cuY2xlYXJJbnRlcnZhbCh0aW1lcik7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2gge31cbiAgICB9O1xuICAgIHZvaWQgbG9hZCgpO1xuICAgIHRpbWVyID0gd2luZG93LnNldEludGVydmFsKCgpID0+IHZvaWQgbG9hZCgpLCA1MDApO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBjYW5jZWxsZWQgPSB0cnVlO1xuICAgICAgaWYgKHRpbWVyKSB3aW5kb3cuY2xlYXJJbnRlcnZhbCh0aW1lcik7XG4gICAgfTtcbiAgfSwgW3R1cm4sIHNlc3Npb25JZF0pO1xuXG4gIGlmICghc3RhdHVzIHx8IChzdGF0dXMuc3RhdGUgIT09IFwicmVhZHlcIiAmJiBzdGF0dXMuc3RhdGUgIT09IFwiZmFpbGVkXCIpKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCBmYWlsZWQgPSBzdGF0dXMuc3RhdGUgPT09IFwiZmFpbGVkXCI7XG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgc3R5bGU9e3tcbiAgICAgICAgY29sb3I6IGZhaWxlZCA/IFRPTkUuZmFpbGluZy5mZyA6IFwidmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNmI3MjgwKVwiLFxuICAgICAgICBmb250U2l6ZTogMTMsXG4gICAgICAgIGxpbmVIZWlnaHQ6IDEuNSxcbiAgICAgICAgbWFyZ2luOiBcIjZweCAwIDAgMnB4XCJcbiAgICAgIH19XG4gICAgPlxuICAgICAge2ZhaWxlZCA/IFwiTW9kTGVucyBcdTAwQjcgXHU1NkZFXHU3MjQ3XHU4QkZCXHU1M0Q2XHU1OTMxXHU4RDI1XCIgOiBcIk1vZExlbnMgXHUwMEI3IFx1NURGMlx1OEJGQlx1NTNENlx1NTZGRVx1NzI0N1wifVxuICAgIDwvZGl2PlxuICApO1xufVxuXG5mdW5jdGlvbiBNb2RsZW5zVHVyblRhaWwoeyBtYXRjaGVkLCBzZXNzaW9uSWQgfSkge1xuICByZXR1cm4gPE1vZGxlbnNUdXJuU3RhdHVzIG1hdGNoZWQ9e21hdGNoZWR9IHNlc3Npb25JZD17c2Vzc2lvbklkfSAvPjtcbn1cblxuLy8gXHUyNTAwXHUyNTAwIFx1NjNEMlx1NEVGNlx1NTE2NVx1NTNFMyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbmNvbnN0IGluamVjdCA9IFtcInNsb3RzXCIsIFwibG9jYWxlXCJdO1xuXG5jb25zdCBOU19ESUNUID0geyAgemg6IHtcbiAgICBuYXY6IFwiXHU4OUM2XHU4OUM5XHU3MkI2XHU2MDAxXCIsXG4gICAgaGVyb01ldGE6IFwiXHU3RUFGXHU2NTg3XHU2NzJDXHU2QTIxXHU1NzhCXHU3Njg0XHU1NkZFXHU3MjQ3XHU4QkM2XHU1MjJCXHU3MkI2XHU2MDAxXCIsXG4gICAgbGVhZDogXCJcdTdFQUZcdTY1ODdcdTY3MkNcdTZBMjFcdTU3OEJcdTY1MzZcdTUyMzBcdTU2RkVcdTcyNDdcdTY1RjZcdUZGMENcdTc1MzEgTW9kTGVucyBcdTU3MjhcdTUzRDFcdTkwMDFcdTUyNERcdTYyOEFcdTU2RkVcdTcyNDdcdThGNkNcdTYyMTBcdTY1ODdcdTVCNTdcdThCQzFcdTYzNkVcdUZGMUJcdTUzOUZcdTc1MUZcdTU5MUFcdTZBMjFcdTYwMDFcdTZBMjFcdTU3OEJcdTRFMERcdTUzRDdcdTVGNzFcdTU0Q0RcdTMwMDJcdTZCNjRcdTk4NzVcdTY2M0VcdTc5M0FcdThCQzZcdTUyMkJcdTk0RkVcdThERUZcdTVGNTNcdTUyNERcdTY2MkZcdTU0MjZcdTUzRUZcdTc1MjhcdTMwMDJcIixcbiAgICBzdGF0ZVJlYWR5OiBcIlx1NTNFRlx1NzUyOFwiLFxuICAgIHN0YXRlVW5jb25maWd1cmVkOiBcIlx1NjcyQVx1OTE0RFx1N0Y2RVwiLFxuICAgIHN0YXRlRmFpbGluZzogXCJcdThCQzZcdTUyMkJcdTU5MzFcdThEMjVcIixcbiAgICBzdGF0ZU9mZjogXCJcdTY3MkFcdTUyQTBcdThGN0RcIixcbiAgICByZWFkeUhpbnQ6IFwiXHU3RUFGXHU2NTg3XHU2NzJDXHU2QTIxXHU1NzhCXHU1M0QxXHU5MDAxXHU1NkZFXHU3MjQ3XHU2NUY2XHU0RjFBXHU4MUVBXHU1MkE4XHU4QkM2XHU1MjJCXHVGRjFCXHU1M0VGXHU5NjhGXHU2NUY2XHU2MjY3XHU4ODRDXHU2M0EyXHU2N0U1XHU3ODZFXHU4QkE0XHU1RjUzXHU1MjREXHU1RjE1XHU2NENFXHU3NzFGXHU1QjlFXHU1M0VGXHU3NTI4XHUzMDAyXCIsXG4gICAgdW5jb25maWd1cmVkSGludDogXCJcdTVDMUFcdTY3MkFcdTkxNERcdTdGNkVcdTg5QzZcdTg5QzlcdTVGMTVcdTY0Q0VcdTMwMDJcdTdFQUZcdTY1ODdcdTY3MkNcdTZBMjFcdTU3OEJcdTUzRDFcdTkwMDFcdTU2RkVcdTcyNDdcdTY1RjZcdTRFMERcdTRGMUFcdTg4QUJcdThCQzZcdTUyMkJcdUZGMENcdTZBMjFcdTU3OEJcdTRGMUFcdTY2MEVcdTc4NkVcdTY1MzZcdTUyMzBcdTIwMUNcdTU2RkVcdTcyNDdcdTY3MkFcdTg4QUJcdThCRkJcdTUzRDZcdTIwMURcdTc2ODRcdTYzRDBcdTc5M0FcdUZGMENcdTRFMERcdTRGMUFcdTUxRURcdTdBN0FcdTczMUNcdTZENEJcdTU2RkVcdTcyNDdcdTUxODVcdTVCQjlcdTMwMDJcIixcbiAgICBmYWlsaW5nSGludDogXCJcdTY3MDBcdThGRDFcdTRFMDBcdTZCMjFcdThCQzZcdTUyMkJcdTYyMTZcdTYzQTJcdTY3RTVcdTU5MzFcdThEMjVcdTMwMDJcdTcwQjlcdTUxRkJcdTIwMUNcdTYzQTJcdTY3RTVcdTIwMURcdTRGMUFcdTc3MUZcdTVCOUVcdThDMDNcdTc1MjhcdTVGNTNcdTUyNERcdTg5QzZcdTg5QzlcdTVGMTVcdTY0Q0VcdUZGMUJcdTYyMTBcdTUyOUZcdTU0MEVcdTdBQ0JcdTUzNzNcdTYwNjJcdTU5MERcdTRFM0FcdTUzRUZcdTc1MjhcdTMwMDJcIixcbiAgICBvZmZIaW50OiBcIk1vZExlbnMgXHU2NzJBXHU1Qjg5XHU4OEM1XHU2MjE2XHU2NzJBXHU1MkEwXHU4RjdEXHVGRjBDXHU1NkZFXHU3MjQ3XHU2NUUwXHU2Q0Q1XHU4OEFCXHU4QkM2XHU1MjJCXHUzMDAyXCIsXG4gICAgYnJpZGdlOiBcIlx1OEJDNlx1NTIyQlx1Njg2NVwiLFxuICAgIGJyaWRnZU9uOiBcIlx1NURGMlx1NTJBMFx1OEY3RFwiLFxuICAgIGJyaWRnZU9mZjogXCJcdTY3MkFcdTUyQTBcdThGN0RcIixcbiAgICBlbmdpbmVzOiBcIlx1NTNFRlx1NzUyOFx1NUYxNVx1NjRDRVwiLFxuICAgIHBpbm5lZDogXCJcdTVERjJcdTU2RkFcdTVCOUFcdTVGMTVcdTY0Q0VcIixcbiAgICB2aXNpb25Nb2RlbHM6IFwiXHU4OUM2XHU4OUM5XHU2ODY1XHU2QTIxXHU1NzhCXCIsXG4gICAgbGFzdFByb2JlOiBcIlx1NjcwMFx1OEZEMVx1NjNBMlx1NjdFNVwiLFxuICAgIHByb2JlUmVzdWx0OiBcIlx1NjNBMlx1NjdFNVx1N0VEM1x1Njc5Q1wiLFxuICAgIHByb2JlT2s6IFwiXHU1M0VGXHU3NTI4XCIsXG4gICAgcHJvYmVGYWlsZWQ6IFwiXHU0RTBEXHU1M0VGXHU3NTI4XCIsXG4gICAgcHJvYmVFbmdpbmU6IFwiXHU2M0EyXHU2N0U1XHU1RjE1XHU2NENFXCIsXG4gICAgcHJvYmVNb2RlbDogXCJcdTYzQTJcdTY3RTVcdTZBMjFcdTU3OEJcIixcbiAgICBwcm9iZUR1cmF0aW9uOiBcIlx1NjNBMlx1NjdFNVx1ODAxN1x1NjVGNlwiLFxuICAgIHByb2JlRHVyYXRpb25WYWx1ZTogXCJ7bXN9IG1zXCIsXG4gICAgcGlubmVkQXV0bzogXCJcdTgxRUFcdTUyQThcdUZGMDhcdTY1NDVcdTk2OUNcdThGNkNcdTc5RkJcdTk0RkVcdUZGMDlcIixcbiAgICBub25lOiBcIlx1NjVFMFwiLFxuICAgIGxhc3RPazogXCJcdTY3MDBcdThGRDFcdTYyMTBcdTUyOUZcIixcbiAgICBsYXN0RmFpbDogXCJcdTY3MDBcdThGRDFcdTU5MzFcdThEMjVcIixcbiAgICBsYXN0RXJyb3I6IFwiXHU2NzAwXHU1NDBFXHU5NTE5XHU4QkVGXCIsXG4gICAgY291bnRlcnM6IFwiXHU3RDJGXHU4QkExXCIsXG4gICAgY291bnRlcnNWYWx1ZTogXCJcdTYyMTBcdTUyOUYge3JlYWRzfSAvIFx1NTkzMVx1OEQyNSB7ZmFpbHVyZXN9IC8gXHU2NzJBXHU4QkM2XHU1MjJCIHtibG9ja3N9XCIsXG4gICAgbmV2ZXI6IFwiXHU0RUNFXHU2NzJBXCIsXG4gICAgcmVmcmVzaDogXCJcdTUyMzdcdTY1QjBcdTcyQjZcdTYwMDFcdTVFNzZcdTYzQTJcdTY3RTVcIixcbiAgICBwcm9iaW5nOiBcIlx1NjNBMlx1NjdFNVx1NEUyRFx1MjAyNlwiLFxuICAgIGxvYWRpbmc6IFwiXHU1MkEwXHU4RjdEXHU0RTJEXHUyMDI2XCIsXG4gICAgbG9hZEZhaWxlZDogXCJcdTY1RTBcdTZDRDVcdThCRkJcdTUzRDZcdTcyQjZcdTYwMDFcIixcbiAgICBjb25maWdIaW50OiBcIlx1NUYxNVx1NjRDRVx1OTE0RFx1N0Y2RVx1NTcyOFx1MjAxQ1x1OEJCRVx1N0Y2RSBcdTIxOTIgXHU2M0QyXHU0RUY2IFx1MjE5MiBcdTg5QzZcdTg5QzlcdTVGMTVcdTY0Q0VcdUZGMDhNb2RMZW5zXHVGRjA5XHUyMDFEXHU0RTJEXHU0RkVFXHU2NTM5XHUzMDAyXHU1MzlGXHU3NTFGXHU1OTFBXHU2QTIxXHU2MDAxXHU2QTIxXHU1NzhCXHU1OUNCXHU3RUM4XHU0RjdGXHU3NTI4XHU4MUVBXHU4RUFCXHU4MEZEXHU1MjlCXHVGRjBDXHU0RTBEXHU3RUNGXHU4RkM3XHU2QjY0XHU5NEZFXHU4REVGXHUzMDAyXCJcbiAgfSxcbiAgZW46IHtcbiAgICBuYXY6IFwiVmlzaW9uIFN0YXR1c1wiLFxuICAgIGhlcm9NZXRhOiBcIkltYWdlIHJlYWRpbmcgc3RhdHVzIGZvciB0ZXh0LW9ubHkgbW9kZWxzXCIsXG4gICAgbGVhZDogXCJXaGVuIGEgdGV4dC1vbmx5IG1vZGVsIHJlY2VpdmVzIGFuIGltYWdlLCBNb2RMZW5zIGNvbnZlcnRzIGl0IHRvIHRleHQgZXZpZGVuY2UgYmVmb3JlIHRoZSByZXF1ZXN0IGlzIHNlbnQuIE5hdGl2ZSBtdWx0aW1vZGFsIG1vZGVscyBhcmUgdW50b3VjaGVkLiBUaGlzIHBhZ2Ugc2hvd3Mgd2hldGhlciB0aGF0IGJyaWRnZSB3b3Jrcy5cIixcbiAgICBzdGF0ZVJlYWR5OiBcIlJlYWR5XCIsXG4gICAgc3RhdGVVbmNvbmZpZ3VyZWQ6IFwiTm90IGNvbmZpZ3VyZWRcIixcbiAgICBzdGF0ZUZhaWxpbmc6IFwiRmFpbGluZ1wiLFxuICAgIHN0YXRlT2ZmOiBcIk5vdCBsb2FkZWRcIixcbiAgICByZWFkeUhpbnQ6IFwiSW1hZ2VzIHNlbnQgdG8gYSB0ZXh0LW9ubHkgbW9kZWwgYXJlIHJlYWQgYXV0b21hdGljYWxseS4gUnVuIGEgcHJvYmUgYXQgYW55IHRpbWUgdG8gdmVyaWZ5IHRoZSBhY3RpdmUgZW5naW5lLlwiLFxuICAgIHVuY29uZmlndXJlZEhpbnQ6XG4gICAgICBcIk5vIHZpc2lvbiBlbmdpbmUgaXMgY29uZmlndXJlZC4gSW1hZ2VzIHNlbnQgdG8gYSB0ZXh0LW9ubHkgbW9kZWwgYXJlIG5vdCByZWFkOyB0aGUgbW9kZWwgaXMgdG9sZCBleHBsaWNpdGx5IHRoYXQgdGhlIGltYWdlIHdhcyBub3QgcmVhZCBhbmQgd2lsbCBub3QgZ3Vlc3MgYXQgaXRzIGNvbnRlbnRzLlwiLFxuICAgIGZhaWxpbmdIaW50OlxuICAgICAgXCJUaGUgbGF0ZXN0IGltYWdlIHJlYWQgb3IgcHJvYmUgZmFpbGVkLiBSdW4gYSBwcm9iZSB0byBjYWxsIHRoZSBjdXJyZW50IHZpc2lvbiBlbmdpbmU7IGEgc3VjY2Vzc2Z1bCBwcm9iZSBpbW1lZGlhdGVseSByZXN0b3JlcyBSZWFkeS5cIixcbiAgICBvZmZIaW50OiBcIk1vZExlbnMgaXMgbm90IGluc3RhbGxlZCBvciBub3QgbG9hZGVkLCBzbyBpbWFnZXMgY2Fubm90IGJlIHJlYWQuXCIsXG4gICAgYnJpZGdlOiBcIkJyaWRnZVwiLFxuICAgIGJyaWRnZU9uOiBcIkxvYWRlZFwiLFxuICAgIGJyaWRnZU9mZjogXCJOb3QgbG9hZGVkXCIsXG4gICAgZW5naW5lczogXCJVc2FibGUgZW5naW5lc1wiLFxuICAgIHBpbm5lZDogXCJQaW5uZWQgZW5naW5lXCIsXG4gICAgdmlzaW9uTW9kZWxzOiBcIlZpc2lvbiBicmlkZ2UgbW9kZWxzXCIsXG4gICAgbGFzdFByb2JlOiBcIkxhc3QgcHJvYmVcIixcbiAgICBwcm9iZVJlc3VsdDogXCJQcm9iZSByZXN1bHRcIixcbiAgICBwcm9iZU9rOiBcIlJlYWR5XCIsXG4gICAgcHJvYmVGYWlsZWQ6IFwiVW5hdmFpbGFibGVcIixcbiAgICBwcm9iZUVuZ2luZTogXCJQcm9iZSBlbmdpbmVcIixcbiAgICBwcm9iZU1vZGVsOiBcIlByb2JlIG1vZGVsXCIsXG4gICAgcHJvYmVEdXJhdGlvbjogXCJQcm9iZSBkdXJhdGlvblwiLFxuICAgIHByb2JlRHVyYXRpb25WYWx1ZTogXCJ7bXN9IG1zXCIsXG4gICAgcGlubmVkQXV0bzogXCJBdXRvbWF0aWMgKGZhaWxvdmVyIGNoYWluKVwiLFxuICAgIG5vbmU6IFwiTm9uZVwiLFxuICAgIGxhc3RPazogXCJMYXN0IHN1Y2Nlc3NcIixcbiAgICBsYXN0RmFpbDogXCJMYXN0IGZhaWx1cmVcIixcbiAgICBsYXN0RXJyb3I6IFwiTGFzdCBlcnJvclwiLFxuICAgIGNvdW50ZXJzOiBcIlRvdGFsc1wiLFxuICAgIGNvdW50ZXJzVmFsdWU6IFwie3JlYWRzfSByZWFkIC8ge2ZhaWx1cmVzfSBmYWlsZWQgLyB7YmxvY2tzfSB1bnJlYWRcIixcbiAgICBuZXZlcjogXCJOZXZlclwiLFxuICAgIHJlZnJlc2g6IFwiUmVmcmVzaCBhbmQgcHJvYmVcIixcbiAgICBwcm9iaW5nOiBcIlByb2JpbmdcdTIwMjZcIixcbiAgICBsb2FkaW5nOiBcIkxvYWRpbmdcdTIwMjZcIixcbiAgICBsb2FkRmFpbGVkOiBcIkNhbm5vdCByZWFkIHN0YXR1c1wiLFxuICAgIGNvbmZpZ0hpbnQ6XG4gICAgICBcIkNvbmZpZ3VyZSBlbmdpbmVzIHVuZGVyIFNldHRpbmdzIFx1MjE5MiBQbHVnaW5zIFx1MjE5MiBWaXNpb24gZW5naW5lIChNb2RMZW5zKS4gTmF0aXZlIG11bHRpbW9kYWwgbW9kZWxzIGFsd2F5cyB1c2UgdGhlaXIgb3duIGNhcGFiaWxpdHkgYW5kIG5ldmVyIHBhc3MgdGhyb3VnaCB0aGlzIGJyaWRnZS5cIlxuICB9XG59O1xuXG5mdW5jdGlvbiBhcHBseShjdHgpIHtcbiAgY3R4LmVmZmVjdCgoKSA9PiBjdHgubG9jYWxlLnJlZ2lzdGVyKE5TLCBOU19ESUNUKSwgXCJtb2RsZW5zLWd1YXJkOiBjb3B5IGRpY3Rpb25hcmllc1wiKTtcbiAgY29uc3QgdCA9IGN0eC5sb2NhbGUuYmluZChOUyk7XG4gIGNvbnN0IGluamVjdGVkID0gKCkgPT4gKHsgdCB9KTtcbiAgY3R4LnNsb3RzLmluamVjdChcImNvbnZlcnNhdGlvbi5jaGF0LnR1cm5UYWlsXCIsICgpID0+XG4gICAgY3R4LnNsb3RzLnJlZ2lzdGVyKFxuICAgICAge1xuICAgICAgICBuYW1lOiBcImNvbnZlcnNhdGlvbi5jaGF0LnR1cm5UYWlsXCIsXG4gICAgICAgIHNlbGVjdDogKG93bmVyKSA9PiBvd25lcj8udHVybiA/PyBudWxsLFxuICAgICAgICBsb2NhbGU6IE5TXG4gICAgICB9LFxuICAgICAgTW9kbGVuc1R1cm5UYWlsXG4gICAgKVxuICApO1xuICBjdHguc2xvdHMuaW5qZWN0KFwic2V0dGluZ3Muc2VjdGlvblwiLCAoKSA9PlxuICAgIGN0eC5zbG90cy5yZWdpc3RlcihcbiAgICAgIHtcbiAgICAgICAgbmFtZTogXCJzZXR0aW5ncy5zZWN0aW9uXCIsXG4gICAgICAgIGlkOiBcIm1vZGxlbnMtZ3VhcmRcIixcbiAgICAgICAgb3JkZXI6IDEyLFxuICAgICAgICBsYWJlbDogKCkgPT4gdChcIm5hdlwiKSxcbiAgICAgICAgaW5qZWN0OiBpbmplY3RlZFxuICAgICAgfSxcbiAgICAgIE1vZGxlbnNHdWFyZFNlY3Rpb25cbiAgICApXG4gICk7XG59XG5cbmV4cG9ydCB7IGFwcGx5LCBpbmplY3QsIE5TLCBNb2RsZW5zR3VhcmRTZWN0aW9uIH07XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUdBLG1CQUFpRDtBQTBEN0M7QUF4REosSUFBTSxLQUFLO0FBRVgsSUFBTSxPQUFPO0FBQUEsRUFDWCxPQUFPLEVBQUUsSUFBSSxXQUFXLElBQUksd0JBQXdCLFFBQVEsdUJBQXVCO0FBQUEsRUFDbkYsY0FBYyxFQUFFLElBQUksV0FBVyxJQUFJLHdCQUF3QixRQUFRLHVCQUF1QjtBQUFBLEVBQzFGLFNBQVMsRUFBRSxJQUFJLFdBQVcsSUFBSSx3QkFBd0IsUUFBUSx1QkFBdUI7QUFBQSxFQUNyRixLQUFLLEVBQUUsSUFBSSxXQUFXLElBQUksMEJBQTBCLFFBQVEseUJBQXlCO0FBQ3ZGO0FBRUEsSUFBTSxNQUFNO0FBQUEsRUFDVixTQUFTLEVBQUUsVUFBVSxLQUFLLE9BQU8sMkNBQTJDLFlBQVksVUFBVTtBQUFBLEVBQ2xHLE1BQU0sRUFBRSxTQUFTLFFBQVEsWUFBWSxVQUFVLEtBQUssSUFBSSxjQUFjLEdBQUc7QUFBQSxFQUN6RSxVQUFVLEVBQUUsTUFBTSxRQUFRLE9BQU8sMkNBQTJDO0FBQUEsRUFDNUUsV0FBVyxFQUFFLFVBQVUsSUFBSSxZQUFZLEtBQUssZUFBZSxJQUFJO0FBQUEsRUFDL0QsVUFBVSxFQUFFLFVBQVUsSUFBSSxPQUFPLDJDQUEyQztBQUFBLEVBQzVFLE1BQU0sRUFBRSxVQUFVLElBQUksWUFBWSxLQUFLLE9BQU8sNENBQTRDLFFBQVEsV0FBVztB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QUk7QUFBQSxJQUNGLEtBQUs7QUFBQSxJQUNMLFVBQVU7QUFBQSxJQUNWLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxJQUNaLG1CQUFtQjtBQUFBLElBQ25CLGNBQWM7QUFBQSxJQUNkLFVBQVU7QUFBQSxJQUNWLFdBQVc7QUFBQSxJQUNYLGtCQUNFO0FBQUEsSUFDRixhQUNFO0FBQUEsSUFDRixTQUFTO0FBQUEsSUFDVCxRQUFRO0FBQUEsSUFDUixVQUFVO0FBQUEsSUFDVixXQUFXO0FBQUEsSUFDWCxTQUFTO0FBQUEsSUFDVCxRQUFRO0FBQUEsSUFDUixjQUFjO0FBQUEsSUFDZCxXQUFXO0FBQUEsSUFDWCxhQUFhO0FBQUEsSUFDYixTQUFTO0FBQUEsSUFDVCxhQUFhO0FBQUEsSUFDYixhQUFhO0FBQUEsSUFDYixZQUFZO0FBQUEsSUFDWixlQUFlO0FBQUEsSUFDZixvQkFBb0I7QUFBQSxJQUNwQixZQUFZO0FBQUEsSUFDWixNQUFNO0FBQUEsSUFDTixRQUFRO0FBQUEsSUFDUixVQUFVO0FBQUEsSUFDVixXQUFXO0FBQUEsSUFDWCxVQUFVO0FBQUEsSUFDVixlQUFlO0FBQUEsSUFDZixPQUFPO0FBQUEsSUFDUCxTQUFTO0FBQUEsSUFDVCxTQUFTO0FBQUEsSUFDVCxTQUFTO0FBQUEsSUFDVCxZQUFZO0FBQUEsSUFDWixZQUNFO0FBQUEsRUFDSjtBQUNGO0FBRUEsU0FBUyxNQUFNLEtBQUs7QUFDbEIsTUFBSSxPQUFPLE1BQU0sSUFBSSxPQUFPLFNBQVMsSUFBSSxPQUFPLEdBQUcsa0NBQWtDO0FBQ3JGLFFBQU0sSUFBSSxJQUFJLE9BQU8sS0FBSyxFQUFFO0FBQzVCLFFBQU0sV0FBVyxPQUFPLEVBQUUsRUFBRTtBQUM1QixNQUFJLE1BQU07QUFBQSxJQUFPO0FBQUEsSUFBOEIsTUFDN0MsSUFBSSxNQUFNO0FBQUEsTUFDUjtBQUFBLFFBQ0UsTUFBTTtBQUFBLFFBQ04sUUFBUSxDQUFDLFVBQVUsT0FBTyxRQUFRO0FBQUEsUUFDbEMsUUFBUTtBQUFBLE1BQ1Y7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDQSxNQUFJLE1BQU07QUFBQSxJQUFPO0FBQUEsSUFBb0IsTUFDbkMsSUFBSSxNQUFNO0FBQUEsTUFDUjtBQUFBLFFBQ0UsTUFBTTtBQUFBLFFBQ04sSUFBSTtBQUFBLFFBQ0osT0FBTztBQUFBLFFBQ1AsT0FBTyxNQUFNLEVBQUUsS0FBSztBQUFBLFFBQ3BCLFFBQVE7QUFBQSxNQUNWO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0Y7IiwKICAibmFtZXMiOiBbXQp9Cg==
      
      		return module.exports;
      	
      return module.exports
    })()

    return {
      name: 'dsh-modlens',
      inject: ['slots', 'locale'],
      apply(ctx) {
        engine.apply(ctx)
        guard.apply(ctx)
      },
      __card: engine.__card,
      __guard: guard,
    }
  },
})
