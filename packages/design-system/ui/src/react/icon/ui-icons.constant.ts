/**
 * Stackra file contract:
 * Purpose: the icons the web components of @stackra/ui draw by themselves (the avatar's person mark, the action
 *          menu's ellipsis, the chevrons and check mark of lists, pagination and copy buttons, the copy mark and the tone icons of alerts and dialogs), registered here so they show without the app
 *          registering them.
 * Boundary: a registry of named re-exports, so a bundler keeps only these; an app's own registry wins for the same
 *          name.
 * Runtime: browser
 * Governing contract: ADR 0303 (decision 10); ADR 0183 (budgets).
 */
import { defineIconRegistry } from "@stackra/icons";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Copy,
  Ellipsis,
  Info,
  TriangleAlert,
  UserRound,
} from "@stackra/icons/react/lucide-icons";

/** The icons the web components draw on their own. */
export const UI_ICONS = defineIconRegistry({
  check: Check,
  "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "circle-alert": CircleAlert,
  "circle-check": CircleCheck,
  copy: Copy,
  ellipsis: Ellipsis,
  info: Info,
  "triangle-alert": TriangleAlert,
  "user-round": UserRound,
});
