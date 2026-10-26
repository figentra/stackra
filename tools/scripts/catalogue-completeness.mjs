#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the catalogue-completeness gate, run by `pnpm validate` through validate-repository.mjs and on its own
 *          (`node tools/scripts/catalogue-completeness.mjs`). Per member and per locale, every lang file
 *          (`assets/lang/<locale>/<namespace>.json`) is checked against the English source: a base language misses no
 *          namespace and no key of `en`, no catalogue holds a key `en` lacks, a regional overlay (`ar-SA`, `es-US`)
 *          holds only keys `en` has, every message names the same ICU placeholders as its English source (a
 *          translated `{count}` or a dropped `{name}` breaks the message at runtime), and every file parses. The
 *          framework UI members ship all seven base languages (ar, en, fr, de, es, it, nl), since every product release
 *          needs them.
 *          Prints the findings and exits 1; prints nothing on success.
 * Scope: every git-listed `assets/lang` JSON file outside the scaffold templates. Keys and placeholders only: whether a
 *        message reads well is the native-speaker review (ADR 0192), not this gate.
 * Owner: code-standards-steward · Secrets: forbidden
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

/** The seven base languages every release ships (ADR 0403); `en` is the source of every catalogue. */
export const BASE_LANGUAGES = ["ar", "en", "fr", "de", "es", "it", "nl"];

/** The framework UI members whose catalogues ship in all seven base languages (ADR 0403). */
export const SEVEN_LANGUAGE_MEMBERS = [
  "packages/communication/notifications",
  "packages/design-system/ui",
  "packages/design-system/ui-pro",
  "packages/experience/panel",
  "packages/security/consent",
];

/** A lang file: the member root, the locale folder and the namespace. */
const LANG_FILE = /^(.+)\/assets\/lang\/([^/]+)\/([^/]+)\.json$/;

/**
 * The dotted key of every message in `catalogue`.
 * @param {unknown} catalogue - a parsed lang file
 * @param {string} [prefix] - the path so far
 * @returns {string[]}
 */
export function keysOf(catalogue, prefix = "") {
  if (typeof catalogue !== "object" || catalogue === null || Array.isArray(catalogue))
    return [prefix];
  return Object.entries(catalogue).flatMap(([key, value]) =>
    keysOf(value, prefix === "" ? key : `${prefix}.${key}`),
  );
}

/**
 * Each message of `catalogue` by its dotted key.
 * @param {unknown} catalogue - a parsed lang file
 * @param {string} [prefix] - the path so far
 * @returns {Map<string, unknown>}
 */
export function messagesOf(catalogue, prefix = "") {
  if (typeof catalogue !== "object" || catalogue === null || Array.isArray(catalogue))
    return new Map([[prefix, catalogue]]);
  return new Map(
    Object.entries(catalogue).flatMap(([key, value]) => [
      ...messagesOf(value, prefix === "" ? key : `${prefix}.${key}`),
    ]),
  );
}

/** The ICU argument types whose options are sub-messages. */
const OPTION_TYPES = new Set(["plural", "select", "selectordinal"]);

/**
 * The argument names an ICU message uses (`{name}`, `{count, plural, ...}`, nested ones inside options), sorted.
 * Quoted text (`'{literal}'`) and the plural `#` are not arguments. A message that does not parse gives `null`.
 * @param {string} message - an ICU MessageFormat string
 * @returns {string[] | null}
 */
export function placeholdersOf(message) {
  const names = new Set();
  let at = 0;
  const fail = () => {
    throw new SyntaxError("unbalanced ICU message");
  };
  const skipSpace = () => {
    while (at < message.length && /\s/.test(message[at])) at += 1;
  };
  /** Reads a message until an unmatched `}` (left unread) or the end. */
  const body = () => {
    while (at < message.length) {
      const char = message[at];
      if (char === "'") {
        const next = message[at + 1];
        if (next === "'") at += 2;
        else if (next === "{" || next === "}" || next === "#" || next === "|") {
          const close = message.indexOf("'", at + 1);
          at = close === -1 ? message.length : close + 1;
        } else at += 1;
      } else if (char === "{") {
        at += 1;
        argument();
      } else if (char === "}") return;
      else at += 1;
    }
  };
  /** Reads one argument after its `{`, through its `}`. */
  const argument = () => {
    const nameEnd = message.slice(at).search(/[,}]/);
    if (nameEnd === -1) fail();
    names.add(message.slice(at, at + nameEnd).trim());
    at += nameEnd;
    if (message[at] === "}") {
      at += 1;
      return;
    }
    at += 1;
    const typeEnd = message.slice(at).search(/[,}]/);
    if (typeEnd === -1) fail();
    const type = message.slice(at, at + typeEnd).trim();
    at += typeEnd;
    if (!OPTION_TYPES.has(type)) {
      // A number, date or time argument: its style may hold braces of its own.
      let depth = 1;
      while (at < message.length && depth > 0) {
        if (message[at] === "{") depth += 1;
        else if (message[at] === "}") depth -= 1;
        at += 1;
      }
      if (depth > 0) fail();
      return;
    }
    if (message[at] !== ",") fail();
    at += 1;
    for (;;) {
      skipSpace();
      if (message[at] === "}") {
        at += 1;
        return;
      }
      const selectorEnd = message.slice(at).search(/[\s{]/);
      if (selectorEnd <= 0) fail();
      const selector = message.slice(at, at + selectorEnd);
      at += selectorEnd;
      if (selector.startsWith("offset:")) continue;
      skipSpace();
      if (message[at] !== "{") fail();
      at += 1;
      body();
      if (message[at] !== "}") fail();
      at += 1;
    }
  };
  try {
    body();
    if (at < message.length) fail();
  } catch {
    return null;
  }
  return [...names].sort();
}

