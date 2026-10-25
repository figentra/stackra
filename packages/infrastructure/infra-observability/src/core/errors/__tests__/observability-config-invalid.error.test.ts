/**
 * Stackra file contract:
 * Purpose: unit tests of `ObservabilityConfigInvalidError`: it names the source and every issue in its message, keeps
 *          the issues frozen, and is an `Error` with its own name.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (enforcement).
 */
import { describe, expect, it } from "@stackra/testing";

import { ObservabilityConfigInvalidError } from "#core/errors/observability-config-invalid.error";

describe("ObservabilityConfigInvalidError", () => {
  it("names the source and every issue", () => {
    const error = new ObservabilityConfigInvalidError("the telemetry runways", [
      { path: "root.observability.logs.hotDays", message: "Too small" },
      { path: "", message: "Whole document" },
    ]);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ObservabilityConfigInvalidError");
    expect(error.source).toBe("the telemetry runways");
    expect(error.message).toBe(
      "the telemetry runways is invalid: root.observability.logs.hotDays: Too small; (document): Whole document",
    );
    expect(Object.isFrozen(error.issues)).toBe(true);
    expect(error.issues).toHaveLength(2);
  });
});
