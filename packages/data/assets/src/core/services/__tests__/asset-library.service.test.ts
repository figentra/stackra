/**
 * Stackra file contract:
 * Purpose: unit tests of `AssetLibrary`: a service that resolves a public asset to the disk URL of
 *          `<module>/<kind>/<path>` with its key and source file, refuses a URL for a non-public asset or a disk with
 *          no public URL (the disk's own refusal), reads the published bytes and UTF-8 text of any asset, and
 *          checks a data asset's bytes against its hash.
 * Boundary: test only; a memory disk from @stackra/filesystem stands in for the CDN bucket, with a fixed clock.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0234 (decisions 3, 6
 *                     and 7).
 */
import { buildConfig } from "@stackra/config";
import { Service } from "@stackra/container";
import { Clock } from "@stackra/contracts";
import { FileNotFoundError, FilesystemConfig, MemoryFileSystemDriver } from "@stackra/filesystem";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { AssetHashMismatchError } from "#core/errors/asset-hash-mismatch.error";
import { assets } from "#core/functions/assets.function";
import { AssetLibrary } from "#core/services/asset-library.service";
import type { ResolvedAsset } from "#core/types/resolved-asset.type";

/** Always 2026-10-24T09:00Z. */
class FixedClock extends Clock {
  now(): Date {
    return new Date("2026-10-24T09:00:00.000Z");
  }
}

const Assets = assets({
  orders: {
    ai: {
      explain_order_md: {
        key: "orders::ai/explain-order.md",
        file: "assets/ai/orders/explain-order.md",
        overridable: true,
      },
    },
    public: {
      logo_svg: {
        key: "orders::public/logo.svg",
        file: "assets/public/orders/logo.svg",
        overridable: true,
      },
      hero_image: {
        key: "orders::public/images/hero image.png",
        file: "assets/public/orders/images/hero image.png",
        overridable: false,
      },
    },
  },
});

/** A memory disk serving from the CDN base. */
function disk(): MemoryFileSystemDriver {
  return new MemoryFileSystemDriver(
    buildConfig(FilesystemConfig, { values: { url: "https://cdn.test/assets/" } }),
    new FixedClock(),
  );
}

describe("AssetLibrary", () => {
  it("is a service", () => {
    expect(new AssetLibrary(disk())).toBeInstanceOf(Service);
  });

  it("resolves a public asset to the disk URL of <module>/<kind>/<path>", () => {
    const library = new AssetLibrary(disk());
    const logo = library.resolve(Assets.orders.public.logo_svg);
    expect(logo).toEqual({
      key: "orders::public/logo.svg",
      file: "assets/public/orders/logo.svg",
      url: "https://cdn.test/assets/orders/public/logo.svg",
    });
    expectTypeOf(logo).toEqualTypeOf<ResolvedAsset<"orders::public/logo.svg">>();
  });

  it("encodes each path segment of the URL", () => {
    const library = new AssetLibrary(disk());
    expect(library.resolve(Assets.orders.public.hero_image).url).toBe(
      "https://cdn.test/assets/orders/public/images/hero%20image.png",
    );
  });

  it("refuses a URL for an asset outside public/", () => {
    const library = new AssetLibrary(disk());
    expect(() => library.resolve(Assets.orders.ai.explain_order_md)).toThrow(/not public/);
  });

  it("refuses a URL when the disk has no public URL", () => {
    // the memory disk falls back to https://files.invalid since stackra-226; a disk with no URL refuses, as S3 does
    class PrivateDisk extends MemoryFileSystemDriver {
      override url(): string {
        throw new Error("This disk has no public URL: set `filesystem.url` to serve its files");
      }
    }
    const library = new AssetLibrary(
      new PrivateDisk(buildConfig(FilesystemConfig), new FixedClock()),
    );
    expect(() => library.resolve(Assets.orders.public.logo_svg)).toThrow(/no public URL/);
  });

  it("reads the published bytes and text of any asset", async () => {
    const files = disk();
    await files.write("orders/ai/explain-order.md", "Explain order {{id}} — ✓");
    await files.write("orders/public/logo.svg", new Uint8Array([60, 115, 118, 103]));
    const library = new AssetLibrary(files);
    expect(await library.text(Assets.orders.ai.explain_order_md)).toBe("Explain order {{id}} — ✓");
    expect(await library.read(Assets.orders.public.logo_svg)).toEqual(
      new Uint8Array([60, 115, 118, 103]),
    );
  });

  it("rejects with FileNotFoundError when the asset was not published", async () => {
    const library = new AssetLibrary(disk());
    await expect(library.read(Assets.orders.ai.explain_order_md)).rejects.toBeInstanceOf(
      FileNotFoundError,
    );
    await expect(library.text(Assets.orders.ai.explain_order_md)).rejects.toBeInstanceOf(
      FileNotFoundError,
    );
  });
});

describe("AssetLibrary data assets", () => {
  /** The published contents of the data asset. */
  const CONTENT = '{"days":30}';

  /** A data asset with `hash`, published with CONTENT. */
  async function published(hash: string) {
    const files = disk();
    await files.write("legal/data/sa-rules.data.json", CONTENT);
    const entry = {
      key: "legal::data/sa-rules.data.json" as const,
      file: "assets/data/sa-rules.data.json",
      overridable: false,
      hash,
      version: "2026.10",
    };
    return { library: new AssetLibrary(files), entry };
  }

  /** The real SHA-256 of CONTENT, so the fixture never depends on a typed digest. */
  async function realHash(): Promise<string> {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(CONTENT));
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  }

  it("reads a data asset whose bytes match its hash", async () => {
    const { library, entry } = await published(await realHash());
    await expect(library.verify([entry])).resolves.toBeUndefined();
    expect(await library.json(entry)).toEqual({ days: 30 });
  });

  it("refuses a data asset whose bytes differ, and skips an entry with no hash", async () => {
    const { library, entry } = await published("0".repeat(64));
    await expect(library.json(entry)).rejects.toThrow(AssetHashMismatchError);
    await expect(
      library.verify([{ key: entry.key, file: entry.file, overridable: false }]),
    ).resolves.toBeUndefined();
  });
});
