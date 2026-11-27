/**
 * Stackra file contract:
 * Purpose: unit tests of `createExtensionsScript`: the script lists the connectable databases (never `template0`,
 *          `rdsadmin` or `cloudsqladmin`) and creates each planned extension, once, in every one of them, `template1`
 *          included; it stops non-zero when psql fails; an empty list and an unapproved name are refused.
 * Boundary: test only; runs the script under `sh` with a fake `psql` on `PATH` that records each call, so no database
 *           is needed (box 2 proved it against a real server, STA-2092).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0160 (notes of 2026-11-03 and 2026-11-26).
 */
import { execFileSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { createExtensionsScript } from "#core/functions/create-extensions-script.function";
import type { PostgresExtension } from "#core/enums/postgres-extension.enum";

/** A fake psql: answers the database list, records every other call's database and SQL, fails on `FAIL_ON`. */
const FAKE_PSQL = `#!/bin/sh
for arg in "$@"; do
  case "$previous" in -d) database="$arg" ;; -c) query="$arg" ;; esac
  previous="$arg"
done
if [ -n "\${query:-}" ]; then
  echo "QUERY $query" >> "$LOG"
  printf 'postgres\\ntemplate1\\nshop_db\\n'
  exit 0
fi
echo "DB $database" >> "$LOG"
cat >> "$LOG"
if [ "$database" = "\${FAIL_ON:-}" ]; then exit 3; fi
`;

let folder = "";

/** Runs `script` with the fake psql and answers its exit status and the recorded calls. */
function run(script: string, failOn = ""): { status: number; log: string } {
  const log = join(folder, "psql.log");
  writeFileSync(log, "");
  let status = 0;
  try {
    execFileSync("sh", ["-c", script], {
      env: { PATH: `${folder}:/usr/bin:/bin`, LOG: log, FAIL_ON: failOn },
      stdio: "pipe",
    });
  } catch (error) {
    status = (error as { status?: number }).status ?? -1;
  }
  return { status, log: readFileSync(log, "utf8") };
}

beforeEach(() => {
  folder = mkdtempSync(join(tmpdir(), "stackra-extensions-"));
  writeFileSync(join(folder, "psql"), FAKE_PSQL);
  chmodSync(join(folder, "psql"), 0o755);
});

afterEach(() => {
  rmSync(folder, { recursive: true, force: true });
});

describe("createExtensionsScript", () => {
  it("creates every extension once in each connectable database, template1 included", () => {
    const { status, log } = run(createExtensionsScript(["pg_trgm", "vector", "pg_trgm"]));

    expect(status).toBe(0);
    expect(log).toContain(
      "QUERY SELECT datname FROM pg_database WHERE datallowconn AND datname NOT IN ('rdsadmin', 'cloudsqladmin') ORDER BY datname",
    );
    const created = log
      .split("\n")
      .filter((line) => line.startsWith("DB ") || line.startsWith("CREATE"));
    expect(created).toEqual([
      "DB postgres",
      'CREATE EXTENSION IF NOT EXISTS "pg_trgm";',
      'CREATE EXTENSION IF NOT EXISTS "vector";',
      "DB template1",
      'CREATE EXTENSION IF NOT EXISTS "pg_trgm";',
      'CREATE EXTENSION IF NOT EXISTS "vector";',
      "DB shop_db",
      'CREATE EXTENSION IF NOT EXISTS "pg_trgm";',
      'CREATE EXTENSION IF NOT EXISTS "vector";',
    ]);
  });

  it("stops non-zero at the first database psql fails in", () => {
    const { status, log } = run(createExtensionsScript(["citext"]), "template1");

    expect(status).not.toBe(0);
    expect(log).toContain("DB template1");
    expect(log).not.toContain("DB shop_db");
  });

  it("refuses an empty list", () => {
    expect(() => createExtensionsScript([])).toThrow(TypeError);
  });

  it("refuses a name outside the approved list, so nothing unchecked reaches SQL or the shell", () => {
    expect(() =>
      createExtensionsScript(['vector"; DROP DATABASE x; --' as PostgresExtension]),
    ).toThrow(/Not an approved Postgres extension/);
  });
});
