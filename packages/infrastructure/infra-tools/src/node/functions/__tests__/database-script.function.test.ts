/**
 * Stackra file contract:
 * Purpose: unit tests of `databaseScript` and `databasePasswordVariable`: each database gets an idempotent role and
 *          database step whose password arrives as a psql variable (never spliced into SQL), extensions only where
 *          listed, and the password variable name is shell-safe.
 * Boundary: test only; the script is inspected as text, never run.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0444; ADR 0238; ADR 0173.
 */
import { describe, expect, it } from "@stackra/testing";

import { databasePasswordVariable } from "#node/functions/database-password-variable.function";
import { databaseScript } from "#node/functions/database-script.function";

describe("databaseScript", () => {
  const script = databaseScript([
    { tool: "documenso", name: "documenso", extensions: [], passwordParameter: "/p/documenso" },
    {
      tool: "chatwoot",
      name: "chatwoot",
      extensions: ["pg_trgm"],
      passwordParameter: "/p/chatwoot",
    },
  ]);

  it("creates each role and database only when missing", () => {
    expect(script.startsWith("set -eu\n")).toBe(true);
    expect(script).toContain('-v db=documenso -v pw="$DB_PASSWORD_DOCUMENSO"');
    expect(script).toContain("WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'db')");
    expect(script).toContain("WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = :'db')");
    expect(script).toContain("format('ALTER ROLE %I PASSWORD %L', :'db', :'pw')");
  });

  it("creates extensions only in the database that lists them", () => {
    expect(script).toContain(
      "psql -v ON_ERROR_STOP=1 -d chatwoot <<'SQL'\nCREATE EXTENSION IF NOT EXISTS \"pg_trgm\";",
    );
    expect(script).not.toContain("-d documenso <<");
  });

  it("names the password variable safely", () => {
    expect(databasePasswordVariable("chat-woot")).toBe("DB_PASSWORD_CHAT_WOOT");
  });
});
