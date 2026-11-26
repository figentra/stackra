/**
 * Stackra file contract:
 * Purpose: `PlatformPersonalEventError`, the refusal of an integration event that declares a personal field
 *          (`@Classified`) written with no tenant: such a row is the platform's, which no tenant's erasure can rewrite,
 *          so the personal data in it would outlive every erasure of its subject (STA-2629).
 * Boundary: raised by the outbox's message insert before it writes anything, so the transaction that recorded the
 *           event fails with it. Kind `Internal` (a writer's mistake: record the event inside the subject's tenant, or
 *           drop the personal field), never retryable, code `platform_personal_event`; the one detail is the
 *           wire name, never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0189 (decision 2: erasure reaches every copy); ADR 0239 (2026-11-07 amendment, gap C: a
 *                     platform row carries no personal data); ADR 0134 (classification); ADR 0328 (built with
 *                     `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * An event with a personal field was written as a platform row (no owning tenant).
 *
 * @example
 * throw PlatformPersonalEventError.create({ type: "identity.user.renamed.v1" });
 */
export class PlatformPersonalEventError extends Refusal({
  kind: ErrorKind.Internal,
  retryable: false,
}) {
  /** The wire name of the refused event. */
  type!: string;
}
