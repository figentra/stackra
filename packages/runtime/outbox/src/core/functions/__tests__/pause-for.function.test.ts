/**
 * Stackra file contract:
 * Purpose: unit tests of `pauseFor`: it resolves at once for an aborted signal, when the signal aborts, and after the
 *          duration.
 * Boundary: test only; real timers with a one-millisecond pause.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269.
 */
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { pauseFor } from "#core/functions/pause-for.function";

describe(pauseFor, () => {
  it("resolves at once for an aborted signal and when the signal aborts", async () => {
    await expect(pauseFor(AbortSignal.abort(), Duration.minutes(1))).resolves.toBeUndefined();
    const controller = new AbortController();
    const pause = pauseFor(controller.signal, Duration.minutes(1));
    controller.abort();
    await expect(pause).resolves.toBeUndefined();
  });

  it("resolves after the duration", async () => {
    await expect(
      pauseFor(new AbortController().signal, Duration.seconds(0.001)),
    ).resolves.toBeUndefined();
  });
});
