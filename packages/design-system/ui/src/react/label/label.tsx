/**
 * Stackra file contract:
 * Purpose: the web `Label` on HeroUI v3's Label (React Aria): the `label` element that names a field, with the
 *          required, invalid and disabled states drawn by HeroUI; every HeroUI prop passes through.
 * Boundary: no styling of its own. Inside a HeroUI field the label is tied to the control by React Aria; beside a plain
 *          control the caller ties it with `htmlFor`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI v3 on web); ADR 0055 (forms); ADR 0303.
 */
import { Label as HeroLabel, type LabelRootProps } from "@heroui/react";
import type { ReactElement } from "react";

import type { LabelContractProps } from "#contracts/types/label-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** Props of the web Label: the shared contract plus HeroUI v3's own label props, passed through unchanged. */
export type LabelProps = LabelContractProps & Omit<LabelRootProps, keyof LabelContractProps>;

/**
 * The text that names a field. Inside a field it takes the field's states; beside a plain control, pass `htmlFor`
 * and the states yourself.
 */
export function Label({ isRequired, isInvalid, isDisabled, ...rest }: LabelProps): ReactElement {
  return <HeroLabel {...rest} {...omitUndefined({ isRequired, isInvalid, isDisabled })} />;
}
