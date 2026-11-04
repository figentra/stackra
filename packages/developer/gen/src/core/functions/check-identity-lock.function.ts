/**
 * Stackra file contract:
 * Purpose: `checkIdentityLock`, the lock rule of `stackra gen --check`: a class whose derived or written identity
 *          differs from the one the committed manifest locked fails with `identity_changed`, unless the class carries
 *          `@Renamed(old)` naming the locked identity (in full or as written: `orders.order.cancel@1` or
 *          `order.cancel`).
 * Boundary: pure. One `LOCKS` table: a row reads a section's own entries as subject and identity, and may accept a
 *           change without `@Renamed`. Rows lock actions, events (a version bump is accepted), refusals, models,
 *           integrations, sequences, rule outcome kinds, agents, pass kinds, entitlements (STA-903), an app's blocks
 *           and routes, permissions (a `@Renamed` may name the set prefix), roles, config keys, reports, own schema
 *           names and action endpoints (`@Renamed` may name the bare path) (STA-2057).
 *           Only the member's own entries are locked here (an entry with `from`, or a generated one under `.stackra/`,
 *           belongs to its package's lock or to its source class). A class is judged once across rows.
 *           A class that disappeared is not a changed identity; the backward-compatibility test reports the removal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 5, 20 and 22: the manifest lock and `@Renamed`); ADR 0305 (rule 5: the event version bump).
 */
import type { StackraManifest } from "@stackra/contracts";

import { GENERATED_QUERY_SCHEMAS } from "#core/constants/generated-query-schemas.constant";
import { isEventBump } from "#core/functions/is-event-bump.function";
import type { GenError } from "#core/types/gen-error.type";

type Entry = Record<string, unknown>;

/** What a row knows of one locked entry. */
interface Locked {
  /** The declaring class: what `@Renamed` is read from and what is judged once. */
  readonly cls: string;
  readonly identity: string;
  readonly entry: Entry;
}

/** One lock row: how to read the entries, and the changes it accepts without `@Renamed`. */
interface LockRow {
  /** The own entries by subject. */
  readonly read: (manifest: StackraManifest) => Map<string, Locked>;
  /** A change accepted with no `@Renamed` (the event version bump). */
  readonly accepts?: (before: string, after: string) => boolean;
  /** A `@Renamed` name accepted besides the locked identity in full or as written. */
  readonly sanctions?: (old: string, before: string) => boolean;
  /** The fix of a refusal, when the default one would mislead. */
  readonly fix?: (before: string, cls: string) => string;
}

/** An own entry: not hosted (`from`, unless `includeHosted`) and not generated (`file` under `.stackra/`). */
function own(entry: Entry, includeHosted = false): boolean {
  const file = entry["file"];
  return (
    (includeHosted || entry["from"] === undefined) &&
    typeof entry["class"] === "string" &&
    !(typeof file === "string" && file.startsWith(".stackra/"))
  );
}

/**
 * Rows read from a section's entries: subject `subject(entry)`, identity `identity(entry)`. `includeHosted` keeps the
 * entries with `from`; `section` reads another manifest section than `name`.
 */
function section(
  name: string,
  identity: (entry: Entry) => unknown,
  options: { includeHosted?: boolean; subject?: (entry: Entry) => string; section?: string } = {},
): LockRow["read"] {
  return (manifest) => {
    const entries = ((manifest as unknown as Entry)[options.section ?? name] ??
      []) as readonly Entry[];
    const found = new Map<string, Locked>();
    for (const entry of entries) {
      const value = identity(entry);
      if (!own(entry, options.includeHosted) || typeof value !== "string") continue;
      const cls = String(entry["class"]);
      found.set(options.subject?.(entry) ?? cls, { cls, identity: value, entry });
    }
    return found;
  };
}

/** A permission's set prefix `<module>.<resource>`: its key without the last segment. */
const setPrefix = (key: string): string => key.slice(0, key.lastIndexOf("."));

/**
 * The schema names (after the module key) that one module only declares, that are not enums and that gen does not
 * write itself (`ReplicaPage`, the generated search and report shapes): those have no class to carry `@Renamed`.
 */
function schemaSubjects(manifest: StackraManifest): Map<string, Locked> {
  const schemas = Object.entries((manifest["schemas"] ?? {}) as Record<string, Entry>);
  const names = schemas.map(([key]) => key.slice(key.indexOf(".") + 1));
  const found = new Map<string, Locked>();
  for (const [key, schema] of schemas) {
    const name = key.slice(key.indexOf(".") + 1);
    if (
      schema["enum"] !== undefined ||
      name === "ReplicaPage" ||
      name in GENERATED_QUERY_SCHEMAS ||
      names.filter((other) => other === name).length > 1
    )
      continue;
    found.set(name, {
      cls: name,
      identity: key,
      entry: { module: key.slice(0, key.indexOf(".")) },
    });
  }
  return found;
}

