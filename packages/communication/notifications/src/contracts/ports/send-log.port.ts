/**
 * Stackra file contract:
 * Purpose: the `SendLog` port: remembers which idempotency key produced which provider id, so a transport whose
 *          provider has no idempotency header still sends once per key when a delivery job is retried.
 * Boundary: an abstract class that is its own token; the notifications service stores it (keys and provider ids only,
 *           never content or addresses). A driver reads it before a send and writes it after; a process that dies in
 *           between can send twice, which only a provider idempotency header closes.
 * Runtime: isomorphic
 * Governing contract: ADR 0223; ADR 0086 (decision 1: delivery tracking with retries); ADR 0138 (idempotency).
 */
import { Port } from "@stackra/contracts";

/**
 * Remembers the provider id each idempotency key was sent with.
 *
 * @example
 * const known = await log.get(key);
 * if (known !== undefined) return known;
 */
export abstract class SendLog extends Port {
  /** The provider id sent under `key`, or undefined. */
  abstract get(key: string): Promise<string | undefined>;

  /** Records that `key` produced `providerId`. */
  abstract record(key: string, providerId: string): Promise<void>;
}
