/**
 * Stackra file contract:
 * Purpose: `clientNamespace`, the name a catalogue's namespace takes in the member's `I18n`: its own name, unless it is a
 *          consumed service's namespace that one of the member's own modules also has, which then lives under the
 *          service's client name (`geography.rates`, as `#stackra/clients/geography` keeps two services apart).
 * Boundary: pure. The member's own namespaces always win; a package's namespace is never moved (a package and the
 *           member claiming one namespace is still a clash `checkI18n` refuses). A module key has no dot, so the moved
 *           name cannot collide with a member's or a package's namespace.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 3: what a member consumes through a client); ADR 0268 (R15: typed keys);
 *                     STA-1363.
 */

/**
 * The namespace `namespace` of a catalogue set takes beside the member's own `namespaces`.
 *
 * @param own - the member's own namespaces (its base locale's file names).
 * @param service - the consumed service's member key when the set is a service's; absent for the member or a package.
 * @param namespace - the namespace as the set ships it.
 * @example
 * clientNamespace(new Set(["rates"]), "geography", "rates"); // "geography.rates"
 */
export function clientNamespace(
  own: ReadonlySet<string>,
  service: string | undefined,
  namespace: string,
): string {
  return service !== undefined && own.has(namespace) ? `${service}.${namespace}` : namespace;
}
