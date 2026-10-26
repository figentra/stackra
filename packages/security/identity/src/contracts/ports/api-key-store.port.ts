/**
 * Stackra file contract:
 * Purpose: the `ApiKeyStore` port: the verification read of issued API keys, by the SHA-256 of the key. The gateway's
 *          `ApiKeyVerifierService` hashes the presented key and asks this port for the record.
 * Boundary: an abstract class that is its own token. The identity service implements it over its key table (an
 *           indexed equality lookup on the hash column, which reveals nothing about the key); the memory driver serves
 *           tests. A store never sees or keeps the key itself, and issuing and revoking keys are the identity service's
 *           actions, not this port.
 * Runtime: isomorphic
 * Governing contract: ADR 0278 (decision 3: only the hash is stored); ADR 0410 (STA-835).
 */
import { Port } from "@stackra/contracts";

import type { ApiKeyRecord } from "#contracts/types/api-key-record.type";

/**
 * Reads API keys by hash.
 *
 * @example
 * export class PostgresApiKeyStoreDriver extends Driver(ApiKeyStore) {
 *   async findByHash(hash: string): Promise<ApiKeyRecord | undefined> {
 *     return this.keys.findOne({ hash });
 *   }
 * }
 */
export abstract class ApiKeyStore extends Port {
  /**
   * The record whose key hashes to `hash`, or `undefined`.
   *
   * @throws Error when the store cannot be reached; the request then fails, never passes.
   */
  abstract findByHash(hash: string): Promise<ApiKeyRecord | undefined>;
}
