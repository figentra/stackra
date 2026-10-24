/**
 * Stackra file contract:
 * Purpose: unit tests of `withHeader`: a copy with the header set and the body carried over, the caller's request
 *          untouched, and the same request back when the header is already there.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { withHeader } from "#core/functions/with-header.function";

describe("withHeader", () => {
  it("returns a copy with the header and the body, leaving the original untouched", async () => {
    const original = new Request("https://api.test/x", { method: "POST", body: "payload" });
    const copy = withHeader(original, "X-Test", "1");
    expect(copy).not.toBe(original);
    expect(copy.headers.get("X-Test")).toBe("1");
    expect(original.headers.has("X-Test")).toBe(false);
    expect(copy.method).toBe("POST");
    expect(await copy.text()).toBe("payload");
  });

  it("keeps a header already set", () => {
    const original = new Request("https://api.test/x", { headers: { "x-test": "mine" } });
    expect(withHeader(original, "X-Test", "theirs")).toBe(original);
  });
});
