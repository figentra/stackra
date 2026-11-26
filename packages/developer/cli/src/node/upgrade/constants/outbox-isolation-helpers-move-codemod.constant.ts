/**
 * Stackra file contract:
 * Purpose: `OUTBOX_ISOLATION_HELPERS_MOVE_CODEMOD`, 0.30.0: `boundIsolation`, `ClaimNotLoadedError` and
 *          `RowIsolationMissingError` move to `@stackra/actions`; the codemod moves the imports.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0013 (decision 5); STA-145; changeset 82dccb3.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** boundIsolation and the two isolation errors move from @stackra/outbox to @stackra/actions. */
export const OUTBOX_ISOLATION_HELPERS_MOVE_CODEMOD: UpgradeCodemod = {
  id: "outbox-isolation-helpers-move",
  version: "0.30.0",
  title:
    "boundIsolation and the two isolation errors move from @stackra/outbox to @stackra/actions",
  note: "@stackra/actions exports inRowOwner, boundIsolation, ClaimNotLoadedError and RowIsolationMissingError. @stackra/outbox re-exports the last three for this release only; the codemod moves their imports and re-exports to @stackra/actions now, so the next minor's removal changes nothing.",
  source: "82dccb3",
  renames: [
    { name: "boundIsolation", from: ["@stackra/outbox"], to: "@stackra/actions" },
    { name: "ClaimNotLoadedError", from: ["@stackra/outbox"], to: "@stackra/actions" },
    { name: "RowIsolationMissingError", from: ["@stackra/outbox"], to: "@stackra/actions" },
  ],
};
