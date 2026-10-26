/**
 * Stackra file contract:
 * Purpose: `AgendaProps`, props of the native Agenda: HeroUI Native Pro's own root props, which are the `useAgenda`
 *          result plus the children.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-009.
 */
import type { Agenda as HeroAgenda } from "heroui-native-pro/agenda";
import type { ComponentPropsWithRef } from "react";

/** Props of the native Agenda: HeroUI Native Pro's own root props, which are the `useAgenda` result plus the children. */
export type AgendaProps = ComponentPropsWithRef<typeof HeroAgenda>;
