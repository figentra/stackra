/**
 * Stackra file contract:
 * Purpose: unit tests of the `RunwayProvider` port: a `Port` a driver extends, naming its destination and answering
 *          the four operations and the current read.
 * Boundary: test only; the driver is a fake.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0352 (decision 3).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { RunwayProvider } from "#core/ports/runway-provider.port";
import { FakeProvider } from "#core/functions/__tests__/fixtures/fake-provider.fixture";
import { deployTargets } from "#core/functions/deploy-targets.function";
import { DEPLOY_ROOT } from "#core/functions/__tests__/fixtures/deploy-root.fixture";

describe("RunwayProvider", () => {
  it("is a port a driver extends", async () => {
    const provider = new FakeProvider("encore-cloud");
    const [target] = deployTargets(DEPLOY_ROOT, "staging");
    expect(provider).toBeInstanceOf(RunwayProvider);
    expect(provider).toBeInstanceOf(Port);
    expect(provider.destination).toBe("encore-cloud");
    expect(target).toBeDefined();
    if (target === undefined) return;
    const record = await provider.apply(target, "a".repeat(40));
    expect(await provider.current(target)).toBe(record.sha);
    expect(provider.plan(target, record.sha)).toEqual([
      { command: "fake", args: [target.id, record.sha] },
    ]);
  });
});
