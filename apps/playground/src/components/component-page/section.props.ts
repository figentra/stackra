/**
 * Stackra file contract:
 * Purpose: `SectionProps`, the props every section of a component page shares: the entry and the platform shown.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); showcase redesign spec (2026-10-27) section 4.
 */
import type { ComponentEntry, Platform } from "@stackra/showcase";

/** Props of a component page section. */
export interface SectionProps {
  /** The registry entry. */
  readonly entry: ComponentEntry;
  /** The platform the section documents. */
  readonly platform: Platform;
}
