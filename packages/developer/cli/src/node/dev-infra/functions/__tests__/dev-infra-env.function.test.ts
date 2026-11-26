/**
 * Stackra file contract:
 * Purpose: unit tests of `devInfraEnv` and `readDevInfraState`: a member's run gets nothing until `stackra dev` started
 *          the dev compose, then the containers' variables for the recorded lane and opt-ins; a value already in the
 *          environment is kept; a refused runway or a broken state file gives nothing.
 * Boundary: test only; a temporary workspace with one member folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0199 (decision 3); STA-2664 (item 6).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { devInfraEnv } from "#node/dev-infra/functions/dev-infra-env.function";
import { readDevInfraState } from "#node/dev-infra/functions/read-dev-infra-state.function";

let root = "";
let member = "";

/** A digest-pinned image of `name`. */
const pinned = (name: string): string => `"${name}@sha256:${"a".repeat(64)}"`;

/** Records a started dev compose. */
function state(content: string): void {
  mkdirSync(join(root, ".stackra", "dev"), { recursive: true });
  writeFileSync(join(root, ".stackra", "dev", "infra.json"), content);
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-dev-infra-env-"));
  member = join(root, "services", "orders");
  mkdirSync(member, { recursive: true });
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - services/*\n");
  writeFileSync(
    join(root, "runway.yaml"),
    [
      "version: 3",
      "project: acme",
      "environments:",
      "  dev:",
      "    lanes: { portStep: 100 }",
      "    infra:",
      `      valkey: { image: ${pinned("valkey/valkey:8.1")}, port: 6379 }`,
      `      seaweedfs: { image: ${pinned("chrislusf/seaweedfs:4.45")}, port: 8333, buckets: [acme-files] }`,
      `      "otel-lgtm": { image: ${pinned("grafana/otel-lgtm:0.37.0")}, grpcPort: 4317, httpPort: 4318, uiPort: 3000, when: opt-in }`,
      "",
    ].join("\n"),
  );
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("devInfraEnv", () => {
  it("gives nothing until stackra dev started the dev compose", () => {
    expect(devInfraEnv(member, {})).toEqual({});
  });

  it("gives the containers' variables for the recorded lane and opt-ins", () => {
    state('{ "lane": 2, "optIn": ["otel-lgtm"] }');
    expect(devInfraEnv(member, {})).toEqual({
      CACHE_VALKEY_URL: "redis://127.0.0.1:6579",
      LOCKING_VALKEY_URL: "redis://127.0.0.1:6579",
      QUEUE_BROKER_VALKEY_URL: "redis://127.0.0.1:6579",
      REALTIME_VALKEY_URL: "redis://127.0.0.1:6579",
      ACTIONS_VALKEY_URL: "redis://127.0.0.1:6579",
      AWS_ENDPOINT_URL_S3: "http://127.0.0.1:8533",
      AWS_ACCESS_KEY_ID: "stackra-dev",
      AWS_SECRET_ACCESS_KEY: "stackra-dev",
      OTEL_EXPORTER_OTLP_ENDPOINT: "http://127.0.0.1:4518",
    });
  });

  it("keeps a variable the environment already sets", () => {
    state('{ "lane": 0, "optIn": [] }');
    const env = devInfraEnv(member, {
      CACHE_VALKEY_URL: "redis://cache.example.test:6379",
      AWS_ACCESS_KEY_ID: "mine",
    });
    expect(env["CACHE_VALKEY_URL"]).toBeUndefined();
    expect(env["AWS_ACCESS_KEY_ID"]).toBeUndefined();
    expect(env["LOCKING_VALKEY_URL"]).toBe("redis://127.0.0.1:6379");
    expect(env["OTEL_EXPORTER_OTLP_ENDPOINT"]).toBeUndefined();
  });

  it("gives nothing for a runway the plan refuses", () => {
    state('{ "lane": 0, "optIn": ["valkey"] }');
    expect(devInfraEnv(member, {})).toEqual({});
  });
});

describe("readDevInfraState", () => {
  it("reads the lane and opt-ins, and treats a broken file as none", () => {
    expect(readDevInfraState(root)).toBeUndefined();
    state('{ "lane": 1, "optIn": ["otel-lgtm"] }');
    expect(readDevInfraState(root)).toEqual({ lane: 1, optIn: ["otel-lgtm"] });
    for (const broken of [
      "not json",
      '{ "lane": -1, "optIn": [] }',
      '{ "lane": 0, "optIn": [1] }',
    ]) {
      state(broken);
      expect(readDevInfraState(root)).toBeUndefined();
    }
  });
});
