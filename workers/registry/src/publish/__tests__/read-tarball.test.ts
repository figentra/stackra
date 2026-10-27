/**
 * Stackra file contract:
 * Purpose: unit tests of `readTarball`: files without the top folder, package.json parsed, pax long names, and the
 *          refusals (not gzip, no package.json, over the unpacked limit).
 * Boundary: pure; tarballs built in memory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decision 7).
 */
import { gzipSync } from "node:zlib";

import { makeTarball } from "#src/__tests__/fixtures/tarball.fixture";
import { readTarball } from "#src/publish/read-tarball";
import { TarballError } from "#src/publish/tarball-error";

const LONG = `dist/${"a".repeat(120)}.mjs`;

describe("readTarball", () => {
  it("lists the files and parses package.json", async () => {
    const tgz = makeTarball({
      "package.json": JSON.stringify({ name: "@stackra/core", version: "1.0.0" }),
      LICENSE: "MIT",
      [LONG]: "export {};",
    });
    const contents = await readTarball(tgz, 1_000_000);
    expect(contents.files).toEqual(["package.json", "LICENSE", LONG]);
    expect(contents.packageJson).toEqual({ name: "@stackra/core", version: "1.0.0" });
  });

  it("refuses bytes that are not gzip", async () => {
    await expect(readTarball(new Uint8Array([1, 2, 3]), 1000)).rejects.toThrow(TarballError);
  });

  it("refuses a tarball without package.json", async () => {
    await expect(readTarball(makeTarball({ "index.js": "" }), 1_000_000)).rejects.toThrow(
      "tarball has no package.json",
    );
  });

  it("refuses an archive that unpacks past the limit", async () => {
    const bomb = new Uint8Array(gzipSync(Buffer.alloc(100_000)));
    await expect(readTarball(bomb, 10_000)).rejects.toThrow("unpacks to more than");
  });
});
