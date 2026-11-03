/**
 * Stackra file contract:
 * Purpose: unit tests of `writeDevFacts`: the file it writes round-trips through `readDevFacts` with lane offsets.
 * Boundary: test only; temporary repositories.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-2029.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { readDevFacts } from "#core/functions/read-dev-facts.function";
import { writeDevFacts } from "#node/functions/write-dev-facts.function";

/** A repository with a root runway and one app member. */
function repository(app: string): string {
  const root = mkdtempSync(join(tmpdir(), "dev-facts-"));
  writeFileSync(
    join(root, "runway.yaml"),
    "providers: {}\nenvironments:\n  dev:\n    lanes: { portStep: 10 }\n    https: { cert: /c.pem, key: /k.pem }\n",
  );
  mkdirSync(join(root, "apps/console"), { recursive: true });
  writeFileSync(join(root, "apps/console/runway.yaml"), app);
  return root;
}

describe("writeDevFacts", () => {
  it("writes what readDevFacts reads back, lane offsets applied", () => {
    const root = repository(
      "environments:\n  dev:\n    port: 5173\n    https: true\n    desktop: { devtools: true, remoteDebugPort: 9222, pkceLoopbackPort: 8400 }\n",
    );
    writeDevFacts(root, 2);
    const cwd = process.cwd();
    process.chdir(root);
    try {
      const facts = readDevFacts();
      expect(facts?.lane).toBe(2);
      expect(facts?.members["console"]).toMatchObject({
        url: "https://localhost:5193",
        port: 5193,
        host: "localhost",
        https: true,
        tls: { cert: "/c.pem", key: "/k.pem" },
        desktop: { devtools: true, remoteDebugPort: 9242, pkceLoopbackPort: 8420 },
      });
    } finally {
      process.chdir(cwd);
    }
  });

  it("leaves out a member without a dev port", () => {
    const root = repository("environments:\n  dev: {}\n");
    expect(writeDevFacts(root).members).toEqual({});
  });
});
