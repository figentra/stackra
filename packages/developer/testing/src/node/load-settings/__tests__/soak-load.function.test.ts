/**
 * Stackra file contract:
 * Purpose: unit tests of `soakLoad`: the test's own rate and duration, each overridden by `STACKRA_LOAD_RATE` and
 *          `STACKRA_LOAD_DURATION`, virtual users sized from the rate, and a malformed override refused.
 * Boundary: test only; pure (the environment is passed in).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182 (decision 4); STA-317.
 */
import { describe, expect, it } from "@stackra/testing";

import { soakLoad } from "#node/load-settings/soak-load.function";

describe("soakLoad", () => {
  it("keeps the test's figures when nothing overrides them", () => {
    expect(soakLoad({ rate: 200, duration: "30s" }, {})).toEqual({
      executor: "constant-arrival-rate",
      rate: 200,
      duration: "30s",
      preAllocatedVUs: 50,
      maxVUs: 200,
    });
    expect(soakLoad({ rate: 8, duration: "5s" }, {}).preAllocatedVUs).toBe(10);
  });

  it("takes the rate and the duration from the environment", () => {
    expect(
      soakLoad(
        { rate: 200, duration: "30s" },
        { STACKRA_LOAD_RATE: "400", STACKRA_LOAD_DURATION: "1h" },
      ),
    ).toMatchObject({ rate: 400, duration: "1h", preAllocatedVUs: 100, maxVUs: 400 });
  });

  it("refuses a malformed override", () => {
    expect(() => soakLoad({ rate: 1, duration: "1s" }, { STACKRA_LOAD_RATE: "fast" })).toThrow(
      RangeError,
    );
    expect(() => soakLoad({ rate: 1, duration: "1s" }, { STACKRA_LOAD_RATE: "0" })).toThrow(
      RangeError,
    );
    expect(() =>
      soakLoad({ rate: 1, duration: "1s" }, { STACKRA_LOAD_DURATION: "an hour" }),
    ).toThrow("not a k6 duration");
    expect(() => soakLoad({ rate: 1, duration: "1d" }, {})).toThrow(RangeError);
  });
});
