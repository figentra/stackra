import { test } from "node:test";
import assert from "node:assert/strict";
import {
  awsIdentityOk,
  exitCode,
  infisicalLoggedIn,
  missingMiseTools,
  render,
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
