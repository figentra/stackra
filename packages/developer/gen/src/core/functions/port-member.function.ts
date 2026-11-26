/**
 * Stackra file contract:
 * Purpose: `portMember`, the key of the member that declares a port, from where the port is imported: the member
 *          itself for its own import path, else the dependency whose package (or entry) it is, by that dependency's
 *          manifest, else the package name in snake_case. `portKey` and `driverName` take it.
 * Boundary: pure; reads only the dependency manifests it is given.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: ports are keyed by their member); STA-1605.
 */
import { snakeCase } from "@stackra/support";

import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The member key of the port imported from `from`.
 *
 * @param member - the key of the member reading the port.
 * @param dependencies - the member's dependencies with their manifests.
 * @param from - the specifier the port is imported from (`#contracts/ports/x.port`, `@stackra/platform/contracts`).
 * @example
 * portMember("console", ir.dependencies, "@stackra/platform/contracts"); // "platform"
 */
export function portMember(
  member: string,
  dependencies: MemberIR["dependencies"],
  from: string,
): string {
  if (from.startsWith("#") || from.startsWith(".")) return member;
  return (
    dependencies.find(
      (candidate) => from === candidate.package || from.startsWith(`${candidate.package}/`),
    )?.manifest.member ?? snakeCase(from.replace(/^@[^/]+\//, "").split("/")[0] ?? from)
  );
}
