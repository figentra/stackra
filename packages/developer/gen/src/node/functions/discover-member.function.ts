/**
 * Stackra file contract:
 * Purpose: `discoverMember`, gen's discovery: opens the member's program behind the host seam, reads every kind
 *          class, shape, enum, shell slot, slot fill and file export of its own sources (sorted by path), its dependency package names and the
 *          committed manifests of those that ship one, the committed manifests of the services it injects a client
 *          of or listens to an event of (for a member with a relay, every publishing sibling service's; and which of those exist beside it in the workspace), the services any of its files imports a client from, its lang catalogues
 *          (`assets/lang/<locale>/*.json`), those its declared `@stackra/*` packages ship and those of the services it consumes through a client (STA-1363), the `I18n` keys its files use, its modules and its authored root module, and fills each `DriverName<Port>` field with the driver names
 *          found for that port, the writes that skip the unit of work (`readNativeWrites`, stackra-262) and the
 *          `t.searchable` literals of its migrations (`readSearchableColumns`, data-layer gap se10): the
 *          `MemberIR` every gen output is a pure function of.
 * Boundary: reads the member; writes nothing. Refusals are collected into `errors`, never thrown; only an unreadable
 *           package.json, tsconfig, dependency manifest or catalogue throws. The program is always closed.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 10, 20, 25 and 26); ADR 0305 (rules 15, 16 and 42); ADR 0090 as amended
 *                     (discovery from the member's folders); ADR 0260 (decisions 3 and 4: clients and events from the
 *                     producer's manifest); STA-1293 (client imports and lang
 *                     catalogues); STA-1298 (package catalogues and key references); ADR 0438 (slots and fills);
 *                     STA-1363 (consumed services' catalogues).
 */
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { kebabCase } from "@stackra/support";

import { CLIENTS_SPECIFIER } from "#core/constants/clients-specifier.constant";
import { driverName } from "#core/functions/driver-name.function";
import { folderKey } from "#core/functions/folder-key.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { EnumIR } from "#core/types/enum-ir.type";
import type { FileExports } from "#core/types/file-exports.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";
import type { SlotFillIR } from "#core/types/slot-fill-ir.type";
import type { SlotIR } from "#core/types/slot-ir.type";
import type { TypeDesc } from "#core/types/type-desc.type";
import { createSourceReader } from "#node/functions/create-source-reader.function";
import { openHost } from "#node/functions/open-host.function";
import { readDependencyManifests } from "#node/functions/read-dependency-manifests.function";
import { readMemberFacts } from "#node/functions/read-member-facts.function";
import { readCatalogues } from "#node/functions/read-catalogues.function";
import { readI18nReferences } from "#node/functions/read-i18n-references.function";
import { readNativeWrites } from "#node/functions/read-native-writes.function";
import { readSearchableColumns } from "#node/functions/read-searchable-columns.function";
import { readPackageCatalogues } from "#node/functions/read-package-catalogues.function";
import { readPublisherManifests } from "#node/functions/read-publisher-manifests.function";
import { readServiceCatalogues } from "#node/functions/read-service-catalogues.function";
import { readServiceManifests } from "#node/functions/read-service-manifests.function";

/** A type with every `DriverName<Port>` filled from `names`. */
function withDrivers(type: TypeDesc, names: ReadonlyMap<string, readonly string[]>): TypeDesc {
  switch (type.kind) {
    case "driver_name": {
      return { ...type, values: [...(names.get(type.port) ?? [])] };
    }
    case "array": {
      return { ...type, element: withDrivers(type.element, names) };
    }
    case "record": {
      return { ...type, value: withDrivers(type.value, names) };
    }
    default: {
      return type;
    }
  }
}

/** The root module path of a layout, relative to `src/`. */
function rootModulePath(layout: MemberIR["layout"], member: string): string {
  const stem = member.replaceAll("_", "-");
  return layout === "package" ? `src/node/${stem}.module.ts` : `src/${stem}.module.ts`;
}

/**
 * What gen reads from the member at `root`.
 *
 * @param root - the member root.
 * @param options - `backend` picks the host (`tsgo` by default); `includeTests` also reads `__tests__` files.
 * @throws Error when package.json, tsconfig.json or a dependency manifest cannot be read.
 * @example
 * const ir = await discoverMember("packages/commerce/loyalty-kit");
 * ir.classes.filter((declared) => declared.kind === "action").length;
 */
