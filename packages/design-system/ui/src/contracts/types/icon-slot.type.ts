/**
 * Stackra file contract:
 * Purpose: what an icon slot (`icon`, `startIcon`, `endIcon`) accepts: an `IconName`, which the component draws
 *          through `Icon`, or an element, which it draws as given (an app's own SVG, a spinner).
 * Boundary: types only. Plain strings other than icon names are not slot values; text goes in `children`.
 * Runtime: isomorphic
 * Governing contract: ADR 0303 (decisions 7 and 10); ADR 0302 (decision 3).
 */
import type { IconName } from "@stackra/icons/contracts";
import type { ReactElement } from "react";

/** An icon by name, or an element drawn as given. */
export type IconSlot = IconName | ReactElement;
