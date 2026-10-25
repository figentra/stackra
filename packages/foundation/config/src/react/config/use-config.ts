/**
 * Stackra file contract:
 * Purpose: `useConfig(Class)`, the hook a component reads a configuration with: the instance the runtime built and
 *          bound in the container of the nearest `ContainerProvider`.
 * Boundary: resolves by class from the container, never a static and never `import.meta.env`; it builds nothing.
 *           Throws outside a provider or for a class the container does not bind, so a missing config is never a
 *           silent default.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 17 and 19); ADR 0295 (decision 10).
 */
import type { AnyClass } from "@stackra/container";
import { useContainer } from "@stackra/container/react";

import type { Config } from "#core/index";

/**
 * The resolved instance of a configuration class.
 *
 * @throws Error outside a `ContainerProvider`, or when the container does not bind `type`.
 * @example
 * const i18n = useConfig(I18nConfig);
 * const rtl = i18n.rtl.includes(locale);
 */
export function useConfig<C extends Config>(type: AnyClass<C>): C {
  return useContainer().get(type);
}
