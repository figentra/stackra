/**
 * Stackra file contract:
 * Purpose: unit tests of `previewSeedStep`: a fresh preview database is seeded with `stackra seed-pack` in the
 *          preview environment with its profile; a branch is not seeded; a malformed product key is refused.
 * Boundary: test only; nothing runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0190, ADR 0352 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { previewSeedStep } from "#core/functions/preview-seed-step.function";

describe("previewSeedStep", () => {
  it("seeds a fresh database with its profile in the preview environment", () => {
    expect(previewSeedStep({ from: "seed-pack", profile: "demo" }, "commerce")).toEqual({
      command: "stackra",
      args: ["seed-pack", "commerce", "--profile", "demo", "--env", "preview"],
    });
  });

  it("does not seed a branch, and refuses a malformed product", () => {
    const branch = {
      from: "branch",
      provider: "neon",
      project: "acme-db",
      parent: "main",
      name: "preview-x",
    } as const;
    expect(previewSeedStep(branch, "commerce")).toBeNull();
    expect(() => previewSeedStep({ from: "seed-pack", profile: "demo" }, "--all")).toThrow(
      TypeError,
    );
  });
});
