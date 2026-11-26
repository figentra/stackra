/**
 * Stackra file contract:
 * Purpose: `testMarkerFindings(root, today?, markers?)`, the flaky-test quarantine check of `stackra validate
 *          --repository`: every test marker (`testMarkers`) must be in the review list (`TEST_MARKERS_LEDGER_FILE`),
 *          so no test stops running unseen. An environment gate (`skipIf` / `runIf`) is listed under `gates` with the
 *          reason it only runs there; any marker may be listed under `quarantine` with its Linear issue, a reason and
 *          an `until` date (YYYY-MM-DD) at most `QUARANTINE_MAX_DAYS` days out. Findings: a committed `only`; a marker
 *          with no title to list it by; an unlisted marker; a `skip` / `todo` / `fixme` / `fails` listed as a gate; a
 *          gate or quarantine without its reason; a quarantine without an issue key, past its `until` or too far out; a
 *          marker listed under both; a listed entry no marker matches any more; and a list that does not parse.
 * Boundary: reads the test files and the review list; writes nothing. The list keys a marker by its test file and the
 *           title its call names. Dates compare as UTC calendar days.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4, the flaky-test quarantine); STA-2842.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { parse } from "yaml";

import { QUARANTINE_MAX_DAYS } from "#node/test-markers/constants/quarantine-max-days.constant";
import { TEST_MARKERS_LEDGER_FILE } from "#node/test-markers/constants/test-markers-ledger-file.constant";
import { testMarkers } from "#node/test-markers/functions/test-markers.function";
import type { TestMarker } from "#node/test-markers/types/test-marker.type";
import type { DirFinding } from "#node/types/dir-finding.type";

/** One quarantined test as the list holds it. */
type Quarantine = { readonly issue?: unknown; readonly reason?: unknown; readonly until?: unknown };

/** The review list: per section, test file to title to the reason (gates) or the quarantine. */
type Ledger = {
  readonly gates: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  readonly quarantine: Readonly<Record<string, Readonly<Record<string, Quarantine>>>>;
};

/** A Linear issue key (`STA-2842`). */
const ISSUE_KEY = /^[A-Z][A-Z0-9]*-\d+$/;

/** The markers an environment gate is written with. */
const GATE_KINDS: ReadonlySet<TestMarker["kind"]> = new Set(["skipIf", "runIf"]);

/** Whether `value` is a plain object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A section of the list: test file to title to entry, keeping only object-shaped files. */
function sectionOf<T>(value: unknown): Record<string, Record<string, T>> {
  if (!isRecord(value)) return {};
  const section: Record<string, Record<string, T>> = {};
  for (const [file, entries] of Object.entries(value))
    if (isRecord(entries)) section[file] = entries as Record<string, T>;
  return section;
}

/** The review list at `root`, or the finding that it does not parse. */
function readLedger(root: string): Ledger | DirFinding {
  const path = join(root, TEST_MARKERS_LEDGER_FILE);
  if (!existsSync(path)) return { gates: {}, quarantine: {} };
  let value: unknown;
  try {
    value = parse(readFileSync(path, "utf8")) ?? {};
  } catch (error) {
    return {
      dir: TEST_MARKERS_LEDGER_FILE,
      text: `does not parse: ${(error as Error).message.split("\n")[0]}`,
    };
  }
  if (!isRecord(value))
    return { dir: TEST_MARKERS_LEDGER_FILE, text: "must be a map with gates and quarantine" };
  return {
    gates: sectionOf(value["gates"]),
    quarantine: sectionOf<Quarantine>(value["quarantine"]),
  };
}

