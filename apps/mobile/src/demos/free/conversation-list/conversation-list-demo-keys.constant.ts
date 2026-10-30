/**
 * Stackra file contract:
 * Purpose: `CONVERSATION_LIST_DEMO_KEYS`, the typed keys of the native ConversationList demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const CONVERSATION_LIST_DEMO_KEYS = keys({
  demo_free: {
    conversation_list: {
      support_history: [
        "label",
        "return_title",
        "return_preview",
        "delivery_title",
        "delivery_preview",
        "sizes_title",
        "sizes_preview",
        "gift_title",
        "gift_preview",
        "address_title",
        "address_preview",
        "refund_title",
        "refund_preview",
      ],
      actions: [
        "return_title",
        "return_preview",
        "delivery_title",
        "delivery_preview",
        "refund_title",
        "refund_preview",
        "renamed",
        "pinned",
        "unpinned",
        "renamed_done",
        "deleted",
      ],
    },
  },
});
