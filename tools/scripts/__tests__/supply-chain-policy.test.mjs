/**
 * Stackra file contract:
 * Purpose: hold the dependency policy of ADR 0174 decision 3 to the files that carry it: pnpm resolves only versions
 *          a day old (`minimumReleaseAge`), the CI dependency scan enforces the licence allow-list, every licence
 *          correction or exception in osv-scanner.toml has its reason and review date, and Renovate waits a day,
 *          never automerges and exempts only our own packages from the wait.
 * Boundary: reads pnpm-workspace.yaml, .github/licence-allowlist.yaml, .github/workflows/ci.yml,
 *           .github/workflows/renovate-config.yml, osv-scanner.toml and renovate.json5 as files; runs nothing.
 * Runtime: node
 * Governing contract: ADR 0174 decision 3; owner decision 2026-11-01 (STA-1589); STA-312; STA-1735.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { parse } from "yaml";

const read = (path) => readFileSync(path, "utf8");

/** Licences the owner's decision and the CTO's ruling refuse; none may be on the allow-list. */
const DENIED = [
  /^GPL/i,
  /^LGPL/i,
  /^AGPL/i,
  /^SSPL/i,
  /^BUSL/i,
  /^Elastic/i,
  /-(NC|ND)(-|$)/i,
  /^(UNKNOWN|UNLICENSED|SEE LICENSE)/i,
];

/** Scopes we publish ourselves: the only ones that may skip a release age. */
const OWN_SCOPES = ["@stackra/", "@stackra-pro/", "@figentra-oss/"];

/** One day, in pnpm's unit (minutes). */
const ONE_DAY_MINUTES = 1440;

/**
 * The `[[PackageOverrides]]` blocks of osv-scanner.toml, as flat `key = value` records. The file holds only flat
 * keys, strings, booleans, dates and string arrays, so this small reader is enough; a value it cannot read fails.
 */
