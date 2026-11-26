/**
 * Stackra file contract:
 * Purpose: hold `maskCode` to its contract: the inside of line and block comments, single- and double-quoted strings,
 *          template text and regular-expression literals turns into spaces while newlines, quotes, slashes and
 *          `${ … }` code stay, every character keeps its offset, and a `/` after a value divides instead of opening
 *          a regular expression.
 * Boundary: pure; no files.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (decision 4); STA-2842.
 */
import assert from "node:assert/strict";

import { test } from "@stackra/testing";

import { maskCode } from "#node/test-markers/functions/mask-code.function";

test("comments and strings are blanked, code and offsets are kept", () => {
  const source = "call(\"it.skip(\") // it.only(\n/* xit( */ next('x')";
  const masked = maskCode(source);
  assert.equal(masked.length, source.length);
  assert.equal(masked, "call(\"        \")            \n           next(' ')");
});

test("template text is blanked but the code inside ${ } stays", () => {
  const masked = maskCode('`a ${ it.skip("t") } b`');
  assert.equal(masked, '`  ${ it.skip(" ") }  `');
  assert.match(masked, /it\.skip\(/);
  assert.doesNotMatch(maskCode("`it.skip(`"), /skip/);
});

test("nested templates and braces inside ${ } keep their depth", () => {
  const masked = maskCode("`x ${ { a: `in ${1}` } } y` + z");
  assert.match(masked, /\{ a: `/);
  assert.match(masked, /\+ z$/);
  assert.doesNotMatch(masked, /in|x |y`/);
});

test("a regular expression is blanked, a division is not", () => {
  assert.equal(maskCode("const r = /it.skip(/;"), "const r = /        /;");
  assert.equal(maskCode("return /a/.test(s)"), "return / /.test(s)");
  assert.equal(maskCode("const n = a / b / c;"), "const n = a / b / c;");
  assert.equal(maskCode("x = /[/]x/g"), "x = /    /g");
});

test("escapes inside strings do not end them", () => {
  assert.equal(maskCode('"a\\"b" + c'), '"    " + c');
  assert.equal(maskCode("'it\\'s' ; d"), "'     ' ; d");
});
