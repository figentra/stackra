/**
 * Stackra file contract:
 * Purpose: `MemoryAppShortcutsDriver`, the `AppShortcuts` driver of tests, the web, the desktop and, until the Expo
 *          driver lands, the phone: the `memory` candidate. A test runs an intent with `invoke` and reads `donated`.
 * Boundary: a run with no listener waits in `pending` and goes to the next listener, as the OS queue does.
 *           Runs reach a listener one after another; one that throws is dropped and the other listeners still get it.
 *           `isAvailable` false makes every donation resolve `unavailable`. The constructor takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers); STA-1539.
 */
import { Driver } from "@stackra/container";
import type { Json } from "@stackra/contracts";

import { AppShortcuts } from "#contracts/ports/app-shortcuts.port";
import type { CapabilityResult } from "#contracts/types/capability-result.type";
import type { ShortcutInvocation } from "#contracts/types/shortcut-invocation.type";
import { APP_SHORTCUT_CAPABILITY } from "#core/constants/app-shortcut-capability.constant";
import { refuse } from "#core/functions/refuse.function";

/**
 * App Shortcuts in memory.
 *
 * @example
 * const shortcuts = new MemoryAppShortcutsDriver();
 * shortcuts.onInvoke((run) => runs.push(run));
 * await shortcuts.invoke({ id: "1", intent: "ReorderLast", params: {} });
 */
export class MemoryAppShortcutsDriver extends Driver(AppShortcuts) {
  /** The donations so far, in order. */
  readonly donated: { readonly intent: string; readonly params: Readonly<Record<string, Json>> }[] =
    [];

  /** The runs waiting for a listener. */
  readonly pending: ShortcutInvocation[] = [];

  /** Whether this target offers App Intents; a test sets it. */
  isAvailable = true;

  /** The listeners now listening. */
  private readonly listeners = new Set<(invocation: ShortcutInvocation) => void | Promise<void>>();

  /** Hands the waiting runs to `listener`, then each new one, until the returned function removes it. */
  onInvoke(listener: (invocation: ShortcutInvocation) => void | Promise<void>): () => void {
    this.listeners.add(listener);
    const waiting = this.pending.splice(0);
    void (async () => {
      for (const invocation of waiting) await deliver(listener, invocation);
    })();
    return () => this.listeners.delete(listener);
  }

  /** Records the donation, or refuses when unavailable. */
  async donate(
    intent: string,
    params: Readonly<Record<string, Json>> = {},
  ): Promise<CapabilityResult> {
    if (!this.isAvailable) return refuse(APP_SHORTCUT_CAPABILITY, "unavailable");
    this.donated.push({ intent, params });
    return { ok: true, data: undefined };
  }

  /** Runs `invocation` as the OS does: to every listener, or into `pending` when none listens. */
  async invoke(invocation: ShortcutInvocation): Promise<void> {
    if (this.listeners.size === 0) this.pending.push(invocation);
    for (const listener of this.listeners) await deliver(listener, invocation);
  }
}

/** Hands `invocation` to `listener`; a run whose handler throws is dropped, as the port says. */
async function deliver(
  listener: (invocation: ShortcutInvocation) => void | Promise<void>,
  invocation: ShortcutInvocation,
): Promise<void> {
  try {
    await listener(invocation);
  } catch {
    // dropped: the next listener and the next run still go ahead.
  }
}
