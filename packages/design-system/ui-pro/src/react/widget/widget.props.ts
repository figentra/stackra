/**
 * Stackra file contract:
 * Purpose: `WidgetProps`, props of the web Widget: HeroUI Pro's own root props plus the attributes of the `div` it
 *          draws.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import type { WidgetRootProps as HeroWidgetRootProps } from "@heroui-pro/react/widget";
import type { ComponentPropsWithRef } from "react";

/** Props of the web Widget: HeroUI Pro's own root props plus the attributes of the `div` it draws. */
export type WidgetProps = HeroWidgetRootProps &
  Omit<ComponentPropsWithRef<"div">, keyof HeroWidgetRootProps>;
