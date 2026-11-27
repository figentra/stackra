/**
 * Stackra file contract:
 * Purpose: unit tests of `driverName`: the file stem without the port's kebab name (a member-named port's without the
 *          member's name too), or the whole stem.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 26).
 */
import { describe, expect, it } from "@stackra/testing";

import { driverName } from "#core/functions/driver-name.function";

describe("driverName", () => {
  it("strips the port name from the stem", () => {
    expect(driverName("src/node/drivers/postgres-loyalty-ledger.driver.ts", "LoyaltyLedger")).toBe(
      "postgres",
    );
    expect(driverName("memory-loyalty-ledger.driver.ts", "LoyaltyLedger")).toBe("memory");
  });

  it("strips a `<X>Driver` port's name without its `Driver`", () => {
    expect(driverName("src/node/drivers/postgres-queue.driver.ts", "QueueDriver")).toBe("postgres");
    expect(driverName("memory-schedule.driver.ts", "ScheduleDriver")).toBe("memory");
    expect(driverName("memory.driver.ts", "Driver")).toBe("memory");
  });

  it("snake-cases a name of two words, as the configs spell it", () => {
    expect(driverName("printer-kick-cash-drawer.driver.ts", "CashDrawer")).toBe("printer_kick");
    expect(driverName("broadcast-channel-realtime.driver.ts", "RealtimeDriver")).toBe(
      "broadcast_channel",
    );
  });

  it("strips a port named after its member without the member's name (STA-1605)", () => {
    expect(
      driverName(
        "src/native/drivers/expo-push-transport.driver.ts",
        "PlatformPushTransport",
        "platform",
      ),
    ).toBe("expo");
    expect(
      driverName("self-hosted-push-transport.driver.ts", "PlatformPushTransport", "platform"),
    ).toBe("self_hosted");
    // The whole port name still wins, and another member's prefix is no prefix.
    expect(
      driverName("web-platform-push-transport.driver.ts", "PlatformPushTransport", "platform"),
    ).toBe("web");
    expect(driverName("expo-push-transport.driver.ts", "PlatformPushTransport", "queue")).toBe(
      "expo_push_transport",
    );
    expect(driverName("call-isolation.driver.ts", "CallIsolation", "tenancy")).toBe(
      "call_isolation",
    );
  });

  it("keeps a stem that does not end in the port name", () => {
    expect(driverName("src/core/drivers/resend.driver.ts", "MailTransport")).toBe("resend");
    expect(driverName("loyalty-ledger.driver.ts", "LoyaltyLedger")).toBe("loyalty_ledger");
  });
});