/** The locked rows, in judging order: a class a row found changed is skipped by the rows after it. */
const LOCKS: readonly LockRow[] = [
  { read: section("actions", (entry) => entry["key"]) },
  {
    read: section("events", (entry) => entry["name"]),
    // ADR 0305 rule 5: the same written name at a higher version is the sanctioned bump.
    accepts: isEventBump,
  },
  { read: section("errors", (entry) => entry["code"]) },
  ...(
    [
      "models",
      "integrations",
      "sequences",
      "outcomes",
      "agents",
      "passes",
      "entitlements",
      "blocks",
      "routes",
    ] as const
  ).map((name) => ({ read: section(name, (entry) => entry["key"]) })),
  {
    read: section("permissions", (entry) => entry["key"], {
      subject: (entry) => `${String(entry["class"])}.${String(entry["member"])}`,
    }),
    // The set prefix `<module>.<resource>` renames every key of the class; a class carries one `@Renamed`.
    sanctions: (old, before) => old === setPrefix(before),
    fix: (before, cls) =>
      `add @Renamed(${JSON.stringify(setPrefix(before))}) to ${cls} (the set prefix renames every key of the class), or restore the identity`,
  },
  { read: section("roles", (entry) => entry["key"]) },
  { read: section("config", (entry) => entry["key"], { includeHosted: true }) },
  { read: section("reports", (entry) => entry["key"]) },
  { read: schemaSubjects },
  {
    read: section(
      "endpoints",
      (entry) => {
        const endpoint = entry["endpoint"] as Entry | undefined;
        return typeof endpoint?.["method"] === "string" && typeof endpoint["path"] === "string"
          ? `${endpoint["method"]} ${endpoint["path"]}`
          : undefined;
      },
      { section: "actions" },
    ),
    // The bare path names the route.
    sanctions: (old, before) => before.endsWith(` ${old}`),
    fix: (before, cls) => {
      const [method, path] = before.split(" ");
      return `add @Renamed(${JSON.stringify(before)}) to ${cls}, or keep the route with \`endpoint: { method: ${JSON.stringify(method)}, path: ${JSON.stringify(path)} }\``;
    },
  },
];

/** The identity as its author wrote it: without the module prefix and the version suffix. */
function written(identity: string, module: unknown): string {
  const prefix = typeof module === "string" ? `${module}.` : "";
  return (identity.startsWith(prefix) ? identity.slice(prefix.length) : identity).replace(
    /(@\d+|\.v\d+)$/,
    "",
  );
}

/**
 * The `identity_changed` errors of `next` against the locked `previous`.
 *
 * @param previous - the committed manifest.
 * @param next - the manifest this run derives.
 * @param renames - class name to the identity its `@Renamed(old)` records.
 * @example
 * checkIdentityLock(committed, derived, new Map([["CancelOrderAction", "order.void"]]));
 */
export function checkIdentityLock(
  previous: StackraManifest,
  next: StackraManifest,
  renames: ReadonlyMap<string, string>,
): GenError[] {
  const errors: GenError[] = [];
  const judged = new Set<string>();
  for (const row of LOCKS) {
    const changed = new Set<string>();
    const locked = row.read(previous);
    for (const [subject, now] of row.read(next)) {
      const before = locked.get(subject)?.identity;
      if (before === undefined || before === now.identity || judged.has(now.cls)) continue;
      changed.add(now.cls);
      if (row.accepts?.(before, now.identity) === true) continue;
      const old = renames.get(now.cls);
      if (
        old !== undefined &&
        (old === before ||
          old === written(before, now.entry["module"]) ||
          row.sanctions?.(old, before) === true)
      )
        continue;
      errors.push({
        code: "identity_changed",
        file: typeof now.entry["file"] === "string" ? now.entry["file"] : "stackra.manifest.json",
        line: 0,
        column: 0,
        subject,
        message: `the locked identity \`${before}\` became \`${now.identity}\``,
        fix:
          row.fix?.(before, now.cls) ??
          `add @Renamed(${JSON.stringify(before)}) to ${now.cls}, or restore the identity`,
      });
    }
    for (const cls of changed) judged.add(cls);
  }
  return errors;
}
