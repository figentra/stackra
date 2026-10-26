/**
 * Stackra file contract:
 * Purpose: `LinkProps`, the props of the web `Link` in `link.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decisions
 *          5 and 7); ADR 0165 (HeroUI v3 on web); owner decision 6 of STA-350.
 */
import type { LinkProps as HeroLinkProps } from "@heroui/react";
import type { LinkContractProps } from "#contracts/types/link-contract-props.type";

/**
 * Props of the web Link: the shared contract plus HeroUI v3's own link props, passed through unchanged. HeroUI's
 * `aria-label` is the contract's `label`, so the type refuses it.
 */
export type LinkProps = LinkContractProps &
  Omit<HeroLinkProps, keyof LinkContractProps | "aria-label">;
