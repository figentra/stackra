/**
 * Stackra file contract:
 * Purpose: `fileDeployLock(directory)`, a `DeployLock` on one host: a key's holder creates `<directory>/<key>.lock`
 *          exclusively, holding its process id and the lease's end, renews the lease while its work runs, and deletes
 *          the file when the work ends, however it ends. A file whose lease has ended (a holder that crashed) is
 *          replaced.
 * Boundary: serialises deploys of one environment on one machine only. Across CI runners the caller workflow's
 *           `concurrency` group is the lock; this one stops two local or same-box runs from overlapping. Reads and
 *           writes only its own lock files.
 * Runtime: node
 * Governing contract: ADR 0435 (the deploy lock); ADR 0468; STA-1969 (Runway completion plan PR 3).
 */
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { Duration } from "@stackra/contracts";

import type { DeployLock } from "#core/types/deploy-lock.type";

/** The lease a lock file records. */
type Lease = { readonly pid: number; readonly until: number };

/** Writes a new lock file for `lease`; `false` when one exists. */
function create(file: string, lease: Lease): boolean {
  try {
    writeFileSync(file, JSON.stringify(lease), { flag: "wx" });
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") return false;
    throw error;
  }
}

/** The lease in `file`, or `undefined` when it is missing or unreadable. */
function leaseOf(file: string): Lease | undefined {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as Lease;
  } catch {
    return undefined;
  }
}

/** Deletes `file`, ignoring one already gone. */
function remove(file: string): void {
  try {
    unlinkSync(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

/**
 * A deploy lock kept in `directory`.
 *
 * @example
 * await withDeployLock(root, "production", fileDeployLock(join(tmpdir(), "stackra-runway-locks")), () => deploy(...));
 */
export function fileDeployLock(directory: string, now: () => number = Date.now): DeployLock {
  return {
    async tryWith(key, ttl, work) {
      mkdirSync(directory, { recursive: true });
      const file = join(directory, `${key.replaceAll(/[^A-Za-z0-9._-]/g, "_")}.lock`);
      const span = Duration.toMilliseconds(ttl);
      const lease = (): Lease => ({ pid: process.pid, until: now() + span });
      if (!create(file, lease())) {
        const held = leaseOf(file);
        if (held !== undefined && held.until > now()) return false;
        remove(file);
        if (!create(file, lease())) return false;
      }
      const renew = setInterval(
        () => writeFileSync(file, JSON.stringify(lease())),
        Math.max(span / 2, 1000),
      );
      renew.unref();
      try {
        await work();
      } finally {
        clearInterval(renew);
        remove(file);
      }
      return true;
    },
  };
}
