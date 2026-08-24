// dsh-reasoning-slider —— client 半区入口（浏览器）
// 覆盖官方 composer 模型席位（conversation.input.model，priority -10），
// 渲染「模型列表 + 5 档推理滑块」。档位名/头像来自构建期内嵌图片
// （牢梁/梁子/梁白开/梁圣/梁神），select 提交真实 effort id。
import { ModelSlider } from "./ModelSlider.jsx";
import { en, zh } from "./locales.js";

const NS = "reasoningSlider";

// 需要的服务：席位插槽注册表、共享模型目录、locale、会话。
export const inject = ["locale", "slots", "modelDirectories", "sessions"];

export function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "reasoning-slider: dictionaries");

  ctx.inject(["slots", "modelDirectories", "sessions"], (scope) => {
    const models = scope.modelDirectories;
    const sessions = scope.sessions;
    scope.slots.inject("conversation.input.model", () =>
      scope.slots.register(
        {
          name: "conversation.input.model",
          locale: NS,
          // 覆盖内置席位（默认优先级 0）：最低优先级者渲染
          priority: -10,
          inject: (sessionId) => {
            const directory = models.directoryFor(sessionId);
            const available = sessions.subagentAddress(sessionId) === undefined;
            return {
              available,
              directory: directory.store,
              load: () => {
                if (available) directory.load().catch(() => {});
              },
              select: (selection) =>
                available
                  ? directory.select(selection).then(() => true, () => false)
                  : Promise.resolve(false)
            };
          }
        },
        ModelSlider
      )
    );
  });
}