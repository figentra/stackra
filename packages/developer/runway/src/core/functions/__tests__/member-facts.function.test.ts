/**
 * Stackra file contract:
 * Purpose: unit tests of `memberFacts`: a member's entry together with the facts it came from; a member the facts do
 *          not hold (including an inherited key such as `constructor`) fails naming it and the environment.
 * Boundary: test only; the facts are injected through `__STACKRA_RUNWAY__`, as a bundle would carry them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decision 1).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { memberFacts } from "#core/functions/member-facts.function";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("memberFacts", () => {
  it("returns the member's entry and the facts it came from", () => {
    vi.stubGlobal("__STACKRA_RUNWAY__", {
      version: 1,
      environment: "staging",
      members: { console: { url: "http://localhost:5173", port: 5173, host: "localhost" } },
    });

    const { facts, member } = memberFacts("console");

    expect(facts.environment).toBe("staging");
    expect(member.port).toBe(5173);
    expect(member).toBe(facts.members["console"]);
  });

  it("fails for a member the facts do not hold, naming the environment", () => {
    vi.stubGlobal("__STACKRA_RUNWAY__", { version: 1, members: { console: {} } });

    expect(() => memberFacts("web")).toThrow(RunwayUnresolvedError);
    expect(() => memberFacts("web")).toThrow(/\(dev\) hold no member "web"/);
    expect(() => memberFacts("constructor")).toThrow(/no member "constructor"/);
  });
});
