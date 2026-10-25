/**
 * Stackra file contract:
 * Purpose: type tests of `TrustedKeys`: a read-only map of key id to base64 public key.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. Pack
 *           data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370.
 */
import { describe, expectTypeOf, it } from "@stackra/testing";

import type { TrustedKeys } from "#core/types/trusted-keys.type";

describe("TrustedKeys", () => {
  it("maps key ids to base64 keys", () => {
    expectTypeOf<TrustedKeys>().toEqualTypeOf<Readonly<Record<string, string>>>();
  });
});
