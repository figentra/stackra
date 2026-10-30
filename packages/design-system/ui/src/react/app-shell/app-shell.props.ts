/**
 * Stackra file contract:
 * Purpose: `AppShellProps`, the props of the web `AppShell` in `app-shell.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0312; ADR 0317 (decisions 1, 4, 5 and 6); ADR 0165 (HeroUI v3 on web); WCAG 2.2 SC 1.3.1, 1.4.10,
 *          2.4.1, 2.4.3 and 2.4.7.
 */
import type { ComponentPropsWithRef } from "react";
import type { AppShellContractProps } from "#contracts/types/app-shell-contract-props.type";

/**
 * Props of the web AppShell: the shared contract plus the root `div`'s own props, passed through.
 */
export type AppShellProps = AppShellContractProps &
  Omit<ComponentPropsWithRef<"div">, keyof AppShellContractProps> & {
    /** True when the shell sits inside another page: it fills its box and draws no `main` landmark or skip link. */
    readonly isEmbedded?: boolean | undefined;
    /** The text of the skip link. Defaults to the `ui` catalogue's phrase in the active locale. */
    readonly skipLabel?: string | undefined;
    /**
     * The frame: `flush` (the default) draws the page straight on the background; `inset` draws the header and page as
     * a rounded card on the app's background, clear of the edges, the look a split `SidePanel` beside it matches.
     */
    readonly frame?: "flush" | "inset" | undefined;
    /** The id of the main region, the skip link's target. Defaults to `main-content`. */
    readonly mainId?: string | undefined;
  };
