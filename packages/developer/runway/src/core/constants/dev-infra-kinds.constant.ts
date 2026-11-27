/**
 * Stackra file contract:
 * Purpose: `DEV_INFRA_KINDS`, the dev infra containers `stackra dev` knows how to run beside `encore run`, by kind:
 *          `valkey` (the cache, locking, queue broker, realtime fan-out and action stores' `*_VALKEY_URL`),
 *          `seaweedfs` (an S3 store for the `s3` disk: `AWS_ENDPOINT_URL_S3`, buckets made at start), `mailpit` (mail
 *          capture: `SMTP_HOST`, `SMTP_PORT`, a web inbox), `clamav` (the `clamav` scanner's clamd on 3310, one for every
 *          lane) and `otel-lgtm` (an OTLP collector with Grafana: `OTEL_EXPORTER_OTLP_ENDPOINT`). `gateway` and
 *          `postgres` are Encore's own (`encore run` starts them), so they are not here.
 * Boundary: data only. Images are not here: the root runway pins each by digest (`image`), the one place a version is
 *           written. SeaweedFS rather than MinIO: MinIO publishes no community image any more. Every container runs
 *           without a credential, published on 127.0.0.1 only. SeaweedFS runs with its telemetry off
 *           (`-master.telemetry=false`, the `weed mini` spelling of `-telemetry=false`), so a dev run reports nothing to
 *           telemetry.seaweedfs.com. The SeaweedFS store has no identity configured, so it accepts any signature
 *           (checked for PutObject, GetObject and a presigned GET on 2026-11-26): the AWS credential a developer
 *           already has signs for it, and its placeholder pair (`fallbackCredentials`, no secret) is given only to a
 *           run with none, never over a profile the other AWS clients need. The health checks are the images' own
 *           commands (`valkey-cli`, `weed`'s `wget`, `/mailpit readyz`, `clamdcheck.sh`), checked against the pinned
 *           images on 2026-11-26.
 * Runtime: isomorphic
 * Governing contract: ADR 0199 (decision 3: `stackra dev` runs a small compose file); ADR 0222 (decision 1: an
 *                     S3-compatible disk); ADR 0184 (OTLP everywhere); ADR 0296 (decision 1); STA-2664 (item 6).
 */
import type { DevInfraKind } from "#core/types/dev-infra-kind.type";

/** A Valkey URL on the lane's port. */
const VALKEY_URL = "redis://{host}:{port}";

/** The dev infra kinds. */
export const DEV_INFRA_KINDS: Readonly<Record<string, DevInfraKind>> = {
  valkey: {
    ports: { port: 6379 },
    primary: "port",
    scheme: "redis",
    perLane: true,
    healthcheck: {
      test: ["CMD", "valkey-cli", "ping"],
      interval: "2s",
      timeout: "3s",
      retries: 30,
      startPeriod: "5s",
    },
    memberEnv: {
      CACHE_VALKEY_URL: VALKEY_URL,
      LOCKING_VALKEY_URL: VALKEY_URL,
      QUEUE_BROKER_VALKEY_URL: VALKEY_URL,
      REALTIME_VALKEY_URL: VALKEY_URL,
      ACTIONS_VALKEY_URL: VALKEY_URL,
    },
  },
  seaweedfs: {
    ports: { port: 8333 },
    primary: "port",
    scheme: "http",
    perLane: true,
    // `-master.telemetry=false`: `weed mini` otherwise reports anonymous cluster statistics to telemetry.seaweedfs.com.
    command: ["mini", "-dir=/data", "-master.telemetry=false"],
    volume: "/data",
    healthcheck: {
      test: ["CMD", "wget", "-q", "--spider", "http://127.0.0.1:8333/healthz"],
      interval: "2s",
      timeout: "3s",
      retries: 30,
      startPeriod: "5s",
    },
    buckets: {
      argument: "-bucket=",
      probe: ["CMD", "wget", "-q", "--spider", "http://127.0.0.1:8333/{bucket}"],
    },
    memberEnv: {
      AWS_ENDPOINT_URL_S3: "http://{host}:{port}",
    },
    // With no identity configured the store takes any signature, so a developer's own AWS credential (a profile, SSO)
    // signs for it too; this pair is only for a run with no AWS credential at all. Not a secret.
    fallbackCredentials: {
      chain: "aws",
      env: { AWS_ACCESS_KEY_ID: "stackra-dev", AWS_SECRET_ACCESS_KEY: "stackra-dev" },
    },
  },
  mailpit: {
    ports: { smtpPort: 1025, uiPort: 8025 },
    primary: "uiPort",
    scheme: "http",
    perLane: true,
    // Any login is accepted over plain SMTP, so a driver that authenticates works unchanged.
    environment: { MP_SMTP_AUTH_ACCEPT_ANY: "1", MP_SMTP_AUTH_ALLOW_INSECURE: "1" },
    healthcheck: {
      test: ["CMD", "/mailpit", "readyz"],
      interval: "2s",
      timeout: "3s",
      retries: 30,
      startPeriod: "5s",
    },
    memberEnv: { SMTP_HOST: "{host}", SMTP_PORT: "{port:smtpPort}" },
  },
  clamav: {
    ports: { port: 3310 },
    primary: "port",
    scheme: "tcp",
    // About 1 GB of memory and a signature download each: one serves every lane, on MediaConfig's default port.
    perLane: false,
    volume: "/var/lib/clamav",
    healthcheck: {
      test: ["CMD-SHELL", "clamdcheck.sh"],
      interval: "10s",
      timeout: "5s",
      retries: 6,
      startPeriod: "10m",
    },
  },
  "otel-lgtm": {
    ports: { grpcPort: 4317, httpPort: 4318, uiPort: 3000 },
    primary: "uiPort",
    scheme: "http",
    perLane: true,
    memberEnv: { OTEL_EXPORTER_OTLP_ENDPOINT: "http://{host}:{port:httpPort}" },
  },
};
