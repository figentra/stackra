/**
 * Stackra file contract:
 * Purpose: `LeadFormProps`, the props of `LeadForm`.
 * Boundary: a type only; every word arrives resolved in the page's locale. `verification` is the app's element (a
 *           challenge widget), so no document field.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 2: Props in `<name>.props.ts`); ADR 0504; STA-2041.
 */
import type { ReactNode } from "react";

import type { LeadConsent } from "#core/types/lead-consent.type";
import type { LeadField } from "#core/types/lead-field.type";

/**
 * A request form that posts its answers as JSON and says whether they arrived.
 *
 * @example
 * <LeadForm title="Book a demo" fields={fields} submit="Send" success="Thanks, we'll be in touch." failure="Not sent." />
 */
export interface LeadFormProps {
  /** The section's heading and spoken name. */
  readonly title: string;
  /** A line under the title. */
  readonly line?: string | undefined;
  /** Top to bottom; every label is shown. */
  readonly fields: readonly LeadField<string>[];
  /** The optional marketing-consent box, never ticked by default. */
  readonly consent?: LeadConsent<string> | undefined;
  /** The submit button's words. */
  readonly submit: string;
  /** Announced in place of the form once it's sent. */
  readonly success: string;
  /** Announced above the form when sending fails; the answers stay. */
  readonly failure: string;
  /** Where the `LeadSubmission` is posted; defaults to `LEAD_FORM_ACTION`. */
  readonly action?: string | undefined;
  /** A challenge widget drawn above the button; the named inputs it adds travel in `verification`. */
  readonly verification?: ReactNode;
  /** Styles the section. */
  readonly className?: string | undefined;
}
