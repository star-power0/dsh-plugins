/**
 * GenUI plugin: teaches the model the ```dsh-ui fence syntax for emitting
 * declarative UI components inline in its reply. The browser half renders the
 * fence through GenuiBlock (ui-primitives); this host half only tells the
 * model the language exists, so a session without the plugin simply never
 * emits fences and nothing changes.
 *
 * The section is a convention section (order 100-199), placed after the bash
 * guidance so the model sees it among its output-format rules.
 * @module @omdsh-dev/dsh-genui
 */
import { Context } from '@deepseek-ai/cordis';
/** Convention: tool guidance uses 100–199; bash's section is 104. */
export declare const GENUI_SECTION_ORDER = 105;
/** The fence language description injected into every assembled system prompt.
 *  Deliberately slim: the `genui` skill carries the full component→field
 *  mapping; this section keeps only the contract that must always be
 *  present (fence syntax, type whitelist, and critical behavioral rules). */
export declare const GENUI_SECTION_TEXT = "You can render interactive UI components INSIDE your reply \u2014 between paragraphs \u2014 by emitting a fenced block with the language tag `dsh-ui` containing a JSON spec:\n\n```dsh-ui\n{\"title\":\"\u53EF\u9009\u6807\u9898\",\"gap\":14,\"items\":[...]}\n```\n\nThe spec is a white-listed component tree rendered inline where the fence sits. Only these `type` values; the `genui` skill, when available, carries the full content\u2192component mapping and per-component field details:\n\n- \u5E03\u5C40: text \u00B7 row \u00B7 col \u00B7 grid \u00B7 card \u00B7 divider \u00B7 spacer\n- \u5C55\u793A: badge \u00B7 stat \u00B7 progress \u00B7 list \u00B7 table \u00B7 keyvalue \u00B7 avatar \u00B7 timeline \u00B7 file-tree \u00B7 breadcrumb \u00B7 callout \u00B7 steps \u00B7 diff \u00B7 json \u00B7 code \u00B7 copy\n- \u56FE\u8868: chart (bars|line|donut) \u00B7 plot (\u51FD\u6570\u56FE)\n- \u4EA4\u4E92: button \u00B7 input \u00B7 textarea \u00B7 select \u00B7 checkbox \u00B7 switch \u00B7 slider \u00B7 radio \u00B7 submit \u00B7 quiz \u00B7 link \u00B7 tabs \u00B7 accordion\n- \u9AD8\u7EA7: mermaid (flowchart/sequence/class/gantt/pie/er/state/journey) \u00B7 scene3d (3D WebGL)\n\nRules:\n- \u89E6\u53D1: \u7ED3\u6784\u5316\u8868\u8FBE\u4F18\u4E8E\u7EAF\u6587\u672C\u65F6\u4E3B\u52A8\u7528\uFF08\u8981\u70B9\u3001\u5F3A\u8C03\u3001\u5BF9\u6BD4\u3001\u6D41\u7A0B\u3001\u6B65\u9AA4\u3001\u72B6\u6001\u3001\u6570\u636E\u3001\u6F14\u793A\uFF09\uFF0C\u7EAF\u95EE\u7B54\u4E0E\u4E00\u53E5\u8BDD\u4E0D\u5957 UI\uFF1B\u4E00\u4E2A\u4E3B\u9898\u4E00\u4E2A\u4E3B\u7EC4\u4EF6\uFF0C\u6BCF\u6B21 3\u20138 \u4E2A\u7EC4\u4EF6\uFF0C\u540C\u4E00\u6570\u636E\u4E0D\u91CD\u590D\u51FA\u73B0\u3002\n- JSON \u4E25\u683C: \u574F\u56F4\u680F\u964D\u7EA7\u4E3A\u4EE3\u7801\u5757\uFF1B\u22653 \u8282\u70B9\u6216\u542B table \u7684\u56F4\u680F\u53D1\u51FA\u524D\u8C03\u7528 validate_dsh_ui\uFF0C\u274C \u4FEE\u597D\u518D\u53D1\uFF08\u82E5\u9644\u300C\u5DF2\u81EA\u52A8\u4FEE\u590D\u300DJSON \u7167\u6284\u5373\u53EF\uFF09\u3002\n- \u89C4\u6A21: \u2264200 \u8282\u70B9\u3001\u5D4C\u5957\u22648 \u5C42\uFF08\u8D85\u51FA\u88AB\u622A\u65AD\uFF09\uFF1B3D mesh 1\u20135\uFF1Bplot \u7ED9\u5408\u7406 xMin/xMax\u3002\n- LOCAL-FIRST + actions: UI \u80FD\u81EA\u5DF1\u505A\u7684\u72B6\u6001\u53D8\u5316\uFF08\u5224\u5377\u3001\u5224\u9898\u3001\u91CD\u7F6E\u3001\u5C55\u5F00\u3001\u9009\u4E2D\uFF09\u5C31\u5730\u5B8C\u6210\uFF0C\u96F6\u5F80\u8FD4\uFF1Baction \u53EA\u7528\u4E8E\u5FC5\u987B\u6A21\u578B\u53C2\u4E0E\u7684\u4E8B\u3002\u4EA4\u4E92\u7EC4\u4EF6\u5E26 \"action\":\"name\"\uFF0C\u4EA4\u4E92\u4EE5 [genui-action] name + \u7EC4\u4EF6\u6570\u636E\u56DE\u4F20\uFF0C\u5C4A\u65F6\u91CD\u6E32\u67D3\u66F4\u65B0 UI\uFF1B\u65E0 action \u7684\u6309\u94AE\u7981\u7528\u3002\n- Durable state: \u4EA4\u4E92\u72B6\u6001\u6309\u300C\u4F1A\u8BDD+\u5185\u5BB9\u6307\u7EB9\u300D\u6301\u4E45\u5316\u2014\u2014\u5237\u65B0/\u91CD\u653E\u6062\u590D\uFF1B\u91CD\u6E32\u67D3\u76F8\u540C\u5185\u5BB9\u4FDD\u7559\uFF0C\u65B0\u5185\u5BB9\u91CD\u7F6E\u3002\n- \u5377\u5B50\u6A21\u5F0F: \u6BCF\u9898\u4E00\u4E2A radio\uFF08group+answer+explanation\uFF09+ \u4E00\u4E2A submit\uFF08groups \u5168\u5217\uFF09\uFF0C\u672C\u5730\u5224\u5206\u3002\n- Secrets ban: \u4E0D\u7D22\u53D6\u5BC6\u7801\u3001API Key\u3001Token\u3001\u6062\u590D\u7801\uFF1B\u9700\u8981\u65F6\u62D2\u7EDD\u5E76\u89E3\u91CA\u3002\n- \u552F\u4E00\u901A\u9053: dsh-ui \u56F4\u680F\u662F\u552F\u4E00\u7684 UI \u8F93\u51FA\u65B9\u5F0F\uFF0C\u6E32\u67D3\u5728\u56DE\u7B54\u6B63\u6587\u91CC\u3002\u6CA1\u6709 render_ui \u5DE5\u5177\uFF0C\u4E5F\u4E0D\u4F7F\u7528\u4F1A\u8BDD\u9762\u677F\uFF08\"panel\" / \"append\" \u5B57\u6BB5\u65E0\u6548\uFF0C\u4E0D\u8981\u8F93\u51FA\uFF09\u3002";
/**
 * Register the GenUI output-language section and the validate_dsh_ui tool.
 * (The render_ui tool was removed at the operator's request; the fence
 * channel is the only UI path.)
 * @param ctx - cordis context.
 */
export declare const inject: string[];
export declare function apply(ctx: Context): void;
