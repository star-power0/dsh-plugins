// ../DeepSeekHarness/dsh-home/profiles/plugins/dsh-client-ui-custom/src/index.ts
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import z from "@deepseek-ai/schemastery";

// ../DeepSeekHarness/dsh-home/profiles/plugins/dsh-client-ui-custom/src/shared.ts
var UI_CUSTOM_SETTINGS_NS = "ui-custom";
var FEATURES = ["history", "markdown", "appearance", "marketplace", "shortcuts", "usage", "motion"];
var HISTORY_POSITIONS = ["left", "right", "off"];
var MOTION_STYLES = ["fade-up", "fade", "rise-scale", "slide-in", "blur-in", "scale-in"];
var DEFAULT_MOTION_STYLE = "fade-up";
var isMotionStyle = (value) => typeof value === "string" && MOTION_STYLES.includes(value);
var SIDEBAR_MOTION_STYLES = ["slide-left", "fade", "expand", "slide-down"];
var NEW_CHAT_MOTION_STYLES = ["reveal", "fade", "bloom", "zoom"];
var DEFAULT_NEW_CHAT_MOTION_STYLE = "reveal";
var isNewChatMotionStyle = (value) => typeof value === "string" && NEW_CHAT_MOTION_STYLES.includes(value);
var DEFAULT_SIDEBAR_MOTION_STYLE = "slide-left";
var isSidebarMotionStyle = (value) => typeof value === "string" && SIDEBAR_MOTION_STYLES.includes(value);
var DEFAULT_HISTORY_POSITION = "off";
var DEFAULT_HISTORY_LIMIT = 10;

