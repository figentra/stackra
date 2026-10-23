/**
 * Stackra file contract:
 * Purpose: the icons the native components of @stackra/ui draw by themselves (the avatar's person mark, the external
 *          link mark), registered here so they show without the app registering them.
 * Boundary: a registry of named re-exports, so a bundler keeps only these; an app's own registry wins for the same
 *          name.
 * Runtime: react-native
 * Governing contract: ADR 0303 (decision 10); ADR 0183 (budgets).
 */
import { defineIconRegistry } from "@stackra/icons";
import { ExternalLink, UserRound } from "@stackra/icons/native/lucide-icons";

/** The icons the native components draw on their own. */
export const UI_ICONS = defineIconRegistry({
  "external-link": ExternalLink,
  "user-round": UserRound,
});
