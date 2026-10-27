/**
 * Stackra file contract:
 * Purpose: `RetryOn`, what a public client retries: only a network failure, or also a refusal whose status says a retry
 *          may succeed (`429`, `503`).
 * Boundary: an `Enum.of` value plus the type of the same name. Either way only a call that is safe to repeat is
 *           retried (the transport's `retry` rule), and a refusal the envelope marks not retryable never is.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (decision 3: retryable kinds); ADR 0138 (idempotency).
 */
import { Enum } from "@stackra/contracts";

/**
 * The retry policies of a public client.
 *
 * @example
 * createPublicClients({ ..., retry: { attempts: 2, on: RetryOn.Network } });
 */
export const RetryOn = Enum.of({
  /** A request that got no answer: offline, DNS, a dropped connection, a timeout. */
  Network: "network",
  /** A network failure, or a `429` or `503` the producer may answer next time. */
  Retryable: "retryable",
});

/** One of the codes above. */
export type RetryOn = Enum.Value<typeof RetryOn>;
