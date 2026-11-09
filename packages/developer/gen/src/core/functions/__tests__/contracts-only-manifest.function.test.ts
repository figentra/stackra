/**
 * Stackra file contract:
 * Purpose: `contractsOnlyManifest` keeps the integration events of `src/contracts/` and drops every other section and
 *          every event outside that entry.
 * Boundary: test only; pure input and output.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); STA-2567.
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { contractsOnlyManifest } from "#core/functions/contracts-only-manifest.function";

const manifest: StackraManifest = {
  member: "workflow",
  package: "@stackra/workflow",
  version: "1.0.0",
  events: [
    {
      name: "workflow.service.acked.v1",
      module: "workflow",
      class: "ServiceAcked",
      file: "src/contracts/events/service-acked.event.ts",
      kind: "integration",
    },
    {
      name: "workflow.run_started.v1",
      module: "workflow",
      class: "RunStarted",
      file: "src/core/events/run-started.event.ts",
      kind: "integration",
    },
  ],
  models: [{ key: "workflow.run", table: "runs", publicId: "run", traits: [] }],
  permissions: [{ key: "workflow.run.read", risk: "L0" }],
};

describe("contractsOnlyManifest", () => {
  it("keeps only the contracts events", () => {
    const reduced = contractsOnlyManifest(manifest);
    expect(reduced.events?.map((event) => event.name)).toEqual(["workflow.service.acked.v1"]);
    expect(reduced.models).toBeUndefined();
    expect(reduced.permissions).toBeUndefined();
  });

  it("writes no events section when the package has none in contracts", () => {
    expect(contractsOnlyManifest({ ...manifest, events: [] }).events).toBeUndefined();
  });
});
