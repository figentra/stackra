/**
 * Stackra file contract:
 * Purpose: `scheduleSecretReload(store, options)`, an opt-in helper for a host that binds a loading store itself: it
 *          calls the store's `load()` every `everySeconds` (and on `reloadNow()`, a rotation signal), one reload at a
 *          time, and reports a failed reload to `onError` while the store keeps its last good copy. Every reload has a
 *          deadline (`timeoutMs`): a `load()` that never settles (a dropped connection, a stalled mount) is reported to
 *          `onError` as timed out and releases the schedule, so the next tick or `reloadNow()` starts a fresh `load()`.
 *          A listener that throws never rejects `reloadNow` (the interval would leave that rejection unhandled): an
 *          `onReload` error goes to `onError`, and an `onError` error is dropped.
 * Boundary: schedules only; it reads no value and never prints one. The interval and the deadline timer are unref'd
 *           where the runtime allows, so they never keep a process alive. A load abandoned at its deadline is not
 *           cancelled (the port has no cancel): if it settles later it may still swap in a complete copy, and its
 *           late failure is dropped, since the timeout was already reported. A `@Secret` field is resolved once, when
 *           its configuration is built, so a reload reaches code that reads the store by name (`SecretStore.get`) on
 *           each use, such as the edge signing keys' `secrets` driver; a configuration field picks up a new value only
 *           on restart. Nothing at boot binds a loading store or schedules this yet: `bootApp` binds the environment
 *           store until STA-2804 (which waits for a CTO ruling on the reload policy).
 * Runtime: isomorphic
 * Governing contract: ADR 0371 (decision 4, amendment 2026-11-27, STA-258); ADR 0173.
 */
import type { LoadableSecretStore } from "#core/types/loadable-secret-store.type";
import type { SecretReload } from "#core/types/secret-reload.type";
import type { SecretReloadOptions } from "#core/types/secret-reload-options.type";

/** The longest interval: one day. */
const MAX_SECONDS = 86_400;

/** The default deadline of one reload: 30 seconds. */
const DEFAULT_TIMEOUT_MS = 30_000;

/** The longest deadline of one reload: ten minutes. */
const MAX_TIMEOUT_MS = 600_000;

/** Node's timers can be unref'd so they never hold the process open; a Worker's or browser's cannot. */
const unref = (timer: unknown): void => {
  (timer as { unref?: () => void } | undefined)?.unref?.();
};

/**
 * Reloads `store` every `options.everySeconds` and on demand, each reload bounded by `options.timeoutMs`.
 *
 * @throws RangeError when `everySeconds` is not a whole number from 0 to 86400, or `timeoutMs` not one from 1 to
 *         600000.
 * @example
 * await store.load();
 * const reload = scheduleSecretReload(store, { everySeconds: 300, onError: (error) => reporter.report(error) });
 * process.on("SIGHUP", () => void reload.reloadNow());
 */
export function scheduleSecretReload(
  store: LoadableSecretStore,
  options: SecretReloadOptions,
): SecretReload {
  const { everySeconds, onError, onReload, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  if (!Number.isInteger(everySeconds) || everySeconds < 0 || everySeconds > MAX_SECONDS)
    throw new RangeError(
      `everySeconds must be a whole number from 0 to ${MAX_SECONDS}; 0 schedules no interval`,
    );
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > MAX_TIMEOUT_MS)
    throw new RangeError(`timeoutMs must be a whole number from 1 to ${MAX_TIMEOUT_MS}`);

  // A listener that throws must never reject `reloadNow`: the interval calls it with `void`, and an unhandled
  // rejection can end a Node process. `onReload`'s error goes to `onError`; `onError`'s own is dropped.
  const tell = (error: unknown): void => {
    try {
      onError?.(error);
    } catch {
      // The reporter failed; the reload's answer stands and the store keeps its copy.
    }
  };

  /** One reload: the store's `load()` raced against the deadline. */
  const reloadOnce = async (): Promise<boolean> => {
    let deadline: ReturnType<typeof setTimeout> | undefined;
    try {
      const loading = store.load().then(() => "loaded" as const);
      // A load abandoned at the deadline may still fail later; that failure was reported as the timeout already.
      loading.catch(() => undefined);
      const expired = new Promise<"expired">((resolve) => {
        deadline = setTimeout(() => resolve("expired"), timeoutMs);
        unref(deadline);
      });
      if ((await Promise.race([loading, expired])) === "expired") {
        tell(
          new Error(
            `The secret reload timed out after ${timeoutMs} ms; the store keeps its last good copy`,
          ),
        );
        return false;
      }
    } catch (error) {
      tell(error);
      return false;
    } finally {
      clearTimeout(deadline);
    }
    try {
      onReload?.();
    } catch (error) {
      tell(error);
    }
    return true;
  };

  let running: Promise<boolean> | undefined;
  const reloadNow = (): Promise<boolean> => {
    running ??= reloadOnce().finally(() => {
      running = undefined;
    });
    return running;
  };

  let timer: ReturnType<typeof setInterval> | undefined;
  if (everySeconds > 0) {
    timer = setInterval(() => void reloadNow(), everySeconds * 1000);
    unref(timer);
  }

  return {
    reloadNow,
    stop() {
      if (timer !== undefined) clearInterval(timer);
      timer = undefined;
    },
  };
}
