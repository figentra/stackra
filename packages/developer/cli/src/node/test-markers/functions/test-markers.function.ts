/**
 * Stackra file contract:
 * Purpose: `testMarkers(root, files?)`, every marker in the test files that keeps a test or suite from always running:
 *          a `skip`, `todo`, `fixme`, `fails`, `only`, `skipIf` or `runIf` anywhere in a `describe` / `it` / `test` /
 *          `suite` member chain (`it.concurrent.skip`, `describe.skipIf(cond)`, `it.skip.each(table)`), an `xit` /
 *          `xdescribe` / `xtest` call, and node:test's options (`test("t", { skip: … })`; `skip: true` is a `skip`,
 *          any other value a `skipIf`). Each marker carries the title its call names, so the review list keys it by
 *          `<file>` and title, not by a line that moves.
 * Boundary: reads the test files (`testFiles`); writes nothing. Markers are found in `maskCode` output, so one inside a
 *           comment or a string (a fixture) is not one.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4, the flaky-test quarantine); STA-2842.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { sorted } from "#node/functions/sorted.function";
import { maskCode } from "#node/test-markers/functions/mask-code.function";
import { testFiles } from "#node/test-markers/functions/test-files.function";
import type { TestMarker } from "#node/test-markers/types/test-marker.type";

/** The member names that are markers, as `TestMarker["kind"]`. */
const MARKER_NAMES: ReadonlySet<string> = new Set([
  "skip",
  "todo",
  "fixme",
  "fails",
  "only",
  "skipIf",
  "runIf",
]);

/** The chain members that take their own argument list before the test call (`.skipIf(cond)(title, …)`). */
const TAKES_ARGUMENTS: ReadonlySet<string> = new Set(["skipIf", "runIf", "each", "for"]);

