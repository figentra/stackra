/**
 * Stackra file contract:
 * Purpose: unit tests of `settingSystemAuthor`: a snake_case job name becomes `sys_<name>`; any other name is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0419 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { settingSystemAuthor } from "#core/functions/setting-system-author.function";

describe(settingSystemAuthor, () => {
  it("answers the system principal id of a job", () => {
    expect(settingSystemAuthor("seed")).toBe("sys_seed");
    expect(settingSystemAuthor("market_pack_seed")).toBe("sys_market_pack_seed");
  });

  it("refuses a name that is not lower snake_case", () => {
    for (const name of ["", "Seed", "seed-job", "1seed", "sys seed"])
      expect(() => settingSystemAuthor(name)).toThrow(RangeError);
  });
});
