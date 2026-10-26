/**
 * Stackra file contract:
 * Purpose: `TextAreaFieldProps`, the props of the web `TextAreaField` in `text-area-field.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0055 (decision 2); ADR 0165 (decision
 *          2: form adapters in @stackra/ui); ADR 0302 (decision 3).
 */
import type { TextAreaProps } from "#react/text-area/text-area.props";

/** Props of the web TextAreaField: the TextArea's own. */
export type TextAreaFieldProps = TextAreaProps;
