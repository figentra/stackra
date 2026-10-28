/**
 * Stackra file contract:
 * Purpose: `watchDocsSite`, gen in watch mode for a docs app: it watches the member's `src/` and, after a quiet spell,
 *          runs `generateDocsSite` again and hands each result to `onRun`, so `mint dev` in `.stackra/site/` picks the
 *          change up. `stackra dev` starts it before `mint dev` and closes it when `mint dev` exits.
 * Boundary: one recursive `fs.watch` on `src/`; runs never overlap (a change during a run schedules one more). It
 *           writes only what `generateDocsSite` writes. A run that throws is reported through `onError`, and the watch
 *           keeps going.
 * Runtime: node
 * Governing contract: ADR 0002 (2026-10-27 amendment: `dev` runs gen in watch mode, then `mint dev`); STA-1316.
 */
import { watch } from "node:fs";
import { join } from "node:path";

import { generateDocsSite } from "#node/functions/generate-docs-site.function";
import type { GenerateResult } from "#node/types/generate-result.type";

/** How long `src/` must be quiet before a run, in milliseconds. */
const QUIET_MS = 100;

/**
 * Watches the docs app at `root` and regenerates its site on every change.
 *
 * @param root - the member root.
 * @param onRun - called with each run's result.
 * @param onError - called when a run throws (a config that does not import).
 * @returns a handle whose `close` stops the watch.
 * @example
 * const watcher = watchDocsSite(root, (result) => print(result), (error) => io.err(`${error}\n`));
 * watcher.close();
 */
export function watchDocsSite(
  root: string,
  onRun: (result: GenerateResult) => void,
  onError: (error: unknown) => void,
): { close: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;
  let again = false;
  const run = async (): Promise<void> => {
    if (running) {
      again = true;
      return;
    }
    running = true;
    try {
      onRun(await generateDocsSite(root));
    } catch (error) {
      onError(error);
    } finally {
      running = false;
      if (again) {
        again = false;
        void run();
      }
    }
  };
  const watcher = watch(join(root, "src"), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => void run(), QUIET_MS);
  });
  return {
    close() {
      clearTimeout(timer);
      watcher.close();
    },
  };
}
