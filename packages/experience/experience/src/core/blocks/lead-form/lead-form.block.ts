/**
 * Stackra file contract:
 * Purpose: `LeadFormBlock`, the document side of the landing's lead form (`./react`'s `LeadForm`): "Book a demo" or
 *          "Contact sales", with its fields, an optional marketing-consent box and the words for sent and failed.
 * Boundary: a block declaration only; its fields are the props a document may give it, each word a `LocalizedText`
 *           the renderer resolves. Where the answers go is the page's `action`, not the block's business. The key is
 *           gen's `<member>.<snake(folder)>`, `experience.lead_form`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0305 (rule 2); ADR 0504 (module UI kits); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

import { Block } from "#core/bases/block.base";
import { LANDING_BLOCK_ICONS } from "#core/constants/landing-block-icons.constant";
import { BlockCategory } from "#core/enums/block-category.enum";
import type { LeadConsent } from "#core/types/lead-consent.type";
import type { LeadField } from "#core/types/lead-field.type";

/** The lead form a document places. */
export class LeadFormBlock extends Block({
  category: BlockCategory.Marketing,
  icon: LANDING_BLOCK_ICONS.leadForm,
}) {
  title!: LocalizedText;

  /** A line under the title. */
  line?: LocalizedText;

  /** Top to bottom. */
  fields!: LeadField[];

  /** The optional marketing-consent box; placeholder words until counsel writes them. */
  consent?: LeadConsent;

  submit!: LocalizedText;

  /** Shown in place of the form once it's sent. */
  success!: LocalizedText;

  /** Shown above the form when sending fails; the answers stay. */
  failure!: LocalizedText;

  /** Where the form posts its `LeadSubmission`; defaults to `/api/leads` on the page's own origin. */
  action?: string;
}
