import assert from "node:assert/strict";
import { test } from "node:test";

import {
  BASE_LANGUAGES,
  checkCatalogues,
  keysOf,
  SEVEN_LANGUAGE_MEMBERS,
} from "../catalogue-completeness.mjs";

/** A reader over `files`, a map of path to parsed content (a string is returned as written). */
const readerOf = (files) => (path) =>
  typeof files[path] === "string" ? files[path] : JSON.stringify(files[path]);

/** Runs the check over `files`. */
const check = (files) => checkCatalogues(Object.keys(files), readerOf(files));

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
          return error.message;
        }
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
