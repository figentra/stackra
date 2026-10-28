/**
 * Stackra file contract:
 * Purpose: data tests of `SCALE_PROTOCOLS`: exactly the two shipped protocols, each a valid pack entry of the shipped
 *          schema with makers and CR LF lines, MT-SICS with its `SI`, `SIR`, `@` and `TA` commands and the A&D stream
 *          with none, and the pack frozen.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0478 (decisions 5 and 8); ADR 0253 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { NATIVE_SCALE_CONFIG_SCHEMA } from "#core/constants/native-scale-config-schema.constant";
import { SCALE_PROTOCOLS } from "#core/constants/scale-protocols.constant";

describe("SCALE_PROTOCOLS", () => {
  it("ships exactly mt_sics and continuous_ascii, valid and frozen", () => {
    expect(Object.keys(SCALE_PROTOCOLS).sort()).toEqual(["continuous_ascii", "mt_sics"]);
    expect(NATIVE_SCALE_CONFIG_SCHEMA.shape.protocols.unwrap().parse(SCALE_PROTOCOLS)).toEqual(
      SCALE_PROTOCOLS,
    );
    expect(Object.isFrozen(SCALE_PROTOCOLS)).toBe(true);
    expect(Object.isFrozen(SCALE_PROTOCOLS.mt_sics)).toBe(true);
    for (const protocol of Object.values(SCALE_PROTOCOLS)) {
      expect(protocol.makers.length).toBeGreaterThan(0);
      expect(protocol.terminator).toBe("\r\n");
    }
  });

  it("sets each protocol's commands", () => {
    expect(SCALE_PROTOCOLS.mt_sics).toMatchObject({
      request: "SI",
      streamStart: "SIR",
      streamStop: "@",
      tareQuery: "TA",
    });
    expect(SCALE_PROTOCOLS.continuous_ascii).toMatchObject({
      request: "",
      streamStart: "",
      streamStop: "",
      tareQuery: "",
    });
  });
});
