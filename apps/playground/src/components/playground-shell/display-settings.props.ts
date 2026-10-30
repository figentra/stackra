/**
 * Stackra file contract:
 * Purpose: `DisplaySettingsProps`: props of `DisplaySettings`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12); ADR 0303 (props vocabulary).
 */
import type { MaterialMode } from "@stackra/tokens/contracts";

import type { ShowcaseNumerals } from "./showcase-numerals.type";

/** Props of {@link DisplaySettings}. */
export interface DisplaySettingsProps {
  /** The material mode on screen. */
  readonly material: MaterialMode;
  /** Called with the mode the reader picks. */
  readonly onMaterialChange: (material: MaterialMode) => void;
  /** The digits on screen (the customer's setting; Latin by default). */
  readonly numerals: ShowcaseNumerals;
  /** Called with the digits the reader picks. */
  readonly onNumeralsChange: (numerals: ShowcaseNumerals) => void;
}