// ../DeepSeekHarness/dsh-home/profiles/plugins/dsh-client-ui-custom/src/index.ts
var UiCustomSectionSchema = z.object({
  // theme
  wallpaper: z.string().default(""),
  glass: z.string().default("frosted"),
  accent: z.string().default("#4176e6"),
  autoAccent: z.boolean().default(false),
  surfaceOpacity: z.number().default(100),
  sidebarOpacity: z.number().default(100),
  inputOpacity: z.number().default(100),
  codeBlockOpacity: z.number().default(100),
  darkSurfaceOpacity: z.number().default(100),
  gradient: z.string().default(""),
  darkScrim: z.number().default(0),
  fontFamily: z.string().default(""),
  codeFontFamily: z.string().default(""),
  fontScale: z.number().default(1),
  scrollbarAccent: z.boolean().default(false),
  vignette: z.boolean().default(false),
  // opt-in refinement knobs (neutral defaults: the plugin changes nothing)
  cornerRadius: z.string().default("inherit"),
  surfaceShadow: z.string().default("inherit"),
  focusGlow: z.string().default("inherit"),
  wallpaperTone: z.string().default("inherit"),
  darkAccent: z.string().default(""),
  // text-ink overrides over the official neutral label ladder ('' = stock)
  inkPrimary: z.string().default(""),
  inkSecondary: z.string().default(""),
  inkTertiary: z.string().default(""),
  inkCaption: z.string().default(""),
  inkDimmed: z.string().default(""),
  darkInkPrimary: z.string().default(""),
  darkInkSecondary: z.string().default(""),
  darkInkTertiary: z.string().default(""),
  darkInkCaption: z.string().default(""),
  darkInkDimmed: z.string().default(""),
  // user's own presets: id → JSON string of { name, config }
  myPresets: z.dict(z.string()).default({}),
  // render the user's own messages as Markdown (General-settings toggle)
  renderUserMarkdown: z.boolean().default(false),
  // conversation entrance motion (动效 settings-section toggle + styles)
  motionEnabled: z.boolean().default(true),
  motionStyle: z.union([...MOTION_STYLES]).default(DEFAULT_MOTION_STYLE),
  sidebarMotionStyle: z.union([...SIDEBAR_MOTION_STYLES]).default(DEFAULT_SIDEBAR_MOTION_STYLE),
  sidebarMotionEnabled: z.boolean().default(true),
  selectionMotionEnabled: z.boolean().default(true),
  newChatMotionEnabled: z.boolean().default(true),
  newChatMotionStyle: z.union([...NEW_CHAT_MOTION_STYLES]).default(DEFAULT_NEW_CHAT_MOTION_STYLE),
  settingsMotionEnabled: z.boolean().default(true),
  // shortcuts
  newConversation: z.string().default(""),
  switchModel: z.string().default(""),
  cycleThinking: z.string().default(""),
  sendMessage: z.string().default("Enter"),
  newline: z.string().default("Shift+Enter"),
  usagePanel: z.string().default(""),
  defaultWorkspace: z.string().default(""),
  modelShortcuts: z.array(z.object({
    combo: z.string().default(""),
    provider: z.string().default(""),
    model: z.string().default("")
  })).default([]),
  // history strip: recent-turns limit (0 = show all) + side (left/right/off)
  historyLimit: z.number().default(DEFAULT_HISTORY_LIMIT),
  historyPosition: z.union([...HISTORY_POSITIONS]).default(DEFAULT_HISTORY_POSITION),
  // pinned turns per session (turn numbers that ignore the count limit)
  pinnedTurns: z.dict(z.array(z.number())).default({}),
  // marketplace catalog source(s): raw manifest URL(s) / GitHub repo URL(s)
  marketplaceUrl: z.string().default(""),
  // auto-discover dsh-plugin topic repos from GitHub (merged after sources)
  discoverGitHub: z.boolean().default(false),
  // discovery sort (stars / publish date) and how many entries to show
  discoverSort: z.union(["stars", "date"]).default("stars"),
  discoverLimit: z.number().default(30),
  // feature whitelist: which independently selectable features mount on the
  // web client (absent/empty = all; see resolveFeatures on the client side)
  features: z.array(z.union([...FEATURES])).default([])
});
function apply(ctx, config) {
  ctx.inject(["settings"], (settingsCtx) => {
    const shortcuts = config?.shortcuts;
    settingsCtx.settings.register(settingsNamespace(UI_CUSTOM_SETTINGS_NS), UiCustomSectionSchema, {
      base: {
        wallpaper: config?.wallpaper ?? "",
        glass: config?.glass ?? "frosted",
        accent: config?.accent ?? "#4176e6",
        autoAccent: config?.autoAccent ?? false,
        surfaceOpacity: config?.surfaceOpacity ?? 100,
        sidebarOpacity: config?.sidebarOpacity ?? 100,
        inputOpacity: config?.inputOpacity ?? 100,
        codeBlockOpacity: config?.codeBlockOpacity ?? 100,
        darkSurfaceOpacity: config?.darkSurfaceOpacity ?? 100,
        gradient: config?.gradient ?? "",
        darkScrim: config?.darkScrim ?? 0,
        fontFamily: config?.fontFamily ?? "",
        codeFontFamily: config?.codeFontFamily ?? "",
        fontScale: config?.fontScale ?? 1,
        scrollbarAccent: config?.scrollbarAccent ?? false,
        vignette: config?.vignette ?? false,
        cornerRadius: config?.cornerRadius ?? "inherit",
        surfaceShadow: config?.surfaceShadow ?? "inherit",
        focusGlow: config?.focusGlow ?? "inherit",
        wallpaperTone: config?.wallpaperTone ?? "inherit",
        darkAccent: config?.darkAccent ?? "",
        inkPrimary: config?.inkPrimary ?? "",
        inkSecondary: config?.inkSecondary ?? "",
        inkTertiary: config?.inkTertiary ?? "",
        inkCaption: config?.inkCaption ?? "",
        inkDimmed: config?.inkDimmed ?? "",
        darkInkPrimary: config?.darkInkPrimary ?? "",
        darkInkSecondary: config?.darkInkSecondary ?? "",
        darkInkTertiary: config?.darkInkTertiary ?? "",
        darkInkCaption: config?.darkInkCaption ?? "",
        darkInkDimmed: config?.darkInkDimmed ?? "",
        myPresets: config?.myPresets ?? {},
        renderUserMarkdown: config?.renderUserMarkdown ?? false,
        motionEnabled: config?.motionEnabled ?? true,
        motionStyle: isMotionStyle(config?.motionStyle) ? config.motionStyle : DEFAULT_MOTION_STYLE,
        sidebarMotionStyle: isSidebarMotionStyle(config?.sidebarMotionStyle) ? config.sidebarMotionStyle : DEFAULT_SIDEBAR_MOTION_STYLE,
        sidebarMotionEnabled: config?.sidebarMotionEnabled ?? true,
        selectionMotionEnabled: config?.selectionMotionEnabled ?? true,
        newChatMotionEnabled: config?.newChatMotionEnabled ?? true,
        newChatMotionStyle: isNewChatMotionStyle(config?.newChatMotionStyle) ? config.newChatMotionStyle : DEFAULT_NEW_CHAT_MOTION_STYLE,
        settingsMotionEnabled: config?.settingsMotionEnabled ?? true,
        newConversation: shortcuts?.newConversation ?? "",
        switchModel: shortcuts?.switchModel ?? "",
        cycleThinking: shortcuts?.cycleThinking ?? "",
        sendMessage: shortcuts?.sendMessage ?? "Enter",
        newline: shortcuts?.newline ?? "Shift+Enter",
        usagePanel: shortcuts?.usagePanel ?? "",
        defaultWorkspace: shortcuts?.defaultWorkspace ?? "",
        modelShortcuts: shortcuts?.modelShortcuts ?? [],
        historyLimit: config?.historyLimit ?? DEFAULT_HISTORY_LIMIT,
        historyPosition: config?.historyPosition ?? DEFAULT_HISTORY_POSITION,
        pinnedTurns: config?.pinnedTurns ?? {},
        marketplaceUrl: config?.marketplaceUrl ?? "",
        discoverGitHub: config?.discoverGitHub ?? false,
        discoverSort: config?.discoverSort ?? "stars",
        discoverLimit: config?.discoverLimit ?? 30,
        features: config?.features ? [...config.features] : []
      }
    });
  });
}
export {
  apply
};
