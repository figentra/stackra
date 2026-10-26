/**
 * Stackra file contract:
 * Purpose: `ListItemProps`, the props of the native `ListItem` in `list-item.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0313 (text slots); ADR 0165 (HeroUI Native on native); WCAG 2.2 SC 2.5.8 (target size).
 */
import type { ListGroup } from "heroui-native";
import type { ComponentPropsWithRef } from "react";
import type { ListItemContractProps } from "#contracts/types/list-item-contract-props.type";

/**
 * Props of the native ListItem: the shared contract plus HeroUI Native's `ListGroup.Item` props, passed through
 * unchanged. `onPress` and `isDisabled` are the contract's; HeroUI Native's `disabled` is not a prop.
 */
export type ListItemProps = ListItemContractProps &
  Omit<
    ComponentPropsWithRef<typeof ListGroup.Item>,
    keyof ListItemContractProps | "children" | "disabled" | "accessibilityLabel"
  >;
