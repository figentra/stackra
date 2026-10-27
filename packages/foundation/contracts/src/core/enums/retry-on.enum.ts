/**
 * Stackra file contract:
 * Purpose: `RetryOn`, which failures a `RetryPolicy` retries: only a network failure (no answer, a timeout), or also a
 *          refusal whose status says a retry may succeed (`429`, `503`).
 * Boundary: an `Enum.of` value plus the type of the same name. Either way only a call that is safe to repeat is
 *           retried, and a refusal the envelope marks not retryable never is. Moved here from @stackra/clients
 *           (stackra-223).
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (decision 3: retryable kinds); ADR 0138 (idempotency).
 */
import { Enum } from "#core/bases/enum.base";

/**
 * What is retried.
 *
 * @example
 * createPublicClients({ ..., retry: { attempts: 2, retryOn: RetryOn.Network } });
 */
export const RetryOn = Enum.of({
  /** A request that got no answer: offline, DNS, a dropped connection, a timeout. */
  Network: "network",
  /** A network failure, or a `429` or `503` the producer may answer next time; the default. */
  Retryable: "retryable",
});

/** One of the codes above. */
export type RetryOn = Enum.Value<typeof RetryOn>;
