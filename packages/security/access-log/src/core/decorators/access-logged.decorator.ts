/**
 * Stackra file contract:
 * Purpose: `@AccessLogged({ classification, subjects })`, the class facet whose every call to a declared method writes
 *          one access record.
 * Boundary: the decorator annotates and nothing else: `createDecorator` stores the options under the decorator itself,
 *           the key `AccessLogExplorer` and gen look up. It may mark actions, queries and services, and throws a
 *           TypeError on any other class when the class is defined. Wrapping happens in the Explorer at bootstrap,
 *           never at import time; no reflect-metadata.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 6: class facets); ADR 0144 as amended by 0294 (Explorers); ADR 0212
 *                     (decision 5); ADR 0117 C2 (a package owns its decorators).
 */
import { createDecorator, DecoratorTarget } from "@stackra/container";

import type { AccessLoggedOptions } from "#contracts/types/access-logged-options.type";

/**
 * Marks a class whose declared methods expose classified data. On an action it logs each `handle` call against the
 * principal the call is for; on a service with `subjects: "customerId"` it logs each call against the `customerId` of
 * the records it handles.
 *
 * @example
 * ```ts
 * @AccessLogged({ classification: DataClassification.Personal, subjects: "customerId" })
 * export class CustomerService extends CrudService<Customer> {}
 * ```
 */
export const AccessLogged = createDecorator<AccessLoggedOptions>({
  kind: "access_logged",
  target: DecoratorTarget.Class,
  kinds: ["action", "query", "service"],
});
