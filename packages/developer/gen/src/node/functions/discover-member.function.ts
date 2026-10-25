/**
 * Stackra file contract:
 * Purpose: `discoverMember`, gen's discovery: opens the member's program behind the host seam, reads every kind
 *          class, shape, enum and file export of its own sources (sorted by path), its dependency package names and the
 *          committed manifests of those that ship one, its modules and its authored root module, and fills each
 *          `DriverName<Port>` field with the driver names found for that port: the `MemberIR` every gen output is a
 *          pure function of.
 * Boundary: reads the member; writes nothing. Refusals are collected into `errors`, never thrown; only an unreadable
 *           package.json, tsconfig or dependency manifest throws. The program is always closed.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 10, 20, 25 and 26); ADR 0305 (rules 15, 16 and 42); ADR 0090 as amended
 *                     (discovery from the member's folders).
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { driverName } from "#core/functions/driver-name.function";
import { folderKey } from "#core/functions/folder-key.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { EnumIR } from "#core/types/enum-ir.type";
import type { FileExports } from "#core/types/file-exports.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";
import type { TypeDesc } from "#core/types/type-desc.type";
import { createSourceReader } from "#node/functions/create-source-reader.function";
import { openHost } from "#node/functions/open-host.function";
import { readDependencyManifests } from "#node/functions/read-dependency-manifests.function";
import { readMemberFacts } from "#node/functions/read-member-facts.function";

/** A type with every `DriverName<Port>` filled from `names`. */
function withDrivers(type: TypeDesc, names: ReadonlyMap<string, readonly string[]>): TypeDesc {
  switch (type.kind) {
    case "driver_name":
      return { ...type, values: [...(names.get(type.port) ?? [])] };
    case "array":
      return { ...type, element: withDrivers(type.element, names) };
    case "record":
      return { ...type, value: withDrivers(type.value, names) };
    default:
      return type;
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
    for (const file of reader.sources) {
      classes.push(...reader.classes(file));
      shapes.push(...reader.shapes(file));
      enums.push(...reader.enums(file));
      files.push(reader.exports(file));
    }
    const dependencies = readDependencyManifests(facts.root, facts.dependencies);

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
      packages: facts.dependencies,
      dependencies,
      errors: [...reader.errors],
    };
  } finally {
    host.close();
  }
}
