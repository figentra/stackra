/**
 * Stackra file contract:
 * Purpose: `TamoRunContext`, what the provider adds to every task it hands the client: the screen key and the page context.
 * Boundary: a type only. The page context is ADR 0490's pointer (route, record and selection ids), resolved by the service
 *           under the caller's permissions, never field values.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0504 (module UI kits).
 */
import type { PageContext } from "#core/schemas/page-context.schema";

/** The context of one Tamo task. */
export interface TamoRunContext {
  /** The screen key the part sits on. */
  readonly screen?: string | undefined;
  /** The page the person is on (ADR 0490). */
  readonly page?: PageContext | undefined;
}
