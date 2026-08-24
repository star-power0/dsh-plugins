// dsh-model-enhancer —— host 端（node）
// 该插件只提供设置页 UI（图片输入勾选、上下文窗口/最大输出快捷选择），
// 配置本身通过官方 settings API 读写，host 侧无需额外端点。
//
// 历史说明：早期这里有 /model-enhancer/prepare-text-model，会在切换到纯文本
// 模型时把会话中的图片块永久替换成占位文本。该做法会让图片在切一次模型后
// 永久丢失，之后再切回多模态模型也无法恢复，因此已移除。图片的按模型能力
// 分流现由 dsh-modlens-guard 在请求时完成，不改动持久会话历史。
const name = "model-enhancer";
const inject = [];

function apply() {}

export { name, apply, inject };