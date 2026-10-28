/**
 * Stackra file contract:
 * Purpose: the web `Separator` on HeroUI v3's Separator (React Aria): a horizontal `hr` or a vertical
 *          `role="separator"`, coloured for the surface level it sits on; every HeroUI prop passes through.
 * Boundary: no styling of its own. React Aria filters `role` and `aria-hidden`, so a purely decorative rule uses
 *          `render` with `aria-hidden` instead.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI v3 on web); ADR 0304.
 */
import type { ReactElement } from "react";
import { Separator as HeroSeparator } from "@heroui/react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { SeparatorProps } from "#react/separator/separator.props";

/**
 * A rule between two groups. Horizontal by default; a vertical one stretches to its row's height. Pass `variant` to
 * match the surface it sits on: the rule does not read the level from the surface around it.
 */
export function Separator({ orientation, variant, ...rest }: SeparatorProps): ReactElement {
  return <HeroSeparator {...rest} {...omitUndefined({ orientation, variant })} />;
}
