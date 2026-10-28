/**
 * Stackra file contract:
 * Purpose: `memberGraphOf`, one member's part of the system graph from what gen already read and derived: its
 *          modules; the services it calls (a constructor typed with a `#stackra/clients/<service>` client, or any file
 *          importing from there); the integration events it publishes (the manifest's, hosted packages' included) and
 *          the ones its listeners consume from other services (wire names from the producer's committed manifest);
 *          its model tables; the packages it builds on; and its ports with their driver candidates.
 * Boundary: pure; reads the IR and the manifest `buildManifest` returned, nothing else. A consumed event whose
 *           producer manifest is missing or does not publish it is left out (the clients target refuses it as
 *           `client_event_unknown`). Every list is sorted and de-duplicated, so the file is deterministic.
 * Runtime: isomorphic
 * Governing contract: ADR 0452 (decision 1); ADR 0260 (decisions 3 and 4: clients and events from the producer's
 *                     manifest); STA-845.
 */
import type { StackraManifest } from "@stackra/contracts";

import { CLIENTS_SPECIFIER } from "#core/constants/clients-specifier.constant";
import { serviceManifest } from "#core/functions/service-manifest.function";
import type { MemberGraph } from "#core/types/member-graph.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** `values`, de-duplicated and sorted. */
function sorted(values: Iterable<string>): string[] {
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  return [...new Set(values)].sort();
}

/** The service a `#stackra/clients/<service>` specifier names, or undefined for any other specifier. */
function clientService(from: string): string | undefined {
  return from.startsWith(CLIENTS_SPECIFIER) ? from.slice(CLIENTS_SPECIFIER.length) : undefined;
}

/**
 * The graph part of `ir`.
 *
 * @param ir - the member read by discovery.
 * @param manifest - the manifest `buildManifest` derived from `ir`.
 * @example
 * memberGraphOf(ir, manifest).eventsOut; // ["invoicing.document.issued.v1"]
 */
export function memberGraphOf(ir: MemberIR, manifest: StackraManifest): MemberGraph {
  const calls = [
    ...ir.classes.flatMap((declared) => declared.deps.map((dep) => clientService(dep.class.from))),
    ...(ir.clientImports ?? []).map((imported) => imported.service),
  ].filter((service): service is string => service !== undefined && service !== ir.member);

  const eventsIn: string[] = [];
  for (const declared of ir.classes) {
    const event = declared.kind === "listener" ? declared.handle?.event : undefined;
    const service = event === undefined ? undefined : clientService(event.from);
    if (event === undefined || service === undefined || service === ir.member) continue;
    const wire = (serviceManifest(ir, service)?.events ?? []).find(
      (candidate) => candidate.kind === "integration" && candidate["class"] === event.name,
    )?.name;
    if (wire !== undefined) eventsIn.push(wire);
  }

  const manifests = new Set(ir.dependencies.map((dependency) => dependency.package));
  const drivers = new Map<string, string[]>();
  for (const driver of manifest.drivers ?? []) {
    const candidates = Array.isArray(driver["candidates"])
      ? (driver["candidates"] as unknown[]).filter(
          (name): name is string => typeof name === "string",
        )
      : [];
    drivers.set(driver.key, [...(drivers.get(driver.key) ?? []), ...candidates]);
  }

  return {
    member: ir.member,
    package: ir.package,
    layout: ir.layout,
    modules: sorted(ir.modules),
    calls: sorted(calls),
    eventsOut: sorted(
      (manifest.events ?? [])
        .filter((event) => event.kind === "integration")
        .map((event) => event.name),
    ),
    eventsIn: sorted(eventsIn),
    tables: sorted((manifest.models ?? []).map((model) => model.table)),
    packages: sorted(
      [...(ir.packages ?? []), ...manifests].filter(
        (name) => name !== ir.package && (name.startsWith("@stackra/") || manifests.has(name)),
      ),
    ),
    drivers: [...drivers]
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([port, candidates]) => ({ port, candidates: sorted(candidates) })),
  };
}
