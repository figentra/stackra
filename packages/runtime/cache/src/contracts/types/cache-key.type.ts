/**
 * Stackra file contract:
 * Purpose: the `CacheKey` brand: the key type the `Cache` port takes, so a plain string never reaches a cache.
 * Boundary: type only, internal to the package. The `.` entry exports it under the same name beside `CacheKey.of`
 *           (`src/core/constants/cache-key.constant.ts`), the only maker of a key; `./contracts` does not export it,
 *           so the symbol has one entry (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 32: an explicit key built by `CacheKey.of`); ADR 0294 (decision 15).
 */
import type { Branded } from "@stackra/contracts";

/** A cache key: `<ModelName>:<part>:<part>`, each part URI-encoded, made only by `CacheKey.of`. */
export type CacheKey = Branded<string, "cache.CacheKey">;
