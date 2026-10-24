/**
 * Stackra file contract:
 * Purpose: unit tests of `FlagsFake`: a real `FlagReader` that starts at every flag's default, takes values set
 *          synchronously (the last set winning), notifies subscribers, and keeps its values through a `load` or a
 *          `watch` in the code under test.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0266 (decision 2).
 */
import { describe, expect, it, vi } from "@stackra/testing";

import { Flag, FlagReader, flagRefs } from "#core/index";
import { FlagsFake } from "#testing/flags.fake";

class HelpCentreFlag extends Flag({ default: false }) {}

class QuickOrderFlag extends Flag({ default: true }) {}

const Flags = flagRefs({ web: { help_centre: HelpCentreFlag, quick_order: QuickOrderFlag } });

const SUBJECTS = { visitor: null, user: "usr_1", tenant: "ten_1" };

describe("FlagsFake", () => {
  it("is a FlagReader at every flag's default", () => {
    const fake = new FlagsFake();
    expect(fake).toBeInstanceOf(FlagReader);
    expect(fake.get(Flags.web.help_centre)).toBe(false);
    expect(fake.get(Flags.web.quick_order)).toBe(true);
  });

  it("takes values set synchronously, the last set winning, and notifies", () => {
    const fake = new FlagsFake();
    const listener = vi.fn();
    fake.subscribe(listener);
    expect(fake.set(Flags.web.help_centre, true).set(Flags.web.quick_order, false)).toBe(fake);
    fake.set(Flags.web.help_centre, false).set(Flags.web.help_centre, true);
    expect(fake.get(Flags.web.help_centre)).toBe(true);
    expect(fake.get(Flags.web.quick_order)).toBe(false);
    expect(listener).toHaveBeenCalledTimes(4);
  });

  it("keeps its values through a load and a watch", async () => {
    const fake = new FlagsFake().set(Flags.web.help_centre, true);
    await fake.load(SUBJECTS);
    expect(fake.get(Flags.web.help_centre)).toBe(true);
    const stop = fake.watch(SUBJECTS);
    await Promise.resolve();
    stop();
    expect(fake.get(Flags.web.help_centre)).toBe(true);
  });
});
