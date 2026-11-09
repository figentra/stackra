/**
 * Stackra file contract:
 * Purpose: `unboundPorts`, the `port_unbound` refusal: a class of a service, app or worker whose constructor takes a
 *          port (a class that extends `Port`) that no driver binds in that member, so every container-built test
 *          would fail at boot with `UnresolvedPortError`. A port is bound when the member declares a driver for it,
 *          a declared package's manifest lists a driver entry for its port key, a `@Replaces` row replaces it, gen
 *          reaches it by itself (`GEN_REACHED_PORTS`: the pipeline's ports, the follow-the-system defaults and the
 *          server contributions), `PLATFORM_BINDINGS` or a declared package's `services` binds it, or the container
 *          builds it (`CONTAINER_BUILT`, `Clock`).
 * Boundary: pure; reads the IR only. A `Named<Port, "x">` and a per-model token are never judged (config declares the
 *           instances), nor is a port of a package the member does not declare with a manifest (undeclared packages
 *           have their own refusal), nor anything in a package member, whose own wiring picks defaults for its tests.
 *           shortcut: a manifest driver entry with no candidate the host can build (a client-only table on a server,
 *           or a manifest that predates `classes`) counts as bound; upgrade when the manifests all carry `classes`.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (a wiring mistake fails at boot, gen catches it first); ADR 0145 (ports are classes);
 *                     ADR 0294 (decision 10: a broken run writes nothing).
 */
import { BINDING_KINDS } from "#core/constants/binding-kinds.constant";
import { CONTAINER_BUILT } from "#core/constants/container-built.constant";
import { GEN_REACHED_PORTS } from "#core/constants/gen-reached-ports.constant";
import { PLATFORM_BINDINGS } from "#core/constants/platform-bindings.constant";
import { portKey } from "#core/functions/port-key.function";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** Ports the container provides without a driver row (`recipeOf` in `@stackra/container`). */
const CONTAINER_PORTS: ReadonlySet<string> = new Set(["Clock"]);

/**
 * The `port_unbound` refusals of `ir`: one per class and port.
 *
 * @param ir - the member read by discovery.
 * @example
 * unboundPorts(serviceIr); // [{ code: "port_unbound", subject: "ReportService", ... }]
 */
export function unboundPorts(ir: MemberIR): GenError[] {
  if (ir.layout === "package") return [];
  const keys = new Set(
    ir.dependencies.flatMap(({ manifest }) =>
      manifest.kind === "app" ? [] : (manifest.drivers ?? []).map((driver) => driver.key),
    ),
  );
  const services = new Set(
    ir.dependencies.flatMap(({ manifest }) =>
      manifest.kind === "app" || !Array.isArray(manifest["services"])
        ? []
        : (manifest["services"] as { readonly class?: unknown }[]).map((entry) =>
            String(entry.class),
          ),
    ),
  );
  const platform = new Set(Object.keys(PLATFORM_BINDINGS).map((key) => key.split("#")[1]));
  const replaced = new Set(
    ir.classes.flatMap((declared) =>
      declared.facets.flatMap((facet) =>
        facet.name === "Replaces" &&
        typeof facet.options === "object" &&
        facet.options !== null &&
        "$class" in facet.options
          ? [String((facet.options as { readonly $class: unknown }).$class)]
          : [],
      ),
    ),
  );
  const errors: GenError[] = [];
  for (const declared of ir.classes) {
    if (!BINDING_KINDS.includes(declared.kind) && declared.kind !== "driver") continue;
    for (const { class: port, named, of, port: isPort } of declared.deps) {
      if (isPort !== true || named !== undefined || of !== undefined) continue;
      const own = port.from.startsWith("#") || port.from.startsWith(".");
      const owner = own
        ? undefined
        : ir.dependencies.find(
            ({ package: name }) => port.from === name || port.from.startsWith(`${name}/`),
          );
      // Undecidable without the package's manifest: an undeclared package is refused elsewhere.
      if (!own && owner === undefined) continue;
      const key = portKey(own ? ir.member : (owner?.manifest.member ?? ir.member), port.name);
      const bound =
        keys.has(key) ||
        ir.classes.some(
          (candidate) =>
            candidate.kind === "driver" &&
            candidate.abstract !== true &&
            candidate.options["internal"] !== true &&
            candidate.partner?.name === port.name,
        ) ||
        replaced.has(port.name) ||
        GEN_REACHED_PORTS.includes(port.name) ||
        CONTAINER_PORTS.has(port.name) ||
        CONTAINER_BUILT.has(`${port.from}#${port.name}`) ||
        platform.has(port.name) ||
        services.has(port.name);
      if (bound) continue;
      errors.push({
        code: "port_unbound",
        file: declared.file,
        line: 0,
        column: 0,
        subject: declared.name,
        message: `${declared.name} injects the port ${port.name}, but no driver binds it in ${ir.package}: the container would throw UnresolvedPortError at boot`,
        fix: `write a driver (\`Driver(${port.name})\`) in ${ir.package}, or declare in package.json the package that ships one for ${port.name} (${port.from} only holds the port)`,
      });
    }
  }
  return errors;
}
