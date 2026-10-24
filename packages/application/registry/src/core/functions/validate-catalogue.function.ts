/**
 * Stackra file contract:
 * Purpose: `validateCatalogue(manifests)`, the checks a registry service runs before it accepts the manifests CI
 *          publishes: each manifest's structure, then, across the catalogue, duplicate members, identity collisions,
 *          module references, namespaces, unknown dependencies and dependency cycles.
 * Boundary: pure and total: it reads its argument, never throws on untrusted input and returns diagnostics only. The
 *           output depends on the set of manifests, not their order: manifests are walked sorted by member and
 *           package (input order breaks a tie between two manifests with both equal), the first owner of an identity
 *           in that order keeps it, and the diagnostics are sorted by member, path, code and message, compared by
 *           code unit, never by locale. A manifest that fails its shape, or repeats a member key, is not checked
 *           further.
 * Runtime: isomorphic
 * Governing contract: ADR 0109 (decision 2: CI publishes, the registry rejects); ADR 0214 (decision 3: dependencies
 *                     resolve); ADR 0294 (decisions 20 and 22: derived identities, prefixed by their module key).
 */
import { validate } from "@stackra/validation";

import { CatalogueDiagnosticCode } from "#core/enums/catalogue-diagnostic-code.enum";
import { CatalogueManifest } from "#core/schemas/catalogue-manifest.schema";
import type { CatalogueDiagnostic } from "#core/types/catalogue-diagnostic.type";

/** Code-unit order, the same on every machine and locale. */
const compare = (left: string, right: string): number => (left < right ? -1 : left > right ? 1 : 0);

/** A zod issue path as `modules[0].dependsOn[1]`. */
const pathOf = (path: readonly PropertyKey[]): string =>
  path.reduce<string>(
    (text, part) =>
      typeof part === "number"
        ? `${text}[${part}]`
        : `${text}${text === "" ? "" : "."}${String(part)}`,
    "",
  );

/** The `member` field of a manifest that failed its shape, when it is a string. */
const memberOf = (raw: unknown): string => {
  const member: unknown =
    typeof raw === "object" && raw !== null ? (raw as { member?: unknown }).member : undefined;
  return typeof member === "string" ? member : "";
};

/** Whether `identity` is `<module>.` followed by at least one character. */
const inNamespace = (module: string, identity: string): boolean =>
  identity.startsWith(`${module}.`) && identity.length > module.length + 1;

/**
 * Checks a set of published manifests as one catalogue.
 *
 * @param manifests - the parsed JSON of each member's `stackra.manifest.json`, untrusted.
 * @returns every problem found, sorted; an empty array when the catalogue is valid.
 * @example
 * const diagnostics = validateCatalogue([...stored, incoming]);
 * if (diagnostics.length > 0) return refuse(diagnostics);
 */
