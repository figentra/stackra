/**
 * Stackra file contract:
 * Purpose: unit tests of `FilesystemPackStoreDriver`: it stores a signed pack under its content hash, fetches it back,
 *          lists the hashes, ignores a second put, answers `null` for an unknown or malformed hash and refuses a pack
 *          whose hash does not match.
 * Boundary: test only; a memory disk from @stackra/filesystem stands in for the bucket. Pack data is a made-up
 *           fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0385.
 */
import { buildConfig } from "@stackra/config";
import { Clock } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import { FilesystemConfig, MemoryFileSystemDriver } from "@stackra/filesystem";
import { describe, expect, it } from "@stackra/testing";

import { FilesystemPackStoreDriver } from "#core/drivers/filesystem-pack-store.driver";
import { PackRejection } from "#core/enums/pack-rejection.enum";
import { PackStatus } from "#core/enums/pack-status.enum";
import { PackRejectedError } from "#core/errors/pack-rejected.error";
import { signPack } from "#core/functions/sign-pack.function";
import { PackStore } from "#core/ports/pack-store.port";
import type { MarketPack } from "#core/types/market-pack.type";

/** Always 2026-10-26T09:00Z. */
class FixedClock extends Clock {
  now(): Date {
    return new Date("2026-10-26T09:00:00.000Z");
  }
}

const pack: MarketPack = {
  market: "xa",
  version: "1.0.0",
  status: PackStatus.Live,
  entries: [{ key: "tax.rate", value: 7, from: "2026-01-01" }],
  reviews: [],
  checklist: [],
};

/** A store over a fresh memory disk, and the disk. */
function store() {
  const files = new MemoryFileSystemDriver(buildConfig(FilesystemConfig), new FixedClock());
  return { files, store: new FilesystemPackStoreDriver(files) };
}

/** A pack signed by a fresh key. */
async function signed() {
  const keys = await crypto.subtle.generateKey("Ed25519", true, ["sign", "verify"]);
  return signPack(pack, "key_1", keys.privateKey);
}

describe("FilesystemPackStoreDriver", () => {
  it("is a PackStore that stores a pack under its content hash", async () => {
    const { files, store: packs } = store();
    const shipped = await signed();
    expect(packs).toBeInstanceOf(PackStore);
    await packs.put(shipped);
    await packs.put(shipped);
    expect(await files.list("market-packs/")).toEqual([`market-packs/${shipped.hash}.json`]);
    // oxlint-disable-next-line unicorn/prefer-structured-clone -- a JSON round trip on purpose: it is what the wire does (Dates become strings, undefined and functions drop)
    expect(await packs.get(shipped.hash)).toEqual(JSON.parse(JSON.stringify(shipped)));
    expect(await packs.hashes()).toEqual([shipped.hash]);
  });

  it("answers null for an unknown or malformed hash", async () => {
    const { store: packs } = store();
    expect(await packs.get("a".repeat(64))).toBeNull();
    expect(await packs.get("../secrets")).toBeNull();
  });

  it("refuses a pack whose hash does not match", async () => {
    const { store: packs } = store();
    const shipped = await signed();
    const error: unknown = await packs
      .put({ ...shipped, hash: "b".repeat(64) })
      .catch((caught: unknown) => caught);
    expect(isRefusal(error, PackRejectedError) && error.reason).toBe(PackRejection.HashMismatch);
  });
});
