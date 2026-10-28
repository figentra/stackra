/**
 * Stackra file contract:
 * Purpose: `MailboxEdiConnector`, the generic EDI driver over a transport mailbox (AS2, SFTP or a value-added network):
 *          `send` envelopes the document's segments in X12 or EDIFACT and puts it once per idempotency key, `receive`
 *          reads each listed interchange into canonical `EdiDocument`s, and `acknowledge` sends the 997 or CONTRL and
 *          removes the interchange.
 * Boundary: implements `EdiConnector`; names no vendor (ADR 0443 decision 8), so a network or transport Connection in
 *           OS integrations builds it with its `EdiMailbox` driver and its `MailboxEdiOptions`. The body it sends and
 *           receives is `{ segments, control? }`: the mapping between canonical documents and segments is the
 *           consuming module's or the partner's per-Connection mapping. A partner is `<qualifier>:<id>`. A received
 *           message outside the canonical set is refused (`MalformedEdiError`) so it stays in the mailbox for an
 *           operator; acknowledging one message of an interchange acknowledges the interchange (997 and CONTRL are per
 *           group and interchange). Certification pending (owner D3, 2026-10-27): built from the public X12 and
 *           EDIFACT envelope rules, no partner or network has run it.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 4); ADR 0443 (decisions 7 and 8); stackra-46 re-scope (R2-7, M6); STA-795.
 */
import { Enum } from "@stackra/contracts";

import type { EdiConnector, EdiDocument, EdiDocumentPage } from "#contracts/index";
import type { EdiElement } from "#contracts/edi/edi-element.type";
import type { EdiInterchange } from "#contracts/edi/edi-interchange.type";
import type { EdiMailbox } from "#contracts/edi/edi-mailbox.port";
import type { EdiMessage } from "#contracts/edi/edi-message.type";
import type { EdiParty } from "#contracts/edi/edi-party.type";
import { EdiSyntax } from "#contracts/edi/edi-syntax.enum";
import { EdiDocumentType } from "#contracts/enums/edi-document-type.enum";
import { EDI_MESSAGE_CODES } from "#core/edi/edi-message-codes.constant";
import { functionalAcknowledgement } from "#core/edi/functional-acknowledgement.function";
import type { MailboxEdiOptions } from "#core/edi/mailbox-edi-options.type";
import { MalformedEdiError } from "#core/edi/malformed-edi.error";
import { readInterchange } from "#core/edi/read-interchange.function";
import { writeInterchange } from "#core/edi/write-interchange.function";
import { ProviderRefusedError } from "#core/errors/provider-refused.error";

/** The party in `text` (`<qualifier>:<id>`), refused when it has no qualifier. */
function partyOf(text: string): EdiParty {
  const colon = text.indexOf(":");
  if (colon < 1)
    throw ProviderRefusedError.create({ provider: "edi", status: 422, code: "edi_partner" });
  return { qualifier: text.slice(0, colon), id: text.slice(colon + 1) };
}

/** True when `value` is a list of segments, each a tag and string or string-list elements. */
function isSegments(value: unknown): value is readonly (readonly EdiElement[])[] {
  return (
    Array.isArray(value) &&
    value.every(
      (segment) =>
        Array.isArray(segment) &&
        typeof segment[0] === "string" &&
        segment.every(
          (field) =>
            typeof field === "string" ||
            (Array.isArray(field) && field.every((part) => typeof part === "string")),
        ),
    )
  );
}

/**
 * An EDI Connection's connector over a mailbox.
 *
 * @example
 * export class SftpEdiConnection extends Connection<SftpEdiIntegration> implements EdiConnector {
 *   readonly edi = new MailboxEdiConnector(this.mailbox, { syntax: "x12", sender: "ZZ:FIGENTRA", version: "00401", test: false });
 * }
 */
export class MailboxEdiConnector implements EdiConnector {
  /** The transport mailbox the interchanges are put to and listed from. */
  readonly mailbox: EdiMailbox;

