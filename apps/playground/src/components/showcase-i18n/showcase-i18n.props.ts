/**
 * Stackra file contract:
 * Purpose: `ShowcaseI18nProps`: props of `ShowcaseI18n`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */
import type { NumberingSystem } from "@stackra/i18n";
import type { ReactNode } from "react";

/** Props of {@link ShowcaseI18n}. */
export interface ShowcaseI18nProps {
  /** The locale the display switcher picked (`en` or `ar`); anything else reads as English. */
  locale: string;
  /** The digits the viewer picked in Display (the customer's setting); the config's Latin default when omitted. */
  numerals?: NumberingSystem | undefined;
  /** The tree that translates. */
  children: ReactNode;
}
