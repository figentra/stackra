/**
 * Stackra file contract:
 * Purpose: hold `stackra doctor`'s checks to their contract: missing mise tools, an active Infisical session, the AWS
 *          identity without echoing it, and a report that fails only on a required check.
 * Boundary: pure functions on injected command output; runs no command.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (testing strategy).
 */
import assert from "node:assert/strict";

import { test } from "@stackra/testing";

import { awsIdentityOk } from "#node/doctor/functions/aws-identity-ok.function";
import { doctorExitCode } from "#node/doctor/functions/doctor-exit-code.function";
import { infisicalLoggedIn } from "#node/doctor/functions/infisical-logged-in.function";
import { missingMiseTools } from "#node/doctor/functions/missing-mise-tools.function";
import { renderDoctor } from "#node/doctor/functions/render-doctor.function";
import type { DoctorResult } from "#node/doctor/types/doctor-result.type";

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
  const results: DoctorResult[] = [
    { name: "a", status: "ok", fix: "nope" },
    { name: "b", status: "fail", detail: "missing", fix: "do b" },
    { name: "c", status: "warn", fix: "do c" },
  ];
  const text = renderDoctor(results);
  assert.ok(!text.includes("nope"));
  assert.match(text, /✖ b — missing\n {4}fix: do b/);
  assert.match(text, /1 check\(s\) failing/);
  assert.equal(doctorExitCode(results), 1);
  assert.equal(doctorExitCode([...results.slice(0, 1), ...results.slice(2)]), 0);
});
