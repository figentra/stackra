/**
 * Stackra file contract:
 * Purpose: `LibraryConfig`, what `library()` returns: tsdown's `UserConfig` under a name this package exports, so a
 *          member's `export default library(...)` is nameable without tsdown among its own dependencies (TS2883,
 *          STA-1743).
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0300 (published tooling presets).
 */
import type { UserConfig } from "tsdown";

/** The tsdown configuration `library()` builds. */
// oxlint-disable-next-line typescript/no-empty-interface, typescript/no-empty-object-type -- an interface, not an alias, so declaration emit names it from @stackra/tsdown-config instead of tsdown
export interface LibraryConfig extends UserConfig {}
