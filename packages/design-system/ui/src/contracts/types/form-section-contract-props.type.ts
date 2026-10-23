/**
 * Stackra file contract:
 * Purpose: the props every runtime's `FormSection` takes: a titled group of related fields, with an optional
 *          description under the title. Each runtime's `FormSectionProps` is this plus its own element's props, which
 *          pass through unchanged.
 * Boundary: types only. The title names the group for assistive technology (a `fieldset` legend on web, a group with a
 *           label on native), so it is required.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0055 (forms); WCAG 2.2 SC 1.3.1.
 */
import type { ReactNode } from "react";

/** Props shared by the web and native `FormSection`. */
export interface FormSectionContractProps {
  /** The section's title, required: it names the group of fields for assistive technology. */
  readonly title: ReactNode;
  /** Help text under the title, read out with the group. */
  readonly description?: ReactNode;
  /** The fields of the section. */
  readonly children?: ReactNode;
}
