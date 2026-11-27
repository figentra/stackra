/**
 * Stackra file contract:
 * Purpose: unit tests of `devComposeOf`: Encore's own blocks left out; a Valkey service with its health check and the
 *          five `*_VALKEY_URL` variables; the lane shift and project name; ClamAV in the shared project, unmoved, with
 *          its volume; SeaweedFS buckets and their probe; Mailpit's two ports; opt-in profiles and their variables;
 *          a `kind` alias and a block spelling its own `containerPorts`; and every refusal, which returns no file.
 * Boundary: test only; pure input, no runway file.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0199 (decision 3); STA-2664 (item 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { devComposeOf } from "#core/functions/dev-compose-of.function";
import type { DevComposeInput } from "#core/types/dev-compose-input.type";

/** A digest-pinned image of `name`. */
const pinned = (name: string): string => `${name}@sha256:${"a".repeat(64)}`;

const VALKEY = { image: pinned("valkey/valkey:8.1"), port: 6379 };
const CLAMAV = { image: pinned("clamav/clamav:1.5.3"), port: 3310 };
const SEAWEED = { image: pinned("chrislusf/seaweedfs:4.45"), port: 8333 };
const MAILPIT = { image: pinned("axllent/mailpit:v1.31.6"), smtpPort: 1025, uiPort: 8025 };
const OTEL = {
  image: pinned("grafana/otel-lgtm:0.37.0"),
  grpcPort: 4317,
  httpPort: 4318,
  uiPort: 3000,
};

/** A plan of `infra` on lane 0 for the product `acme`. */
function plan(
  infra: DevComposeInput["infra"],
  extra: Partial<DevComposeInput> = {},
): ReturnType<typeof devComposeOf> {
  return devComposeOf({ project: "acme", infra, lane: 0, ...extra });
}

