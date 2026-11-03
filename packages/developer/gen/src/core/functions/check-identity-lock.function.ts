/**
 * Stackra file contract:
 * Purpose: `checkIdentityLock`, the lock rule of `stackra gen --check`: a class whose derived or written identity
 *          differs from the one the committed manifest locked fails with `identity_changed`, unless the class carries
 *          `@Renamed(old)` naming the locked identity (in full or as written: `orders.order.cancel@1` or
 *          `order.cancel`).
 * Boundary: pure. Locks actions, events, refusals, models, integrations, sequences, rule outcome kinds, agents, pass
 *           kinds, entitlements (STA-903), settings groups (STA-2056) and an app's blocks and routes. A settings group's
 *           key is derived from its class name, so a renamed class is a lost group and a gained one: a gained group pairs
 *           with a lost one only through its class's `@Renamed(<old key>)`, and a lost group beside an unpaired gained one
 *           fails on the gained class. A group also locks its key paths: a group that lost a path and gained another
 *           that does not name the lost one in `renamed` fails on the gained field, because stored values are keyed by
 *           path; a plain removal passes.
 *           Only the member's own entries are locked here (an entry with `from` belongs to its package's lock).
 *           A class that disappeared is not a changed identity; the backward-compatibility test reports the removal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 5 and 22: the manifest lock and `@Renamed`).
 */
import type { StackraManifest } from "@stackra/contracts";

import type { GenError } from "#core/types/gen-error.type";

/** The identity field of each locked section. */
const LOCKED = {
  actions: "key",
  events: "name",
  errors: "code",
  models: "key",
  integrations: "key",
  sequences: "key",
  outcomes: "key",
  agents: "key",
  passes: "key",
  entitlements: "key",
  blocks: "key",
  routes: "key",
} as const;

/** Each own entry's identity, by class name. */
function identities(
  manifest: StackraManifest,
  section: keyof typeof LOCKED,
): Map<string, Record<string, unknown>> {
  const entries = (manifest[section] ?? []) as readonly Record<string, unknown>[];
  return new Map(
    entries
      .filter((entry) => entry["from"] === undefined && typeof entry["class"] === "string")
      .map((entry) => [String(entry["class"]), entry]),
  );
}

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
  const [section, name] = lost.includes(".") ? lost.split(".") : [undefined, lost];
  return section !== undefined && gained.split(".")[0] !== section
    ? `add @Renamed(${JSON.stringify(section)}) to the renamed section field, or restore the name`
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
  for (const [section, field] of Object.entries(LOCKED) as [keyof typeof LOCKED, string][]) {
    const locked = identities(previous, section);
    for (const [className, entry] of identities(next, section)) {
      const before = locked.get(className)?.[field];
      const after = entry[field];
      if (typeof before !== "string" || before === after) continue;
      const old = renames.get(className);
      if (old !== undefined && (old === before || old === written(before, entry["module"])))
        continue;
      errors.push({
        code: "identity_changed",
        file: typeof entry["file"] === "string" ? entry["file"] : "stackra.manifest.json",
        line: 0,
        column: 0,
        subject: className,
        message: `the locked identity \`${before}\` became \`${String(after)}\``,
        fix: `add @Renamed(${JSON.stringify(before)}) to ${className}, or restore the identity`,
      });
    }
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
