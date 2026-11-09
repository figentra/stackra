/**
 * Stackra file contract:
 * Purpose: `runSeeders`, the seed runner `stackra db seed` reaches through a service's generated seed entry: it runs
 *          the seeders of a profile's folders (`minimal`, then `demo` or `test`) in list order, each built by the booted
 *          container and run in its own transaction with its ledger row, and skips one whose source is unchanged since
 *          it last ran.
 * Boundary: a seeder's checksum is the SHA-256 of its class's source, so editing it runs it again (a seeder upserts by
 *           its `static ids`); `again` runs every one. A seeder the wiring binds gets its injected services, an unwired
 *           one is built without arguments (the STA-1698 rule). A failing seeder rolls back with its ledger row, the
 *           runner stops there, and the error names it; the seeders before it stay applied. No tenant is opened: a
 *           tenant-owned write is refused by row-level security until seeding runs inside `CallIsolation`.
 * Runtime: node
 * Governing contract: ADR 0190 (profiles); ADR 0325 (decision 7: seeds are resumable and tested); STA-1698; STA-1709.
 */
import { createHash } from "node:crypto";

import type { Container } from "@stackra/container";

import { Database } from "#core/ports/database.port";
import type { SeedLedger } from "#node/types/seed-ledger.type";
import { seederOf } from "#node/functions/seeder-of.function";
import type { SeederEntry } from "#node/types/seeder-entry.type";

/** Each profile and the folders it runs, first to last (ADR 0190). */
const FOLDERS: Readonly<Record<string, readonly string[]>> = {
  minimal: ["minimal"],
  demo: ["minimal", "demo"],
  test: ["minimal", "test"],
};

/**
 * Runs the seeders of `profile`.
 *
 * @returns the keys that ran and the keys skipped as unchanged, in run order.
 * @throws RangeError for an unknown profile; Error naming the seeder that failed, with its error as the cause.
 * @example
 * const { ran, skipped } = await runSeeders({ container, member: "commerce", seeders, profile: "demo", ledger: seederLedger(), ranBy: "ci" });
 */
export async function runSeeders(options: {
  readonly container: Pick<Container, "has" | "get">;
  readonly member: string;
  readonly seeders: readonly SeederEntry[];
  readonly profile: string;
  readonly ledger: SeedLedger;
  readonly ranBy: string;
  readonly module?: string | undefined;
  readonly again?: boolean | undefined;
}): Promise<{ readonly ran: readonly string[]; readonly skipped: readonly string[] }> {
  const folders = FOLDERS[options.profile];
  if (folders === undefined)
    throw new RangeError(
      `unknown seed profile ${options.profile} (expected ${Object.keys(FOLDERS).join(", ")})`,
    );
  const picked = folders.flatMap((folder) =>
    options.seeders.filter(
      (entry) =>
        entry.profile === folder &&
        (options.module === undefined || entry.module === options.module),
    ),
  );
  const applied = await options.ledger.applied(options.member);
  const ran: string[] = [];
  const skipped: string[] = [];
  for (const entry of picked) {
    const checksum = createHash("sha256").update(entry.type.toString()).digest("hex");
    if (options.again !== true && applied.get(entry.key) === checksum) {
      skipped.push(entry.key);
      continue;
    }
    const seeder = seederOf(options.container, entry.type, entry.deps);
    try {
      await Database.current().transaction(async () => {
        await seeder.run();
        await options.ledger.record(options.member, {
          key: entry.key,
          profile: entry.profile,
          checksum,
          ranBy: options.ranBy,
        });
      });
    } catch (error) {
      throw new Error(
        `seeder ${entry.key} failed (${ran.length} ran before it): ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
    ran.push(entry.key);
  }
  return { ran, skipped };
}