export function validateCatalogue(manifests: readonly unknown[]): CatalogueDiagnostic[] {
  const diagnostics: CatalogueDiagnostic[] = [];
  const report = (
    code: CatalogueDiagnosticCode,
    member: string,
    path: string,
    message: string,
  ): void => {
    diagnostics.push({ code, member, path, message });
  };

  const parsed: { readonly manifest: CatalogueManifest; readonly index: number }[] = [];
  manifests.forEach((raw, index) => {
    const result = validate(CatalogueManifest, raw);
    if (result.success) parsed.push({ manifest: result.data, index });
    else
      for (const issue of result.error.issues)
        report(
          CatalogueDiagnosticCode.ManifestInvalid,
          memberOf(raw),
          pathOf(issue.path),
          issue.message,
        );
  });
  parsed.sort(
    (left, right) =>
      compare(left.manifest.member, right.manifest.member) ||
      compare(left.manifest.package, right.manifest.package) ||
      left.index - right.index,
  );

  const publishers = new Map<string, string>();
  const catalogue: CatalogueManifest[] = [];
  for (const { manifest } of parsed) {
    const publisher = publishers.get(manifest.member);
    if (publisher === undefined) {
      publishers.set(manifest.member, manifest.package);
      catalogue.push(manifest);
    } else
      report(
        CatalogueDiagnosticCode.DuplicateMember,
        manifest.member,
        "",
        `member "${manifest.member}" of ${manifest.package} is already published by ${publisher}`,
      );
  }

  const owners = {
    module: new Map<string, string>(),
    action: new Map<string, string>(),
    event: new Map<string, string>(),
    permission: new Map<string, string>(),
  };
  const claim = (
    kind: keyof typeof owners,
    identity: string,
    member: string,
    path: string,
  ): boolean => {
    const owner = owners[kind].get(identity);
    if (owner === undefined) {
      owners[kind].set(identity, `${member} at ${path}`);
      return true;
    }
    report(
      CatalogueDiagnosticCode.IdentityCollision,
      member,
      path,
      `${kind} "${identity}" is already declared by ${owner}`,
    );
    return false;
  };
  const declared = new Set(catalogue.flatMap((manifest) => manifest.modules.map(({ key }) => key)));
  const dependencies = new Map<string, Set<string>>();
  const locations = new Map<string, { readonly member: string; readonly index: number }>();

  for (const manifest of catalogue) {
    const { member } = manifest;
    const own = new Set(manifest.modules.map(({ key }) => key));

    manifest.modules.forEach((module, index) => {
      if (claim("module", module.key, member, `modules[${index}].key`))
        locations.set(module.key, { member, index });
      const edges = dependencies.get(module.key) ?? new Set<string>();
      dependencies.set(module.key, edges);
      module.dependsOn.forEach((dependency, position) => {
        if (declared.has(dependency)) edges.add(dependency);
        else
          report(
            CatalogueDiagnosticCode.UnknownDependency,
            member,
            `modules[${index}].dependsOn[${position}]`,
            `module "${module.key}" depends on "${dependency}", which no manifest declares`,
          );
      });
    });

    const entries = [
      ...manifest.actions.map(({ key, module }, index) => ({
        kind: "action" as const,
        identity: key,
        module,
        path: `actions[${index}]`,
        field: "key",
      })),
      ...manifest.events.map(({ name, module }, index) => ({
        kind: "event" as const,
        identity: name,
        module,
        path: `events[${index}]`,
        field: "name",
      })),
    ];
    for (const { kind, identity, module, path, field } of entries) {
      claim(kind, identity, member, `${path}.${field}`);
      if (!own.has(module))
        report(
          CatalogueDiagnosticCode.UnknownModule,
          member,
          `${path}.module`,
          `${kind} "${identity}" names module "${module}", which ${member} does not declare`,
        );
      if (!inNamespace(module, identity))
        report(
          CatalogueDiagnosticCode.ForeignNamespace,
          member,
          `${path}.${field}`,
          `${kind} "${identity}" is outside the namespace of its module "${module}"`,
        );
    }

    manifest.permissions.forEach(({ key }, index) => {
      const path = `permissions[${index}].key`;
      claim("permission", key, member, path);
      if (![...own].some((module) => inNamespace(module, key)))
        report(
          CatalogueDiagnosticCode.ForeignNamespace,
          member,
          path,
          `permission "${key}" is outside the namespace of every module of ${member}`,
        );
    });
  }

  // Tarjan's strongly connected components: one diagnostic per group of modules that reach each other.
  const order = new Map<string, { readonly index: number; low: number }>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const connect = (key: string): void => {
    const node = { index: order.size, low: order.size };
    order.set(key, node);
    stack.push(key);
    onStack.add(key);
    for (const dependency of [...(dependencies.get(key) ?? [])].sort(compare)) {
      const visited = order.get(dependency);
      if (visited === undefined) {
        connect(dependency);
        node.low = Math.min(node.low, order.get(dependency)?.low ?? node.low);
      } else if (onStack.has(dependency)) node.low = Math.min(node.low, visited.index);
    }
    if (node.low !== node.index) return;
    const group: string[] = [];
    let top: string | undefined;
    do {
      top = stack.pop();
      if (top === undefined) break;
      onStack.delete(top);
      group.push(top);
    } while (top !== key);
    group.sort(compare);
    const [first] = group;
    const location = first === undefined ? undefined : locations.get(first);
    if (first === undefined || location === undefined) return;
    if (group.length > 1)
      report(
        CatalogueDiagnosticCode.DependencyCycle,
        location.member,
        `modules[${location.index}].dependsOn`,
        `modules ${group.map((module) => `"${module}"`).join(", ")} depend on each other in a loop`,
      );
    else if (dependencies.get(first)?.has(first))
      report(
        CatalogueDiagnosticCode.DependencyCycle,
        location.member,
        `modules[${location.index}].dependsOn`,
        `module "${first}" depends on itself`,
      );
  };
  for (const key of [...dependencies.keys()].sort(compare)) if (!order.has(key)) connect(key);

  return diagnostics.sort(
    (left, right) =>
      compare(left.member, right.member) ||
      compare(left.path, right.path) ||
      compare(left.code, right.code) ||
      compare(left.message, right.message),
  );
}
