/**
 * Stackra file contract:
 * Purpose: `ButtonProps`, the props of the web `Button` in `button.tsx`, `href` and `target` for a link drawn as it.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0165 (UI contract, HeroUI v3 on web); owner decision 6 of STA-350 (thin wrappers).
 */
import type { ButtonProps as HeroButtonProps } from "@heroui/react";
import type { HTMLAttributeAnchorTarget } from "react";

import type { ButtonContractProps } from "#contracts/types/button-contract-props.type";

/**
 * Props of the web Button: the shared contract plus HeroUI v3's own button props, passed through unchanged. HeroUI's
 * `isPending`, `fullWidth`, `isIconOnly` and `aria-label` are the contract's `isLoading`, `isFullWidth`,
 * `IconButton` and `label`, so the type refuses them: one concept, one prop. `href` and `target` make it a link
 * drawn as the button.
 */
export type ButtonProps = ButtonContractProps &
  Omit<
    HeroButtonProps,
    | keyof ButtonContractProps
    | "isPending"
    | "fullWidth"
    | "isIconOnly"
    | "aria-label"
    | "href"
    | "target"
  > & {
    /**
     * Where it goes: the button is drawn as a link (`<a href>`) that navigates through the nearest `RouterProvider`.
     * A disabled or loading one stays a button, which leaves the tab order.
     */
    readonly href?: string | undefined;
    /** The browsing context of the link (`_blank`); read only with `href`. */
    readonly target?: HTMLAttributeAnchorTarget | undefined;
  };
