/**
 * Stackra file contract:
 * Purpose: `RouteSubmitInput`, what a test hands `runRouteSubmit`: everything a loader run takes, plus the submitted
 *          form's fields.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); the template's submit tests (`runRouteSubmit(ContactRoute, { form })`).
 */
import type { RouteLoaderInput } from "#testing/types/route-loader-input.type";

/** The starting state of one submit. */
export interface RouteSubmitInput extends RouteLoaderInput {
  /** The form's fields, sent as `application/x-www-form-urlencoded`; dotted names nest (`lines.0.quantity`). */
  readonly form?: Readonly<Record<string, string>>;
}
