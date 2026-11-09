/**
 * Stackra file contract:
 * Purpose: `CollaborativeModel`, one row of the registry `@Collaborative` fills: the model class and its view and edit
 *          permissions.
 * Boundary: a type only; the row is keyed by the model's public-id prefix in `COLLABORATIVE_MODELS`.
 * Runtime: node
 * Governing contract: ADR 0346 (decision 3); ADR 0135 (public-id prefixes, one owner each).
 */
import type { AnyClass } from "@stackra/container";

import type { CollaborativeOptions } from "#node/types/collaborative-options.type";

/** A model whose records have rooms. */
export interface CollaborativeModel extends CollaborativeOptions {
  /** The model class, read through its repository so row security and visibility apply. */
  readonly model: AnyClass;
}
