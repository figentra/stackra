/**
 * Stackra file contract:
 * Purpose: unit tests of `fakeFlags`: the template's call shape (`fakeFlags((fake) => fake.set(ref, true))`) returns
 *          the configured fake, and a call without a callback returns a fake at every default.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { Flag, flagRefs } from "#core/index";
import { FlagsFake } from "#testing/flags.fake";
import { fakeFlags } from "#testing/functions/fake-flags.function";

class HelpCentreFlag extends Flag({ default: false }) {}

const Flags = flagRefs({ web: { help_centre: HelpCentreFlag } });

describe("fakeFlags", () => {
  it("returns the fake the callback configured", () => {
    const flags = fakeFlags((fake) => fake.set(Flags.web.help_centre, true));
    expect(flags).toBeInstanceOf(FlagsFake);
    expect(flags.get(Flags.web.help_centre)).toBe(true);
  });

  it("returns a fake at every default without a callback", () => {
    expect(fakeFlags().get(Flags.web.help_centre)).toBe(false);
  });
});
