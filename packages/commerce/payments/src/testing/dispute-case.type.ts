/**
 * Stackra file contract:
 * Purpose: `DisputeCase`, one recorded case for a `DisputeGateway`: which call (read, respond with evidence, accept),
 *          the vendor's published documentation the recorded answer comes from, whether a sandbox run has certified it,
 *          and what the gateway must answer.
 * Boundary: a type only, in the `./testing` entry. It names no vendor: the Connections and their recorded vendor answers
 *           live in the OS integrations service (ADR 0443 decision 7), which runs each case with `runDisputeCase`.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (Enforcement: the dispute port); ADR 0443 (decisions 7 and 8); ADR 0269; owner decision
 *                     D3 (2026-10-27): certification pending until a sandbox run passes.
 */
import type { Money } from "@stackra/money";

import type { DisputeStatus } from "#contracts/enums/dispute-status.enum";
import type { DisputeEvidence } from "#contracts/types/dispute-evidence.type";

/**
 * One recorded dispute case.
 *
 * @example
 * const opened: DisputeCase = {
 *   id: "vendor.dispute-opened",
 *   source: "vendor API reference, Disputes: retrieve",
 *   certification: "pending",
 *   step: "read",
 *   providerRef: "dp_1",
 *   expect: { status: DisputeStatus.NeedsResponse, paymentRef: "pay_1" },
 * };
 */
export interface DisputeCase {
  /** Stable id, `<provider>.<case>` (`vendor.dispute-opened`). */
  readonly id: string;

  /** The published documentation (page and section) the recorded answer comes from. */
  readonly source: string;

  /** `pending` until a run against the vendor's sandbox passes (owner decision D3). */
  readonly certification: "pending" | "certified";

  /** The call: `read` is `dispute`, `respond` sends `evidence`, `accept` concedes. */
  readonly step: "read" | "respond" | "accept";

  /** The provider's id of the dispute. */
  readonly providerRef: string;

  /** The merchant's evidence, for `respond`. */
  readonly evidence?: DisputeEvidence;

  /** What the gateway must answer on the recorded exchange. */
  readonly expect: {
    /** The dispute's state after the call. */
    readonly status?: DisputeStatus;
    /** The provider's id of the disputed payment. */
    readonly paymentRef?: string;
    /** The disputed amount. */
    readonly amount?: Money;
    /** The provider's reason code. */
    readonly reason?: string;
    /** When evidence is due. */
    readonly respondBy?: Date;
    /** The answer was lost (outage, timeout): the gateway must refuse `provider_unavailable`. */
    readonly lost?: boolean;
    /** The refusal code the gateway must throw instead of answering. */
    readonly refused?: string;
  };
}
