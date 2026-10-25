/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./testing` entry: `AccessLogSinkFake`, `AccessLogEntryFactory` and
 *          `toHaveLoggedAccess` are its values, and importing it registers the matcher.
 * Boundary: test only; imports the stand-in barrel through its `#testing` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as testing from "#testing/index";

describe("@stackra/access-log/testing", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(testing).sort()).toEqual([
      "AccessLogEntryFactory",
      "AccessLogSinkFake",
      "toHaveLoggedAccess",
    ]);
  });

  it("registers the matcher on import", () => {
    const sink = testing.AccessLogSinkFake.with();
    expect(sink).not.toHaveLoggedAccess({ target: "Reads.view" });
  });
});
