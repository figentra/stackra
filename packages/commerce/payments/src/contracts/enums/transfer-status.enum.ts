/**
 * Stackra file contract:
 * Purpose: `TransferStatus`, where a refund or a payout stands at the provider.
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry; refunds and payouts share it.
 *           Codes are snake_case.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 2); ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/**
 * Pending, done or failed.
 *
 * @example
 * if ((await gateway.refund(request)).status === TransferStatus.Failed) throw ...;
 */
export const TransferStatus = Enum.of({
  /** Accepted by the provider and still moving. */
  Pending: "pending",
  /** Done. */
  Succeeded: "succeeded",
  /** Refused or reversed; no money moved. */
  Failed: "failed",
});

/** One of the codes above. */
export type TransferStatus = Enum.Value<typeof TransferStatus>;
