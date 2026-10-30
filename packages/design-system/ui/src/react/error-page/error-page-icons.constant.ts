/**
 * Stackra file contract:
 * Purpose: `ERROR_PAGE_ICONS`, the drawings of the two web ErrorPage icons the state components do not already
 *          register: `server-crash` (server error) and `wifi-off` (offline).
 * Boundary: a registry the ErrorPage nests around its own icon only, so it never touches the app's or `UI_ICONS`.
 * Runtime: browser
 * Governing contract: ADR 0303 (decision 10); GAPS.md row 31 (owner decision 2026-10-28).
 */
import { defineIconRegistry } from "@stackra/icons";
import { ServerCrash, WifiOff } from "@stackra/icons/react/lucide-icons";

/** The icons the web ErrorPage draws on its own. */
export const ERROR_PAGE_ICONS = defineIconRegistry({
  "server-crash": ServerCrash,
  "wifi-off": WifiOff,
});
