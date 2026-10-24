/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Notifier`: a port (abstract, `Port`-branded) whose drivers implement `notify` for a
 *          notification instance and an event, and whose `DriverName` is this package's driver names.
 * Boundary: test only; the recording driver stands in for a sending one.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 4, 16 and 17); ADR 0266.
 */
import { Driver, type DriverName } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { Notification } from "#core/bases/notification.base";
import { Notifier } from "#core/ports/notifier.port";
import type { NotifierDriverName } from "#core/types/notifier-driver-name.type";

class RecordingNotifierDriver extends Driver(Notifier) {
  readonly calls: [Notification, object][] = [];

  notify(notification: Notification, event: object): Promise<void> {
    this.calls.push([notification, event]);
    return Promise.resolve();
  }
}

describe("Notifier", () => {
  it("is a port a driver implements", async () => {
    const driver = new RecordingNotifierDriver();
    expect(driver).toBeInstanceOf(Notifier);
    expect(driver).toBeInstanceOf(Port);
    const event = { orderId: "ord_1" };
    await driver.notify({} as Notification, event);
    expect(driver.calls[0]?.[1]).toBe(event);
  });

  it("types notify and its driver names", () => {
    expectTypeOf<Notifier["notify"]>().parameters.toEqualTypeOf<[Notification, object]>();
    expectTypeOf<NotifierDriverName>().toEqualTypeOf<"memory">();
    expectTypeOf<"memory">().toExtend<DriverName<Notifier>>();
  });
});
