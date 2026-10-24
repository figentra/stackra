/**
 * Stackra file contract:
 * Purpose: `useContainer()`, the hook a package's React code reads the container of the nearest `ContainerProvider`
 *          with, to resolve its classes by type.
 * Boundary: reads the context; throws outside a provider, because a silent default would hide a missing provider.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 17 and 23); ADR 0295 (decision 10).
 */
import { use } from "react";

import type { Container } from "#core/index";

import { ContainerContext } from "./container-context";

/**
 * The container of the nearest `ContainerProvider`.
 *
 * @throws Error outside a `ContainerProvider`.
 * @example
 * const config = useContainer().get(ThemingConfig);
 */
export function useContainer(): Container {
  const container = use(ContainerContext);
  if (container === null) throw new Error("useContainer() needs a ContainerProvider above it");
  return container;
}
