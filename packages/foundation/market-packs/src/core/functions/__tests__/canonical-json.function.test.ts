/**
 * Stackra file contract:
 * Purpose: unit tests of `canonicalJson`: keys sorted at every depth, arrays kept in order, undefined properties left out.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. Pack
 *           data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370.
 */
import { describe, expect, it } from "@stackra/testing";

import { canonicalJson } from "#core/functions/canonical-json.function";

describe("canonicalJson", () => {
  it("sorts keys at every depth and keeps array order", () => {
    expect(canonicalJson({ b: 1, a: { d: [2, 1], c: null } })).toBe(
      '{"a":{"c":null,"d":[2,1]},"b":1}',
    );
  });

  it("gives one text for objects that differ only in key order", () => {
    expect(canonicalJson({ x: 1, y: [{ q: 1, p: 2 }] })).toBe(
      canonicalJson({ y: [{ p: 2, q: 1 }], x: 1 }),
    );
  });

  it("leaves out undefined properties", () => {
    expect(canonicalJson({ a: undefined, b: "x" })).toBe('{"b":"x"}');
  });
});
