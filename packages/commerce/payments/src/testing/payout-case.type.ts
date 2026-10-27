/**
 * Stackra file contract:
 * Purpose: `PayoutCase`, one recorded case for a `PayoutGateway`: the payout asked, the vendor's published documentation
 *          the recorded answer comes from, whether a sandbox run has certified it, and what the gateway must answer.
 * Boundary: a type only, in the `./testing` entry. It names no vendor: the Connections and their recorded vendor answers
 *           live in the OS integrations service (ADR 0443 decision 7), which builds the Connection over its recorded
 *           transport and runs each case with `runPayoutCase`.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 2); ADR 0443 (decisions 7 and 8: the testing kit stays in Stackra); ADR 0269;
 *                     owner decision D3 (2026-10-27): certification pending until a sandbox run passes.
 */
import type { TransferStatus } from "#contracts/enums/transfer-status.enum";
import type { PayoutRequest } from "#contracts/types/payout-request.type";

/**
 * One recorded payout case.
 *
 * @example
 * const accepted: PayoutCase = {
 *   id: "vendor.payout-accepted",
 *   source: "vendor API reference, Payouts: create",
 *   certification: "pending",
 *   request: { reference: "po_1", amount, destination: "acct_1" },
 *   expect: { status: TransferStatus.Pending, providerRef: "pyt_1" },
 * };
 */
export interface PayoutCase {
  /** Stable id, `<provider>.<case>` (`vendor.payout-accepted`). */
  readonly id: string;

  /** The published documentation (page and section) the recorded answer comes from. */
  readonly source: string;

  /** `pending` until a run against the vendor's sandbox passes (owner decision D3). */
  readonly certification: "pending" | "certified";

  /** The payout asked of the gateway. */
  readonly request: PayoutRequest;

  /** What the gateway must answer on the recorded exchange. */
  readonly expect: {
    /** The transfer state; a declined payout is `failed`, never a thrown error. */
    readonly status?: TransferStatus;
    /** The provider's id of the payout. */
    readonly providerRef?: string;
    /** The answer was lost (outage, timeout): the gateway must refuse `provider_unavailable`. */
    readonly lost?: boolean;
    /** The refusal code the gateway must throw instead of answering (`capability_unsupported`). */
    readonly refused?: string;
  };
}
