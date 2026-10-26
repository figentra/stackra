/**
 * Stackra file contract:
 * Purpose: the web `Description` on HeroUI v3's Description (React Aria text in the `description` slot): the muted
 *          help text under a field; every HeroUI prop passes through.
 * Boundary: no styling of its own. Inside a HeroUI field it is tied to the control for assistive technology; beside a
 *          plain control the caller gives it an `id` and names it in the control's `aria-describedby`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI v3 on web); ADR 0055 (forms); ADR 0303.
 */
import { Description as HeroDescription } from "@heroui/react";
import type { ReactElement } from "react";
import type { DescriptionProps } from "#react/description/description.props";

/** The help text under a field, in the muted colour. */
export function Description(props: DescriptionProps): ReactElement | null {
  return <HeroDescription {...props} />;
}
