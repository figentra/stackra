/**
 * Stackra file contract:
 * Purpose: `emitEncoreEvents`, the events target of a service: `.stackra/encore/<member>/events.ts`, one Encore Pub/Sub
 *          `Topic` per integration event its manifest publishes, registered with `registerBrokerTopics` under the
 *          event's `<module>.<name>.v<n>` wire name so the outbox's broker publisher reaches it; and, for a service with
 *          a relay listener, `.stackra/encore/<member>/relay.ts`, one `Subscription` per integration topic of the
 *          product (its own and every publishing sibling's) that hands the envelope to its `InboxService`; and, for a
 *          service whose listeners take a `#stackra/clients/<service>` event, `.stackra/encore/<member>/subscriptions.ts`,
 *          one `Subscription` per consumed event on the producer's generated topic, into the same inbox, which runs the
 *          typed listeners; a local listener of the service's own integration event gets one on its own topic too
 *          (STA-1302), so the broker driver still delivers it once, after commit.
 * Boundary: pure; reads the manifest's integration events (hosted packages' included, as the outbox publishes them)
 *           and `ir.publishers`. No producer is edited to add a subscriber: the relay service imports each producer's
 *           generated topic, so a new publishing service is heard on the relay's next gen run. A wire name two
 *           publishers share is subscribed once (the first, by service key). Delivery is at least once; the inbox
 *           claims the envelope id, so a redelivery runs nothing twice. Which `EventPublisher` driver runs is runtime
 *           configuration; the topics cost nothing while the in-process driver is used. A relay service gets no typed
 *           subscription for a wire name its relay already hears (the inbox runs the typed listeners from either).
 *           The cross-service topic imports are not yet checked by an Encore build (STA-597).
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 4: the relay hears every event; typed consumers by the event class); ADR 0141 (decision 2: the envelope, wire
 *                     names); ADR 0148 (decisions 3 and 6: Encore Pub/Sub in SaaS); ADR 0142 (decision 1: transports
 *                     are drivers); ADR 0078 (decisions 2 to 4: inbox deduplication).
 */
import type { StackraManifest } from "@stackra/contracts";
import { camelCase, kebabCase } from "@stackra/support";

import { CLIENTS_SPECIFIER } from "#core/constants/clients-specifier.constant";
import { ENCORE_APP_IMPORT } from "#core/constants/encore-app-import.constant";
import { generatedHeader } from "#core/functions/generated-header.function";
import { serviceManifest } from "#core/functions/service-manifest.function";
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
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  ].sort();
}

/** The snake_case stem of a wire name: `orders.order.paid.v1` → `orders_order_paid_v1`. */
function stem(wire: string): string {
  return wire.replaceAll(/[^A-Za-z0-9]+/g, "_");
}

/** The exported topic constant of a wire name: `eventOrdersOrderPaidV1`. */
function topicConst(wire: string): string {
  return camelCase(`event_${stem(wire)}`);
}

/** The imports and the `receive` handler of a subscriptions file, into the service's inbox. */
function inboxPreamble(imports: readonly string[]): string[] {
  return [
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
  ];
}

/**
 * The events, relay and subscriptions files of a service; none for a package, an app, or a service that neither
 * publishes, relays nor consumes another service's event.
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

  const relaySubscribed = emitRelay(ir, own, files);
  emitSubscriptions(ir, manifest, relaySubscribed, files);
  return files;
}

/** Writes `relay.ts` for a service with a relay listener; returns the wire names it subscribes to. */
function emitRelay(ir: MemberIR, own: readonly string[], files: GeneratedFile[]): Set<string> {
  const seen = new Set<string>();
  if (
    !ir.classes.some((declared) => declared.kind === "listener" && declared.handle?.relay === true)
  )
    return seen;
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
  const imports: string[] = [];
  const subscribed: string[] = [];
  for (const { from, wires } of sources) {
    const fresh = wires.filter((wire) => !seen.has(wire));
    if (fresh.length === 0) continue;
    for (const wire of fresh) seen.add(wire);
    imports.push(`import { ${fresh.map(topicConst).join(", ")} } from ${JSON.stringify(from)};`);
    subscribed.push(...fresh);
  }
  if (subscribed.length === 0) return seen;
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
      ...inboxPreamble(imports),
      ...subscribed.flatMap((wire) => [
        `/** Relays \`${wire}\`. */`,
        `export const ${topicConst(wire)}Relay = new Subscription(${topicConst(wire)}, ${JSON.stringify(subscription)}, {`,
        "  handler: receive,",
        "});",
        "",
      ]),
    ].join("\n"),
  });
  return seen;
}

