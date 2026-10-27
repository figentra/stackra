/**
 * Stackra file contract:
 * Purpose: unit tests of `tokensMatch`: equal tokens match; a different, shorter, longer or empty token does not.
 * Boundary: pure; Web Crypto only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0026 (decision 2).
 */
import { tokensMatch } from "#src/cache/tokens-match";

describe("tokensMatch", () => {
  it("matches the same token", async () => {
    expect(await tokensMatch("s3cret-token", "s3cret-token")).toBe(true);
  });

  it.each(["s3cret-tokeN", "s3cret", "s3cret-token-and-more", ""])("refuses %j", async (given) => {
    expect(await tokensMatch(given, "s3cret-token")).toBe(false);
  });
});
