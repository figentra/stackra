/**
 * Stackra file contract:
 * Purpose: the icons the native components of @stackra/ui draw by themselves (the avatar's person mark, the external
 *          link mark, the action menu's ellipsis, the chevrons and check
 *          mark of lists and pagination and the tone icons of alerts and dialogs), registered here so they
 *          show without the app registering them.
 * Boundary: a registry of named re-exports, so a bundler keeps only these; an app's own registry wins for the same
 *          name.
 * Runtime: react-native
 * Governing contract: ADR 0303 (decision 10); ADR 0183 (budgets).
 */
import { defineIconRegistry } from "@stackra/icons";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Ellipsis,
  ExternalLink,
  Info,
  TriangleAlert,
  UserRound,
} from "@stackra/icons/native/lucide-icons";

/** The icons the native components draw on their own. */
export const UI_ICONS = defineIconRegistry({
  check: Check,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "circle-alert": CircleAlert,
  "circle-check": CircleCheck,
  ellipsis: Ellipsis,
  "external-link": ExternalLink,
  info: Info,
  "triangle-alert": TriangleAlert,
  "user-round": UserRound,
});
