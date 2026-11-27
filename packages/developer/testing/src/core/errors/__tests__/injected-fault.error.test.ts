/**
 * Stackra file contract:
 * Purpose: unit tests of `InjectedFaultError`: a plain `Error` (no refusal) naming the method, the call and the
 *          timing, with a message for each timing.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0182 (decision 4); ADR 0269 (decision 2); ADR 0022 (test placement).
 */
import { describe, expect, it } from "vitest";

import { InjectedFaultError } from "#core/errors/injected-fault.error";

describe(InjectedFaultError, () => {
  it("names the method, the call and the timing", () => {
    const error = new InjectedFaultError("remove", 2, "before");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("InjectedFaultError");
    expect(error).toMatchObject({ method: "remove", call: 2, timing: "before" });
    expect(error.message).toBe("injected fault: remove call 2 failed before it reached the target");
    expect(new InjectedFaultError("remove", 1, "after").message).toBe(
      "injected fault: remove call 1 acted, then its answer was lost",
    );
  });
});
