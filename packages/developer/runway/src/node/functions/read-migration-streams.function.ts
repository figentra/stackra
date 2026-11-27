/**
 * Stackra file contract:
 * Purpose: `readMigrationStreams(root, member)`, the migration streams of the services one deploy job ships: for
 *          `services/<member>`, or every service under `services/` (a folder with a `package.json`) without a member,
 *          gen's `.stackra/migration-safety.json` (`undefined` when it is missing or does not parse) and the
 *          `.up.sql` step files in `.stackra/migrations`. `undefined` when the member has no service folder or no
 *          service is found, so nothing says what the job ships.
 * Boundary: reads those files only; no network, no value. A missing safety file stays `undefined`, never an empty
 *           stream: gen writes one for every service, so its absence means gen has not run (`streamIsCurrent`).
 * Runtime: node
 * Governing contract: ADR 0533 (decision 3); ADR 0159 (decision 3); STA-2866.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { MIGRATION_SAFETY_FILE_SCHEMA } from "#core/constants/migration-safety-file-schema.constant";
import type { MigrationStream } from "#core/types/migration-stream.type";

/** One service's stream from its folder. */
function streamOf(services: string, member: string): MigrationStream {
  const folder = join(services, member);
  const compiledDir = join(folder, ".stackra/migrations");
  const compiled = existsSync(compiledDir)
    ? readdirSync(compiledDir)
        .filter((file) => /^\d+_.+\.up\.sql$/.test(file))
        .map((file) => file.slice(0, -".up.sql".length))
    : [];
  const file = join(folder, ".stackra/migration-safety.json");
  let safety: MigrationStream["safety"];
  try {
    safety = existsSync(file)
      ? MIGRATION_SAFETY_FILE_SCHEMA.parse(JSON.parse(readFileSync(file, "utf8")))
      : undefined;
  } catch {
    // An unreadable safety file is unknown, never an empty stream.
    safety = undefined;
  }
  return { member, safety, compiled };
}

/**
 * The streams the job ships, or `undefined` when no service is found.
 *
 * @param root - the repository root.
 * @param member - the member the job ships; every service without it.
 * @example
 * readMigrationStreams("/repo", "billing"); // [{ member: "billing", safety: {...}, compiled: ["0001_..."] }]
 */
export function readMigrationStreams(
  root: string,
  member: string | undefined,
): MigrationStream[] | undefined {
  const services = join(root, "services");
  if (member !== undefined)
    return existsSync(join(services, member)) ? [streamOf(services, member)] : undefined;
  const names = existsSync(services)
    ? readdirSync(services, { withFileTypes: true })
        .filter(
          (entry) => entry.isDirectory() && existsSync(join(services, entry.name, "package.json")),
        )
        .map((entry) => entry.name)
    : [];
  return names.length === 0 ? undefined : names.map((name) => streamOf(services, name));
}
