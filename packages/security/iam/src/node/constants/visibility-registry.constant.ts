/**
 * Stackra file contract:
 * Purpose: `VISIBILITY_REGISTRY`, every registered visibility row by its model class, with the targets of the relations
 *          the model follows resolved from their thunks.
 * Boundary: process-wide and internal: `registerVisibility` writes it and `IamVisibilityFilterDriver` reads it. A later
 *           row for the same model replaces the earlier one.
 * Runtime: node
 * Governing contract: ADR 0333 (decisions 1 and 4, and its amendment: relations); the `POLICY_REGISTRY` precedent.
 */
import type { AnyClass } from "@stackra/container";

import type { VisibilityRegistration } from "#node/types/visibility-registration.type";

/** The rows by model; `follows` pairs each followed relation with its target model. */
export const VISIBILITY_REGISTRY: Map<
  AnyClass,
  {
    readonly row: VisibilityRegistration;
    readonly follows: readonly (readonly [relation: string, target: AnyClass])[];
  }
> = new Map();
