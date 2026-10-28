/**
 * Stackra file contract:
 * Purpose: `discoverWithGen`, the build-time half of an Explorer conformance test: runs gen's discovery over the
 *          member (its test files included), finds the module class the test passes, and lists every target the
 *          decorator marks on the classes that module exports, in export order and then member order: exactly what
 *          the Explorer must wrap at bootstrap.
 * Boundary: reads the member through the TypeScript host; writes nothing. The decorator itself is the key (its
 *           `kind`). When two files declare a module of the same name, the one in the calling test file is used.
 * Runtime: node
 * Governing contract: ADR 0144 as amended by 0263 (Explorers and conformance); ADR 0294 (decision 6: decorators made by
 *                     createDecorator); ADR 0269 (testing helpers).
 */
import { resolve, sep } from "node:path";

import type { DeclaredClass } from "#core/types/declared-class.type";
import { discoverMember } from "#node/functions/discover-member.function";
import type { DiscoveredTarget } from "#testing/types/discovered-target.type";

/** Whether `value` is a class written as a value. */
function isClassName(value: unknown): value is { readonly $class: string } {
  return typeof value === "object" && value !== null && "$class" in value;
}

/**
 * The targets `decorator` marks on the classes `module` exports.
 *
 * @param module - the module class under test.
 * @param decorator - the decorator, made by `createDecorator` (its `kind` is the key).
 * @param options - `root` is the member root (the working directory by default); `backend` the TypeScript host.
 * @throws Error when no module or more than one module of that name is found.
 * @example
 * expect(app.get(AccessLogExplorer).targets()).toEqual(
 *   (await discoverWithGen(FixtureModule, AccessLogged)).map((found) => found.target),
 * );
 */
export async function discoverWithGen<V = unknown>(
  module: abstract new (...args: never[]) => object,
  decorator: { readonly kind: string; on?: (type: never) => V | undefined },
  options: { readonly root?: string; readonly backend?: "tsgo" | "ts6" } = {},
): Promise<readonly DiscoveredTarget<V>[]> {
  const root = resolve(options.root ?? process.cwd());
  const caller = new Error().stack ?? "";
  const ir = await discoverMember(root, {
    includeTests: true,
    ...(options.backend !== undefined ? { backend: options.backend } : {}),
  });
  let candidates = ir.classes.filter(
    (declared) => declared.kind === "module" && declared.name === module.name,
  );
  if (candidates.length > 1)
    candidates = candidates.filter((declared) =>
      caller.includes(`${root}${sep}${declared.file.split("/").join(sep)}`),
    );
  const [found] = candidates;
  if (found === undefined || candidates.length > 1)
    throw new Error(
      candidates.length > 1
        ? `more than one module named ${module.name} in ${root}`
        : `no module class named ${module.name} in ${root} (src/, tests included)`,
    );
  const exported = found.options["exports"];
  const names = Array.isArray(exported)
    ? exported.filter(isClassName).map((value) => value.$class)
    : [];
  const classOf = (name: string): DeclaredClass | undefined =>
    ir.classes.find((declared) => declared.name === name && declared.file === found.file) ??
    ir.classes.find((declared) => declared.name === name);
  const targets: DiscoveredTarget<V>[] = [];
  for (const name of names) {
    const declared = classOf(name);
    if (declared === undefined) continue;
    for (const facet of declared.facets) {
      if (facet.kind !== decorator.kind) continue;
      const members =
        facet.target === "class"
          ? declared.methods
          : facet.member === undefined
            ? []
            : [facet.member];
      for (const member of members)
        targets.push({
          target: `${declared.name}.${member}`,
          class: declared.name,
          member,
          options: facet.options as V | undefined,
        });
    }
  }
  return targets;
}
