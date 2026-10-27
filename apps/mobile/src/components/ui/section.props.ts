/**
 * Stackra file contract:
 * Purpose: `SectionProps`: props of `Section`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */
import type { ReactNode } from "react";

/** Props of {@link Section}. */
export interface SectionProps {
  /** The heading text, read by screen readers as a heading. */
  title: string;
  /** A sentence under the heading that says what the block shows. */
  description?: string;
  /** The content of the block. */
  children: ReactNode;
}
