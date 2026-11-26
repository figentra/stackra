/**
 * Stackra file contract:
 * Purpose: `EDGE_HEADER_GUARD_PUBLIC_PATHS_CODEMOD`, 0.30.0: `EdgeHeaderGuard` checks edge traffic only and loses
 *          `publicPaths`.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0013 (decision 5); STA-145; changeset 7d60f82.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** EdgeHeaderGuard checks edge traffic only and publicPaths is removed. */
export const EDGE_HEADER_GUARD_PUBLIC_PATHS_CODEMOD: UpgradeCodemod = {
  id: "edge-header-guard-public-paths",
  version: "0.30.0",
  title: "EdgeHeaderGuard checks edge traffic only and publicPaths is removed",
  note: "EdgeHeaderGuard is bound in every generated service: a request with any edge header must verify, and one with none goes on to authentication. publicPaths is removed from the guard: delete it from config. EdgeConfig (app.edge) picks the drivers: keys memory or env (the STACKRA_EDGE_SIGNING_KEYS secret, newest first) and nonces memory; set the secret in each deployed environment.",
  source: "7d60f82",
};