function packageOverrides(toml) {
  return toml
    .split(/^\[\[/m)
    .filter((block) => block.startsWith("PackageOverrides]]"))
    .map((block) => {
      const entry = {};
      for (const line of block.split("\n").slice(1)) {
        const match = /^([\w.]+)\s*=\s*(.+)$/.exec(line.trim());
        if (!match) continue;
        const [, key, raw] = match;
        if (raw.startsWith('"')) entry[key] = JSON.parse(raw);
        else if (raw.startsWith("[")) entry[key] = JSON.parse(raw);
        else if (raw === "true" || raw === "false") entry[key] = raw === "true";
        else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) entry[key] = raw;
        else assert.fail(`osv-scanner.toml: cannot read ${key} = ${raw}`);
      }
      return entry;
    });
}

/** renovate.json5 is a JavaScript object literal with comments; evaluate it with no globals in reach. */
function renovateConfig() {
  return runInNewContext(`(${read("renovate.json5")})`, Object.create(null), { timeout: 1000 });
}

const isOwn = (name) => OWN_SCOPES.some((scope) => name.startsWith(scope));

test("pnpm resolves a version only once it is a day old", () => {
  const workspace = parse(read("pnpm-workspace.yaml"));
  assert.equal(
    typeof workspace.minimumReleaseAge,
    "number",
    "pnpm-workspace.yaml sets no minimumReleaseAge",
  );
  assert.ok(
    workspace.minimumReleaseAge >= ONE_DAY_MINUTES,
    `minimumReleaseAge is ${workspace.minimumReleaseAge} minutes, under one day`,
  );
});

test("a release-age exclusion is our own scope or one exact third-party version", () => {
  const { minimumReleaseAgeExclude = [] } = parse(read("pnpm-workspace.yaml"));
  for (const entry of minimumReleaseAgeExclude) {
    if (isOwn(entry)) continue;
    assert.match(
      entry,
      /^(@[^/@]+\/)?[^/@*]+@\d+\.\d+\.\d+$/,
      `${entry} exempts more than one exact version`,
    );
  }
});

test("the licence allow-list is SPDX ids, each once, none of them refused", () => {
  const { allow } = parse(read(".github/licence-allowlist.yaml"));
  assert.ok(Array.isArray(allow) && allow.length > 0, "the allow-list is empty");
  assert.equal(new Set(allow).size, allow.length, "the allow-list repeats a licence");
  for (const id of allow) {
    assert.match(id, /^[A-Za-z0-9.+-]+$/, `${id} is not one SPDX id`);
    assert.ok(!DENIED.some((rx) => rx.test(id)), `${id} is a refused licence`);
  }
  for (const required of ["MIT", "Apache-2.0", "BSD-3-Clause", "ISC"]) {
    assert.ok(allow.includes(required), `the allow-list lost ${required}`);
  }
});

test("the CI dependency scan enforces the licence allow-list, failing closed", () => {
  const workflow = parse(read(".github/workflows/ci.yml"));
  const job = workflow.jobs["dependency-scan"];
  assert.ok(job, "ci.yml has no dependency-scan job");
  const scan = job.steps.find(
    (step) => typeof step.run === "string" && step.run.includes("osv-scanner scan source"),
  );
  assert.ok(scan, "the dependency-scan job does not run osv-scanner");
  assert.match(scan.run, /--lockfile=pnpm-lock\.yaml/);
  assert.match(scan.run, /--licenses="\$allow"/, "osv-scanner runs without the licence allow-list");
  assert.match(
    scan.run,
    /^allow="\$\(yq -e '\.allow \| join\(","\)' \.github\/licence-allowlist\.yaml\)"$/m,
    "the allow-list is not read from .github/licence-allowlist.yaml with yq -e",
  );
  assert.match(scan.run, /^test -n "\$allow"$/m, "an empty allow-list does not stop the step");
});

test("every licence entry in osv-scanner.toml is a reasoned, dated correction or exception", () => {
  const { allow } = parse(read(".github/licence-allowlist.yaml"));
  const licences = packageOverrides(read("osv-scanner.toml")).filter(
    (entry) => "license.override" in entry || "license.ignore" in entry,
  );
  assert.ok(licences.length > 0, "osv-scanner.toml has no licence entries");
  for (const entry of licences) {
    const label = `${entry.name}${entry.version ? `@${entry.version}` : ""}`;
    assert.equal(entry.ecosystem, "npm", `${label}: no ecosystem`);
    assert.ok(entry.reason?.length > 20, `${label}: no reason`);
    assert.match(
      entry.effectiveUntil ?? "",
      /^\d{4}-\d{2}-\d{2}$/,
      `${label}: no date to look again`,
    );
    assert.ok(
      !("license.override" in entry && "license.ignore" in entry),
      `${label}: both corrects and excepts its licence`,
    );
    if ("license.override" in entry) {
      for (const id of entry["license.override"]) {
        assert.ok(
          allow.includes(id),
          `${label}: corrected to ${id}, which is not on the allow-list`,
        );
      }
      if (!isOwn(entry.name)) {
        assert.match(
          entry.version ?? "",
          /^\d+\.\d+\.\d+$/,
          `${label}: a third-party correction names no version`,
        );
      }
    } else {
      assert.equal(entry["license.ignore"], true, `${label}: license.ignore is not true`);
      assert.match(entry.reason, /ruling|decision|ADR \d+/, `${label}: names no ruling or ADR`);
    }
  }
  assert.ok(
    !licences.some((entry) => entry.name === "buffers"),
    "buffers@0.1.1 has no licence and the ruling denies it (STA-2781)",
  );
});

test("Renovate waits a day, never automerges and lets only security fixes and our own packages skip the wait", () => {
  const config = renovateConfig();
  assert.ok(config.extends.includes("config:best-practices"));
  assert.equal(config.minimumReleaseAge, "1 day");
  assert.equal(config.internalChecksFilter, "strict");
  assert.equal(config.automerge, false);
  assert.equal(config.vulnerabilityAlerts.minimumReleaseAge, null);
  assert.equal(
    config.hostRules,
    undefined,
    "renovate.json5 carries hostRules; registry access is set in the app",
  );
  for (const rule of config.packageRules) {
    assert.notEqual(rule.automerge, true, `a package rule automerges: ${JSON.stringify(rule)}`);
    if (rule.minimumReleaseAge === null || rule.minimumReleaseAge === "0 days") {
      assert.ok(
        Array.isArray(rule.matchPackageNames) &&
          rule.matchPackageNames.every((name) => isOwn(name)),
        `a rule outside our own scopes skips the release age: ${JSON.stringify(rule.matchPackageNames)}`,
      );
    }
  }
});

test("the Renovate config check runs a pinned validator in strict mode", () => {
  const workflow = parse(read(".github/workflows/renovate-config.yml"));
  assert.ok(workflow.on.pull_request.paths.includes("renovate.json5"));
  const runs = workflow.jobs.validate.steps.map((step) => step.run ?? "").join("\n");
  assert.match(runs, /--package=renovate@\d+\.\d+\.\d+ -- renovate-config-validator --strict$/m);
});
