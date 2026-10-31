/**
 * Stackra file contract:
 * Purpose: `COMPONENT_DOCS`, the doc-page extras of the most-used entries by key ("free/button"): keyboard map,
 *          anatomy items, alternatives, do/don't counts and whether the knobs playground mounts it.
 * Boundary: data only; the words are `showcase::doc.component.<tier>.<slug>.*` and `showcase::doc.key_action.*`
 *           (the registry gate checks they exist in both locales). An entry without a row shows the hero and pillars only.
 * Runtime: isomorphic
 * Governing contract: STA-1371 (doc pages wave, owner approval 2026-10-28); WAI-ARIA APG keyboard patterns.
 */
import type { ComponentDoc } from "#src/types/component-doc.type";

const ACTIVATE = [{ keys: ["Space", "Enter"], action: "activate" }] as const;
const DISMISS = { keys: ["Esc"], action: "close" } as const;
const TWO = { do: 2, dont: 2 } as const;

/** The extras of each documented entry. */
export const COMPONENT_DOCS: Readonly<Record<string, ComponentDoc>> = {
  "free/button": {
    keyboard: ACTIVATE,
    anatomy: ["container", "start_icon", "label", "end_icon"],
    alternatives: ["free/icon-button", "free/link", "free/split-button"],
    playground: { children: true },
    rules: TWO,
  },
  "free/icon-button": {
    keyboard: ACTIVATE,
    anatomy: ["container", "icon", "name"],
    alternatives: ["free/button", "free/close-button"],
    rules: TWO,
  },
  "free/link": {
    keyboard: [{ keys: ["Enter"], action: "follow" }],
    anatomy: ["text", "external_icon"],
    alternatives: ["free/button"],
    playground: { children: true },
    rules: TWO,
  },
  "free/text-field": {
    keyboard: [{ keys: ["Tab"], action: "move_focus" }],
    anatomy: ["label", "input", "description", "error"],
    alternatives: ["free/text-area", "free/number-field", "free/search-field"],
    playground: {},
    rules: TWO,
  },
  "free/text-area": {
    keyboard: [{ keys: ["Tab"], action: "move_focus" }],
    anatomy: ["label", "input", "description", "error"],
    alternatives: ["free/text-field"],
    playground: {},
    rules: TWO,
  },
  "free/number-field": {
    keyboard: [
      { keys: ["↑", "↓"], action: "step" },
      { keys: ["PageUp", "PageDown"], action: "step_large" },
      { keys: ["Home", "End"], action: "min_max" },
    ],
    anatomy: ["label", "input", "steppers", "description"],
    alternatives: ["free/money-field", "free/text-field"],
    playground: {},
    rules: TWO,
  },
  "free/search-field": {
    keyboard: [
      { keys: ["Enter"], action: "submit" },
      { keys: ["Esc"], action: "clear" },
    ],
    anatomy: ["icon", "input", "clear"],
    alternatives: ["free/combo-box", "free/filter-bar"],
    playground: {},
    rules: TWO,
  },
  "free/checkbox": {
    keyboard: [{ keys: ["Space"], action: "toggle" }],
    anatomy: ["box", "check", "label", "description"],
    alternatives: ["free/switch", "free/checkbox-group"],
    playground: {},
    rules: TWO,
  },
  "free/switch": {
    keyboard: [{ keys: ["Space"], action: "toggle" }],
    anatomy: ["track", "thumb", "label", "description"],
    alternatives: ["free/checkbox", "free/setting-row"],
    playground: {},
    rules: TWO,
  },
  "free/rating": {
    keyboard: [
      { keys: ["Tab"], action: "focus_selected" },
      { keys: ["→", "←"], action: "move_next" },
      { keys: ["Delete"], action: "clear" },
    ],
    anatomy: ["label", "icon", "fill", "description"],
    alternatives: ["free/radio-group", "free/reaction-button"],
    rules: TWO,
  },
  "free/radio-group": {
    keyboard: [
      { keys: ["Tab"], action: "focus_selected" },
      { keys: ["↓", "→"], action: "move_next" },
      { keys: ["↑", "←"], action: "move_previous" },
    ],
    anatomy: ["label", "radio", "option_label", "description"],
    alternatives: ["free/select", "free/mode-switch"],
    rules: TWO,
  },
  "free/select": {
    keyboard: [
      { keys: ["Space", "Enter", "↓"], action: "open" },
      { keys: ["↑", "↓"], action: "move" },
      { keys: ["Enter"], action: "choose" },
      DISMISS,
    ],
    anatomy: ["label", "trigger", "value", "indicator", "popover"],
    alternatives: ["free/radio-group", "free/combo-box", "free/multi-select"],
    rules: TWO,
  },
  "free/combo-box": {
    keyboard: [
      { keys: ["A–Z"], action: "filter" },
      { keys: ["↓"], action: "open" },
      { keys: ["Enter"], action: "choose" },
      DISMISS,
    ],
    anatomy: ["label", "input", "trigger", "listbox"],
    alternatives: ["free/select", "free/entity-picker"],
    rules: TWO,
  },
  "free/date-picker": {
    keyboard: [
      { keys: ["←", "→"], action: "move_segment" },
      { keys: ["↑", "↓"], action: "change_segment" },
      { keys: ["Alt", "↓"], action: "open_calendar" },
      DISMISS,
    ],
    anatomy: ["label", "segments", "trigger", "calendar"],
    alternatives: ["free/date-field", "free/date-label"],
    rules: TWO,
  },
  "free/tabs": {
    keyboard: [
      { keys: ["←", "→"], action: "move" },
      { keys: ["Home", "End"], action: "first_last" },
      { keys: ["Delete"], action: "close" },
    ],
    anatomy: ["list", "tab", "indicator", "panel"],
    alternatives: ["free/mode-switch", "free/accordion"],
    rules: TWO,
  },
  "free/disclosure": {
    keyboard: [
      { keys: ["Space", "Enter"], action: "expand_collapse" },
      { keys: ["Tab"], action: "move_focus" },
    ],
    anatomy: ["trigger", "indicator", "panel"],
    alternatives: ["free/accordion", "free/popover"],
    rules: TWO,
  },
  "free/navigation-menu": {
    keyboard: [
      { keys: ["Space", "Enter"], action: "open" },
      { keys: ["Tab"], action: "move_focus" },
      DISMISS,
    ],
    anatomy: ["list", "trigger", "panel", "label", "description"],
    alternatives: ["free/navigation-list", "free/menu"],
    rules: TWO,
  },
  "free/layout": {
    anatomy: ["item"],
    alternatives: ["free/two-column-layout", "free/single-column-layout"],
    rules: TWO,
  },
  "free/accordion": {
    keyboard: [
      { keys: ["Space", "Enter"], action: "expand_collapse" },
      { keys: ["Tab"], action: "move_focus" },
    ],
    anatomy: ["item", "trigger", "indicator", "panel"],
    alternatives: ["free/tabs"],
    rules: TWO,
  },
  "free/modal": {
    keyboard: [{ keys: ["Tab"], action: "cycle_focus" }, DISMISS],
    anatomy: ["backdrop", "dialog", "title", "body", "close"],
    alternatives: ["free/drawer", "free/alert-dialog", "free/popover"],
    rules: { do: 3, dont: 3 },
  },
  "free/alert-dialog": {
    keyboard: [{ keys: ["Tab"], action: "cycle_focus" }, ACTIVATE[0], DISMISS],
    anatomy: ["backdrop", "dialog", "icon", "title", "body", "actions"],
    alternatives: ["free/modal", "free/use-confirmation", "free/toast"],
    rules: { do: 3, dont: 3 },
  },
  "free/drawer": {
    keyboard: [{ keys: ["Tab"], action: "cycle_focus" }, DISMISS],
    anatomy: ["backdrop", "panel", "back", "header", "sub_header", "body", "footer"],
    alternatives: ["free/modal", "free/route-overlay"],
    rules: TWO,
  },
  "free/popover": {
    keyboard: [ACTIVATE[0], DISMISS],
    anatomy: ["trigger", "arrow", "content"],
    alternatives: ["free/tooltip", "free/modal"],
    rules: { do: 3, dont: 2 },
  },
  "free/tooltip": {
    keyboard: [
      { keys: ["Tab"], action: "show_hint" },
      { keys: ["Esc"], action: "hide_hint" },
    ],
    anatomy: ["trigger", "bubble"],
    alternatives: ["free/contextual-help", "free/popover"],
    rules: TWO,
  },
  "free/menu": {
    keyboard: [
      { keys: ["Space", "Enter"], action: "open" },
      { keys: ["↑", "↓"], action: "move" },
      { keys: ["Enter"], action: "choose" },
      DISMISS,
    ],
    anatomy: ["trigger", "popover", "section", "item"],
    alternatives: ["free/action-menu", "free/select"],
    rules: TWO,
  },
  "free/toast": {
    keyboard: [
      { keys: ["F6"], action: "jump_region" },
      { keys: ["Esc"], action: "dismiss" },
    ],
    anatomy: ["region", "icon", "title", "description", "action", "close"],
    alternatives: ["free/alert", "free/system-banner"],
    rules: TWO,
  },
  "free/task-tray": {
    keyboard: [
      { keys: ["Tab"], action: "move_focus" },
      { keys: ["Space", "Enter"], action: "activate" },
    ],
    anatomy: ["region", "header", "list", "row", "indicator", "actions"],
    alternatives: ["free/toast", "free/progress-bar"],
    rules: TWO,
  },
  "free/recurrence-editor": {
    keyboard: [
      { keys: ["Tab"], action: "move_focus" },
      { keys: ["Space", "Enter"], action: "activate" },
    ],
    anatomy: ["label", "input", "trigger", "item", "option_label", "description"],
    alternatives: ["free/date-picker", "free/calendar"],
    rules: TWO,
  },
  "free/scheduler": {
    keyboard: [
      { keys: ["Tab"], action: "move_focus" },
      { keys: ["Space", "Enter"], action: "activate" },
    ],
    anatomy: ["header", "actions", "list", "item"],
    alternatives: ["free/calendar", "free/timeline-chart"],
    rules: TWO,
  },
  "free/alert": {
    anatomy: ["icon", "title", "description", "actions"],
    alternatives: ["free/toast", "free/system-banner"],
    playground: {},
    rules: TWO,
  },
  "free/card": {
    anatomy: ["container", "header", "body", "footer"],
    alternatives: ["free/surface", "free/section"],
    rules: TWO,
  },
  "free/chip": {
    anatomy: ["container", "start_icon", "label", "end_icon"],
    alternatives: ["free/status-badge", "free/tag-group", "free/badge"],
    playground: { children: true },
    rules: TWO,
  },
  "free/avatar": {
    anatomy: ["image", "initials", "fallback"],
    alternatives: ["free/avatar-group", "free/thumbnail"],
    playground: {},
    rules: TWO,
  },
  "free/spinner": {
    anatomy: ["ring", "label"],
    alternatives: ["free/skeleton", "free/progress-bar", "free/inline-loading"],
    playground: {},
    rules: TWO,
  },
  "free/progress-bar": {
    anatomy: ["label", "value", "track", "fill"],
    alternatives: ["free/progress-circle", "free/spinner"],
    playground: {},
    rules: TWO,
  },
  "free/data-table": {
    keyboard: [
      { keys: ["↑", "↓", "←", "→"], action: "move" },
      { keys: ["Space"], action: "select_row" },
      { keys: ["Enter"], action: "row_action" },
    ],
    anatomy: ["toolbar", "header", "row", "cell", "pagination"],
    alternatives: ["free/table", "free/list"],
    rules: TWO,
  },
  "free/status-badge": {
    anatomy: ["dot", "label"],
    alternatives: ["free/chip", "free/status-indicator"],
    playground: { children: true },
    rules: TWO,
  },
  "free/slider": {
    keyboard: [
      { keys: ["←", "→"], action: "step" },
      { keys: ["PageUp", "PageDown"], action: "step_large" },
      { keys: ["Home", "End"], action: "min_max" },
    ],
    anatomy: ["label", "value", "track", "fill", "thumb"],
    alternatives: ["free/range-slider", "free/number-field"],
    rules: TWO,
  },
  "free/pagination": {
    keyboard: [
      { keys: ["Tab"], action: "move_focus" },
      { keys: ["Space", "Enter"], action: "activate" },
    ],
    anatomy: ["value", "item", "action"],
    alternatives: ["free/cursor-pagination"],
    rules: TWO,
  },
  "free/calendar": {
    keyboard: [
      { keys: ["←", "→", "↑", "↓"], action: "move" },
      { keys: ["PageUp", "PageDown"], action: "step_large" },
      { keys: ["Enter"], action: "choose" },
    ],
    anatomy: ["header", "calendar", "cell"],
    alternatives: ["free/date-picker", "free/range-calendar"],
    rules: TWO,
  },
  "free/tag-input": {
    keyboard: [
      { keys: ["Enter", ","], action: "submit" },
      { keys: ["Backspace"], action: "clear" },
      { keys: ["←", "→"], action: "move" },
    ],
    anatomy: ["label", "item", "input", "error"],
    alternatives: ["free/multi-select", "free/tag-group"],
    rules: TWO,
  },
  "free/masked-field": {
    keyboard: [{ keys: ["Tab"], action: "move_focus" }],
    anatomy: ["label", "input", "description", "error"],
    alternatives: ["free/text-field", "free/phone-field"],
    rules: TWO,
  },
  "free/mention-input": {
    keyboard: [
      { keys: ["↑", "↓"], action: "move" },
      { keys: ["Enter", "Tab"], action: "choose" },
      DISMISS,
    ],
    anatomy: ["label", "input", "listbox", "item"],
    alternatives: ["free/text-area", "free/tag-input"],
    rules: TWO,
  },
  "free/tree-select": {
    keyboard: [
      { keys: ["Space", "Enter"], action: "open" },
      { keys: ["↑", "↓"], action: "move" },
      { keys: ["←", "→"], action: "expand_collapse" },
      { keys: ["Space"], action: "toggle" },
      DISMISS,
    ],
    anatomy: ["label", "trigger", "value", "indicator", "popover", "row"],
    alternatives: ["free/select", "free/multi-select"],
    rules: TWO,
  },
  "free/tree-view": {
    keyboard: [
      { keys: ["↑", "↓"], action: "move" },
      { keys: ["←", "→"], action: "expand_collapse" },
      { keys: ["Space"], action: "toggle" },
      { keys: ["Enter"], action: "activate" },
    ],
    anatomy: ["row", "indicator", "check", "icon", "label", "description"],
    alternatives: ["free/accordion", "free/list"],
    rules: TWO,
  },
  "free/timeline": {
    anatomy: ["header", "icon", "title", "description"],
    alternatives: ["free/comment-thread"],
    rules: TWO,
  },
  "free/bar-list": {
    anatomy: ["list", "label", "fill", "value"],
    alternatives: ["free/bar-chart"],
    rules: TWO,
  },
  "free/button-group": {
    keyboard: [
      { keys: ["Tab"], action: "move_focus" },
      { keys: ["Space", "Enter"], action: "activate" },
    ],
    anatomy: ["container", "item", "label"],
    alternatives: ["free/split-button", "free/segmented-control"],
    rules: TWO,
  },
  "free/meter": {
    anatomy: ["label", "value", "track", "fill"],
    alternatives: ["free/progress-bar", "free/stacked-meter"],
    rules: TWO,
  },
  "free/result": {
    anatomy: ["icon", "title", "description", "actions"],
    alternatives: ["free/empty-state", "free/error-state"],
    rules: TWO,
  },
  "free/loading-overlay": {
    anatomy: ["content", "backdrop", "indicator", "label"],
    alternatives: ["free/page-skeleton", "free/inline-loading"],
    rules: TWO,
  },
  "free/scroll-area": {
    keyboard: [
      { keys: ["Tab"], action: "move_focus" },
      { keys: ["↑", "↓"], action: "move" },
    ],
    anatomy: ["region", "content"],
    alternatives: ["free/carousel", "free/drawer"],
    rules: TWO,
  },
  "free/lightbox": {
    keyboard: [
      { keys: ["←", "→"], action: "move" },
      { keys: ["Home", "End"], action: "first_last" },
      { keys: ["Tab"], action: "move_focus" },
      DISMISS,
    ],
    anatomy: ["backdrop", "dialog", "image", "close", "arrow", "label"],
    alternatives: ["free/gallery", "free/carousel"],
    rules: TWO,
  },
  "free/gallery": {
    keyboard: [
      { keys: ["Tab"], action: "move_focus" },
      { keys: ["Space", "Enter"], action: "open" },
    ],
    anatomy: ["list", "item", "image"],
    alternatives: ["free/carousel", "free/lightbox"],
    rules: TWO,
  },
  "free/image-cropper": {
    keyboard: [
      { keys: ["↑", "↓", "←", "→"], action: "move" },
      { keys: ["Shift"], action: "step_large" },
      { keys: ["+", "-"], action: "step" },
    ],
    anatomy: ["container", "image", "thumb", "track", "description"],
    alternatives: ["free/drop-zone", "free/thumbnail"],
    rules: TWO,
  },
  "free/truncate": {
    keyboard: [{ keys: ["Space", "Enter"], action: "expand_collapse" }],
    anatomy: ["text", "action"],
    alternatives: ["free/accordion", "free/tooltip"],
    rules: TWO,
  },
  "free/highlight": {
    anatomy: ["text", "value"],
    alternatives: ["free/search-field", "free/tag-input"],
    rules: TWO,
  },
  "free/number-value": {
    anatomy: ["value"],
    alternatives: ["free/number-field", "free/money-field"],
    rules: TWO,
  },
  "free/stepper": {
    keyboard: [
      { keys: ["Tab"], action: "move_focus" },
      { keys: ["Space", "Enter"], action: "activate" },
    ],
    anatomy: ["list", "indicator", "label", "description"],
    alternatives: ["free/progress-bar", "free/tabs"],
    rules: TWO,
  },
  "free/countdown": {
    anatomy: ["label", "value"],
    alternatives: ["free/date-label", "free/progress-bar"],
    rules: TWO,
  },
  "free/qr-code": {
    anatomy: ["image", "label"],
    alternatives: ["free/copy-button", "free/link"],
    rules: TWO,
  },
  "free/attachment-card": {
    keyboard: [
      { keys: ["Tab"], action: "move_focus" },
      { keys: ["Space", "Enter"], action: "activate" },
    ],
    anatomy: ["container", "icon", "name", "description", "actions"],
    alternatives: ["free/drop-zone", "free/file-trigger"],
    rules: TWO,
  },
  "free/share-button": {
    keyboard: ACTIVATE,
    anatomy: ["container", "start_icon", "label"],
    alternatives: ["free/copy-button", "free/button"],
    rules: TWO,
  },
  "free/listbox": {
    keyboard: [
      { keys: ["↑", "↓"], action: "move" },
      { keys: ["Space", "Enter"], action: "choose" },
      { keys: ["A–Z"], action: "filter" },
    ],
    anatomy: ["label", "listbox", "item", "check"],
    alternatives: ["free/select", "free/checkbox-group"],
    rules: TWO,
  },
  "free/tab-bar": {
    keyboard: [
      { keys: ["Tab"], action: "move_focus" },
      { keys: ["Enter"], action: "follow" },
    ],
    anatomy: ["container", "item", "icon", "label", "dot"],
    alternatives: ["free/sidebar", "free/tabs"],
    rules: TWO,
  },
  "free/polar-chart": {
    anatomy: ["image", "fill", "label"],
    alternatives: ["free/radar-chart", "free/bar-chart"],
    rules: TWO,
  },
  "free/waffle-chart": {
    anatomy: ["image", "cell", "value"],
    alternatives: ["free/pie-chart", "free/stacked-meter"],
    rules: TWO,
  },
  "free/marquee": {
    keyboard: [
      { keys: ["Tab"], action: "move_focus" },
      { keys: ["Space", "Enter"], action: "toggle" },
    ],
    anatomy: ["container", "content", "action"],
    alternatives: ["free/carousel", "free/system-banner"],
    rules: TWO,
  },
  "free/barcode": {
    anatomy: ["image", "label"],
    alternatives: ["free/qr-code", "free/copy-button"],
    rules: TWO,
  },
  "free/aspect-ratio": {
    anatomy: ["container", "content"],
    alternatives: ["free/thumbnail", "free/layout"],
    rules: TWO,
  },
  "free/page-indicator": {
    keyboard: [
      { keys: ["Tab"], action: "move_focus" },
      { keys: ["Space", "Enter"], action: "activate" },
    ],
    anatomy: ["container", "dot"],
    alternatives: ["free/pagination", "free/stepper"],
    rules: TWO,
  },
  "free/back-to-top": {
    keyboard: ACTIVATE,
    anatomy: ["action", "icon"],
    alternatives: ["free/fab", "free/toc-rail"],
    rules: TWO,
  },
  "free/footer": {
    keyboard: [
      { keys: ["Tab"], action: "move_focus" },
      { keys: ["Enter"], action: "follow" },
    ],
    anatomy: ["container", "section", "list", "row"],
    alternatives: ["free/navigation-menu", "free/sidebar"],
    rules: TWO,
  },
  "free/questionnaire-card": {
    keyboard: [
      { keys: ["Tab"], action: "move_focus" },
      { keys: ["↑", "↓"], action: "move" },
      { keys: ["Space"], action: "toggle" },
      { keys: ["Enter"], action: "activate" },
    ],
    anatomy: ["header", "title", "track", "body", "footer", "actions"],
    alternatives: ["free/stepper", "free/radio-group"],
    rules: TWO,
  },
  "free/model-picker": {
    keyboard: [
      { keys: ["Space", "Enter"], action: "open" },
      { keys: ["↑", "↓"], action: "move" },
      { keys: ["Enter"], action: "choose" },
      DISMISS,
    ],
    anatomy: ["label", "trigger", "value", "popover", "section", "item", "check"],
    alternatives: ["free/select", "free/chip"],
    rules: TWO,
  },
  "free/voice-input": {
    keyboard: [
      { keys: ["Space", "Enter"], action: "toggle" },
      { keys: ["Esc"], action: "cancel" },
    ],
    anatomy: ["action", "icon", "fill", "text"],
    alternatives: ["free/icon-button", "free/text-area"],
    rules: TWO,
  },
  "free/conversation-list": {
    keyboard: [
      { keys: ["↑", "↓"], action: "move" },
      { keys: ["Space", "Enter"], action: "select_row" },
      { keys: ["→"], action: "row_action" },
    ],
    anatomy: ["section", "header", "row", "title", "description", "action"],
    alternatives: ["free/listbox", "free/navigation-list"],
    rules: TWO,
  },
  "free/message-actions": {
    keyboard: [
      { keys: ["Tab"], action: "move_focus" },
      { keys: ["←", "→"], action: "move" },
      { keys: ["Space", "Enter"], action: "activate" },
    ],
    anatomy: ["toolbar", "action", "icon"],
    alternatives: ["free/reaction-button", "free/copy-button"],
    rules: TWO,
  },
  "free/message-scroller": {
    keyboard: [
      { keys: ["Tab"], action: "move_focus" },
      { keys: ["Space", "Enter"], action: "activate" },
    ],
    anatomy: ["region", "content", "action"],
    alternatives: ["free/scroll-area"],
    rules: TWO,
  },
  "free/prompt-suggestions": {
    keyboard: [
      { keys: ["Tab"], action: "move_focus" },
      { keys: ["Space", "Enter"], action: "activate" },
    ],
    anatomy: ["container", "item", "icon", "title", "description"],
    alternatives: ["free/chip", "free/button"],
    rules: TWO,
  },
  "free/chat-message": {
    keyboard: [{ keys: ["Tab"], action: "move_focus" }],
    anatomy: ["container", "bubble", "body", "actions"],
    alternatives: ["free/comment-thread", "free/message-scroller"],
    rules: TWO,
  },
  "free/prompt-input": {
    keyboard: [
      { keys: ["Enter"], action: "submit" },
      { keys: ["Tab"], action: "move_focus" },
    ],
    anatomy: ["container", "input", "toolbar", "action", "footer"],
    alternatives: ["free/text-area", "free/mention-input"],
    rules: TWO,
  },
  "free/reasoning": {
    keyboard: [{ keys: ["Space", "Enter"], action: "expand_collapse" }],
    anatomy: ["trigger", "panel", "list", "dot"],
    alternatives: ["free/disclosure", "free/timeline"],
    rules: TWO,
  },
  "free/sources": {
    keyboard: [
      { keys: ["Space", "Enter"], action: "expand_collapse" },
      { keys: ["Enter"], action: "follow" },
    ],
    anatomy: ["trigger", "list", "item", "icon", "title"],
    alternatives: ["free/link", "free/hover-card"],
    rules: TWO,
  },
  "free/shimmer": {
    anatomy: ["text", "fill"],
    alternatives: ["free/skeleton"],
    rules: TWO,
  },
  "free/media-player": {
    keyboard: [
      { keys: ["Space", "K"], action: "play_pause" },
      { keys: ["←", "→"], action: "seek" },
      { keys: ["↑", "↓"], action: "volume" },
      { keys: ["M"], action: "mute" },
      { keys: ["F"], action: "fullscreen" },
    ],
    anatomy: ["media", "track", "fill", "thumb", "toolbar", "action", "value"],
    alternatives: ["free/lightbox", "free/attachment-card"],
    rules: TWO,
  },
  "free/time-clock": {
    keyboard: [
      { keys: ["↑", "↓"], action: "step" },
      { keys: ["PageUp", "PageDown"], action: "step_large" },
      { keys: ["Enter", "Tab"], action: "next_view" },
      { keys: ["Shift+Tab"], action: "previous_view" },
    ],
    anatomy: ["label", "value", "ring", "hand", "thumb"],
    alternatives: ["free/time-field", "free/wheel-picker"],
    rules: TWO,
  },
  "free/angle-slider": {
    keyboard: [
      { keys: ["←", "→"], action: "step" },
      { keys: ["PageUp", "PageDown"], action: "step_large" },
      { keys: ["Home", "End"], action: "min_max" },
    ],
    anatomy: ["label", "track", "hand", "thumb", "value"],
    alternatives: ["free/slider", "free/number-field"],
    rules: TWO,
  },
  "free/popconfirm": {
    keyboard: [
      { keys: ["Space", "Enter"], action: "open" },
      { keys: ["Tab"], action: "move_focus" },
      DISMISS,
    ],
    anatomy: ["trigger", "popover", "arrow", "title", "description", "actions"],
    alternatives: ["free/alert-dialog", "free/popover"],
    rules: TWO,
  },
  "free/menubar": {
    keyboard: [
      { keys: ["←", "→"], action: "move" },
      { keys: ["Home", "End"], action: "first_last" },
      { keys: ["↓", "Enter"], action: "open" },
      { keys: ["↑", "↓"], action: "move" },
      DISMISS,
    ],
    anatomy: ["container", "trigger", "popover", "section", "item"],
    alternatives: ["free/menu", "free/app-header"],
    rules: TWO,
  },
  "free/floating-panel": {
    keyboard: [
      { keys: ["←", "→", "↑", "↓"], action: "move" },
      { keys: ["Shift", "←", "→", "↑", "↓"], action: "step_large" },
      { keys: ["←", "→", "↑", "↓"], action: "resize" },
      DISMISS,
    ],
    anatomy: ["container", "header", "handle", "title", "actions", "body"],
    alternatives: ["free/side-panel", "free/drawer"],
    rules: TWO,
  },
  "free/cascader": {
    keyboard: [
      { keys: ["Space", "Enter"], action: "open" },
      { keys: ["↑", "↓"], action: "move" },
      { keys: ["←", "→"], action: "expand_collapse" },
      { keys: ["Enter"], action: "choose" },
      DISMISS,
    ],
    anatomy: ["label", "trigger", "value", "popover", "listbox", "item"],
    alternatives: ["free/tree-select", "free/select"],
    rules: TWO,
  },
  "free/transfer-list": {
    keyboard: [
      { keys: ["Tab"], action: "move_focus" },
      { keys: ["↑", "↓"], action: "move" },
      { keys: ["Space"], action: "toggle" },
      { keys: ["Enter"], action: "activate" },
    ],
    anatomy: ["label", "header", "input", "listbox", "check", "actions"],
    alternatives: ["free/multi-select", "free/checkbox-group"],
    rules: TWO,
  },
};
