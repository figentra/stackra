/**
 * Stackra file contract:
 * Purpose: `AlertProps`, the props of the web `Alert` in `alert.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0312 (decisions 1 and 3); WCAG 2.2 SC 1.4.1 and 4.1.3.
 */
import type { AlertRootProps as HeroAlertRootProps } from "@heroui/react";
import type { ComponentPropsWithoutRef } from "react";
import type { AlertContractProps } from "#contracts/types/alert-contract-props.type";

/**
 * Props of the web Alert: the shared contract plus HeroUI v3's own alert props and the attributes of a `div`, passed
 * through. HeroUI's `status` is the contract's `tone`, its `title` (the HTML tooltip) is the contract's `title`, and
 * the role is the tone's, never the caller's.
 */
export type AlertProps = AlertContractProps &
  Omit<
    HeroAlertRootProps<"div"> &
      Omit<ComponentPropsWithoutRef<"div">, keyof HeroAlertRootProps<"div">>,
    keyof AlertContractProps | "children" | "status" | "role" | "aria-live"
  >;
