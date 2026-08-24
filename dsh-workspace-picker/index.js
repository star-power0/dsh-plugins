// dsh-workspace-picker — host half. Pure UI plugin: the empty apply exists so
// the plugin appears in the host cordis.yml / Loader; the browser half ships
// via exports["./client"], discovered through the package.json dsh.client
// declaration. All picking behavior lives on the client side and reuses the
// marketplace plugin's proven Windows PowerShell folder picker RPC.

function apply() {}

export { apply };
