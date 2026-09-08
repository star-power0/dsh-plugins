/**
 * dsh-remote-control — 手机端页面（服务端渲染的单文件 HTML）。
 *
 * 两个状态：未配对 → 配对页（输码换令牌）；已配对 → M2 控制面
 * （会话列表 / 消息流 / 发指令 / 中止 / 模型切换）。零外部资源：
 * 内联 CSS/JS，系统字体，深色优先；消息内容一律用 DOM textContent
 * 渲染（不走 innerHTML），天然免疫注入。
 */
/** HTML 属性/文本转义（配对码与设备名来自外部输入）。 */
function escapeHtml(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('"', '&quot;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}
/** JS 字符串字面量转义（注入 ?code= 预填值用）。 */
function escapeJs(value) {
    return JSON.stringify(value).replaceAll('<', '\\u003c');
}
const PAGE_STYLE = `
  :root { color-scheme: dark; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    min-height: 100dvh; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 20px; padding: 24px;
    background: #101014; color: #e8e8ee;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif;
  }
  .logo { line-height: 0; color: #8a8a96; }
  .logo svg { width: 44px; height: 44px; display: block; }
  h1 { font-size: 19px; font-weight: 600; }
  p.hint { font-size: 13px; color: #9a9aa6; line-height: 1.7; text-align: center; }
  .card {
    width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: 12px;
    background: #191920; border: 1px solid #2a2a33; border-radius: 14px; padding: 20px;
  }
  input {
    width: 100%; padding: 14px 12px; font-size: 22px; letter-spacing: 6px; text-align: center;
    background: #101014; color: #e8e8ee; border: 1px solid #33333d; border-radius: 10px;
    outline: none; caret-color: #4f7cff;
  }
  input:focus { border-color: #4f7cff; }
  button {
    padding: 13px; font-size: 15px; font-weight: 600; color: #fff;
    background: #3b5bdb; border: none; border-radius: 10px; cursor: pointer;
  }
  button:disabled { opacity: 0.5; cursor: default; }
  .msg { font-size: 13px; line-height: 1.6; min-height: 18px; text-align: center; }
  .msg.err { color: #ff7a7a; }
  .msg.ok { color: #6fcf97; }
  .meta { font-size: 12px; color: #6d6d78; text-align: center; }
  .stat { display: flex; justify-content: space-between; font-size: 14px; padding: 10px 0; border-bottom: 1px solid #23232b; }
  .stat:last-child { border-bottom: none; }
  .stat b { font-weight: 600; }
`;
/** 手机图标（配对页标识，替代 emoji；stroke 用 currentColor 跟随主题）。 */
const PHONE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 18.5h3"/></svg>`;
const BASE_HEAD = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="theme-color" content="#101014">
<title>DSH 远程控制</title>
<style>${PAGE_STYLE}</style>
<script>
/* Theme pre-hydration: apply the saved skin before the first paint. The
   default :root theme is dark, and the end-of-body script that used to set
   data-theme only ran after the whole document was parsed — on a phone the
   first frame was already on screen, so users saw a dark flash before their
   chosen light theme. Run this in <head>, then never repaint wrong. */
try {
  var t = localStorage.getItem('dshrc_theme');
  if (t) {
    document.documentElement.setAttribute('data-theme', t);
    var mc = { deep: '#0d1018', oled: '#000000', mist: '#eef1f7', sun: '#f2e9d9', pine: '#0d1713', sakura: '#f9ecf1' }[t];
    if (mc) {
      var m = document.querySelector('meta[name="theme-color"]');
      if (m) m.setAttribute('content', mc);
    }
  }
} catch (e) { }
</script>
</head>
<body>`;
/** 配对页：输入 8 位配对码，POST /remote/pair 换设备令牌。 */
export function renderPairPage(prefilledCode, errorText) {
    return `${BASE_HEAD}
<div class="logo">${PHONE_SVG}</div>
<h1>DSH 远程控制</h1>
<p class="hint">在电脑端 DSH「设置 → 远程控制」生成配对码，<br>输入后把这台手机接入桌面端。</p>
<div class="card">
  <input id="code" inputmode="numeric" autocomplete="one-time-code" maxlength="8"
         placeholder="········" value="${escapeHtml(prefilledCode)}">
  <button id="pair">配对</button>
  <div class="msg" id="msg">${escapeHtml(errorText)}</div>
</div>
<p class="meta">配对码 10 分钟有效、只能使用一次。</p>
<script>
(() => {
  const input = document.getElementById('code');
  const button = document.getElementById('pair');
  const msg = document.getElementById('msg');
  // 配对自愈：Cookie 被浏览器清掉时，用 localStorage 镜像的令牌恢复（PWA 重进不再要配对码）。
  // sessionStorage 旗标防「令牌已吊销」时的无限刷新；成功配对后清除。
  var saved = null;
  try { saved = localStorage.getItem('dshrc_token'); } catch (e) { }
  if (saved && !sessionStorage.getItem('dshrc_restore_tried')) {
    sessionStorage.setItem('dshrc_restore_tried', '1');
    document.cookie = 'dshrc_token=' + saved + '; Path=/; Max-Age=31536000; SameSite=Lax';
    msg.textContent = '正在恢复配对…';
    setTimeout(function () { location.reload(); }, 200);
    return;
  }
  async function submit() {
    const code = input.value.replace(/\\D/g, '');
    if (code.length !== 8) { msg.textContent = '请输入 8 位配对码'; msg.className = 'msg err'; return; }
    button.disabled = true;
    msg.textContent = '配对中…'; msg.className = 'msg';
    try {
      const res = await fetch('/remote/pair', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const body = await res.json();
      if (res.ok && body.ok) {
        try {
          localStorage.setItem('dshrc_token', body.token);
          sessionStorage.removeItem('dshrc_restore_tried');
        } catch (e) { }
        location.replace('/');
        return;
      }
      msg.textContent = body.error && body.error.message ? body.error.message : '配对失败';
      msg.className = 'msg err';
    } catch {
      msg.textContent = '网络错误，请重试';
      msg.className = 'msg err';
    }
    button.disabled = false;
  }
  button.addEventListener('click', submit);
  input.addEventListener('keydown', (event) => { if (event.key === 'Enter') submit(); });
})();
</script>
</body>
</html>`;
}
/** M2 控制面附加样式（叠加在 PAGE_STYLE 之上：body 改纵向流式布局）。
 *  配色全部走语义变量：默认「深海夜航」，html[data-theme] 切换六套主题。 */
const CONTROL_STYLE = `
  :root {
    --bg-base: #0d1018;
    --bg-image: radial-gradient(1100px 480px at 50% -8%, #182338 0%, rgba(24,35,56,0) 62%),
                radial-gradient(900px 420px at 108% 108%, #231a3d 0%, rgba(35,26,61,0) 58%),
                linear-gradient(180deg, #0d1018 0%, #090b10 100%);
    --text: #e8eaf0; --text-dim: #7b8496; --text-faint: #565e6e;
    --line: #1c212d; --line-soft: rgba(255,255,255,.06); --panel: rgba(255,255,255,.025); --panel-2: #161a23;
    --panel-hover: #141824; --panel-hover-line: #3b475e;
    --bar-bg: rgba(13,15,20,.88); --sheet-bg: #12151d; --overlay: rgba(4,6,10,.6);
    --accent: #5b7cfa; --accent-grad: linear-gradient(135deg, #3554c8, #6a4fd8);
    --accent-ink: #9db4ff; --accent-dim: rgba(80,100,220,.07);
    --bubble-user: linear-gradient(135deg, #3554c8, #5340c8); --bubble-user-text: #f2f4ff;
    --user-shadow: 0 2px 10px rgba(60,80,200,.25);
    --code-bg: #0f1219; --code-text: #b9c2d4;
    --ok: #4cc38a; --ok-border: #234a38; --err: #ff7676; --stop-bg: #6e2734; --hint: #8b93c8;
    --hint-dim: rgba(139,147,200,.14); --ok-dim: rgba(76,195,138,.13); --accent-chip: rgba(91,124,250,.16);
    --focus-line: #3d4c6e; --pop-shadow: 0 -6px 30px rgba(0,0,0,.5);
    --diff-add-bg: rgba(60,180,120,.13); --diff-add-ink: #8fe3b8; --diff-add-rule: #3fb984;
    --diff-del-bg: rgba(230,90,90,.13); --diff-del-ink: #ffb1b1; --diff-del-rule: #e46a6a;
  }
  html[data-theme="oled"] {
    --bg-base: #000;
    --bg-image: #000;
    --text: #eaeaea; --text-dim: #8a8a8a; --text-faint: #5a5a5a;
    --line: #222226; --line-soft: rgba(255,255,255,.07); --panel: rgba(255,255,255,.035); --panel-2: #101012;
    --panel-hover: #18181b; --panel-hover-line: #3f3f46;
    --bar-bg: rgba(5,5,7,.9); --sheet-bg: #0b0b0d; --overlay: rgba(0,0,0,.7);
    --accent: #5b7cfa; --accent-grad: linear-gradient(135deg, #2e4bd0, #5a3fd0);
    --accent-ink: #9db4ff; --accent-dim: rgba(80,100,220,.1);
    --bubble-user: linear-gradient(135deg, #2e4bd0, #5340c8); --bubble-user-text: #f2f4ff;
    --user-shadow: 0 2px 10px rgba(60,80,200,.2);
    --code-bg: #0c0c0e; --code-text: #c0c0c8;
    --ok: #4cc38a; --ok-border: #2c5c44; --err: #ff7676; --stop-bg: #5e2028; --hint: #8b93c8;
    --hint-dim: rgba(139,147,200,.16); --ok-dim: rgba(76,195,138,.14); --accent-chip: rgba(91,124,250,.18);
    --focus-line: #3d4c6e; --pop-shadow: 0 -6px 30px rgba(0,0,0,.8);
    --diff-add-bg: rgba(60,190,125,.12); --diff-add-ink: #86e0b3; --diff-add-rule: #34b87e;
    --diff-del-bg: rgba(235,90,90,.12); --diff-del-ink: #ffadad; --diff-del-rule: #e05f5f;
  }
  html[data-theme="mist"] {
    color-scheme: light;
    --bg-base: #eef1f7;
    --bg-image: linear-gradient(180deg, #f7f9fc 0%, #eef1f7 100%);
    --text: #1e2635; --text-dim: #5c6577; --text-faint: #8a93a5;
    --line: #dfe4ee; --line-soft: rgba(20,40,90,.08); --panel: #ffffff; --panel-2: #ffffff;
    --panel-hover: #eef2f9; --panel-hover-line: #b9c6dd;
    --bar-bg: rgba(255,255,255,.86); --sheet-bg: #ffffff; --overlay: rgba(15,23,42,.35);
    --accent: #3b6ae0; --accent-grad: linear-gradient(135deg, #3b6ae0, #6a5ae0);
    --accent-ink: #3452c8; --accent-dim: rgba(59,106,224,.08);
    --bubble-user: linear-gradient(135deg, #3b6ae0, #6a5ae0); --bubble-user-text: #ffffff;
    --user-shadow: 0 2px 8px rgba(59,106,224,.22);
    --code-bg: #f2f4fa; --code-text: #3a4358;
    --ok: #1f9d63; --ok-border: #9fd4bb; --err: #d84a4a; --stop-bg: #c25050; --hint: #5b6bc0;
    --hint-dim: rgba(91,107,192,.12); --ok-dim: rgba(31,157,99,.11); --accent-chip: rgba(59,106,224,.12);
    --focus-line: #a9bee8; --pop-shadow: 0 -6px 24px rgba(120,130,160,.25);
    --diff-add-bg: #dff5e9; --diff-add-ink: #10603d; --diff-add-rule: #1f9d63;
    --diff-del-bg: #fde4e4; --diff-del-ink: #8f2222; --diff-del-rule: #d84a4a;
  }
  html[data-theme="sun"] {
    color-scheme: light;
    --bg-base: #f2e9d9;
    --bg-image: linear-gradient(180deg, #faf6ee 0%, #f2e9d9 100%);
    --text: #3a2f22; --text-dim: #7d6f5b; --text-faint: #a3947d;
    --line: #e8ddc9; --line-soft: rgba(120,90,40,.1); --panel: #fffdf7; --panel-2: #fffdf7;
    --panel-hover: #f4ecdc; --panel-hover-line: #d3c2a0;
    --bar-bg: rgba(250,246,238,.88); --sheet-bg: #fffdf7; --overlay: rgba(80,60,30,.35);
    --accent: #c96f2d; --accent-grad: linear-gradient(135deg, #c96f2d, #d4943a);
    --accent-ink: #a85c1e; --accent-dim: rgba(201,111,45,.1);
    --bubble-user: linear-gradient(135deg, #c96f2d, #cf8a35); --bubble-user-text: #fff8ee;
    --user-shadow: 0 2px 8px rgba(201,111,45,.22);
    --code-bg: #f5efe1; --code-text: #5a4a34;
    --ok: #4d8f4d; --ok-border: #b9d2ab; --err: #c04444; --stop-bg: #b3543f; --hint: #a3702f;
    --hint-dim: rgba(163,112,47,.13); --ok-dim: rgba(77,143,77,.13); --accent-chip: rgba(201,111,45,.14);
    --focus-line: #d9bd94; --pop-shadow: 0 -6px 24px rgba(160,130,90,.25);
    --diff-add-bg: #e4f0dc; --diff-add-ink: #2f5c2f; --diff-add-rule: #4d8f4d;
    --diff-del-bg: #f8e2dc; --diff-del-ink: #8a2f22; --diff-del-rule: #c04444;
  }
  html[data-theme="pine"] {
    --bg-base: #0d1713;
    --bg-image: radial-gradient(900px 420px at 85% -6%, #14342a 0%, rgba(20,52,42,0) 60%),
                linear-gradient(180deg, #0d1713 0%, #090f0c 100%);
    --text: #dde9e2; --text-dim: #8aa398; --text-faint: #5d746a;
    --line: #1e2d26; --line-soft: rgba(120,220,170,.08); --panel: rgba(120,220,170,.045); --panel-2: #12201a;
    --panel-hover: #16281f; --panel-hover-line: #2f4a3c;
    --bar-bg: rgba(10,18,15,.88); --sheet-bg: #101b16; --overlay: rgba(3,10,7,.6);
    --accent: #35c088; --accent-grad: linear-gradient(135deg, #178a5c, #2aa877);
    --accent-ink: #7fd4ae; --accent-dim: rgba(53,192,136,.09);
    --bubble-user: linear-gradient(135deg, #178a5c, #1f8f6e); --bubble-user-text: #eafff5;
    --user-shadow: 0 2px 10px rgba(30,160,110,.22);
    --code-bg: #0c1611; --code-text: #b7cdc2;
    --ok: #4cc38a; --ok-border: #2c5c44; --err: #ff8b7a; --stop-bg: #713a34; --hint: #7fc0a4;
    --hint-dim: rgba(127,192,164,.15); --ok-dim: rgba(76,195,138,.14); --accent-chip: rgba(53,192,136,.15);
    --focus-line: #2f4a3c; --pop-shadow: 0 -6px 30px rgba(0,0,0,.5);
    --diff-add-bg: rgba(70,200,140,.14); --diff-add-ink: #92e8bd; --diff-add-rule: #3cbd88;
    --diff-del-bg: rgba(240,120,100,.13); --diff-del-ink: #ffb8a8; --diff-del-rule: #e87d6b;
  }
  html[data-theme="sakura"] {
    color-scheme: light;
    --bg-base: #f9ecf1;
    --bg-image: radial-gradient(900px 420px at 90% -6%, #fbe0ea 0%, rgba(251,224,234,0) 60%),
                linear-gradient(180deg, #fdf4f7 0%, #f9ecf1 100%);
    --text: #40323c; --text-dim: #8a7480; --text-faint: #b09aa6;
    --line: #f0dbe2; --line-soft: rgba(180,80,120,.1); --panel: #ffffff; --panel-2: #ffffff;
    --panel-hover: #f9e8ee; --panel-hover-line: #e3b9c8;
    --bar-bg: rgba(255,250,252,.88); --sheet-bg: #fff7fa; --overlay: rgba(64,40,52,.35);
    --accent: #d4627f; --accent-grad: linear-gradient(135deg, #d4627f, #b95a9e);
    --accent-ink: #b04565; --accent-dim: rgba(212,98,127,.08);
    --bubble-user: linear-gradient(135deg, #d4627f, #c05a9e); --bubble-user-text: #fff5f9;
    --user-shadow: 0 2px 8px rgba(212,98,127,.22);
    --code-bg: #f7edf1; --code-text: #6d5060;
    --ok: #2f9d6b; --ok-border: #a9d4bf; --err: #cc4466; --stop-bg: #c05a70; --hint: #c06a92;
    --hint-dim: rgba(192,106,146,.14); --ok-dim: rgba(47,157,107,.12); --accent-chip: rgba(212,98,127,.14);
    --focus-line: #e3b9c8; --pop-shadow: 0 -6px 24px rgba(180,120,150,.25);
    --diff-add-bg: #e2f2ea; --diff-add-ink: #1c6045; --diff-add-rule: #2f9d6b;
    --diff-del-bg: #fbe3ea; --diff-del-ink: #8e2544; --diff-del-rule: #cc4466;
  }
  body { display: block; padding: 0; color: var(--text);
         background: var(--bg-image); background-attachment: fixed; }
  /* 橡皮筋回弹露出的是 html 画布：涂上各主题底色，回弹区无缝衔接 */
  html { background: var(--bg-base); touch-action: manipulation; }
  /* touch-action: manipulation kills double-tap zoom as a second belt behind
     user-scalable=no: once zoomed, the whole page (fixed composer included)
     pans freely and reads as "drift". Vertical panning is untouched. */
  html[data-theme="mist"], html[data-theme="sun"], html[data-theme="sakura"] { color-scheme: light; }
  #bar { position: sticky; top: 0; z-index: 5; display: flex; align-items: center; gap: 8px;
         padding: 12px 16px; background: var(--bar-bg); border-bottom: 1px solid var(--line); }
  #bar h1 { font-size: 17.5px; font-weight: 650; margin: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  #bar button { padding: 8px 14px; font-size: 14.5px; border-radius: 9px; border: 1px solid var(--line);
                background: var(--panel-2); color: var(--text); cursor: pointer;
                transition: background .15s ease; }
  #bar button:active { background: var(--panel-hover); }
  #devline { position: sticky; top: 49px; z-index: 4; display: flex; align-items: center; flex-wrap: wrap; gap: 8px; padding: 8px 16px 7px; font-size: 12.5px; color: var(--text-faint); background: var(--bar-bg); border-bottom: 1px solid var(--line); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
  .conn-status { display: inline-flex; align-items: center; gap: 5px; padding: 3px 8px; border: 1px solid var(--line-soft); border-radius: 999px; font-size: 12px; line-height: 1.3; white-space: nowrap; color: var(--text-dim); }
  .conn-status .conn-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; background: var(--text-faint); }
  .conn-status.online { color: var(--ok); border-color: var(--ok-border); }
  .conn-status.online .conn-dot { background: var(--ok); }
  .conn-status.connecting { color: var(--accent-ink); border-color: var(--focus-line); }
  .conn-status.connecting .conn-dot { background: var(--accent); animation: connPulse 1.2s ease-in-out infinite; }
  .conn-status.offline { color: var(--err); border-color: var(--err); }
  .conn-status.offline .conn-dot { background: var(--err); }
  @keyframes connPulse { 0%, 100% { opacity: .4; } 50% { opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .conn-status.connecting .conn-dot { animation: none; } }
  /* Bottom padding clears the taller two-row composer. */
  #view { padding: 10px 16px 190px; }
  .sess-row { padding: 13px 14px; border: 1px solid var(--line-soft); border-radius: 13px;
              margin-bottom: 10px; cursor: pointer; background: var(--panel); }
  .sess-row:active { border-color: var(--panel-hover-line); background: var(--panel-hover); }
  .sess-head { display: flex; align-items: center; gap: 8px; }
  .row-more { padding: 3px 9px; font-size: 15px; color: var(--text-dim); background: transparent;
              border: none; border-radius: 8px; cursor: pointer; flex-shrink: 0; }
  .row-more:active { background: var(--panel-hover); }
  .sess-title { font-size: 17px; font-weight: 600; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sess-meta { font-size: 13.5px; color: var(--text-dim); margin-top: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .run-badge { font-size: 12px; color: var(--ok); border: 1px solid var(--ok-border); border-radius: 999px;
               padding: 2px 10px; }
  .loading, .empty { text-align: center; color: var(--text-dim); font-size: 15px; padding: 34px 0; }
  .err { color: var(--err); font-size: 14.5px; padding: 8px 2px; }
  .msg { max-width: 92%; padding: 13px 15px; border-radius: 16px; font-size: 16.5px; line-height: 1.72;
         word-break: break-word; margin-bottom: 12px; text-align: left; }
  .msg.user { background: var(--bubble-user); color: var(--bubble-user-text); margin-left: auto;
              border-bottom-right-radius: 5px; white-space: pre-wrap;
              box-shadow: var(--user-shadow); }
  .msg.user.pending { opacity: .55; }
  /* 图片消息的文本部分：与后续缩略图留出间距。 */
  .msg.user .u-text { white-space: pre-wrap; }
  .msg.assistant { background: var(--panel-2); border: 1px solid var(--line); border-bottom-left-radius: 5px; }
  .a-text { white-space: pre-wrap; }
  .a-text + .a-text { margin-top: 8px; }
  /* 消息里的图片：字节经 session.attachment 异步取回；点击全屏查看。 */
  .msg-img { display: block; width: min(260px, 100%); height: auto; border-radius: 12px;
             border: 1px solid var(--line); margin: 7px 0 3px; background: var(--panel-2);
             cursor: pointer; object-fit: cover; }
  .msg-img.img-broken { width: auto; border-style: dashed; color: var(--text-faint); }
  /* 全屏查看器：点图开、点哪都关。 */
  #viewer { position: fixed; inset: 0; z-index: 30; background: rgba(0,0,0,.93);
            display: flex; align-items: center; justify-content: center; }
  #viewer.hidden { display: none; }
  #viewer img { max-width: 100vw; max-height: 100dvh; object-fit: contain; }
  /* 待发图片条：贴在输入框正下方、与输入框组成一体（上平下圆、共享边框色）。 */
  #imgPreview { display: flex; gap: 9px; overflow-x: auto; padding: 9px 10px;
                margin: -7px 0 0; background: var(--panel-2);
                border: 1px solid var(--line); border-top: none;
                border-radius: 0 0 13px 13px;
                overscroll-behavior-x: contain; -webkit-overflow-scrolling: touch; }
  #imgPreview:empty { display: none; }
  #imgPreview.hidden { display: none; }
  .stg { position: relative; flex-shrink: 0; }
  .stg img { width: 52px; height: 52px; object-fit: cover; border-radius: 9px;
             border: 1px solid var(--line); display: block; }
  .stg-x { position: absolute; top: -8px; right: -8px; width: 22px; height: 22px;
           border-radius: 50%; border: 2px solid var(--panel-2); background: var(--stop-bg);
           color: #fff; font-size: 13px; line-height: 18px; padding: 0; text-align: center;
           font-weight: 700; }
  /* Animate opacity only: the original dot animation cycled the ::after
     content string, which forces layout on every step and stutters while a
     reply streams. The in-flow hint was replaced by the #workChip (composer
     top row) — it used to vanish the moment the collapsed Think block began,
     leaving the whole reasoning phase with zero visible feedback. */
  /* New bubbles fade+lift instead of snapping in. */
  .msg { animation: bubbleIn .2s ease-out; }
  @keyframes bubbleIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) {
    .msg, #workChip, #workChip .spin { animation: none; }
  }
  details.tl { border: none; background: transparent; margin: 2px 0 2px 2px; }
  details.tl > summary { cursor: pointer; padding: 6px 2px; font-size: 14px; color: var(--text-dim);
                         overflow: hidden; text-overflow: ellipsis; white-space: nowrap; list-style: none;
                         transition: color .15s ease; }
  details.tl > summary::-webkit-details-marker { display: none; }
  details.tl > summary:active { color: var(--text); }
  /* One scroll axis only. This used to be a 300px scroller with
     overscroll-behavior:contain, which trapped the finger: reaching its bottom
     stopped the page instead of handing the scroll back, so reading a long
     Think or diff meant collapsing the block or moving the finger outside it.
     Long content is already handled upstream (code blocks wrap and fold, the
     diff collapses unchanged runs), so the block just grows inline. */
  details.tl .inner { padding: 5px 2px 11px 18px; font-size: 14px; line-height: 1.6; color: var(--text-dim); }
  /* Think / 注入全文保留原始换行：此前塞进无样式容器，段落全被挤成一坨。 */
  .tl-text { white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; }
  .tl-kv { padding: 3px 0; word-break: break-word; }
  .tl-err { font-size: 14px; color: var(--err); padding: 6px 2px; word-break: break-word; }
  .more-top { display: block; width: 100%; margin: 2px 0 12px; padding: 11px;
              font-size: 14.5px; color: var(--text-dim); cursor: pointer;
              background: var(--panel); border: 1px solid var(--line-soft);
              border-radius: 11px; transition: background .15s ease; }
  .more-top:active { background: var(--panel-hover); }
  .more-top:disabled { opacity: .55; }
  .md-box { margin-top: 6px; border-top: 1px dashed var(--line); padding-top: 6px; }
  .md-p { margin: 5px 0; }
  .md-h1, .md-h2, .md-h3, .md-h4 { font-weight: 650; margin: 12px 0 6px; line-height: 1.4; }
  .md-h1 { font-size: 19.5px; } .md-h2 { font-size: 18px; } .md-h3 { font-size: 17px; } .md-h4 { font-size: 16px; }
  .md-code { font-family: ui-monospace, Consolas, monospace; font-size: .9em; background: var(--code-bg);
             border: 1px solid var(--line); border-radius: 5px; padding: 1.5px 6px; color: var(--code-text);
             word-break: break-word; }
  /* Code blocks wrap instead of scrolling sideways. Horizontal scrolling turned
     a 40-line file into one endless line to drag through on a phone. Each
     source line is its own node with a hanging indent, so a wrapped
     continuation is visually distinct from a real new line. */
  .md-pre { font-family: ui-monospace, Consolas, monospace; font-size: 13.5px; line-height: 1.62;
            background: var(--code-bg);
            border: 1px solid var(--line); border-radius: 11px; padding: 11px 13px; margin: 9px 0;
            color: var(--code-text); overflow: hidden; }
  .code-line { white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word;
               padding-left: 2ch; text-indent: -2ch; }
  .code-more { display: block; width: 100%; margin-top: 7px; padding: 7px; font-size: 13px;
               color: var(--text-dim); background: var(--panel); border: 1px solid var(--line-soft);
               border-radius: 8px; cursor: pointer; font-family: inherit; }
  .code-more:active { background: var(--panel-hover); }
  /* Unified line diff for edit calls: what left, what arrived, in place.
     Colors come from dedicated --diff-* variables: reusing --stop-bg/--ok-border
     (button fills and borders) put saturated red text on saturated red, which
     was unreadable. Each theme tunes a tinted background plus a high-contrast
     ink, and a left rule carries the add/del signal even at low contrast. */
  .diff-line { white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word;
               padding: 1px 6px 1px 2.4ch; text-indent: -1.4ch; border-radius: 3px;
               border-left: 3px solid transparent; }
  .diff-add { color: var(--diff-add-ink); background: var(--diff-add-bg); border-left-color: var(--diff-add-rule); }
  .diff-del { color: var(--diff-del-ink); background: var(--diff-del-bg); border-left-color: var(--diff-del-rule); }
  .diff-ctx { color: var(--text-dim); }
  .diff-skip { color: var(--text-faint); font-size: 12.5px; padding: 4px 0 4px 2.4ch;
               text-indent: 0; font-family: system-ui, sans-serif; }
  .diff-stat { font-size: 13px; color: var(--text-dim); margin: 2px 0 6px; }
  .diff-stat .st-add { color: var(--diff-add-rule); font-weight: 600; }
  .diff-stat .st-del { color: var(--diff-del-rule); font-weight: 600; }
  .md-table { border-collapse: collapse; margin: 9px 0; font-size: 14.5px; display: block;
              overflow-x: auto; max-width: 100%; -webkit-overflow-scrolling: touch;
              overscroll-behavior-x: contain; }
  .md-table th, .md-table td { border: 1px solid var(--line); padding: 7px 11px; text-align: left;
                               white-space: nowrap; }
  .md-table th { background: var(--panel-hover); color: var(--text); }
  .md-quote { border-left: 3px solid var(--accent); padding: 4px 12px; margin: 8px 0; color: var(--text-dim); }
  .md-li { padding: 3px 0 3px 6px; }
  .md-li::before { content: "• "; color: var(--accent); }
  .md-hr { border: none; border-top: 1px solid var(--line); margin: 12px 0; }
  /* GenUI (dsh-ui fences). The desktop renderer is React + CSS Modules and
     cannot load here, so these are native-DOM equivalents built on the same
     theme variables: every skin gets correct colors for free. Row/col/grid all
     collapse to a single column — side-by-side content is unreadable at phone
     width. Interactive controls render as static affordances (no action loop
     on mobile), so nothing looks clickable that isn't. */
  .gu-block { margin: 10px 0; border: 1px solid var(--line); border-radius: 13px;
              padding: 12px 13px; background: var(--panel); }
  .gu-title { font-weight: 650; font-size: 15.5px; margin-bottom: 9px; color: var(--text); }
  .gu-col { display: flex; flex-direction: column; gap: 9px; min-width: 0; }
  .gu-center { text-align: center; }
  .gu-muted { font-size: 14px; color: var(--text-dim); }
  .gu-caption { font-size: 12.5px; color: var(--text-faint); }
  .gu-spacer { height: 6px; }
  .gu-card { border: 1px solid var(--line-soft); border-radius: 11px; padding: 10px 11px;
             background: var(--panel-2); display: flex; flex-direction: column; gap: 8px; }
  .gu-card-title { font-weight: 620; font-size: 14.5px; color: var(--text); }
  .gu-badge { display: inline-block; padding: 2px 9px; border-radius: 999px; font-size: 12.5px;
              border: 1px solid var(--line); color: var(--text-dim); background: var(--panel-hover);
              margin: 0 5px 5px 0; }
  .gu-badge-success { color: var(--ok); border-color: var(--ok-border); }
  .gu-badge-warn { color: var(--diff-del-rule); border-color: var(--diff-del-rule); }
  .gu-badge-danger { color: var(--err); border-color: var(--err); }
  .gu-badge-accent { color: var(--accent); border-color: var(--accent); }
  .gu-stat { padding: 2px 0; }
  .gu-stat-label { font-size: 12.5px; color: var(--text-dim); }
  .gu-stat-value { font-size: 21px; font-weight: 650; color: var(--text); line-height: 1.3; }
  .gu-stat-delta { font-size: 13px; font-weight: 600; }
  .gu-up { color: var(--diff-add-rule); }
  .gu-down { color: var(--diff-del-rule); }
  .gu-progress { padding: 2px 0; }
  .gu-progress-row { display: flex; justify-content: space-between; font-size: 13px;
                     color: var(--text-dim); margin-bottom: 5px; }
  .gu-track { height: 7px; border-radius: 999px; background: var(--panel-hover); overflow: hidden; }
  .gu-fill { height: 100%; background: var(--accent); border-radius: 999px; }
  .gu-list { display: flex; flex-direction: column; gap: 2px; }
  .gu-li-title { font-weight: 600; }
  .gu-li-desc { display: block; font-size: 13.5px; color: var(--text-dim); padding-left: 6px; }
  .gu-kv { display: flex; flex-direction: column; gap: 1px; }
  .gu-kv-row { display: flex; flex-direction: column; gap: 1px; padding: 5px 0;
               border-bottom: 1px solid var(--line-soft); }
  .gu-kv-row:last-child { border-bottom: none; }
  .gu-kv-key { font-size: 12.5px; color: var(--text-dim); }
  .gu-kv-val { font-size: 14.5px; color: var(--text); word-break: break-word; }
  .gu-callout { border-left: 3px solid var(--accent); border-radius: 8px;
                padding: 9px 12px; background: var(--panel-hover); font-size: 14px;
                line-height: 1.6; color: var(--text-dim); }
  .gu-callout-title { font-weight: 650; color: var(--text); margin-bottom: 4px; }
  .gu-callout-success { border-left-color: var(--ok); }
  .gu-callout-warning { border-left-color: var(--diff-del-rule); }
  .gu-callout-error { border-left-color: var(--err); }
  .gu-steps { display: flex; flex-direction: column; gap: 8px; }
  .gu-step { display: flex; gap: 9px; align-items: flex-start; }
  .gu-step-no { flex: 0 0 auto; width: 21px; height: 21px; border-radius: 999px;
                background: var(--panel-hover); color: var(--text-dim); font-size: 12px;
                display: flex; align-items: center; justify-content: center; margin-top: 1px; }
  .gu-step-active .gu-step-no { background: var(--accent); color: var(--accent-ink); }
  .gu-step-body { min-width: 0; }
  .gu-step-title { font-size: 14.5px; color: var(--text); }
  .gu-step-desc { font-size: 13px; color: var(--text-dim); }
  .gu-timeline { display: flex; flex-direction: column; gap: 9px; }
  .gu-tl-item { border-left: 2px solid var(--line); padding-left: 11px; }
  .gu-tl-head { display: flex; justify-content: space-between; gap: 9px; align-items: baseline; }
  .gu-tl-title { font-size: 14.5px; font-weight: 600; color: var(--text); }
  .gu-tl-time { font-size: 12px; color: var(--text-faint); white-space: nowrap; }
  .gu-tl-desc { font-size: 13.5px; color: var(--text-dim); margin-top: 2px; }
  .gu-crumb { font-size: 13px; color: var(--text-dim); word-break: break-word; }
  .gu-avatar { width: 32px; height: 32px; border-radius: 999px; background: var(--accent);
               color: var(--accent-ink); font-weight: 650; font-size: 14px;
               display: flex; align-items: center; justify-content: center; }
  .gu-stub { font-size: 13.5px; color: var(--text-faint); padding: 9px 11px;
             border: 1px dashed var(--line); border-radius: 9px; background: var(--panel-2); }
  .gu-field { display: flex; flex-direction: column; gap: 4px; }
  .gu-field-label { font-size: 12.5px; color: var(--text-dim); }
  .gu-control { font-size: 14px; color: var(--text-dim); padding: 8px 11px;
                border: 1px solid var(--line); border-radius: 9px; background: var(--panel-2); }
  .gu-opt { font-size: 14px; color: var(--text-dim); padding: 3px 0; }
  .gu-btn-static { display: inline-block; font-size: 14px; color: var(--text-faint);
                   padding: 8px 15px; border: 1px solid var(--line); border-radius: 9px;
                   background: var(--panel-2); opacity: .72; }
  .gu-link { color: var(--accent); word-break: break-word; }
  .gu-link-text { color: var(--text-dim); }
  #pendBar { position: fixed; left: 12px; right: 12px; bottom: 136px; z-index: 7; }
  .pend-card { background: var(--sheet-bg); border: 1px solid var(--line); border-radius: 13px;
               padding: 12px 13px; margin-top: 8px; box-shadow: var(--pop-shadow);
               max-height: 48vh; overflow: auto; overscroll-behavior: contain; }
  .pend-title { font-weight: 650; font-size: 15.5px; margin-bottom: 5px; }
  .pend-text { font-size: 14.5px; line-height: 1.6; color: var(--text-dim); margin: 5px 0; white-space: pre-wrap; word-break: break-word; }
  .pend-opt { padding: 11px 12px; border: 1px solid var(--line-soft); border-radius: 10px; margin: 7px 0;
              cursor: pointer; background: var(--panel); font-size: 15px; }
  .pend-opt:active { background: var(--panel-hover); }
  .pend-btns { display: flex; gap: 8px; margin-top: 11px; }
  .pend-btns button { flex: 1; padding: 12px; border: none; border-radius: 10px; font-weight: 600;
                      color: #fff; cursor: pointer; font-size: 15.5px; }
  .pend-allow { background: var(--accent-grad); }
  .pend-reject { background: var(--stop-bg); }
  .pend-input { width: 100%; padding: 9px 10px; border-radius: 10px; border: 1px solid var(--line);
                background: var(--panel-2); color: var(--text); font-size: 13.5px; margin-top: 8px; }
  #skillMenu { position: fixed; left: 12px; right: 12px; bottom: 138px; max-height: 52vh; overflow: auto;
               z-index: 8; background: var(--sheet-bg); border: 1px solid var(--line); border-radius: 13px; padding: 6px;
               box-shadow: var(--pop-shadow); overscroll-behavior: contain; touch-action: pan-y;
               -webkit-overflow-scrolling: touch; }
  .skill-row { padding: 11px 11px; border-radius: 9px; cursor: pointer; font-size: 15px; }
  .skill-row:active { background: var(--panel-hover); }
  /* Two-row composer: the model chip owns the top row so the textarea keeps
     the full width below it. A single flex row squeezed the input to a sliver
     once the model name grew long (e.g. "claude-opus-5-xhigh"). */
  #composer { position: fixed; bottom: 0; left: 0; right: 0; display: flex; flex-direction: column; gap: 5px;
              padding: 7px 10px calc(7px + env(safe-area-inset-bottom));
              background: var(--bar-bg); border-top: 1px solid var(--line); }
  /* Chips row: pickers + frameless working indicator + queue on ONE compact
     line. The working status is plain text, no border/padding, so the row
     stays airy - no dedicated status row, no empty gap. */
  #composerTop { display: flex; align-items: center; gap: 5px; min-width: 0; }
  /* Working chip: tinted text sticker at the right end of the chips row -
     spinner + tool name over a soft hint wash, no hard border. */
  #workChip { display: inline-flex; align-items: center; gap: 5px;
              padding: 4px 8px; border-radius: 8px;
              background: var(--hint-dim); color: var(--hint);
              font-size: 12px;
              margin-left: auto; min-width: 0; overflow: hidden; animation: chipIn .18s ease-out; }
  #workChip.hidden { display: none; }
  /* When the working indicator is hidden, the queue chip inherits the
     right-edge anchor so the right group never changes sides. */
  #workChip.hidden + #queueChip { margin-left: auto; }
  #workChip .spin { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0;
                    border: 2px solid var(--line-soft); border-top-color: var(--hint);
                    animation: chipSpin .9s linear infinite; }
  #workLabel { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  @keyframes chipSpin { to { transform: rotate(360deg); } }
  @keyframes chipIn { from { opacity: 0; transform: scale(.92); } to { opacity: 1; transform: none; } }
  /* Queue chip sits at the right end of the chips row; it never shrinks away.
     #composerTop prefix beats the generic "#composer button" gradient rule. */
  #composerTop #queueChip { padding: 4px 8px; font-size: 12.5px; border-radius: 8px;
               border: none; background: var(--ok-dim);
               color: var(--ok); flex-shrink: 0; }
  #queueChip.hidden { display: none; }
  .q-row { display: flex; align-items: center; gap: 8px; padding: 11px 12px; border: 1px solid var(--line-soft);
           border-radius: 11px; margin-bottom: 8px; background: var(--panel); }
  .q-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14.5px; color: var(--text); }
  .q-remove { flex-shrink: 0; padding: 6px 12px; border-radius: 9px; border: 1px solid #5a3a3a;
              background: transparent; color: #f0c9c9; font-size: 13px; }
  #composerMain { display: flex; align-items: flex-end; gap: 8px; position: relative; }
  /* 相机按钮：输入框内左侧垂直居中。选择器带 #composerMain 前缀压过
     #composer button 的渐变按钮规则（后者曾把它撑成 58px 渐变小方块）。 */
  #composerMain #imgBtn { position: absolute; left: 8px; top: 50%; margin-top: -17px; z-index: 2;
                          width: 34px; height: 34px; min-height: 0; padding: 0;
                          border: none; background: transparent; color: var(--text-faint);
                          transform: none; opacity: 1; }
  #composerMain #imgBtn svg { width: 21px; height: 21px; display: block; margin: 0 auto; }
  #composer textarea { flex: 1; width: 100%; resize: none; min-height: 44px; max-height: 168px;
                       font-size: 16px; line-height: 1.45; color: var(--text);
                       background: var(--panel-2); border: 1px solid var(--line); border-radius: 13px;
                       padding: 11px 14px 11px 48px; outline: none;
                       transition: border-color .18s ease; }
  #composer textarea::placeholder { color: var(--text-faint); }
  #composer textarea:focus { border-color: var(--focus-line); }
  #composer button { padding: 12px 17px; font-size: 15.5px; font-weight: 600; color: #fff; border: none;
                     border-radius: 13px; cursor: pointer; background: var(--accent-grad); flex-shrink: 0;
                     transition: opacity .15s ease, transform .12s ease; }
  #composer button:active { transform: scale(.96); }
  #composer button:disabled { opacity: .45; }
  #composer .stop { background: var(--stop-bg); }
  /* Model / mode chips: tinted text buttons - soft accent wash, no hard
     border, so the row reads as coloured metadata rather than a pile of
     pills. Selector carries the #composerTop prefix: plain #modelChip loses
     to the generic "#composer button" gradient rule (higher specificity) -
     the pills looked unchanged in v57 because of exactly that. */
  #composerTop #modelChip, #composerTop #presetChip { padding: 4px 8px; font-size: 12.5px; border-radius: 8px; border: none;
               background: var(--accent-chip); color: var(--accent-ink); cursor: pointer;
               flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
               transition: background .15s ease; }
  /* Mode picker keeps its own tint so the two pickers stay distinguishable. */
  #composerTop #presetChip { background: var(--panel-hover); color: var(--text-dim); }
  #composerTop #presetChip.locked { color: var(--text-faint); cursor: default; }
  .preset-picker { margin: 2px 0 12px; }
  .preset-picker select { width: 100%; padding: 11px 12px; border: 1px solid var(--line);
                          border-radius: 10px; background: var(--panel-2); color: var(--text);
                          font: inherit; font-size: 15px; }
  .preset-picker select:focus { outline: none; border-color: var(--focus-line); }
  .preset-note { margin: 6px 2px 12px; font-size: 13px; line-height: 1.45; color: var(--text-dim); }
  #sheet { position: fixed; inset: 0; background: var(--overlay); display: flex; align-items: flex-end; z-index: 9; }
  #sheetBody { width: 100%; max-height: 72vh; overflow: auto; background: var(--sheet-bg);
               border-radius: 18px 18px 0 0; padding: 16px 16px calc(16px + env(safe-area-inset-bottom));
               border-top: 1px solid var(--line); overscroll-behavior: contain; touch-action: pan-y; }
  .grp-name { font-size: 14px; color: var(--text-dim); margin: 14px 2px 8px; letter-spacing: .4px; font-weight: 600; }
  .ws-head { position: sticky; top: 47px; z-index: 2; display: flex; align-items: center; gap: 8px;
             margin: 6px 0 9px; padding: 8px 10px; font-size: 16px; font-weight: 700; color: var(--text);
             background: var(--bar-bg); border-left: 3px solid var(--accent); border-radius: 6px;
             backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); letter-spacing: 0; }
  .ws-head { cursor: pointer; user-select: none; -webkit-user-select: none; }
  .ws-head:active { background: var(--panel-hover); }
  /* Caret rotates instead of swapping glyphs: transform stays on the compositor. */
  .ws-caret { flex-shrink: 0; font-size: 13px; color: var(--text-dim); line-height: 1;
              transition: transform .18s ease; transform-origin: 50% 50%; }
  .ws-head.open .ws-caret { transform: rotate(90deg); }
  .ws-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ws-count { margin-left: auto; font-size: 12.5px; color: var(--text-faint); font-weight: 500; flex-shrink: 0; }
  @media (prefers-reduced-motion: reduce) { .ws-caret { transition: none; } }
  .model-row { padding: 13px 13px; border: 1px solid var(--line-soft); border-radius: 11px;
               margin-bottom: 8px; font-size: 15.5px; cursor: pointer; background: var(--panel); }
  .model-row:active { background: var(--panel-hover); }
  .model-row.cur { border-color: var(--accent); color: var(--accent-ink); background: var(--accent-dim); }
  .sw-dot { width: 15px; height: 15px; border-radius: 50%; display: inline-block;
            border: 1px solid rgba(128,128,128,.4); margin-right: 6px; vertical-align: middle; }
  .theme-name { margin-left: 4px; vertical-align: middle; }
  /* Toast: short-lived result feedback (model switch etc). Opacity-only so it
     never relayouts, and pointer-events:none so it never blocks taps. */
  #toast { position: fixed; left: 50%; bottom: calc(120px + env(safe-area-inset-bottom));
           transform: translateX(-50%) translateY(10px); max-width: 78vw; z-index: 90;
           background: #26262e; color: #e8e8ee; font-size: 14px; padding: 9px 17px;
           border-radius: 999px; border: 1px solid #33333d; text-align: center;
           opacity: 0; pointer-events: none; transition: opacity .18s ease, transform .18s ease; }
  #toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
  #toast.bad { background: #2e1f1f; border-color: #7a3b3b; color: #f0c9c9; }
  /* Destructive action (unpair): outlined until armed, filled on confirm. */
  .danger-btn { width: 100%; margin-top: 4px; padding: 13px; border-radius: 11px; font-size: 15.5px;
                font-weight: 600; cursor: pointer; background: transparent; color: var(--err);
                border: 1px solid var(--err); transition: background .15s ease, color .15s ease; }
  .danger-btn.armed { background: var(--stop-bg); color: #fff; border-color: var(--stop-bg); }
  .danger-btn:disabled { opacity: .5; }
  /* Icon-only bar buttons: square tap target, stroke follows the theme text
     colour via currentColor so all six themes stay consistent. */
  #bar button.icon-btn { padding: 7px; line-height: 0; display: inline-flex;
                         align-items: center; justify-content: center; }
  #bar button.icon-btn svg { width: 20px; height: 20px; display: block; }
  .hidden { display: none !important; }
`;
/** 齿轮图标（stroke 用 currentColor，随主题文字色走）。 */
const GEAR_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
/** 相机图标（composer 发图入口，同 currentColor 风格）。 */
const CAMERA_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.8A1.8 1.8 0 0 1 4.8 7h2.3l1.2-1.8c.33-.5.9-.8 1.5-.8h4.4c.6 0 1.17.3 1.5.8L16.9 7h2.3A1.8 1.8 0 0 1 21 8.8v9.4a1.8 1.8 0 0 1-1.8 1.8H4.8A1.8 1.8 0 0 1 3 18.2Z"/><circle cx="12" cy="13.2" r="3.4"/></svg>`;
/** 已配对控制页（M2）：会话列表 → 消息流 + 发指令 / 中止 / 模型切换。 */
export function renderConnectedPage(deviceName, prefilledCode) {
    return `${BASE_HEAD}
<style>${CONTROL_STYLE}</style>
<div id="bar">
  <button id="backBtn" class="hidden">← 列表</button>
  <h1 id="topTitle">会话列表</h1>
  <button id="setBtn" class="icon-btn hidden" aria-label="设置">${GEAR_SVG}</button>
  <button id="newBtn" class="hidden">＋ 新会话</button>
  <button id="refreshBtn" class="hidden">刷新</button>
</div>
<div id="devline"><span>设备「${escapeHtml(deviceName)}」</span><span id="connStatus" class="conn-status connecting" role="status" aria-live="polite"><span class="conn-dot"></span><span class="conn-label">连接中</span></span><span>· 页面 v60</span></div>
<div id="view"></div>
<div id="pendBar" class="hidden"></div>
<div id="skillMenu" class="hidden"></div>
<div id="composer" class="hidden">
  <div id="composerTop">
    <button id="modelChip" class="hidden">模型 ▾</button>
    <button id="presetChip" class="hidden">模式 ▾</button>
    <span id="workChip" class="hidden"><span class="spin"></span><span id="workLabel"></span></span>
    <button id="queueChip" class="hidden" title="查看队列">⏳</button>
  </div>
  <div id="composerMain">
    <button id="imgBtn" aria-label="发送图片">${CAMERA_SVG}</button>
    <input id="imgInput" type="file" accept="image/*" class="hidden">
    <textarea id="input" rows="2" placeholder="发指令给桌面会话…"></textarea>
    <button id="stopBtn" class="stop hidden">停止</button>
    <button id="sendBtn">发送</button>
  </div>
  <div id="imgPreview" class="hidden"></div>
</div>
<div id="sheet" class="hidden"><div id="sheetBody"></div></div>
<div id="viewer" class="hidden"><img alt=""></div>
<div id="toast"></div>
<script>
(() => {
  try { sessionStorage.removeItem('dshrc_restore_tried'); } catch (e) { }  // 已连上：允许未来 Cookie 过期时再次自愈
  var view = document.getElementById('view');
  var connStatus = document.getElementById('connStatus');
  var connLabel = connStatus.querySelector('.conn-label');
  var topTitle = document.getElementById('topTitle');
  var backBtn = document.getElementById('backBtn');
  var modelChip = document.getElementById('modelChip');
  var presetChip = document.getElementById('presetChip');
  var refreshBtn = document.getElementById('refreshBtn');
  var composer = document.getElementById('composer');
  var input = document.getElementById('input');
  var sendBtn = document.getElementById('sendBtn');
  var stopBtn = document.getElementById('stopBtn');
  var sheet = document.getElementById('sheet');
  var sheetBody = document.getElementById('sheetBody');
  var newBtn = document.getElementById('newBtn');
  var setBtn = document.getElementById('setBtn');
  var current = null;
  var lastItems = [];
  var lastSeq = 0;
  var liveEls = {};
  var es = null;
  var healthTimer = null;
  var healthBusy = false;
  var streamOpen = false;
  var healthOnline = false;
  var lastModels = null;
  var lastModelsSid = null; // 模型列表缓存归属的会话：换会话即失效，避免张冠李戴
  // 模式（官方 agent preset）：清单几乎不变，缓存一份给新建面板与模式面板秒开。
  var presetRoster = null;      // { presets: [...], defaultId }
  var selectedPreset = null;    // 新建会话时选中的模式 id（null = 用部署默认）
  // 会话视图缓存：sid → 摘下的整棵消息 DOM + 流式状态。LRU 上限 3，
  // 超限淘汰最旧条目；单会话 DOM 超过 1500 元素不缓存（内存保护）。
  var sessionCache = new Map();
  var SESSION_CACHE_MAX = 3;
  var toastEl = document.getElementById('toast');
  var toastTimer = null;
  var connState = 'connecting';
  var healthFailures = 0;
  var HEALTH_FAIL_LIMIT = 2;
  var HEALTH_INTERVAL_MS = 6000;
  var HEALTH_TIMEOUT_MS = 4500;
  /** Update the three-state desktop availability indicator without adding a normal re-pair state. */
  function setConnectionState(state) {
    if (state !== 'online' && state !== 'connecting' && state !== 'offline') state = 'connecting';
    connState = state;
    connStatus.classList.remove('online', 'connecting', 'offline');
    connStatus.classList.add(state);
    var labels = { online: '在线', connecting: '连接中', offline: 'DSH 离线' };
    var titles = { online: 'DSH 网关与实时连接正常', connecting: '正在连接 DSH…', offline: '无法连接到桌面端 DSH，正在重试' };
    connLabel.textContent = labels[state];
    connStatus.title = titles[state];
  }
  function syncConnectionState() {
    if (healthFailures >= HEALTH_FAIL_LIMIT) { setConnectionState('offline'); return; }
    if (healthOnline && (!current || streamOpen)) { setConnectionState('online'); return; }
    setConnectionState('connecting');
  }
  /** Poll the gateway itself: a stale page must not look online after DSH exits. */
  function probeHealth() {
    if (healthBusy) return;
    healthBusy = true;
    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, HEALTH_TIMEOUT_MS) : null;
    var opts = { cache: 'no-store' };
    if (controller) opts.signal = controller.signal;
    fetch('/remote/health', opts).then(function (res) {
      if (!res.ok) throw new Error('health ' + res.status);
      return res.json();
    }).then(function (body) {
      if (!body || body.ok !== true) throw new Error('health rejected');
      healthOnline = true;
      healthFailures = 0;
      syncConnectionState();
    }).catch(function () {
      healthOnline = false;
      healthFailures = Math.min(HEALTH_FAIL_LIMIT, healthFailures + 1);
      syncConnectionState();
    }).then(function () {
      healthBusy = false;
      if (timer) clearTimeout(timer);
    });
  }
  function startHealthMonitor() {
    if (healthTimer !== null) return;
    probeHealth();
    healthTimer = setInterval(probeHealth, HEALTH_INTERVAL_MS);
  }
  /** 轻提示：操作结果即时可见（成功/失败一望而知），2.2s 自动退场。 */
  function toast(msg, bad) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('bad', !!bad);
    toastEl.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }
  var pendingEcho = null;   // 本地乐观回显的文本；SSE user/message 帧到达时命中则去重
  var lastFrameAt = 0;      // 最近一次 SSE 帧时间，用作长等兜底（8 秒无帧才对账）
  var streamedTurn = false; // 本轮已流式渲染过 assistant 内容；终帧 assistant/message 到达时跳过防重复
  var pendingHint = null;   // 工作芯片当前文案（输入框顶行），正文开始吐字时退场
  var pendingReconcile = false;  // 流式中被推迟的历史对账，turn/end 后补跑
  var callNames = {};       // callId → 工具名，tool/result 行还原是哪个工具的结果
  var BQ = String.fromCharCode(96), F3 = BQ + BQ + BQ;  // 反引号与其三连（本文件是模板串，不能写字面量）

  // Coalesce scrolling into one frame. Streaming used to call scrollTo per
  // token, and each call forces a synchronous layout, which is what made the
  // typewriter feel choppy on a phone.
  var scrollQueued = false;
  function scrollBottom() {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(function () {
      scrollQueued = false;
      // 帧回调可能落在「已切回列表页」之后：那时把列表拉到底是错的。
      if (current === null) return;
      // 近底部才跟随：用户往上翻历史时不被增量拽走，回到底部自动恢复跟随。
      // 显式定位（进会话/对账/发送回显）都走 scrollTo，不受此门槛影响。
      if (document.body.scrollHeight - window.scrollY - window.innerHeight > 180) return;
      window.scrollTo(0, document.body.scrollHeight);
    });
  }

  // 工作指示芯片：从发出指令到正文开始吐字全程可见（发送中/深度思考中/工具调用中）。
  // 固定挂在输入框顶行，不随消息流滚走；转圈动画只动 transform，流式期间不掉帧。
  var workChip = document.getElementById('workChip');
  var workLabel = document.getElementById('workLabel');
  function setHint(text) {
    workLabel.textContent = text;
    workChip.classList.remove('hidden');
    pendingHint = text;
  }
  function clearHint() {
    workChip.classList.add('hidden');
    pendingHint = null;
  }

  // ── 消息队列：宿主经 session/queue 帧全量推送收件箱快照，这里只做镜像 ────
  // session.cancel 只中止当前轮、不清队列（实测）；单条移除走 session.updateQueue。
  var queueChip = document.getElementById('queueChip');
  var queueItems = [];
  function renderQueueChip() {
    queueChip.textContent = '⏳ ' + queueItems.length;
    queueChip.classList.toggle('hidden', !queueItems.length);
  }
  function renderQueueRows() {
    var box = document.getElementById('queueRows');
    if (!box) return;  // 队列面板没开着：等下次打开时渲染
    box.innerHTML = '';
    if (!queueItems.length) { box.appendChild(el('div', 'sess-meta', '队列是空的。')); return; }
    queueItems.forEach(function (it) {
      var row = el('div', 'q-row');
      row.appendChild(el('div', 'q-text', oneLine(textOf(it.message && it.message.content), 60)));
      var rm = el('button', 'q-remove', '移除');
      rm.addEventListener('click', function () {
        if (!current) return;
        api('session.updateQueue', { sessionId: current.sessionId, itemId: it.id, action: { kind: 'remove' } })
          .then(function () { toast('已从队列移除'); })
          .catch(function (e2) { toast('移除失败：' + e2.message, true); });
      });
      row.appendChild(rm);
      box.appendChild(row);
    });
  }
  /** 队列面板：当前轮停止按钮 + 排队消息逐条移除。 */
  function openQueueSheet() {
    if (!current) return;
    openSheet();
    sheetBody.innerHTML = '';
    // 以停止键的可见性为准（turn/start、end 实时驱动），current.running 可能滞后
    var turnRunning = !stopBtn.classList.contains('hidden');
    if (turnRunning) {
      var stopRow = el('button', null, '■ 停止当前回复，队列继续');
      stopRow.style.cssText = 'width:100%;padding:12px;border-radius:10px;border:none;background:#5a2b2b;color:#f0c9c9;font-weight:600;';
      var stopping = false;
      stopRow.addEventListener('click', function () {
        if (stopping || !current) return;
        stopping = true;
        stopRow.textContent = '正在停止…';
        var sid = current.sessionId;
        // 宿主语义（实测）：cancel 只中止当前轮，之后 agent 循环不会自动认领
        // 排队消息——它们会永远挂着。所以「停当前、队列继续」要自己编排：
        // ① 逐条取下排队消息（留底文本）② cancel ③ 按原顺序重新提交，
        // 第一条立即开新一轮，其余排队跟随。顺序错就会重复/丢消息。
        var saved = queueItems.map(function (it) { return { id: it.id, text: textOf(it.message && it.message.content) }; });
        var clears = saved.map(function (it) {
          return api('session.updateQueue', { sessionId: sid, itemId: it.id, action: { kind: 'remove' } }).catch(function () { });
        });
        Promise.all(clears).then(function () {
          return api('session.cancel', { sessionId: sid });
        }).then(function () {
          closeSheet(false);
          // 旧乐观气泡（还在 pending 的排队消息）撤掉，重发后由 user/message 正常渲染
          Array.prototype.slice.call(view.querySelectorAll('.msg.user.pending')).forEach(function (n) { n.remove(); });
          toast('已停止当前回复，队列按原顺序继续');
          var chain = Promise.resolve();
          saved.forEach(function (it) {
            chain = chain.then(function () {
              return api('session.prompt', {
                sessionId: sid, mode: 'queue',
                content: [{ type: 'text', text: it.text }],
                clientTimeZone: (Intl.DateTimeFormat().resolvedOptions() || {}).timeZone
              }).catch(function (e2) { toast('队列续发失败：' + e2.message, true); });
            });
          });
          chain.then(function () { if (current && current.sessionId === sid) loadHistory(); });
        }).catch(function (e2) {
          stopping = false;
          stopRow.textContent = '■ 停止当前回复，队列继续';
          toast('停止失败：' + e2.message, true);
        });
      });
      sheetBody.appendChild(stopRow);
      sheetBody.appendChild(el('div', 'sess-meta', '停止正在生成的回复，排队消息按原顺序继续发送。'));
    }
    sheetBody.appendChild(el('div', 'grp-name', '排队中的消息'));
    var box = el('div');
    box.id = 'queueRows';
    sheetBody.appendChild(box);
    renderQueueRows();
  }
  queueChip.addEventListener('click', openQueueSheet);

  // 桌面端审批/提问：SSE server-request 帧到达即铺横幅卡片，手机直接处置（协议已端到端实测）。
  var pendBar = document.getElementById('pendBar');
  var pendings = {};  // rpcId → { kind: 'approval'|'question', frame }
  function respondRpc(rpcId, value) {
    return fetch('/remote/respond', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'client-response', rpcId: rpcId, result: { ok: true, value: value } })
    }).then(function (r) { return r.json(); }).then(function (rc) {
      if (rc && rc.accepted) { delete pendings[rpcId]; renderPend(); return; }
      throw new Error((rc && rc.reason) || '网关未受理');
    });
  }
  function renderPend() {
    var ids = Object.keys(pendings);
    if (!ids.length || !current) { pendBar.innerHTML = ''; pendBar.classList.add('hidden'); return; }
    pendBar.classList.remove('hidden');
    pendBar.innerHTML = '';
    ids.slice(-3).forEach(function (rpcId) {
      var p = pendings[rpcId];
      var pl = p.frame.payload;
      var card = el('div', 'pend-card');
      if (p.kind === 'approval') {
        card.appendChild(el('div', 'pend-title', '🔐 权限审批 · ' + (pl.toolName || '工具')));
        if (pl.reason) card.appendChild(el('div', 'pend-text', pl.reason));
        var btns = el('div', 'pend-btns');
        var allow = el('button', 'pend-allow', '✓ 允许一次');
        allow.addEventListener('click', function () {
          respondRpc(rpcId, { sessionId: pl.sessionId, approvalId: pl.approvalId, outcome: 'allowed-once' })
            .catch(function (e) { card.appendChild(el('div', 'err', '应答失败：' + e.message)); });
        });
        var rej = el('button', 'pend-reject', '✕ 拒绝');
        rej.addEventListener('click', function () {
          respondRpc(rpcId, { sessionId: pl.sessionId, approvalId: pl.approvalId, outcome: 'rejected' })
            .catch(function (e) { card.appendChild(el('div', 'err', '应答失败：' + e.message)); });
        });
        btns.appendChild(allow); btns.appendChild(rej);
        card.appendChild(btns);
      } else {
        card.appendChild(el('div', 'pend-title', '❓ 桌面端向你提问'));
        var answeredMap = {};
        (pl.questions || []).forEach(function (q) {
          card.appendChild(el('div', 'pend-text', (q.header ? '【' + q.header + '】' : '') + (q.question || '')));
          if (q.detail) card.appendChild(el('div', 'pend-text', q.detail));
          var selMap = {};
          answeredMap[q.id] = { sel: selMap };
          (q.options || []).forEach(function (o) {
            var opt = el('div', 'pend-opt', '');
            opt.appendChild(el('b', null, o.label || ''));
            if (o.description) opt.appendChild(el('div', 'sess-meta', oneLine(o.description, 60)));
            opt.addEventListener('click', function () {
              if (selMap[o.label]) { delete selMap[o.label]; opt.style.borderColor = ''; opt.style.background = ''; }
              else { selMap[o.label] = 1; opt.style.borderColor = 'var(--accent)'; opt.style.background = 'var(--accent-dim)'; }
            });
            card.appendChild(opt);
          });
          var ci = document.createElement('input');
          ci.className = 'pend-input';
          ci.placeholder = '或输入自定义答案…';
          ci.addEventListener('input', function () { selMap.__custom = ci.value.trim(); });
          card.appendChild(ci);
        });
        var sub = el('button', 'pend-allow', '提交回答');
        sub.style.cssText = 'width:100%;padding:10px;border:none;border-radius:10px;font-weight:600;color:#fff;font-size:14px;margin-top:9px;cursor:pointer;background:var(--accent-grad);';
        sub.addEventListener('click', function () {
          var ans = [];
          Object.keys(answeredMap).forEach(function (qid) {
            var labels = Object.keys(answeredMap[qid].sel).filter(function (k) { return k !== '__custom'; });
            var custom = answeredMap[qid].sel.__custom || '';
            if (!labels.length && !custom) return;
            var a = { id: qid, selected: labels };
            if (custom) a.custom = custom;
            ans.push(a);
          });
          if (!ans.length) { card.appendChild(el('div', 'err', '先选一个选项或填写自定义答案')); return; }
          respondRpc(rpcId, { sessionId: p.frame.payload.sessionId, answer: { answers: ans } })
            .catch(function (e) { card.appendChild(el('div', 'err', '应答失败：' + e.message)); });
        });
        card.appendChild(sub);
      }
      pendBar.appendChild(card);
    });
  }

  // 实时事件流：一个 EventSource 管全部会话，只应用当前会话、seq 大于本地水位的帧。
  function ensureStream() {
    startHealthMonitor();
    if (es !== null) return;
    setConnectionState('connecting');
    es = new EventSource('/remote/events');
    es.onopen = function () {
      streamOpen = true;
      syncConnectionState();
      if (current) loadHistory();  // 断线重连后全量对账
    };
    es.onerror = function () {
      streamOpen = false;
      syncConnectionState();
      // EventSource keeps its own retry loop; the health monitor supplies the
      // delayed offline verdict instead of treating one transient error as down.
    };
    es.onmessage = function (ev) {
      lastFrameAt = Date.now();
      var f = null;
      try { f = JSON.parse(ev.data); } catch (err) { return; }
      // mux 帧包在 server-request 信封里，真正的帧在 payload 字段（payload.type = session/event 等）
      var frame = f && f.payload;
      if (!frame) return;
      if (frame.type === 'approval/requested' || frame.type === 'question/requested') {
        // 只处置当前正打开的会话；其他会话的审批由桌面端处置
        if (current && frame.sessionId === current.sessionId) {
          pendings[f.rpcId] = { kind: frame.type === 'approval/requested' ? 'approval' : 'question', frame: f };
          renderPend();
        }
        return;
      }
      if (frame.type === 'approval/resolved' || frame.type === 'question/resolved') {
        Object.keys(pendings).forEach(function (rid) {
          var pl = pendings[rid].frame.payload;
          if (frame.type === 'approval/resolved' && pl.approvalId === frame.approvalId) delete pendings[rid];
          if (frame.type === 'question/resolved' && frame.questionRpcId === rid) delete pendings[rid];
        });
        renderPend();
        return;
      }
      // 收件箱快照（全量）：驱动队列芯片与队列面板。换会话/重进后为空，
      // 等下一次队列变动由宿主重新推送（与桌面客户端的 queueMirror 行为一致）。
      if (frame.type === 'session/queue') {
        if (current && frame.sessionId === current.sessionId) {
          queueItems = frame.items || [];
          renderQueueChip();
          renderQueueRows();
        }
        return;
      }
      if (frame.type !== 'session/event' || !frame.event) return;
      if (!current || frame.sessionId !== current.sessionId) return;
      applyLive(frame.event, frame.view);
    };
  }

  // 流式块：text / reasoning 增量落到对应元素上（打字机效果）。
  function applyChunk(d) {
    var c = d.chunk; if (!c) return;
    var key = d.turn + ':' + d.step + ':' + (c.index === undefined ? -1 : c.index);
    if (c.type === 'block-start') {
      if (liveEls[key]) return;
      streamedTurn = true;
      if (c.blockType === 'reasoning') {
        // 默认折叠不占屏：摘要实时刷新预览，想看细节随时点开。
        // 折叠块里流式是「隐形阶段」：芯片必须留在场（深度思考中），不能清。
        setHint('💭 深度思考中…');
        var det = document.createElement('details'); det.className = 'tl';
        var sumT = el('summary', null, '💭 Think…');
        det.appendChild(sumT);
        var body = el('div', 'inner', ''); det.appendChild(body);
        var live = true;
        det.addEventListener('toggle', function () {
          if (!det.open) return;
          revealDetails(det);  // 展开后把这块带进视野（页面滚动，不再有内层滚动框）
        });
        view.appendChild(det); liveEls[key] = { root: det, body: body, sm: sumT, kind: 'reasoning', live: function () { return live; }, die: function () { live = false; } };
      } else if (c.blockType === 'text') {
        clearHint();  // 正文开始吐字：可见反馈接管，芯片退场
        var box = el('div', 'msg assistant'); var body2 = el('div', 'a-text', '');
        box.appendChild(body2); view.appendChild(box);
        liveEls[key] = { root: box, body: body2, kind: 'text' };
      }
      scrollBottom();
    } else if (c.type === 'text-delta' || c.type === 'reasoning-delta') {
      var slot = liveEls[key]; if (!slot) return;
      slot.body.textContent += c.text;
      if (slot.kind === 'reasoning' && slot.sm) slot.sm.textContent = '💭 Think · ' + oneLine(slot.body.textContent, 56);
      // 展开的思考块现在是页面正常流的一部分：页面级近底部跟随即可覆盖，
      // 不再需要单独推内层滚动框（那个框已移除）。
      scrollBottom();
    } else if (c.type === 'block-end') {
      var slot2 = liveEls[key]; if (!slot2) return;
      if (c.block && c.block.text !== undefined) {
        // 文本块结束：用渲染后的成品替换流式纯文本（markdown → 排版）
        slot2.body.textContent = '';
        slot2.body.appendChild(mdToDom(c.block.text));
      }
      if (slot2.kind === 'reasoning') {
        if (slot2.sm) slot2.sm.textContent = '💭 Think · ' + oneLine(slot2.body.textContent, 56);
        if (slot2.die) slot2.die();
        slot2.root.open = false;  // 思考结束收起，点开可回看全文
      }
      delete liveEls[key];
    }
  }

  function applyLive(e, v) {
    if (typeof e.seq === 'number') { if (e.seq <= lastSeq) return; lastSeq = e.seq; }
    if (e.type === 'turn/start') {
      stopBtn.classList.remove('hidden');
      if (current) { current.running = true; current.blank = false; }
      refreshPresetChip();  // 开口即锁模式：芯片同步转只读，不留「还能切」的假象
      setHint('✨ Deep diving');
    }
    // 宿主换模式成功后会追加这条事件（桌面端也靠它同步）：手机端同步芯片显示
    if (e.type === 'agent-preset/selected' && current) {
      current.agentPreset = (e.data && e.data.agentPreset) || current.agentPreset;
      refreshPresetChip();
    }
    if (e.type === 'turn/end') {
      stopBtn.classList.add('hidden');
      if (current) current.running = false;
      clearHint();
      // 流式期间被推迟的对账：回合收尾后补一次
      if (pendingReconcile && current) {
        pendingReconcile = false;
        setTimeout(function () { if (current) loadHistory(true); }, 400);
      }
    }
    // 工具调用也是可见反馈，但行与行之间常有静默期：芯片同步换个说法留住「在工作」感
    if (e.type === 'tool/call' && pendingHint) setHint('🔧 ' + ((e.data && e.data.name) || '工具调用中'));
    // 终帧去重：本轮内容已由打字机流式渲染过，assistant/message 再画就是第二条重复回复
    if (e.type === 'assistant/message' && streamedTurn) { streamedTurn = false; return; }
    var node = renderEvent({ event: e, view: v });
    if (node) { view.appendChild(node); scrollBottom(); return; }
    if (e.type === 'assistant/chunk' && e.data) applyChunk(e.data);
  }

  function refreshModelChip() {
    if (!current) return;
    api('session.models', { sessionId: current.sessionId }).then(function (v) {
      lastModels = v;
      lastModelsSid = current.sessionId;
      var cur = v.current || {};
      modelChip.textContent = (cur.model || '模型') + ' ▾';
      modelChip.classList.remove('hidden');
    }).catch(function () { });
  }

  // ===================== 模式（官方 agent preset） =====================
  // 宿主规则（实测 apiProxy）：agentPreset.select 只接受**空白会话**，已经开过口的
  // 会话报 agent-preset-locked。所以手机端只在「新建」和「空白会话」给切换入口，
  // 已有消息的会话把芯片置为只读，不做「点了像成功其实没变」的假交互。
  function loadAgentPresets(force) {
    if (presetRoster && !force) return Promise.resolve(presetRoster);
    return api('agentPreset.list', {}).then(function (v) {
      var arr = (v && v.presets) || [];
      var def = null;
      arr.forEach(function (p) { if (p && p.isDefault) def = p.id; });
      presetRoster = { presets: arr, defaultId: def || (arr[0] && arr[0].id) || null };
      return presetRoster;
    });
  }
  /** id → 可读名（官方 preset.yml 的 name，如「织梦者」；缺失时退回 id）。 */
  function presetLabel(id) {
    if (!id) return '默认模式';
    var hit = null;
    if (presetRoster) {
      (presetRoster.presets || []).forEach(function (p) { if (p && p.id === id) hit = p; });
    }
    return (hit && hit.name) || id;
  }
  /** 会话是否还没开口：空白会话才允许换模式（与宿主 sessionBlank 判定对齐）。 */
  function sessionIsBlank(s) {
    if (!s) return false;
    if (s.fresh) return true;
    if (typeof s.blank === 'boolean') return s.blank;
    return false;
  }
  /** 顶行模式芯片：空白会话可点切换，已有消息显示锁定态。 */
  function refreshPresetChip() {
    if (!current) { presetChip.classList.add('hidden'); return; }
    var blank = sessionIsBlank(current);
    var label = presetLabel(current.agentPreset || (presetRoster && presetRoster.defaultId));
    presetChip.textContent = label + (blank ? ' ▾' : ' 🔒');
    presetChip.classList.toggle('locked', !blank);
    presetChip.title = blank ? '点按切换本会话模式' : '会话已有消息，模式已锁定（新建会话可选模式）';
    presetChip.classList.remove('hidden');
    // 名称要等清单回来才准确：拉一次后重绘（缓存命中不会重复请求）。
    if (!presetRoster) {
      var sid = current.sessionId;
      loadAgentPresets().then(function () {
        if (current && current.sessionId === sid) refreshPresetChip();
      }).catch(function () { });
    }
  }
  /**
   * 模式选择器（新建面板与模式面板共用）：原生 select，选中即回调。
   * onPick 拿到 id；render 只画控件，不做请求。
   */
  function renderPresetPicker(host, currentId, onPick) {
    var box = el('div', 'preset-picker', '');
    var sel = document.createElement('select');
    var list = (presetRoster && presetRoster.presets) || [];
    if (!list.length) {
      box.appendChild(el('div', 'preset-note', '读不到模式清单，将使用桌面端默认模式'));
      host.appendChild(box);
      return box;
    }
    list.forEach(function (p) {
      if (!p || !p.id) return;
      var opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = (p.name || p.id) + (p.isDefault ? '（默认）' : '') + (p.broken ? '（不可用）' : '');
      if (p.broken) opt.disabled = true;
      if (p.id === currentId) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', function () { if (onPick) onPick(sel.value); });
    box.appendChild(sel);
    var hit = null;
    list.forEach(function (p) { if (p && p.id === (currentId || (presetRoster && presetRoster.defaultId))) hit = p; });
    if (hit && hit.description) box.appendChild(el('div', 'preset-note', hit.description));
    host.appendChild(box);
    return box;
  }
  /** 空白会话切换模式：走官方 agentPreset.select，失败保留原模式并说明原因。 */
  function openPresetSheet() {
    if (!current) return;
    if (!sessionIsBlank(current)) {
      toast('会话已有消息，模式已锁定；新建会话时可选模式');
      return;
    }
    openSheet();
    sheetBody.innerHTML = '';
    sheetBody.appendChild(el('div', 'grp-name', '会话模式'));
    if (!presetRoster) sheetBody.appendChild(el('div', 'loading', '加载中…'));
    loadAgentPresets().then(function () {
      if (sheet.classList.contains('hidden') || !current) return;
      sheetBody.innerHTML = '';
      sheetBody.appendChild(el('div', 'grp-name', '会话模式'));
      var sid = current.sessionId;
      renderPresetPicker(sheetBody, current.agentPreset || presetRoster.defaultId, function (id) {
        toast('正在切换到 ' + presetLabel(id) + '…');
        api('agentPreset.select', { sessionId: sid, agentPreset: id }).then(function (v) {
          var applied = (v && v.agentPreset) || id;
          if (current && current.sessionId === sid) {
            current.agentPreset = applied;
            refreshPresetChip();
          }
          closeSheet(false);
          toast('已切换到 ' + presetLabel(applied) + ' ✓');
        }).catch(function (e) {
          toast('切换失败：' + e.message, true);
          refreshPresetChip();
        });
      });
      sheetBody.appendChild(el('div', 'preset-note', '模式决定这条会话挂载哪套人设与技能；一旦发出第一条消息就固定下来。'));
    }).catch(function (e) {
      if (sheet.classList.contains('hidden')) return;
      sheetBody.innerHTML = '';
      sheetBody.appendChild(el('div', 'err', '模式清单加载失败：' + e.message));
    });
  }
  presetChip.addEventListener('click', openPresetSheet);

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = String(text);
    return n;
  }
  function api(method, payload) {
    return fetch('/remote/api/' + method, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload || {})
    }).then(function (r) { return r.json(); }).then(function (b) {
      if (b.ok) return b.value;
      throw new Error(b.error && b.error.message ? b.error.message : '请求失败');
    });
  }
  function titleOf(s) {
    return (s.projections && s.projections.values && s.projections.values.title) || s.sessionId;
  }
  function fmtTime(ts) {
    if (!ts) return '';
    var d = new Date(ts), diff = Date.now() - ts;
    function p(x) { return (x < 10 ? '0' : '') + x; }
    if (diff < 60 * 1000) return '刚刚';
    if (diff < 3600 * 1000) return Math.floor(diff / 60000) + ' 分钟前';
    if (diff < 86400 * 1000) return Math.floor(diff / 3600000) + ' 小时前';
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function tail(path) { return path.split('\\\\').pop(); }
  function textOf(content) {
    if (!Array.isArray(content)) return '';
    return content.filter(function (c) { return c && c.type === 'text' && c.text; })
      .map(function (c) { return c.text; }).join('\\n');
  }
  function oneLine(s, n) {
    s = String(s || '').replace(/\\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n) + '…' : s;
  }
  function argPreview(data) {
    // 取第一个字符串/数字参数做预览（桌面端同款：工具名 · 路径/关键词）
    var p = '';
    try {
      var a = JSON.parse((data && data.arguments) || '{}');
      for (var k in a) {
        if (typeof a[k] === 'string' && a[k]) { p = a[k]; break; }
        if (typeof a[k] === 'number') { p = String(a[k]); break; }
      }
    } catch (err) { p = (data && data.arguments) || ''; }
    return oneLine(p, 46);
  }
  /** 折叠块里纯文本的首屏字数；更长的点一下看全文。 */
  var TEXT_HEAD_CHARS = 1200;
  // ===================== 图片：渲染 + 取回 + 上传 =====================
  // 官方内容块里的图片是 {type:'image', attachment:{attachmentId, mediaType,...}}
  // 引用；字节要另调 session.attachment（base64）取回，内存缓存避免重复拉。
  var imgCache = {};   // attachmentId → dataURL（base64，进程生命周期内有效）
  var imgPending = {}; // attachmentId → Promise，防同帧重复请求
  function fetchAttachment(sessionId, attachmentId) {
    if (imgCache[attachmentId]) return Promise.resolve(imgCache[attachmentId]);
    if (imgPending[attachmentId]) return imgPending[attachmentId];
    imgPending[attachmentId] = api('session.attachment', { sessionId: sessionId, attachmentId: attachmentId })
      .then(function (v) {
        var url = 'data:' + (v.attachment && v.attachment.mediaType || 'image/png') + ';base64,' + v.data;
        imgCache[attachmentId] = url;
        delete imgPending[attachmentId];
        return url;
      })
      .catch(function (e) { delete imgPending[attachmentId]; throw e; });
    return imgPending[attachmentId];
  }
  /** 一个 image 内容块 → 缩略图节点（点击全屏）；字节异步补位。 */
  function renderImageBlock(sid, block) {
    var ref = block && block.attachment;
    if (!ref || !ref.attachmentId) return null;
    var img = document.createElement('img');
    img.className = 'msg-img';
    img.alt = ref.name || '图片';
    if (ref.width && ref.height) img.style.aspectRatio = ref.width + ' / ' + ref.height;
    var cached = imgCache[ref.attachmentId];
    if (cached) img.src = cached;
    else {
      img.addEventListener('error', function () { img.classList.add('img-broken'); });
      fetchAttachment(sid, ref.attachmentId).then(function (url) { img.src = url; })
        .catch(function () { img.classList.add('img-broken'); });
    }
    img.addEventListener('click', function () { imageViewer(img); });
    return img;
  }
  /** 全屏查看器：点击任意处关闭。 */
  var viewer = document.getElementById('viewer');
  var viewerImg = viewer.querySelector('img');
  function imageViewer(source) {
    if (!source || !source.src) return;
    viewerImg.src = source.src;
    viewerImg.alt = source.alt || '';
    viewer.classList.remove('hidden');
  }
  viewer.addEventListener('click', function () {
    viewer.classList.add('hidden');
    viewerImg.src = '';
  });
  /**
   * 内容数组里抽出图片块（user/assistant 顶层；tool-result 嵌套时递归）。
   */
  function collectImageBlocks(content, deep) {
    var out = [];
    (Array.isArray(content) ? content : []).forEach(function (c) {
      if (!c || typeof c !== 'object') return;
      if (c.type === 'image' && c.attachment && c.attachment.attachmentId) out.push(c);
      else if (deep && c.type === 'tool-result' && Array.isArray(c.content)) {
        collectImageBlocks(c.content, true).forEach(function (x) { out.push(x); });
      }
    });
    return out;
  }
  /** =================== 图片渲染结束，上传部分见 send() 附近 =================== */
  /**
   * 长纯文本：先给开头一段 + 「展开全文」，避免展开后是一堵划不完的墙。
   * 与代码块同策略，只是按字数而非行数切。
   */
  function longText(text) {
    var s = String(text === undefined || text === null ? '' : text);
    var wrap = el('div', 'tl-text', '');
    if (s.length <= TEXT_HEAD_CHARS) { wrap.textContent = s; return wrap; }
    var head = el('div', null, s.slice(0, TEXT_HEAD_CHARS) + '…');
    var btn = el('button', 'code-more', '展开全文（还有 ' + (s.length - TEXT_HEAD_CHARS) + ' 字）');
    btn.addEventListener('click', function (ev) {
      ev.preventDefault(); ev.stopPropagation();
      var anchor = wrap.getBoundingClientRect().top;
      head.textContent = s;
      btn.remove();
      window.scrollBy(0, wrap.getBoundingClientRect().top - anchor);
    });
    wrap.appendChild(head); wrap.appendChild(btn);
    return wrap;
  }
  /**
   * 展开折叠块后把它带进视野（页面滚动，无内层滚动框）。
   * 展开点在屏幕上半 → 不动，内容自然向下铺开；被顶出视野或整块比屏幕高
   * → 把摘要行贴到顶栏下方，从头开始读。
   */
  function revealDetails(det) {
    requestAnimationFrame(function () {
      var r = det.getBoundingClientRect();
      // 吸顶层高度实测，不写死：主题与字号变化时顶栏高度会漂。
      var dl = document.getElementById('devline');
      var topBar = (document.getElementById('bar') || { offsetHeight: 49 }).offsetHeight +
                   (dl ? dl.offsetHeight : 0) + 6;
      var vh = window.innerHeight;
      if (r.top >= topBar && (r.bottom <= vh || r.top <= vh * 0.5)) return;
      window.scrollTo(0, Math.max(0, window.scrollY + r.top - topBar));
    });
  }
  // 时间线行：摘要一行（桌面端样式），点开看全文；body 可为字符串或 DOM 节点
  function tlRow(icon, label, preview, body) {
    var det = document.createElement('details'); det.className = 'tl';
    var sum = el('summary', null, '');
    sum.appendChild(el('span', 'tl-ico', icon));
    sum.appendChild(document.createTextNode(' ' + label + (preview ? ' · ' + preview : '')));
    det.appendChild(sum);
    if (body) {
      var inner = el('div', 'inner', '');
      // 纯文本体（Think / 注入全文）过长时先给开头，点一下看全文：内层
      // 滚动框已移除，几千字一次铺开会变成一堵划不完的墙。
      if (typeof body === 'string') inner.appendChild(longText(body));
      else inner.appendChild(body);
      det.appendChild(inner);
      det.addEventListener('toggle', function () { if (det.open) revealDetails(det); });
    }
    return det;
  }
  /** 首屏代码行数；更长的内容点一下展开（避免一次塞进上千个节点）。 */
  var CODE_HEAD_LINES = 44;
  /**
   * 代码块：一行一个节点 + 软换行 + 悬挂缩进。
   * 手机上横向滚动等于把几十行代码压成一条要左右拖的长线；改为按行渲染后，
   * 折行的续行缩进 2 字符，肉眼能区分「真实换行」和「屏幕折行」。
   */
  function codeBlock(text) {
    var lines = String(text === undefined || text === null ? '' : text).split('\\n');
    var box = el('div', 'md-pre', '');
    function paint(limit) {
      box.textContent = '';
      var n = Math.min(limit, lines.length);
      for (var i = 0; i < n; i++) box.appendChild(el('div', 'code-line', lines[i] === '' ? ' ' : lines[i]));
      if (lines.length > n) {
        var btn = el('button', 'code-more', '展开剩余 ' + (lines.length - n) + ' 行');
        btn.addEventListener('click', function (ev) {
          ev.preventDefault(); ev.stopPropagation();
          // 展开会在按钮之前插入大量行：锚住代码块顶部的屏幕位置，
          // 展开后按位移回补，正在读的那一行不被顶飞。
          var anchor = box.getBoundingClientRect().top;
          paint(lines.length);
          window.scrollBy(0, box.getBoundingClientRect().top - anchor);
        });
        box.appendChild(btn);
      }
    }
    paint(CODE_HEAD_LINES);
    return box;
  }
  /** 文档类文件才走 markdown 成品预览；代码/配置按原文显示。 */
  function looksLikeMarkdown(p) {
    return /\\.(md|markdown|mdx)$/i.test(String(p || ''));
  }
  /** 路径末段（同时兼容 Windows 反斜杠与正斜杠）。 */
  function baseName(p) {
    return tail(String(p || '')).split('/').pop();
  }
  /**
   * 行级 diff（LCS）：先削掉相同的首尾，只对中间做 DP，规模超上限就退化成
   * 「整段删 + 整段增」，避免大文本把 DP 表撑爆。
   */
  function diffLines(oldText, newText) {
    var a = String(oldText === undefined || oldText === null ? '' : oldText).split('\\n');
    var b = String(newText === undefined || newText === null ? '' : newText).split('\\n');
    var head = 0;
    while (head < a.length && head < b.length && a[head] === b[head]) head++;
    var tailLen = 0;
    while (tailLen < a.length - head && tailLen < b.length - head &&
           a[a.length - 1 - tailLen] === b[b.length - 1 - tailLen]) tailLen++;
    var am = a.slice(head, a.length - tailLen);
    var bm = b.slice(head, b.length - tailLen);
    var out = [], i, j;
    for (i = 0; i < head; i++) out.push({ t: ' ', s: a[i] });
    if (am.length * bm.length > 40000) {
      for (i = 0; i < am.length; i++) out.push({ t: '-', s: am[i] });
      for (i = 0; i < bm.length; i++) out.push({ t: '+', s: bm[i] });
    } else {
      var n = am.length, m = bm.length, dp = [];
      for (i = 0; i <= n; i++) { dp.push(new Array(m + 1)); dp[i][m] = 0; }
      for (j = 0; j <= m; j++) dp[n][j] = 0;
      for (i = n - 1; i >= 0; i--) {
        for (j = m - 1; j >= 0; j--) {
          dp[i][j] = am[i] === bm[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
      }
      i = 0; j = 0;
      while (i < n && j < m) {
        if (am[i] === bm[j]) { out.push({ t: ' ', s: am[i] }); i++; j++; }
        else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ t: '-', s: am[i] }); i++; }
        else { out.push({ t: '+', s: bm[j] }); j++; }
      }
      while (i < n) { out.push({ t: '-', s: am[i] }); i++; }
      while (j < m) { out.push({ t: '+', s: bm[j] }); j++; }
    }
    for (i = b.length - tailLen; i < b.length; i++) out.push({ t: ' ', s: b[i] });
    return out;
  }
  function diffStat(rows) {
    var add = 0, del = 0;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].t === '+') add++; else if (rows[i].t === '-') del++;
    }
    return { add: add, del: del };
  }
  /** 统一 diff 呈现：改动行前后各留 3 行上下文，未变的长段折成一行提示。 */
  var DIFF_CTX = 3, DIFF_MAX_ROWS = 400;
  function diffBlock(rows) {
    var keep = {}, i, k;
    for (i = 0; i < rows.length; i++) {
      if (rows[i].t === ' ') continue;
      for (k = Math.max(0, i - DIFF_CTX); k <= Math.min(rows.length - 1, i + DIFF_CTX); k++) keep[k] = 1;
    }
    var box = el('div', 'md-pre', ''), skipped = 0, painted = 0;
    for (i = 0; i < rows.length; i++) {
      if (!keep[i]) { skipped++; continue; }
      if (skipped) { box.appendChild(el('div', 'diff-skip', '⋯ ' + skipped + ' 行未变')); skipped = 0; }
      if (painted >= DIFF_MAX_ROWS) {
        box.appendChild(el('div', 'diff-skip', '⋯ 其余 ' + (rows.length - i) + ' 行省略'));
        return box;
      }
      var r = rows[i];
      var cls = r.t === '+' ? 'diff-line diff-add' : (r.t === '-' ? 'diff-line diff-del' : 'diff-line diff-ctx');
      box.appendChild(el('div', cls, r.t + ' ' + r.s));
      painted++;
    }
    if (skipped) box.appendChild(el('div', 'diff-skip', '⋯ ' + skipped + ' 行未变'));
    return box;
  }
  /** 工具参数解析一次，摘要与展开体共用（diff 的 DP 不做两遍）。 */
  function parseArgs(d) {
    if (d.__args) return d.__args;
    var a = {};
    try { a = JSON.parse(d.arguments || '{}') || {}; } catch (err) { }
    if (typeof a !== 'object' || a === null) a = { arguments: a };
    try { d.__args = a; } catch (err) { }
    return a;
  }
  /** 取编辑类工具的前后文本（edit / str_replace 等命名都兼容）。 */
  function editPair(a) {
    var o = a.old_string !== undefined ? a.old_string : (a.oldText !== undefined ? a.oldText : a.old_str);
    var n = a.new_string !== undefined ? a.new_string : (a.newText !== undefined ? a.newText : a.new_str);
    return (typeof o === 'string' && typeof n === 'string') ? { o: o, n: n } : null;
  }
  function editRows(d, pair) {
    if (d.__diff) return d.__diff;
    var rows = diffLines(pair.o, pair.n);
    try { d.__diff = rows; } catch (err) { }
    return rows;
  }
  /* ─────────────────────── GenUI（dsh-ui 围栏）────────────────────────
     桌面端由 dsh-genui 插件的 React 渲染器接管 dsh-ui 围栏；手机页是零
     React 的原生 DOM 页面，加载不到那套 bundle，围栏此前只能以原始 JSON
     示人。这里用页面自己的 el()/inline()/md-* 设施做一份降级渲染：
     结构类组件（文字/列表/表格/键值/提示/指标/步骤…）原生画出来，图形类
     （chart/plot/mermaid/scene3d…）给一行占位提示 + 数据兜底，交互类只画
     静态外观、不接 [genui-action] 回路（移动端无宿主 storage，持久化那套
     不在本轮范围）。任何一步失败都退回 codeBlock —— 最坏不比改动前差。 */
  var GENUI_MAX_NODES = 200, GENUI_MAX_DEPTH = 8;
  /** 组件树规模闸门：整棵树共享一个预算，超出即停（防超长 spec 撑爆手机）。 */
  function genuiBudget() { return { n: GENUI_MAX_NODES }; }
  /** 图形/重型组件的统一占位行。 */
  function genuiStub(label) {
    return el('div', 'gu-stub', label);
  }
  /** {label,value} 数组 → 两列表：chart 之类图形组件的数据兜底。 */
  function genuiPairTable(pairs, headKey, headVal) {
    var tb = document.createElement('table'); tb.className = 'md-table';
    var hr = document.createElement('tr');
    hr.appendChild(el('th', null, headKey));
    hr.appendChild(el('th', null, headVal));
    tb.appendChild(hr);
    for (var i = 0; i < pairs.length && i < 40; i++) {
      var tr = document.createElement('tr');
      tr.appendChild(el('td', null, String(pairs[i] && pairs[i].k !== undefined ? pairs[i].k : '')));
      tr.appendChild(el('td', null, String(pairs[i] && pairs[i].v !== undefined ? pairs[i].v : '')));
      tb.appendChild(tr);
    }
    return tb;
  }
  /** 一个 GenUI 节点 → DOM；返回 null 表示这个节点不产出内容。 */
  function genuiNode(node, depth, budget) {
    if (!node || typeof node !== 'object') return null;
    if (depth > GENUI_MAX_DEPTH) return null;
    if (budget.n <= 0) return null;
    budget.n--;
    var type = String(node.type || '');
    var i, box, row, items;
    // 子节点数组 → 容器（row/col/grid 在窄屏统一竖排：横排必然挤成一团）
    function kids(list, cls) {
      var wrap = el('div', cls || 'gu-col', '');
      if (!Array.isArray(list)) return wrap;
      for (var ki = 0; ki < list.length; ki++) {
        var child = genuiNode(list[ki], depth + 1, budget);
        if (child) wrap.appendChild(child);
      }
      return wrap;
    }
    switch (type) {
      case 'text': {
        var size = String(node.size || 'body');
        var cls = size === 'h1' ? 'md-h1' : size === 'h2' ? 'md-h2' : size === 'h3' ? 'md-h3'
          : size === 'muted' ? 'gu-muted' : size === 'caption' ? 'gu-caption' : 'md-p';
        box = el('div', cls + (node.center ? ' gu-center' : ''), '');
        inlineMd(box, node.content);
        return box;
      }
      case 'row': case 'col': return kids(node.items, 'gu-col');
      case 'grid': return kids(node.items, 'gu-col');
      case 'card': {
        box = el('div', 'gu-card', '');
        if (node.title !== undefined) box.appendChild(el('div', 'gu-card-title', node.title));
        box.appendChild(kids(node.items, 'gu-col'));
        return box;
      }
      case 'divider': return el('hr', 'md-hr');
      case 'spacer': return el('div', 'gu-spacer', '');
      case 'badge': {
        var tone = String(node.tone || '');
        var bcls = 'gu-badge' + (tone ? ' gu-badge-' + tone : '');
        return el('span', bcls, (node.icon ? node.icon + ' ' : '') + String(node.label === undefined ? '' : node.label));
      }
      case 'stat': {
        box = el('div', 'gu-stat', '');
        box.appendChild(el('div', 'gu-stat-label', node.label));
        box.appendChild(el('div', 'gu-stat-value', node.value));
        if (node.delta !== undefined) {
          var down = String(node.delta).charAt(0) === '-';
          box.appendChild(el('div', 'gu-stat-delta ' + (down ? 'gu-down' : 'gu-up'), node.delta));
        }
        return box;
      }
      case 'progress': {
        box = el('div', 'gu-progress', '');
        var pv = Math.max(0, Math.min(100, Number(node.value) || 0));
        if (node.label !== undefined || node.valueLabel !== undefined) {
          row = el('div', 'gu-progress-row', '');
          row.appendChild(el('span', null, node.label === undefined ? '' : node.label));
          row.appendChild(el('span', null, node.valueLabel === undefined ? pv + '%' : node.valueLabel));
          box.appendChild(row);
        }
        var track = el('div', 'gu-track', '');
        var fill = el('div', 'gu-fill', '');
        fill.style.width = pv + '%';
        track.appendChild(fill); box.appendChild(track);
        return box;
      }
      case 'list': {
        items = Array.isArray(node.items) ? node.items : [];
        box = el('div', 'gu-list', '');
        for (i = 0; i < items.length && i < 60; i++) {
          var it = items[i];
          var liEl = el('div', 'md-li', '');
          if (it && typeof it === 'object') {
            var tEl = el('span', 'gu-li-title', '');
            inlineMd(tEl, it.title);
            liEl.appendChild(tEl);
            if (it.desc !== undefined) {
              var dEl = el('span', 'gu-li-desc', '');
              inlineMd(dEl, it.desc);
              liEl.appendChild(dEl);
            }
          } else inlineMd(liEl, it);
          box.appendChild(liEl);
        }
        return box;
      }
      case 'keyvalue': {
        var pairs = Array.isArray(node.pairs) ? node.pairs : [];
        box = el('div', 'gu-kv', '');
        for (i = 0; i < pairs.length && i < 60; i++) {
          row = el('div', 'gu-kv-row', '');
          row.appendChild(el('div', 'gu-kv-key', pairs[i] && pairs[i].key));
          var vEl = el('div', 'gu-kv-val', '');
          inlineMd(vEl, pairs[i] && pairs[i].value);
          row.appendChild(vEl);
          box.appendChild(row);
        }
        return box;
      }
      case 'table': {
        var cols = Array.isArray(node.columns) ? node.columns : [];
        var rows = Array.isArray(node.rows) ? node.rows : [];
        var tb = document.createElement('table'); tb.className = 'md-table';
        if (cols.length) {
          var trh = document.createElement('tr');
          for (i = 0; i < cols.length; i++) trh.appendChild(el('th', null, cols[i]));
          tb.appendChild(trh);
        }
        for (i = 0; i < rows.length && i < 80; i++) {
          var cells = Array.isArray(rows[i]) ? rows[i] : [rows[i]];
          var trb = document.createElement('tr');
          for (var ci = 0; ci < cells.length; ci++) {
            var td = el('td', null, '');
            inlineMd(td, cells[ci]);
            trb.appendChild(td);
          }
          tb.appendChild(trb);
        }
        return tb;
      }
      case 'callout': {
        var ctone = String(node.tone || 'info');
        box = el('div', 'gu-callout gu-callout-' + ctone, '');
        if (node.title !== undefined) box.appendChild(el('div', 'gu-callout-title', node.title));
        var cBody = el('div', null, '');
        inlineMd(cBody, node.content);
        box.appendChild(cBody);
        return box;
      }
      case 'steps': {
        items = Array.isArray(node.steps) ? node.steps : [];
        var cur = Number(node.current);
        box = el('div', 'gu-steps', '');
        for (i = 0; i < items.length && i < 40; i++) {
          var st = items[i] || {};
          var done = Number.isFinite(cur) && i < cur;
          var active = Number.isFinite(cur) && i === cur;
          row = el('div', 'gu-step' + (active ? ' gu-step-active' : ''), '');
          row.appendChild(el('span', 'gu-step-no', done ? '✓' : String(i + 1)));
          var sBody = el('div', 'gu-step-body', '');
          sBody.appendChild(el('div', 'gu-step-title', st.title));
          if (st.desc !== undefined) sBody.appendChild(el('div', 'gu-step-desc', st.desc));
          row.appendChild(sBody);
          box.appendChild(row);
        }
        return box;
      }
      case 'timeline': {
        items = Array.isArray(node.items) ? node.items : [];
        box = el('div', 'gu-timeline', '');
        for (i = 0; i < items.length && i < 40; i++) {
          var tl = items[i] || {};
          row = el('div', 'gu-tl-item', '');
          var head = el('div', 'gu-tl-head', '');
          head.appendChild(el('span', 'gu-tl-title', tl.title));
          if (tl.time !== undefined) head.appendChild(el('span', 'gu-tl-time', tl.time));
          row.appendChild(head);
          if (tl.desc !== undefined) row.appendChild(el('div', 'gu-tl-desc', tl.desc));
          box.appendChild(row);
        }
        return box;
      }
      case 'breadcrumb': {
        items = Array.isArray(node.items) ? node.items : [];
        return el('div', 'gu-crumb', items.slice(0, 12).join(' / '));
      }
      case 'avatar': {
        var nm = String(node.name === undefined ? '' : node.name);
        box = el('div', 'gu-avatar', nm.slice(0, 1).toUpperCase());
        if (node.color) box.style.background = String(node.color);
        return box;
      }
      case 'code': return codeBlock(node.code);
      case 'copy': return el('div', 'gu-stub', '📋 ' + String(node.label || '复制') + '（桌面端可点）');
      case 'quiz': {
        // 静态外观：题干 + 选项，不判题（交互回路不在本轮范围）
        box = el('div', 'gu-card', '');
        var qT = el('div', 'gu-card-title', '');
        inlineMd(qT, node.question);
        box.appendChild(qT);
        items = Array.isArray(node.options) ? node.options : [];
        for (i = 0; i < items.length && i < 12; i++) {
          box.appendChild(el('div', 'gu-opt', '○ ' + String((items[i] && items[i].label) || '')));
        }
        if (node.explanation !== undefined) box.appendChild(el('div', 'gu-muted', node.explanation));
        return box;
      }
      case 'radio': {
        box = el('div', 'gu-field', '');
        if (node.label !== undefined) box.appendChild(el('div', 'gu-field-label', node.label));
        items = Array.isArray(node.options) ? node.options : [];
        var sel = Number(node.selected);
        for (i = 0; i < items.length && i < 12; i++) {
          box.appendChild(el('div', 'gu-opt', (i === sel ? '◉ ' : '○ ') + String(items[i])));
        }
        return box;
      }
      case 'select': {
        box = el('div', 'gu-field', '');
        if (node.label !== undefined) box.appendChild(el('div', 'gu-field-label', node.label));
        items = Array.isArray(node.options) ? node.options : [];
        var si2 = Number(node.selected);
        box.appendChild(el('div', 'gu-control', Number.isFinite(si2) && items[si2] !== undefined ? String(items[si2]) + ' ▾' : '请选择… ▾'));
        return box;
      }
      case 'input': case 'textarea': {
        box = el('div', 'gu-field', '');
        if (node.label !== undefined) box.appendChild(el('div', 'gu-field-label', node.label));
        box.appendChild(el('div', 'gu-control', node.value !== undefined && node.value !== ''
          ? String(node.value) : String(node.placeholder || '')));
        return box;
      }
      case 'checkbox': case 'switch': {
        return el('div', 'gu-opt', (node.checked === true ? '☑ ' : '☐ ') + String(node.label === undefined ? '' : node.label));
      }
      case 'slider': {
        box = el('div', 'gu-field', '');
        if (node.label !== undefined) box.appendChild(el('div', 'gu-field-label', node.label));
        box.appendChild(el('div', 'gu-control', String(node.value === undefined ? '' : node.value)));
        return box;
      }
      case 'button': case 'submit': {
        return el('div', 'gu-btn-static', (node.icon ? node.icon + ' ' : '') + String(node.label === undefined ? '' : node.label));
      }
      case 'link': {
        // href 白名单与桌面端一致：只接受 http(s)/mailto
        var href = String(node.href === undefined ? '' : node.href);
        if (/^(https?:|mailto:)/i.test(href)) {
          var a = el('a', 'gu-link', node.label);
          a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
          return a;
        }
        return el('span', 'gu-link-text', node.label);
      }
      case 'tabs': {
        // 平铺展开：窄屏切页签不如全看见
        items = Array.isArray(node.tabs) ? node.tabs : [];
        box = el('div', 'gu-col', '');
        for (i = 0; i < items.length && i < 8; i++) {
          var tab = items[i] || {};
          var tCard = el('div', 'gu-card', '');
          tCard.appendChild(el('div', 'gu-card-title', tab.label));
          tCard.appendChild(kids(tab.items, 'gu-col'));
          box.appendChild(tCard);
        }
        return box;
      }
      case 'accordion': {
        items = Array.isArray(node.items) ? node.items : [];
        box = el('div', 'gu-col', '');
        for (i = 0; i < items.length && i < 12; i++) {
          var sec = items[i] || {};
          var det = document.createElement('details'); det.className = 'tl';
          var sm = el('summary', null, String(sec.title || ''));
          det.appendChild(sm);
          var inner = el('div', 'inner', '');
          inner.appendChild(kids(sec.items, 'gu-col'));
          det.appendChild(inner);
          box.appendChild(det);
        }
        return box;
      }
      case 'chart': {
        // 图形降级：占位 + 数据两列表（数据本身在手机上照样有用）
        box = el('div', 'gu-col', '');
        box.appendChild(genuiStub('📊 ' + String(node.kind || 'bars') + ' 图表（桌面端查看图形）'));
        var data = Array.isArray(node.data) ? node.data : [];
        if (data.length) {
          var dp = [];
          for (i = 0; i < data.length; i++) dp.push({ k: data[i] && data[i].label, v: data[i] && data[i].value });
          box.appendChild(genuiPairTable(dp, '项', '值'));
        }
        return box;
      }
      case 'plot': return genuiStub('📈 函数图（桌面端查看）');
      case 'mermaid': return genuiStub('🔀 图表 mermaid（桌面端查看）');
      case 'scene3d': return genuiStub('🧊 3D 场景（桌面端查看）');
      case 'file-tree': return genuiStub('🗂 文件树（桌面端查看）');
      case 'json': return codeBlock(genuiStringify(node.value));
      case 'diff': {
        // 页面已有真 diff 设施：直接复用
        var ds = Array.isArray(node.diffs) ? node.diffs : [];
        box = el('div', 'gu-col', '');
        for (i = 0; i < ds.length && i < 6; i++) {
          var d0 = ds[i] || {};
          box.appendChild(el('div', 'gu-field-label', d0.path));
          box.appendChild(diffBlock(diffLines(d0.oldText === null ? '' : d0.oldText, d0.newText)));
        }
        return box;
      }
      default: return null;
    }
  }
  /** JSON 值 → 展示串（循环引用等异常一律降级为 String）。 */
  function genuiStringify(v) {
    try { return JSON.stringify(v, null, 2); } catch (err) { return String(v); }
  }
  /**
   * 行内 markdown（粗体 + 行内码）→ 追加进 parent，纯 textContent 拼装。
   * mdToDom 的同名闭包与 GenUI 渲染器共用同一实现：GenUI 的 text/list/
   * table/callout 等字段允许模型写 **粗体** 与行内码，两处必须一致。
   */
  function inlineMd(parent, s) {
    var parts = String(s === undefined || s === null ? '' : s).split(BQ);
    for (var pi = 0; pi < parts.length; pi++) {
      if (pi % 2 === 1) { if (parts[pi]) parent.appendChild(el('code', 'md-code', parts[pi])); continue; }
      var segs = parts[pi].split('**');
      for (var si = 0; si < segs.length; si++) {
        if (si % 2 === 1) parent.appendChild(el('b', null, segs[si]));
        else if (segs[si]) parent.appendChild(document.createTextNode(segs[si]));
      }
    }
  }
  /**
   * dsh-ui 围栏体 → DOM；解析失败、非法 spec、零产出一律返回 null，
   * 由 fenceBlock 退回代码块（最坏情况不比改动前差）。
   */
  function genuiToDom(raw) {
    var spec;
    try { spec = JSON.parse(String(raw)); } catch (err) { return null; }
    if (!spec || typeof spec !== 'object' || !Array.isArray(spec.items)) return null;
    // panel:true 是桌面端的面板 dock 指令，手机页没有那个座位：按普通卡片渲染，
    // 免得内容整块消失（桌面端此时 inline 渲染为空是有意的）。
    var budget = genuiBudget();
    var wrap = el('div', 'gu-block', '');
    if (spec.title !== undefined) wrap.appendChild(el('div', 'gu-title', spec.title));
    var body = el('div', 'gu-col', '');
    if (typeof spec.gap === 'number' && spec.gap >= 0 && spec.gap <= 48) body.style.gap = spec.gap + 'px';
    for (var i = 0; i < spec.items.length; i++) {
      var child = genuiNode(spec.items[i], 0, budget);
      if (child) body.appendChild(child);
    }
    if (!body.childNodes.length) return null;
    wrap.appendChild(body);
    return wrap;
  }
  /** 围栏统一入口：dsh-ui 试走 GenUI，其余（或失败）走代码块。 */
  function fenceBlock(text, lang) {
    if (String(lang || '') === 'dsh-ui') {
      var node = genuiToDom(text);
      if (node) return node;
    }
    return codeBlock(text);
  }
  // 极简 markdown 渲染：全部 DOM textContent 拼装（零 innerHTML，天然免疫注入）。
  // 支持：标题/粗体/行内码/围栏码/引用/列表/表格/分隔线。
  // 围栏的语言标签会被记下：dsh-ui 走 GenUI 渲染器，其余一律代码块原文。
  function mdToDom(text) {
    var frag = document.createDocumentFragment();
    var lines = String(text || '').split('\\n');
    var inCode = false, codeBuf = [], para = [], tableRows = [], codeLang = '';
    var inline = inlineMd;  // 与 GenUI 渲染器共用同一实现（见 inlineMd）
    function flushPara() {
      if (!para.length) return;
      var p = el('div', 'md-p', ''); inline(p, para.join(' ')); frag.appendChild(p); para = [];
    }
    function flushTable() {
      if (!tableRows.length) return;
      var tb = document.createElement('table'); tb.className = 'md-table';
      var realRow = 0;
      tableRows.forEach(function (r) {
        var cells = r.split('|').map(function (x) { return x.trim(); });
        if (cells.length > 1 && cells.join('') !== '' &&
            cells.every(function (x) { return x === '' || /^:?-+:?$/.test(x); })) return;  // |---| 分隔行
        var trEl = document.createElement('tr');
        cells.forEach(function (cTxt, ci) {
          if ((ci === 0 || ci === cells.length - 1) && cTxt === '') return;  // 起止竖线产生的空段
          var cEl = document.createElement(realRow === 0 ? 'th' : 'td');
          inline(cEl, cTxt); trEl.appendChild(cEl);
        });
        tb.appendChild(trEl); realRow++;
      });
      frag.appendChild(tb); tableRows = [];
    }
    for (var li = 0; li < lines.length; li++) {
      var t = lines[li].trim();
      if (inCode) {
        if (t.indexOf(F3) === 0) { frag.appendChild(fenceBlock(codeBuf.join('\\n'), codeLang)); inCode = false; codeBuf = []; codeLang = ''; }
        else codeBuf.push(lines[li]);
        continue;
      }
      if (t.indexOf(F3) === 0) { flushPara(); flushTable(); inCode = true; codeLang = t.slice(F3.length).trim().toLowerCase(); continue; }
      if (t === '') { flushPara(); flushTable(); continue; }
      if (/^#{1,6} /.test(t)) {
        flushPara(); flushTable();
        var lvl = Math.min(t.match(/^#+/)[0].length, 4);
        var h = el('div', 'md-h' + lvl, ''); inline(h, t.replace(/^#+\\s*/, '')); frag.appendChild(h);
        continue;
      }
      if (t.charAt(0) === '|') { flushPara(); tableRows.push(t); continue; }
      if (t === '---' || t === '***') { flushPara(); flushTable(); frag.appendChild(el('hr', 'md-hr')); continue; }
      if (t.charAt(0) === '>') {
        flushPara(); flushTable();
        var q = el('div', 'md-quote', ''); inline(q, t.replace(/^>\\s*/, '')); frag.appendChild(q);
        continue;
      }
      var ml = t.match(/^(\\d+\\.|-|\\*)\\s+(.*)$/);
      if (ml) { flushPara(); flushTable(); frag.appendChild(el('div', 'md-li', '')); var liEl = frag.lastChild; inline(liEl, ml[2]); continue; }
      para.push(t);
    }
    // 未闭合围栏（流式中途）：同样走 fenceBlock —— dsh-ui 的半截 JSON 解析不了，
    // genuiToDom 会自己退回代码块，与桌面端「解析成功才接管」的语义一致。
    if (inCode && codeBuf.length) frag.appendChild(fenceBlock(codeBuf.join('\\n'), codeLang));
    flushPara(); flushTable();
    return frag;
  }
  /**
   * 折叠行摘要：edit 直接把「文件名 · +增 −删」写进标题，不点开也知道改了多少。
   * 窄屏一行放不下「Tool call · edit」+ 统计，所以编辑类去掉 Tool call 前缀。
   */
  function toolSummary(d) {
    var nm = d.name || '?';
    var a = parseArgs(d);
    var pair = (nm === 'edit' || nm === 'str_replace' || nm === 'str_replace_editor') ? editPair(a) : null;
    if (pair) {
      var st = diffStat(editRows(d, pair));
      var p = a.file_path || a.filePath || a.path || '';
      return {
        label: nm,
        preview: (p ? baseName(p) + ' · ' : '') + '+' + st.add + ' −' + st.del
      };
    }
    return { label: 'Tool call · ' + nm, preview: argPreview(d) };
  }
  // 工具展开体：按工具类型给「成品」预览（edit 显示 diff、write 显示内容、bash 系显示命令、其余键值对）
  function toolBody(d) {
    var frag = document.createDocumentFragment();
    var a = parseArgs(d);
    var path = a.file_path || a.filePath || a.path || a.cwd || a.notebook_path || '';
    if (path) frag.appendChild(el('div', 'tl-kv', '📄 ' + path));
    var nm = d.name || '';
    var pair = (nm === 'edit' || nm === 'str_replace' || nm === 'str_replace_editor') ? editPair(a) : null;
    if (pair) {
      // 旧版把 old_string/new_string 各截断 400 字平铺，根本看不出增删了什么。
      var rows = editRows(d, pair);
      var st = diffStat(rows);
      var stat = el('div', 'diff-stat', '');
      stat.appendChild(el('span', 'st-add', '+' + st.add + ' 行'));
      stat.appendChild(document.createTextNode(' · '));
      stat.appendChild(el('span', 'st-del', '−' + st.del + ' 行'));
      if (a.replace_all) stat.appendChild(document.createTextNode(' · 全部替换'));
      frag.appendChild(stat);
      frag.appendChild(diffBlock(rows));
    } else if (nm === 'write' && typeof a.content === 'string') {
      // 文档看成品排版，代码看原文：markdown 规则会把连续代码行拼成一行。
      if (looksLikeMarkdown(path)) {
        var box = el('div', 'md-box', ''); box.appendChild(mdToDom(a.content)); frag.appendChild(box);
      } else frag.appendChild(codeBlock(a.content));
    } else if ((nm === 'bash' || nm === 'pwsh' || nm === 'powershell') && (a.command || a.Command)) {
      frag.appendChild(codeBlock(String(a.command || a.Command)));
    } else {
      Object.keys(a).forEach(function (k) {
        if (k.indexOf('__') === 0) return;  // parseArgs/editRows 的缓存字段
        var val = a[k];
        var s = typeof val === 'string' ? val : JSON.stringify(val, null, 2);
        if (!s) return;
        // 多行或很长的参数（prompt/content/patch 等）：按代码块换行，不再截断成一坨
        if (s.indexOf('\\n') !== -1 || s.length > 160) {
          frag.appendChild(el('div', 'tl-kv', k + '：'));
          frag.appendChild(codeBlock(s));
          return;
        }
        var row = el('div', 'tl-kv', '');
        row.appendChild(el('b', null, k + ': '));
        row.appendChild(document.createTextNode(s));
        frag.appendChild(row);
      });
    }
    if (!frag.childNodes.length) frag.appendChild(el('div', 'tl-kv', '（无参数）'));
    return frag;
  }

  function sessRow(s, showCwd) {
    var row = el('div', 'sess-row');
    var head = el('div', 'sess-head');
    head.appendChild(el('span', 'sess-title', titleOf(s)));
    if (s.running) head.appendChild(el('span', 'run-badge', '运行中'));
    var more = el('button', 'row-more', '⋯');
    more.addEventListener('click', function (ev) {
      ev.stopPropagation();
      openSessionMenu(s);
    });
    head.appendChild(more);
    row.appendChild(head);
    row.appendChild(el('div', 'sess-meta', (showCwd && s.cwd ? tail(s.cwd) + ' · ' : '') + fmtTime(s.updatedAt)));
    row.addEventListener('click', function () { openSession(s); });
    return row;
  }
  // 会话操作菜单：打开 / 重命名 / 归档（RPC 已实测：session.rename、workspace.archiveSession）
  function openSessionMenu(s) {
    openSheet();
    sheetBody.innerHTML = '';
    sheetBody.appendChild(el('div', 'grp-name', '会话操作 · ' + oneLine(titleOf(s), 18)));
    var openRow = el('div', 'model-row', '💬 打开会话');
    // 同 createAt：closeSheet 的异步退栈会把刚打开的会话覆盖回列表，必须走 hideSheetForJump
    openRow.addEventListener('click', function () { hideSheetForJump(); openSession(s); });
    sheetBody.appendChild(openRow);
    var rnRow = el('div', 'model-row', '✏️ 重命名');
    rnRow.addEventListener('click', function () {
      sheetBody.innerHTML = '';
      sheetBody.appendChild(el('div', 'grp-name', '重命名会话'));
      var inp = document.createElement('input');
      inp.value = titleOf(s);
      inp.style.cssText = 'width:100%;padding:10px;border-radius:10px;border:1px solid var(--line);background:var(--panel-2);color:var(--text);font-size:14px;';
      sheetBody.appendChild(inp);
      var save = el('button', null, '保存');
      save.style.cssText = 'width:100%;padding:10px;margin-top:8px;border-radius:10px;border:none;background:var(--accent-grad);color:#fff;font-weight:600;';
      save.addEventListener('click', function () {
        var t = inp.value.trim();
        if (!t) return;
        api('session.rename', { sessionId: s.sessionId, title: t }).then(function () {
          closeSheet(false);
          showList();
        }).catch(function (e) { sheetBody.appendChild(el('div', 'err', '重命名失败：' + e.message)); });
      });
      sheetBody.appendChild(save);
    });
    sheetBody.appendChild(rnRow);
    var arRow = el('div', 'model-row', '📦 归档会话');
    arRow.addEventListener('click', function () {
      sheetBody.innerHTML = '';
      sheetBody.appendChild(el('div', 'grp-name', '确认归档？'));
      sheetBody.appendChild(el('div', 'sess-meta', '归档后不再出现在手机列表和桌面分组，可在桌面端撤销。'));
      var yes = el('button', null, '确认归档');
      yes.style.cssText = 'width:100%;padding:10px;margin-top:8px;border-radius:10px;border:none;background:var(--stop-bg);color:#fff;font-weight:600;';
      yes.addEventListener('click', function () {
        api('workspace.archiveSession', { sessionId: s.sessionId }).then(function () {
          closeSheet(false);
          showList();
        }).catch(function (e) { sheetBody.appendChild(el('div', 'err', '归档失败：' + e.message)); });
      });
      sheetBody.appendChild(yes);
    });
    sheetBody.appendChild(arRow);
  }
  function renderFlatList(items, host) {
    var box = host || view;
    if (!items.length) { box.appendChild(el('div', 'empty', '桌面端暂无会话')); return; }
    items.forEach(function (s) { box.appendChild(sessRow(s, true)); });
  }
  // 上一次渲染好的列表 DOM 容器。返回列表时把它原样搬回（连带事件监听），
  // 界面同帧就是列表；session.list 在后台跑，回来后整体替换。
  // 不缓存的话，view 里残留的是会话消息，要等网络回来才被换掉 —— 表现为
  // 「返回后先看到会话内容，过一秒才真正回列表」。
  var listCache = null;
  var listScrollY = 0;

  // 工作区折叠状态：null = 还没有存过（首次进入用「展开最近活跃」的默认）。
  function wsKey(w) { return String(w.id || w.workspaceId || w.path || w.title || ''); }
  function loadOpenWorkspaces() {
    try {
      var raw = localStorage.getItem('dshrc_ws_open');
      if (raw === null) return null;
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (e) { return null; }
  }
  function saveOpenWorkspaces(list) {
    try { localStorage.setItem('dshrc_ws_open', JSON.stringify(list)); } catch (e) { }
  }

  // 列表快照（sessionStorage）：原生 WebView 壳（Native Alpha 等）在栈底按
  // 返回键是整页重载而非 popstate —— 页面重跑后 listCache 必为空，
  // 快照让页面一启动就同步渲染上次的列表（含滚动位置），不再闪「加载中」。
  var LIST_SNAP_KEY = 'dshrc_list_snap';
  var LIST_SCROLL_KEY = 'dshrc_list_scroll';
  function saveListSnapshot(items, wv) {
    try { sessionStorage.setItem(LIST_SNAP_KEY, JSON.stringify({ items: items, wv: wv })); } catch (e) { }
  }
  function loadListSnapshot() {
    try {
      var parsed = JSON.parse(sessionStorage.getItem(LIST_SNAP_KEY) || 'null');
      return (parsed && Array.isArray(parsed.items)) ? parsed : null;
    } catch (e) { return null; }
  }
  function readListScroll() {
    try {
      var v = parseInt(sessionStorage.getItem(LIST_SCROLL_KEY), 10);
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  window.addEventListener('pagehide', function () {
    if (current === null) {
      try { sessionStorage.setItem(LIST_SCROLL_KEY, String(Math.round(window.scrollY))); } catch (e) { }
    }
  });

  /** 离开会话回列表前调用：把整棵会话 DOM 摘下进 LRU 缓存，再进同会话秒开。 */
  function stashSessionView() {
    if (!current) return;
    var sid = current.sessionId;
    // 只有加载中骨架/空视图不值得缓存；巨型会话不缓存（内存保护，直接放弃）。
    var onlyLoading = view.childNodes.length === 1 && view.firstChild.className === 'loading';
    var elemCount = view.getElementsByTagName('*').length;
    // scrollY 必须在摘除 DOM 之前读：摘掉近 4000px 的消息流后页面塌缩，
    // 浏览器会把 scrollY 同步钳到 0，之后再读永远是 0（=每次缓存回进都落到顶部）。
    var savedY = window.scrollY;
    if (onlyLoading || elemCount > 1500) {
      sessionCache.delete(sid);
      return;
    }
    var box = document.createElement('div');
    while (view.firstChild) box.appendChild(view.firstChild);
    sessionCache.delete(sid);  // 先删再放：刷新 LRU 位次
    sessionCache.set(sid, {
      box: box, scrollY: savedY,
      lastSeq: lastSeq, earliestSeq: earliestSeq, historyAtTop: historyAtTop,
      streamedTurn: streamedTurn, callNames: callNames, liveEls: liveEls
    });
    while (sessionCache.size > SESSION_CACHE_MAX) {
      sessionCache.delete(sessionCache.keys().next().value);  // 淘汰最久未用
    }
  }

  function showList() {
    stashSessionView();
    current = null;
    renderPend();  // 回列表时没有当前会话，审批卡片自动收起
    backBtn.classList.add('hidden'); refreshBtn.classList.add('hidden');
    newBtn.classList.remove('hidden'); setBtn.classList.remove('hidden');
    composer.classList.add('hidden');
    sheet.classList.add('hidden');  // 直接隐藏：showList 是重置界面，不参与退栈
    topTitle.textContent = '会话列表';
    // 同帧内把界面换成列表：DOM 缓存 > sessionStorage 快照 > 骨架屏。
    view.innerHTML = '';
    var painted = false;
    if (listCache) {
      // 原节点搬回来（不 clone，事件监听随节点保留）。
      view.appendChild(listCache);
      listCache = null;
      window.scrollTo(0, listScrollY);  // 回到离开列表时的位置
      painted = true;
    } else {
      var snap = loadListSnapshot();
      if (snap) {
        renderListView(snap.items, snap.wv || null, readListScroll());
        painted = true;
      }
    }
    if (!painted) {
      view.appendChild(el('div', 'loading', '加载中…'));
      window.scrollTo(0, 0);
    }
    // 按工作区分组：workspace.list 成员表定归属；已归档会话不显示；未入组会话一并不显示。
    // 工作区清单拿不到时退回平铺，列表永不空白。
    Promise.all([
      api('session.list', {}),
      api('workspace.list', {}).catch(function () { return null; })
    ]).then(function (rs) {
      renderListView((rs[0].items || []).filter(function (s) { return !s.blank; }), rs[1]);
    }).catch(function (e) {
      if (current !== null) return;  // 已进会话：别覆盖会话内容
      view.innerHTML = '';
      view.appendChild(el('div', 'err', '加载失败：' + e.message));
    });
  }

  /** 按数据整页渲染列表（工作区分组/折叠/平铺），并写入 sessionStorage 快照。 */
  function renderListView(items, wv, restoreY) {
    // 守卫必须在最前：退回列表后 session.list/workspace.list 还在路上，用户此时
    // 点进会话的话，这批迟到数据若继续走会排 rAF 滚动，把会话页拽回列表滚动位
    // （长对话页上等于顶部）——正是「进会话停在最上面」的根因。
    if (current !== null) return;
    saveListSnapshot(items, wv);
    // 恢复/保持滚动位置放 rAF：列表各分支都可能提前 return，这里统一兜底。
    var targetY = (typeof restoreY === 'number') ? restoreY : window.scrollY;
    requestAnimationFrame(function () {
      window.scrollTo(0, Math.max(0, Math.min(targetY, document.body.scrollHeight - window.innerHeight)));
    });
    lastItems = items;
    var raw = wv && (wv.workspaces || wv.items);
      if (raw && !Array.isArray(raw) && typeof raw === 'object') {
        raw = Object.keys(raw).map(function (id) { var w = raw[id] || {}; w.id = id; return w; });
      }
      var wArr = Array.isArray(raw) ? raw.filter(function (w) { return w && (w.id || w.workspaceId); }) : [];
      var archived = {};
      ((wv && wv.archivedSessionIds) || []).forEach(function (sid) { archived[sid] = 1; });
      view.innerHTML = '';
      // 整棵列表挂在一个容器里，进会话时可整体摘下缓存。
      var wrap = el('div', null, '');
      wrap.id = 'listWrap';
      view.appendChild(wrap);
      if (!wArr.length) { renderFlatList(items, wrap); return; }
      var byId = {};
      items.forEach(function (s) { byId[s.sessionId] = s; });
      var enriched = wArr.map(function (w) {
        var ids = (w.sessionIds || w.sessions || []).filter(function (sid) { return byId[sid] && !archived[sid]; });
        var latest = 0;
        ids.forEach(function (sid) { latest = Math.max(latest, byId[sid].updatedAt || 0); });
        return { w: w, ids: ids, latest: latest };
      }).sort(function (a, b) { return b.latest - a.latest; });
      // 工作区改为可折叠分组：会话多时整屏平铺无法扫读。默认只展开最近活跃的
      // 那个工作区，其余收起；展开集合记在 localStorage，跨次进入保持。
      var live = enriched.filter(function (gW) { return gW.ids.length; });
      if (!live.length) {
        wrap.appendChild(el('div', 'empty', '各工作区暂无会话，点右上角「＋ 新会话」开始'));
        return;
      }
      var open = loadOpenWorkspaces();
      if (open === null) open = [wsKey(live[0].w)];  // 首次进入：展开最近活跃的
      live.forEach(function (gW) {
        var key = wsKey(gW.w);
        var expanded = open.indexOf(key) !== -1;
        gW.ids.sort(function (a, b) { return (byId[b].updatedAt || 0) - (byId[a].updatedAt || 0); });

        var wHead = el('div', 'grp-name ws-head' + (expanded ? ' open' : ''), '');
        wHead.appendChild(el('span', 'ws-caret', '▸'));
        wHead.appendChild(el('span', 'ws-name', gW.w.title || gW.w.path || gW.w.id || gW.w.workspaceId));
        wHead.appendChild(el('span', 'ws-count', gW.ids.length + ' 会话'));

        var body = el('div', 'ws-body' + (expanded ? '' : ' hidden'), '');
        gW.ids.forEach(function (sid) { body.appendChild(sessRow(byId[sid], false)); });

        wHead.addEventListener('click', function () {
          var nowOpen = body.classList.contains('hidden');
          body.classList.toggle('hidden', !nowOpen);
          wHead.classList.toggle('open', nowOpen);
          var set = loadOpenWorkspaces() || [];
          var at = set.indexOf(key);
          if (nowOpen && at === -1) set.push(key);
          if (!nowOpen && at !== -1) set.splice(at, 1);
          saveOpenWorkspaces(set);
        });

        wrap.appendChild(wHead);
        wrap.appendChild(body);
      });
  }

  /** 注入消息的生产者标签（对齐桌面端 contextProvenance 的分类）。 */
  function injectionLabel(src) {
    var k = (src && src.kind) ? src.kind : 'context';
    if (k === 'session-reference') return '记忆召回';
    if (k === 'agent-instructions') return '注入 · 指令';
    if (k === 'plugin') return '注入 · 插件' + (src.plugin ? ' · ' + src.plugin : '');
    if (k === 'skill-invocation') return '注入 · 技能' + (src.name ? ' · ' + src.name : '');
    return '注入 · ' + k;
  }

  function renderEvent(it) {
    var e = it.event;
    if (e.type === 'user/message') {
      // 真用户输入渲染成气泡；宿主上下文注入（指令/插件/技能清单等）渲染成
      // 折叠行（默认收起，点开看全文）——桌面端按 inject/recall 角色展示这些
      // 消息，手机端此前直接丢弃，看起来像「开新会话开头缺了一截」。
      if (!e.data || !e.data.source || !e.data.source.kind) return null;
      var srcKind = e.data.source.kind;
      if (srcKind !== 'user') {
        var inj = textOf(e.data && e.data.content);
        return inj ? tlRow('💉', injectionLabel(e.data.source), oneLine(inj, 56), inj) : null;
      }
      var content = (e.data && e.data.content) || [];
      var text = textOf(content);
      var imgs = collectImageBlocks(content, false);
      if (!imgs.length && pendingEcho !== null && text === pendingEcho) {
        pendingEcho = null;
        // 乐观回显气泡已在场：从「发送中」半透明态转正即可，不再重复渲染
        var pend = view.querySelectorAll('.msg.user.pending');
        if (pend.length) pend[pend.length - 1].className = 'msg user';
        return null;
      }
      if (!text && !imgs.length) return null;
      var bubble = el('div', 'msg user', '');
      if (text) bubble.appendChild(el('div', 'u-text', text));
      var sid = current ? current.sessionId : '';
      imgs.forEach(function (block) {
        var node = renderImageBlock(sid, block);
        if (node) bubble.appendChild(node);
      });
      return bubble;
    }
    if (e.type === 'assistant/message') {
      // 桌面端式时间线：reasoning → Think 行、text → 独立气泡（markdown 成品渲染）；tool-call 项交给 tool/call 事件渲染（防重复）
      var m = (e.data && e.data.message) || e.data || {};
      var frag = document.createDocumentFragment();
      var asid = current ? current.sessionId : '';
      (m.content || []).forEach(function (c) {
        if (c.type === 'text' && c.text) {
          var ab = el('div', 'msg assistant', '');
          ab.appendChild(mdToDom(c.text));
          frag.appendChild(ab);
        } else if (c.type === 'image') {
          var anode = renderImageBlock(asid, c);
          if (anode) { var aw = el('div', 'msg assistant', ''); aw.appendChild(anode); frag.appendChild(aw); }
        } else if (c.type === 'reasoning' && c.text) frag.appendChild(tlRow('💭', 'Think', oneLine(c.text, 56), c.text));
      });
      return frag.childNodes.length ? frag : null;
    }
    // agent/inbox/spliced 故意不渲染：队列注入的用户消息随后必有同内容的
    // user/message 事件（同一 attachmentId 实测双写），两边都画就是一图两份。
    if (e.type === 'tool/call') {
      var d = e.data || {};
      if (d.callId) callNames[d.callId] = d.name || '';
      var sm = toolSummary(d);
      return tlRow('✨', sm.label, sm.preview, toolBody(d));
    }
    if (e.type === 'tool/result') {
      // 桌面端只在失败时显示结果行（红色）；成功结果不刷屏
      var msg = (e.data && e.data.message) || {};
      var rows = null;
      var rsid = current ? current.sessionId : '';
      (msg.content || []).forEach(function (c) {
        if (!c || c.type !== 'tool-result') return;
        if (!c.isError) {
          // 成功结果桌面端不刷屏，但截图/读图类工具的产物图片要显示
          var rimgs = collectImageBlocks(c.content, true);
          if (!rimgs.length) return;
          if (!rows) rows = document.createDocumentFragment();
          rimgs.forEach(function (block) {
            var rnode = renderImageBlock(rsid, block);
            if (rnode) rows.appendChild(rnode);
          });
          return;
        }
        var txt = (c.content || []).map(function (x) { return (x && x.text) || ''; }).join('\\n');
        if (!txt) return;
        if (!rows) rows = document.createDocumentFragment();
        rows.appendChild(el('div', 'tl-err', '⚠️ ' + (callNames[c.toolCallId] || '工具') + ' · ' + oneLine(txt, 220)));
      });
      return rows;
    }
    if (e.type === 'turn/end') {
      var reason = e.data && e.data.reason;
      if (reason && reason.kind === 'error') {
        return el('div', 'err', '⚠️ 本轮出错：' + ((reason.error && reason.error.message) || '未知错误'));
      }
      return null;
    }
    return null;
  }

  /** 首屏历史条数。上游写死 10，手机上只能往上划一点点，翻不到早前对话。 */
  var HISTORY_PAGE = 40;
  /** 当前已渲染区间里最早的 seq，供「加载更早」按 beforeSeq 续翻。 */
  var earliestSeq = null;
  /** 早前历史是否已全部载入（一次返回不足一页即到顶）。 */
  var historyAtTop = false;

  function loadHistory(keepPos, force, initialLoad) {
    if (!current) return;
    // keepPos（缓存秒开后的静默对账）：对账重建前后记下「绝对阅读位置」再原样恢复。
    // 历史是只追加的，上方内容不变，绝对 scrollY 即阅读位置；到底部的人由后续
    // 增量的近底部跟随自然带到新底部。绝不自作主张往顶或往底跳。
    earliestSeq = null;
    historyAtTop = false;
    api('session.history', { sessionId: current.sessionId, maxMessages: HISTORY_PAGE }).then(function (v) {
      if (!current) return;
      // 回合进行中若已有流式块，不换血：innerHTML='' 会清掉正在打字的块（含 Think），
      // 此后增量因 liveEls 被重置而全部丢弃——Think 就「被吞」直到终帧才冒出来。
      // 但首次进入运行中的会话仍是空骨架，必须允许这次历史填充，否则会出现整页空白。
      // force=用户手动刷新/长等兜底，绕过延迟保护。
      var hasLiveView = !!view.querySelector('.msg, details.tl, .tl-err');
      var isInitialFill = initialLoad && !hasLiveView;
      if (!force && !stopBtn.classList.contains('hidden') && hasLiveView && !isInitialFill) {
        pendingReconcile = true;
        var ld = view.querySelector('.loading');
        if (ld) ld.remove();
        return;
      }
      var yAtSwap = keepPos ? Math.round(window.scrollY) : null;  // 换血前一刻的绝对位置
      pendingEcho = null;  // 历史是权威状态，重绘后由历史渲染真实用户消息
      streamedTurn = false;  // 流式标记随重绘失效，之后的终帧交给历史/事件正常渲染
      // 重绘不再灭工作芯片：芯片在输入框顶行不随消息流重建，是否运行以停止键为准
      if (stopBtn.classList.contains('hidden')) clearHint();
      callNames = {};  // 本轮历史重渲染重建 callId → 工具名映射
      view.innerHTML = '';
      liveEls = {};
      var evs = v.events || [];
      evs.forEach(function (it) {
        var node = renderEvent(it);
        if (node) view.appendChild(node);
        var sq = it.event.seq;
        if (typeof sq === 'number' && sq > lastSeq) lastSeq = sq;
        if (typeof sq === 'number' && (earliestSeq === null || sq < earliestSeq)) earliestSeq = sq;
      });
      // 不足一页说明已经到最顶，没有更早的历史可翻。
      if (evs.length < HISTORY_PAGE) historyAtTop = true;
      if (!view.childNodes.length) view.appendChild(el('div', 'empty', '新会话，发第一条指令吧'));
      renderMoreButton();
      if (keepPos) {
        window.scrollTo(0, Math.max(0, Math.min(yAtSwap, document.body.scrollHeight - window.innerHeight)));
      } else {
        window.scrollTo(0, document.body.scrollHeight);
      }
    }).catch(function (e) {
      if (keepPos) return;  // 静默对账失败：保留贴回的旧画面，不弹错误打扰
      view.innerHTML = '';
      view.appendChild(el('div', 'err', '历史加载失败：' + e.message));
    });
  }

  /** 顶部「加载更早」按钮：到顶或无游标时不显示。 */
  function renderMoreButton() {
    var old = document.getElementById('moreTop');
    if (old) old.remove();
    if (historyAtTop || earliestSeq === null || !view.childNodes.length) return;
    var btn = el('button', 'more-top', '↑ 加载更早的对话');
    btn.id = 'moreTop';
    btn.addEventListener('click', function () { loadEarlier(btn); });
    view.insertBefore(btn, view.firstChild);
  }

  /** 按 beforeSeq 往上续一页，插到最前面并保持视觉位置不跳。 */
  function loadEarlier(btn) {
    if (!current || earliestSeq === null) return;
    btn.disabled = true;
    btn.textContent = '加载中…';
    var anchorTop = document.body.scrollHeight;
    api('session.history', {
      sessionId: current.sessionId, beforeSeq: earliestSeq, maxMessages: HISTORY_PAGE
    }).then(function (v) {
      if (!current) return;
      var evs = v.events || [];
      if (evs.length < HISTORY_PAGE) historyAtTop = true;
      // 逆序插到按钮之后，保持事件原有先后关系。
      var frag = document.createDocumentFragment();
      evs.forEach(function (it) {
        var node = renderEvent(it);
        if (node) frag.appendChild(node);
        var sq = it.event.seq;
        if (typeof sq === 'number' && (earliestSeq === null || sq < earliestSeq)) earliestSeq = sq;
      });
      btn.remove();
      view.insertBefore(frag, view.firstChild);
      renderMoreButton();
      // 新内容加在上方会把当前阅读位置顶下去：按高度差补偿，视觉上原地不动。
      window.scrollTo(0, window.scrollY + (document.body.scrollHeight - anchorTop));
    }).catch(function (e) {
      btn.disabled = false;
      btn.textContent = '↑ 加载更早的对话';
      view.insertBefore(el('div', 'err', '加载更早失败：' + e.message), view.firstChild);
    });
  }

  function openSession(s) {
    pushNavState('session');  // 占一层 history，安卓返回键回列表而不是退出站点
    // 离开列表前把整棵列表 DOM 摘下来存着（连带事件监听），返回时同帧贴回。
    var wrap = document.getElementById('listWrap');
    if (wrap) {
      listScrollY = window.scrollY;
      listCache = wrap;
      wrap.remove();
    }
    current = s;
    skillCache = null;  // 换会话重拉 skill 清单（skill.list 按会话 cwd 寻址）
    renderPend();  // 会话切换后重铺该会话的审批/提问卡片
    newBtn.classList.add('hidden'); setBtn.classList.add('hidden');
    topTitle.textContent = titleOf(s);
    backBtn.classList.remove('hidden'); refreshBtn.classList.remove('hidden');
    composer.classList.remove('hidden');
    stopBtn.classList.toggle('hidden', !s.running);
    if (s.running) setHint('✨ 会话运行中…');  // 中途进正在跑的会话：turn/start 已错过，芯片直接补上
    ensureStream();
    refreshModelChip();
    refreshPresetChip();
    queueItems = [];
    renderQueueChip();  // 队列快照等宿主下一次 session/queue 帧重新推送（与桌面客户端一致）
    var hit = sessionCache.get(s.sessionId);
    if (hit) {
      // 缓存命中：同帧贴回旧画面（含滚动位置与流式状态），零「加载中」。
      sessionCache.delete(s.sessionId);
      view.innerHTML = '';
      while (hit.box.firstChild) view.appendChild(hit.box.firstChild);
      lastSeq = hit.lastSeq; earliestSeq = hit.earliestSeq; historyAtTop = hit.historyAtTop;
      streamedTurn = hit.streamedTurn; callNames = hit.callNames; liveEls = hit.liveEls;
      renderMoreButton();
      window.scrollTo(0, hit.scrollY);
      loadHistory(true);  // 静默对账：补上离开列表期间错过的消息，原位纠正不跳动
    } else if (s.fresh) {
      // 刚 create 的会话必为空：不拉历史，零「加载中」直接就位
      lastSeq = 0; earliestSeq = null; historyAtTop = true;
      streamedTurn = false; callNames = {}; liveEls = {}; pendingEcho = null;
      view.innerHTML = '';
      view.appendChild(el('div', 'empty', '新会话，发第一条指令吧'));
    } else {
      view.innerHTML = '';
      view.appendChild(el('div', 'loading', '加载中…'));
      loadHistory(false, false, true);
    }
  }

  // ── 手机物理返回键 ────────────────────────────────────────────────────
  // 这是个单页应用：不碰 history 的话，安卓返回键会直接退出站点。做法是给
  // 「会话」和「底部面板」各占一层 history state，返回键先消耗这些层级，
  // 只有在列表页按返回才真正离开页面。
  //   navigating = true 时的 showList()/关面板 由 popstate 驱动，
  //   此时不要再调 history.back()，否则会连退两层。
  //
  // 不能依赖 history.length 或「栈底行为」判断该不该拦：在原生 WebView 壳
  // （如 Native Alpha）里栈起点是 1、返回键由原生层转发，跟浏览器标签页不同 ——
  // 曾出现「列表页第一次返回只重载页面（闪加载中）、第二次才退出」。
  // 改为自己维护 depth：只有 depth > 0 才算有本插件的层级可退。
  var navigating = false;
  var navDepth = 0;

  history.replaceState({ rcView: 'list', rcDepth: 0 }, '');

  function pushNavState(name) {
    if (navigating) return;
    navDepth += 1;
    history.pushState({ rcView: name, rcDepth: navDepth }, '');
  }

  /**
   * 列表页按返回且无层级可退：把这一下返回交还给宿主。
   * 浏览器标签页：popstate 后浏览器自行离开本页（实测正常）。
   * WebView 壳（Native Alpha 等）：栈底按返回由原生层决定 —— 实测它是整页
   * 重载（不触发 popstate），页面重跑后由 sessionStorage 快照瞬时恢复列表，
   * 第二次返回才退出。这是壳的行为，页面侧已无干预点。
   */
  function leaveApp() {
    navigating = true;
    setTimeout(function () { navigating = false; }, 0);
  }

  /** 打开底部面板，并占一层 history（返回键先关面板）。 */
  function openSheet() {
    if (sheet.classList.contains('hidden')) pushNavState('sheet');
    sheet.classList.remove('hidden');
  }

  /** 关闭底部面板；fromPop=true 表示这次是返回键触发的，不要再退栈。 */
  function closeSheet(fromPop) {
    if (sheet.classList.contains('hidden')) return false;
    sheet.classList.add('hidden');
    if (!fromPop && history.state && history.state.rcView === 'sheet') {
      navigating = true;
      history.back();  // popstate 会据 rcDepth 回填 navDepth
      setTimeout(function () { navigating = false; }, 0);
    }
    return true;
  }

  /**
   * 关面板但不动 history：给「关面板后同拍 openSession」的跳转用。
   * closeSheet 的 history.back() 是异步退栈，若紧跟着 openSession，等退栈落地时
   * popstate 会看到「目标列表 + current=新会话」，按返回逻辑把刚打开的会话页
   * 直接覆盖回列表——新建会话/打开会话「没有任何事发生」就是这个竞态。
   * 这里只做视觉隐藏，跳过的 sheet 死层由 popstate 的归一化兜底（见下）。
   */
  function hideSheetForJump() {
    sheet.classList.add('hidden');
  }

  window.addEventListener('popstate', function (ev) {
    var target = (ev.state && ev.state.rcView) || 'list';
    navDepth = (ev.state && typeof ev.state.rcDepth === 'number') ? ev.state.rcDepth : 0;
    // hideSheetForJump 跳转留下的 sheet 死层（面板早已不在）：退到这一层直接当列表处理，
    // 返回键从会话一按就回列表，不产生「按了没反应」的死层。
    if (target === 'sheet' && sheet.classList.contains('hidden')) target = 'list';
    navigating = true;
    // 面板开着：这一下返回只关面板，会话保持。
    if (!sheet.classList.contains('hidden')) {
      sheet.classList.add('hidden');
      if (target !== 'list') { navigating = false; return; }
    }
    // 会话页 → 列表页：切界面，这一层返回被消耗掉。
    if (target === 'list' && current !== null) {
      showList();
      navigating = false;
      return;
    }
    navigating = false;
    // 已在列表页、且本插件没有层级可退：这一下返回应当离开应用。
    // WebView 壳里不会自动退出（只会重载页面），所以显式请求关闭。
    if (target === 'list' && current === null && navDepth === 0) leaveApp();
  });

  backBtn.addEventListener('click', function () {
    // 点顶栏「← 列表」同样退栈，保持 history 与界面一致。
    if (history.state && history.state.rcView === 'session') {
      navigating = true;
      history.back();
      setTimeout(function () { navigating = false; }, 0);
    }
    showList();
  });
  refreshBtn.addEventListener('click', function () { if (current) loadHistory(undefined, true); });

  function send() {
    var text = input.value.trim();
    var hasImgs = pendingImages.length > 0;
    if ((!text && !hasImgs) || !current || sendBtn.disabled) return;
    skillMenu.classList.add('hidden');
    sendBtn.disabled = true;
    var wasRunning = !stopBtn.classList.contains('hidden');  // 当前轮还在跑：这条会排队
    var content = [];
    if (text) content.push({ type: 'text', text: text });
    pendingImages.forEach(function (p) {
      content.push({ type: 'image', mediaType: p.mediaType, data: p.dataUrl.slice(p.dataUrl.indexOf(',') + 1) });
    });
    var staged = pendingImages.slice();
    var echo = null;
    if (!hasImgs) {
      // 本地乐观回显：发送瞬间就显示用户消息（半透明「发送中」态），不等公网往返；
      // SSE user/message 帧到达时命中 pendingEcho 则转正去重
      pendingEcho = text;
      input.value = '';
      echo = el('div', 'msg user pending', text);
      view.appendChild(echo); scrollBottom();
      setHint('⌛ 正在发送到桌面会话…');
    } else {
      // 带图消息不做乐观回显（本地压缩图与最终附件有差异），等 SSE 帧画真身
      pendingEcho = null;
      input.value = '';
      pendingImages = [];
      renderStaged();
      setHint('⌛ 正在发送图片到桌面会话…');
    }
    api('session.prompt', {
      sessionId: current.sessionId, mode: 'queue',
      content: content,
      clientTimeZone: (Intl.DateTimeFormat().resolvedOptions() || {}).timeZone
    }).then(function () {
      if (wasRunning) toast('已加入队列，排在当前回复之后');  // 队列芯片随 session/queue 帧亮起
      // 长等兜底：仅当 8 秒无任何 SSE 帧（流断了/事件没来）才全量对账（强制换血——
      // 流已假定死亡，不存在打字机被清的问题）。
      setTimeout(function () {
        if (Date.now() - lastFrameAt > 8000) loadHistory(undefined, true);
      }, 8000);
    }).catch(function (e) {
      if (echo) echo.remove();
      pendingEcho = null;
      input.value = text;  // 发送失败：恢复输入框（和待发图片）让用户重试
      pendingImages = staged;
      renderStaged();
      clearHint();
      view.appendChild(el('div', 'err', '发送失败：' + e.message));
    }).finally(function () { sendBtn.disabled = false; });
  }
  // ===================== 图片上传：选图 → 压缩 → 待发条 =====================
  var imgBtn = document.getElementById('imgBtn');
  var imgInput = document.getElementById('imgInput');
  var imgPreview = document.getElementById('imgPreview');
  var pendingImages = [];   // {dataUrl, mediaType}；发送时切出 base64
  var MAX_STAGED_IMAGES = 4;
  imgBtn.addEventListener('click', function () { imgInput.value = ''; imgInput.click(); });
  imgInput.addEventListener('change', function () {
    var files = Array.prototype.slice.call(imgInput.files || []);
    if (!files.length) return;
    // 每一步都可见：安卓部分选择器返回空 MIME / 奇怪文件名，出问题时丞相能
    // 直接从提示判断卡在哪一步，而不是「点了没反应」。
    toast('收到 ' + files.length + ' 张图，处理中…');
    files.forEach(stageImage);
  });
  /** 选图入口：GIF 直传保留动画，其余压到最长边 1280 的 JPEG；太小的不压。 */
  function stageImage(file) {
    if (pendingImages.length >= MAX_STAGED_IMAGES) { toast('一次最多 ' + MAX_STAGED_IMAGES + ' 张图片'); return; }
    // 部分安卓选择器返回空 MIME（type === ''）：按扩展名兜底，还认不出就试着解码，
    // 能解码就当图片收（压缩后实际类型由 canvas 决定），解不动才拒绝。
    var typeOk = /^image\\/(png|jpeg|webp|gif)$/.test(file.type) || /\\.(png|jpe?g|webp|gif)$/i.test(file.name || '');
    var isGif = file.type === 'image/gif' || /\\.gif$/i.test(file.name || '');
    if (!typeOk && file.type !== '') { toast('仅支持 PNG / JPEG / WebP / GIF'); return; }
    if (!typeOk) { probeUnknownImage(file); return; }
    if (isGif || file.size <= 200 * 1024) {
      if (file.size > 4.5 * 1024 * 1024) { toast('图片超过 4.5MB，请先压缩'); return; }
      var rd = new FileReader();
      rd.onload = function () { pushStaged(String(rd.result), isGif ? 'image/gif' : (file.type || 'image/jpeg')); };
      rd.onerror = function () { toast('图片读取失败'); };
      rd.readAsDataURL(file);
      return;
    }
    compressImage(file, function (dataUrl) { pushStaged(dataUrl, 'image/jpeg'); });
  }
  /** 空 MIME 文件：能解码就收（走压缩，类型落 JPEG），解不动才拒绝。 */
  function probeUnknownImage(file) {
    if (file.size > 4.5 * 1024 * 1024) { toast('图片超过 4.5MB，请先压缩'); return; }
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function () {
      URL.revokeObjectURL(url);
      compressImage(file, function (dataUrl) { pushStaged(dataUrl, 'image/jpeg'); });
    };
    img.onerror = function () { URL.revokeObjectURL(url); toast('仅支持 PNG / JPEG / WebP / GIF'); };
    img.src = url;
  }
  /** canvas 重采样：最长边 1280px、JPEG q0.82；透明 PNG 先铺白底再压。 */
  function compressImage(file, done) {
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function () {
      var MAX = 1280;
      var w = img.naturalWidth || MAX, h = img.naturalHeight || MAX;
      var k = Math.min(1, MAX / Math.max(w, h));
      var c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w * k));
      c.height = Math.max(1, Math.round(h * k));
      var ctx = c.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); toast('图片处理失败'); return; }
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      done(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = function () { URL.revokeObjectURL(url); toast('图片读取失败'); };
    img.src = url;
  }
  function pushStaged(dataUrl, mediaType) {
    if (pendingImages.length >= MAX_STAGED_IMAGES) { toast('一次最多 ' + MAX_STAGED_IMAGES + ' 张图片'); return; }
    pendingImages.push({ dataUrl: dataUrl, mediaType: mediaType });
    renderStaged();
    // 选图成功必须可见可感知：待发条本身很低调，首次选图给一句下一步指引。
    if (pendingImages.length === 1) toast('已添加 1 张图，点「发送」发出');
    else toast('已添加 ' + pendingImages.length + ' 张图，点「发送」发出');
  }
  function renderStaged() {
    imgPreview.textContent = '';
    imgPreview.classList.toggle('hidden', !pendingImages.length);
    pendingImages.forEach(function (p, i) {
      var cell = el('div', 'stg', '');
      var im = document.createElement('img');
      im.src = p.dataUrl; im.alt = '待发送图片';
      cell.appendChild(im);
      var x = el('button', 'stg-x', '×');
      x.addEventListener('click', function () { pendingImages.splice(i, 1); renderStaged(); });
      cell.appendChild(x);
      imgPreview.appendChild(cell);
    });
  }
  // 兜底收起：失焦、以及点到菜单外的地方。竞态防护之外的第二道保险。
  input.addEventListener('blur', function () {
    setTimeout(function () { skillMenu.classList.add('hidden'); }, 150);
  });
  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); send(); }
  });

  // 「/」弹菜单：命令区（客户端动作，对齐桌面）+ skill 清单（skill.list 实测返回全部用户可调技能）
  var skillMenu = document.getElementById('skillMenu');
  var skillCache = null;
  function ensureSkills(cb) {
    if (skillCache) { cb(skillCache); return; }
    if (!current) { cb([]); return; }
    api('skill.list', { sessionId: current.sessionId }).then(function (v) {
      skillCache = (v && (v.skills || v.items)) || [];
      cb(skillCache);
    }).catch(function () { cb([]); });
  }
  // 本地动作（纯界面，不进会话日志）。
  var MENU_COMMANDS = [
    { name: '新建会话', run: function () { openNewSheet(); } },
    { name: '切换模型', run: function () { openModelSheet(); } },
    { name: '回到列表', run: function () { showList(); } }
  ];

  input.addEventListener('input', function () {
    var val = input.value;
    if (val.charAt(0) !== '/' || val.indexOf(' ') !== -1 || !current) { skillMenu.classList.add('hidden'); return; }
    ensureSkills(function (list) {
      // 竞态防护：skill 清单是异步取的，回调返回时输入框可能已被清空或改动。
      // 不重新校验就会出现「删空了菜单还挂着」——旧回调把菜单又显示回来。
      var now = input.value;
      if (now !== val || now.charAt(0) !== '/' || now.indexOf(' ') !== -1 || !current) {
        skillMenu.classList.add('hidden');
        return;
      }
      var q = val.slice(1).toLowerCase();
      // 严格前缀匹配：只列以输入开头的项。用 indexOf（「包含即命中」）时，
      // 输入 /plugin 会把 install-dsh-plugin 也列出来，与逐字输入的直觉不符。
      var hit = function (name) {
        if (q === '') return true;
        return String(name || '').toLowerCase().indexOf(q) === 0;
      };
      var byName = function (a, b) { return String(a.name).localeCompare(String(b.name)); };
      var cmds = MENU_COMMANDS.filter(function (c) { return hit(c.name); });
      var hits = list.filter(function (s) { return s && s.name && hit(s.name); }).sort(byName);
      skillMenu.innerHTML = '';
      if (!cmds.length && !hits.length) { skillMenu.classList.add('hidden'); return; }
      if (cmds.length) {
        skillMenu.appendChild(el('div', 'grp-name', '操作'));
        cmds.forEach(function (c) {
          var row3 = el('div', 'skill-row', '');
          row3.appendChild(el('b', null, '⌘ ' + c.name));
          row3.addEventListener('click', function () {
            skillMenu.classList.add('hidden');
            input.value = '';
            c.run();
          });
          skillMenu.appendChild(row3);
        });
      }
      if (hits.length) {
        skillMenu.appendChild(el('div', 'grp-name', '技能'));
        hits.forEach(function (s) {
          var row4 = el('div', 'skill-row', '');
          row4.appendChild(el('b', null, '/' + s.name));
          if (s.description) row4.appendChild(el('div', 'sess-meta', oneLine(s.description, 46)));
          row4.addEventListener('click', function () {
            input.value = '/' + s.name + ' ';
            skillMenu.classList.add('hidden');
          });
          skillMenu.appendChild(row4);
        });
      }
      skillMenu.classList.remove('hidden');
    });
  });

  stopBtn.addEventListener('click', function () {
    if (!current) return;
    // 有排队消息：先开队列面板让丞相看清要停什么（session.cancel 只停当前轮，
    // 队列保留；单条移除在面板里做），不盲目全停。
    if (queueItems.length) { openQueueSheet(); return; }
    api('session.cancel', { sessionId: current.sessionId }).then(function () {
      current.running = false;
      stopBtn.classList.add('hidden');
      setTimeout(loadHistory, 800);
    }).catch(function (e) { view.appendChild(el('div', 'err', '中止失败：' + e.message)); });
  });

  /** 渲染模型面板：模型行点击 = 乐观切换（立即关面板+改芯片+toast），RPC 后台跑。 */
  function renderModelSheet(v) {
    var sid = current.sessionId;
    sheetBody.innerHTML = '';
    var cur = v.current || {};
    sheetBody.appendChild(el('div', 'sess-meta', '当前：' + cur.provider + ' / ' + cur.model));
    // 推理档位：当前模型支持时给出快捷切换
    var curEntry = null;
    (v.groups || []).forEach(function (g) {
      if (g.id !== cur.provider) return;
      (g.models || []).forEach(function (mm) { if (mm.id === cur.model) curEntry = mm; });
    });
    /** 乐观切换：界面先动（面板关、芯片变、toast 起手），请求慢不再卡住人。 */
    function switchModel(opts, label, revert) {
      modelChip.textContent = label + ' ▾';
      if (lastModels && lastModelsSid === sid && lastModels.current) {
        lastModels.current = Object.assign({}, lastModels.current, opts);  // 面板重开立即显示新当前项
      }
      closeSheet(false);
      toast('正在切换到 ' + label + '…');
      api('session.selectModel', Object.assign({ sessionId: sid }, opts))
        .then(function () {
          toast('已切换到 ' + label + ' ✓');
          // 后台对账：把服务端实况（如档位自动回退）刷回缓存，下次面板秒开且准确。
          api('session.models', { sessionId: sid }).then(function (v2) {
            lastModels = v2; lastModelsSid = sid;
            if (current && current.sessionId === sid) modelChip.textContent = (v2.current && v2.current.model || label) + ' ▾';
          }).catch(function () { });
        })
        .catch(function (e2) {
          toast('切换失败：' + e2.message, true);
          if (revert) revert(); else refreshModelChip();  // 失败回滚：芯片与缓存按服务端实况纠正
        });
    }
    if (curEntry && curEntry.reasoning && (curEntry.reasoning.efforts || []).length) {
      sheetBody.appendChild(el('div', 'grp-name', '推理档位'));
      curEntry.reasoning.efforts.forEach(function (ef) {
        var isCur = cur.reasoningEffort === ef.id;
        var efRow = el('div', 'model-row' + (isCur ? ' cur' : ''), (ef.name || ef.id) + (isCur ? ' ✓' : ''));
        efRow.addEventListener('click', function () {
          if (isCur) { closeSheet(false); return; }
          switchModel({ provider: cur.provider, model: cur.model, reasoningEffort: ef.id }, ef.name || ef.id);
        });
        sheetBody.appendChild(efRow);
      });
    }
    (v.groups || []).forEach(function (g) {
      sheetBody.appendChild(el('div', 'grp-name', g.name));
      (g.models || []).forEach(function (m) {
        var isCur = cur.provider === g.id && cur.model === m.id;
        var row = el('div', 'model-row' + (isCur ? ' cur' : ''), m.name + (isCur ? ' ✓' : ''));
        row.addEventListener('click', function () {
          if (isCur) { closeSheet(false); return; }  // 点当前模型 = 只关面板
          switchModel({ provider: g.id, model: m.id }, m.name, function () {
            modelChip.textContent = (cur.model || '模型') + ' ▾';  // 回滚到切换前的旧模型
          });
        });
        sheetBody.appendChild(row);
      });
    });
    var closeBtn = el('button', null, '关闭');
    closeBtn.style.cssText = 'width:100%;padding:10px;margin-top:8px;border-radius:10px;border:1px solid #33333d;background:#191920;color:#e8e8ee;';
    closeBtn.addEventListener('click', function () { closeSheet(false); });
    sheetBody.appendChild(closeBtn);
  }

  function openModelSheet() {
    if (!current) return;
    openSheet();
    // 缓存命中即秒开：refreshModelChip 在进会话/切模型后都会预热这份缓存。
    if (lastModels && lastModelsSid === current.sessionId) {
      renderModelSheet(lastModels);
      return;
    }
    sheetBody.innerHTML = '';
    sheetBody.appendChild(el('div', 'loading', '加载中…'));
    api('session.models', { sessionId: current.sessionId }).then(function (v) {
      lastModels = v;
      lastModelsSid = current.sessionId;
      renderModelSheet(v);
    }).catch(function (e) {
      sheetBody.innerHTML = '';
      sheetBody.appendChild(el('div', 'err', '模型加载失败：' + e.message));
    });
  }
  modelChip.addEventListener('click', openModelSheet);
  sheet.addEventListener('click', function (ev) { if (ev.target === sheet) closeSheet(false); });

  // 主题外观：六套配色，localStorage 记忆，⚙ 按钮即点即换
  var THEMES = [
    { id: 'deep', name: '深海夜航', mc: '#0d1018', sw: ['#10131c', '#5b7cfa', '#e8eaf0'] },
    { id: 'oled', name: '曜石纯黑', mc: '#000000', sw: ['#000000', '#4f7cff', '#eaeaea'] },
    { id: 'mist', name: '晨雾 · 白底黑字', mc: '#eef1f7', sw: ['#f7f9fc', '#3b6ae0', '#1e2635'] },
    { id: 'sun', name: '暖阳 · 米白', mc: '#f2e9d9', sw: ['#faf6ee', '#c96f2d', '#3a2f22'] },
    { id: 'pine', name: '松间 · 墨绿', mc: '#0d1713', sw: ['#0d1713', '#35c088', '#dde9e2'] },
    { id: 'sakura', name: '樱语 · 淡粉', mc: '#f9ecf1', sw: ['#fdf4f7', '#d4627f', '#40323c'] }
  ];
  function currentTheme() {
    try { return localStorage.getItem('dshrc_theme') || 'deep'; } catch (e) { return 'deep'; }
  }
  function applyTheme(id) {
    try { localStorage.setItem('dshrc_theme', id); } catch (e) { }
    document.documentElement.setAttribute('data-theme', id);
    // 浏览器状态栏/手势区配色跟随主题（回弹画布同源）
    var meta = document.querySelector('meta[name="theme-color"]');
    for (var i = 0; i < THEMES.length; i++) {
      if (THEMES[i].id === id && meta) meta.setAttribute('content', THEMES[i].mc);
    }
  }
  applyTheme(currentTheme());
  function openSettings() {
    openSheet();
    sheetBody.innerHTML = '';
    sheetBody.appendChild(el('div', 'grp-name', '主题外观（点按即换，自动记忆）'));
    var cur = currentTheme();
    THEMES.forEach(function (t) {
      var row = el('div', 'model-row' + (t.id === cur ? ' cur' : ''), '');
      t.sw.forEach(function (c) {
        var d = document.createElement('span'); d.className = 'sw-dot';
        d.style.background = c;
        row.appendChild(d);
      });
      row.appendChild(el('span', 'theme-name', t.name + (t.id === cur ? ' ✓' : '')));
      row.addEventListener('click', function () {
        applyTheme(t.id);
        openSettings();  // 重渲染勾选态
      });
      sheetBody.appendChild(row);
    });
    appendUnpairSection();
  }
  setBtn.addEventListener('click', openSettings);

  // 退出配对：两步确认，避免误触。服务端吊销本设备令牌后清本地镜像并回配对页。
  function appendUnpairSection() {
    sheetBody.appendChild(el('div', 'grp-name', '设备'));
    var btn = el('button', 'danger-btn', '退出配对');
    var armed = false;
    btn.addEventListener('click', function () {
      if (!armed) {
        armed = true;
        btn.textContent = '再点一次确认退出';
        btn.classList.add('armed');
        setTimeout(function () {
          if (!armed) return;
          armed = false;
          btn.textContent = '退出配对';
          btn.classList.remove('armed');
        }, 4000);
        return;
      }
      armed = false;
      btn.disabled = true;
      btn.textContent = '正在退出…';
      fetch('/remote/unpair', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function () {
          // 令牌已在服务端吊销：清掉镜像，否则重进会自愈成失效令牌。
          try { localStorage.removeItem('dshrc_token'); } catch (e) { }
          document.cookie = 'dshrc_token=; Path=/; Max-Age=0; SameSite=Lax';
          location.replace('/');
        })
        .catch(function (e) {
          btn.disabled = false;
          btn.textContent = '退出配对';
          sheetBody.appendChild(el('div', 'err', '退出失败：' + e.message));
        });
    });
    sheetBody.appendChild(btn);
    sheetBody.appendChild(el('div', 'sess-meta', '退出后本机令牌立即失效，需要重新用配对码接入。'));
  }

  function appendCustomWorkspaceInput() {
    sheetBody.appendChild(el('div', 'grp-name', '或输入自定义目录'));
    var inp = document.createElement('input');
    inp.placeholder = 'E:\\\\path\\\\to\\\\workspace';
    inp.style.cssText = 'width:100%;padding:10px;border-radius:10px;border:1px solid #33333d;background:#191920;color:#e8e8ee;font-size:13px;';
    sheetBody.appendChild(inp);
    var mk = el('button', null, '在该目录创建新会话');
    mk.style.cssText = 'width:100%;padding:10px;margin-top:8px;border-radius:10px;border:none;background:#3b5bdb;color:#fff;font-weight:600;';
    mk.addEventListener('click', function () {
      var cwd = inp.value.trim();
      if (cwd) createAt({ cwd: cwd }, mk);
    });
    sheetBody.appendChild(mk);
  }

  var lastWorkspaces = null;  // 工作区清单缓存：新建面板秒开（清单几乎不变）
  function appendWorkspaceRows(arr) {
    var list = (arr || []).filter(function (w) { return w && (w.id || w.workspaceId); });
    if (!list.length) sheetBody.appendChild(el('div', 'sess-meta', '桌面端暂无注册工作区，可用下方自定义目录'));
    list.forEach(function (w) {
      var row = el('div', 'model-row', w.title || w.name || w.path || w.id || w.workspaceId);
      if (w.path) row.appendChild(el('div', 'sess-meta', w.path));
      row.addEventListener('click', function () { createAt({ workspaceId: w.id || w.workspaceId }, row); });
      sheetBody.appendChild(row);
    });
  }
  /** 新建面板顶部的模式选择：选中值只存在本次新建流程里，不改全局默认设置。 */
  function appendPresetSection() {
    sheetBody.appendChild(el('div', 'grp-name', '会话模式'));
    if (!presetRoster) {
      sheetBody.appendChild(el('div', 'preset-note', '模式清单加载中，稍后可选；直接建会话则用桌面端默认模式'));
      return;
    }
    if (selectedPreset === null) selectedPreset = presetRoster.defaultId;
    renderPresetPicker(sheetBody, selectedPreset, function (id) {
      selectedPreset = id;
      openNewSheet();  // 重绘以更新说明文字与选中态
    });
  }
  function openNewSheet() {
    openSheet();
    sheetBody.innerHTML = '';
    appendPresetSection();
    sheetBody.appendChild(el('div', 'grp-name', '选择工作区'));
    var hadCache = !!lastWorkspaces;
    if (hadCache) {
      appendWorkspaceRows(lastWorkspaces);  // 缓存秒开：不再闪「加载中」
      appendCustomWorkspaceInput();
    } else {
      sheetBody.appendChild(el('div', 'loading', '加载中…'));
    }
    // 模式清单首次拉取：回来后只在面板仍是新建视图时补渲染
    if (!presetRoster) {
      loadAgentPresets().then(function () {
        if (sheet.classList.contains('hidden') || current !== null) return;
        var g = sheetBody.querySelector('.grp-name');
        if (!g || g.textContent !== '会话模式') return;
        openNewSheet();
      }).catch(function () { });
    }
    // 用注册工作区清单创建（session.create {workspaceId}），会话才会归入桌面端对应分组；
    // 裸 cwd 创建会落「未分组」。返回形状做数组 / id 映射双兼容。
    api('workspace.list', {}).then(function (v) {
      var arr = (v && (v.workspaces || v.items)) || [];
      if (!Array.isArray(arr) && arr && typeof arr === 'object') {
        arr = Object.keys(arr).map(function (id) { var w = arr[id] || {}; w.id = id; return w; });
      }
      lastWorkspaces = arr;
      if (hadCache) return;  // 已按缓存渲染：迟到清单只更新缓存，下次打开生效
      // 首开补渲染：仅当面板仍停留在「选择工作区」视图（用户可能已切去别的面板）
      if (sheet.classList.contains('hidden')) return;
      var g = sheetBody.querySelector('.grp-name');
      if (!g || g.textContent !== '选择工作区') return;
      sheetBody.innerHTML = '';
      appendPresetSection();
      sheetBody.appendChild(el('div', 'grp-name', '选择工作区'));
      appendWorkspaceRows(arr);
      appendCustomWorkspaceInput();
    }).catch(function (e) {
      if (hadCache) return;  // 缓存行 + 自定义输入已在，新建入口没有被堵死
      if (sheet.classList.contains('hidden')) return;
      var g = sheetBody.querySelector('.grp-name');
      if (!g || g.textContent !== '选择工作区') return;
      sheetBody.innerHTML = '';
      appendPresetSection();
      sheetBody.appendChild(el('div', 'err', '工作区加载失败：' + e.message));
      appendCustomWorkspaceInput();  // 拿不到清单也不能把新建入口堵死
    });
  }

  // 宿主默认预设可能给新会话配上模型不支持的推理档位（如 glm-5.3-flash + high），
  // 导致首轮直接 UNSUPPORTED_REASONING_EFFORT。建会话后对照目录自动纠偏。
  function normalizeModel(sid) {
    return api('session.models', { sessionId: sid }).then(function (v) {
      var cur = v.current || {};
      var entry = null;
      (v.groups || []).forEach(function (g) {
        if (g.id !== cur.provider) return;
        (g.models || []).forEach(function (m) { if (m.id === cur.model) entry = m; });
      });
      var supported = entry && entry.reasoning
        ? (entry.reasoning.efforts || []).map(function (x) { return x.id; })
        : null;
      var fix = null;
      if (cur.reasoningEffort && supported === null) {
        fix = { sessionId: sid, provider: cur.provider, model: cur.model };  // 模型不吃档位 → 清空
      } else if (cur.reasoningEffort && supported && supported.indexOf(cur.reasoningEffort) === -1) {
        var fallback = (entry.reasoning.defaultEffort && supported.indexOf(entry.reasoning.defaultEffort) >= 0)
          ? entry.reasoning.defaultEffort : supported[0];
        fix = { sessionId: sid, provider: cur.provider, model: cur.model, reasoningEffort: fallback };
      }
      if (!fix) return null;
      return api('session.selectModel', fix);
    }).catch(function () { return null; });  // 目录拿不到就不强求，让 turn 自己报错（页面会显示）
  }

  var creatingSession = false;  // 防双击：session.create 在途时忽略再次点击
  function createAt(ref, row) {
    if (creatingSession) return;
    creatingSession = true;
    // 即时反馈：隧道路径 create 要几百毫秒，行内转圈代替「点了没反应」的僵住感
    var rowPrev = row ? row.innerHTML : null;
    if (row) {
      row.style.pointerEvents = 'none';
      row.innerHTML = '';
      var spin = el('span', 'spin-anim');
      spin.style.cssText = 'width:13px;height:13px;border-radius:50%;border:2px solid var(--line);border-top-color:var(--accent);animation:chipSpin .9s linear infinite;flex-shrink:0;display:inline-block;';
      row.appendChild(spin);
      row.appendChild(el('span', null, '正在创建会话…'));
    }
    function done() { creatingSession = false; }
    // 模式随创建一起下发（官方 session.create 支持 agentPreset）：新会话开局即是所选模式
    var payload = ref;
    if (selectedPreset) payload = Object.assign({}, ref, { agentPreset: selectedPreset });
    api('session.create', payload).then(function (v) {
      // 先跳转再纠偏：normalizeModel 要多跑一两拍 RPC，不该挡在开屏前面。
      // 不能用 closeSheet——它的 history.back() 异步落地时会把这个刚打开的会话
      // 覆盖回列表（新建会话「没有任何事发生」的根因）。
      hideSheetForJump();
      openSession({
        sessionId: v.sessionId, running: false, fresh: true, blank: true, cwd: ref.cwd || '',
        agentPreset: (v && v.agentPreset) || selectedPreset || null, updatedAt: Date.now(),
        projections: { values: { title: '新会话' } }
      });
      normalizeModel(v.sessionId);
      done();
    }).catch(function (e) {
      done();
      if (row) { row.style.pointerEvents = ''; row.innerHTML = rowPrev; }  // 原位恢复可重试
      sheetBody.appendChild(el('div', 'err', '创建失败：' + e.message));
      sheetBody.scrollTop = sheetBody.scrollHeight;  // 错误提示滚到可见处，别沉在面板底部
    });
  }
  newBtn.addEventListener('click', openNewSheet);

  // Start the gateway heartbeat on the list page too; no session needs to be open
  // before the phone can tell whether the desktop DSH is reachable.
  startHealthMonitor();
  showList();
})();
</script>
</body>
</html>`;
}
