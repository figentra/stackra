/**
 * Stackra file contract:
 * Purpose: `ApiKeyVerifierService`, the gateway's verification of a presented API key: the text is parsed first (a
 *          malformed key or a bad checksum is refused with no lookup), then hashed and looked up by its hash in the
 *          `ApiKeyStore`, the stored hash compared in constant time, and the record checked for revocation, expiry and,
 *          for a publishable key, the request's origin.
 * Boundary: every refusal is one `api_key_rejected`, whatever the reason, so a caller learns nothing about which keys
 *           exist. A secret key presented with an `Origin` (a browser) is refused: a secret key never lives in a
 *           browser. The prefixes are `IdentityConfig.apiKeyPrefixes` (configuration). Scopes and the tenant binding
 *           are the caller's next check. An unreachable store throws, so the request fails, never passes.
 * Runtime: isomorphic
 * Governing contract: ADR 0278 (decisions 3 to 7); COM-56; ADR 0410 (STA-835).
 */
import { Service } from "@stackra/container";
import type { Clock } from "@stackra/contracts";

import type { IdentityConfig } from "#config/identity.config";
import type { ApiKeyStore } from "#contracts/ports/api-key-store.port";
import { ApiKeyKind } from "#core/enums/api-key-kind.enum";
import { ApiKeyRejectedError } from "#core/errors/api-key-rejected.error";
import { hashApiKey } from "#core/functions/hash-api-key.function";
import { isOriginAllowed } from "#core/functions/is-origin-allowed.function";
import { parseApiKey } from "#core/functions/parse-api-key.function";
import { sameText } from "#core/functions/same-text.function";
import type { VerifiedApiKey } from "#core/types/verified-api-key.type";

/**
 * Verifies API keys by hash.
 *
 * @example
 * const { record } = await verifier.verify(request.headers.get("x-api-key") ?? "", request.headers.get("origin"));
 */
export class ApiKeyVerifierService extends Service {
  /** Where issued keys are read by hash. */
  private readonly store: ApiKeyStore;

  /** The key prefixes. */
  private readonly config: IdentityConfig;

  /** The time expiry is checked against. */
  private readonly clock: Clock;

  /**
   * @param store - the issued keys, by hash.
   * @param config - the identity configuration (the key prefixes).
   * @param clock - the current time.
   */
  constructor(store: ApiKeyStore, config: IdentityConfig, clock: Clock) {
    super();
    this.store = store;
    this.config = config;
    this.clock = clock;
  }

  /**
   * The verified key, when `key` is an issued, live key usable from `origin`.
   *
   * @param origin - the request's `Origin` header; `null` or absent for a server call.
   * @throws ApiKeyRejectedError when the key is malformed, unknown, revoked, expired, a publishable key from an unbound
   *         origin, or a secret key from a browser.
   * @throws Error when the store cannot be reached.
   */
  async verify(key: string, origin?: string | null): Promise<VerifiedApiKey> {
    const parsed = parseApiKey(key, this.config);
    if (parsed === undefined || !parsed.wellFormed) throw ApiKeyRejectedError.create();
    const hash = await hashApiKey(key);
    const record = await this.store.findByHash(hash);
    if (record === undefined || !sameText(record.hash, hash)) throw ApiKeyRejectedError.create();
    const expired = record.expiresAt !== undefined && record.expiresAt <= this.clock.now();
    if (record.revokedAt !== undefined || expired) throw ApiKeyRejectedError.create();
    const browser = origin !== null && origin !== undefined;
    if (parsed.kind === ApiKeyKind.Secret ? browser : !isOriginAllowed(origin, record.origins))
      throw ApiKeyRejectedError.create();
    return { kind: parsed.kind, record };
  }
}
