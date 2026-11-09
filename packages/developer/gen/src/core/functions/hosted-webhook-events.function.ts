/**
 * Stackra file contract:
 * Purpose: `hostedWebhookEvents`, the `WebhookEvent<I>` classes a service's hosted packages list in their manifests
 *          (`webhookEvents`), each paired with the Integration and the Connection the same manifest lists for it, so
 *          `#stackra/registrations` registers them beside the service's own; and the refusals:
 *          `webhook_event_unpaired` (a listed event whose Integration that manifest does not list, or whose Connection
 *          differs from the one that manifest lists for the Integration) and `webhook_route_duplicate` (two classes,
 *          hosted or the service's own, for one provider event type of one hosted Integration).
 * Boundary: pure; reads the committed manifests only, never a package's source. Only a service hosts, so anything
 *           else gets nothing. A manifest without `webhookEvents` (written before the section) lists none. An event
 *           refused here is never returned, so it is never registered half paired.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 15 and 16); ADR 0294 (decision 22: a dependency is read from its manifest, a
 *                     refusal carries its fix).
 */
import type { ClassRef } from "#core/types/class-ref.type";
import type { GenError } from "#core/types/gen-error.type";
import type { HostedWebhookEvent } from "#core/types/hosted-webhook-event.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** A `{ class, from }` value of a manifest row, or undefined when it names none. */
function classRefOf(value: unknown): ClassRef | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const name: unknown = Reflect.get(value, "class");
  const from: unknown = Reflect.get(value, "from");
  return typeof name === "string" && typeof from === "string" ? { name, from } : undefined;
}

/**
 * The hosted webhook events of `ir`, in dependency order, and the refusals found pairing them.
 *
 * @param ir - the member read by discovery.
 * @example
 * hostedWebhookEvents(ir).events[0];
 * // { package: "@acme/ship-courier", event: { name: "CourierShipmentUpdated", from: "@acme/ship-courier/node" },
 * //   type: "shipment.updated", integration: { … }, connection: { name: "CourierConnection", … } }
 */
export function hostedWebhookEvents(ir: MemberIR): {
  readonly events: readonly HostedWebhookEvent[];
  readonly errors: readonly GenError[];
} {
  const events: HostedWebhookEvent[] = [];
  const errors: GenError[] = [];
  if (ir.layout !== "service") return { events, errors };
  const refuse = (code: string, file: string, subject: string, message: string, fix: string) =>
    errors.push({ code, file, line: 0, column: 0, subject, message, fix });
  // The class that holds each `<package>#<Integration>|<type>` route, as the refusal names it.
  const routes = new Map<string, string>();

  for (const { package: name, manifest } of ir.dependencies) {
    const rows = manifest["webhookEvents"];
    if (manifest["kind"] === "app" || !Array.isArray(rows)) continue;
    const integrations = Array.isArray(manifest["integrations"])
      ? (manifest["integrations"] as readonly Readonly<Record<string, unknown>>[])
      : [];
    for (const row of rows as readonly Readonly<Record<string, unknown>>[]) {
      const event = classRefOf(row);
      if (event === undefined) continue;
      const integration = classRefOf(row["integration"]);
      const connection = classRefOf(row["connection"]);
      const key = (row["integration"] as { readonly key?: unknown } | undefined)?.key;
      const listed =
        integration === undefined
          ? undefined
          : integrations.find(
              (entry) =>
                entry["class"] === integration.name && (key === undefined || entry["key"] === key),
            );
      if (integration === undefined || listed === undefined) {
        refuse(
          "webhook_event_unpaired",
          "package.json",
          event.name,
          `${event.name} of ${name} is typed against ${integration?.name ?? "no Integration"}, which ${name}'s manifest lists no Integration for`,
          `declare ${event.name} in the package that ships ${integration?.name ?? "its Integration"} and its Connection, and regenerate that package's manifest`,
        );
        continue;
      }
      const listedConnection =
        typeof listed["connection"] === "string" ? listed["connection"] : undefined;
      if (listedConnection !== connection?.name) {
        refuse(
          "webhook_event_unpaired",
          "package.json",
          event.name,
          `${event.name} of ${name} pairs ${integration.name} with ${connection?.name ?? "no Connection"}, but ${name}'s manifest connects ${integration.name} by ${listedConnection ?? "no Connection"}`,
          `regenerate ${name}'s manifest, so ${event.name} carries the Connection of ${integration.name}`,
        );
        continue;
      }
      const type = typeof row["type"] === "string" ? row["type"] : undefined;
      if (type !== undefined) {
        const route = `${name}#${integration.name}|${type}`;
        const holder = routes.get(route);
        if (holder !== undefined) {
          refuse(
            "webhook_route_duplicate",
            "package.json",
            event.name,
            `${event.name} and ${holder} both handle ${integration.name}'s "${type}" webhook`,
            `keep one class for "${type}" in ${name}`,
          );
          continue;
        }
        routes.set(route, `${event.name} of ${name}`);
      }
      events.push({
        package: name,
        event,
        ...(type === undefined ? {} : { type }),
        integration,
        ...(connection === undefined ? {} : { connection }),
      });
    }
  }

  // why: a service that still declares its own copy of an event its package now ships would route one type twice
  for (const declared of ir.classes) {
    const partner = declared.partner;
    const type = declared.options["type"];
    if (declared.kind !== "webhook_event" || partner === undefined || typeof type !== "string")
      continue;
    const owner = ir.dependencies.find(
      (dependency) =>
        partner.from === dependency.package || partner.from.startsWith(`${dependency.package}/`),
    );
    const holder =
      owner === undefined ? undefined : routes.get(`${owner.package}#${partner.name}|${type}`);
    if (holder !== undefined)
      refuse(
        "webhook_route_duplicate",
        declared.file,
        declared.name,
        `${declared.name} and ${holder} both handle ${partner.name}'s "${type}" webhook`,
        `delete ${declared.name} and type your listener with the package's event instead`,
      );
  }
  return { events, errors };
}
