/**
 * Stackra file contract:
 * Purpose: `AccountFrozen`, an account was frozen or unfrozen by staff. Leaves through the host's outbox as
 *          `loyalty_kit.account.frozen.v1`.
 * Boundary: an integration event recorded by `AccountService#setFrozen` only when the flag changed. It registers its
 *           schema when the module loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 5, 16 and 20); ADR 0141; ADR 0305 (rule 19).
 */
import type { PublicId } from "@stackra/contracts";
import { IntegrationEvent } from "@stackra/events";
import { publicId, registerSchemas } from "@stackra/validation";
import { z } from "zod";

/**
 * `isFrozen` carries the new state, so one event serves both directions.
 *
 * @example
 * account.record(AccountFrozen.create({ accountId: account.id, memberId: account.memberId, isFrozen: true }));
 */
export class AccountFrozen extends IntegrationEvent({ name: "account.frozen" }) {
  /** The account whose flag changed. */
  accountId!: PublicId<"lac">;

  /** The principal it belongs to. */
  memberId!: string;

  /** The flag after the change. */
  isFrozen!: boolean;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    AccountFrozen,
    z.object({ accountId: publicId("lac"), memberId: z.string(), isFrozen: z.boolean() }),
  ],
]);
