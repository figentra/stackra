/**
 * Stackra file contract:
 * Purpose: hold the flaky-test quarantine check (`testMarkerFindings`) to its contract: an unlisted marker, a committed
 *          `only`, a marker with no title, a `skip` listed as an environment gate, a gate without its reason, a
 *          quarantine without its issue, reason or a valid `until`, one past its `until` or more than
 *          `QUARANTINE_MAX_DAYS` days out, a marker listed twice, a listed entry no marker matches and a list that does
 *          not parse are findings; a listed gate with its reason and a quarantine in date are not; the shipped list
 *          covers every marker of this checkout (dates aside, which the
 *          repository gate checks on the day it runs).
 * Boundary: writes fixture trees into temp directories; the last test reads this checkout.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (decision 4); STA-2842.
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { test } from "@stackra/testing";

import { QUARANTINE_MAX_DAYS } from "#node/test-markers/constants/quarantine-max-days.constant";
import { TEST_MARKERS_LIST_FILE } from "#node/test-markers/constants/test-markers-list-file.constant";
import { testMarkerFindings } from "#node/test-markers/functions/test-marker-findings.function";

/** The day the fixtures are checked on. */
const TODAY = new Date("2026-11-26T12:00:00Z");

/** The fixture test file. */
const FILE = "packages/a/src/__tests__/a.test.ts";

/** A temp repository with one test file holding `source` and the review list `markerList` (omitted when undefined). */
function repository(source: string, markerList?: string): string {
  const root = mkdtempSync(join(tmpdir(), "test-marker-findings-"));
  const files: Record<string, string> = { [FILE]: source };
  if (markerList !== undefined) files[TEST_MARKERS_LIST_FILE] = markerList;
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}

/** The finding texts of `source` against `markerList`. */
function findings(source: string, markerList?: string): string[] {
  return testMarkerFindings(repository(source, markerList), TODAY).map(
    ({ dir, text }) => `${dir}: ${text}`,
  );
}

/** A list quarantining "flaky" in the fixture file with `fields`. */
function quarantined(fields: string): string {
  return `quarantine:\n  ${FILE}:\n    flaky:\n${fields}`;
}

test("an unlisted marker is a finding, a test with no marker is not", () => {
  assert.deepEqual(findings('it("runs", () => {});'), []);
  const [skip] = findings('it.skip("flaky", () => {});');
  assert.match(
    skip ?? "",
    /a\.test\.ts: skip "flaky" \(line 1\) is not in tools\/scripts\/test-markers\.yaml: quarantine it/,
  );
  const [gate] = findings('it.skipIf(ci)("gated", () => {});');
  assert.match(gate ?? "", /skipIf "gated" .* list it under gates with the reason/);
});

test("a committed only and a marker with no title are findings whatever the list says", () => {
  assert.deepEqual(
    findings('describe.only("c", () => {});', `gates:\n  ${FILE}:\n    c: why`).slice(0, 1),
    [`${FILE}: line 1: .only runs this test alone and skips the rest: remove it before committing`],
  );
  assert.deepEqual(findings("it.todo();"), [
    `${FILE}: line 1: the .todo marker names no title to list it by`,
  ]);
});

test("a gate with its reason passes; a gate without one or a skip listed as a gate does not", () => {
  const gated = 'describe.skipIf(!url)("needs postgres", () => {});';
  assert.deepEqual(
    findings(gated, `gates:\n  ${FILE}:\n    needs postgres: runs where DATABASE_URL is set`),
    [],
  );
  assert.match(
    findings(gated, `gates:\n  ${FILE}:\n    needs postgres: ""`)[0] ?? "",
    /needs its reason/,
  );
  assert.match(
    findings(
      'it.skip("needs postgres", () => {});',
      `gates:\n  ${FILE}:\n    needs postgres: a reason`,
    )[0] ?? "",
    /is not an environment gate: quarantine it/,
  );
});

test("a quarantine in date with its issue and reason passes, any day up to the limit", () => {
  const source = 'it.skip("flaky", () => {});';
  assert.deepEqual(
    findings(
      source,
      quarantined(
        "      issue: STA-2842\n      reason: races the clock\n      until: 2026-11-26\n",
      ),
    ),
    [],
  );
  const latest = new Date(TODAY.getTime() + QUARANTINE_MAX_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 10);
  assert.deepEqual(
    findings(
      source,
      quarantined(`      issue: STA-2842\n      reason: r\n      until: "${latest}"\n`),
    ),
    [],
  );
});

test("an ended, too-long or undated quarantine is a finding", () => {
  const source = 'it.fails("flaky", () => {});';
  assert.match(
    findings(
      source,
      quarantined("      issue: STA-1\n      reason: r\n      until: 2026-11-25\n"),
    )[0] ?? "",
    /ended on 2026-11-25: fix the test and remove its marker, or renew the date/,
  );
  assert.match(
    findings(
      source,
      quarantined("      issue: STA-1\n      reason: r\n      until: 2026-12-27\n"),
    )[0] ?? "",
    /runs to 2026-12-27, past 2026-12-26: a quarantine lasts at most 30 days/,
  );
  assert.match(
    findings(
      source,
      quarantined("      issue: STA-1\n      reason: r\n      until: 2026-02-30\n"),
    )[0] ?? "",
    /needs an until date/,
  );
});

test("a quarantine without an issue key or a reason is a finding", () => {
  const texts = findings(
    'it.skip("flaky", () => {});',
    quarantined("      issue: soon\n      until: 2026-12-01\n"),
  );
  assert.equal(texts.length, 2);
  assert.match(texts[0] ?? "", /needs its Linear issue key/);
  assert.match(texts[1] ?? "", /needs its reason/);
  assert.match(
    findings('it.skip("flaky", () => {});', quarantined(""))[0] ?? "",
    /needs issue, reason and until/,
  );
});

test("a marker listed under both sections, and an entry no marker matches, are findings", () => {
  const both = `gates:\n  ${FILE}:\n    flaky: r\n${quarantined("      issue: STA-1\n      reason: r\n      until: 2026-12-01\n")}`;
  assert.match(
    findings('it.skipIf(x)("flaky", () => {});', both)[0] ?? "",
    /listed under both gates and quarantine/,
  );
  assert.deepEqual(
    findings(
      'it("flaky", () => {});',
      quarantined("      issue: STA-1\n      reason: r\n      until: 2026-12-01\n"),
    ),
    [
      `${TEST_MARKERS_LIST_FILE}: quarantine lists "flaky" in ${FILE}, but no marker there names it any more: remove the entry`,
    ],
  );
});

test("a list that does not parse or is not a map is one finding", () => {
  assert.match(
    findings('it.skip("a", () => {});', "gates: [")[0] ?? "",
    /test-markers\.yaml: does not parse/,
  );
  assert.deepEqual(findings('it.skip("a", () => {});', "- a\n"), [
    `${TEST_MARKERS_LIST_FILE}: must be a map with gates and quarantine`,
  ]);
});

test("every marker of this checkout is in the shipped list with its reason and issue", () => {
  // The dates are left to `stackra validate --repository`: this test must not start failing on the day one ends.
  const root = fileURLToPath(new URL("../../../../../../../../", import.meta.url));
  const dated = /ended on|runs to/;
  assert.deepEqual(
    testMarkerFindings(root).filter(({ text }) => !dated.test(text)),
    [],
  );
});
