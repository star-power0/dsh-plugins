// Browser half of the modlens dsh plugin: paste-to-path.
//
// A capture-phase paste listener runs before the composer's own handler.
// When the clipboard carries image files, the default intake (attachment ->
// host image admission -> "model does not support images" for text-only
// models) is suppressed; the bytes go to the plugin's host route
// (POST /modlens/paste), land as a private temp file, and the returned path
// is inserted into the composer as plain text. A text-only model then sees
// exactly what Pi, OpenCode, and Claude Code hand their models: a file path,
// which is also the modlens skill's and the read tool's primary trigger.
//
// Hand-written in the lazy-CJS bundle protocol (window.__ModuleLoader__.load
// with a factory returning cordis-plugin exports), so no build step and no
// imports from dsh client packages — the same zero-dependency stance as the
// host half.
window.__ModuleLoader__.load({
  id: '@liustack/modlens',
  factory: (require) => {
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
  },
})
