/**
 * Stackra file contract:
 * Purpose: hold `skill-licences.mjs` to STA-272: the real `.agents` tree and enabled plugins pass, and fixtures with
 *          a noncommercial, missing or stale licence record fail.
 * Boundary: reads this checkout and writes fixtures into temp directories; writes nothing here.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (testing strategy). ADR 0258.
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { stringify } from "yaml";

import { checkLicences } from "../skill-licences.mjs";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));

/** A checkout with one skill `skills/sample` and one enabled plugin, both recorded as `licence`. */
function fixture(licence, { licenceFile, plugin = licence } = {}) {
  const root = mkdtempSync(join(tmpdir(), "skill-licences-"));
  mkdirSync(join(root, ".agents/skills/sample"), { recursive: true });
  mkdirSync(join(root, ".claude"));
  writeFileSync(join(root, ".agents/skills/sample/SKILL.md"), "---\nname: sample\n---\n");
  if (licenceFile) writeFileSync(join(root, ".agents/skills/sample/LICENSE"), licenceFile);
  writeFileSync(
    join(root, ".claude/settings.json"),
    JSON.stringify({ enabledPlugins: { "p@m": true, "off@m": false } }),
  );
  const record = {
    skills: licence ? { "skills/sample": licence } : {},
    plugins: plugin ? { "p@m": plugin } : {},
  };
  writeFileSync(join(root, ".agents/skills/.licences.yaml"), stringify(record));
  return root;
}

test("the real .agents skills and enabled plugins all carry an allowed licence", () => {
  assert.deepEqual(checkLicences(ROOT), []);
});

test("an allowed licence passes", () => {
  assert.deepEqual(
    checkLicences(fixture("Apache-2.0", { licenceFile: "Apache License\nVersion 2.0" })),
    [],
  );
});

test("a noncommercial skill licence fails", () => {
  const findings = checkLicences(fixture("PolyForm-Noncommercial-1.0.0"));
  assert.equal(findings.length, 2);
  assert.match(
    findings[0],
    /skill skills\/sample: licence PolyForm-Noncommercial-1\.0\.0 is not allowed/,
  );
  assert.match(findings[1], /plugin p@m: licence PolyForm-Noncommercial-1\.0\.0 is not allowed/);
});

test("a noncommercial licence file fails even when the record says MIT", () => {
  const findings = checkLicences(
    fixture("MIT", { licenceFile: "PolyForm Noncommercial License 1.0.0" }),
  );
  assert.deepEqual(findings, ["skill skills/sample: LICENSE reads as a noncommercial licence"]);
});

test("a missing licence fails for skills and plugins", () => {
  const findings = checkLicences(fixture(undefined));
  assert.equal(findings.length, 2);
  assert.match(findings[0], /skill skills\/sample: no licence recorded/);
  assert.match(findings[1], /plugin p@m: no licence recorded/);
});

test("a record for a skill or plugin that is gone fails, and a disabled plugin needs no record", () => {
  const root = fixture("MIT");
  writeFileSync(
    join(root, ".agents/skills/.licences.yaml"),
    stringify({
      skills: { "skills/sample": "MIT", "skills/gone": "MIT" },
      plugins: { "p@m": "MIT", "off@m": "MIT" },
    }),
  );
  assert.deepEqual(checkLicences(root), [
    "skill skills/gone: recorded in .agents/skills/.licences.yaml but no such skill folder",
    "plugin off@m: recorded in .agents/skills/.licences.yaml but not enabled",
  ]);
});
