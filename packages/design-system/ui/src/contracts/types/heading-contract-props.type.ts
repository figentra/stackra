/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Heading` takes: the shared typography props, the outline level and the
 *          visual style, which defaults to the level's.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); ADR 0165 (UI
 *          contract); WCAG 2.2 SC 1.3.1.
 */
import type { HeadingLevel } from "#contracts/enums/heading-level.enum";
import type { HeadingType } from "#contracts/enums/heading-type.enum";
import type { TypographyContractProps } from "#contracts/types/typography-contract-props.type";

/** Props shared by the web and native `Heading`. */
export interface HeadingContractProps extends TypographyContractProps {
  /** The heading's place in the document outline, 1 to 6; required so every heading is placed on purpose. */
  readonly level: HeadingLevel;
  /** The visual style when it must differ from the level's, for example a level-3 heading drawn as `h1`. Defaults to `h<level>`. */
  readonly type?: HeadingType | undefined;
}
