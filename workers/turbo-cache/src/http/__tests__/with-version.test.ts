/**
 * Stackra file contract:
 * Purpose: unit tests of `withVersion`: the version header names the binding's id, replaces one already set, keeps the
 *          status, body and other headers, and is left out without an id.
 * Boundary: test only; plain Responses.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0536.
 */
import { withVersion } from "#src/http";

const VERSION = "dc8dcd28-271b-4367-9840-6c244f84cb40";

describe("withVersion", () => {
  it("names the version that answered, keeping the rest of the response", async () => {
    const response = withVersion(
      new Response("page", {
        status: 404,
        headers: { "x-stackra-version": "spoofed", "x-a": "1" },
      }),
      VERSION,
    );
    expect(response.status).toBe(404);
    expect(response.headers.get("x-stackra-version")).toBe(VERSION);
    expect(response.headers.get("x-a")).toBe("1");
    expect(await response.text()).toBe("page");
  });

  it("leaves the response alone without a version id", () => {
    const original = new Response("page");
    expect(withVersion(original, undefined)).toBe(original);
  });
});
