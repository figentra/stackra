#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `node tools/scripts/squawk-baseline.mjs --baseline <file.jsonc> [--base <file>] [--root <dir>] <report.json>...`
 *          (STA-2788): the verdict of the Quality Gate's "Migration lint (Squawk)" step over Squawk's JSON reports
 *          (`--reporter json`). A finding passes only when the baseline lists its file, by exact path, with that file's
 *          SHA-256 and the finding's rule. The baseline holds the findings of compiled migrations that are frozen once
 *          applied (ADR 0159), so they are waived only as committed: the step fails when a listed file's hash changes or
 *          the file is missing, when an entry or one of its rules matches no finding (the list never goes stale), when
 *          the base revision's list lacks an entry or rule (the list only shrinks), and on any other finding: every new
 *          file is linted in full.
 * Boundary: reads the baseline, the base baseline, the reports and the listed files; writes nothing. Node built-ins
 *           only, so stackra/verify's judge image runs it as main's tool with no install; the baseline is JSONC (`//`
 *           and block comments, no trailing comma), read by `parseJsonc`. A baseline path is exact:
 *           a glob, a folder, `..` or an absolute path is refused, and `syntax-error` is never waived.
 * Runtime: node (CI)
 * Governing contract: ADR 0159 (decision 3: Squawk lints the compiled stream); STA-2788 (the CTO's SHA-256-pinned
 *                     baseline).
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** An exact repository-relative path to a compiled `.sql` file: no glob, folder, `..` or absolute path. */
const EXACT_PATH =
  /^(?!\/)(?!.*(?:^|\/)\.\.?(?:\/|$))[A-Za-z0-9@_.-]+(?:\/[A-Za-z0-9@_.-]+)*\.sql$/;

/** A Squawk rule id. */
const RULE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

/** A lowercase hex SHA-256. */
const SHA256 = /^[0-9a-f]{64}$/;

/** The rule a broken file reports; never waivable. */
const SYNTAX_ERROR = "syntax-error";

/** The first character of `text` from `start` that is neither whitespace nor inside a comment, or "" at the end. */
function nextSignificant(text, start) {
  let j = start;
  while (j < text.length) {
    if (/\s/.test(text[j])) j += 1;
    else if (text.startsWith("//", j)) {
      const end = text.indexOf("\n", j);
      j = end === -1 ? text.length : end;
    } else if (text.startsWith("/*", j)) {
      const end = text.indexOf("*/", j + 2);
      j = end === -1 ? text.length : end + 2;
    } else return text[j];
  }
  return "";
}

/**
 * `text` parsed as JSONC, as oxfmt writes it: JSON with `//` and block comments outside strings (they become spaces)
 * and a trailing comma before `}` or `]` (dropped). Anything else JSON refuses still throws.
 *
 * @param text - the document.
 */
export function parseJsonc(text) {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    if (char === '"') {
      let end = i + 1;
      while (end < text.length && text[end] !== '"') end += text[end] === "\\" ? 2 : 1;
      out += text.slice(i, end + 1);
      i = end + 1;
    } else if (char === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i += 1;
    } else if (char === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      if (end === -1) throw new SyntaxError("an unterminated block comment");
      out += text.slice(i, end + 2).replaceAll(/[^\n]/g, " ");
      i = end + 2;
    } else if (char === "," && "}]".includes(nextSignificant(text, i + 1))) {
      i += 1;
    } else {
      out += char;
      i += 1;
    }
  }
  return JSON.parse(out);
}

/** The SHA-256 of `bytes`, lowercase hex. */
export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** `path` as Squawk reports it (a leading `./` dropped). */
export const normalizePath = (path) => path.replace(/^(?:\.\/)+/, "");

/**
 * The baseline document's entries, or throws with every problem: the shape, a non-exact path (a glob, a folder),
 * a bad hash, an unknown or waived `syntax-error` rule, a missing reason, and a duplicate path or rule.
 *
 * @param document - the parsed baseline JSON.
 * @param source - where it came from, for the messages.
 */
export function parseBaseline(document, source = "baseline") {
  const problems = [];
  if (typeof document !== "object" || document === null || !Array.isArray(document.entries))
    throw new Error(`${source}: expected an object with an "entries" array`);
  const seen = new Set();
  const entries = document.entries.map((entry, index) => {
    const at = `${source}: entries[${index}]`;
    if (typeof entry !== "object" || entry === null) {
      problems.push(`${at}: expected an object`);
      return undefined;
    }
    const keys = Object.keys(entry).filter(
      (key) => !["path", "sha256", "rules", "reason"].includes(key),
    );
    if (keys.length > 0) problems.push(`${at}: unknown key(s) ${keys.join(", ")}`);
    const { path, sha256: hash, rules, reason } = entry;
    if (typeof path !== "string" || !EXACT_PATH.test(path))
      problems.push(
        `${at}: path ${JSON.stringify(path)} is not one exact repository-relative .sql file (no glob, folder, "..", "./" or absolute path)`,
      );
    else if (seen.has(path)) problems.push(`${at}: ${path} is listed twice`);
    else seen.add(path);
    if (typeof hash !== "string" || !SHA256.test(hash))
      problems.push(`${at}: sha256 must be 64 lowercase hex digits`);
    if (!Array.isArray(rules) || rules.length === 0)
      problems.push(`${at}: rules must be a non-empty array of Squawk rule ids`);
    else {
      for (const rule of rules)
        if (typeof rule !== "string" || !RULE.test(rule))
          problems.push(`${at}: ${JSON.stringify(rule)} is not a Squawk rule id`);
        else if (rule === SYNTAX_ERROR) problems.push(`${at}: ${SYNTAX_ERROR} is never waived`);
      if (new Set(rules).size !== rules.length) problems.push(`${at}: a rule is listed twice`);
    }
    if (typeof reason !== "string" || reason.trim() === "" || reason.includes("\n"))
      problems.push(`${at}: reason must be one non-empty line`);
    return { path, sha256: hash, rules, reason };
  });
  if (problems.length > 0) throw new Error(problems.join("\n"));
  return entries;
}

