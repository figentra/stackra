/**
 * Stackra file contract:
 * Purpose: `functionalAcknowledgement(received, control, at)`, the acceptance we send back for a received interchange:
 *          an X12 997 per functional group (AK1, an AK2 and AK5 `A` per transaction set, AK9 `A`) or one EDIFACT CONTRL
 *          (UCI action `7`, interchange accepted), addressed from its receiver to its sender.
 * Boundary: acceptance only: a received interchange is acknowledged once the consumer took it, so there is no reject
 *           path here (the envelope reader refuses a broken one before). An interchange holding only
 *           acknowledgements is never acknowledged (undefined), so two parties never loop.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 4); stackra-46 re-scope (R2-7, M6); X12 997; EDIFACT CONTRL D:3.
 */
import type { EdiElement } from "#contracts/edi/edi-element.type";
import type { EdiInterchange } from "#contracts/edi/edi-interchange.type";
import type { EdiMessage } from "#contracts/edi/edi-message.type";
import type { EdiParty } from "#contracts/edi/edi-party.type";
import { EdiSyntax } from "#contracts/edi/edi-syntax.enum";

/** A party element (id, then qualifier when there is one). */
function party({ id, qualifier }: EdiParty): EdiElement {
  return qualifier === "" ? id : [id, qualifier];
}

/**
 * The acknowledgement of `received`, or undefined when it holds only acknowledgements.
 *
 * @param control - the acknowledgement interchange's own control number.
 * @example
 * const ack = functionalAcknowledgement(received, "42", new Date());
 * if (ack !== undefined) await mailbox.put(`ack:${fileId}`, writeInterchange(ack));
 */
export function functionalAcknowledgement(
  received: EdiInterchange,
  control: string,
  at: Date,
): EdiInterchange | undefined {
  const documents = received.messages.filter(
    (message) => message.code !== "997" && message.code !== "CONTRL",
  );
  if (documents.length === 0) return undefined;
  let messages: EdiMessage[];
  if (received.syntax === EdiSyntax.X12) {
    const groups = new Map<string, EdiMessage[]>();
    for (const message of documents) {
      const key = `${message.group?.code ?? ""}*${message.group?.control ?? ""}`;
      groups.set(key, [...(groups.get(key) ?? []), message]);
    }
    messages = [...groups.values()].map((sets, index) => {
      const count = String(sets.length);
      const segments: EdiElement[][] = [
        ["AK1", sets[0]?.group?.code ?? "", sets[0]?.group?.control ?? ""],
        ...sets.flatMap((set) => [
          ["AK2", set.code, set.control],
          ["AK5", "A"],
        ]),
        ["AK9", "A", count, count, count],
      ];
      return { code: "997", control: String(index + 1).padStart(4, "0"), segments };
    });
  } else {
    messages = [
      {
        code: "CONTRL",
        control: "1",
        version: "D:3:UN",
        segments: [
          ["UCI", received.control, party(received.sender), party(received.receiver), "7"],
        ],
      },
    ];
  }
  return {
    syntax: received.syntax,
    sender: received.receiver,
    receiver: received.sender,
    control,
    at,
    test: received.test,
    version: received.version,
    messages,
  };
}
