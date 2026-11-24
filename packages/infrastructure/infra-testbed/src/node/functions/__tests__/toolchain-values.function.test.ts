/**
 * Stackra file contract:
 * Purpose: unit tests of `toolchainValues`: the placeholder values of the image components are the plan's pins, one
 *          placeholder per tool (the default plan's pins give the eight the components use); extra pins are ignored; a
 *          pin the plan lacks, or holds empty, throws naming the pin, whichever one it is.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0484 (decision 2); ADR 0171 (the program only declares).
 */
import { describe, expect, it } from "@stackra/testing";

import { TOOLCHAIN_PINS } from "#core/constants/toolchain-pins.constant";
import { toolchainValues } from "#node/functions/toolchain-values.function";

describe("toolchainValues", () => {
  it("answers each component placeholder with the plan's pin for its tool", () => {
    expect(toolchainValues(TOOLCHAIN_PINS)).toEqual({
      MISE: TOOLCHAIN_PINS.mise,
      NODE: TOOLCHAIN_PINS.node,
      PNPM: TOOLCHAIN_PINS.pnpm,
      INFISICAL: TOOLCHAIN_PINS.infisical,
      SHFMT: TOOLCHAIN_PINS.shfmt,
      ENCORE: TOOLCHAIN_PINS.encore,
      PLAYWRIGHT: TOOLCHAIN_PINS.playwright,
      POSTGRES: TOOLCHAIN_PINS.postgresImage,
    });
  });

  it("ignores a pin no component uses", () => {
    expect(toolchainValues({ ...TOOLCHAIN_PINS, extra: "1.0.0" })).not.toHaveProperty("EXTRA");
  });

  it.each(Object.keys(TOOLCHAIN_PINS))("throws, naming it, when the %s pin is missing", (pin) => {
    const { [pin]: _missing, ...pins }: Record<string, string> = { ...TOOLCHAIN_PINS };
    expect(() => toolchainValues(pins)).toThrow(`no toolchain pin "${pin}"`);
  });

  it("throws when a pin is empty, as an empty version would build a broken image", () => {
    expect(() => toolchainValues({ ...TOOLCHAIN_PINS, node: "" })).toThrow(
      'no toolchain pin "node"',
    );
  });
});