export async function discoverMember(
  root: string,
  options: { readonly backend?: "tsgo" | "ts6"; readonly includeTests?: boolean } = {},
): Promise<MemberIR> {
  const facts = readMemberFacts(root);
  const host = await openHost(join(facts.root, "tsconfig.json"), options.backend);
  try {
    const reader = createSourceReader(
      host,
      facts,
      options.includeTests === true ? { includeTests: true } : {},
    );
    const classes: DeclaredClass[] = [];
    const shapes: ShapeIR[] = [];
    const enums: EnumIR[] = [];
    const files: FileExports[] = [];
    const slots: SlotIR[] = [];
    const fills: SlotFillIR[] = [];
    for (const file of reader.sources) {
      classes.push(...reader.classes(file));
      slots.push(...reader.slots(file));
      fills.push(...reader.fills(file));
      shapes.push(...reader.shapes(file));
      enums.push(...reader.enums(file));
      files.push(reader.exports(file));
    }
    const dependencies = readDependencyManifests(facts.root, facts.dependencies);
    // A service is consumed by an injected client, by a listener of one of its events, or by any file importing it.
    const clientImports = reader.clientImports();
    const consumed = [
      ...classes.flatMap((declared) =>
        [...declared.deps.map((dep) => dep.class.from), declared.handle?.event?.from ?? ""]
          .filter((from) => from.startsWith(CLIENTS_SPECIFIER))
          .map((from) => from.slice(CLIENTS_SPECIFIER.length)),
      ),
      ...clientImports.map((imported) => imported.service),
    ];
    const catalogues = readCatalogues(facts.root);
    // The lang its runtime packages ship, found like their manifests, and the keys its files use (STA-1298). A
    // devDependency's lang never reaches the runtime, so it is neither merged nor a clash (STA-1309).
    const shippedCatalogues = readPackageCatalogues(facts.root, facts.runtimeDependencies ?? []);
    const i18nReferences = readI18nReferences(facts.root);
    // Writes that skip the unit of work, refused on an encrypted model (stackra-262).
    const nativeWrites = readNativeWrites(facts.root);
    // The search columns each migration declares, refused when a facet drifts from them (data-layer gap se10).
    const searchableColumns = readSearchableColumns(facts.root, facts.layout, facts.member);
    // A relay service hears every integration topic of the product (ADR 0260 decision 4).
    const publishers =
      facts.layout === "service" && classes.some((declared) => declared.handle?.relay === true)
        ? readPublisherManifests(facts.root)
        : [];
    const services = readServiceManifests(facts.root, consumed);
    // The lang of each service it consumes through a client, after its packages' (STA-1363).
    const packageCatalogues = [
      ...shippedCatalogues,
      ...readServiceCatalogues(facts.root, services),
    ];
    // Consumed services with a folder beside the member: the manifest pass waits for these instead of refusing them.
    const workspaceServices = [...new Set(consumed)]
      .filter((service) =>
        [dirname(facts.root), join(dirname(dirname(facts.root)), "services")].some((parent) =>
          [service, kebabCase(service)].some((folder) =>
            existsSync(join(parent, folder, "package.json")),
          ),
        ),
      )
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort();

    // Driver names per port class: this member's drivers, then each dependency's.
    const names = new Map<string, Set<string>>();
    const add = (port: string, name: string): void => {
      names.set(port, (names.get(port) ?? new Set()).add(name));
    };
    for (const declared of classes)
      if (declared.kind === "driver" && declared.partner !== undefined)
        add(declared.partner.name, driverName(declared.file, declared.partner.name));
    for (const { manifest } of dependencies)
      for (const driver of manifest.drivers ?? [])
        for (const candidate of Array.isArray(driver["candidates"]) ? driver["candidates"] : [])
          add(driver.port, String(candidate));
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    const sorted = new Map([...names].map(([port, set]) => [port, [...set].sort()]));
    const filled = shapes.map((shape) => ({
      ...shape,
      fields: shape.fields.map((field) => ({ ...field, type: withDrivers(field.type, sorted) })),
    }));

    const modulesFolder = join(facts.root, "src", "modules");
    const folders =
      facts.layout === "service" && existsSync(modulesFolder)
        ? readdirSync(modulesFolder, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => folderKey(entry.name))
            // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
            .sort()
        : [];
    const used = new Set([
      ...classes.map((declared) => declared.module),
      ...filled.map((shape) => shape.module),
    ]);
    const modules = [
      ...(folders.length === 0 || used.has(facts.member) ? [facts.member] : []),
      ...folders.filter((key) => key !== facts.member),
    ];

    const authored = classes.find(
      (declared) =>
        declared.kind === "module" && declared.file === rootModulePath(facts.layout, facts.member),
    );
    return {
      member: facts.member,
      package: facts.package,
      version: facts.version,
      layout: facts.layout,
      ...(facts.kind !== undefined ? { kind: facts.kind } : {}),
      ...(facts.area !== undefined ? { area: facts.area } : {}),
      ...(facts.targets !== undefined ? { targets: facts.targets } : {}),
      ...(authored !== undefined
        ? { rootModule: { name: authored.name, from: authored.importPath } }
        : {}),
      modules,
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      classes: classes.sort((left, right) =>
        left.file === right.file
          ? left.name.localeCompare(right.name)
          : left.file < right.file
            ? -1
            : 1,
      ),
      shapes: filled,
      enums,
      files,
      ...(slots.length > 0 ? { slots } : {}),
      ...(fills.length > 0 ? { fills } : {}),
      packages: facts.dependencies,
      dependencies,
      ...(services.length > 0 ? { services } : {}),
      ...(publishers.length > 0 ? { publishers } : {}),
      ...(workspaceServices.length > 0 ? { workspaceServices } : {}),
      ...(clientImports.length > 0 ? { clientImports } : {}),
      ...(catalogues !== undefined ? { catalogues } : {}),
      ...(packageCatalogues.length > 0 ? { packageCatalogues } : {}),
      ...(i18nReferences.length > 0 ? { i18nReferences } : {}),
      ...(nativeWrites.length > 0 ? { nativeWrites } : {}),
      ...(searchableColumns.length > 0 ? { searchableColumns } : {}),
      errors: [...reader.errors],
    };
  } finally {
    host.close();
  }
}