/**
 * The findings of Squawk JSON reports, each `{ file, line, rule, message }` (`line` 1-based), or throws when a report
 * is not Squawk's JSON array (a crash, or "Failed to find files").
 *
 * @param reports - each report's text and name.
 */
export function parseReports(reports) {
  return reports.flatMap(({ name, text }) => {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(`${name}: not Squawk's JSON report (did squawk run with --reporter json?)`);
    }
    if (!Array.isArray(parsed))
      throw new Error(`${name}: not Squawk's JSON report (expected an array)`);
    return parsed.map((finding, index) => {
      if (
        typeof finding?.file !== "string" ||
        typeof finding.rule_name !== "string" ||
        typeof finding.line !== "number"
      )
        throw new Error(`${name}: finding ${index} has no file, line or rule_name`);
      return {
        file: normalizePath(finding.file),
        line: finding.line + 1,
        rule: finding.rule_name,
        message: String(finding.message ?? ""),
      };
    });
  });
}

/**
 * The gate's verdict: the findings the baseline waives and every problem that fails the step.
 *
 * @param input - `entries` (the baseline), `findings` (Squawk's), `read` (a listed file's bytes, or undefined when it
 *                is missing) and `base` (the base revision's entries, or undefined when it has no baseline).
 */
export function judge({ entries, findings, read, base }) {
  const problems = [];
  const byPath = new Map(entries.map((entry) => [entry.path, entry]));
  for (const entry of entries) {
    const bytes = read(entry.path);
    if (bytes === undefined) problems.push(`${entry.path}: listed in the baseline but missing`);
    else if (sha256(bytes) !== entry.sha256)
      problems.push(
        `${entry.path}: its SHA-256 is ${sha256(bytes)}, not the baseline's ${entry.sha256}; a waived file never changes (ADR 0159), so fix it in a new migration and drop its entry`,
      );
  }
  const used = new Set();
  const unwaived = [];
  let waived = 0;
  for (const finding of findings) {
    const entry = byPath.get(finding.file);
    if (entry !== undefined && entry.rules.includes(finding.rule)) {
      used.add(`${entry.path}\0${finding.rule}`);
      waived += 1;
    } else unwaived.push(finding);
  }
  for (const entry of entries)
    for (const rule of entry.rules)
      if (!used.has(`${entry.path}\0${rule}`))
        problems.push(
          `${entry.path}: the baseline waives ${rule}, which Squawk no longer reports there; remove it from the baseline`,
        );
  if (base !== undefined) {
    const before = new Map(base.map((entry) => [entry.path, new Set(entry.rules)]));
    for (const entry of entries) {
      const rules = before.get(entry.path);
      if (rules === undefined)
        problems.push(
          `${entry.path}: not in the base revision's baseline; the baseline only shrinks`,
        );
      else
        for (const rule of entry.rules)
          if (!rules.has(rule))
            problems.push(
              `${entry.path}: ${rule} is not waived in the base revision's baseline; the baseline only shrinks`,
            );
    }
  }
  for (const finding of unwaived)
    problems.push(`${finding.file}:${finding.line}: ${finding.rule}: ${finding.message}`);
  return { problems, unwaived, waived };
}

/** `{ baseline, base, root, reports }` from the arguments, or throws on a wrong shape. */
export function parseArgs(args) {
  const reports = [];
  const flags = { "--baseline": undefined, "--base": undefined, "--root": "." };
  let complete = true;
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] in flags) {
      const value = args[(i += 1)];
      if (value === undefined || value.startsWith("--")) complete = false;
      flags[args[i - 1]] = value;
    } else if (args[i].startsWith("--")) complete = false;
    else reports.push(args[i]);
  }
  const { "--baseline": baseline, "--base": base, "--root": root } = flags;
  if (!complete || baseline === undefined)
    throw new Error(
      "usage: squawk-baseline.mjs --baseline <file> [--base <file>] [--root <dir>] <report.json>...",
    );
  return { baseline, base, root, reports };
}

/** Runs the gate over the arguments and returns its exit code, writing to `out` and `err`. */
export function main(args, { out = process.stdout, err = process.stderr } = {}) {
  try {
    const { baseline, base, root, reports } = parseArgs(args);
    const entries = parseBaseline(parseJsonc(readFileSync(baseline, "utf8")), baseline);
    const baseEntries =
      base === undefined ? undefined : parseBaseline(parseJsonc(readFileSync(base, "utf8")), base);
    const findings = parseReports(
      reports.map((name) => ({ name, text: readFileSync(name, "utf8") })),
    );
    const { problems, unwaived, waived } = judge({
      entries,
      findings,
      base: baseEntries,
      read: (path) => (existsSync(join(root, path)) ? readFileSync(join(root, path)) : undefined),
    });
    for (const finding of unwaived)
      out.write(
        `::error file=${finding.file},line=${finding.line},title=Squawk ${finding.rule}::${finding.message}\n`,
      );
    for (const problem of problems) err.write(`squawk-baseline: ${problem}\n`);
    out.write(
      `squawk-baseline: ${findings.length} finding(s), ${waived} waived by ${entries.length} pinned file(s), ${problems.length} problem(s)\n`,
    );
    return problems.length === 0 ? 0 : 1;
  } catch (error) {
    err.write(`squawk-baseline: ${error instanceof Error ? error.message : String(error)}\n`);
    return 2;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  process.exitCode = main(process.argv.slice(2));
