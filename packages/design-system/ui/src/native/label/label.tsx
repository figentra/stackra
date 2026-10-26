/**
 * Stackra file contract:
 * Purpose: the native `Label` on HeroUI Native's Label: the text that names a field, with the required, invalid and
 *          disabled states HeroUI Native draws (an asterisk, the error colour, the disabled colour); a state the
 *          caller leaves out is taken from the HeroUI Native field the label sits in.
 * Boundary: no styling of its own; every HeroUI Native prop passes through. A left-out state is not passed on as
 *          `undefined`, because HeroUI Native then reads the field's state instead, which is what a label inside a field
 *          wants.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI Native on native); ADR 0055 (forms); ADR 0303.
 */
import { Label as HeroLabel } from "heroui-native";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { LabelProps } from "#native/label/label.props";

/**
 * The text that names a field. Inside a field it takes the field's states; beside a plain control, pass the states
 * yourself. A string child is drawn as the label's text.
 */
export function Label({ isRequired, isInvalid, isDisabled, ...rest }: LabelProps): ReactElement {
  return <HeroLabel {...rest} {...omitUndefined({ isRequired, isInvalid, isDisabled })} />;
}
