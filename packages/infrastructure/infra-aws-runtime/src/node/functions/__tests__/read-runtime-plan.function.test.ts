/**
 * Stackra file contract:
 * Purpose: unit tests of `readRuntimePlan`: the root runway and each service folder's runway are read from a
 *          repository directory (a kebab-case folder becomes a snake_case member key, a folder without a runway is
 *          skipped), and a missing root runway fails as `RunwayInvalidError`.
 * Boundary: test only; writes a throwaway repository in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decisions 1 and 2).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { RunwayInvalidError } from "@stackra/runway";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { readRuntimePlan } from "#node/functions/read-runtime-plan.function";

let directory: string;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "stackra-infra-aws-runtime-"));
});

afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
});

/** Writes `lines` to `path` inside the throwaway repository. */
function write(path: string, ...lines: string[]): void {
  const file = join(directory, path);
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, `${lines.join("\n")}\n`);
}

describe("readRuntimePlan", () => {
  it("plans the root and every service runway of a repository", () => {
    write(
      "runway.yaml",
      "version: 3",
      "project: acme-platform",
      "environments:",
      "  staging:",
      "    shared:",
      "      queues:",
      "        provider: sns-sqs",
      "        dlq: true",
    );
    write(
      "services/loyalty-kit/runway.yaml",
      "version: 3",
      "environments:",
      "  staging:",
      "    queues:",
      "      points:",
      "        visibilityTimeoutSeconds: 60",
    );
    write("services/health/package.json", "{}");

    const plan = readRuntimePlan(directory, "staging");

    expect(plan.project).toBe("acme-platform");
    expect(plan.queues).toEqual([
      {
        key: "loyalty_kit.points",
        name: "acme-platform-staging-loyalty-kit-points",
        deadLetterName: "acme-platform-staging-loyalty-kit-points-dlq",
        visibilityTimeoutSeconds: 60,
        topic: true,
        tags: { env: "staging", service: "loyalty_kit" },
      },
    ]);
    expect(plan.caches).toEqual([]);
    expect(plan.buckets).toEqual([]);
  });

  it("fails when the repository has no root runway", () => {
    expect(() => readRuntimePlan(directory, "staging")).toThrow(RunwayInvalidError);
  });
});
