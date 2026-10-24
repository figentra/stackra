/**
 * Stackra file contract:
 * Purpose: `ControllerClass`, the exported class type `Controller({ ... })` returns, so a consumer's declaration emit
 *          can name it.
 * Boundary: a type only (ADR 0294 decision 25: each factory returns an exported, named class type).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 16 and 25); ADR 0305 (rule 43).
 */
import type { Controller } from "#server/bases/controller.base";

/** A controller class. */
export type ControllerClass = abstract new () => Controller;
