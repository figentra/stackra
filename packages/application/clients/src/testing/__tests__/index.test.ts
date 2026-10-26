/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./testing` entry: `fakeClient` and `fakeClientError`, which the template's
 *          tests import, the `ClientFake` they build, and the memory transport's plugin and `memoryTransport`
 *          (STA-1297) are exported, nothing else is, and the option types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#testing` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as testing from "#testing/index";
import type { FakeClientErrorOptions } from "#testing/index";

describe("@stackra/clients/testing", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(testing).sort()).toEqual([
      "CLIENTS_TESTING_PLUGIN",
      "ClientFake",
      "fakeClient",
      "fakeClientError",
      "memoryTransport",
    ]);
  });

  it("resolves the option types", () => {
    expectTypeOf<keyof FakeClientErrorOptions>().toEqualTypeOf<"refusal" | "message">();
  });
});
