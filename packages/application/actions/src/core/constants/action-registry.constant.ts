/**
 * Stackra file contract:
 * Purpose: `ACTION_REGISTRY`, the derived identities `registerActions` stored, by action or query class.
 * Boundary: process-wide and internal: written by `registerActions`, read by `ActionPipeline`. A later row for the same
 *           class replaces the earlier one.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 22).
 */
import type { AnyClass } from "@stackra/container";

import type { ActionRegistration } from "#core/types/action-registration.type";

/** Class to its registered identity. */
export const ACTION_REGISTRY = new Map<AnyClass, ActionRegistration>();