/** A `describe` / `it` / `test` / `suite` member chain up to its first call, or an `x`-prefixed call. */
const CHAIN =
  /(?<![\w$.])(?:(describe|it|test|suite)((?:\s*\.\s*[A-Za-z]+)+)|x(?:describe|it|test)(?=\s*\())/g;

/** A plain `describe` / `it` / `test` / `suite` call, for node:test's options argument. */
const PLAIN_CALL = /(?<![\w$.])(?:describe|it|test|suite)\s*\(/g;

/** One `.member` step after a call, read at `lastIndex` (sticky). */
const MEMBER = /\.\s*([A-Za-z]*)/y;

/** The pairs that open and close a nesting level in masked code. */
const OPENERS: Readonly<Record<string, string>> = { "(": ")", "[": "]", "{": "}" };

/** The offset of the bracket that closes the one at `open` in `masked`, or the text's length. */
function closing(masked: string, open: number): number {
  const stack: string[] = [];
  for (let at = open; at < masked.length; at += 1) {
    const char = masked[at] ?? "";
    const closer = OPENERS[char];
    if (closer !== undefined) stack.push(closer);
    else if (char === stack.at(-1)) {
      stack.pop();
      if (stack.length === 0) return at;
    }
  }
  return masked.length;
}

/** The end (exclusive) of the argument starting at `start`: the next `,` or `)` at depth 0. */
function argumentEnd(masked: string, start: number): number {
  let at = start;
  while (at < masked.length) {
    const char = masked[at] ?? "";
    if (char === "," || char === ")") return at;
    at = OPENERS[char] === undefined ? at + 1 : closing(masked, at) + 1;
  }
  return masked.length;
}

/** The title an argument's source text names: a string literal's value, else the text itself. */
function titleOf(text: string): string {
  const literal = /^(["'`])([\s\S]*)\1$/.exec(text);
  if (literal === null) return text;
  const value = literal[2] ?? "";
  return literal[1] === "`" && value.includes("${") ? text : value;
}

/** The offset after the whitespace from `at`. */
function skipSpace(masked: string, at: number): number {
  let index = at;
  while (index < masked.length && /\s/.test(masked[index] ?? "")) index += 1;
  return index;
}

/** The 1-based line of `offset`. */
function lineOf(source: string, offset: number): number {
  let line = 1;
  for (let at = 0; at < offset; at += 1) if (source[at] === "\n") line += 1;
  return line;
}

/** The title of the test call that follows a member chain ending at `end` whose last member is `last`. */
function chainTitle(
  source: string,
  masked: string,
  end: number,
  last: string,
): { readonly title: string; readonly later?: TestMarker["kind"] } {
  let at = skipSpace(masked, end);
  let pending = TAKES_ARGUMENTS.has(last);
  let later: TestMarker["kind"] | undefined;
  while (at < masked.length) {
    if (masked[at] === "(" && pending) {
      at = skipSpace(masked, closing(masked, at) + 1);
      pending = false;
    } else if (masked[at] === "(") {
      const start = skipSpace(masked, at + 1);
      const title = titleOf(source.slice(start, argumentEnd(masked, start)).trim());
      return later === undefined ? { title } : { title, later };
    } else if (masked[at] === ".") {
      MEMBER.lastIndex = at;
      const member = MEMBER.exec(masked);
      const name = member?.[1] ?? "";
      if (later === undefined && MARKER_NAMES.has(name)) later = name as TestMarker["kind"];
      pending = TAKES_ARGUMENTS.has(name);
      at = skipSpace(masked, at + (member?.[0].length ?? 1));
    } else {
      break;
    }
  }
  return later === undefined ? { title: "" } : { title: "", later };
}

/** The markers of one file's source. */
function markersIn(file: string, source: string): TestMarker[] {
  const masked = maskCode(source);
  const markers: TestMarker[] = [];
  for (const match of masked.matchAll(CHAIN)) {
    const offset = match.index;
    const end = offset + match[0].length;
    if (match[1] === undefined) {
      const open = skipSpace(masked, end);
      const start = skipSpace(masked, open + 1);
      const title = titleOf(source.slice(start, argumentEnd(masked, start)).trim());
      markers.push({ file, line: lineOf(source, offset), kind: "skip", title });
      continue;
    }
    const names = (match[2] ?? "")
      .split(".")
      .map((name) => name.trim())
      .filter(Boolean);
    const { title, later } = chainTitle(source, masked, end, names.at(-1) ?? "");
    const kind = names.find((name) => MARKER_NAMES.has(name)) ?? later;
    if (kind !== undefined)
      markers.push({ file, line: lineOf(source, offset), kind: kind as TestMarker["kind"], title });
  }
  for (const match of masked.matchAll(PLAIN_CALL)) {
    const start = skipSpace(masked, match.index + match[0].length);
    const titleEnd = argumentEnd(masked, start);
    if (masked[titleEnd] !== ",") continue;
    const optionsAt = skipSpace(masked, titleEnd + 1);
    if (masked[optionsAt] !== "{") continue;
    const options = masked.slice(optionsAt, closing(masked, optionsAt) + 1);
    const option = /[{,]\s*(skip|todo|only)\s*:\s*([^,}]*)/.exec(options);
    if (option === null) continue;
    const value = (option[2] ?? "").trim();
    if (value === "false") continue;
    const kind: TestMarker["kind"] =
      option[1] === "skip"
        ? value === "true"
          ? "skip"
          : "skipIf"
        : (option[1] as "todo" | "only");
    const title = titleOf(source.slice(start, titleEnd).trim());
    markers.push({ file, line: lineOf(source, match.index), kind, title });
  }
  return sorted(markers, (left, right) => left.line - right.line);
}

/**
 * Every test marker of the checkout at `root`.
 *
 * @param root - the checkout root.
 * @param files - the test files to read (repository-relative); every test file when absent.
 * @example
 * testMarkers(root); // [{ file: "packages/…/queue-isolation.int.test.ts", line: 115, kind: "skipIf", title: "…" }]
 */
export function testMarkers(
  root: string,
  files: readonly string[] = testFiles(root),
): TestMarker[] {
  return files.flatMap((file) => markersIn(file, readFileSync(join(root, file), "utf8")));
}
