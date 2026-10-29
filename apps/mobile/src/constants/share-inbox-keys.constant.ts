/**
 * Stackra file contract:
 * Purpose: `SHARE_INBOX_KEYS`, the typed i18n keys of the share inbox screen, read from @stackra/native-share's
 *          `native_share` catalogues (`SHARE_INBOX_KEYS.native_share.inbox.keep` is `"native_share::inbox.keep"`).
 * Boundary: keys only; the strings are the package's `assets/lang/<locale>/native_share.json`.
 * Runtime: isomorphic
 * Governing contract: ADR 0268 (R15: typed keys); ADR 0231 (`<module>::<path>`); ADR 0322 (generated constants).
 */
import { keys } from "@stackra/i18n";

/** The share inbox's keys under the `native_share` namespace. */
// shortcut: written by hand until gen emits the app's `#stackra/i18n` tree (STA-339); then import `I18n` instead.
export const SHARE_INBOX_KEYS = keys({
  native_share: {
    inbox: [
      "title",
      "empty",
      "text",
      "link",
      "file",
      "keep",
      "upload",
      "kept",
      "uploaded",
      "failed",
      "done",
    ],
  },
});
