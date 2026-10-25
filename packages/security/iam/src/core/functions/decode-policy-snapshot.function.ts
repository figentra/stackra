/**
 * Stackra file contract:
 * Purpose: `decodePolicySnapshot`, a policy snapshot from the JSON an IAM event carries: the shape checked and every
 *          instant (a grant's expiry, a break-glass window) turned back into a `Date`.
 * Boundary: pure; the event payload is untrusted until it passes here. Anything malformed throws, so a bad event is
 *           never stored as a policy (a consumer keeps the snapshot it holds). Conditions stay as they came; the
 *           decision point checks them against the record's registry when it reads them.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decisions 1 to 4: snapshots pushed by events); ADR 0141 (integration events).
 */
import type { PublicId, ScopeRef } from "@stackra/contracts";

import type { BreakGlassGrant, Grant, PolicySnapshot } from "#contracts/index";

/** Whether `value` is a plain object. */
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** `value` as a list, or a refusal. */
function listOf(value: unknown, what: string): readonly unknown[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new TypeError(`a policy snapshot's ${what} is not a list`);
  return value;
}

/** An instant from its ISO text, or a refusal. */
function instantOf(value: unknown, what: string): Date {
  const date = typeof value === "string" ? new Date(value) : undefined;
  if (date === undefined || Number.isNaN(date.getTime()))
    throw new TypeError(`a policy snapshot's ${what} is not an instant`);
  return date;
}

/** A scope reference, or a refusal. */
function scopeOf(value: unknown): ScopeRef {
  if (!isObject(value) || typeof value.id !== "string" || typeof value.path !== "string")
    throw new TypeError("a policy snapshot names a scope that is not a scope reference");
  return { id: value.id as ScopeRef["id"], path: value.path };
}

/** A grant, or a refusal. */
function grantOf(value: unknown): Grant {
  if (!isObject(value) || typeof value.role !== "string")
    throw new TypeError("a policy snapshot holds a grant without a role");
  return {
    role: value.role,
    scope: scopeOf(value.scope),
    ...(value.expiresAt === undefined ? {} : { expiresAt: instantOf(value.expiresAt, "expiry") }),
    ...(typeof value.grantedBy === "string" ? { grantedBy: value.grantedBy as PublicId } : {}),
  };
}

/** A break-glass grant, or a refusal. */
function breakGlassOf(value: unknown): BreakGlassGrant {
  if (
    !isObject(value) ||
    typeof value.role !== "string" ||
    typeof value.reason !== "string" ||
    typeof value.openedBy !== "string"
  )
    throw new TypeError("a policy snapshot holds a malformed break-glass grant");
  return {
    role: value.role,
    scope: scopeOf(value.scope),
    reason: value.reason,
    openedBy: value.openedBy as PublicId,
    ...(typeof value.approvedBy === "string" ? { approvedBy: value.approvedBy as PublicId } : {}),
    startsAt: instantOf(value.startsAt, "break-glass start"),
    expiresAt: instantOf(value.expiresAt, "break-glass end"),
  };
}

/**
 * The snapshot `json` describes.
 *
 * @throws TypeError when `json` is not a policy snapshot.
 * @example
 * await store.write(event.principal, decodePolicySnapshot(event.snapshot));
 */
export function decodePolicySnapshot(json: unknown): PolicySnapshot {
  if (!isObject(json) || typeof json.version !== "number" || !Number.isInteger(json.version))
    throw new TypeError("a policy snapshot carries a whole version number");
  const roles = json.roles ?? {};
  if (
    !isObject(roles) ||
    !Object.values(roles).every(
      (held) => Array.isArray(held) && held.every((key) => typeof key === "string"),
    )
  )
    throw new TypeError("a policy snapshot's roles are not lists of permission keys");
  const segments = listOf(json.segments, "segments");
  if (!segments.every((segment) => typeof segment === "string"))
    throw new TypeError("a policy snapshot's segments are not ids");
  const rules = (what: string) =>
    listOf(json[what], what).map((rule) => {
      if (!isObject(rule)) throw new TypeError(`a policy snapshot's ${what} hold a non-object`);
      return rule;
    });
  return {
    version: json.version,
    grants: listOf(json.grants, "grants").map(grantOf),
    roles: roles as PolicySnapshot["roles"],
    segments: segments as readonly PublicId[],
    denies: rules("denies") as unknown as PolicySnapshot["denies"],
    visibility: rules("visibility") as unknown as PolicySnapshot["visibility"],
    fields: rules("fields") as unknown as NonNullable<PolicySnapshot["fields"]>,
    breakGlass: listOf(json.breakGlass, "breakGlass").map(breakGlassOf),
  };
}
