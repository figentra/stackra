/**
 * Stackra file contract:
 * Purpose: proves `requestScaleLine` writes the command with its terminator, answers the first accepted line and skips
 *          the others, only listens for an empty command, and answers null on a timeout or a failed write, always
 *          unsubscribing.
 * Boundary: test only; drives the stand-in `StackraNativeScale` of `SCALE_SDK` with fake timers.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0478 (decision 5).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SCALE_SDK } from "#core/__tests__/scale-sdk.fixture";
import { isWeightOrFault } from "#core/functions/is-weight-or-fault.function";
import { parseMtSicsLine } from "#core/functions/parse-mt-sics-line.function";
import { requestScaleLine } from "#core/functions/request-scale-line.function";

const REQUEST = {
  terminator: "\r\n",
  parse: parseMtSicsLine,
  accept: isWeightOrFault,
  timeout: 50,
} as const;

describe("requestScaleLine", () => {
  afterEach(() => {
    SCALE_SDK.uninstall();
    vi.useRealTimers();
  });

  it("answers the first accepted line", async () => {
    const device = SCALE_SDK.install({
      isConnected: true,
      replies: { SI: [SCALE_SDK.mtSics.reset, SCALE_SDK.mtSics.tareKg, SCALE_SDK.mtSics.stableKg] },
    });
    const line = await requestScaleLine(device, { ...REQUEST, command: "SI" });
    expect(line).toMatchObject({ kind: "weight", grams: 1250 });
    expect(device.write.mock.calls).toEqual([["SI\r\n"]]);
    expect(device.remove).toHaveBeenCalledTimes(1);
  });

  it("only listens for an empty command", async () => {
    const device = SCALE_SDK.install({ isConnected: true });
    const pending = requestScaleLine(device, { ...REQUEST, command: "" });
    device.emit({ text: `${SCALE_SDK.mtSics.overload}\r\n` });
    expect(await pending).toEqual({ kind: "fault", fault: "overload" });
    expect(device.write).not.toHaveBeenCalled();
  });

  it("answers null on a timeout or a failed write", async () => {
    vi.useFakeTimers();
    const device = SCALE_SDK.install({ isConnected: true });
    const pending = requestScaleLine(device, { ...REQUEST, command: "SI" });
    await vi.advanceTimersByTimeAsync(60);
    expect(await pending).toBeNull();
    device.write.mockRejectedValueOnce(new Error("closed"));
    expect(await requestScaleLine(device, { ...REQUEST, command: "SI" })).toBeNull();
    expect(device.remove).toHaveBeenCalledTimes(2);
  });
});
