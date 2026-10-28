/**
 * Stackra file contract:
 * Purpose: unit tests of the byte helpers: base64 and base64url round trips and the tarball digests against
 *          node:crypto.
 * Boundary: pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decision 8).
 */
import { createHash } from "node:crypto";

import { fromBase64 } from "#src/bytes/from-base64";
import { sha256Hex } from "#src/bytes/sha256-hex";
import { toBase64 } from "#src/bytes/to-base64";
import { toBase64Url } from "#src/bytes/to-base64-url";
import { tarballDigests } from "#src/publish/tarball-digests";

describe("tarballDigests", () => {
  it("computes the SRI integrity, the shasum and the SHA-256 and SHA-512 hex", async () => {
    const bytes = new TextEncoder().encode("tarball bytes");
    expect(await tarballDigests(bytes)).toEqual({
      integrity: `sha512-${createHash("sha512").update(bytes).digest("base64")}`,
      shasum: createHash("sha1").update(bytes).digest("hex"),
      sha256: createHash("sha256").update(bytes).digest("hex"),
      sha512: createHash("sha512").update(bytes).digest("hex"),
    });
    expect(await sha256Hex("x")).toBe(createHash("sha256").update("x").digest("hex"));
  });

  it("round-trips base64 and base64url", () => {
    const bytes = new Uint8Array([251, 255, 0, 1, 2]);
    expect(fromBase64(toBase64(bytes))).toEqual(bytes);
    expect(toBase64Url(bytes)).toBe("-_8AAQI");
    expect(fromBase64("-_8AAQI")).toEqual(bytes);
  });
});
