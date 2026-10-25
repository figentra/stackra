/**
 * Stackra file contract:
 * Purpose: test fixtures: `rootRunway(document)`, a root runway checked by `@stackra/runway`'s own `parseRunway`, so
 *          every test input is a document the real schema accepts; and `TEMPLATE_EDGE`, the template's `edge` block.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decision 2).
 */
import { parseRunway, type RootRunway } from "@stackra/runway";

/** The edge block of the template's root runway. */
export const TEMPLATE_EDGE = {
  proxy: "all",
  waf: "managed",
  bots: { mode: "likely-automated-challenge" },
  rateLimit: { perIp: { requests: 600, periodSeconds: 60 } },
  tls: { minVersion: "1.2", hsts: true },
  apiHost: "api",
  analyticsProxy: "/ingest",
};

/** A parsed root runway for the project `figentra`, with `document`'s sections. */
export function rootRunway(document: Readonly<Record<string, unknown>> = {}): RootRunway {
  return parseRunway("root", { version: 3, project: "figentra", environments: {}, ...document });
}
