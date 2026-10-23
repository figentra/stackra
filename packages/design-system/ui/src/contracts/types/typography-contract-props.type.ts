/**
 * Stackra file contract:
 * Purpose: the props Text and Heading share on every runtime: tone, alignment, one-line truncation and the
 *          language of the text. Each runtime's props add its HeroUI Typography's own props (`className` among them),
 *          which pass through unchanged.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); ADR 0165 (UI
 *          contract); ADR 0060 (RTL).
 */
import type { ReactNode } from "react";

import type { TextAlign } from "#contracts/enums/text-align.enum";
import type { TextTone } from "#contracts/enums/text-tone.enum";

/** Props shared by the web and native Text and Heading. */
export interface TypographyContractProps {
  /** The text to show; it may hold inline elements and nested Text. */
  readonly children?: ReactNode;
  /** The colour of the text: `muted` for secondary copy, a status tone for meaning. Defaults to `default`. */
  readonly tone?: TextTone | undefined;
  /** The horizontal alignment; `start` and `end` follow the text direction, `justify` is iOS-only on native. Defaults to `start`. */
  readonly align?: TextAlign | undefined;
  /** True to cut the text to one line with an ellipsis; assistive technology still reads all of it. */
  readonly isTruncated?: boolean | undefined;
  /** The BCP 47 language of this text when it differs from the screen's, for example `ar` inside an English page. */
  readonly lang?: string | undefined;
}
