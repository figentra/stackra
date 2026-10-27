/**
 * Stackra file contract:
 * Purpose: `mailFeatures(mail)`, the optional parts an `OutboundMail` uses (`attachments`, `attachmentRefs`, `inline`,
 *          `cc`, `bcc`, `replyTo`, `headers`).
 * Boundary: pure and internal (not exported from `.`); the `connection` mail transport runs it before it calls a
 *           provider. An empty list or record counts as unused.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decision 2); stackra-218 (STA-1376).
 */
import type { MailFeature } from "#contracts/types/mail-feature.type";
import type { OutboundMail } from "#contracts/types/outbound-mail.type";

/**
 * The optional parts `mail` uses, in `MailFeature` order.
 *
 * @example
 * mailFeatures({ ...mail, cc: ["b@acme.example"] }); // ["cc"]
 */
export function mailFeatures(mail: OutboundMail): MailFeature[] {
  const attachments = mail.attachments ?? [];
  const used: Record<MailFeature, boolean> = {
    attachments: attachments.some((file) => file.content !== undefined),
    attachmentRefs: attachments.some((file) => file.ref !== undefined),
    inline: attachments.some((file) => file.contentId !== undefined),
    cc: (mail.cc?.length ?? 0) > 0,
    bcc: (mail.bcc?.length ?? 0) > 0,
    replyTo: mail.replyTo !== undefined,
    headers: Object.keys(mail.headers ?? {}).length > 0,
  };
  return (Object.keys(used) as MailFeature[]).filter((feature) => used[feature]);
}
