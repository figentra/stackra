/**
 * Stackra file contract:
 * Purpose: `ScreenProps`, the props of the web `Screen` in `screen.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3, decision 5: adapted
 *          form); ADR 0303 (decision 7); ADR 0317 (decisions 5 and 7); ADR 0165 (HeroUI v3 on web); ADR 0060; WCAG 2.2
 *          SC 1.4.10 and 2.4.1.
 */
import type { ComponentPropsWithoutRef } from "react";
import type { ScreenContractProps } from "#contracts/types/screen-contract-props.type";

/**
 * Props of the web Screen: the shared contract plus the `main` element's own props, passed through. The element's
 * `aria-label` is the contract's `label`, so the type refuses it. There is no `ref`: the root is a `main` or, when
 * embedded, a `div`, and the two refs differ.
 */
export type ScreenProps = ScreenContractProps &
  Omit<ComponentPropsWithoutRef<"main">, keyof ScreenContractProps | "aria-label"> & {
    /** True when the screen sits inside another page: its root is a `div`, not a second `main` landmark. */
    readonly isEmbedded?: boolean | undefined;
  };
