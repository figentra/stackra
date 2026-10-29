/**
 * Stackra file contract:
 * Purpose: unit tests of `readSettings`: it parses the origin, the host map (lower-cased hosts, a platform host's null
 *          scope) and the token settings; it refuses a missing issuer, an origin with a path, a host entry without a
 *          realm and a header-breaking value.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0437 (decisions 2 and 6).
 */
import type { EdgeEnv } from "#src/interfaces/edge-env.interface";
import { readSettings } from "#src/settings/read-settings";

const env = (vars: Record<string, string | number> = {}): EdgeEnv => ({
  EDGE_SIGNING_SECRET: "secret",
  EDGE_ORIGIN: "https://api.acme.example",
  EDGE_HOST_MAP: JSON.stringify({
    "App.Acme.Example": { product: "commerce", surface: "console", realm: "staff", scope: "scp_1" },
    "figentra.example": { product: "os", surface: "landing", realm: "public" },
  }),
  EDGE_OIDC_ISSUER: "https://auth.acme.example",
  EDGE_OIDC_AUDIENCE: "project-1",
  EDGE_OIDC_KEYS_SECONDS: 3600,
  EDGE_TOKEN_LEEWAY_SECONDS: 60,
  ...vars,
});

describe("readSettings", () => {
  it("parses the origin, the host map and the token settings", () => {
    expect(readSettings(env())).toEqual({
      origin: "https://api.acme.example",
      hosts: {
        "app.acme.example": {
          product: "commerce",
          surface: "console",
          realm: "staff",
          scope: "scp_1",
        },
        "figentra.example": { product: "os", surface: "landing", realm: "public", scope: null },
      },
      issuer: "https://auth.acme.example",
      audience: "project-1",
      keysSeconds: 3600,
      leewaySeconds: 60,
    });
  });

  it("refuses a missing issuer", () => {
    expect(() => readSettings(env({ EDGE_OIDC_ISSUER: "" }))).toThrow(/EDGE_OIDC_ISSUER/);
  });

  it("refuses an origin with a path", () => {
    expect(() => readSettings(env({ EDGE_ORIGIN: "https://api.acme.example/v1" }))).toThrow(
      /EDGE_ORIGIN/,
    );
  });

  it("refuses a host entry without a realm or with a line break", () => {
    const noRealm = JSON.stringify({ "a.example": { product: "p", surface: "s" } });
    expect(() => readSettings(env({ EDGE_HOST_MAP: noRealm }))).toThrow(/realm/);
    const broken = JSON.stringify({ "a.example": { product: "p\nx", surface: "s", realm: "r" } });
    expect(() => readSettings(env({ EDGE_HOST_MAP: broken }))).toThrow(/product/);
  });
});
