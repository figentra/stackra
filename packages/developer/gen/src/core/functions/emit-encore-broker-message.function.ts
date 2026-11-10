/**
 * Stackra file contract:
 * Purpose: `emitEncoreBrokerMessage`, a service's `.stackra/encore/<member>/broker-message.ts`: the `BrokerMessage`
 *          its generated topics and subscriptions carry, declared beside them so Encore's parser resolves it. Encore
 *          cannot follow a package's dist into the hashed `.d.mts` chunk that declares `@stackra/queue`'s type.
 * Boundary: pure; written only when another generated file of the service imports it (`BROKER_MESSAGE_IMPORT`). The
 *           shape is `@stackra/queue`'s `BrokerMessage` member for member; a test parses both and fails on drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0091 and 0124 (the generated Encore app); ADR 0148 (decision 3: Encore Pub/Sub).
 */
import { BROKER_MESSAGE_IMPORT } from "#core/constants/broker-message-import.constant";
import { generatedHeader } from "#core/functions/generated-header.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The broker message file of a service, or undefined when none of `files` imports it.
 *
 * @param ir - the member read by discovery.
 * @param files - the member's generated files so far.
 * @example
 * emitEncoreBrokerMessage(ir, files)?.path; // ".stackra/encore/billing/broker-message.ts"
 */
export function emitEncoreBrokerMessage(
  ir: MemberIR,
  files: readonly GeneratedFile[],
): GeneratedFile | undefined {
  if (ir.layout !== "service") return undefined;
  const folder = `.stackra/encore/${ir.member}/`;
  if (
    !files.some(
      (file) => file.path.startsWith(folder) && file.content.includes(BROKER_MESSAGE_IMPORT),
    )
  )
    return undefined;
  const header = generatedHeader({
    from: "@stackra/queue's BrokerMessage",
    purpose:
      "the message the generated topics and subscriptions carry, declared here so Encore resolves it.",
    boundary: "the shape of @stackra/queue's BrokerMessage; a gen test keeps the two equal.",
    runtime: "isomorphic",
  });
  return {
    path: `${folder}broker-message.ts`,
    content: [
      header,
      "",
      "/** A message for a broker topic. */",
      "export interface BrokerMessage {",
      "  /** Unique per message; subscribers deduplicate by it. */",
      "  readonly id: string;",
      "",
      "  /** The JSON body. */",
      "  readonly body: unknown;",
      "}",
      "",
    ].join("\n"),
  };
}
