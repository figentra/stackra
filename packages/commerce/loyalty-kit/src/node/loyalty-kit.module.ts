/**
 * Stackra file contract:
 * Purpose: `LoyaltyKitModule`, the root module of the loyalty kit: what it shares with a host's modules. The file
 *          exists because `exports` is the one thing gen cannot derive; everything else in src/node is discovered from
 *          its path and base class.
 * Boundary: the key is the package key (`loyalty_kit`), the namespace of every permission, event, setting, table and
 *           i18n key in the kit. No bindings list and no imports: gen discovers each kind from its group folder, binds
 *           the ledger from the driver files and config `ledger` (or a host `@Replaces(LoyaltyLedger)`), infers edges
 *           from constructor types, and fails the host's build when no `LoyaltyMembers` driver exists.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 12, 15 and 16); ADR 0305 (an optional root module, written here for its
 *                     exports); ADR 0263 (gen writes the wiring).
 */
import { Module } from "@stackra/container";

import { LoyaltyService } from "#core/services/loyalty.service";
import { AccountService } from "#node/services/account.service";
import { LedgerReconcilerService } from "#node/services/ledger-reconciler.service";

/**
 * A host takes it by listing the package as a dependency; gen derives the host's module imports from its dependencies,
 * and values come from the host's `src/config/loyalty-kit.config.ts` override.
 *
 * @example
 * // services/commerce/package.json
 * { "dependencies": { "@stackra/loyalty-kit": "workspace:*" } }
 */
export class LoyaltyKitModule extends Module({
  exports: [LoyaltyService, AccountService, LedgerReconcilerService],
}) {}
