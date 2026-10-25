/**
 * Stackra file contract:
 * Purpose: `LayoutLoaderState<L>`, what `useLayoutLoader(LayoutClass)` reports: loading, redirected (the generated tree
 *          then shows the signed-out stack and keeps the link to resume), the layout's data, or its error.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 16); ADR 0165.
 */
import type { AnyClass } from "@stackra/container";

import type { Layout } from "#core/bases/layout.base";
import type { LoaderData } from "#core/types/loader-data.type";

/** The state of a native layout's loader. */
export interface LayoutLoaderState<L extends AnyClass<Layout>> {
  /** True until the first run settles. */
  readonly isLoading: boolean;

  /** True when the last run answered a redirect. */
  readonly redirected: boolean;

  /** The layout's data from the last run that answered data. */
  readonly data: LoaderData<InstanceType<L>> | undefined;

  /** The error of the last run that failed. */
  readonly error: unknown;

  /** Runs the loader again; the state updates when it settles. */
  readonly reload: () => void;
}
