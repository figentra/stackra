/**
 * Stackra file contract:
 * Purpose: `usesContainer`, whether a member runs on `@stackra/container`: it is the container, declares it, or is an
 *          IR built by hand (no `packages`). A member that does not (`@stackra/testing`, which BUILDER-RULES rule 6c
 *          keeps free of every `@stackra/*` package but the config presets) gets no wiring, no member module and a
 *          container-free test setup.
 * Boundary: pure; reads `ir.package` and `ir.packages` only.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 5); ADR 0263 (decision 12); STA-1296 (undeclared packages); STA-1365 (item 8).
 */
import type { MemberIR } from "#core/types/member-ir.type";

/** The container package. */
const CONTAINER = "@stackra/container";

/**
 * Whether gen writes container files for `ir`.
 *
 * @param ir - the member read by discovery.
 * @example
 * usesContainer({ ...ir, package: "@stackra/testing", packages: ["@stackra/vitest-config"] }); // false
 */
export function usesContainer(ir: Pick<MemberIR, "package" | "packages">): boolean {
  return ir.packages === undefined || ir.package === CONTAINER || ir.packages.includes(CONTAINER);
}
