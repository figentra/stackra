/**
 * Stackra file contract:
 * Purpose: `NativeLoad`, how one native loader run came out: data with the validated params and query, or a redirect
 *          for the screen to follow.
 * Boundary: a type only, internal to `./native`.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 16).
 */
import type { RouteRedirect } from "#core/types/route-redirect.type";

/** The outcome of a native load. */
export type NativeLoad =
  | {
      readonly kind: "data";
      readonly data: unknown;
      readonly params: unknown;
      readonly search: unknown;
    }
  | { readonly kind: "redirect"; readonly redirect: RouteRedirect };
