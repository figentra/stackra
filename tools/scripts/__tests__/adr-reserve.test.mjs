/**
 * Stackra file contract:
 * Purpose: hold `adr-reserve.mjs` to its contract: the argument shape, the next number after the highest key, and the
 *          appended reservation entry; and the repository's own register parses and covers today's numbers.
 * Boundary: pure functions and the committed `numbers.yaml`; no network, nothing reserved.
 * Runtime: node
 * Governing contract: STA-1732; ADR 0022 (tests live in tests folders).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { NUMBERS_PATH, nextAdrNumber, parseReserveArgs, withReservation } from "../adr-reserve.mjs";

test("parseReserveArgs takes a kebab slug and an STA key, with an optional owner", () => {
  assert.deepEqual(parseReserveArgs(["spec-tiers", "--issue", "STA-1721"]), {
    slug: "spec-tiers",
    issue: "STA-1721",
    owner: undefined,
  });
  assert.equal(
    parseReserveArgs(["spec-tiers", "--issue", "STA-1", "--owner", "flow"]).owner,
    "flow",
  );
  assert.equal(parseReserveArgs(["Spec_Tiers", "--issue", "STA-1"]), null);
  assert.equal(parseReserveArgs(["spec-tiers"]), null);
  assert.equal(parseReserveArgs(["a", "b", "--issue", "STA-1"]), null);
  assert.equal(parseReserveArgs(["a", "--issue", "STA-1", "--owner", "x: y"]), null);
});

test("nextAdrNumber is the highest key plus one, four digits", () => {
  assert.equal(nextAdrNumber('"0001":\n  slug: a\n"0012":\n  slug: b\n'), "0013");
  assert.equal(nextAdrNumber(""), "0001");
});

test("withReservation appends one reserved entry the register can parse", () => {
  const text = withReservation('"0001":\n  slug: a', "0002", {
    slug: "b",
    issue: "STA-9",
    owner: "flow",
  });
  assert.deepEqual(parse(text)["0002"], {
    slug: "b",
    status: "reserved",
    owner: "flow",
    issue: "STA-9",
  });
});

test("the committed register parses and holds 0500 to 0506", () => {
  const root = fileURLToPath(new URL("../../../", import.meta.url));
  const register = parse(readFileSync(`${root}${NUMBERS_PATH}`, "utf8"), { uniqueKeys: true });
  for (const n of ["0500", "0501", "0502", "0503", "0504", "0505", "0506"])
    assert.ok(register[n]?.slug, n);
});
