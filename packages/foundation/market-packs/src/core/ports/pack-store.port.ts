/**
 * Stackra file contract:
 * Purpose: `PackStore`, the port through which signed pack versions are stored and fetched by their content hash: the
 *          release step puts a signed pack, a service fetches the hashes its deployment names and verifies each.
 * Boundary: an abstract class that is its own token, key `market-packs.PackStore`. A store holds bytes only; it never
 *           decides what is trusted (`fetchPacks` verifies). A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decision 2; decision 9 "where pack bytes are stored" as amended by ADR 0385);
 *                     ADR 0260 (decision 9: host data through a port); ADR 0266.
 */
import { Port } from "@stackra/contracts";

import type { SignedPack } from "#core/types/signed-pack.type";

/**
 * Signed packs by content hash.
 *
 * @example
 * export class FilesystemPackStoreDriver extends Driver(PackStore) { ... }
 */
export abstract class PackStore extends Port {
  /** Type-only port key. */
  declare readonly "~key": "market-packs.PackStore";

  /** The signed pack stored under `hash`, unparsed; `null` when there is none. */
  abstract get(hash: string): Promise<unknown>;

  /**
   * Stores `signed` under its content hash; storing the same pack twice changes nothing.
   *
   * @throws PackRejectedError (`hash_mismatch`) when its hash is not the hash of its pack.
   */
  abstract put(signed: SignedPack): Promise<void>;

  /** Every content hash stored, sorted. */
  abstract hashes(): Promise<readonly string[]>;
}
