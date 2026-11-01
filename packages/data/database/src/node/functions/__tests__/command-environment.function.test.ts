/**
 * Stackra file contract:
 * Purpose: proves a database command takes the process's STACKRA_ENVIRONMENT, refuses an --env that contradicts it
 *          and an unknown name, and falls back to dev only when nothing names one.
 * Boundary: unit test.
 * Runtime: node
 * Governing contract: STA-1731 spec FR-013 (security review B2); ADR 0022 (test placement).
 */
// @covers sta-1731:FR-013
import { UsageError } from "@stackra/console";

import { commandEnvironment } from "#node/functions/command-environment.function";

describe("commandEnvironment", () => {
  it("takes STACKRA_ENVIRONMENT when no --env is given", () => {
    expect(commandEnvironment("", { STACKRA_ENVIRONMENT: "production" })).toBe("production");
  });

  it("refuses an --env that contradicts STACKRA_ENVIRONMENT", () => {
    expect(() => commandEnvironment("dev", { STACKRA_ENVIRONMENT: "production" })).toThrow(
      UsageError,
    );
  });

  it("takes --env when the process names none", () => {
    expect(commandEnvironment("preview", {})).toBe("preview");
  });

  it("falls back to dev only when nothing names an environment", () => {
    expect(commandEnvironment("", {})).toBe("dev");
  });

  it("refuses an unknown environment", () => {
    expect(() => commandEnvironment("prod", {})).toThrow(/unknown environment/);
  });
});
