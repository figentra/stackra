/**
 * Stackra file contract:
 * Purpose: hold `stackra doctor`'s checks to their contract: missing mise tools, where sops finds the Google login, the AWS
 *          identity without echoing it, a report that fails only on a required check, and the machine-readiness
 *          parsers: needs by workspace (a web-only app asks for nothing more), dropped edge addresses, the Docker
 *          engine state and an available iOS simulator; the Stackra scope mapping (an unmapped or public-registry
 *          `@stackra` fails with the exact `.npmrc` line, ADR 0453).
 * Boundary: pure functions on injected command output; runs no command.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (testing strategy); STA-1952 spec User Story 0.
 */
import assert from "node:assert/strict";

import { test } from "@stackra/testing";

import { awsIdentityOk } from "#node/doctor/functions/aws-identity-ok.function";
import { dockerState } from "#node/doctor/functions/docker-state.function";
import { doctorExitCode } from "#node/doctor/functions/doctor-exit-code.function";
import { doctorGroup } from "#node/doctor/functions/doctor-group.function";
import { doctorNeeds } from "#node/doctor/functions/doctor-needs.function";
import { droppedAddresses } from "#node/doctor/functions/dropped-addresses.function";
import { googleCredentialsPath } from "#node/doctor/functions/google-credentials-path.function";
import { publishedDependency } from "#node/doctor/functions/published-dependency.function";
import { missingMiseTools } from "#node/doctor/functions/missing-mise-tools.function";
import { npmConfigValue } from "#node/doctor/functions/npm-config-value.function";
import { renderDoctor } from "#node/doctor/functions/render-doctor.function";
import { scopeRegistryCheck } from "#node/doctor/functions/scope-registry-check.function";
import { simulatorAvailable } from "#node/doctor/functions/simulator-available.function";
import { stackraScopesUsed } from "#node/doctor/functions/stackra-scopes-used.function";
import type { DoctorResult } from "#node/doctor/types/doctor-result.type";
import type { DoctorWorkspace } from "#node/doctor/types/doctor-workspace.type";
import type { HostProbe } from "#node/doctor/types/host-probe.type";
import { isPublicNpmRegistry } from "#node/functions/public-npm-registry.function";

test("missingMiseTools lists tools with an uninstalled version", () => {
  const json = {
    node: [{ installed: true }],
    uv: [{ installed: false }],
    maestro: [{ installed: false }],
  };
  assert.deepEqual(missingMiseTools(json), ["uv", "maestro"]);
  assert.deepEqual(missingMiseTools(null), []);
});

