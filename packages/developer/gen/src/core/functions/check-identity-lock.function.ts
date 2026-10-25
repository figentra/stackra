/**
 * Stackra file contract:
 * Purpose: `checkIdentityLock`, the lock rule of `stackra gen --check`: a class whose derived or written identity
 *          differs from the one the committed manifest locked fails with `identity_changed`, unless the class carries
 *          `@Renamed(old)` naming the locked identity (in full or as written: `orders.order.cancel@1` or
 *          `order.cancel`).
 * Boundary: pure. Locks actions, events, refusals, models, integrations, sequences and an app's blocks and routes.
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
  return errors;
}
