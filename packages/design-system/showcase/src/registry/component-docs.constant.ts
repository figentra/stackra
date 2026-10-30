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
    ],
    anatomy: ["list", "tab", "indicator", "panel"],
    alternatives: ["free/mode-switch", "free/accordion"],
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
    rules: TWO,
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
    rules: TWO,
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
};
