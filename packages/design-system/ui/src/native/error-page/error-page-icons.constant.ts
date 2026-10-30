/**
 * Stackra file contract:
 * Purpose: `ERROR_PAGE_ICONS`, the drawings of the two native ErrorPage icons the state components do not already
 *          register: `server-crash` (server error) and `wifi-off` (offline).
 * Boundary: a registry the ErrorPage nests around its own icon only, so it never touches the app's or `UI_ICONS`.
 * Runtime: react-native
 * Governing contract: ADR 0303 (decision 10); GAPS.md row 31 (owner decision 2026-10-28).
 */
import { defineIconRegistry } from "@stackra/icons";
import { ServerCrash, WifiOff } from "@stackra/icons/native/lucide-icons";

/** The icons the native ErrorPage draws on its own. */
export const ERROR_PAGE_ICONS = defineIconRegistry({
  "server-crash": ServerCrash,
  "wifi-off": WifiOff,
});
