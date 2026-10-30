/**
 * Stackra file contract:
 * Purpose: `RelatedCardsProps`: props of `RelatedCards`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */
import type { ComponentEntry } from "@stackra/showcase";

/** Props of {@link RelatedCards}. */
export interface RelatedCardsProps {
  /** The related entry keys ("free/icon-button"), up to three; unknown keys are skipped. */
  readonly keys: readonly string[];
  /** Called with the entry to open. */
  readonly onOpen: (entry: ComponentEntry) => void;
  /** A line per key that replaces the description, such as the reason to pick an alternative. */
  readonly notes?: Readonly<Record<string, string>>;
}
