/**
 * Stackra file contract:
 * Purpose: `resolveVar(name, value, member, environment, devFacts)`, the string value of one runway var for a build:
 *          a literal as written; `from-port` as the member's own dev origin; `from-port: <port>` and
 *          `from-member: <member>` as that dev origin with the given scheme and path; a `ref:` or `${pr}` value as the
 *          variable of the same name in the build environment, where runway synced the resolved value.
 * Boundary: internal. Dev references resolve in dev only. A missing deploy-time value fails the build instead of
 *           shipping a placeholder; the message names the variable, never a value.
 * Runtime: node
 * Governing contract: ADR 0296 (decision 1), ADR 0175 (per-PR domains), ADR 0173.
 */
import type { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import type { AppRunway } from "#core/types/app-runway.type";
import type { RunwayFacts } from "#core/types/runway-facts.type";

/** One var value as an app runway holds it. */
type VarValue = NonNullable<NonNullable<AppRunway["environments"]["dev"]>["vars"]>[string];

/**
 * The value `name` takes in the bundle.
 *
 * @param devFacts - reads the dev facts on first use; `undefined` when `stackra dev` has not run.
 * @throws RunwayUnresolvedError for a dev reference outside dev or without dev facts, an unknown port or member, or a
 *         deploy-time value the build environment does not carry.
 * @example
 * resolveVar("EXPO_PUBLIC_REALTIME_ORIGIN", { "from-port": "gateway", scheme: "ws", path: "/realtime" }, "mobile", "dev", read);
 * // "ws://localhost:4000/realtime"
 */
export function resolveVar(
  name: string,
  value: VarValue,
  member: string,
  environment: RunwayEnvironment,
  devFacts: () => RunwayFacts | undefined,
): string {
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "string" && value !== "from-port") {
    if (!value.startsWith("ref:") && !value.includes("${")) return value;
    const resolved = process.env[name];
    if (resolved === undefined) {
      throw new RunwayUnresolvedError(
        `${name} is resolved at deploy (ref: or \${pr}); runway sets it in the build environment, and it is unset here`,
      );
    }
    return resolved;
  }
  const facts = environment === "dev" ? devFacts() : undefined;
  if (facts === undefined) {
    throw new RunwayUnresolvedError(
      environment === "dev"
        ? `${name} names a dev origin: run \`stackra dev\` first, which writes the dev facts`
        : `${name} names a dev origin, which has no value in ${environment}`,
    );
  }
  const reference =
    typeof value === "string"
      ? { by: "member", key: member }
      : "from-port" in value
        ? { by: "port", key: value["from-port"] }
        : { by: "member", key: value["from-member"] };
  const infra = Object.hasOwn(facts.infra, reference.key) ? facts.infra[reference.key] : undefined;
  const target = Object.hasOwn(facts.members, reference.key)
    ? facts.members[reference.key]
    : undefined;
  const origin = reference.by === "port" ? (infra?.url ?? target?.url) : target?.url;
  if (origin === undefined) {
    throw new RunwayUnresolvedError(
      `${name} names the dev ${reference.by} "${reference.key}", which the dev facts do not hold`,
    );
  }
  const base = new URL(origin);
  const scheme = typeof value === "string" ? undefined : value.scheme;
  const path = typeof value === "string" ? undefined : value.path;
  return `${scheme ?? base.protocol.slice(0, -1)}://${base.host}${path ?? ""}`;
}
