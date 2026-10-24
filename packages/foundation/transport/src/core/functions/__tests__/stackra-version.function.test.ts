/**
 * Stackra file contract:
 * Purpose: unit tests of `stackraVersion`: sends `Stackra-Version`, keeps a header already set, and refuses a value
 *          that is not a real calendar date when the middleware is built.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0118.
 */
import { describe, expect, it } from "@stackra/testing";

import { createTransport } from "#core/functions/create-transport.function";
import { stackraVersion } from "#core/functions/stackra-version.function";

/** Sends one GET through `stackraVersion(version)` and returns the header that reached fetch. */
async function sentVersion(version: string, init?: RequestInit): Promise<string | null> {
  let seen: string | null = null;
  const send = createTransport({
    middleware: [stackraVersion(version)],
    fetch: async (request) => {
      seen = request.headers.get("Stackra-Version");
      return new Response(null, { status: 204 });
    },
  });
  await send(new Request("https://api.test/orders", init));
  return seen;
}

describe("stackraVersion", () => {
  it("sends the pinned version", async () => {
    expect(await sentVersion("2027-03-01")).toBe("2027-03-01");
  });

  it("keeps a version already on the request", async () => {
    expect(await sentVersion("2027-03-01", { headers: { "Stackra-Version": "2026-10-01" } })).toBe(
      "2026-10-01",
    );
  });

  it.each(["2027-02-30", "2027-3-1", "latest", "", "2027-13-01"])("refuses %j", (version) => {
    expect(() => stackraVersion(version)).toThrow(RangeError);
  });
});
