/**
 * Stackra file contract:
 * Purpose: unit tests of `readPackAssets`: shipped pack assets are read and parsed in order through `AssetLibrary`,
 *          and a file whose bytes differ from its manifest hash is refused.
 * Boundary: test only; a memory disk from @stackra/filesystem stands in for the published assets. Pack data is a
 *           made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0385.
 */
import { AssetHashMismatchError, AssetLibrary } from "@stackra/assets";
import { buildConfig } from "@stackra/config";
import { Clock } from "@stackra/contracts";
import { FilesystemConfig, MemoryFileSystemDriver } from "@stackra/filesystem";
import { describe, expect, it } from "@stackra/testing";

import { readPackAssets } from "#core/functions/read-pack-assets.function";

/** Always 2026-10-26T09:00Z. */
class FixedClock extends Clock {
  now(): Date {
    return new Date("2026-10-26T09:00:00.000Z");
  }
}

const text = JSON.stringify({ market: "xa", version: "0.1.0", status: "draft", entries: [] });

/** The SHA-256 of `value` as hex. */
async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

describe("readPackAssets", () => {
  it("reads shipped packs in order after their hash check", async () => {
    const files = new MemoryFileSystemDriver(buildConfig(FilesystemConfig), new FixedClock());
    await files.write("market-packs/data/packs/xa.json", text);
    const entry = {
      key: "market-packs::data/packs/xa.json" as const,
      file: "assets/data/packs/xa.json",
      overridable: false,
      hash: await sha256(text),
    };
    expect(await readPackAssets(new AssetLibrary(files), [entry])).toEqual([JSON.parse(text)]);
    await expect(
      readPackAssets(new AssetLibrary(files), [{ ...entry, hash: "e".repeat(64) }]),
    ).rejects.toThrow(AssetHashMismatchError);
  });
});
