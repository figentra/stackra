/**
 * Stackra file contract:
 * Purpose: hold `stackra doctor`'s checks to their contract: missing mise tools, an active Infisical session, the AWS
 *          identity without echoing it, a report that fails only on a required check, and the machine-readiness
 *          parsers: needs by workspace (a web-only app asks for nothing more), dropped edge addresses, the Docker
 *          engine state and an available iOS simulator.
 * Boundary: pure functions on injected command output; runs no command.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (testing strategy); STA-1952 spec User Story 0.
 */
import assert from "node:assert/strict";

import { test } from "@stackra/testing";

import { awsIdentityOk } from "#node/doctor/functions/aws-identity-ok.function";
import { dockerState } from "#node/doctor/functions/docker-state.function";
import { doctorExitCode } from "#node/doctor/functions/doctor-exit-code.function";
import { doctorNeeds } from "#node/doctor/functions/doctor-needs.function";
import { droppedAddresses } from "#node/doctor/functions/dropped-addresses.function";
import { publishedDependency } from "#node/doctor/functions/published-dependency.function";
import { infisicalLoggedIn } from "#node/doctor/functions/infisical-logged-in.function";
import { missingMiseTools } from "#node/doctor/functions/missing-mise-tools.function";
import { renderDoctor } from "#node/doctor/functions/render-doctor.function";
import { simulatorAvailable } from "#node/doctor/functions/simulator-available.function";
import type { DoctorResult } from "#node/doctor/types/doctor-result.type";
import type { DoctorWorkspace } from "#node/doctor/types/doctor-workspace.type";
import type { HostProbe } from "#node/doctor/types/host-probe.type";

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

const workspace = (patch: Partial<DoctorWorkspace>): DoctorWorkspace => ({
  manifests: [],
  scripts: {},
  infisical: false,
  devPorts: [],
  ...patch,
});

test("doctorNeeds asks a web-only app for nothing beyond the base checks", () => {
  const web = workspace({
    manifests: [
      {
        stackra: { tier: "app", runtimes: ["browser"] },
        dependencies: { "@stackra/ui": "workspace:*" },
      },
    ],
  });
  assert.deepEqual([...doctorNeeds(web)], []);
});

test("doctorNeeds finds services, mobile, infra, agents, Infisical and the registry scopes", () => {
  const needs = doctorNeeds(
    workspace({
      manifests: [
        { stackra: { tier: "service", runtimes: ["node"] } },
        { stackra: { tier: "app", runtimes: ["react-native"] } },
        {
          dependencies: {
            "@figentra/os-console": "^3.0.0",
            "@figentra/acme-example": "workspace:*",
          },
        },
      ],
      scripts: { "agents:check": "stackra agents check" },
      runway: { providers: { aws: { region: "eu-west-1" } } },
      infisical: true,
    }),
  );
  assert.deepEqual([...needs].sort(), [
    "agents",
    "figentra",
    "infisical",
    "infra",
    "mobile",
    "services",
  ]);
});

test("publishedDependency skips workspace members and matches the scope", () => {
  assert.equal(
    publishedDependency(
      [{ dependencies: { "@figentra/acme-example": "workspace:*" } }],
      "@figentra",
    ),
    undefined,
  );
  assert.equal(
    publishedDependency([{ devDependencies: { "@figentra/os-console": "3.1.0" } }], "@figentra"),
    "@figentra/os-console",
  );
  assert.equal(
    publishedDependency([{ dependencies: { "@stackra/cli": "catalog:stackra" } }], "@figentra"),
    undefined,
  );
});

test("droppedAddresses flags failures only where a sibling address answered", () => {
  const probes: HostProbe[] = [
    { host: "github.com", address: "140.82.121.3", ok: true },
    { host: "github.com", address: "140.82.121.4", ok: false },
    { host: "down.example", address: "192.0.2.1", ok: false },
    { host: "nodns.example", address: "", ok: false },
  ];
  assert.deepEqual(droppedAddresses(probes), [
    { host: "github.com", address: "140.82.121.4", ok: false },
  ]);
  assert.deepEqual(droppedAddresses([]), []);
});

test("dockerState tells a missing CLI from a stopped engine", () => {
  assert.equal(dockerState(0, '{"ServerVersion":"27.3.1"}'), "running");
  assert.equal(
    dockerState(1, '{"ServerErrors":["Cannot connect to the Docker daemon"]}'),
    "stopped",
  );
  assert.equal(dockerState(0, "not json"), "stopped");
  assert.equal(dockerState(null, ""), "missing");
});

test("simulatorAvailable needs an available iOS device", () => {
  const runtime = "com.apple.CoreSimulator.SimRuntime.iOS-18-0";
  assert.ok(simulatorAvailable({ devices: { [runtime]: [{ isAvailable: true }] } }));
  assert.ok(!simulatorAvailable({ devices: { [runtime]: [{ isAvailable: false }] } }));
  assert.ok(
    !simulatorAvailable({
      devices: { "com.apple.CoreSimulator.SimRuntime.watchOS-11-0": [{ isAvailable: true }] },
    }),
  );
  assert.ok(!simulatorAvailable(null));
});
