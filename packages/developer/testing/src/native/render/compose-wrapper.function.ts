/**
 * Stackra file contract:
 * Purpose: `composeWrapper(providers, wrapper)`, one wrapper component from a native render's `providers` list and its
 *          `wrapper`: the first provider outermost, the wrapper innermost.
 * Boundary: internal to `./native` (not exported); the same rule as the `./react` helper, kept per entry because the
 *           entries never import each other. `undefined` when there is neither.
 * Runtime: react-native (vitest)
 * Governing contract: ADR 0269 (decisions 2 and 6).
 */
import { createElement, type ComponentType, type ReactNode } from "react";

/**
 * The single wrapper around a rendered subject.
 *
 * @example
 * composeWrapper([I18nProvider, ContainerProvider], Frame); // <I18nProvider><ContainerProvider><Frame>{ui}
 */
export function composeWrapper(
  providers: readonly ComponentType<{ readonly children?: ReactNode }>[] = [],
  wrapper?: ComponentType<{ readonly children?: ReactNode }>,
): ComponentType<{ readonly children?: ReactNode }> | undefined {
  const layers = wrapper === undefined ? providers : [...providers, wrapper];
  if (layers.length === 0) return undefined;
  return function ComposedWrapper({ children }: { readonly children?: ReactNode }) {
    return layers.reduceRight<ReactNode>(
      (inner, Layer) => createElement(Layer, null, inner),
      children,
    );
  };
}
