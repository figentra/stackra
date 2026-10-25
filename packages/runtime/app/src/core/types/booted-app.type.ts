/**
 * Stackra file contract:
 * Purpose: `BootedApp`, what `bootApp` resolves to and every target runtime builds on: the booted container, the error
 *          reporter every unexpected error goes to once, and the wiring it booted from.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decisions 7 and 8); ADR 0232 (decision 8: report once).
 */
import type { Container, Wiring } from "@stackra/container";
import type { ErrorReporter } from "@stackra/errors/contracts";

import type { AppSections } from "#core/types/app-sections.type";

/** A booted app, before a target wraps it. */
export interface BootedApp {
  /** The booted container: configuration instances, drivers and bindings, resolved by class. */
  readonly container: Container;

  /** The bound `ErrorReporter`, or a console reporter when the wiring binds none. */
  readonly reporter: ErrorReporter;

  /** The member's wiring. */
  readonly wiring: Wiring & AppSections;
}
