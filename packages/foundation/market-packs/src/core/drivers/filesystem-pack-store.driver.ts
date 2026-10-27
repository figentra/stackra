/**
 * Stackra file contract:
 * Purpose: `FilesystemPackStoreDriver`, the `PackStore` over an injected `FileSystem` disk: one JSON file per signed
 *          pack at `market-packs/<content hash>.json`, so a pack's address is its content and a stored file is never
 *          rewritten with other content.
 * Boundary: the production driver of the port; the disk (memory, local, s3, gcs, an Encore bucket) is configuration
 *           of `@stackra/filesystem`, used through its public `FileSystem` port only. `put` recomputes the content hash
 *           and refuses a pack whose hash does not match. `get` returns the parsed JSON unchecked; `fetchPacks`
 *           verifies it.
 * Runtime: isomorphic
 * Governing contract: ADR 0385 (pack storage by content hash); ADR 0370 (decision 2); ADR 0234 (decision 7: disks
 *                     injected); ADR 0266.
 */
import { Driver } from "@stackra/container";
import type { FileSystem } from "@stackra/filesystem/contracts";

import { PackRejection } from "#core/enums/pack-rejection.enum";
import { PackRejectedError } from "#core/errors/pack-rejected.error";
import { contentHash } from "#core/functions/content-hash.function";
import { packLabel } from "#core/functions/pack-label.function";
import { PackStore } from "#core/ports/pack-store.port";
import type { SignedPack } from "#core/types/signed-pack.type";

/** The folder the packs are stored in. */
const FOLDER = "market-packs/";

/** A stored file name: a 64-hex content hash. */
const FILE = /^market-packs\/([0-9a-f]{64})\.json$/;

/**
 * Stores signed packs on a disk.
 *
 * @example
 * const store = new FilesystemPackStoreDriver(files);
 * await store.put(signed);
 */
export class FilesystemPackStoreDriver extends Driver(PackStore) {
  /** The disk the packs live on. */
  private readonly files: FileSystem;

  /**
   * @param files - the disk the packs live on.
   */
  constructor(files: FileSystem) {
    super();
    this.files = files;
  }

  /** The parsed file under `hash`, or `null`. */
  async get(hash: string): Promise<unknown> {
    if (!/^[0-9a-f]{64}$/.test(hash)) return null;
    const path = `${FOLDER}${hash}.json`;
    if (!(await this.files.exists(path))) return null;
    return JSON.parse(new TextDecoder().decode(await this.files.read(path))) as unknown;
  }

  /** Writes `signed` under its hash once its hash is checked. */
  async put(signed: SignedPack): Promise<void> {
    if ((await contentHash(signed.pack)) !== signed.hash)
      throw PackRejectedError.create({
        reason: PackRejection.HashMismatch,
        pack: packLabel(signed.pack),
      });
    const path = `${FOLDER}${signed.hash}.json`;
    if (await this.files.exists(path)) return;
    await this.files.write(path, JSON.stringify(signed), { contentType: "application/json" });
  }

  /** The hashes of the stored files. */
  async hashes(): Promise<readonly string[]> {
    return (await this.files.list(FOLDER)).flatMap((path) => FILE.exec(path)?.[1] ?? []).sort();
  }
}
