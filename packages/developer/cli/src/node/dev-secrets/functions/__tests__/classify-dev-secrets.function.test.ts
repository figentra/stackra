/**
 * Stackra file contract:
 * Purpose: unit tests of `classifyDevSecrets`: required credentials are generated, connection strings and the relay's
 *          key pair need a value, optional names stay unset, non-secrets and names dev does not need are ignored, and
 *          a name sorted two ways takes the stricter list.
 * Boundary: test only; rows are built inline.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0525 (amendment of 2026-11-10); STA-2679.
 */
import { describe, expect, it } from "@stackra/testing";

import { classifyDevSecrets } from "#node/dev-secrets/functions/classify-dev-secrets.function";
import type { DevSecretRow } from "#node/dev-secrets/types/dev-secret-row.type";

const row = (name: string, extra: Partial<DevSecretRow> = {}): DevSecretRow => ({
  name,
  kind: "secret",
  type: "string",
  required: true,
  config: "identity",
  class: "IdentityConfig",
  field: "x",
  ...extra,
});

describe("classifyDevSecrets", () => {
  it("generates required credentials and leaves optional names unset", () => {
    expect(
      classifyDevSecrets([
        row("SESSION_SECRET"),
        row("RESEND_API_KEY"),
        row("SENTRY_TOKEN", { required: false }),
      ]),
    ).toEqual({
      generate: ["RESEND_API_KEY", "SESSION_SECRET"],
      needsValue: [],
      optional: ["SENTRY_TOKEN"],
    });
  });

  it("never generates a connection string or the relay's key pair", () => {
    const names = classifyDevSecrets([
      row("DATABASE_URL"),
      row("SENTRY_DSN"),
      row("OTEL_ENDPOINT"),
      row("VALKEY_HOST"),
      row("BROKER", { type: "url" }),
      row("UPSTREAM", { rules: [{ name: "IsUrl", options: null }] }),
      row("STACKRA_EVENTS_SIGNING_KEY", { config: "outbox.events_relay" }),
    ]);
    expect(names.generate).toEqual([]);
    expect(names.needsValue).toEqual([
      "BROKER",
      "DATABASE_URL",
      "OTEL_ENDPOINT",
      "SENTRY_DSN",
      "STACKRA_EVENTS_SIGNING_KEY",
      "UPSTREAM",
      "VALKEY_HOST",
    ]);
  });

  it("ignores config and public rows and names dev does not need", () => {
    expect(
      classifyDevSecrets([
        row("LOG_LEVEL", { kind: "config" }),
        row("VITE_API", { kind: "public" }),
        row("KMS_KEY_ID", { environments: ["production", "staging"] }),
        row("DEV_ONLY", { environments: ["dev"] }),
      ]),
    ).toEqual({ generate: ["DEV_ONLY"], needsValue: [], optional: [] });
  });

  it("gives a name sorted two ways the stricter list", () => {
    expect(
      classifyDevSecrets([
        row("SHARED_SECRET", { required: false }),
        row("SHARED_SECRET"),
        row("SIGNING", { config: "outbox.events_relay" }),
        row("SIGNING"),
      ]),
    ).toEqual({ generate: ["SHARED_SECRET"], needsValue: ["SIGNING"], optional: [] });
  });
});
