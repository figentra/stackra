/**
 * Stackra file contract:
 * Purpose: `webhookEventsOf`, a package's `webhookEvents` manifest section: one row per `WebhookEvent<I>` class it
 *          declares, with its provider event type, its module, the public entry that exports it (`from`), its
 *          Integration (`{ key, class, from }`) and that Integration's Connection (`{ class, from }`), so a host
 *          registers the event without reading the package's source.
 * Boundary: pure. Only a package writes the section, and only when it declares a webhook event; a service or app is
 *           never hosted, so it writes none. An event typed against an Integration the package does not declare keeps
 *           the Integration it names (no `key`) and no Connection, and its host refuses it (`hostedWebhookEvents`).
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 15 and 16); ADR 0294 (decisions 15 and 22: entry folders, a dependency is read
 *                     from its manifest).
 */
import type { Json } from "@stackra/contracts";

import { connectionOf } from "#core/functions/connection-of.function";
import { exportingSpecifier } from "#core/functions/exporting-specifier.function";
import { packageSpecifier } from "#core/functions/package-specifier.function";
import type { MemberIR } from "#core/types/member-ir.type";

/** A manifest row. */
type Entry = { [key: string]: Json };

/**
 * The webhook event rows of `ir`, in discovery order; empty for anything but a package.
 *
 * @param ir - the member read by discovery.
 * @param integrations - the member's own `integrations` rows, whose locked keys the rows name.
 * @example
 * webhookEventsOf(ir, integrations)[0];
 * // { class: "CourierShipmentUpdated", type: "shipment.updated", module: "ship_courier", from: "@acme/ship-courier/node",
 * //   integration: { key: "ship_courier.courier", class: "CourierIntegration", from: "@acme/ship-courier/node" },
 * //   connection: { class: "CourierConnection", from: "@acme/ship-courier/node" } }
 */
export function webhookEventsOf(ir: MemberIR, integrations: readonly Entry[]): Entry[] {
  if (ir.layout !== "package") return [];
  // why: a host imports each class by this specifier, so it must be an entry that exports the class, never `src/`
  const publicFrom = (name: string, file: string): string =>
    exportingSpecifier(ir.package, ir.files, name, packageSpecifier(ir.package, file));
  return ir.classes
    .filter((declared) => declared.kind === "webhook_event")
    .flatMap((declared) => {
      const partner = declared.partner;
      if (partner === undefined) return [];
      const type = declared.options["type"];
      const own = ir.classes.find(
        (candidate) => candidate.kind === "integration" && candidate.name === partner.name,
      );
      const key = integrations.find((entry) => entry["class"] === partner.name)?.["key"];
      const connection = own === undefined ? undefined : connectionOf(ir.classes, own.name);
      const row: Entry = {
        class: declared.name,
        ...(typeof type === "string" ? { type } : {}),
        module: declared.module,
        from: publicFrom(declared.name, declared.file),
        integration:
          own === undefined
            ? { class: partner.name, from: partner.from }
            : {
                ...(typeof key === "string" ? { key } : {}),
                class: own.name,
                from: publicFrom(own.name, own.file),
              },
        ...(connection !== undefined
          ? {
              connection: {
                class: connection.name,
                from: publicFrom(connection.name, connection.file),
              },
            }
          : {}),
      };
      return [row];
    });
}
