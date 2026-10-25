/**
 * Stackra file contract:
 * Purpose: unit tests of `readFormData`: a JSON body as it is, form fields nested by dotted name with list indexes, a
 *          repeated name collected, and the trust-boundary refusals (prototype segments, huge indexes, a name under a
 *          list).
 * Boundary: test only; builds real `Request`s.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 16).
 */
import { describe, expect, it } from "@stackra/testing";

import { readFormData } from "#core/functions/read-form-data.function";

/** A POST of `fields` as a form. */
function formRequest(fields: readonly (readonly [string, string])[]): Request {
  const body = new FormData();
  for (const [name, value] of fields) body.append(name, value);
  return new Request("http://localhost/contact", { method: "POST", body });
}

describe("readFormData", () => {
  it("reads a JSON body as it is", async () => {
    const request = new Request("http://localhost/x", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope: "tenant", values: { a: 1 } }),
    });
    expect(await readFormData(request)).toEqual({ scope: "tenant", values: { a: 1 } });
  });

  it("nests dotted names and collects a repeated name", async () => {
    const request = formRequest([
      ["lines.0.variantId", "var_1"],
      ["lines.0.quantity", "2"],
      ["redeemPoints", "0"],
      ["tags", "a"],
      ["tags", "b"],
    ]);
    expect(await readFormData(request)).toEqual({
      lines: [{ variantId: "var_1", quantity: "2" }],
      redeemPoints: "0",
      tags: ["a", "b"],
    });
  });

  it("drops prototype segments, huge indexes and a name under a list", async () => {
    const request = formRequest([
      ["__proto__.polluted", "yes"],
      ["constructor.prototype.x", "yes"],
      ["lines.1000000.quantity", "1"],
      ["items.0", "first"],
      ["items.name", "nope"],
    ]);
    const body = await readFormData(request);
    expect(body).toEqual({ items: ["first"] });
    expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
  });
});
