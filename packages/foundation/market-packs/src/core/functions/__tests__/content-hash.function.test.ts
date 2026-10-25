/**
 * Stackra file contract:
 * Purpose: unit tests of `contentHash`: a SHA-256 hex digest that ignores key order and changes with any value.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. Pack
 *           data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370.
 */
import { describe, expect, it } from "@stackra/testing";

import { contentHash } from "#core/functions/content-hash.function";

describe("contentHash", () => {
  it("is the SHA-256 of the canonical JSON", async () => {
    // SHA-256 of the two bytes "{}".
    expect(await contentHash({})).toBe(
      "44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a",
    );
  });

  it("ignores key order and sees every value", async () => {
    expect(await contentHash({ a: 1, b: 2 })).toBe(await contentHash({ b: 2, a: 1 }));
    expect(await contentHash({ a: 1 })).not.toBe(await contentHash({ a: 2 }));
    expect(await contentHash({ a: 1 })).toMatch(/^[0-9a-f]{64}$/);
  });
});
