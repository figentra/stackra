/**
 * Stackra file contract:
 * Purpose: unit tests of `FlagReader`: defaults before any load, the provider's values after one, the subject the
 *          targeting names (with the tenant as the group), last values kept on a failed load, only the newest load
 *          applied, subscribers notified and removable, and `watch` refreshing on the interval until stopped.
 * Boundary: test only; the provider is a small class of the port, timers are faked for `watch`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0213 (decision 3).
 */
import { buildConfig } from "@stackra/config";
import type { ConfigValues } from "@stackra/config";
import { Service } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { FeatureFlagsConfig } from "#config/feature-flags.config";
import { FlagProvider } from "#contracts/ports/flag-provider.port";
import type { FlagContext } from "#contracts/types/flag-context.type";
import { Flag } from "#core/bases/flag.base";
import { flagRefs } from "#core/functions/flag-refs.function";
import { FlagReader } from "#core/services/flag-reader.service";

class HelpCentreFlag extends Flag({ default: false }) {}

class QuickOrderFlag extends Flag({ default: true }) {}

const Flags = flagRefs({ web: { help_centre: HelpCentreFlag, quick_order: QuickOrderFlag } });

const SUBJECTS = { visitor: "vis_1", user: "usr_1", scope: "ten_1" };

/** A provider whose answers a test queues; it records each context it is asked for. */
class QueuedProvider extends FlagProvider {
  readonly asked: FlagContext[] = [];

  readonly answers: (() => Promise<Readonly<Record<string, boolean>>>)[] = [];

  values(context: FlagContext): Promise<Readonly<Record<string, boolean>>> {
    this.asked.push(context);
    return this.answers.shift()?.() ?? Promise.resolve({});
  }
}

/** A reader over `provider` with `values` as its configuration layer. */
function readerOf(
  provider: FlagProvider,
  values: Partial<ConfigValues<FeatureFlagsConfig>> = {},
): FlagReader {
  return new FlagReader(buildConfig(FeatureFlagsConfig, { values }), provider);
}

afterEach(() => {
  vi.useRealTimers();
});

describe("FlagReader", () => {
  it("is a service that serves declared defaults before any load", () => {
    const reader = readerOf(new QueuedProvider());
    expect(reader).toBeInstanceOf(Service);
    expect(reader.get(Flags.web.help_centre)).toBe(false);
    expect(reader.get(Flags.web.quick_order)).toBe(true);
  });

  it("serves the provider's values after a load", async () => {
    const provider = new QueuedProvider();
    provider.answers.push(() => Promise.resolve({ "web.help_centre": true }));
    const reader = readerOf(provider);
    await reader.load(SUBJECTS);
    expect(reader.get(Flags.web.help_centre)).toBe(true);
    expect(reader.get(Flags.web.quick_order)).toBe(true);
  });

  it("asks for the subject the targeting names, with the tenant as the group", async () => {
    const provider = new QueuedProvider();
    await readerOf(provider).load(SUBJECTS);
    await readerOf(provider, { targeting: "visitor" }).load(SUBJECTS);
    await readerOf(provider, { targeting: "tenant" }).load(SUBJECTS);
    await readerOf(provider, { targeting: "visitor" }).load({ ...SUBJECTS, visitor: null });
    expect(provider.asked).toEqual([
      { subject: "usr_1", scope: "ten_1" },
      { subject: "vis_1", scope: "ten_1" },
      { subject: "ten_1", scope: "ten_1" },
      { subject: null, scope: "ten_1" },
    ]);
  });

  it("keeps the last values when a load fails, and rejects", async () => {
    const provider = new QueuedProvider();
    provider.answers.push(
      () => Promise.resolve({ "web.help_centre": true }),
      () => Promise.reject(new Error("unreachable")),
    );
    const reader = readerOf(provider);
    await reader.load(SUBJECTS);
    await expect(reader.load(SUBJECTS)).rejects.toThrow("unreachable");
    expect(reader.get(Flags.web.help_centre)).toBe(true);
  });

  it("applies only the newest load", async () => {
    const slow: { finish?: (values: Record<string, boolean>) => void } = {};
    const provider = new QueuedProvider();
    provider.answers.push(
      () =>
        new Promise((resolve) => {
          slow.finish = resolve;
        }),
      () => Promise.resolve({ "web.help_centre": true }),
    );
    const reader = readerOf(provider);
    const old = reader.load({ ...SUBJECTS, user: "usr_old" });
    await reader.load(SUBJECTS);
    slow.finish?.({ "web.help_centre": false });
    await old;
    expect(reader.get(Flags.web.help_centre)).toBe(true);
  });

  it("notifies subscribers until they unsubscribe", async () => {
    const provider = new QueuedProvider();
    const reader = readerOf(provider);
    const listener = vi.fn();
    const unsubscribe = reader.subscribe(listener);
    await reader.load(SUBJECTS);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    await reader.load(SUBJECTS);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("watches: loads now and every refreshEvery until stopped, surviving a failed refresh", async () => {
    vi.useFakeTimers();
    const provider = new QueuedProvider();
    provider.answers.push(
      () => Promise.resolve({ "web.help_centre": true }),
      () => Promise.reject(new Error("unreachable")),
      () => Promise.resolve({ "web.help_centre": false }),
    );
    const reader = readerOf(provider, { refreshEvery: Duration.seconds(60) });
    const stop = reader.watch(SUBJECTS);
    await vi.advanceTimersByTimeAsync(0);
    expect(reader.get(Flags.web.help_centre)).toBe(true);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(reader.get(Flags.web.help_centre)).toBe(true);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(reader.get(Flags.web.help_centre)).toBe(false);
    stop();
    await vi.advanceTimersByTimeAsync(120_000);
    expect(provider.asked).toHaveLength(3);
  });
});
