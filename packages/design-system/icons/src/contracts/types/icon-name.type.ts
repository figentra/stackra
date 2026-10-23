/**
 * Stackra file contract:
 * Purpose: `IconName`, the one way anything declarative refers to an icon: a Lucide name in kebab-case, a Stackra
 *          semantic alias, or a namespaced custom icon. It is a plain string in a manifest and on the wire, never a
 *          component.
 * Boundary: a type only; resolving a name to a drawing is the job of each platform's registry.
 * Runtime: isomorphic
 * Governing contract: ADR 0303 (decision 10); ADR 0294 (decision 15, contracts are a leaf); ADR 0231.
 */
import type { IconAlias } from "#contracts/enums/icon-alias.enum";
import type { LucideIconName } from "#contracts/enums/lucide-icon-name.enum";
import type { CustomIconName } from "#contracts/types/custom-icon-name.type";

/** An icon by name: `"arrow-right"` (Lucide), `"orders"` (a Stackra alias) or `"loyalty::points-badge"` (custom). */
export type IconName = LucideIconName | IconAlias | CustomIconName;
