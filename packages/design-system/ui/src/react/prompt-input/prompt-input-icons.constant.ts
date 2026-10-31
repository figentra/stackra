/**
 * Stackra file contract:
 * Purpose: `PROMPT_INPUT_ICONS`, the drawings of the web PromptInput's button: `arrow-up` (send) and `square` (stop).
 * Boundary: a registry the composer nests around itself only, so it never touches the app's or `UI_ICONS`.
 * Runtime: browser
 * Governing contract: ADR 0303 (decision 10); STA-1371 (component gaps, owner approval 2026-10-31).
 */
import { defineIconRegistry } from "@stackra/icons";
import { ArrowUp, Square } from "@stackra/icons/react/lucide-icons";

/** The icons the web PromptInput draws on its own. */
export const PROMPT_INPUT_ICONS = defineIconRegistry({ "arrow-up": ArrowUp, square: Square });
