/**
 * Stackra file contract:
 * Purpose: unit tests of `codeChallengeOf`: the `S256` challenge of RFC 7636 appendix B's verifier.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; RFC 7636 (section 4.2, appendix B).
 */
import { describe, expect, it } from "@stackra/testing";

import { codeChallengeOf } from "#core/functions/code-challenge-of.function";

describe("codeChallengeOf", () => {
  it("matches the RFC's example", async () => {
    expect(await codeChallengeOf("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe(
      "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    );
  });
});
