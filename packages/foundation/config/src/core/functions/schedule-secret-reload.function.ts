/**
 * Stackra file contract:
 * Purpose: `scheduleSecretReload(store, options)`, how a rotated secret reaches a running process without a redeploy:
 *          it calls the store's `load()` every `everySeconds` (and on `reloadNow()`, a rotation signal), one reload at a
 *          time, and reports a failed reload to `onError` while the store keeps its last good copy.
 * Boundary: schedules only; it reads no value and never prints one. The interval is unref'd where the runtime allows,
 *           so it never keeps a process alive. A `@Secret` field is resolved once, when its configuration is built, so
 *           a reload reaches code that reads the store by name (`SecretStore.get`) on each use, such as the edge
 *           signing keys' `secrets` driver; a configuration field changes on the next boot. Which store `bootApp` binds
 *           and whether it schedules this is STA-2804's.
 * Runtime: isomorphic
 * Governing contract: ADR 0371 (decision 4, amendment 2026-11-27, STA-258); ADR 0173.
 */
import type { LoadableSecretStore } from "#core/types/loadable-secret-store.type";
import type { SecretReload } from "#core/types/secret-reload.type";
import type { SecretReloadOptions } from "#core/types/secret-reload-options.type";

/** The longest interval: one day. */
const MAX_SECONDS = 86_400;

/**
 * Reloads `store` every `options.everySeconds` and on demand.
 *
 * @throws RangeError when `everySeconds` is not a whole number from 0 to 86400.
 * @example
 * await store.load();
 * const reload = scheduleSecretReload(store, { everySeconds: 300, onError: (error) => reporter.report(error) });
 * process.on("SIGHUP", () => void reload.reloadNow());
 */
export function scheduleSecretReload(
  store: LoadableSecretStore,
  options: SecretReloadOptions,
): SecretReload {
  const { everySeconds, onError, onReload } = options;
  if (!Number.isInteger(everySeconds) || everySeconds < 0 || everySeconds > MAX_SECONDS)
    throw new RangeError(
      `everySeconds must be a whole number from 0 to ${MAX_SECONDS}; 0 schedules no interval`,
    );

  let running: Promise<boolean> | undefined;
  const reloadNow = (): Promise<boolean> => {
    running ??= store
      .load()
      .then(
        () => {
          onReload?.();
          return true;
        },
        (error: unknown) => {
          onError?.(error);
          return false;
        },
      )
      .finally(() => {
        running = undefined;
      });
    return running;
  };

  let timer: ReturnType<typeof setInterval> | undefined;
  if (everySeconds > 0) {
    timer = setInterval(() => void reloadNow(), everySeconds * 1000);
    // Node's timers can be unref'd so the schedule never holds the process open; a Worker's or browser's cannot.
    (timer as { unref?: () => void }).unref?.();
  }

  return {
    reloadNow,
    stop() {
      if (timer !== undefined) clearInterval(timer);
      timer = undefined;
    },
  };
}
