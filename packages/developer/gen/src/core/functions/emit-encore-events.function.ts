/**
 * Stackra file contract:
 * Purpose: `emitEncoreEvents`, the events target of a service: `.stackra/encore/<member>/events.ts`, one Encore Pub/Sub
 *          `Topic` per integration event its manifest publishes, registered with `registerBrokerTopics` under the
 *          event's `<module>.<name>.v<n>` wire name so the outbox's broker publisher reaches it; and, for a service with
 *          a relay listener, `.stackra/encore/<member>/relay.ts`, one `Subscription` per integration topic of the
 *          product (its own and every publishing sibling's) that hands the envelope to its `InboxService`.
 * Boundary: pure; reads the manifest's integration events (hosted packages' included, as the outbox publishes them)
 *           and `ir.publishers`. No producer is edited to add a subscriber: the relay service imports each producer's
 *           generated topic, so a new publishing service is heard on the relay's next gen run. A wire name two
 *           publishers share is subscribed once (the first, by service key). Delivery is at least once; the inbox
 *           claims the envelope id, so a redelivery runs nothing twice. Which `EventPublisher` driver runs is runtime
 *           configuration; the topics cost nothing while the in-process driver is used.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 4: the relay hears every event); ADR 0141 (decision 2: the envelope, wire
 *                     names); ADR 0148 (decisions 3 and 6: Encore Pub/Sub in SaaS); ADR 0142 (decision 1: transports
 *                     are drivers); ADR 0078 (decisions 2 to 4: inbox deduplication).
 */
import type { StackraManifest } from "@stackra/contracts";

import { ENCORE_APP_IMPORT } from "#core/constants/encore-app-import.constant";
import { camelCase } from "#core/functions/camel-case.function";
import { generatedHeader } from "#core/functions/generated-header.function";
import { kebabCase } from "#core/functions/kebab-case.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** The integration event wire names a manifest publishes, sorted. */
function wireNames(manifest: StackraManifest): string[] {
  return [
    ...new Set(
      (manifest.events ?? [])
        .filter((event) => event.kind === "integration" && typeof event["name"] === "string")
        .map((event) => String(event["name"])),
    ),
  ].sort();
}

/** The snake_case stem of a wire name: `orders.order.paid.v1` → `orders_order_paid_v1`. */
function stem(wire: string): string {
  return wire.replace(/[^A-Za-z0-9]+/g, "_");
}

/** The exported topic constant of a wire name: `eventOrdersOrderPaidV1`. */
function topicConst(wire: string): string {
  return camelCase(`event_${stem(wire)}`);
}

/**
 * The events and relay files of a service; none for a package, an app, or a service that neither publishes nor relays.
 *
 * @example
 * emitEncoreEvents(ir, manifest).map((file) => file.path); // [".stackra/encore/orders/events.ts"]
 */
export function emitEncoreEvents(ir: MemberIR, manifest: StackraManifest): GeneratedFile[] {
  if (ir.layout !== "service") return [];
  const files: GeneratedFile[] = [];
  const own = wireNames(manifest);
  if (own.length > 0) {
    const header = generatedHeader({
      from: "stackra.manifest.json (the integration events)",
      purpose: `the integration event topics of ${ir.package}: one Pub/Sub topic per wire name.`,
      boundary:
        "the outbox's broker publisher publishes each envelope to the topic of its wire name; subscribers are the " +
        "services that import a topic from here (a relay service imports all of them).",
      runtime: "node",
    });
    files.push({
      path: `.stackra/encore/${ir.member}/events.ts`,
      content: [
        header,
        'import { registerBrokerTopics } from "@stackra/queue";',
        'import type { BrokerMessage } from "@stackra/queue/contracts";',
        'import { Topic } from "encore.dev/pubsub";',
        "",
        ...own.flatMap((wire) => [
          `/** The \`${wire}\` integration event. */`,
          `export const ${topicConst(wire)} = new Topic<BrokerMessage>(${JSON.stringify(`${kebabCase(ir.member)}-event-${kebabCase(stem(wire))}`)}, {`,
          '  deliveryGuarantee: "at-least-once",',
          "});",
          "",
        ]),
        "registerBrokerTopics([",
        ...own.map((wire) => `  { name: ${JSON.stringify(wire)}, topic: ${topicConst(wire)} },`),
        "]);",
        "",
      ].join("\n"),
    });
  }

  if (
    !ir.classes.some((declared) => declared.kind === "listener" && declared.handle?.relay === true)
  )
    return files;
  // Own topics from `./events`, each sibling's from its generated events file; first publisher of a wire name wins.
  const sources = [
    ...(own.length > 0 ? [{ from: "./events", wires: own }] : []),
    ...(ir.publishers ?? [])
      .filter((publisher) => publisher.member !== ir.member)
      .map((publisher) => ({
        from: `../../../../${publisher.folder}/.stackra/encore/${publisher.member}/events`,
        wires: wireNames(publisher.manifest),
      })),
  ];
  const seen = new Set<string>();
  const imports: string[] = [];
  const subscribed: string[] = [];
  for (const { from, wires } of sources) {
    const fresh = wires.filter((wire) => !seen.has(wire));
    if (fresh.length === 0) continue;
    for (const wire of fresh) seen.add(wire);
    imports.push(`import { ${fresh.map(topicConst).join(", ")} } from ${JSON.stringify(from)};`);
    subscribed.push(...fresh);
  }
  if (subscribed.length === 0) return files;
  const subscription = `${kebabCase(ir.member)}-relay`;
  const header = generatedHeader({
    from: "stackra.manifest.json of this service and of every publishing service beside it",
    purpose: `the relay subscriptions of ${ir.package}: every integration topic of the product, into its inbox.`,
    boundary:
      "each delivery runs InboxService#receive in the server app, so the inbox claims the event id once and hands " +
      "the envelope to the relays (and to any typed listener of it); a new publisher is heard on the next gen run.",
    runtime: "node",
  });
  files.push({
    path: `.stackra/encore/${ir.member}/relay.ts`,
    content: [
      header,
      'import type { EventEnvelope } from "@stackra/outbox/contracts";',
      'import { InboxService } from "@stackra/outbox/node";',
      'import type { BrokerMessage } from "@stackra/queue/contracts";',
      'import { Subscription } from "encore.dev/pubsub";',
      "",
      ENCORE_APP_IMPORT,
      ...imports,
      "",
      "/** Hands one delivered envelope to this service's inbox. */",
      "function receive(message: BrokerMessage): Promise<void> {",
      "  return app.handlers.run(async (container) => {",
      "    await container.get(InboxService).receive(message.body as EventEnvelope);",
      "  });",
      "}",
      "",
      ...subscribed.flatMap((wire) => [
        `/** Relays \`${wire}\`. */`,
        `export const ${topicConst(wire)}Relay = new Subscription(${topicConst(wire)}, ${JSON.stringify(subscription)}, {`,
        "  handler: receive,",
        "});",
        "",
      ]),
    ].join("\n"),
  });
  return files;
}
