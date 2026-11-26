/**
 * Stackra file contract:
 * Purpose: `emitEncoreInbox`, a service's Encore adapter of the cross-app inbox (`stackra-encore/<member>/inbox.ts`):
 *          one `api.raw` endpoint, `POST /events/inbox`, exposed and outside session auth, that reads the raw request
 *          body, builds a fetch `Request` with the method and headers, and answers through `answerHttp` with
 *          `InboundEventsController#handle`'s status.
 * Boundary: pure. Written only when `emitInbox` writes the route (a service with a listener of a contract-only
 *           producer's event). The signature is the authentication (ADR 0511 decision 18), so the endpoint is
 *           `auth: false`; the body is passed on as bytes, never parsed here. This is the inbox's adapter only: the
 *           general adapter of a service's raw controllers is STA-1955.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (amendment of 2026-11-02, decision 18); ADR 0091 and 0124 (Encore is generated); ADR
 *                     0295 (decision 8: the adapters reach the member through `handlers`); STA-1910.
 */
import { encoreDatabaseImport } from "#core/functions/encore-database-import.function";
import { encoreServiceFolder } from "#core/functions/encore-service-folder.function";
import { generatedHeader } from "#core/functions/generated-header.function";
import { inboxProducersOf } from "#core/functions/inbox-producers-of.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The Encore inbox adapter of a service, or undefined when it has no inbox.
 *
 * @example
 * emitEncoreInbox(ir)?.path; // "stackra-encore/billing/inbox.ts"
 */
export function emitEncoreInbox(ir: MemberIR): GeneratedFile | undefined {
  if (inboxProducersOf(ir).length === 0) return undefined;
  const header = generatedHeader({
    from: "the listeners of contract-only producers' events",
    purpose: `the Encore endpoint of ${ir.package}'s cross-app inbox: \`POST /events/inbox\`, raw.`,
    boundary:
      "exposed outside session auth, since the signature authenticates the sender; the raw body reaches " +
      "InboundEventsController (#stackra/inbox) untouched, through answerHttp.",
    runtime: "node",
  });
  return {
    path: `${encoreServiceFolder(ir.member)}/inbox.ts`,
    content: [
      header,
      ...encoreDatabaseImport(ir),
      'import { InboundEventsController } from "#stackra/inbox";',
      'import { api } from "encore.dev/api";',
      "",
      'import { answerHttp } from "./http";',
      "",
      "/** The largest delivery the inbox reads: one event envelope, with room to spare. */",
      "const MAX_INBOX_BYTES = 1_048_576;",
      "",
      "/** POST /events/inbox: one signed delivery from another app's relay (ADR 0511 decision 18). */",
      "export const eventsInbox = api.raw(",
      '  { expose: true, auth: false, method: "POST", path: "/events/inbox" },',
      "  async (req, resp) => {",
      "    const chunks: Uint8Array[] = [];",
      "    let size = 0;",
      "    for await (const chunk of req) {",
      "      size += (chunk as Uint8Array).byteLength;",
      "      // The route has no session auth and reads before it verifies, so an oversized body stops here.",
      "      if (size > MAX_INBOX_BYTES) {",
      "        resp.writeHead(413);",
      "        resp.end();",
      "        return;",
      "      }",
      "      chunks.push(chunk as Uint8Array);",
      "    }",
      "    const headers = new Headers();",
      "    for (const [name, value] of Object.entries(req.headers))",
      '      if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(" ") : value);',
      '    const request = new Request(new URL(req.url ?? "/events/inbox", "http://inbox"), {',
      '      method: req.method ?? "POST",',
      "      headers,",
      "      body: Buffer.concat(chunks),",
      "    });",
      "    const response = await answerHttp(request, (incoming, container) =>",
      "      container.get(InboundEventsController).handle(incoming),",
      "    );",
      "    response.headers.forEach((value, name) => resp.setHeader(name, value));",
      "    resp.writeHead(response.status);",
      "    resp.end(Buffer.from(await response.arrayBuffer()));",
      "  },",
      ");",
      "",
    ].join("\n"),
  };
}
