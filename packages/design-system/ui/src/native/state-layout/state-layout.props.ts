/**
 * Stackra file contract:
 * Purpose: `StateLayoutProps`, the props of the native `StateLayout` in `state-layout.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3, decision 5: adapted
 *          form); ADR 0303 (decisions 7 and 10); ADR 0313 (decisions 5 and 6); WCAG 2.2 SC 1.3.1 and 1.4.1.
 */
import type { IconName } from "@stackra/icons/contracts";
import type { ReactNode } from "react";
import type { ViewProps } from "react-native";
import type { HeadingLevel } from "#contracts/enums/heading-level.enum";
import type { StateContractProps } from "#contracts/types/state-contract-props.type";

/** Props of the native StateLayout: the shared state props, the icon and level the caller resolved, and `View` props. */
export type StateLayoutProps = Omit<StateContractProps, "headingLevel"> &
  Omit<ViewProps, keyof StateContractProps> & {
    /** The icon drawn when the caller gave none, by name. */
    readonly defaultIcon: IconName;
    /** The title's outline level, already defaulted by the state; native uses it only for the title's style. */
    readonly headingLevel: HeadingLevel;
    /** Extra content between the description and the actions. */
    readonly children?: ReactNode;
  };
