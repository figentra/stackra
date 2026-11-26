/**
 * Stackra file contract:
 * Purpose: unit tests of `runtimePlan` over a `gotenberg` resource: it plans one internal engine workload (the image
 *          under the pull-through prefix, port 3000, the locked-down arguments, the basic-auth user as env and the
 *          password as a secret, its own 443-only group), half a vCPU and 1 GiB at small, one task on FARGATE_SPOT in
 *          staging and one to two on FARGATE in production, priced $18 a task in the estimate; it is not planned as a
 *          queue.
 * Boundary: test only; parsed runway objects in, plain data out.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0493 (as amended: the gotenberg resource).
 */
import { parseRunway } from "@stackra/runway";
import { describe, expect, it } from "@stackra/testing";

import { GOTENBERG_SETTINGS } from "#core/constants/gotenberg-settings.constant";
import { runtimePlan } from "#core/functions/runtime-plan.function";

/** A runway whose one resource is the PDF engine `pdf`. */
const ROOT = parseRunway("root", {
  version: 3,
  project: "tamo",
  environments: { staging: {}, production: {} },
  resources: { pdf: { kind: "gotenberg" } },
});

/** The member that renders through it. */
const REPORTS = parseRunway("service", { version: 3, uses: ["pdf"], environments: {} });

describe("runtimePlan for a gotenberg resource", () => {
  it("plans one internal engine with the pinned image, its arguments and its credentials' names", () => {
    const plan = runtimePlan(ROOT, { reports: REPORTS }, "staging");

    expect(plan.queues).toEqual([]);
    expect(plan.workloads).toEqual([
      expect.objectContaining({
        key: "resources.pdf",
        workload: "pdf",
        name: "tamo-staging-pdf",
        image: GOTENBERG_SETTINGS.image,
        port: 3000,
        command: [...GOTENBERG_SETTINGS.command],
        public: false,
        env: { GOTENBERG_API_BASIC_AUTH_USERNAME: "stackra" },
        secrets: ["GOTENBERG_API_BASIC_AUTH_PASSWORD"],
        cpu: 512,
        memoryMb: 1024,
        scale: { min: 1, max: 1 },
        gotenberg: { resource: "pdf" },
        registryImage: true,
        httpsEgressOnly: true,
        spot: true,
      }),
    ]);
    expect(plan.workloads[0]?.image).toMatch(
      /^docker-hub\/gotenberg\/gotenberg@sha256:[0-9a-f]{64}$/,
    );
    expect(plan.workloads[0]?.command).toContain("--chromium-allow-list=^file:///tmp/.*");
    expect(plan.cost.items).toContainEqual({ key: "resources.pdf", monthlyUsd: 18 });
  });

  it("runs one to two tasks on FARGATE in production", () => {
    const [engine] = runtimePlan(ROOT, { reports: REPORTS }, "production").workloads;

    expect(engine?.scale).toEqual({ min: 1, max: 2 });
    expect(engine).not.toHaveProperty("spot");
  });
});
