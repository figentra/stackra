/**
 * Stackra file contract:
 * Purpose: `CONTEXT_REGISTRY`, the context component of each context key, which `registerContext` fills and
 *          `Contexts` reads; it starts with this package's own `i18n` context.
 * Boundary: module state, one per loaded copy of this package; not exported. Written only through `registerContext`.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 10).
 */
import { I18nMount } from "#react/contexts/i18n-mount";
import type { ContextComponent } from "#react/contexts/context-component.type";

/** Context key to context component. */
export const CONTEXT_REGISTRY = new Map<string, ContextComponent>([["i18n", I18nMount]]);
