/**
 * Stackra file contract:
 * Purpose: `ChangeClass`, a change class: constructible by type only and built with the typed static `create` it
 *          inherits from `Schema`. The called forms of `Change` return it, and `registerChanges` takes it.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 5 and 19); ADR 0294 (decisions 16 and 25).
 */
import type { Schema } from "@stackra/validation";

import type { ChangeBase } from "#core/bases/change.base";

/** A class of changes `C`. */
export type ChangeClass<C extends ChangeBase<object> = ChangeBase<object>> =
  (abstract new () => C) & Pick<typeof Schema, "create">;
