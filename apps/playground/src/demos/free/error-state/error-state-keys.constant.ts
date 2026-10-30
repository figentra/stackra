/**
 * Stackra file contract:
 * Purpose: `ERROR_STATE_KEYS`, the typed keys of the web Error state demos' words in `assets/lang/<locale>/error_state.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The error_state namespace's keys. */
export const ERROR_STATE_KEYS = keys({
  error_state: {
    _: [
      "region_name",
      "retry",
      "sign_in",
      "go_back",
      "contact_support",
      "loading_orders",
      "recovered",
      "recovered_note",
      "break_again",
    ],
    sample: [
      "sign_in_to_continue",
      "your_session_ended_sign_in",
      "you_do_not_have_access",
      "ask_an_administrator_to_give",
      "we_could_not_find_that",
      "the_link_may_be_old",
      "something_went_wrong",
      "we_could_not_load_this",
      "with_the_error_s_details",
      "a_retry_and_a_further",
      "an_icon_of_your_own",
      "this_page_is_locked",
      "an_administrator_has_paused_access",
      "no_icon",
    ],
  },
});
