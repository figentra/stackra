/**
 * Stackra file contract:
 * Purpose: the icons the web components of @stackra/ui draw by themselves (the avatar's person mark), registered here
 *          so they show without the app registering them.
 * Boundary: a registry of named re-exports, so a bundler keeps only these; an app's own registry wins for the same
 *          name.
 * Runtime: browser
 * Governing contract: ADR 0303 (decision 10); ADR 0183 (budgets).
 */
import { defineIconRegistry } from "@stackra/icons";
import { UserRound } from "@stackra/icons/react/lucide-icons";

/** The icons the web components draw on their own. */
export const UI_ICONS = defineIconRegistry({ "user-round": UserRound });
