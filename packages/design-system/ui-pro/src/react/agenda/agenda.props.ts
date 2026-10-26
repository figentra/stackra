/**
 * Stackra file contract:
 * Purpose: `AgendaProps`, props of the web Agenda: HeroUI Pro's own root props, which are the `useAgenda` result plus
 *          the children.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import type { AgendaRootProps as HeroAgendaRootProps } from "@heroui-pro/react/agenda";

/** Props of the web Agenda: HeroUI Pro's own root props, which are the `useAgenda` result plus the children. */
export type AgendaProps = HeroAgendaRootProps;
