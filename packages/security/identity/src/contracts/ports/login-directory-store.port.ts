/**
 * Stackra file contract:
 * Purpose: the `LoginDirectoryStore` port: where a region's identity service writes its rows of the global login
 *          directory: put keys, remove keys.
 * Boundary: an abstract class that is its own token. Keys only, already hashed by `loginDirectoryPrefix` and ending in
 *           the writing region, so two regions never write the same key and a write never reads first. Both calls are
 *           idempotent, so an event delivered twice is harmless. The deployment's driver sends Cloudflare KV bulk
 *           calls (`@stackra/infra-cloudflare`'s `loginDirectoryKvRequest`); `MemoryLoginDirectoryStoreDriver` is the
 *           test one.
 * Runtime: isomorphic
 * Governing contract: ADR 0353 (decision 4); OS ADR 0002 (decision 1); ADR 0451.
 */
import { Port } from "@stackra/contracts";

/**
 * Writes the login directory.
 *
 * @example
 * await directory.put(["dir:k1:email:3f…:eu"]);
 */
export abstract class LoginDirectoryStore extends Port {
  /** Writes each key; a key already there stays. */
  abstract put(keys: readonly string[]): Promise<void>;

  /** Removes each key; a key already gone is no error. */
  abstract remove(keys: readonly string[]): Promise<void>;
}
