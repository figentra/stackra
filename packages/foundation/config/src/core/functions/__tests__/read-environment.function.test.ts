/**
 * Stackra file contract:
 * Purpose: unit tests of `readEnvironment`, the one reader of the running environment (STA-2844): the closed list
 *          refuses a typo; with no platform unset is `dev`; a developer machine and a local test run keep the declared
 *          value; a deployed platform derives its environment, refuses `dev`, `test` and a contradiction; and a
 *          self-hosted image without metadata (empty name, cloud `local`) is not treated as `dev`.
 * Boundary: test only; pure inputs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0296 (amendment
 *                     2026-11-26); STA-2844.
 */
import { describe, expect, it } from "@stackra/testing";

import { ConfigInvalidError } from "#core/errors/config-invalid.error";
import { readEnvironment } from "#core/functions/read-environment.function";
import type { PlatformEnvironment } from "#core/types/platform-environment.type";

/** What `encore run` reports. */
const MACHINE: PlatformEnvironment = { name: "local", type: "development", cloud: "local" };

/** What `encore test` reports. */
const TEST_RUN: PlatformEnvironment = { name: "test", type: "test", cloud: "local" };

/** What a self-hosted image without infra metadata reports. */
const BARE_IMAGE: PlatformEnvironment = { name: "", type: "development", cloud: "local" };

/** The issue messages of a refusal, or a failure when nothing was thrown. */
function refusal(run: () => unknown): string[] {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(ConfigInvalidError);
    const invalid = error as ConfigInvalidError;
    expect(invalid.config).toBe("env");
    return invalid.issues.map((issue) => `${issue.path}: ${issue.message}`);
  }
  throw new Error("expected a ConfigInvalidError");
}

describe("readEnvironment", () => {
  it("reads the declared environment from the closed list", () => {
    for (const name of ["dev", "test", "preview", "staging", "production"])
      expect(readEnvironment({ STACKRA_ENVIRONMENT: name })).toBe(name);
    expect(readEnvironment({ STACKRA_ENVIRONMENT: " staging " })).toBe("staging");
  });

  it("refuses a name outside the list, never reading it as an environment, and never prints it", () => {
    for (const typo of ["prod", "Production", "development", "local"]) {
      const [issue] = refusal(() => readEnvironment({ STACKRA_ENVIRONMENT: typo }));
      expect(issue).toMatch(/^STACKRA_ENVIRONMENT: is not a Stackra environment/);
      expect(issue).not.toContain(`${typo},`);
    }
    refusal(() => readEnvironment({ STACKRA_ENVIRONMENT: 1 }));
  });

  it("reads unset as dev only when no platform reports on the process", () => {
    expect(readEnvironment({})).toBe("dev");
    expect(readEnvironment({ STACKRA_ENVIRONMENT: "" })).toBe("dev");
  });

  it("keeps a developer machine and a local test run as declared, unset as dev and test", () => {
    expect(readEnvironment({}, MACHINE)).toBe("dev");
    expect(readEnvironment({}, TEST_RUN)).toBe("test");
    expect(readEnvironment({ STACKRA_ENVIRONMENT: "staging" }, MACHINE)).toBe("staging");
    expect(readEnvironment({ STACKRA_ENVIRONMENT: "dev" }, TEST_RUN)).toBe("dev");
  });

  it("derives a deployed platform's environment when the variable is unset", () => {
    expect(readEnvironment({}, { name: "acme-prod", type: "production", cloud: "aws" })).toBe(
      "production",
    );
    expect(readEnvironment({}, { name: "pr-42", type: "ephemeral", cloud: "encore" })).toBe(
      "preview",
    );
    expect(readEnvironment({}, { name: "staging", type: "development", cloud: "gcp" })).toBe(
      "staging",
    );
    expect(readEnvironment({}, { name: "production", type: "development", cloud: "aws" })).toBe(
      "production",
    );
    // A deployment by any other name is held to every deployed check, never dev.
    expect(readEnvironment({}, { name: "qa", type: "development", cloud: "encore" })).toBe(
      "staging",
    );
    // A self-hosted image whose metadata says production, even with cloud local.
    expect(readEnvironment({}, { name: "", type: "production", cloud: "local" })).toBe(
      "production",
    );
  });

  it("refuses dev or test on a deployed platform", () => {
    for (const name of ["dev", "test"]) {
      const [issue] = refusal(() =>
        readEnvironment(
          { STACKRA_ENVIRONMENT: name },
          { name: "acme-prod", type: "production", cloud: "aws" },
        ),
      );
      expect(issue).toContain("a deployment never runs as dev or test");
      refusal(() =>
        readEnvironment(
          { STACKRA_ENVIRONMENT: name },
          { name: "qa", type: "development", cloud: "gcp" },
        ),
      );
    }
  });

  it("refuses a declared environment the platform's type or name contradicts, and keeps one it does not fix", () => {
    const [issue] = refusal(() =>
      readEnvironment(
        { STACKRA_ENVIRONMENT: "staging" },
        { name: "acme-prod", type: "production", cloud: "aws" },
      ),
    );
    expect(issue).toContain("runs as production");
    refusal(() =>
      readEnvironment(
        { STACKRA_ENVIRONMENT: "production" },
        { name: "pr-7", type: "ephemeral", cloud: "encore" },
      ),
    );
    refusal(() =>
      readEnvironment(
        { STACKRA_ENVIRONMENT: "preview" },
        { name: "staging", type: "development", cloud: "aws" },
      ),
    );
    expect(
      readEnvironment(
        { STACKRA_ENVIRONMENT: "production" },
        { name: "acme-prod", type: "production", cloud: "aws" },
      ),
    ).toBe("production");
    expect(
      readEnvironment(
        { STACKRA_ENVIRONMENT: "preview" },
        { name: "qa", type: "development", cloud: "encore" },
      ),
    ).toBe("preview");
  });

  it("never treats a self-hosted image without metadata as dev: unset fails closed", () => {
    const [issue] = refusal(() => readEnvironment({}, BARE_IMAGE));
    expect(issue).toMatch(/^STACKRA_ENVIRONMENT: is not set/);
    expect(issue).toContain("no developer machine");
    // A name the platform does not know is not a developer machine either.
    refusal(() => readEnvironment({}, { name: "box", type: "development", cloud: "local" }));
    expect(readEnvironment({ STACKRA_ENVIRONMENT: "production" }, BARE_IMAGE)).toBe("production");
  });
});
