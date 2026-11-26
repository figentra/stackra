/**
 * Stackra file contract:
 * Purpose: `watchDocsSite`, gen in watch mode for a docs site: it watches a docs app's `src/`, or a docs member's
 *          `content/` and `docs.yaml` (ADR 0514 amendment of 2026-11-09), and, after a quiet spell,
 *          runs `generateDocsSite` again and hands each result to `onRun`, so `mint dev` in `.stackra/site/` picks the
 *          change up. `stackra dev` starts it before `mint dev` and closes it when `mint dev` exits.
 * Boundary: one recursive `fs.watch` on `src/` (or on `content/`, plus one on `docs.yaml`); runs never overlap (a change during a run schedules one more). It
 *           writes only what `generateDocsSite` writes. A run that throws is reported through `onError`, and the watch
 *           keeps going.
 * Runtime: node
 * Governing contract: ADR 0002 (2026-10-27 amendment: `dev` runs gen in watch mode, then `mint dev`); STA-1316;
 *                     ADR 0514 (amendment of 2026-11-09).
 */
import { watch } from "node:fs";
import { join } from "node:path";

import { generateDocsSite } from "#node/functions/generate-docs-site.function";
import { isDocsMember } from "#node/functions/is-docs-member.function";
import type { GenerateResult } from "#node/types/generate-result.type";

/** How long the sources must be quiet before a run, in milliseconds. */
const QUIET_MS = 100;

/**
 * Watches the docs app or docs member at `root` and regenerates its site on every change.
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
  const changed = (): void => {
    clearTimeout(timer);
    timer = setTimeout(() => void run(), QUIET_MS);
  };
  const watchers = isDocsMember(root)
    ? [
        watch(join(root, "content"), { recursive: true }, changed),
        watch(join(root, "docs.yaml"), changed),
      ]
    : [watch(join(root, "src"), { recursive: true }, changed)];
  return {
    close() {
      clearTimeout(timer);
      for (const watcher of watchers) watcher.close();
    },
  };
}
