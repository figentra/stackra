/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: the three ports and `CommandStatus` are exported, nothing
 *          else is, and each port is a `Port` whose subclass is its driver.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { DeviceCommand, TelemetryReading } from "#contracts/index";

describe("@stackra/devices/contracts", () => {
  it("exports exactly its ports and enum", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "CommandStatus",
      "DeviceCommands",
      "DeviceCredential",
      "DeviceTelemetry",
    ]);
  });

  it("makes each port a Port", () => {
    expect(Object.getPrototypeOf(contracts.DeviceTelemetry)).toBe(Port);
    expect(Object.getPrototypeOf(contracts.DeviceCommands)).toBe(Port);
    expect(Object.getPrototypeOf(contracts.DeviceCredential)).toBe(Port);
  });

  it("lets a class implement a port", async () => {
    const reported: TelemetryReading[] = [];
    class RecordingTelemetry extends contracts.DeviceTelemetry {
      report(readings: readonly TelemetryReading[]): Promise<void> {
        reported.push(...readings);
        return Promise.resolve();
      }
    }
    const at = new Date("2026-10-24T09:00:00.000Z");
    await new RecordingTelemetry().report([{ metric: "temperature", value: 21.5, at }]);
    expect(reported).toEqual([{ metric: "temperature", value: 21.5, at }]);
  });

  it("types a command's payload as JSON and its expiry as nullable", () => {
    expectTypeOf<DeviceCommand["expiresAt"]>().toEqualTypeOf<Date | null>();
    expectTypeOf<TelemetryReading["value"]>().toEqualTypeOf<number | string | boolean>();
  });
});