test("googleCredentialsPath follows GOOGLE_APPLICATION_CREDENTIALS, then CLOUDSDK_CONFIG, then ~/.config/gcloud", () => {
  const file = "application_default_credentials.json";
  assert.equal(googleCredentialsPath({}, "/h"), `/h/.config/gcloud/${file}`);
  assert.equal(googleCredentialsPath({ CLOUDSDK_CONFIG: "/c" }, "/h"), `/c/${file}`);
  assert.equal(
    googleCredentialsPath(
      { GOOGLE_APPLICATION_CREDENTIALS: "/k.json", CLOUDSDK_CONFIG: "/c" },
      "/h",
    ),
    "/k.json",
  );
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

test("doctorNeeds finds services, mobile, infra, agents and the registry scopes", () => {
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
    }),
  );
  assert.deepEqual([...needs].sort(), ["agents", "figentra", "infra", "mobile", "services"]);
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

const ORIGIN = "https://npm.stackra.figentra.com/";
const NPMJS = "https://registry.npmjs.org/";

test("scopeRegistryCheck fails an unmapped @stackra scope with the exact .npmrc line", () => {
  const row = scopeRegistryCheck("@stackra", { scoped: undefined, registry: NPMJS }, ORIGIN);
  assert.equal(row.name, "@stackra scope mapped");
  assert.equal(row.status, "fail");
  assert.match(
    row.detail ?? "",
    /not mapped: @stackra\/\* would install from https:\/\/registry\.npmjs\.org\//,
  );
  assert.equal(
    row.fix,
    "add this line to the workspace .npmrc: @stackra:registry=https://npm.stackra.figentra.com/",
  );
  const pro = scopeRegistryCheck(
    "@stackra-pro",
    { scoped: undefined, registry: undefined },
    ORIGIN,
  );
  assert.equal(pro.status, "fail");
  assert.match(pro.fix ?? "", /@stackra-pro:registry=https:\/\/npm\.stackra\.figentra\.com\/$/);
});

test("scopeRegistryCheck fails a scope mapped to a public registry, npmjs or GitHub Packages", () => {
  for (const scoped of [NPMJS, "https://registry.yarnpkg.com", "https://npm.pkg.github.com/"]) {
    const row = scopeRegistryCheck("@stackra", { scoped, registry: NPMJS }, ORIGIN);
    assert.equal(row.status, "fail", scoped);
    assert.match(row.detail ?? "", /a public registry/);
    assert.match(row.fix ?? "", /with: @stackra:registry=https:\/\/npm\.stackra\.figentra\.com\/$/);
  }
});

test("scopeRegistryCheck never offers a public registry as the line to add", () => {
  // The workspace .npmrc maps @stackra to npmjs, so `registryOrigin` reads npmjs back as the origin.
  const row = scopeRegistryCheck("@stackra", { scoped: NPMJS, registry: NPMJS }, NPMJS);
  assert.equal(row.status, "fail");
  assert.equal(
    row.fix,
    "replace the @stackra:registry line (in .npmrc, ~/.npmrc or the registries of pnpm-workspace.yaml) with: @stackra:registry=https://npm.stackra.figentra.com/",
  );
});

test("scopeRegistryCheck passes the Stackra registry, warns on another host or an unreadable config", () => {
  const mapped = scopeRegistryCheck(
    "@stackra",
    { scoped: "https://NPM.stackra.figentra.com", registry: NPMJS },
    ORIGIN,
  );
  assert.equal(mapped.status, "ok");
  assert.equal(
    scopeRegistryCheck("@stackra", { scoped: undefined, registry: ORIGIN }, ORIGIN).status,
    "ok",
  );
  const local = scopeRegistryCheck(
    "@stackra",
    { scoped: "http://localhost:8787/", registry: NPMJS },
    ORIGIN,
  );
  assert.equal(local.status, "warn");
  assert.match(local.detail ?? "", /mapped to http:\/\/localhost:8787\/, not the Stackra registry/);
  assert.equal(scopeRegistryCheck("@stackra", undefined, ORIGIN).status, "warn");
  assert.equal(doctorGroup("@stackra scope mapped"), "Registries");
  assert.equal(doctorGroup("@stackra-pro scope mapped"), "Registries");
});

test("npmConfigValue reads pnpm config get --json, unset as undefined, a warning line skipped", () => {
  assert.equal(npmConfigValue(`"${ORIGIN}"\n`), ORIGIN);
  assert.equal(npmConfigValue(`WARN something\n"${ORIGIN}"\n\n`), ORIGIN);
  assert.equal(npmConfigValue("null\n"), undefined);
  assert.equal(npmConfigValue("undefined\n"), undefined);
  assert.equal(npmConfigValue(""), undefined);
  assert.equal(npmConfigValue(`${ORIGIN}\n`), ORIGIN);
});

test("stackraScopesUsed lists the Stackra scopes read from a registry, free first", () => {
  assert.deepEqual(
    stackraScopesUsed([
      { dependencies: { "@stackra-pro/ui": "catalog:stackra" } },
      { devDependencies: { "@stackra/cli": "0.33.0", "@stackra/app": "workspace:*" } },
    ]),
    ["@stackra", "@stackra-pro"],
  );
  assert.deepEqual(stackraScopesUsed([{ dependencies: { "@stackra/app": "workspace:*" } }]), []);
});

test("isPublicNpmRegistry knows the public hosts and nothing else", () => {
  assert.ok(isPublicNpmRegistry("https://registry.npmjs.org/"));
  assert.ok(isPublicNpmRegistry("https://REGISTRY.npmjs.org:443"));
  assert.ok(!isPublicNpmRegistry(ORIGIN));
  assert.ok(!isPublicNpmRegistry("not a url"));
});
