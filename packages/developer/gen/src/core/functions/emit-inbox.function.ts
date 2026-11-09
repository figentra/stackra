/**
 * Stackra file contract:
 * Purpose: `emitInbox`, a service's `#stackra/inbox` (`.stackra/gen/inbox.ts`): the cross-app inbox route,
 *          `InboundEventsController` on `/events/inbox`, which hands the method, the headers and the raw body to
 *          `RelayInboxService.receive` and answers its status with an empty body (a thrown error answers 500 and shows
 *          nothing of it), and `RelayInboxConfig`, the host's `outbox.relay_inbox` with the pinned producers' table:
 *          each contract-only producer the service listens to, with its manifest's `relay.keys` (every environment)
 *          and the wire names of the integration events it publishes.
 * Boundary: pure. Written only for a service with a listener of a contract-only producer's event
 *           (`inboxProducersOf`); any other service gets no route (ADR 0511 decision 18). The running environment stays
 *           `STACKRA_ENVIRONMENT`, read by the config at run time. Verification, parsing and the claim are
 *           `RelayInboxService`'s; the body is never read here. Public keys only: no secret is written.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (amendment of 2026-11-02, decisions 16 and 18); ADR 0294 (decision 16: a raw endpoint is
 *                     a Controller); ADR 0305 (an override keeps the plain name, its base is `Base<Name>`); STA-1910.
 */
import { generatedHeader } from "#core/functions/generated-header.function";
import { inboxProducersOf } from "#core/functions/inbox-producers-of.function";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The inbox route and key table of a service, or undefined when it listens to no contract-only producer.
 *
 * @example
 * emitInbox(ir); // "...export class InboundEventsController extends Controller({ path: \"/events/inbox\" }) {..."
 */
export function emitInbox(ir: MemberIR): string | undefined {
  const producers = inboxProducersOf(ir);
  if (producers.length === 0) return undefined;
  const rows = producers.map(({ manifest }) => {
    const relay = manifest["relay"] as { readonly keys?: unknown } | undefined;
    const events = [
      ...new Set(
        (manifest.events ?? [])
          .filter((event) => event.kind === "integration" && typeof event["name"] === "string")
          .map((event) => String(event["name"])),
      ),
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    ].sort();
    return `  ${JSON.stringify(manifest.member)}: { keys: ${JSON.stringify(relay?.keys ?? {})}, events: ${JSON.stringify(events)} },`;
  });
  const header = generatedHeader({
    from: "the listeners of contract-only producers' events and those producers' pinned stackra.manifest.json",
    purpose:
      `the cross-app inbox of ${ir.package}: \`POST /events/inbox\` into RelayInboxService, and the pinned ` +
      "producers' public keys and events.",
    boundary:
      "the raw body reaches RelayInboxService untouched, which verifies the signature before it parses anything; " +
      "the answer has no body. The running environment is STACKRA_ENVIRONMENT's.",
    runtime: "isomorphic",
  });
  return [
    header,
    'import { Controller } from "@stackra/app/server";',
    'import { RelayInboxConfig as BaseRelayInboxConfig } from "@stackra/outbox";',
    'import type { PinnedProducer } from "@stackra/outbox/contracts";',
    'import { RelayInboxService } from "@stackra/outbox/node";',
    "",
    "/** Each pinned producer's public keys per environment (current first) and the wire names it publishes. */",
    "const PRODUCERS: Record<string, PinnedProducer> = {",
    ...rows,
    "};",
    "",
    "/** The inbox configuration with the pinned producers' table. */",
    "export class RelayInboxConfig extends BaseRelayInboxConfig {",
    "  override producers = PRODUCERS;",
    "}",
    "",
    "/** Receives every signed delivery from another app's relay. */",
    'export class InboundEventsController extends Controller({ path: "/events/inbox" }) {',
    "  /** Verifies, parses and hands each delivery to the inbox. */",
    "  private readonly inbox: RelayInboxService;",
    "",
    "  /** @param inbox - the cross-app inbox. */",
    "  constructor(inbox: RelayInboxService) {",
    "    super();",
    "    this.inbox = inbox;",
    "  }",
    "",
    "  /** Answers one delivery with the inbox's status and no body; a thrown error is a 500 that shows nothing of it. */",
    "  async handle(request: Request): Promise<Response> {",
    "    const headers: Record<string, string> = {};",
    "    request.headers.forEach((value, key) => {",
    "      headers[key] = value;",
    "    });",
    "    let status: number;",
    "    try {",
    "      status = await this.inbox.receive({",
    "        method: request.method,",
    "        headers,",
    "        body: new Uint8Array(await request.arrayBuffer()),",
    "      });",
    "    } catch {",
    "      // shortcut: the error is not reported here (the producer records the 5xx and retries); report it once the",
    "      // inbox has a logger seam for listener failures.",
    "      status = 500;",
    "    }",
    "    return new Response(null, { status });",
    "  }",
    "}",
    "",
  ].join("\n");
}
