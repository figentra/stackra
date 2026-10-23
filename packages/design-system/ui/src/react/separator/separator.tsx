/**
 * Stackra file contract:
 * Purpose: the web `Separator` on HeroUI v3's Separator (React Aria): a horizontal `hr` or a vertical
 *          `role="separator"`, coloured for the surface level it sits on; every HeroUI prop passes through.
 * Boundary: no styling of its own. React Aria filters `role` and `aria-hidden`, so a purely decorative rule uses
 *          `render` with `aria-hidden` instead.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI v3 on web); ADR 0304.
 */
import { Separator as HeroSeparator, type SeparatorRootProps } from "@heroui/react";

import type { SeparatorContractProps } from "#contracts/types/separator-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** Props of the web Separator: the shared contract plus HeroUI v3's own separator props, passed through unchanged. */
export type SeparatorProps = SeparatorContractProps &
  Omit<SeparatorRootProps, keyof SeparatorContractProps>;

/**
 * A rule between two groups. Horizontal by default; a vertical one stretches to its row's height. Pass `variant` to
 * match the surface it sits on: the rule does not read the level from the surface around it.
 */
export function Separator({ orientation, variant, ...rest }: SeparatorProps) {
  return <HeroSeparator {...rest} {...omitUndefined({ orientation, variant })} />;
}
