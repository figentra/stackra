/**
 * Stackra file contract:
 * Purpose: unit and type tests of `PreferenceStore`: a port (abstract, `Port`-branded) whose `allows` and `set` name
 *          the recipient, the category and the channel, implemented by a driver with `Driver(PreferenceStore)`.
 * Boundary: test only; the driver is a minimal stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 16 and 17); ADR 0305 (rule 8); stackra-218.
 */
import { Driver } from "@stackra/container";
import { Port, type PublicId } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { NotificationChannel } from "#contracts/enums/notification-channel.enum";
import { PreferenceStore } from "#contracts/ports/preference-store.port";

const USER: PublicId<"usr"> = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3";

class AllowAllPreferenceStoreDriver extends Driver(PreferenceStore) {
  async allows(): Promise<boolean> {
    return true;
  }

  async set(): Promise<boolean> {
    return true;
  }
}

describe("PreferenceStore", () => {
  it("is a port a driver implements", async () => {
    const store: PreferenceStore = new AllowAllPreferenceStoreDriver();
    expect(store).toBeInstanceOf(PreferenceStore);
    expect(store).toBeInstanceOf(Port);
    await expect(store.allows(USER, "marketing", NotificationChannel.Mail)).resolves.toBe(true);
  });

  it("types its methods", () => {
    expectTypeOf<PreferenceStore["allows"]>().parameters.toEqualTypeOf<
      [PublicId<"usr">, string, NotificationChannel]
    >();
    expectTypeOf<PreferenceStore["set"]>().parameters.toEqualTypeOf<
      [PublicId<"usr">, string, NotificationChannel, boolean]
    >();
    expectTypeOf<PreferenceStore["set"]>().returns.toEqualTypeOf<Promise<boolean>>();
  });
});
