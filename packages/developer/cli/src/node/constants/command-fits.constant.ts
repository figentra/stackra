/**
 * Stackra file contract:
 * Purpose: `COMMAND_FITS`, the commands `stackra list` shows only in a workspace that uses what they act on: the
 *          mobile onboarding with a mobile app, preview serve with web surfaces, smoke with a product's surfaces or
 *          apps, seed-pack with seed packs, and the search, settings, audit and operator commands with the package
 *          whose data they touch. Every other command fits every workspace (the Repository group aside, which only
 *          the core repository lists).
 * Boundary: data only, keyed by the console name (`preview:serve`); a command still runs by name anywhere, and
 *           `stackra list --all` shows it.
 * Runtime: node
 * Governing contract: STA-2872 spec FR-002.
 */
import type { CommandFit } from "#node/types/command-fit.type";

/** The commands listed only where the workspace has their fit. */
export const COMMAND_FITS: Readonly<Record<string, CommandFit>> = {
  "mobile:onboard": "mobile",
  "preview:serve": "surfaces",
  smoke: "product",
  "seed-pack": "seed-packs",
  "search:reindex": "@stackra/search",
  "search:status": "@stackra/search",
  "settings:apply": "@stackra/settings",
  "settings:diff": "@stackra/settings",
  "audit:verify": "@stackra/audit",
  "ops:bootstrap-operator": "@stackra/iam",
};
