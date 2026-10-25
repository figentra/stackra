/**
 * Stackra file contract:
 * Purpose: unit tests of `settingsPackToYaml`: keys are written sorted and the text reads back as the same pack.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0213 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";
import { parse } from "yaml";

import { settingsPackToYaml } from "#core/functions/settings-pack-to-yaml.function";

describe("settingsPackToYaml", () => {
  it("writes sorted keys that read back as the pack", () => {
    const pack = {
      groups: {
        orders: {
          values: { b: true, a: 30, "returns.mode": "store_credit", c: null },
          locked: ["a"],
        },
      },
    };
    const text = settingsPackToYaml(pack);
    expect(text.indexOf("a: 30")).toBeLessThan(text.indexOf("b: true"));
    expect(parse(text)).toEqual(pack);
  });
});
