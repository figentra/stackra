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
 *           names and action endpoints (`@Renamed` may name the bare path) (STA-2057). Settings groups (STA-2056) are
 *           locked after the rows: a group's key is derived from its class name, so a renamed class is a lost group and
 *           a gained one; a gained group pairs with a lost one only through its class's `@Renamed(<old key>)`, and a
 *           lost group beside an unpaired gained one fails on the gained class. A group also locks its key paths: a
 *           group that lost a path and gained another that does not name the lost one in `renamed` fails on the
 *           gained field, because stored values are keyed by path; a plain removal passes.
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

/** Each own settings group, by group key. */
function groupsOf(manifest: StackraManifest): Map<string, Record<string, unknown>> {
  const groups = (manifest["settings"] ?? []) as readonly Record<string, unknown>[];
  return new Map(
    groups
      .filter((entry) => entry["from"] === undefined)
      .map((entry) => [String(entry["key"]), entry]),
  );
}

/** A settings entry's keys. */
function keysOf(entry: Record<string, unknown>): readonly Record<string, unknown>[] {
  return (entry["keys"] ?? []) as readonly Record<string, unknown>[];
}

/** The fix of a lost key path: `@Renamed` on the section field when the section moved, else on the field. */
function fixOf(lost: string, gained: string): string {
  const [owner, name] = lost.includes(".") ? lost.split(".") : [undefined, lost];
  return owner !== undefined && gained.split(".")[0] !== owner
    ? `add @Renamed(${JSON.stringify(owner)}) to the renamed section field, or restore the name`
    : `add @Renamed(${JSON.stringify(name)}) to the renamed field, or restore the name`;
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
  // Settings groups: a gained group pairs with a lost one through its class's `@Renamed(<old key>)`.
  const lockedGroups = groupsOf(previous);
  const paired = new Set<string>();
  const unpaired: Record<string, unknown>[] = [];
  for (const [key, entry] of groupsOf(next)) {
    const renamed = renames.get(String(entry["class"]));
    const was =
      lockedGroups.get(key) ?? (renamed === undefined ? undefined : lockedGroups.get(renamed));
    if (was === undefined) {
      unpaired.push(entry);
      continue;
    }
    paired.add(String(was["key"]));
    // Key paths: a lost path with a gained one and no `renamed` naming it is a silent rename.
    const keys = keysOf(entry);
    const paths = new Set(keys.map((path) => String(path["path"])));
    const gained = keys.filter((path) => !keysOf(was).some((old) => old["path"] === path["path"]));
    for (const lost of keysOf(was).filter((old) => !paths.has(String(old["path"]))))
      if (
        gained.length > 0 &&
        !gained.some((path) =>
          ((path["renamed"] ?? []) as readonly unknown[]).includes(lost["path"]),
        )
      )
        errors.push({
          code: "identity_changed",
          file: typeof entry["file"] === "string" ? entry["file"] : "stackra.manifest.json",
          line: 0,
          column: 0,
          subject: `${String(entry["class"])}.${String(gained[0]?.["path"])}`,
          message: `the locked setting \`${String(was["key"])}.${String(lost["path"])}\` is gone and \`${String(gained[0]?.["path"])}\` is new, so stored values would be orphaned`,
          fix: fixOf(String(lost["path"]), String(gained[0]?.["path"])),
        });
  }
  const gainedGroup = unpaired[0];
  if (gainedGroup !== undefined)
    for (const [key] of lockedGroups) {
      if (paired.has(key)) continue;
      errors.push({
        code: "identity_changed",
        file:
          typeof gainedGroup["file"] === "string" ? gainedGroup["file"] : "stackra.manifest.json",
        line: 0,
        column: 0,
        subject: String(gainedGroup["class"]),
        message: `the locked settings group \`${key}\` is gone and \`${String(gainedGroup["key"])}\` is new, so stored values would be orphaned`,
        fix: `add @Renamed(${JSON.stringify(key)}) to ${String(gainedGroup["class"])}, or restore the class name`,
      });
    }
  return errors;
}
