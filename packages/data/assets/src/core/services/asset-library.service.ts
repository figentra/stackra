/**
 * Stackra file contract:
 * Purpose: `AssetLibrary`, the read-only view of the published assets over the injected `FileSystem` disk: the URL of
 *          a public asset (`useAsset`, mail and head tags) and the bytes or text of any asset (prompt templates,
 *          evaluation sets, seed data), and the hash check of `data/` assets that keeps a module with changed data from
 *          starting.
 * Boundary: a service with no state. An asset is published at `<module>/<kind>/<path>` on the disk, derived from its
 *           key alone, so every member layout (app, service, package) resolves the same way; the publish step
 *           (`stackra build` or CI) copies the winning file there. Only `public/` assets get a URL: the others are
 *           never published to the CDN (ADR 0234 decision 6). Named `AssetLibrary` so it never clashes with the
 *           generated `Assets` constants a consumer imports beside it.
 * Runtime: isomorphic
 * Governing contract: ADR 0234 (decisions 3, 6 and 7 as amended; 2026-10-24 note); ADR 0263 (resolved by type); ADR 0294 (decisions
 *                     16, 17 and 25).
 */
import { Service } from "@stackra/container";
import type { FileSystem } from "@stackra/filesystem/contracts";

import { AssetHashMismatchError } from "#core/errors/asset-hash-mismatch.error";
import { parseAssetKey } from "#core/functions/parse-asset-key.function";
import type { AssetEntry } from "#core/types/asset-entry.type";
import type { AssetKey } from "#core/types/asset-key.type";
import type { ResolvedAsset } from "#core/types/resolved-asset.type";

/**
 * Resolves and reads published assets.
 *
 * @example
 * constructor(library: AssetLibrary) { ... }
 *
 * const prompt = await this.library.text(Assets.orders.ai.explain_order_md);
 * const logo = this.library.resolve(Assets.orders.public.logo_svg).url;
 */
export class AssetLibrary extends Service {
  private readonly files: FileSystem;

  /**
   * @param files - the disk the assets are published to; its `url` setting is the CDN base.
   */
  constructor(files: FileSystem) {
    super();
    this.files = files;
  }

  /**
   * The key, source file and URL of a public asset.
   *
   * @throws TypeError when the asset is not in the `public/` kind folder, or its key is malformed.
   * @throws Error when the disk has no public URL (`filesystem.url` is not set).
   */
  resolve<K extends AssetKey>(entry: AssetEntry<K>): ResolvedAsset<K> {
    const { kind } = parseAssetKey(entry.key);
    if (kind !== "public")
      throw new TypeError(
        `${entry.key} is not public: only public/ assets have a URL; read it instead`,
      );
    return { key: entry.key, file: entry.file, url: this.files.url(this.pathOf(entry)) };
  }

  /**
   * The published bytes of an asset, as a new array the caller owns.
   *
   * @throws FileNotFoundError (from `@stackra/filesystem`) when the asset was not published to the disk.
   * @throws TypeError when its key is malformed.
   */
  read(entry: AssetEntry): Promise<Uint8Array> {
    return this.files.read(this.pathOf(entry));
  }

  /**
   * The published contents of a text asset, decoded as UTF-8.
   *
   * @throws FileNotFoundError (from `@stackra/filesystem`) when the asset was not published to the disk.
   * @throws TypeError when its key is malformed.
   */
  async text(entry: AssetEntry): Promise<string> {
    return new TextDecoder().decode(await this.read(entry));
  }

  /**
   * Checks every entry that carries a hash against the SHA-256 of its published bytes; the runtime calls it before a
   * module starts, with the module's assets.
   *
   * @throws AssetHashMismatchError for the first entry whose bytes differ.
   * @throws FileNotFoundError (from `@stackra/filesystem`) when a hashed asset was not published.
   */
  async verify(entries: Iterable<AssetEntry>): Promise<void> {
    for (const entry of entries) {
      if (entry.hash === undefined) continue;
      // a copy, so the bytes sit in a plain ArrayBuffer as `BufferSource` requires
      const digest = await crypto.subtle.digest("SHA-256", new Uint8Array(await this.read(entry)));
      const actual = Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
      if (actual !== entry.hash) throw AssetHashMismatchError.create({ key: entry.key, expected: entry.hash, actual });
    }
  }

  /**
   * The parsed JSON of a data asset, checked against its hash first when it has one.
   *
   * @throws AssetHashMismatchError when its bytes differ from its hash.
   * @throws SyntaxError when it is not JSON.
   */
  async json<T = unknown>(entry: AssetEntry): Promise<T> {
    await this.verify([entry]);
    return JSON.parse(await this.text(entry)) as T;
  }

  /** The disk key an asset is published under: `<module>/<kind>/<path>`. */
  private pathOf(entry: AssetEntry): string {
    const { module, kind, path } = parseAssetKey(entry.key);
    return `${module}/${kind}/${path}`;
  }
}
