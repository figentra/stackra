/**
 * Stackra file contract:
 * Purpose: `instanceOf(type, container?)`, the route, layout or menu instance to run: the one the container builds
 *          with its constructor dependencies when it binds the class, else a plain `new type()` for a class with none.
 * Boundary: internal; never caches, so a request-scoped binding stays per request.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 17: classes are the tokens, gen writes the wiring).
 */
import type { AnyClass, Container } from "@stackra/container";

/**
 * The instance of `type` to run.
 *
 * @example
 * const route = instanceOf(SettingsRoute, container);
 */
export function instanceOf<T extends object>(type: AnyClass<T>, container?: Container): T {
  if (container?.has(type) === true) return container.get(type);
  // oxlint-disable-next-line eslint/new-cap -- reason: the class arrives as a parameter
  return new (type as unknown as new () => T)();
}
