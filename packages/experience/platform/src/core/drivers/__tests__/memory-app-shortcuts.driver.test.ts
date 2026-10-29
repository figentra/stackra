/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryAppShortcutsDriver`: a run queued with no listener reaches the next one, a new run
 *          reaches every listener until it stops, and donations are recorded or refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; STA-1539.
 */
import { describe, expect, it } from "@stackra/testing";

import { AppShortcuts } from "#contracts/ports/app-shortcuts.port";
import type { ShortcutInvocation } from "#contracts/types/shortcut-invocation.type";
import { MemoryAppShortcutsDriver } from "#core/drivers/memory-app-shortcuts.driver";

const RUN: ShortcutInvocation = { id: "run_1", intent: "ReorderLast", params: { size: "large" } };

describe("MemoryAppShortcutsDriver", () => {
  it("queues a run until a listener comes, then delivers new runs until it stops", async () => {
    const shortcuts = new MemoryAppShortcutsDriver();
    expect(shortcuts).toBeInstanceOf(AppShortcuts);
    await shortcuts.invoke(RUN);
    const runs: ShortcutInvocation[] = [];
    const stop = shortcuts.onInvoke((run) => {
      runs.push(run);
    });
    await shortcuts.invoke({ ...RUN, id: "run_2" });
    stop();
    await shortcuts.invoke({ ...RUN, id: "run_3" });
    expect(runs.map((run) => run.id)).toEqual(["run_1", "run_2"]);
    expect(shortcuts.pending.map((run) => run.id)).toEqual(["run_3"]);
  });

  it("records donations and refuses them where unavailable", async () => {
    const shortcuts = new MemoryAppShortcutsDriver();
    expect(await shortcuts.donate("ReorderLast")).toEqual({ ok: true, data: undefined });
    expect(shortcuts.donated).toEqual([{ intent: "ReorderLast", params: {} }]);
    shortcuts.isAvailable = false;
    expect(await shortcuts.donate("ReorderLast")).toEqual({
      ok: false,
      error: { code: "unavailable", capability: "app_shortcut" },
    });
  });
});
