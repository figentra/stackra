/**
 * Stackra file contract:
 * Purpose: unit tests of `runningEnvironment` (STA-1571): a set `STACKRA_ENVIRONMENT` wins except that a deployed
 *          runtime may not name `dev`, `test` or nothing; unset, a local runtime is `dev` (`test` in a test run) and a
 *          deployed one is its runway environment's name, else `production`, `preview` or `staging` by its type, never
 *          `dev` or `test`; with no runtime provided the variable passes as it is.
 * Boundary: test only; the raw environment is passed in, never the process's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0170 (decision 5); ADR 0212 (decisions 1 and 4).
 */
import { ConfigInvalidError } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { runningEnvironment } from "#server/functions/running-environment.function";

const LOCAL = { name: "local", type: "development", cloud: "local" };

describe("runningEnvironment", () => {
  it("passes the variable as it is when no runtime was provided (stackra dev, vitest)", () => {
    expect(runningEnvironment(undefined, {})).toBeUndefined();
    expect(runningEnvironment(undefined, { STACKRA_ENVIRONMENT: "staging" })).toBe("staging");
  });

  it("reads a local runtime as dev, or test in a test run, unless the variable names one", () => {
    expect(runningEnvironment(LOCAL, {})).toBe("dev");
    expect(runningEnvironment({ ...LOCAL, type: "test" }, {})).toBe("test");
    expect(runningEnvironment(LOCAL, { STACKRA_ENVIRONMENT: "staging" })).toBe("staging");
  });

  it.each([
    [{ name: "production", type: "development", cloud: "encore" }, "production"],
    [{ name: "staging", type: "production", cloud: "aws" }, "staging"],
    [{ name: "preview", type: "ephemeral", cloud: "gcp" }, "preview"],
    [{ name: "acme-prod", type: "production", cloud: "aws" }, "production"],
    [{ name: "pr-412", type: "ephemeral", cloud: "encore" }, "preview"],
    [{ name: "dev", type: "development", cloud: "encore" }, "staging"],
    [{ name: "local", type: "test", cloud: "gcp" }, "staging"],
  ])("never reads a deployed runtime %o as dev or test: %s", (runtime, expected) => {
    expect(runningEnvironment(runtime, {})).toBe(expected);
  });

  it("keeps a deployed name the variable sets", () => {
    const runtime = { name: "eu-1", type: "production", cloud: "aws" };
    expect(runningEnvironment(runtime, { STACKRA_ENVIRONMENT: "production" })).toBe("production");
    expect(runningEnvironment(runtime, { STACKRA_ENVIRONMENT: "staging" })).toBe("staging");
  });

  it.each(["dev", "test", ""])("refuses a deployed runtime that names %o", (named) => {
    const run = () =>
      runningEnvironment(
        { name: "production", type: "production", cloud: "encore" },
        {
          STACKRA_ENVIRONMENT: named,
        },
      );
    expect(run).toThrow(ConfigInvalidError);
    expect(run).toThrow(
      "STACKRA_ENVIRONMENT names dev, test or nothing in a deployed runtime (cloud encore)",
    );
  });
});
