/**
 * Stackra file contract:
 * Purpose: unit tests of the catalogue-completeness gate (`checkCatalogues`, `keysOf`, `placeholdersOf`), moved from
 *          tools/scripts/__tests__/catalogue-completeness.test.mjs with their cases unchanged.
 * Boundary: test only; catalogues are inline maps, no disk.
 * Runtime: node (vitest)
 * Governing contract: ADR 0403; ADR 0022 (test placement).
 */
import assert from "node:assert/strict";

import { test } from "@stackra/testing";

import { BASE_LANGUAGES } from "#node/constants/base-languages.constant";
import { SEVEN_LANGUAGE_MEMBERS } from "#node/constants/seven-language-members.constant";
import { checkCatalogues } from "#node/functions/check-catalogues.function";
import { keysOf } from "#node/functions/keys-of.function";
import { placeholdersOf } from "#node/functions/placeholders-of.function";

/** A reader over `files`, a map of path to parsed content (a string is returned as written). */
const readerOf =
  (files: Record<string, unknown>) =>
  (path: string): string => {
    const value = files[path];
    return typeof value === "string" ? value : JSON.stringify(value);
  };

/** Runs the check over `files`. */
const check = (files: Record<string, unknown>): string[] =>
  checkCatalogues(Object.keys(files), readerOf(files));

const EN = { banner: { title: "Cookies", accept: "Accept" }, retry: "Try again" };

test("keysOf lists every message path", () => {
  assert.deepEqual(keysOf(EN), ["banner.title", "banner.accept", "retry"]);
});

test("a complete set of catalogues has no finding", () => {
  assert.deepEqual(
    check({
      "packages/a/x/assets/lang/en/x.json": EN,
      "packages/a/x/assets/lang/fr/x.json": {
        banner: { title: "Cookies", accept: "Accepter" },
        retry: "Réessayer",
      },
      "packages/a/x/assets/lang/en-US/x.json": { retry: "Retry" },
      "packages/a/x/src/core/data.json": { not: "a catalogue" },
    }),
    [],
  );
});

test("a base language that misses a key or a namespace fails, per locale", () => {
  assert.deepEqual(
    check({
      "packages/a/x/assets/lang/en/x.json": EN,
      "packages/a/x/assets/lang/en/y.json": { one: "One" },
      "packages/a/x/assets/lang/nl/x.json": { banner: { title: "Cookies" }, retry: "Opnieuw" },
      "packages/a/x/assets/lang/nl/y.json": { one: "Een" },
      "packages/a/x/assets/lang/it/x.json": EN,
    }),
    [
      "packages/a/x/assets/lang/nl/x.json: misses key banner.accept",
      "packages/a/x/assets/lang/it/y.json: missing",
    ],
  );
});

test("a key en lacks, a namespace without en, a missing en and bad JSON fail", () => {
  assert.deepEqual(
    check({
      "packages/a/x/assets/lang/en/x.json": EN,
      "packages/a/x/assets/lang/es-US/x.json": { extra: "Extra" },
      "packages/a/x/assets/lang/es-US/z.json": { a: "A" },
      "packages/b/y/assets/lang/ar/y.json": { a: "أ" },
      "packages/c/z/assets/lang/en/z.json": "{ not json",
      "tools/scaffold/templates/packages/package/assets/lang/de/p.json": { a: "A" },
    }).sort(),
    [
      "packages/a/x/assets/lang/es-US/x.json: key extra is not in en",
      "packages/a/x/assets/lang/es-US/z.json: no en/z.json to translate from",
      "packages/b/y/assets/lang: no en catalogue, the source every locale is checked against",
      `packages/c/z/assets/lang/en/z.json: not valid JSON (${(() => {
        try {
          JSON.parse("{ not json");
        } catch (error) {
          return (error as Error).message;
        }
        return "";
      })()})`,
    ].sort(),
  );
});

test("a framework UI member ships all seven base languages", () => {
  const [member] = SEVEN_LANGUAGE_MEMBERS;
  const files = Object.fromEntries(
    BASE_LANGUAGES.filter((language) => language !== "nl").map((language) => [
      `${member}/assets/lang/${language}/n.json`,
      { a: "A" },
    ]),
  );
  assert.deepEqual(check(files), [
    `${member}/assets/lang/nl: missing; this member ships all seven languages`,
  ]);
  assert.equal(BASE_LANGUAGES.length, 7);
});

test("placeholdersOf names every ICU argument, nested ones too, and nothing else", () => {
  assert.deepEqual(placeholdersOf("Remove filter {label}"), ["label"]);
  assert.deepEqual(
    placeholdersOf("{count, plural, =0 {None} one {# item of {owner}} other {# items}}"),
    ["count", "owner"],
  );
  assert.deepEqual(placeholdersOf("Quote '{this}' and {that}"), ["that"]);
  assert.deepEqual(placeholdersOf("{total, number, ::currency/EUR}"), ["total"]);
  assert.deepEqual(placeholdersOf("Plain text"), []);
  assert.equal(placeholdersOf("{count, plural, one {x}"), null);
});

test("a translation that renames, drops or breaks a placeholder fails", () => {
  const en = { remove: "Remove {name}", count: "{count, plural, one {# row} other {# rows}}" };
  assert.deepEqual(
    check({
      "packages/a/x/assets/lang/en/x.json": en,
      "packages/a/x/assets/lang/de/x.json": {
        remove: "{Name} entfernen",
        count: "{count, plural, one {# Zeile} other {# Zeilen}}",
      },
      "packages/a/x/assets/lang/fr/x.json": { remove: "Retirer", count: "{count, plural, one {#}" },
      "packages/a/x/assets/lang/es-US/x.json": { remove: "Quitar {name}" },
    }),
    [
      "packages/a/x/assets/lang/de/x.json: key remove has placeholders {Name}, en has {name}",
      "packages/a/x/assets/lang/fr/x.json: key remove has placeholders none, en has {name}",
      "packages/a/x/assets/lang/fr/x.json: key count is not a valid ICU message",
    ],
  );
});
