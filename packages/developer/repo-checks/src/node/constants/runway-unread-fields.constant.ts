/**
 * Stackra file contract:
 * Purpose: `RUNWAY_UNREAD_FIELDS`, the typed runway fields nothing reads yet, each with the work that will read it:
 *          the ones the repositories set (STA-2001) and the ones kept for a planned reader though no repository sets
 *          them yet (STA-2028). The Runway inventory of 2026-11-02 found them; a full trace of core confirmed no reader.
 * Boundary: data only. `checkRunwayUnreadFields` fails when this list, the "Not read yet (…)" schema descriptions and
 *           the reader sources disagree: a field that gains a reader leaves this list and its description in the same
 *           change. `access` is name matching: it catches the plain read (`group.scaling`, `database?.plan`), not one
 *           through a renamed variable.
 * Runtime: node
 * Governing contract: ADR 0296; STA-2001 (Runway plan PR 6c); STA-2028 (6d); STA-2003; STA-339.
 */
import type { RunwayUnreadField } from "#node/types/runway-unread-field.type";

const DEV = "Runway plan PR 8, STA-2001";
const DATA = "Runway plan PR 10 and 11, STA-2001";
const SELF_HOSTED = "Runway plan PR 12, STA-2001";
const RECORDS = "Runway plan PR 13, STA-2001";
const PREVIEWS = "Runway plan PR 16, STA-2001";

const GROUP = "environments.*.topology.groups.*";
const SCALING = /\.scaling\b|\["scaling"\]/;
const WORKERS = /\.workers\??\.(?:split|cpu|memory|instances)\b|\bworkers\??\.split\b/;
const HEALTH = /\bhealth\??\.(?:readiness|liveness)\b|\brequireMigrations\b|\beventLoopLagMs\b/;
const CRONS = /\bcrons\??\.enabled\b|\b(?:environment|env)\??\.crons\b/;
const APP_HEALTH = /\bhealth\??\.(?:path|expects)\b/;

/** The runway fields set but not read yet, with the work that reads each (STA-2001). */
export const RUNWAY_UNREAD_FIELDS: readonly RunwayUnreadField[] = [
  { kind: "root", path: "environments.*.lanes.from", reader: DEV, access: /\blanes\??\.from\b/ },
  {
    kind: "root",
    path: "environments.*.proxy",
    reader: DEV,
    // Not `["proxy"]`: infra-cloudflare's `EdgePolicy["proxy"]` is the edge's proxy, not this field.
    access: /\b(?:environment|env|scope|dev)\??\.proxy\b/,
  },
  { kind: "service", path: "environments.*.crons", reader: DEV, access: CRONS },
  { kind: "service", path: "environments.*.crons.enabled", reader: DEV, access: CRONS },
  {
    kind: "service",
    path: "environments.*.database.plan",
    reader: DATA,
    access: /\bdatabase\??\.plan\b/,
  },
  {
    kind: "service",
    path: "environments.*.database.readReplica",
    reader: DATA,
    access: /\breadReplica\b/,
  },
  {
    kind: "service",
    path: "environments.*.cache.keyspaceMb",
    reader: DATA,
    access: /\bkeyspaceMb\b/,
  },
  {
    kind: "root",
    path: "providers.aws.ecr",
    reader: SELF_HOSTED,
    access: /\baws\??\.ecr\b|\["ecr"\]/,
  },
  { kind: "root", path: `${GROUP}.memory`, reader: SELF_HOSTED, access: /\bgroups?\??\.memory\b/ },
  {
    kind: "root",
    path: `${GROUP}.instances.min`,
    reader: SELF_HOSTED,
    access: /\binstances\??\.min\b/,
  },
  { kind: "root", path: `${GROUP}.scaling`, reader: SELF_HOSTED, access: SCALING },
  { kind: "root", path: `${GROUP}.scaling.metric`, reader: SELF_HOSTED, access: SCALING },
  { kind: "root", path: `${GROUP}.scaling.target`, reader: SELF_HOSTED, access: SCALING },
  { kind: "root", path: `${GROUP}.workers`, reader: SELF_HOSTED, access: WORKERS },
  { kind: "root", path: `${GROUP}.workers.split`, reader: SELF_HOSTED, access: WORKERS },
  { kind: "root", path: `${GROUP}.workers.cpu`, reader: SELF_HOSTED, access: WORKERS },
  { kind: "root", path: `${GROUP}.workers.memory`, reader: SELF_HOSTED, access: WORKERS },
  { kind: "root", path: `${GROUP}.workers.instances`, reader: SELF_HOSTED, access: WORKERS },
  { kind: "root", path: `${GROUP}.workers.instances.min`, reader: SELF_HOSTED, access: WORKERS },
  { kind: "service", path: "health.readiness", reader: SELF_HOSTED, access: HEALTH },
  {
    kind: "service",
    path: "health.readiness.requireMigrations",
    reader: SELF_HOSTED,
    access: HEALTH,
  },
  { kind: "service", path: "health.readiness.timeoutSeconds", reader: SELF_HOSTED, access: HEALTH },
  { kind: "service", path: "health.liveness", reader: SELF_HOSTED, access: HEALTH },
  { kind: "service", path: "health.liveness.eventLoopLagMs", reader: SELF_HOSTED, access: HEALTH },
  // Deprecated: an alias of `release.gate`, which PR 13 reads.
  {
    kind: "root",
    path: "environments.*.deploy.gate",
    reader: RECORDS,
    access: /\bdeploy\??\.gate\b/,
  },
  {
    kind: "root",
    path: "environments.*.domains.pattern",
    reader: PREVIEWS,
    access: /\bdomains\??\.pattern\b/,
  },
  {
    kind: "root",
    path: "environments.*.domains.tenantDomains",
    reader: PREVIEWS,
    access: /\btenantDomains\b/,
  },
  {
    kind: "root",
    path: "environments.*.ttl",
    reader: PREVIEWS,
    access: /\b(?:environment|env|scope|preview)\??\.ttl\b|\["ttl"\]/,
  },
  { kind: "root", path: "providers.gcp.state", reader: PREVIEWS, access: /\bgcp\??\.state\b/ },
  {
    kind: "root",
    path: "product.edition.version",
    reader: "STA-339",
    access: /\bedition\??\.version\b/,
  },
  { kind: "app", path: "health.path", reader: RECORDS, access: APP_HEALTH },
  { kind: "app", path: "health.expects", reader: RECORDS, access: APP_HEALTH },
];
