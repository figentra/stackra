/**
 * Stackra file contract:
 * Purpose: the guard for a name that arrives as data, such as a category icon a tenant picked: true only for a Lucide
 *          name, a Stackra alias or a well-formed custom name, so a stored string is validated before it is trusted.
 * Boundary: pure; it checks the shape and the Lucide and alias sets, not whether a platform's registry holds the
 *          drawing (a custom name can be well formed and unregistered).
 * Runtime: isomorphic
 * Governing contract: ADR 0303 (decision 10); ADR 0095 (validate at the boundary).
 */
import { IconAlias } from "#contracts/enums/icon-alias.enum";
import { LucideIconName } from "#contracts/enums/lucide-icon-name.enum";
import type { IconName } from "#contracts/types/icon-name.type";

const KNOWN_NAMES: ReadonlySet<string> = new Set<string>([...LucideIconName, ...IconAlias]);

/** A namespace of lower-case words, `::`, then a lower-case path: `loyalty::points-badge`, `crm::brands/acme`. */
const CUSTOM_NAME = /^[a-z][a-z0-9_-]*::[a-z0-9][a-z0-9/_.-]*$/;

/**
 * Whether a value is an `IconName`.
 * @param value - anything, usually a string read from storage or a request
 * @returns true for a Lucide name, a Stackra alias or a well-formed `<namespace>::<name>`
 */
export function isIconName(value: unknown): value is IconName {
  return typeof value === "string" && (KNOWN_NAMES.has(value) || CUSTOM_NAME.test(value));
}