/**
 * Writes `subscriptions.ts` for a service whose listeners take a `#stackra/clients/<service>` event, or one of its own
 * integration events: one `Subscription` per consumed wire name on the producer's generated topic (its own from
 * `./events`, STA-1302), into the inbox, which runs the typed listeners. With the broker `EventPublisher` driver the
 * outbox publishes only to the topic, so without the own-topic subscription a local listener would never run; the
 * inbox claims the event id, so it still runs once, after commit. A wire name the relay already hears, or one the
 * producer's manifest does not publish (a `client_event_unknown` refusal of the clients target), is left out.
 */
function emitSubscriptions(
  ir: MemberIR,
  manifest: StackraManifest,
  skip: ReadonlySet<string>,
  files: GeneratedFile[],
): void {
  const byService = new Map<string, Set<string>>();
  for (const declared of ir.classes) {
    const event = declared.kind === "listener" ? declared.handle?.event : undefined;
    if (event === undefined) continue;
    // An own event (its own module, a hosted package's, or its own client path) is on its own topic.
    const service = event.from.startsWith(CLIENTS_SPECIFIER)
      ? event.from.slice(CLIENTS_SPECIFIER.length)
      : ir.member;
    const events = service === ir.member ? manifest.events : serviceManifest(ir, service)?.events;
    const entry = (events ?? []).find(
      (candidate) => candidate.kind === "integration" && candidate["class"] === event.name,
    );
    const wire = entry?.["name"];
    if (typeof wire !== "string" || skip.has(wire)) continue;
    byService.set(service, (byService.get(service) ?? new Set()).add(wire));
  }
  if (byService.size === 0) return;
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  const services = [...byService].sort(([left], [right]) => (left < right ? -1 : 1));
  // First consuming import of a wire name wins, as in the relay.
  const seen = new Set<string>();
  const imports: string[] = [];
  const subscribed: string[] = [];
  for (const [service, wires] of services) {
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    const fresh = [...wires].filter((wire) => !seen.has(wire)).sort();
    if (fresh.length === 0) continue;
    for (const wire of fresh) seen.add(wire);
    const folder =
      ir.services?.find((candidate) => candidate.member === service)?.folder ?? service;
    const from =
      service === ir.member
        ? "./events"
        : `../../../../${folder}/.stackra/encore/${service}/events`;
    imports.push(`import { ${fresh.map(topicConst).join(", ")} } from ${JSON.stringify(from)};`);
    subscribed.push(...fresh);
  }
  const header = generatedHeader({
    from: "the listeners of integration events (own and #stackra/clients/<service>) and the stackra.manifest.json files",
    purpose: `the typed event subscriptions of ${ir.package}: one per consumed integration event, into its inbox.`,
    boundary:
      "each delivery runs InboxService#receive in the server app, so the inbox claims the event id once and runs the " +
      "typed listeners of it; the producer is never edited, and a new consumed event is subscribed on the next gen run.",
    runtime: "node",
  });
  files.push({
    path: `.stackra/encore/${ir.member}/subscriptions.ts`,
    content: [
      header,
      ...inboxPreamble(imports),
      ...subscribed.flatMap((wire) => [
        `/** Delivers \`${wire}\` to this service's typed listeners. */`,
        `export const ${topicConst(wire)}Subscription = new Subscription(${topicConst(wire)}, ${JSON.stringify(`${kebabCase(ir.member)}-${kebabCase(stem(wire))}`)}, {`,
        "  handler: receive,",
        "});",
        "",
      ]),
    ].join("\n"),
  });
}