  /** The Connection's envelope settings. */
  readonly options: MailboxEdiOptions;

  constructor(mailbox: EdiMailbox, options: MailboxEdiOptions) {
    this.mailbox = mailbox;
    this.options = options;
  }

  /**
   * Envelopes `document.body.segments` and puts it under `idempotencyKey`.
   *
   * @throws ProviderRefusedError 422 `edi_body` when the body has no segments, `edi_partner` when the partner has no
   *         qualifier; MalformedEdiError when an X12 value holds a delimiter.
   */
  async send(document: EdiDocument, idempotencyKey: string): Promise<{ readonly id: string }> {
    const segments = document.body["segments"];
    if (!isSegments(segments))
      throw ProviderRefusedError.create({ provider: "edi", status: 422, code: "edi_body" });
    const { syntax, version, test } = this.options;
    const control = await this.mailbox.nextControlNumber(document.partner);
    const interchange: EdiInterchange = {
      syntax,
      sender: partyOf(this.options.sender),
      receiver: partyOf(document.partner),
      control: String(control),
      at: document.issuedAt,
      test,
      version,
      messages: [{ code: EDI_MESSAGE_CODES[document.type][syntax], control: "0001", segments }],
    };
    return this.mailbox.put(idempotencyKey, writeInterchange(interchange));
  }

  /**
   * The documents of the interchanges listed since `since`.
   *
   * @throws MalformedEdiError when an interchange is broken or holds a message outside the canonical set.
   */
  async receive(since: Date, cursor?: string): Promise<EdiDocumentPage> {
    const page = await this.mailbox.list(since, cursor);
    const documents = page.files.flatMap((file) => {
      const interchange = readInterchange(file.interchange);
      return interchange.messages.map((message) =>
        this.documentOf(
          interchange.messages.length === 1 ? file.id : `${file.id}#${message.control}`,
          interchange,
          message,
        ),
      );
    });
    return page.next === undefined ? { documents } : { documents, next: page.next };
  }

  /** Sends the functional acknowledgement of the interchange holding `id`, then removes it; a second call is a no-op. */
  async acknowledge(id: string): Promise<void> {
    const fileId = id.includes("#") ? id.slice(0, id.indexOf("#")) : id;
    const text = await this.mailbox.get(fileId);
    if (text === undefined) return;
    const received = readInterchange(text);
    const partner = `${received.sender.qualifier}:${received.sender.id}`;
    if (received.messages.some((message) => message.code !== "997" && message.code !== "CONTRL")) {
      const control = await this.mailbox.nextControlNumber(partner);
      const ack = functionalAcknowledgement(received, String(control), new Date());
      if (ack !== undefined) await this.mailbox.put(`ack:${fileId}`, writeInterchange(ack));
    }
    await this.mailbox.remove(fileId);
  }

  /** The canonical document of one received message. */
  private documentOf(id: string, interchange: EdiInterchange, message: EdiMessage): EdiDocument {
    const syntax = interchange.syntax;
    const type = Enum.values(EdiDocumentType).find(
      (candidate) => EDI_MESSAGE_CODES[candidate][syntax] === message.code,
    );
    if (type === undefined)
      throw MalformedEdiError.create({
        syntax,
        reason: `${message.code} is outside the canonical set`,
      });
    const [tag, position] =
      EDI_MESSAGE_CODES[type][syntax === EdiSyntax.X12 ? "x12Reference" : "edifactReference"];
    const field = message.segments.find((segment) => segment[0] === tag)?.[position];
    const reference = (typeof field === "string" ? field : field?.[0]) ?? message.control;
    return {
      id,
      type,
      partner: `${interchange.sender.qualifier}:${interchange.sender.id}`,
      reference,
      issuedAt: interchange.at,
      body: { segments: message.segments, control: message.control },
    };
  }
}
