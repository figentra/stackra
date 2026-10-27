/**
 * Stackra file contract:
 * Purpose: unit tests of `loginDirectoryPrefix`: the key shape, an HMAC-SHA-256 known answer, normalisation (case and
 *          spaces of an email, the separators of a phone), kinds kept apart, key ids kept apart, no clear identifier in
 *          the key, `undefined` for what does not normalise and a refusal for a bad key.
 * Boundary: test only; Web Crypto of the runner.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0353 (decision 4); ADR 0451.
 */
import { describe, expect, it } from "@stackra/testing";

import { loginDirectoryPrefix } from "#contracts/functions/login-directory-prefix.function";

const key = { id: "k1", secret: "directory-secret" };

/** The HMAC-SHA-256 of `text` under the test secret, as hex, through Web Crypto's own path. */
async function hmacHex(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const hmac = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key.secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", hmac, encoder.encode(text));
  return Buffer.from(digest).toString("hex");
}

describe("loginDirectoryPrefix", () => {
  it("hashes the normalised email under the key", async () => {
    const prefix = await loginDirectoryPrefix({ kind: "email", value: "  Ana@Example.COM " }, key);
    expect(prefix).toBe(`dir:k1:email:${await hmacHex("email:ana@example.com")}:`);
    expect(prefix).toMatch(/^dir:k1:email:[0-9a-f]{64}:$/);
    expect(prefix).not.toContain("example");
  });

  it("strips a phone to E.164", async () => {
    expect(await loginDirectoryPrefix({ kind: "phone", value: "+971 (50) 123-4567" }, key)).toBe(
      await loginDirectoryPrefix({ kind: "phone", value: "+971501234567" }, key),
    );
  });

  it("puts the kind in the MAC and the key id in the prefix", async () => {
    expect(await loginDirectoryPrefix({ kind: "phone", value: "+971501234567" }, key)).toBe(
      `dir:k1:phone:${await hmacHex("phone:+971501234567")}:`,
    );
    expect(
      await loginDirectoryPrefix({ kind: "email", value: "a@b" }, { ...key, id: "k2" }),
    ).toMatch(/^dir:k2:email:[0-9a-f]{64}:$/);
  });

  it("gives undefined for what does not normalise", async () => {
    expect(
      await loginDirectoryPrefix({ kind: "email", value: "not-an-email" }, key),
    ).toBeUndefined();
    expect(await loginDirectoryPrefix({ kind: "phone", value: "0501234567" }, key)).toBeUndefined();
    expect(await loginDirectoryPrefix({ kind: "handle", value: "acme" }, key)).toBeUndefined();
    expect(await loginDirectoryPrefix({ kind: "toString", value: "a@b" }, key)).toBeUndefined();
  });

  it("refuses a bad key", async () => {
    await expect(
      loginDirectoryPrefix({ kind: "email", value: "a@b" }, { id: "k:1", secret: "s" }),
    ).rejects.toThrow(TypeError);
    await expect(
      loginDirectoryPrefix({ kind: "email", value: "a@b" }, { id: "k1", secret: "" }),
    ).rejects.toThrow(TypeError);
  });
});
