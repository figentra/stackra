/**
 * Stackra file contract:
 * Purpose: the native `Description` on HeroUI Native's Description: the muted help text under a field; every HeroUI
 *          Native prop passes through, among them `nativeID` (which a control names in `aria-describedby`),
 *          `isInvalid`, `isDisabled` and `hideOnInvalid`.
 * Boundary: no styling of its own.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI Native on native); ADR 0055 (forms); ADR 0303.
 */
import { Description as HeroDescription } from "heroui-native";
import type { ReactElement } from "react";
import type { DescriptionProps } from "#native/description/description.props";

/** The help text under a field, in the muted colour. */
export function Description(props: DescriptionProps): ReactElement | null {
  return <HeroDescription {...props} />;
}
