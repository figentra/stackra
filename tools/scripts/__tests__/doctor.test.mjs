/**
 * Stackra file contract:
 * Purpose: hold `doctor.mjs`'s checks to their contract: missing mise tools, an active Infisical session, the AWS
 *          identity without echoing it, the spec-kit pin, and a report that fails only on a required check.
 * Boundary: pure functions on injected command output; runs no command.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (testing strategy).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  awsIdentityOk,
  exitCode,
  infisicalLoggedIn,
  missingMiseTools,
  render,
  speckitMatches,
  speckitPin,
} from "../doctor.mjs";

test("missingMiseTools lists tools with an uninstalled version", () => {
  const json = {
    node: [{ installed: true }],
    uv: [{ installed: false }],
    maestro: [{ installed: false }],
  };
  assert.deepEqual(missingMiseTools(json), ["uv", "maestro"]);
  assert.deepEqual(missingMiseTools(null), []);
});

test("infisicalLoggedIn needs an active session row", () => {
  assert.ok(infisicalLoggedIn("CURRENT NAME SESSION\n* me@x.com active"));
  assert.ok(!infisicalLoggedIn("CURRENT NAME SESSION\n* me@x.com expired"));
  assert.ok(!infisicalLoggedIn(""));
});

test("awsIdentityOk checks status and an Account without echoing it", () => {
  assert.ok(awsIdentityOk(0, '{"Account":"123"}'));
  assert.ok(!awsIdentityOk(255, '{"Account":"123"}'));
  assert.ok(!awsIdentityOk(0, "not json"));
  assert.ok(!awsIdentityOk(0, "{}"));
});

test("render shows fixes for failures only; warn does not fail the run", () => {
  const results = [
    { name: "a", status: "ok", fix: "nope" },
    { name: "b", status: "fail", detail: "missing", fix: "do b" },
    { name: "c", status: "warn", fix: "do c" },
  ];
  const text = render(results);
  assert.ok(!text.includes("nope"));
  assert.match(text, /✖ b — missing\n {4}fix: do b/);
  assert.match(text, /1 check\(s\) failing/);
  assert.equal(exitCode(results), 1);
  assert.equal(exitCode(results.slice(0, 1).concat(results.slice(2))), 0);
});

test("spec-kit must match its exact mise pin", () => {
  const pin = speckitPin('node = "24"\n"pipx:specify-cli" = "1.0.10"\n');
  assert.equal(pin, "1.0.10");
  assert.ok(speckitMatches("specify 1.0.10\n", pin));
  assert.ok(!speckitMatches("specify 1.2.1\n", pin));
  assert.ok(!speckitMatches("specify 1.0.10\n", speckitPin("[tools]\n")));
});
