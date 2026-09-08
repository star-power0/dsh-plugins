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
              sitesTitle: 'OpenAI-compatible site failover chain',
              sitesHint: 'Only enabled sites listed here are tried, in order. Codex, Grok, Claude, and other CLIs are not used.',
              addSite: 'Add site',
              removeSite: 'Remove',
              moveUp: 'Move up',
              moveDown: 'Move down',
              siteName: 'Site name',
              siteEnabled: 'Enabled',
              siteEmpty: 'No configured sites. The legacy ModLens provider chain is still used.',
              chainSaved: 'site chain saved',
              siteInvalid: 'Each site needs a name, API key, HTTPS/HTTP base URL, and model.',
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
              sitesTitle: 'OpenAI 兼容站点故障转移链',
              sitesHint: '只会按顺序尝试这里启用的站点，不会使用 Codex、Grok、Claude 等 CLI。',
              addSite: '添加站点',
              removeSite: '删除',
              moveUp: '上移',
              moveDown: '下移',
              siteName: '站点名称',
              siteEnabled: '启用',
              siteEmpty: '还没有配置站点，将继续使用旧的 ModLens 引擎链。',
              chainSaved: '站点链已保存',
              siteInvalid: '每个站点都需要名称、API 密钥、HTTP/HTTPS 接口地址和模型。',
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
      
          function orderedSiteDraft(summary) {
            var state = summary && summary.openaiSites ? summary.openaiSites : { sites: [], order: [] }
            var sites = Array.isArray(state.sites) ? state.sites : []
            var byId = {}
            sites.forEach(function (site) {
              if (site && typeof site.id === 'string') byId[site.id] = Object.assign({}, site, { apiKey: '', keyDirty: false })
            })
            var order = Array.isArray(state.order) ? state.order : sites.map(function (site) { return site.id })
            var result = []
            order.forEach(function (id) {
              if (byId[id]) {
                result.push(byId[id])
                delete byId[id]
              }
            })
            Object.keys(byId).forEach(function (id) { result.push(byId[id]) })
            return result
          }
      
          function siteDraftPayload(sites) {
            return (Array.isArray(sites) ? sites : []).map(function (site) {
              return {
                id: site.id,
                name: site.name || '',
                apiKey: site.keyDirty === true ? site.apiKey || '' : '',
                keyDirty: site.keyDirty === true,
                baseUrl: site.baseUrl || '',
                model: site.model || '',
                enabled: site.enabled !== false,
              }
            })
          }
      
          function sitesChanged(summary, sites) {
            var original = orderedSiteDraft(summary)
            var next = siteDraftPayload(sites)
            if (original.length !== next.length) return true
              return original.some(function (site, index) {
              var other = next[index]
              return !other || site.id !== other.id || site.name !== other.name || site.baseUrl !== other.baseUrl || site.model !== other.model || site.enabled !== other.enabled || other.keyDirty === true
            })
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
              sites: orderedSiteDraft(summary),
            }
          }
      
          // What one save is actually about. The pin travels only when the select
          // moved; the engine fields only when they were edited. A save that always
          // carried both pinned an engine nobody chose and wrote the values the
          // card loaded back over whatever the file holds now.
          function savePayload(summary, draft) {
            var payload = { reuse: {} }
            if (sitesChanged(summary, draft.sites)) {
              payload.openaiSites = siteDraftPayload(draft.sites)
              payload.openaiSiteOrder = draft.sites.map(function (site) { return site.id })
            }
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
                  var hasSiteList = Array.isArray(draft.sites) && draft.sites.length > 0
                  var showLegacyOpenaiFields = draft.provider !== 'openai' || !hasSiteList
                  var pristine = seed(summary, draft.provider)
                  var dirty =
                    draft.provider !== summary.provider ||
                    draft.apiKey !== '' ||
                    draft.baseUrl !== pristine.baseUrl ||
                    draft.model !== pristine.model ||
                    sitesChanged(summary, draft.sites) ||
                    REUSE.some((name) => draft.reuse[name] !== summary.reuse[name])
      
                  var set = (key, value) => {
                    var next = Object.assign({}, draft)
                    next[key] = value
                    draftState[1](next)
                    noteState[1]('')
                  }
      
                  var updateSite = (index, key, value) => {
                    var sites = draft.sites.map(function (site, siteIndex) {
                      return siteIndex === index ? Object.assign({}, site, { [key]: value }) : site
                    })
                    set('sites', sites)
                  }
                  var updateSiteFields = (index, fields) => {
                    var sites = draft.sites.map(function (site, siteIndex) {
                      return siteIndex === index ? Object.assign({}, site, fields) : site
                    })
                    set('sites', sites)
                  }
                  var moveSite = (index, delta) => {
                    var target = index + delta
                    if (target < 0 || target >= draft.sites.length) return
                    var sites = draft.sites.slice()
                    var item = sites.splice(index, 1)[0]
                    sites.splice(target, 0, item)
                    set('sites', sites)
                  }
                  var removeSite = (index) => set('sites', draft.sites.filter(function (_site, siteIndex) { return siteIndex !== index }))
                  var addSite = () => set('sites', draft.sites.concat({
                    id: 'site-' + String(Date.now()).slice(-6),
                    name: '',
                    apiKey: '',
                    baseUrl: '',
                    model: '',
                    enabled: true,
                  }))
                  var siteRows = draft.sites.map(function (site, index) {
                    return h(
                      'div',
                      {
                        key: site.id + '-' + index,
                        style: {
                          border: '1px solid var(--dsw-alias-border-l2, rgba(127,127,127,0.35))',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          marginBottom: '8px',
                          background: 'var(--dsw-alias-bg-base, rgba(127,127,127,0.04))',
                        },
                      },
                      h(
                        'div',
                        { style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' } },
                        h('input', {
                          type: 'checkbox',
                          checked: site.enabled !== false,
                          onChange: function (event) { updateSite(index, 'enabled', event.target.checked) },
                        }),
                        h('strong', { style: { flex: 1, fontSize: '13px' } }, (index + 1) + '. ' + (site.name || t.siteName)),
                        h('button', { type: 'button', disabled: index === 0, onClick: function () { moveSite(index, -1) }, title: t.moveUp, style: { border: 0, background: 'none', color: 'inherit', cursor: index === 0 ? 'default' : 'pointer', opacity: index === 0 ? 0.35 : 1 } }, '↑'),
                        h('button', { type: 'button', disabled: index === draft.sites.length - 1, onClick: function () { moveSite(index, 1) }, title: t.moveDown, style: { border: 0, background: 'none', color: 'inherit', cursor: index === draft.sites.length - 1 ? 'default' : 'pointer', opacity: index === draft.sites.length - 1 ? 0.35 : 1 } }, '↓'),
                        h('button', { type: 'button', onClick: function () { removeSite(index) }, title: t.removeSite, style: { border: 0, background: 'none', color: 'var(--dsw-alias-state-error-primary, #b3261e)', cursor: 'pointer', fontSize: '12px' } }, t.removeSite),
                      ),
                      h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' } },
                        h(Input, { value: site.name || '', placeholder: t.siteName, onChange: function (event) { updateSite(index, 'name', event.target.value) } }),
                        h(Input, { type: 'password', value: site.apiKey || '', placeholder: site.hasKey ? t.stored : t.apiKey, onChange: function (event) { updateSiteFields(index, { apiKey: event.target.value, keyDirty: true }) } }),
                        h(Input, { value: site.baseUrl || '', placeholder: t.baseUrl, onChange: function (event) { updateSite(index, 'baseUrl', event.target.value) } }),
                        h(Input, { value: site.model || '', placeholder: t.model, onChange: function (event) { updateSite(index, 'model', event.target.value) } }),
                      ),
                    )
                  })
                  var siteChain = fieldRow(
                    h('span', null, t.sitesTitle, h('span', { style: { display: 'block', marginTop: '4px', fontSize: '12px', fontWeight: 400, color: 'var(--dsw-alias-label-tertiary, rgba(127,127,127,0.8))' } }, t.sitesHint)),
                    h('div', null,
                      siteRows.length > 0 ? siteRows : h('div', { style: { fontSize: '13px', color: 'var(--dsw-alias-label-tertiary, rgba(127,127,127,0.8))', padding: '4px 0 8px' } }, t.siteEmpty),
                      h('button', { type: 'button', onClick: addSite, style: { marginTop: '4px', border: '1px solid var(--dsw-alias-border-l2, rgba(127,127,127,0.35))', borderRadius: '8px', padding: '5px 10px', background: 'transparent', color: 'inherit', cursor: 'pointer', font: 'inherit', fontSize: '12px' } }, '+ ' + t.addSite),
                    ),
                    'openai-sites',
                    t.sitesTitle,
                  )
      
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
                    siteChain,
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
                        : !showLegacyOpenaiFields
                          ? null
                          : textField(t.apiKey, 'apiKey', 'password', current.hasKey ? t.stored : t.unset),
                    draft.provider === '' || keyless || !showLegacyOpenaiFields ? null : textField(t.baseUrl, 'baseUrl', 'text', t.fallback),
                    draft.provider === '' || !showLegacyOpenaiFields ? null : textField(t.model, 'model', 'text', t.fallback),
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
      
      // guard/src/client.js
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
          border: "1px solid color-mix(in srgb, var(--dsw-alias-border-l2, #e5e7eb) 88%, transparent)",
          borderRadius: 14,
          padding: "16px 18px 18px",
          marginBottom: 16,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          background: "color-mix(in srgb, var(--dsw-alias-bg-base, #ffffff) 84%, transparent)",
          boxShadow: "0 8px 24px rgb(0 0 0 / 0.08), inset 0 1px 0 rgb(255 255 255 / 0.06)"
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
        grid: { display: "grid", gridTemplateColumns: "minmax(110px, 180px) 1fr", gap: "12px 18px", fontSize: 15 },
        key: { color: "var(--dsw-alias-label-tertiary, #6b7280)" },
        val: { wordBreak: "break-word" },
        err: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 14 },
        btn: {
          padding: "7px 15px",
          fontSize: 15,
          borderRadius: 8,
          cursor: "pointer",
          border: "1px solid color-mix(in srgb, var(--dsw-alias-border-l2, #e5e7eb) 88%, transparent)",
          background: "color-mix(in srgb, var(--dsw-alias-bg-base, #ffffff) 60%, transparent)",
          color: "inherit",
          fontWeight: 600
        },
        foot: {
          fontSize: 14,
          lineHeight: 1.7,
          color: "var(--dsw-alias-label-tertiary, #6b7280)",
          borderTop: "1px solid color-mix(in srgb, var(--dsw-alias-border-l2, #e5e7eb) 70%, transparent)",
          paddingTop: 14
        }
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
      //# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZ3VhcmQvc3JjL2NsaWVudC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gZHNoLW1vZGxlbnMtZ3VhcmQgXHUyMDE0XHUyMDE0IGNsaWVudCBcdTdBRUZcdUZGMDhcdTZENEZcdTg5QzhcdTU2NjhcdUZGMDlcbi8vIFx1NTcyOFx1OEJCRVx1N0Y2RVx1OTg3NVx1NkNFOFx1NTE4Q1x1MzAwQ1x1ODlDNlx1ODlDOVx1NzJCNlx1NjAwMVx1MzAwRHNlY3Rpb25cdUZGMUFcdTY2M0VcdTc5M0FcdTdFQUZcdTY1ODdcdTY3MkNcdTZBMjFcdTU3OEJcdTc2ODRcdTU2RkVcdTcyNDdcdThCQzZcdTUyMkJcdTk0RkVcdThERUZcdTY2MkZcdTU0MjZcdTUzRUZcdTc1MjhcdTMwMDJcbi8vIFx1N0VBRlx1NjU4N1x1NjcyQ1x1NkEyMVx1NTc4Qlx1NjUzNlx1NTIzMFx1NTZGRVx1NzI0N1x1NjVGNlx1NzUzMSBNb2RMZW5zIFx1NTcyOFx1NTNEMVx1OTAwMVx1NTI0RFx1OEY2Q1x1NTE5OVx1RkYxQlx1NTM5Rlx1NzUxRlx1NTkxQVx1NkEyMVx1NjAwMVx1NkEyMVx1NTc4Qlx1NEUwRFx1NTNEN1x1NUY3MVx1NTRDRFx1MzAwMlxuaW1wb3J0IHsgdXNlU3RhdGUsIHVzZUVmZmVjdCwgdXNlQ2FsbGJhY2sgfSBmcm9tIFwicmVhY3RcIjtcblxuY29uc3QgTlMgPSBcInNldHRpbmdzLm1vZGxlbnMtZ3VhcmRcIjtcblxuY29uc3QgVE9ORSA9IHtcbiAgcmVhZHk6IHsgZmc6IFwiIzBmN2IzZlwiLCBiZzogXCJyZ2JhKDE2LDE2Myw3NCwwLjEyKVwiLCBib3JkZXI6IFwicmdiYSgxNiwxNjMsNzQsMC4zNSlcIiB9LFxuICB1bmNvbmZpZ3VyZWQ6IHsgZmc6IFwiIzhhNTMwMFwiLCBiZzogXCJyZ2JhKDIxNywxMTksNiwwLjEyKVwiLCBib3JkZXI6IFwicmdiYSgyMTcsMTE5LDYsMC4zNSlcIiB9LFxuICBmYWlsaW5nOiB7IGZnOiBcIiNiMzI2MWVcIiwgYmc6IFwicmdiYSgyMjAsMzgsMzgsMC4xMilcIiwgYm9yZGVyOiBcInJnYmEoMjIwLDM4LDM4LDAuMzUpXCIgfSxcbiAgb2ZmOiB7IGZnOiBcIiM1YjYyNzBcIiwgYmc6IFwicmdiYSgxMDcsMTE0LDEyOCwwLjEyKVwiLCBib3JkZXI6IFwicmdiYSgxMDcsMTE0LDEyOCwwLjM1KVwiIH1cbn07XG5cbmNvbnN0IGNzcyA9IHtcbiAgc2VjdGlvbjogeyBtYXhXaWR0aDogNzYwLCBjb2xvcjogXCJ2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgIzFmMjMyOSlcIiwgZm9udEZhbWlseTogXCJpbmhlcml0XCIgfSxcbiAgaGVybzogeyBkaXNwbGF5OiBcImZsZXhcIiwgYWxpZ25JdGVtczogXCJjZW50ZXJcIiwgZ2FwOiAxNCwgbWFyZ2luQm90dG9tOiAxMiB9LFxuICBoZXJvSWNvbjogeyBmbGV4OiBcIm5vbmVcIiwgY29sb3I6IFwidmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNmI3MjgwKVwiIH0sXG4gIGhlcm9UaXRsZTogeyBmb250U2l6ZTogMjAsIGZvbnRXZWlnaHQ6IDY1MCwgbGV0dGVyU3BhY2luZzogMC4yIH0sXG4gIGhlcm9NZXRhOiB7IGZvbnRTaXplOiAxNCwgY29sb3I6IFwidmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNmI3MjgwKVwiIH0sXG4gIGxlYWQ6IHsgZm9udFNpemU6IDE1LCBsaW5lSGVpZ2h0OiAxLjcsIGNvbG9yOiBcInZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzZiNzI4MClcIiwgbWFyZ2luOiBcIjAgMCAxOHB4XCIgfSxcbiAgY2FyZDoge1xuICAgIGJvcmRlcjogXCIxcHggc29saWQgY29sb3ItbWl4KGluIHNyZ2IsIHZhcigtLWRzdy1hbGlhcy1ib3JkZXItbDIsICNlNWU3ZWIpIDg4JSwgdHJhbnNwYXJlbnQpXCIsXG4gICAgYm9yZGVyUmFkaXVzOiAxNCxcbiAgICBwYWRkaW5nOiBcIjE2cHggMThweCAxOHB4XCIsXG4gICAgbWFyZ2luQm90dG9tOiAxNixcbiAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICBmbGV4RGlyZWN0aW9uOiBcImNvbHVtblwiLFxuICAgIGdhcDogMTQsXG4gICAgYmFja2dyb3VuZDogXCJjb2xvci1taXgoaW4gc3JnYiwgdmFyKC0tZHN3LWFsaWFzLWJnLWJhc2UsICNmZmZmZmYpIDg0JSwgdHJhbnNwYXJlbnQpXCIsXG4gICAgYm94U2hhZG93OiBcIjAgOHB4IDI0cHggcmdiKDAgMCAwIC8gMC4wOCksIGluc2V0IDAgMXB4IDAgcmdiKDI1NSAyNTUgMjU1IC8gMC4wNilcIlxuICB9LFxuICByb3c6IHsgZGlzcGxheTogXCJmbGV4XCIsIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsIGdhcDogMTIsIGZsZXhXcmFwOiBcIndyYXBcIiB9LFxuICBiYWRnZToge1xuICAgIGRpc3BsYXk6IFwiaW5saW5lLWZsZXhcIixcbiAgICBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLFxuICAgIGdhcDogOCxcbiAgICBwYWRkaW5nOiBcIjZweCAxNHB4XCIsXG4gICAgYm9yZGVyUmFkaXVzOiA5OTksXG4gICAgZm9udFNpemU6IDE1LFxuICAgIGZvbnRXZWlnaHQ6IDY1MCxcbiAgICBib3JkZXI6IFwiMXB4IHNvbGlkXCJcbiAgfSxcbiAgZG90OiB7IHdpZHRoOiA5LCBoZWlnaHQ6IDksIGJvcmRlclJhZGl1czogOTk5LCBiYWNrZ3JvdW5kOiBcImN1cnJlbnRDb2xvclwiIH0sXG4gIGhpbnQ6IHsgZm9udFNpemU6IDE1LCBsaW5lSGVpZ2h0OiAxLjcgfSxcbiAgZ3JpZDogeyBkaXNwbGF5OiBcImdyaWRcIiwgZ3JpZFRlbXBsYXRlQ29sdW1uczogXCJtaW5tYXgoMTEwcHgsIDE4MHB4KSAxZnJcIiwgZ2FwOiBcIjEycHggMThweFwiLCBmb250U2l6ZTogMTUgfSxcbiAga2V5OiB7IGNvbG9yOiBcInZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzZiNzI4MClcIiB9LFxuICB2YWw6IHsgd29yZEJyZWFrOiBcImJyZWFrLXdvcmRcIiB9LFxuICBlcnI6IHsgZm9udEZhbWlseTogXCJ1aS1tb25vc3BhY2UsIFNGTW9uby1SZWd1bGFyLCBNZW5sbywgbW9ub3NwYWNlXCIsIGZvbnRTaXplOiAxNCB9LFxuICBidG46IHtcbiAgICBwYWRkaW5nOiBcIjdweCAxNXB4XCIsXG4gICAgZm9udFNpemU6IDE1LFxuICAgIGJvcmRlclJhZGl1czogOCxcbiAgICBjdXJzb3I6IFwicG9pbnRlclwiLFxuICAgIGJvcmRlcjogXCIxcHggc29saWQgY29sb3ItbWl4KGluIHNyZ2IsIHZhcigtLWRzdy1hbGlhcy1ib3JkZXItbDIsICNlNWU3ZWIpIDg4JSwgdHJhbnNwYXJlbnQpXCIsXG4gICAgYmFja2dyb3VuZDogXCJjb2xvci1taXgoaW4gc3JnYiwgdmFyKC0tZHN3LWFsaWFzLWJnLWJhc2UsICNmZmZmZmYpIDYwJSwgdHJhbnNwYXJlbnQpXCIsXG4gICAgY29sb3I6IFwiaW5oZXJpdFwiLFxuICAgIGZvbnRXZWlnaHQ6IDYwMFxuICB9LFxuICBmb290OiB7XG4gICAgZm9udFNpemU6IDE0LFxuICAgIGxpbmVIZWlnaHQ6IDEuNyxcbiAgICBjb2xvcjogXCJ2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2YjcyODApXCIsXG4gICAgYm9yZGVyVG9wOiBcIjFweCBzb2xpZCBjb2xvci1taXgoaW4gc3JnYiwgdmFyKC0tZHN3LWFsaWFzLWJvcmRlci1sMiwgI2U1ZTdlYikgNzAlLCB0cmFuc3BhcmVudClcIixcbiAgICBwYWRkaW5nVG9wOiAxNFxuICB9XG59O1xuXG5mdW5jdGlvbiBIZXJvSWNvbigpIHtcbiAgcmV0dXJuIChcbiAgICA8c3ZnIHdpZHRoPVwiMzRcIiBoZWlnaHQ9XCIzNFwiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZVdpZHRoPVwiMS43XCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+XG4gICAgICA8cGF0aCBkPVwiTTQgNy41IDEyIDNsOCA0LjV2OUwxMiAyMWwtOC00LjV6XCIgc3Ryb2tlTGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiIC8+XG4gICAgICA8cGF0aCBkPVwibTQgNy41IDggNC41IDgtNC41TTEyIDEydjlcIiBzdHJva2VMaW5lY2FwPVwicm91bmRcIiBzdHJva2VMaW5lam9pbj1cInJvdW5kXCIgLz5cbiAgICAgIDxjaXJjbGUgY3g9XCIxMlwiIGN5PVwiMTJcIiByPVwiMi4xXCIgZmlsbD1cImN1cnJlbnRDb2xvclwiIHN0cm9rZT1cIm5vbmVcIiAvPlxuICAgIDwvc3ZnPlxuICApO1xufVxuXG5mdW5jdGlvbiBzdGFtcCh2YWx1ZSwgbmV2ZXIpIHtcbiAgaWYgKCF2YWx1ZSkgcmV0dXJuIG5ldmVyO1xuICB0cnkge1xuICAgIHJldHVybiBuZXcgSW50bC5EYXRlVGltZUZvcm1hdCh1bmRlZmluZWQsIHsgZGF0ZVN0eWxlOiBcIm1lZGl1bVwiLCB0aW1lU3R5bGU6IFwibWVkaXVtXCIgfSkuZm9ybWF0KG5ldyBEYXRlKHZhbHVlKSk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBTdHJpbmcodmFsdWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIE1vZGxlbnNHdWFyZFNlY3Rpb24oeyB0IH0pIHtcbiAgY29uc3QgW3N0YXR1cywgc2V0U3RhdHVzXSA9IHVzZVN0YXRlKG51bGwpO1xuICBjb25zdCBbZXJyb3IsIHNldEVycm9yXSA9IHVzZVN0YXRlKFwiXCIpO1xuICBjb25zdCBbbG9hZGluZywgc2V0TG9hZGluZ10gPSB1c2VTdGF0ZSh0cnVlKTtcbiAgY29uc3QgW3Byb2JpbmcsIHNldFByb2JpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIGNvbnN0IGxvYWQgPSB1c2VDYWxsYmFjayhhc3luYyAoKSA9PiB7XG4gICAgc2V0TG9hZGluZyh0cnVlKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goXCIvbW9kbGVucy1ndWFyZC9zdGF0dXNcIik7XG4gICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmICghcmVzLm9rIHx8IGJvZHkub2sgIT09IHRydWUpIHRocm93IG5ldyBFcnJvcihib2R5LmVycm9yIHx8IGBIVFRQICR7cmVzLnN0YXR1c31gKTtcbiAgICAgIHNldFN0YXR1cyhib2R5LnN0YXR1cyk7XG4gICAgICBzZXRFcnJvcihcIlwiKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBzZXRFcnJvcihlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSkpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRMb2FkaW5nKGZhbHNlKTtcbiAgICB9XG4gIH0sIFtdKTtcblxuICBjb25zdCBwcm9iZSA9IHVzZUNhbGxiYWNrKGFzeW5jICgpID0+IHtcbiAgICBzZXRQcm9iaW5nKHRydWUpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChcIi9tb2RsZW5zLWd1YXJkL3Byb2JlXCIsIHsgbWV0aG9kOiBcIlBPU1RcIiB9KTtcbiAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgc2V0U3RhdHVzKGJvZHkuc3RhdHVzID8/IG51bGwpO1xuICAgICAgaWYgKCFyZXMub2sgfHwgYm9keS5vayAhPT0gdHJ1ZSkgdGhyb3cgbmV3IEVycm9yKGJvZHkucmVzdWx0Py5lcnJvciB8fCBib2R5LmVycm9yIHx8IGBIVFRQICR7cmVzLnN0YXR1c31gKTtcbiAgICAgIHNldEVycm9yKFwiXCIpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHNldEVycm9yKGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldFByb2JpbmcoZmFsc2UpO1xuICAgIH1cbiAgfSwgW10pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgdm9pZCBsb2FkKCk7XG4gICAgY29uc3QgdGltZXIgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoKCkgPT4gdm9pZCBsb2FkKCksIDE1MDAwKTtcbiAgICByZXR1cm4gKCkgPT4gd2luZG93LmNsZWFySW50ZXJ2YWwodGltZXIpO1xuICB9LCBbbG9hZF0pO1xuXG4gIGNvbnN0IHN0YXRlID0gc3RhdHVzPy5zdGF0ZSA/PyBcIm9mZlwiO1xuICBjb25zdCB0b25lID0gVE9ORVtzdGF0ZV0gPz8gVE9ORS5vZmY7XG4gIGNvbnN0IHN0YXRlTGFiZWwgPSB0KFxuICAgIHN0YXRlID09PSBcInJlYWR5XCIgPyBcInN0YXRlUmVhZHlcIiA6IHN0YXRlID09PSBcInVuY29uZmlndXJlZFwiID8gXCJzdGF0ZVVuY29uZmlndXJlZFwiIDogc3RhdGUgPT09IFwiZmFpbGluZ1wiID8gXCJzdGF0ZUZhaWxpbmdcIiA6IFwic3RhdGVPZmZcIlxuICApO1xuICBjb25zdCBzdGF0ZUhpbnQgPSB0KFxuICAgIHN0YXRlID09PSBcInJlYWR5XCIgPyBcInJlYWR5SGludFwiIDogc3RhdGUgPT09IFwidW5jb25maWd1cmVkXCIgPyBcInVuY29uZmlndXJlZEhpbnRcIiA6IHN0YXRlID09PSBcImZhaWxpbmdcIiA/IFwiZmFpbGluZ0hpbnRcIiA6IFwib2ZmSGludFwiXG4gICk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHN0eWxlPXtjc3Muc2VjdGlvbn0+XG4gICAgICA8ZGl2IHN0eWxlPXtjc3MuaGVyb30+XG4gICAgICAgIDxzcGFuIHN0eWxlPXtjc3MuaGVyb0ljb259PlxuICAgICAgICAgIDxIZXJvSWNvbiAvPlxuICAgICAgICA8L3NwYW4+XG4gICAgICAgIDxkaXY+XG4gICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLmhlcm9UaXRsZX0+e3QoXCJuYXZcIil9PC9kaXY+XG4gICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLmhlcm9NZXRhfT57dChcImhlcm9NZXRhXCIpfTwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPHAgc3R5bGU9e2Nzcy5sZWFkfT57dChcImxlYWRcIil9PC9wPlxuXG4gICAgICA8ZGl2IHN0eWxlPXtjc3MuY2FyZH0+XG4gICAgICAgIDxkaXYgc3R5bGU9e2Nzcy5yb3d9PlxuICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IC4uLmNzcy5iYWRnZSwgY29sb3I6IHRvbmUuZmcsIGJhY2tncm91bmQ6IHRvbmUuYmcsIGJvcmRlckNvbG9yOiB0b25lLmJvcmRlciB9fT5cbiAgICAgICAgICAgIDxzcGFuIHN0eWxlPXtjc3MuZG90fSAvPlxuICAgICAgICAgICAge3N0YXRlTGFiZWx9XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIHN0eWxlPXtjc3MuYnRufSBvbkNsaWNrPXsoKSA9PiB2b2lkIHByb2JlKCl9IGRpc2FibGVkPXtsb2FkaW5nIHx8IHByb2Jpbmd9PlxuICAgICAgICAgICAge3Byb2JpbmcgPyB0KFwicHJvYmluZ1wiKSA6IHQoXCJyZWZyZXNoXCIpfVxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IHN0eWxlPXtjc3MuaGludH0+e3N0YXRlSGludH08L2Rpdj5cbiAgICAgICAge2Vycm9yICE9PSBcIlwiICYmIDxkaXYgc3R5bGU9e3sgLi4uY3NzLmhpbnQsIGNvbG9yOiBUT05FLmZhaWxpbmcuZmcgfX0+e2Ake3QoXCJsb2FkRmFpbGVkXCIpfTogJHtlcnJvcn1gfTwvZGl2Pn1cblxuICAgICAgICB7c3RhdHVzICE9PSBudWxsICYmIChcbiAgICAgICAgICA8ZGl2IHN0eWxlPXtjc3MuZ3JpZH0+XG4gICAgICAgICAgICA8ZGl2IHN0eWxlPXtjc3Mua2V5fT57dChcImJyaWRnZVwiKX08L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy52YWx9PntzdGF0dXMucGx1Z2luTG9hZGVkID8gdChcImJyaWRnZU9uXCIpIDogdChcImJyaWRnZU9mZlwiKX08L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLmtleX0+e3QoXCJlbmdpbmVzXCIpfTwvZGl2PlxuICAgICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLnZhbH0+e3N0YXR1cy5lbmdpbmVzPy5sZW5ndGggPiAwID8gc3RhdHVzLmVuZ2luZXMuam9pbihcIiwgXCIpIDogdChcIm5vbmVcIil9PC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy5rZXl9Pnt0KFwicGlubmVkXCIpfTwvZGl2PlxuICAgICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLnZhbH0+e3N0YXR1cy5waW5uZWQgfHwgdChcInBpbm5lZEF1dG9cIil9PC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy5rZXl9Pnt0KFwidmlzaW9uTW9kZWxzXCIpfTwvZGl2PlxuICAgICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLnZhbH0+e3N0YXR1cy52aXNpb25Qcm92aWRlcnM/Lmxlbmd0aCA+IDAgPyBzdGF0dXMudmlzaW9uUHJvdmlkZXJzLmpvaW4oXCIsIFwiKSA6IHQoXCJub25lXCIpfTwvZGl2PlxuXG4gICAgICAgICAgICA8ZGl2IHN0eWxlPXtjc3Mua2V5fT57dChcImxhc3RQcm9iZVwiKX08L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy52YWx9PntzdGF0dXMucHJvYmVBdCA/IHN0YW1wKHN0YXR1cy5wcm9iZUF0LCB0KFwibmV2ZXJcIikpIDogdChcIm5ldmVyXCIpfTwvZGl2PlxuXG4gICAgICAgICAgICA8ZGl2IHN0eWxlPXtjc3Mua2V5fT57dChcInByb2JlUmVzdWx0XCIpfTwvZGl2PlxuICAgICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLnZhbH0+e3N0YXR1cy5wcm9iZU9rID09PSBudWxsID8gdChcIm5ldmVyXCIpIDogc3RhdHVzLnByb2JlT2sgPyB0KFwicHJvYmVPa1wiKSA6IHQoXCJwcm9iZUZhaWxlZFwiKX08L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLmtleX0+e3QoXCJwcm9iZUVuZ2luZVwiKX08L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy52YWx9PntzdGF0dXMucHJvYmVQcm92aWRlciB8fCB0KFwibm9uZVwiKX08L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLmtleX0+e3QoXCJwcm9iZU1vZGVsXCIpfTwvZGl2PlxuICAgICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLnZhbH0+e3N0YXR1cy5wcm9iZU1vZGVsIHx8IHQoXCJub25lXCIpfTwvZGl2PlxuXG4gICAgICAgICAgICA8ZGl2IHN0eWxlPXtjc3Mua2V5fT57dChcInByb2JlRHVyYXRpb25cIil9PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IHN0eWxlPXtjc3MudmFsfT57dHlwZW9mIHN0YXR1cy5wcm9iZUR1cmF0aW9uTXMgPT09IFwibnVtYmVyXCIgPyB0KFwicHJvYmVEdXJhdGlvblZhbHVlXCIpLnJlcGxhY2UoXCJ7bXN9XCIsIFN0cmluZyhzdGF0dXMucHJvYmVEdXJhdGlvbk1zKSkgOiB0KFwibmV2ZXJcIil9PC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy5rZXl9Pnt0KFwibGFzdE9rXCIpfTwvZGl2PlxuICAgICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLnZhbH0+e3N0YW1wKHN0YXR1cy5sYXN0T2tBdCwgdChcIm5ldmVyXCIpKX08L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLmtleX0+e3QoXCJsYXN0RmFpbFwiKX08L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy52YWx9PntzdGFtcChzdGF0dXMubGFzdEZhaWxBdCwgdChcIm5ldmVyXCIpKX08L2Rpdj5cblxuICAgICAgICAgICAge3N0YXR1cy5sYXN0RXJyb3IgJiYgKFxuICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy5rZXl9Pnt0KFwibGFzdEVycm9yXCIpfTwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgLi4uY3NzLnZhbCwgLi4uY3NzLmVyciB9fT57c3RhdHVzLmxhc3RFcnJvcn08L2Rpdj5cbiAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICApfVxuXG4gICAgICAgICAgICA8ZGl2IHN0eWxlPXtjc3Mua2V5fT57dChcImNvdW50ZXJzXCIpfTwvZGl2PlxuICAgICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLnZhbH0+XG4gICAgICAgICAgICAgIHt0KFwiY291bnRlcnNWYWx1ZVwiKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKFwie3JlYWRzfVwiLCBTdHJpbmcoc3RhdHVzLnJlYWRzID8/IDApKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKFwie2ZhaWx1cmVzfVwiLCBTdHJpbmcoc3RhdHVzLmZhaWx1cmVzID8/IDApKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKFwie2Jsb2Nrc31cIiwgU3RyaW5nKHN0YXR1cy5ibG9ja3MgPz8gMCkpfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAgPGRpdiBzdHlsZT17Y3NzLmZvb3R9Pnt0KFwiY29uZmlnSGludFwiKX08L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApO1xufVxuXG5mdW5jdGlvbiBNb2RsZW5zVHVyblN0YXR1cyh7IG1hdGNoZWQsIHNlc3Npb25JZCB9KSB7XG4gIGNvbnN0IFtzdGF0dXMsIHNldFN0YXR1c10gPSB1c2VTdGF0ZShudWxsKTtcbiAgY29uc3QgdHVybiA9IG1hdGNoZWQ7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIXR1cm4gfHwgIU51bWJlci5pc0ludGVnZXIodHVybi50dXJuKSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBsZXQgY2FuY2VsbGVkID0gZmFsc2U7XG4gICAgbGV0IHRpbWVyO1xuICAgIGNvbnN0IGxvYWQgPSBhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGAvbW9kbGVucy1ndWFyZC90dXJuLXN0YXR1cz90dXJuPSR7ZW5jb2RlVVJJQ29tcG9uZW50KFN0cmluZyh0dXJuLnR1cm4pKX0mc2Vzc2lvbklkPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHNlc3Npb25JZCl9YCk7XG4gICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgICAgIGNvbnN0IG5leHQgPSBib2R5LnN0YXR1cyA/PyBudWxsO1xuICAgICAgICBpZiAoY2FuY2VsbGVkKSByZXR1cm47XG4gICAgICAgIHNldFN0YXR1cyhuZXh0KTtcbiAgICAgICAgaWYgKG5leHQ/LnN0YXRlID09PSBcInJlYWR5XCIgfHwgbmV4dD8uc3RhdGUgPT09IFwiZmFpbGVkXCIpIHtcbiAgICAgICAgICBpZiAodGltZXIpIHdpbmRvdy5jbGVhckludGVydmFsKHRpbWVyKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCB7fVxuICAgIH07XG4gICAgdm9pZCBsb2FkKCk7XG4gICAgdGltZXIgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoKCkgPT4gdm9pZCBsb2FkKCksIDUwMCk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGNhbmNlbGxlZCA9IHRydWU7XG4gICAgICBpZiAodGltZXIpIHdpbmRvdy5jbGVhckludGVydmFsKHRpbWVyKTtcbiAgICB9O1xuICB9LCBbdHVybiwgc2Vzc2lvbklkXSk7XG5cbiAgaWYgKCFzdGF0dXMgfHwgKHN0YXR1cy5zdGF0ZSAhPT0gXCJyZWFkeVwiICYmIHN0YXR1cy5zdGF0ZSAhPT0gXCJmYWlsZWRcIikpIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IGZhaWxlZCA9IHN0YXR1cy5zdGF0ZSA9PT0gXCJmYWlsZWRcIjtcbiAgcmV0dXJuIChcbiAgICA8ZGl2XG4gICAgICBzdHlsZT17e1xuICAgICAgICBjb2xvcjogZmFpbGVkID8gVE9ORS5mYWlsaW5nLmZnIDogXCJ2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2YjcyODApXCIsXG4gICAgICAgIGZvbnRTaXplOiAxMyxcbiAgICAgICAgbGluZUhlaWdodDogMS41LFxuICAgICAgICBtYXJnaW46IFwiNnB4IDAgMCAycHhcIlxuICAgICAgfX1cbiAgICA+XG4gICAgICB7ZmFpbGVkID8gXCJNb2RMZW5zIFx1MDBCNyBcdTU2RkVcdTcyNDdcdThCRkJcdTUzRDZcdTU5MzFcdThEMjVcIiA6IFwiTW9kTGVucyBcdTAwQjcgXHU1REYyXHU4QkZCXHU1M0Q2XHU1NkZFXHU3MjQ3XCJ9XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbmZ1bmN0aW9uIE1vZGxlbnNUdXJuVGFpbCh7IG1hdGNoZWQsIHNlc3Npb25JZCB9KSB7XG4gIHJldHVybiA8TW9kbGVuc1R1cm5TdGF0dXMgbWF0Y2hlZD17bWF0Y2hlZH0gc2Vzc2lvbklkPXtzZXNzaW9uSWR9IC8+O1xufVxuXG4vLyBcdTI1MDBcdTI1MDAgXHU2M0QyXHU0RUY2XHU1MTY1XHU1M0UzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuY29uc3QgaW5qZWN0ID0gW1wic2xvdHNcIiwgXCJsb2NhbGVcIl07XG5cbmNvbnN0IE5TX0RJQ1QgPSB7ICB6aDoge1xuICAgIG5hdjogXCJcdTg5QzZcdTg5QzlcdTcyQjZcdTYwMDFcIixcbiAgICBoZXJvTWV0YTogXCJcdTdFQUZcdTY1ODdcdTY3MkNcdTZBMjFcdTU3OEJcdTc2ODRcdTU2RkVcdTcyNDdcdThCQzZcdTUyMkJcdTcyQjZcdTYwMDFcIixcbiAgICBsZWFkOiBcIlx1N0VBRlx1NjU4N1x1NjcyQ1x1NkEyMVx1NTc4Qlx1NjUzNlx1NTIzMFx1NTZGRVx1NzI0N1x1NjVGNlx1RkYwQ1x1NzUzMSBNb2RMZW5zIFx1NTcyOFx1NTNEMVx1OTAwMVx1NTI0RFx1NjI4QVx1NTZGRVx1NzI0N1x1OEY2Q1x1NjIxMFx1NjU4N1x1NUI1N1x1OEJDMVx1NjM2RVx1RkYxQlx1NTM5Rlx1NzUxRlx1NTkxQVx1NkEyMVx1NjAwMVx1NkEyMVx1NTc4Qlx1NEUwRFx1NTNEN1x1NUY3MVx1NTRDRFx1MzAwMlx1NkI2NFx1OTg3NVx1NjYzRVx1NzkzQVx1OEJDNlx1NTIyQlx1OTRGRVx1OERFRlx1NUY1M1x1NTI0RFx1NjYyRlx1NTQyNlx1NTNFRlx1NzUyOFx1MzAwMlwiLFxuICAgIHN0YXRlUmVhZHk6IFwiXHU1M0VGXHU3NTI4XCIsXG4gICAgc3RhdGVVbmNvbmZpZ3VyZWQ6IFwiXHU2NzJBXHU5MTREXHU3RjZFXCIsXG4gICAgc3RhdGVGYWlsaW5nOiBcIlx1OEJDNlx1NTIyQlx1NTkzMVx1OEQyNVwiLFxuICAgIHN0YXRlT2ZmOiBcIlx1NjcyQVx1NTJBMFx1OEY3RFwiLFxuICAgIHJlYWR5SGludDogXCJcdTdFQUZcdTY1ODdcdTY3MkNcdTZBMjFcdTU3OEJcdTUzRDFcdTkwMDFcdTU2RkVcdTcyNDdcdTY1RjZcdTRGMUFcdTgxRUFcdTUyQThcdThCQzZcdTUyMkJcdUZGMUJcdTUzRUZcdTk2OEZcdTY1RjZcdTYyNjdcdTg4NENcdTYzQTJcdTY3RTVcdTc4NkVcdThCQTRcdTVGNTNcdTUyNERcdTVGMTVcdTY0Q0VcdTc3MUZcdTVCOUVcdTUzRUZcdTc1MjhcdTMwMDJcIixcbiAgICB1bmNvbmZpZ3VyZWRIaW50OiBcIlx1NUMxQVx1NjcyQVx1OTE0RFx1N0Y2RVx1ODlDNlx1ODlDOVx1NUYxNVx1NjRDRVx1MzAwMlx1N0VBRlx1NjU4N1x1NjcyQ1x1NkEyMVx1NTc4Qlx1NTNEMVx1OTAwMVx1NTZGRVx1NzI0N1x1NjVGNlx1NEUwRFx1NEYxQVx1ODhBQlx1OEJDNlx1NTIyQlx1RkYwQ1x1NkEyMVx1NTc4Qlx1NEYxQVx1NjYwRVx1Nzg2RVx1NjUzNlx1NTIzMFx1MjAxQ1x1NTZGRVx1NzI0N1x1NjcyQVx1ODhBQlx1OEJGQlx1NTNENlx1MjAxRFx1NzY4NFx1NjNEMFx1NzkzQVx1RkYwQ1x1NEUwRFx1NEYxQVx1NTFFRFx1N0E3QVx1NzMxQ1x1NkQ0Qlx1NTZGRVx1NzI0N1x1NTE4NVx1NUJCOVx1MzAwMlwiLFxuICAgIGZhaWxpbmdIaW50OiBcIlx1NjcwMFx1OEZEMVx1NEUwMFx1NkIyMVx1OEJDNlx1NTIyQlx1NjIxNlx1NjNBMlx1NjdFNVx1NTkzMVx1OEQyNVx1MzAwMlx1NzBCOVx1NTFGQlx1MjAxQ1x1NjNBMlx1NjdFNVx1MjAxRFx1NEYxQVx1NzcxRlx1NUI5RVx1OEMwM1x1NzUyOFx1NUY1M1x1NTI0RFx1ODlDNlx1ODlDOVx1NUYxNVx1NjRDRVx1RkYxQlx1NjIxMFx1NTI5Rlx1NTQwRVx1N0FDQlx1NTM3M1x1NjA2Mlx1NTkwRFx1NEUzQVx1NTNFRlx1NzUyOFx1MzAwMlwiLFxuICAgIG9mZkhpbnQ6IFwiTW9kTGVucyBcdTY3MkFcdTVCODlcdTg4QzVcdTYyMTZcdTY3MkFcdTUyQTBcdThGN0RcdUZGMENcdTU2RkVcdTcyNDdcdTY1RTBcdTZDRDVcdTg4QUJcdThCQzZcdTUyMkJcdTMwMDJcIixcbiAgICBicmlkZ2U6IFwiXHU4QkM2XHU1MjJCXHU2ODY1XCIsXG4gICAgYnJpZGdlT246IFwiXHU1REYyXHU1MkEwXHU4RjdEXCIsXG4gICAgYnJpZGdlT2ZmOiBcIlx1NjcyQVx1NTJBMFx1OEY3RFwiLFxuICAgIGVuZ2luZXM6IFwiXHU1M0VGXHU3NTI4XHU1RjE1XHU2NENFXCIsXG4gICAgcGlubmVkOiBcIlx1NURGMlx1NTZGQVx1NUI5QVx1NUYxNVx1NjRDRVwiLFxuICAgIHZpc2lvbk1vZGVsczogXCJcdTg5QzZcdTg5QzlcdTY4NjVcdTZBMjFcdTU3OEJcIixcbiAgICBsYXN0UHJvYmU6IFwiXHU2NzAwXHU4RkQxXHU2M0EyXHU2N0U1XCIsXG4gICAgcHJvYmVSZXN1bHQ6IFwiXHU2M0EyXHU2N0U1XHU3RUQzXHU2NzlDXCIsXG4gICAgcHJvYmVPazogXCJcdTUzRUZcdTc1MjhcIixcbiAgICBwcm9iZUZhaWxlZDogXCJcdTRFMERcdTUzRUZcdTc1MjhcIixcbiAgICBwcm9iZUVuZ2luZTogXCJcdTYzQTJcdTY3RTVcdTVGMTVcdTY0Q0VcIixcbiAgICBwcm9iZU1vZGVsOiBcIlx1NjNBMlx1NjdFNVx1NkEyMVx1NTc4QlwiLFxuICAgIHByb2JlRHVyYXRpb246IFwiXHU2M0EyXHU2N0U1XHU4MDE3XHU2NUY2XCIsXG4gICAgcHJvYmVEdXJhdGlvblZhbHVlOiBcInttc30gbXNcIixcbiAgICBwaW5uZWRBdXRvOiBcIlx1ODFFQVx1NTJBOFx1RkYwOFx1NjU0NVx1OTY5Q1x1OEY2Q1x1NzlGQlx1OTRGRVx1RkYwOVwiLFxuICAgIG5vbmU6IFwiXHU2NUUwXCIsXG4gICAgbGFzdE9rOiBcIlx1NjcwMFx1OEZEMVx1NjIxMFx1NTI5RlwiLFxuICAgIGxhc3RGYWlsOiBcIlx1NjcwMFx1OEZEMVx1NTkzMVx1OEQyNVwiLFxuICAgIGxhc3RFcnJvcjogXCJcdTY3MDBcdTU0MEVcdTk1MTlcdThCRUZcIixcbiAgICBjb3VudGVyczogXCJcdTdEMkZcdThCQTFcIixcbiAgICBjb3VudGVyc1ZhbHVlOiBcIlx1NjIxMFx1NTI5RiB7cmVhZHN9IC8gXHU1OTMxXHU4RDI1IHtmYWlsdXJlc30gLyBcdTY3MkFcdThCQzZcdTUyMkIge2Jsb2Nrc31cIixcbiAgICBuZXZlcjogXCJcdTRFQ0VcdTY3MkFcIixcbiAgICByZWZyZXNoOiBcIlx1NTIzN1x1NjVCMFx1NzJCNlx1NjAwMVx1NUU3Nlx1NjNBMlx1NjdFNVwiLFxuICAgIHByb2Jpbmc6IFwiXHU2M0EyXHU2N0U1XHU0RTJEXHUyMDI2XCIsXG4gICAgbG9hZGluZzogXCJcdTUyQTBcdThGN0RcdTRFMkRcdTIwMjZcIixcbiAgICBsb2FkRmFpbGVkOiBcIlx1NjVFMFx1NkNENVx1OEJGQlx1NTNENlx1NzJCNlx1NjAwMVwiLFxuICAgIGNvbmZpZ0hpbnQ6IFwiXHU1RjE1XHU2NENFXHU5MTREXHU3RjZFXHU1NzI4XHUyMDFDXHU4QkJFXHU3RjZFIFx1MjE5MiBcdTYzRDJcdTRFRjYgXHUyMTkyIFx1ODlDNlx1ODlDOVx1NUYxNVx1NjRDRVx1RkYwOE1vZExlbnNcdUZGMDlcdTIwMURcdTRFMkRcdTRGRUVcdTY1MzlcdTMwMDJcdTUzOUZcdTc1MUZcdTU5MUFcdTZBMjFcdTYwMDFcdTZBMjFcdTU3OEJcdTU5Q0JcdTdFQzhcdTRGN0ZcdTc1MjhcdTgxRUFcdThFQUJcdTgwRkRcdTUyOUJcdUZGMENcdTRFMERcdTdFQ0ZcdThGQzdcdTZCNjRcdTk0RkVcdThERUZcdTMwMDJcIlxuICB9LFxuICBlbjoge1xuICAgIG5hdjogXCJWaXNpb24gU3RhdHVzXCIsXG4gICAgaGVyb01ldGE6IFwiSW1hZ2UgcmVhZGluZyBzdGF0dXMgZm9yIHRleHQtb25seSBtb2RlbHNcIixcbiAgICBsZWFkOiBcIldoZW4gYSB0ZXh0LW9ubHkgbW9kZWwgcmVjZWl2ZXMgYW4gaW1hZ2UsIE1vZExlbnMgY29udmVydHMgaXQgdG8gdGV4dCBldmlkZW5jZSBiZWZvcmUgdGhlIHJlcXVlc3QgaXMgc2VudC4gTmF0aXZlIG11bHRpbW9kYWwgbW9kZWxzIGFyZSB1bnRvdWNoZWQuIFRoaXMgcGFnZSBzaG93cyB3aGV0aGVyIHRoYXQgYnJpZGdlIHdvcmtzLlwiLFxuICAgIHN0YXRlUmVhZHk6IFwiUmVhZHlcIixcbiAgICBzdGF0ZVVuY29uZmlndXJlZDogXCJOb3QgY29uZmlndXJlZFwiLFxuICAgIHN0YXRlRmFpbGluZzogXCJGYWlsaW5nXCIsXG4gICAgc3RhdGVPZmY6IFwiTm90IGxvYWRlZFwiLFxuICAgIHJlYWR5SGludDogXCJJbWFnZXMgc2VudCB0byBhIHRleHQtb25seSBtb2RlbCBhcmUgcmVhZCBhdXRvbWF0aWNhbGx5LiBSdW4gYSBwcm9iZSBhdCBhbnkgdGltZSB0byB2ZXJpZnkgdGhlIGFjdGl2ZSBlbmdpbmUuXCIsXG4gICAgdW5jb25maWd1cmVkSGludDpcbiAgICAgIFwiTm8gdmlzaW9uIGVuZ2luZSBpcyBjb25maWd1cmVkLiBJbWFnZXMgc2VudCB0byBhIHRleHQtb25seSBtb2RlbCBhcmUgbm90IHJlYWQ7IHRoZSBtb2RlbCBpcyB0b2xkIGV4cGxpY2l0bHkgdGhhdCB0aGUgaW1hZ2Ugd2FzIG5vdCByZWFkIGFuZCB3aWxsIG5vdCBndWVzcyBhdCBpdHMgY29udGVudHMuXCIsXG4gICAgZmFpbGluZ0hpbnQ6XG4gICAgICBcIlRoZSBsYXRlc3QgaW1hZ2UgcmVhZCBvciBwcm9iZSBmYWlsZWQuIFJ1biBhIHByb2JlIHRvIGNhbGwgdGhlIGN1cnJlbnQgdmlzaW9uIGVuZ2luZTsgYSBzdWNjZXNzZnVsIHByb2JlIGltbWVkaWF0ZWx5IHJlc3RvcmVzIFJlYWR5LlwiLFxuICAgIG9mZkhpbnQ6IFwiTW9kTGVucyBpcyBub3QgaW5zdGFsbGVkIG9yIG5vdCBsb2FkZWQsIHNvIGltYWdlcyBjYW5ub3QgYmUgcmVhZC5cIixcbiAgICBicmlkZ2U6IFwiQnJpZGdlXCIsXG4gICAgYnJpZGdlT246IFwiTG9hZGVkXCIsXG4gICAgYnJpZGdlT2ZmOiBcIk5vdCBsb2FkZWRcIixcbiAgICBlbmdpbmVzOiBcIlVzYWJsZSBlbmdpbmVzXCIsXG4gICAgcGlubmVkOiBcIlBpbm5lZCBlbmdpbmVcIixcbiAgICB2aXNpb25Nb2RlbHM6IFwiVmlzaW9uIGJyaWRnZSBtb2RlbHNcIixcbiAgICBsYXN0UHJvYmU6IFwiTGFzdCBwcm9iZVwiLFxuICAgIHByb2JlUmVzdWx0OiBcIlByb2JlIHJlc3VsdFwiLFxuICAgIHByb2JlT2s6IFwiUmVhZHlcIixcbiAgICBwcm9iZUZhaWxlZDogXCJVbmF2YWlsYWJsZVwiLFxuICAgIHByb2JlRW5naW5lOiBcIlByb2JlIGVuZ2luZVwiLFxuICAgIHByb2JlTW9kZWw6IFwiUHJvYmUgbW9kZWxcIixcbiAgICBwcm9iZUR1cmF0aW9uOiBcIlByb2JlIGR1cmF0aW9uXCIsXG4gICAgcHJvYmVEdXJhdGlvblZhbHVlOiBcInttc30gbXNcIixcbiAgICBwaW5uZWRBdXRvOiBcIkF1dG9tYXRpYyAoZmFpbG92ZXIgY2hhaW4pXCIsXG4gICAgbm9uZTogXCJOb25lXCIsXG4gICAgbGFzdE9rOiBcIkxhc3Qgc3VjY2Vzc1wiLFxuICAgIGxhc3RGYWlsOiBcIkxhc3QgZmFpbHVyZVwiLFxuICAgIGxhc3RFcnJvcjogXCJMYXN0IGVycm9yXCIsXG4gICAgY291bnRlcnM6IFwiVG90YWxzXCIsXG4gICAgY291bnRlcnNWYWx1ZTogXCJ7cmVhZHN9IHJlYWQgLyB7ZmFpbHVyZXN9IGZhaWxlZCAvIHtibG9ja3N9IHVucmVhZFwiLFxuICAgIG5ldmVyOiBcIk5ldmVyXCIsXG4gICAgcmVmcmVzaDogXCJSZWZyZXNoIGFuZCBwcm9iZVwiLFxuICAgIHByb2Jpbmc6IFwiUHJvYmluZ1x1MjAyNlwiLFxuICAgIGxvYWRpbmc6IFwiTG9hZGluZ1x1MjAyNlwiLFxuICAgIGxvYWRGYWlsZWQ6IFwiQ2Fubm90IHJlYWQgc3RhdHVzXCIsXG4gICAgY29uZmlnSGludDpcbiAgICAgIFwiQ29uZmlndXJlIGVuZ2luZXMgdW5kZXIgU2V0dGluZ3MgXHUyMTkyIFBsdWdpbnMgXHUyMTkyIFZpc2lvbiBlbmdpbmUgKE1vZExlbnMpLiBOYXRpdmUgbXVsdGltb2RhbCBtb2RlbHMgYWx3YXlzIHVzZSB0aGVpciBvd24gY2FwYWJpbGl0eSBhbmQgbmV2ZXIgcGFzcyB0aHJvdWdoIHRoaXMgYnJpZGdlLlwiXG4gIH1cbn07XG5cbmZ1bmN0aW9uIGFwcGx5KGN0eCkge1xuICBjdHguZWZmZWN0KCgpID0+IGN0eC5sb2NhbGUucmVnaXN0ZXIoTlMsIE5TX0RJQ1QpLCBcIm1vZGxlbnMtZ3VhcmQ6IGNvcHkgZGljdGlvbmFyaWVzXCIpO1xuICBjb25zdCB0ID0gY3R4LmxvY2FsZS5iaW5kKE5TKTtcbiAgY29uc3QgaW5qZWN0ZWQgPSAoKSA9PiAoeyB0IH0pO1xuICBjdHguc2xvdHMuaW5qZWN0KFwiY29udmVyc2F0aW9uLmNoYXQudHVyblRhaWxcIiwgKCkgPT5cbiAgICBjdHguc2xvdHMucmVnaXN0ZXIoXG4gICAgICB7XG4gICAgICAgIG5hbWU6IFwiY29udmVyc2F0aW9uLmNoYXQudHVyblRhaWxcIixcbiAgICAgICAgc2VsZWN0OiAob3duZXIpID0+IG93bmVyPy50dXJuID8/IG51bGwsXG4gICAgICAgIGxvY2FsZTogTlNcbiAgICAgIH0sXG4gICAgICBNb2RsZW5zVHVyblRhaWxcbiAgICApXG4gICk7XG4gIGN0eC5zbG90cy5pbmplY3QoXCJzZXR0aW5ncy5zZWN0aW9uXCIsICgpID0+XG4gICAgY3R4LnNsb3RzLnJlZ2lzdGVyKFxuICAgICAge1xuICAgICAgICBuYW1lOiBcInNldHRpbmdzLnNlY3Rpb25cIixcbiAgICAgICAgaWQ6IFwibW9kbGVucy1ndWFyZFwiLFxuICAgICAgICBvcmRlcjogMTIsXG4gICAgICAgIGxhYmVsOiAoKSA9PiB0KFwibmF2XCIpLFxuICAgICAgICBpbmplY3Q6IGluamVjdGVkXG4gICAgICB9LFxuICAgICAgTW9kbGVuc0d1YXJkU2VjdGlvblxuICAgIClcbiAgKTtcbn1cblxuZXhwb3J0IHsgYXBwbHksIGluamVjdCwgTlMsIE1vZGxlbnNHdWFyZFNlY3Rpb24gfTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBR0EsbUJBQWlEO0FBbUU3QztBQWpFSixJQUFNLEtBQUs7QUFFWCxJQUFNLE9BQU87QUFBQSxFQUNYLE9BQU8sRUFBRSxJQUFJLFdBQVcsSUFBSSx3QkFBd0IsUUFBUSx1QkFBdUI7QUFBQSxFQUNuRixjQUFjLEVBQUUsSUFBSSxXQUFXLElBQUksd0JBQXdCLFFBQVEsdUJBQXVCO0FBQUEsRUFDMUYsU0FB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
      
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