/**
 * Placeholder names as a finding writes them.
 * @param {readonly string[]} names
 * @returns {string}
 */
const listOf = (names) =>
  names.length === 0 ? "none" : names.map((name) => `{${name}}`).join(", ");

/**
 * The findings for the lang files among `files`.
 * @param {readonly string[]} files - repository-relative paths
 * @param {(path: string) => string} read - the text of a path
 * @returns {string[]}
 */
export function checkCatalogues(files, read) {
  const findings = [];
  /** @type {Map<string, Map<string, Map<string, Map<string, unknown>>>>} member → locale → namespace → messages */
  const members = new Map();
  for (const path of files) {
    const match = LANG_FILE.exec(path);
    if (match === null || path.startsWith("tools/scaffold/")) continue;
    const [, root, locale, namespace] = match;
    let keys;
    try {
      keys = messagesOf(JSON.parse(read(path)));
    } catch (error) {
      findings.push(`${path}: not valid JSON (${error instanceof Error ? error.message : error})`);
      continue;
    }
    const locales = members.get(root) ?? new Map();
    members.set(root, locales);
    const namespaces = locales.get(locale) ?? new Map();
    locales.set(locale, namespaces);
    namespaces.set(namespace, keys);
  }
  for (const [root, locales] of members) {
    const source = locales.get("en");
    if (source === undefined) {
      findings.push(
        `${root}/assets/lang: no en catalogue, the source every locale is checked against`,
      );
      continue;
    }
    if (SEVEN_LANGUAGE_MEMBERS.includes(root))
      for (const language of BASE_LANGUAGES)
        if (!locales.has(language))
          findings.push(
            `${root}/assets/lang/${language}: missing; this member ships all seven languages`,
          );
    for (const [locale, namespaces] of locales) {
      if (locale === "en") continue;
      const overlay = locale.includes("-");
      if (!overlay)
        for (const namespace of source.keys())
          if (!namespaces.has(namespace))
            findings.push(`${root}/assets/lang/${locale}/${namespace}.json: missing`);
      for (const [namespace, keys] of namespaces) {
        const file = `${root}/assets/lang/${locale}/${namespace}.json`;
        const english = source.get(namespace);
        if (english === undefined) {
          findings.push(`${file}: no en/${namespace}.json to translate from`);
          continue;
        }
        if (!overlay)
          for (const key of english.keys())
            if (!keys.has(key)) findings.push(`${file}: misses key ${key}`);
        for (const [key, message] of keys) {
          if (!english.has(key)) {
            findings.push(`${file}: key ${key} is not in en`);
            continue;
          }
          const sourceMessage = english.get(key);
          if (typeof message !== "string" || typeof sourceMessage !== "string") continue;
          const expected = placeholdersOf(sourceMessage);
          const found = placeholdersOf(message);
          if (found === null) findings.push(`${file}: key ${key} is not a valid ICU message`);
          else if (expected !== null && expected.join(",") !== found.join(","))
            findings.push(
              `${file}: key ${key} has placeholders ${listOf(found)}, en has ${listOf(expected)}`,
            );
        }
      }
    }
  }
  return findings;
}

/** Checks the repository's lang files. */
function main() {
  const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    cwd: ROOT,
    encoding: "utf8",
  })
    .split("\n")
    .filter((path) => LANG_FILE.test(path));
  const findings = checkCatalogues(files, (path) => readFileSync(join(ROOT, path), "utf8"));
  for (const finding of findings) console.error(finding);
  if (findings.length > 0) {
    console.error(`\n${findings.length} catalogue finding(s).`);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
