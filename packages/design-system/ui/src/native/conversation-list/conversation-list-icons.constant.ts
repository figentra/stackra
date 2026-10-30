/**
 * Stackra file contract:
 * Purpose: `CONVERSATION_LIST_ICONS`, the drawings of the native ConversationList's empty-state and menu icons the app
 *          may not register: `message-square`, `pin` and `pin-off`.
 * Boundary: a registry the list nests around itself only, so it never touches the app's or `UI_ICONS`.
 * Runtime: react-native
 * Governing contract: ADR 0303 (decision 10); STA-1371 (wave D, owner approval 2026-10-30).
 */
import { defineIconRegistry } from "@stackra/icons";
import { MessageSquare, Pin, PinOff } from "@stackra/icons/native/lucide-icons";

/** The icons the native ConversationList draws on its own. */
export const CONVERSATION_LIST_ICONS = defineIconRegistry({
  "message-square": MessageSquare,
  pin: Pin,
  "pin-off": PinOff,
});
