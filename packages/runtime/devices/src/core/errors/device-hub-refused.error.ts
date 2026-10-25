/**
 * Stackra file contract:
 * Purpose: `DeviceHubRefusedError`, the refusal the HTTP drivers throw when the hub answers with any failure status
 *          other than 401 or 403, after the transport's own retries ran out.
 * Boundary: kind `Unavailable`, code `device_hub_refused`, retryable: a device keeps its readings and acknowledgements
 *           and sends them on its next cycle. A 4xx here means the device and the hub disagree on the protocol. Its
 *           one detail is the status, never the body.
 * Runtime: isomorphic
 * Governing contract: ADR 0235 (decision 2); ADR 0140 (envelope and kinds); ADR 0294 (decisions 16 and 20).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** Retryable: the hub may answer the next cycle. */
export class DeviceHubRefusedError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {
  /** The hub's status (`503`, `400`). */
  status!: number;
}
