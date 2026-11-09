/**
 * Stackra file contract:
 * Purpose: unit tests of `providerFor`: the provider whose destination is the target's; a destination no provider
 *          serves fails naming the target and the destination.
 * Boundary: test only; the providers are fakes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0352 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { providerFor } from "#core/functions/provider-for.function";
import { FakeProvider } from "#core/functions/__tests__/fixtures/fake-provider.fixture";
import type { DeployTarget } from "#core/types/deploy-target.type";

/** A production mobile target shipped through `destination`. */
function targetTo(destination: string): DeployTarget {
  return {
    id: "production/mobile",
    environment: "production",
    kind: "mobile",
    destination,
    settings: {},
    scope: {},
  };
}

describe("providerFor", () => {
  it("returns the provider of the target's destination", () => {
    const encore = new FakeProvider("encore-cloud");
    const eas = new FakeProvider("eas");

    expect(providerFor(targetTo("eas"), [encore, eas])).toBe(eas);
  });

  it("fails when no provider serves the destination", () => {
    expect(() => providerFor(targetTo("eas"), [new FakeProvider("encore-cloud")])).toThrow(
      RunwayUnresolvedError,
    );
    expect(() => providerFor(targetTo("eas"), [])).toThrow(
      'production/mobile deploys to "eas", which no provider serves',
    );
  });
});
