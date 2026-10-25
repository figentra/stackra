/**
 * Stackra file contract:
 * Purpose: `ScopeOptions`, the options shape of `ScopeConfig`: the levels of the tree in order, the root node's path,
 *          and the display name of a level as a lang key.
 * Boundary: a shape class: fields, types and defaults only; `ScopeConfig$` mirrors it and is the schema `buildConfig`
 *           validates with. Levels are data (ADR 0327 d2): a deployment adds one in its override or its runway values,
 *           with no code and no migration. The defaults are platform and product; tenancy contributes its own level
 *           as data (ADR 0323 d4), so no level of another package is named here.
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decisions 2 and 4); ADR 0294 (decision 19); ADR 0305 (conventions 1).
 */
import { Schema } from "@stackra/validation";

import type { ScopeLevel } from "#contracts/index";

/** The options of `ScopeConfig`. */
export class ScopeOptions extends Schema {
  /** The levels, root first; a node sits at its parent's level when that level is recursive, else at the next one. */
  levels: ScopeLevel[] = [
    { key: "platform", recursive: false },
    { key: "product", recursive: false },
  ];

  /** The root node's path: one label, the node the resolver chain falls back to. */
  root = "platform";

  /** A level's display name by level key, as a lang key (`app::scope.organisation`); a level without one uses its own. */
  aliases: Record<string, string> = {};
}
