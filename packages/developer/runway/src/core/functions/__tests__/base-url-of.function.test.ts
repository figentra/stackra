/**
 * Stackra file contract:
 * Purpose: unit tests of `baseUrlOf`: a member's dev origin from the dev facts (lane offsets already applied by
 *          `stackra dev`), as the generated Playwright configs use it; a member absent from the facts, or present
 *          without a dev origin, fails naming it.
 * Boundary: test only; the facts are injected through `__STACKRA_RUNWAY__`, as a bundle would carry them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decision 1); ADR 0269 (e2e).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { baseUrlOf } from "#core/functions/base-url-of.function";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("baseUrlOf", () => {
  it("returns the member's dev origin", () => {
    vi.stubGlobal("__STACKRA_RUNWAY__", {
      version: 1,
      members: {
        web: { url: "http://localhost:5175", port: 5175, host: "localhost" },
        console: { url: "http://localhost:5273", port: 5273, host: "localhost" },
      },
    });

    expect(baseUrlOf("web")).toBe("http://localhost:5175");
    expect(baseUrlOf("console")).toBe("http://localhost:5273");
  });

  it("fails for a member the facts do not hold, or one without a dev origin", () => {
    vi.stubGlobal("__STACKRA_RUNWAY__", { version: 1, members: { console: {} } });

    expect(() => baseUrlOf("web")).toThrow(RunwayUnresolvedError);
    expect(() => baseUrlOf("web")).toThrow(/no member "web"/);
    expect(() => baseUrlOf("console")).toThrow(/"console" has no dev origin/);
    expect(() => baseUrlOf("constructor")).toThrow(/no member "constructor"/);
  });
});
