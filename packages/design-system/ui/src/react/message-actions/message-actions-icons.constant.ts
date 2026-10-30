/**
 * Stackra file contract:
 * Purpose: `MESSAGE_ACTIONS_ICONS`, the drawings of the web MessageActions' icons: `thumbs-up` and `thumbs-down`.
 * Boundary: a registry the row nests around itself only, so it never touches the app's or `UI_ICONS`.
 * Runtime: browser
 * Governing contract: ADR 0303 (decision 10); STA-1371 (wave D, owner approval 2026-10-30).
 */
import { defineIconRegistry } from "@stackra/icons";
import { ThumbsDown, ThumbsUp } from "@stackra/icons/react/lucide-icons";

/** The icons the web MessageActions draws on its own. */
export const MESSAGE_ACTIONS_ICONS = defineIconRegistry({
  "thumbs-up": ThumbsUp,
  "thumbs-down": ThumbsDown,
});
