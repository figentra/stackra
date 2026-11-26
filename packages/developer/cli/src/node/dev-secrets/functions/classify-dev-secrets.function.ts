/**
 * Stackra file contract:
 * Purpose: `classifyDevSecrets(rows)`, the secret names dev needs from manifest `env` rows, sorted into those init
 *          generates, those that need a value someone sets, and the optional ones.
 * Boundary: pure; names only. A row counts when it is a `secret` and dev is among its environments (all when absent).
 *           A random value is wrong for a connection string (a name ending `_URL`, `_DSN`, `_ENDPOINT` or `_HOST`, a
 *           `url` type, a url or dsn rule) and for the events relay's signing key, an Ed25519 private key whose public
 *           key the runway pins, so those need a value. A name that two rows sort differently takes the stricter list.
 * Runtime: node
 * Governing contract: ADR 0525 (amendment of 2026-11-10); ADR 0511 (decision 16: the relay signing key); STA-2679.
 */
import type { DevSecretNames } from "#node/dev-secrets/types/dev-secret-names.type";
import type { DevSecretRow } from "#node/dev-secrets/types/dev-secret-row.type";

/** A name that holds where to connect, not a credential. */
const CONNECTION_NAME = /_(?:URL|DSN|ENDPOINT|HOST)$/;

/** A validation rule that wants a URL or DSN. */
const CONNECTION_RULE = /url|dsn/i;

/** The config key of the relay's signing key row (`envOf`). */
const RELAY_CONFIG = "outbox.events_relay";

/** The names of `names`, sorted. */
// oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
const sorted = (names: Set<string>): string[] => [...names].sort();

/** Whether a random value would break `row`. */
function needsValue(row: DevSecretRow): boolean {
  return (
    CONNECTION_NAME.test(row.name) ||
    row.type === "url" ||
    (row.rules ?? []).some((rule) => CONNECTION_RULE.test(rule.name)) ||
    row.config === RELAY_CONFIG
  );
}

/**
 * The dev secret names of `rows`.
 *
 * @param rows - the `env` rows of every member that runs (a service's include its packages').
 * @example
 * classifyDevSecrets([{ name: "SESSION_SECRET", kind: "secret", required: true, … }]).generate; // ["SESSION_SECRET"]
 */
export function classifyDevSecrets(rows: readonly DevSecretRow[]): DevSecretNames {
  const generate = new Set<string>();
  const needs = new Set<string>();
  const optional = new Set<string>();
  for (const row of rows) {
    if (row.kind !== "secret") continue;
    if (row.environments !== undefined && !row.environments.includes("dev")) continue;
    if (row.required !== true) optional.add(row.name);
    else if (needsValue(row)) needs.add(row.name);
    else generate.add(row.name);
  }
  // A name required anywhere is not optional; one that needs a value anywhere is never generated.
  for (const name of needs) generate.delete(name);
  for (const name of [...generate, ...needs]) optional.delete(name);
  return { generate: sorted(generate), needsValue: sorted(needs), optional: sorted(optional) };
}