/** `date` as a UTC calendar day (YYYY-MM-DD). */
function dayOf(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** An `until` value as a calendar day, or undefined when it is not one. */
function untilDay(value: unknown): string | undefined {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : dayOf(value);
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && dayOf(parsed) === value ? value : undefined;
}

/** Whether `value` is a non-empty string. */
function filled(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

/** The findings of one quarantine entry. */
function quarantineFindings(marker: TestMarker, entry: unknown, today: Date): DirFinding[] {
  const at = { dir: marker.file };
  const name = `"${marker.title}" (line ${marker.line})`;
  if (!isRecord(entry))
    return [{ ...at, text: `the quarantine of ${name} needs issue, reason and until` }];
  const findings: DirFinding[] = [];
  if (typeof entry["issue"] !== "string" || !ISSUE_KEY.test(entry["issue"]))
    findings.push({
      ...at,
      text: `the quarantine of ${name} needs its Linear issue key (issue: STA-123)`,
    });
  if (!filled(entry["reason"]))
    findings.push({ ...at, text: `the quarantine of ${name} needs its reason` });
  const until = untilDay(entry["until"]);
  const latest = dayOf(new Date(today.getTime() + QUARANTINE_MAX_DAYS * 86_400_000));
  if (until === undefined)
    findings.push({ ...at, text: `the quarantine of ${name} needs an until date (YYYY-MM-DD)` });
  else if (until < dayOf(today))
    findings.push({
      ...at,
      text: `the quarantine of ${name} ended on ${until}: fix the test and remove its marker, or renew the date under its issue`,
    });
  else if (until > latest)
    findings.push({
      ...at,
      text: `the quarantine of ${name} runs to ${until}, past ${latest}: a quarantine lasts at most ${QUARANTINE_MAX_DAYS} days before it is renewed`,
    });
  return findings;
}

/** The findings of one marker against the list; marks the entries it matched in `seen`. */
function markerFindings(
  marker: TestMarker,
  ledger: Ledger,
  today: Date,
  seen: Set<string>,
): DirFinding[] {
  const at = { dir: marker.file };
  const name = `${marker.kind} "${marker.title}" (line ${marker.line})`;
  if (marker.kind === "only")
    return [
      {
        ...at,
        text: `line ${marker.line}: .only runs this test alone and skips the rest: remove it before committing`,
      },
    ];
  if (marker.title === "")
    return [
      {
        ...at,
        text: `line ${marker.line}: the .${marker.kind} marker names no title to list it by`,
      },
    ];
  const gate = ledger.gates[marker.file]?.[marker.title];
  const quarantine = ledger.quarantine[marker.file]?.[marker.title];
  if (gate !== undefined) seen.add(`gates\0${marker.file}\0${marker.title}`);
  if (quarantine !== undefined) seen.add(`quarantine\0${marker.file}\0${marker.title}`);
  if (gate !== undefined && quarantine !== undefined)
    return [
      {
        ...at,
        text: `${name} is listed under both gates and quarantine in ${TEST_MARKERS_LEDGER_FILE}: keep one`,
      },
    ];
  if (quarantine !== undefined) return quarantineFindings(marker, quarantine, today);
  if (gate !== undefined) {
    if (!GATE_KINDS.has(marker.kind))
      return [
        {
          ...at,
          text: `${name} is not an environment gate: quarantine it with its Linear issue, reason and until date`,
        },
      ];
    return filled(gate)
      ? []
      : [{ ...at, text: `the gate ${name} needs its reason in ${TEST_MARKERS_LEDGER_FILE}` }];
  }
  return [
    {
      ...at,
      text: GATE_KINDS.has(marker.kind)
        ? `${name} is not in ${TEST_MARKERS_LEDGER_FILE}: list it under gates with the reason it only runs there, or under quarantine with its issue`
        : `${name} is not in ${TEST_MARKERS_LEDGER_FILE}: quarantine it with its Linear issue, reason and until date (at most ${QUARANTINE_MAX_DAYS} days out)`,
    },
  ];
}

/**
 * The quarantine findings of the checkout at `root`.
 *
 * @param root - the checkout root.
 * @param today - the day quarantine dates are checked against.
 * @param markers - the markers to check; every test marker of the checkout when absent.
 * @example
 * testMarkerFindings(root); // [] when every marker is listed and no quarantine has ended
 */
export function testMarkerFindings(
  root: string,
  today: Date = new Date(),
  markers: readonly TestMarker[] = testMarkers(root),
): DirFinding[] {
  const ledger = readLedger(root);
  if ("dir" in ledger) return [ledger];
  const seen = new Set<string>();
  const findings = markers.flatMap((marker) => markerFindings(marker, ledger, today, seen));
  for (const section of ["gates", "quarantine"] as const)
    for (const [file, entries] of Object.entries(ledger[section]))
      for (const title of Object.keys(entries))
        if (!seen.has(`${section}\0${file}\0${title}`))
          findings.push({
            dir: TEST_MARKERS_LEDGER_FILE,
            text: `${section} lists "${title}" in ${file}, but no marker there names it any more: remove the entry`,
          });
  return findings;
}