describe("devComposeOf", () => {
  it("leaves Encore's own gateway and postgres out, and writes no file for nothing", () => {
    const result = plan({
      gateway: { port: 4000, dashboard: 9400 },
      postgres: { image: pinned("pgvector/pgvector:0.8.7-pg17"), port: 5432 },
    });
    expect(result.lane).toBeUndefined();
    expect(result.shared).toBeUndefined();
    expect(result.services).toEqual([]);
    expect(result.env).toEqual({});
  });

  it("runs Valkey on 127.0.0.1 with its health check, and gives every *_VALKEY_URL", () => {
    const result = plan({ valkey: VALKEY });
    expect(result.issues).toEqual([]);
    expect(result.lane).toEqual({
      name: "acme-dev-lane-0",
      services: {
        valkey: {
          image: VALKEY.image,
          restart: "unless-stopped",
          ports: ["127.0.0.1:6379:6379"],
          healthcheck: {
            test: ["CMD", "valkey-cli", "ping"],
            interval: "2s",
            timeout: "3s",
            retries: 30,
            start_period: "5s",
          },
        },
      },
    });
    const url = "redis://127.0.0.1:6379";
    expect(result.env).toEqual({
      ACTIONS_VALKEY_URL: url,
      CACHE_VALKEY_URL: url,
      LOCKING_VALKEY_URL: url,
      QUEUE_BROKER_VALKEY_URL: url,
      REALTIME_VALKEY_URL: url,
    });
    expect(result.services).toEqual([
      {
        name: "valkey",
        kind: "valkey",
        shared: false,
        optIn: false,
        ports: { port: 6379 },
        port: 6379,
        url,
      },
    ]);
  });

  it("moves a per-lane port by lane × portStep and names the lane's project", () => {
    const result = plan({ valkey: VALKEY }, { lane: 2, lanes: { portStep: 100 } });
    expect(result.lane?.name).toBe("acme-dev-lane-2");
    expect(result.lane?.services["valkey"]?.ports).toEqual(["127.0.0.1:6579:6379"]);
    expect(result.env["CACHE_VALKEY_URL"]).toBe("redis://127.0.0.1:6579");
  });

  it("moves nothing when lanes are off", () => {
    const result = plan({ valkey: VALKEY }, { lane: 2, lanes: { enabled: false, portStep: 100 } });
    expect(result.lane?.services["valkey"]?.ports).toEqual(["127.0.0.1:6379:6379"]);
  });

  it("runs ClamAV once for every lane, unmoved, with its signatures in a volume", () => {
    const result = plan({ clamav: CLAMAV }, { lane: 3, lanes: { portStep: 100 } });
    expect(result.lane).toBeUndefined();
    expect(result.shared).toEqual({
      name: "acme-dev-shared",
      services: {
        clamav: {
          image: CLAMAV.image,
          restart: "unless-stopped",
          ports: ["127.0.0.1:3310:3310"],
          volumes: ["clamav-data:/var/lib/clamav"],
          healthcheck: {
            test: ["CMD-SHELL", "clamdcheck.sh"],
            interval: "10s",
            timeout: "5s",
            retries: 6,
            start_period: "10m",
          },
        },
      },
      volumes: { "clamav-data": {} },
    });
    expect(result.warnings).toEqual([]);
  });

  it("keeps ClamAV per lane when the block says so, and warns that MediaConfig's port no longer matches", () => {
    const result = plan(
      { clamav: { ...CLAMAV, perLane: true } },
      { lane: 1, lanes: { portStep: 100 } },
    );
    expect(result.lane?.services["clamav"]?.ports).toEqual(["127.0.0.1:3410:3310"]);
    expect(result.warnings).toEqual([expect.stringContaining("set it to 3410")]);
  });

  it("makes SeaweedFS buckets at start, waits for the last, and points the S3 SDK at it", () => {
    const result = plan({ seaweedfs: { ...SEAWEED, buckets: ["acme-files", "acme-media"] } });
    const service = result.lane?.services["seaweedfs"];
    expect(service?.command).toEqual([
      "mini",
      "-dir=/data",
      "-master.telemetry=false",
      "-bucket=acme-files,acme-media",
    ]);
    expect(service?.volumes).toEqual(["seaweedfs-data:/data"]);
    expect(service?.healthcheck?.test).toEqual([
      "CMD",
      "wget",
      "-q",
      "--spider",
      "http://127.0.0.1:8333/acme-media",
    ]);
    expect(result.env).toEqual({ AWS_ENDPOINT_URL_S3: "http://127.0.0.1:8333" });
  });

  it("keeps the SeaweedFS placeholder AWS keys out of env, as a fallback for a run with no AWS credential", () => {
    const result = plan({ seaweedfs: SEAWEED });
    expect(result.env).not.toHaveProperty("AWS_ACCESS_KEY_ID");
    expect(result.env).not.toHaveProperty("AWS_SECRET_ACCESS_KEY");
    expect(result.fallbackCredentials).toEqual([
      {
        chain: "aws",
        env: { AWS_ACCESS_KEY_ID: "stackra-dev", AWS_SECRET_ACCESS_KEY: "stackra-dev" },
      },
    ]);
    expect(result.provides).toEqual(
      expect.arrayContaining(["AWS_ACCESS_KEY_ID", "AWS_ENDPOINT_URL_S3", "AWS_SECRET_ACCESS_KEY"]),
    );
    const idle = plan({ seaweedfs: { ...SEAWEED, when: "opt-in" } });
    expect(idle.fallbackCredentials).toEqual([]);
  });

  it("runs SeaweedFS with its telemetry off, with or without buckets", () => {
    for (const block of [SEAWEED, { ...SEAWEED, buckets: ["acme-files"] }]) {
      const command = plan({ seaweedfs: block }).lane?.services["seaweedfs"]?.command ?? [];
      expect(command).toContain("-master.telemetry=false");
      expect(command.some((part) => /telemetry=true|telemetry\.url/.test(part))).toBe(false);
    }
  });

  it("waits for SeaweedFS's own health when no bucket is named", () => {
    const service = plan({ seaweedfs: SEAWEED }).lane?.services["seaweedfs"];
    expect(service?.command).toEqual(["mini", "-dir=/data", "-master.telemetry=false"]);
    expect(service?.healthcheck?.test).toEqual([
      "CMD",
      "wget",
      "-q",
      "--spider",
      "http://127.0.0.1:8333/healthz",
    ]);
  });

  it("publishes both Mailpit ports, addresses its inbox and gives the SMTP port", () => {
    const result = plan({ mailpit: MAILPIT });
    expect(result.lane?.services["mailpit"]?.ports).toEqual([
      "127.0.0.1:1025:1025",
      "127.0.0.1:8025:8025",
    ]);
    expect(result.services[0]?.url).toBe("http://127.0.0.1:8025");
    expect(result.env).toEqual({ SMTP_HOST: "127.0.0.1", SMTP_PORT: "1025" });
  });

  it("puts an opt-in block under its own profile and gives its variables only when asked", () => {
    const quiet = plan({ "otel-lgtm": { ...OTEL, when: "opt-in" } });
    expect(quiet.lane?.services["otel-lgtm"]?.profiles).toEqual(["otel-lgtm"]);
    expect(quiet.env).toEqual({});
    expect(quiet.provides).toEqual(["OTEL_EXPORTER_OTLP_ENDPOINT"]);
    const asked = plan({ "otel-lgtm": { ...OTEL, when: "opt-in" } }, { optIn: ["otel-lgtm"] });
    expect(asked.env).toEqual({ OTEL_EXPORTER_OTLP_ENDPOINT: "http://127.0.0.1:4318" });
  });

  it("refuses an opt-in name no block declares as opt-in", () => {
    const result = plan({ valkey: VALKEY }, { optIn: ["valkey", "zitadel"] });
    expect(result.issues.map(({ code, service }) => [code, service])).toEqual([
      ["infra_opt_in_unknown", "valkey"],
      ["infra_opt_in_unknown", "zitadel"],
    ]);
    expect(result.lane).toBeUndefined();
  });

  it("reads the kind from `kind`, so a block may take another name", () => {
    const result = plan({ cache: { ...VALKEY, kind: "valkey" } });
    expect(result.lane?.services["cache"]?.ports).toEqual(["127.0.0.1:6379:6379"]);
    expect(result.services[0]?.kind).toBe("valkey");
  });

  it("runs a block that spells its own container ports, command and variables", () => {
    const result = plan({
      zitadel: {
        image: pinned("ghcr.io/zitadel/zitadel:v4.1.0"),
        port: 8080,
        containerPorts: { port: 8080 },
        scheme: "http",
        command: ["start-from-init", "--masterkeyFromEnv"],
        environment: { ZITADEL_EXTERNALDOMAIN: "localhost" },
      },
    });
    expect(result.issues).toEqual([]);
    expect(result.lane?.services["zitadel"]).toEqual({
      image: pinned("ghcr.io/zitadel/zitadel:v4.1.0"),
      restart: "unless-stopped",
      ports: ["127.0.0.1:8080:8080"],
      environment: { ZITADEL_EXTERNALDOMAIN: "localhost" },
      command: ["start-from-init", "--masterkeyFromEnv"],
    });
    expect(result.services[0]?.url).toBe("http://127.0.0.1:8080");
  });

  it("warns about an image not pinned by digest", () => {
    const result = plan({ valkey: { image: "valkey/valkey:8.1", port: 6379 } });
    expect(result.issues).toEqual([]);
    expect(result.warnings).toEqual([expect.stringContaining("not pinned by digest")]);
  });

  it("refuses each broken block by code, and plans no file", () => {
    const result = plan(
      {
        unknown: { image: pinned("example/thing:1") },
        noimage: { kind: "valkey", port: 6380 },
        noport: { kind: "valkey", image: VALKEY.image },
        badport: { kind: "valkey", image: VALKEY.image, port: "6379" },
        far: { kind: "valkey", image: VALKEY.image, port: 65_500 },
        when: { kind: "valkey", image: VALKEY.image, port: 6381, when: "sometimes" },
        buckets: { ...SEAWEED, kind: "seaweedfs", buckets: ["Bad_Name"] },
        nobuckets: { ...VALKEY, kind: "valkey", port: 6382, buckets: ["acme-files"] },
        valkey: VALKEY,
        second: { ...VALKEY, kind: "valkey", port: 6383 },
      },
      { lane: 1, lanes: { portStep: 100 } },
    );
    expect(result.issues.map(({ code, service }) => [code, service])).toEqual([
      ["infra_kind_unknown", "unknown"],
      ["infra_image_missing", "noimage"],
      ["infra_port_missing", "noport"],
      ["infra_port_invalid", "badport"],
      ["infra_port_invalid", "far"],
      ["infra_when_invalid", "when"],
      ["infra_bucket_invalid", "buckets"],
      ["infra_bucket_invalid", "nobuckets"],
      ["infra_env_conflict", "second"],
      ["infra_env_conflict", "second"],
      ["infra_env_conflict", "second"],
      ["infra_env_conflict", "second"],
      ["infra_env_conflict", "second"],
    ]);
    expect(result.lane).toBeUndefined();
    expect(result.shared).toBeUndefined();
    expect(result.env).toEqual({});
    expect(result.issues[2]?.message).toBe(
      "noport.port: set the host port (the container listens on 6379)",
    );
  });

  it("names the projects after the product key in Compose's spelling", () => {
    const result = devComposeOf({ project: "Acme Platform!", infra: { valkey: VALKEY }, lane: 0 });
    expect(result.lane?.name).toBe("acme-platform-dev-lane-0");
  });
});
