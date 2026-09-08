/**
 * Host-half tool definitions for the ```dsh-ui fence channel.
 *
 * Zero runtime harness imports, deliberately: an external plugin's node half
 * must not depend on the harness module graph at runtime (the profile
 * resolves only the plugin package itself). The definition is therefore a
 * plain `ToolDefinition` object — the exact shape `defineTool` returns — with
 * the arguments schema authored as JSON Schema (the harness validates args
 * and output with the same JSON Schema validator defineTool uses). Deep
 * validation, deterministic repair, and resource limits live in the shared
 * guard (`src/client/guard.ts`), which the schema deliberately stays loose
 * enough to reach.
 *
 * The former `render_ui` tool (tool-row card + panel dock publishing) was
 * removed at the operator's request; the fence channel is the only UI path.
 * @module @omdsh-dev/dsh-genui/plugin/tool
 */
import type { ToolDefinition } from '@deepseek-ai/dsh-tools';
/** Build the validate_dsh_ui tool definition. */
export declare function createValidateDshUiTool(): ToolDefinition;
