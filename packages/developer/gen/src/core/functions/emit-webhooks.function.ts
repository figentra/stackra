/**
 * Stackra file contract:
 * Purpose: `emitWebhooks`, a service's `#stackra/webhooks` (`.stackra/gen/webhooks.ts`): the inbound webhook route,
 *          `InboundWebhooksController` on `/webhooks/*`, which reads the raw body exactly as received, finds the
 *          Integration by the `<module>/<name>` of its path, and hands the request to `WebhookReceiver.receive` with
 *          the connection id the path names and the decoded query parameters (`InboundWebhook.query`; Paymob signs
 *          `?hmac=`, Tamara sends `?tamaraToken=`).
 * Boundary: pure. Written only for a service with an Integration that declares `webhooks` (its own or a hosted
 *           package's). The receiver verifies before anything is parsed; an unknown path answers 404 and a received
 *           event 202. The wiring binds the controller; the raw Encore adapter around it is the Encore target's.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 15 and 16); ADR 0224 as amended (one inbound route, raw body); ADR 0294
 *                     (decision 16: a raw endpoint is a Controller).
 */
import { generatedHeader } from "#core/functions/generated-header.function";
import { importLines } from "#core/functions/import-lines.function";
import { webhookIntegrations } from "#core/functions/webhook-integrations.function";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The inbound webhook route of a service, or undefined when it receives no webhook.
 *
 * @example
 * emitWebhooks(ir); // "...export class InboundWebhooksController extends Controller({ path: \"/webhooks/*\" }) {..."
 */
export function emitWebhooks(ir: MemberIR): string | undefined {
  const integrations = webhookIntegrations(ir);
  if (integrations.length === 0) return undefined;
  const imports = new Map<string, Map<string, boolean>>([
    ["@stackra/app/server", new Map([["Controller", false]])],
    ["@stackra/integrations", new Map([["IntegrationClass", true]])],
    ["@stackra/webhooks", new Map([["WebhookReceiver", false]])],
  ]);
  for (const { integration } of integrations) {
    const names = imports.get(integration.from) ?? new Map<string, boolean>();
    names.set(integration.name, false);
    imports.set(integration.from, names);
  }
  const header = generatedHeader({
    from: "the Integrations that declare `webhooks`, here and in the hosted packages' manifests",
    purpose: `the inbound webhook route of ${ir.package}: \`/webhooks/<module>/<name>/:connectionId\`.`,
    boundary:
      "the raw body reaches the receiver untouched, so the signature checks against the bytes the provider signed; " +
      "verification, routing and the outbox write are WebhookReceiver's.",
    runtime: "node",
  });
  return [
    header,
    ...importLines(imports),
    "",
    "/** The Integration of each webhook path, by its `<module>/<name>` segment. */",
    "const INTEGRATIONS: Readonly<Record<string, IntegrationClass>> = {",
    ...integrations.map(
      ({ route, integration }) => `  ${JSON.stringify(route)}: ${integration.name},`,
    ),
    "};",
    "",
    "/** Receives every provider webhook of this service. */",
    'export class InboundWebhooksController extends Controller({ path: "/webhooks/*" }) {',
    "  /** Verifies, routes and writes each delivery. */",
    "  private readonly receiver: WebhookReceiver;",
    "",
    "  /** @param receiver - the webhook receiver. */",
    "  constructor(receiver: WebhookReceiver) {",
    "    super();",
    "    this.receiver = receiver;",
    "  }",
    "",
    "  /** Hands one delivery to the receiver with its raw body and decoded query; 202 once written, 404 for a path nobody owns. */",
    "  async handle(request: Request): Promise<Response> {",
    "    const url = new URL(request.url);",
    '    const [module, name, connectionId] = url.pathname.split("/").slice(2);',
    "    const integration = INTEGRATIONS[`${module}/${name}`];",
    "    if (integration === undefined) return new Response(null, { status: 404 });",
    "    const headers: Record<string, string> = {};",
    "    request.headers.forEach((value, key) => {",
    "      headers[key] = value;",
    "    });",
    "    await this.receiver.receive({",
    "      integration,",
    "      ...(connectionId ? { connectionId } : {}),",
    "      headers,",
    "      query: Object.fromEntries(url.searchParams),",
    "      body: await request.text(),",
    "    });",
    "    return new Response(null, { status: 202 });",
    "  }",
    "}",
    "",
  ].join("\n");
}
