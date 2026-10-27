/**
 * Stackra file contract:
 * Purpose: unit tests of `unsubscribeLink` and `verifyUnsubscribeToken`: a link carries a token that verifies back to its recipient and
 *          category under the same key; another key, a changed payload or a malformed token verifies to undefined;
 *          an empty key and a non-https endpoint are refused.
 * Boundary: test only; Web Crypto of the test runtime.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; RFC 8058; stackra-218 (STA-1376).
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { base64url } from "#core/functions/base64url.function";
import { unsubscribeLink } from "#core/functions/unsubscribe-link.function";
import { verifyUnsubscribeToken } from "#core/functions/verify-unsubscribe-token.function";

const USER: PublicId<"usr"> = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3";
const KEY = "test-unsubscribe-key";
const ENDPOINT = "https://acme.example/unsubscribe";

/** The token of a link. */
const tokenOf = (link: string) => new URL(link).searchParams.get("token") ?? "";

describe("unsubscribe token", () => {
  it("links to the endpoint with a token that verifies back", async () => {
    const link = await unsubscribeLink({
      recipient: USER,
      category: "marketing",
      key: KEY,
      url: ENDPOINT,
    });
    expect(link.startsWith(`${ENDPOINT}?token=`)).toBe(true);
    await expect(verifyUnsubscribeToken(tokenOf(link), KEY)).resolves.toEqual({
      recipient: USER,
      category: "marketing",
    });
  });

  it("refuses another key, a changed payload and a malformed token", async () => {
    const token = tokenOf(
      await unsubscribeLink({ recipient: USER, category: "marketing", key: KEY, url: ENDPOINT }),
    );
    await expect(verifyUnsubscribeToken(token, "another-key")).resolves.toBeUndefined();
    const [, signature] = token.split(".");
    const forged = base64url(new TextEncoder().encode(JSON.stringify({ r: USER, c: "activity" })));
    await expect(verifyUnsubscribeToken(`${forged}.${signature}`, KEY)).resolves.toBeUndefined();
    await expect(verifyUnsubscribeToken("not-a-token", KEY)).resolves.toBeUndefined();
    await expect(verifyUnsubscribeToken("a.b.c", KEY)).resolves.toBeUndefined();
    await expect(verifyUnsubscribeToken("%%%.%%%", KEY)).resolves.toBeUndefined();
  });

  it("refuses an empty key and a plain http endpoint", async () => {
    await expect(
      unsubscribeLink({ recipient: USER, category: "marketing", key: "", url: ENDPOINT }),
    ).rejects.toThrow(TypeError);
    await expect(verifyUnsubscribeToken("a.b", "")).rejects.toThrow(TypeError);
    await expect(
      unsubscribeLink({
        recipient: USER,
        category: "marketing",
        key: KEY,
        url: "http://acme.example/u",
      }),
    ).rejects.toThrow(TypeError);
  });
});
