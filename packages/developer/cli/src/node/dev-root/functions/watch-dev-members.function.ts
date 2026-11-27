/**
 * Stackra file contract:
 * Purpose: `watchDevMembers(request, io)`, the watch that keeps the local monolith app current: an edit under a
 *          service member's `src`, `.stackra`, `stackra-encore` or `assets`, or to its package.json or tsconfig.json,
 *          re-syncs that member (`syncDevEncoreMember`) after a short quiet period, and `encore run`, which watches the
 *          app, reloads.
 * Boundary: one recursive watcher per member; `node_modules` and `__tests__` edits are ignored. A sync refusal (a `#`
 *           import that resolves nowhere) is printed and the watch goes on. `close` stops every watcher and timer.
 * Runtime: node
 * Governing contract: ADR 0296 (decision 3); STA-2840.
 */
import { watch, type FSWatcher } from "node:fs";
import { relative } from "node:path";

import { syncDevEncoreMember, type DevEncoreAppRequest } from "@stackra/runway/node";

import type { CliIo } from "#node/types/cli-io.type";

/** The member paths the app carries; an edit elsewhere does not change it. */
const CARRIED =
  /^(?:(?:src|\.stackra|stackra-encore|assets)(?:\/|$)|package\.json$|tsconfig\.json$)/;

/** What a sync waits for after the last edit, so a save of many files syncs once. */
const QUIET_MS = 150;

/**
 * Watches every member of `request` and re-syncs the one that changed.
 *
 * @returns `close`, which stops the watch.
 * @example
 * const watcher = watchDevMembers({ repository, members }, io);
 * watcher.close();
 */
export function watchDevMembers(
  request: DevEncoreAppRequest,
  io: CliIo,
  quietMs = QUIET_MS,
): { readonly close: () => void } {
  const timers = new Map<string, NodeJS.Timeout>();
  const watchers: FSWatcher[] = request.members.map((member) =>
    watch(member, { recursive: true }, (_event, name) => {
      const path = (name ?? "").replaceAll("\\", "/");
      if (!CARRIED.test(path) || /(?:^|\/)(?:node_modules|__tests__)(?:\/|$)/.test(path)) return;
      clearTimeout(timers.get(member));
      timers.set(
        member,
        setTimeout(() => {
          timers.delete(member);
          try {
            const { written, removed } = syncDevEncoreMember(request, member);
            if (written + removed > 0)
              io.out(
                `stackra dev: synced ${relative(request.repository, member)} (${written} written, ${removed} removed)\n`,
              );
          } catch (error) {
            io.err(`stackra dev: ${error instanceof Error ? error.message : String(error)}\n`);
          }
        }, quietMs),
      );
    }),
  );
  return {
    close: () => {
      for (const watcher of watchers) watcher.close();
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    },
  };
}
