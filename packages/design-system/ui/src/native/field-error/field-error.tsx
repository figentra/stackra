/**
 * Stackra file contract:
 * Purpose: the native `FieldError` on HeroUI Native's FieldError: the message under a field, shown while the field is
 *          invalid and left out of the tree otherwise; `isInvalid` sets it, and left out the HeroUI Native field around
 *          it decides. A string child is drawn as the message text.
 * Boundary: no styling of its own; every HeroUI Native prop passes through. A left-out `isInvalid` is not passed on as
 *          `undefined`, because HeroUI Native then reads the field's state instead.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI Native on native); ADR 0055 (forms); ADR 0303.
 */
import { FieldError as HeroFieldError } from "heroui-native";
import type { ComponentPropsWithRef, ReactElement } from "react";

import type { FieldErrorContractProps } from "#contracts/types/field-error-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** Props of the native FieldError: the shared contract plus HeroUI Native's own props, passed through unchanged. */
export type FieldErrorProps = FieldErrorContractProps &
  Omit<ComponentPropsWithRef<typeof HeroFieldError>, keyof FieldErrorContractProps>;

/**
 * The message under a field. Give it the text as children. Leave `isInvalid` out inside a HeroUI Native field; set it
 * beside a plain control or from a form adapter.
 */
export function FieldError({ isInvalid, ...rest }: FieldErrorProps): ReactElement {
  return <HeroFieldError {...rest} {...omitUndefined({ isInvalid })} />;
}
