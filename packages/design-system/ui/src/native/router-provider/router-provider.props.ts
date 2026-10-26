/**
 * Stackra file contract:
 * Purpose: `RouterProviderProps`, the props of the native `RouterProvider` in `router-provider.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          5); owner decision 1 of STA-350 (router-aware UI lives in @stackra/navigation).
 */
import type { ReactNode } from "react";

/** Props of {@link RouterProvider}. */
export interface RouterProviderProps {
  /** Opens an app path, usually through React Navigation's `useLinkTo()`. */
  readonly navigate: (href: string) => void;
  /** The tree whose links navigate through `navigate`. */
  readonly children?: ReactNode;
}
