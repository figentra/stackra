/**
 * Stackra file contract:
 * Purpose: `checkConventions`, the quality-gate refusals gen can see from the whole member (STA-1306, coverage audit
 *          2026-10-27 section 4): `kind_suffix_mismatch` (a kind class in another kind's file),
 *          `kind_unregistered_base` (a class in a kind file that extends no kind base), `kind_class_name` (the class is
 *          not `PascalCase(stem)` plus its kind's suffix), `empty_module` (a module file that states nothing),
 *          `sibling_not_exported` (a service injected from a sibling module that does not export it), `module_cycle`,
 *          `migration_numbering` (`NNNN-<name>.migration.ts`, per folder, from 0001 without gaps), `event_name_shape` (an
 *          integration event's `name` is `<aggregate>.<verb>`) and
 *          `override_legacy_name` (an override under `src/overrides/` that does not keep its base's plain name).
 * Boundary: pure; reads the IR and the module graph of the built manifest. Run on the full pass only, never the
 *           manifest pass, so a convention refusal never blocks `stackra gen --manifests`. Only files directly under a
 *           `<stem>.<suffix>.ts` name whose suffix is a `KIND_FILES` row are checked. Default applied 2026-10-27
 *           (owner may override): a service may also be named by its stem alone (`EventBus`), names compare without
 *           case (`WhatsApp`), and only an injected service counts for `sibling_not_exported`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (R1 to R3, decisions 13 and 24); ADR 0305 (rules 1 to 3 and 15 to 18, conventions 4);
 *                     ADR 0263 (sibling exports and module cycles); ADR 0159 (migrations are frozen); STA-1306.
 */
import type { StackraManifest } from "@stackra/contracts";

import { KIND_FILES } from "#core/constants/kind-files.constant";
import { pascalCase } from "#core/functions/pascal-case.function";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** `<stem>.<suffix>.ts` under `src/`. */
const KIND_FILE = /^src\/(?:.*\/)?([^/.]+)\.([a-z][a-z0-9-]*)\.ts$/;

/** A migration file's name. */
const MIGRATION_FILE = /^(\d{4})-([a-z0-9]+(?:-[a-z0-9]+)*)\.migration\.ts$/;

/** An integration event's written name: `<aggregate>.<verb>`, so the wire name is `<module>.<aggregate>.<verb>.v<n>`. */
const EVENT_NAME = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

/** Every file suffix some kind lives in. */
const SUFFIXES = new Set(Object.values(KIND_FILES).map((row) => row.file));

/** One whole-file or whole-class refusal. */
function error(
  code: string,
  file: string,
  subject: string,
  message: string,
  fix: string,
): GenError {
  return { code, file, line: 0, column: 0, subject, message, fix };
}

/** The stem and suffix of a kind file, or undefined. */
function kindFile(file: string): { stem: string; suffix: string } | undefined {
  const match = KIND_FILE.exec(file);
  if (match === null || !SUFFIXES.has(match[2] ?? "")) return undefined;
  return { stem: (match[1] ?? "").replace(/^\d{4}-/, ""), suffix: match[2] ?? "" };
}

/** Every cycle of the module graph, each once, starting at its smallest key. */
function cycles(graph: ReadonlyMap<string, readonly string[]>): string[][] {
  const found = new Map<string, string[]>();
  const walk = (path: readonly string[]): void => {
    const last = path.at(-1) ?? "";
    for (const next of graph.get(last) ?? []) {
      const at = path.indexOf(next);
      if (at >= 0) {
        const cycle = path.slice(at);
        const start = cycle.indexOf([...cycle].sort()[0] ?? "");
        const rotated = [...cycle.slice(start), ...cycle.slice(0, start)];
        found.set(rotated.join(">"), rotated);
      } else walk([...path, next]);
    }
  };
  for (const key of [...graph.keys()].sort()) walk([key]);
  return [...found.values()].sort((left, right) => left.join(">").localeCompare(right.join(">")));
}

/**
 * The convention refusals of `ir`.
 *
 * @param ir - the member read by discovery.
 * @param manifest - its built manifest, for the module graph.
 * @example
 * checkConventions(ir, manifest).map((refusal) => refusal.code); // ["kind_class_name"]
 */
export function checkConventions(ir: MemberIR, manifest: StackraManifest): GenError[] {
  const errors: GenError[] = [];

  // Kind files: the class's kind matches the suffix, and its name is derived from the file.
  const kinded = new Set<string>();
  for (const declared of ir.classes) {
    kinded.add(`${declared.file}#${declared.name}`);
    const at = kindFile(declared.file);
    const row = KIND_FILES[declared.kind];
    if (at === undefined || row === undefined) continue;
    if (row.file !== at.suffix) {
      errors.push(
        error(
          "kind_suffix_mismatch",
          declared.file,
          declared.name,
          `${declared.name} is a ${declared.kind} but sits in a .${at.suffix}.ts file`,
          `move it to <stem>.${row.file}.ts in its kind's group, or extend the ${at.suffix} kind's base`,
        ),
      );
      continue;
    }
    const expected = pascalCase(at.stem) + row.suffix;
    const accepted = [expected, ...(declared.kind === "service" ? [pascalCase(at.stem)] : [])];
    if (!accepted.some((name) => name.toLowerCase() === declared.name.toLowerCase()))
      errors.push(
        error(
          "kind_class_name",
          declared.file,
          declared.name,
          `a ${declared.kind} in ${declared.file} is named ${expected}, not ${declared.name}`,
          `rename the class to ${expected} (and its imports), or rename the file after the class`,
        ),
      );
  }
  for (const file of ir.files) {
    const at = kindFile(file.file);
    if (at === undefined) continue;
    for (const name of file.classes ?? [])
      if (!kinded.has(`${file.file}#${name}`))
        errors.push(
          error(
            "kind_unregistered_base",
            file.file,
            name,
            `${name} sits in a .${at.suffix}.ts file but extends no kind base gen knows`,
            `extend the ${at.suffix} kind's base from its @stackra package (or a class of that kind), or move the class out of the kind file`,
          ),
        );
  }

  // Modules: a module file states something, a sibling's service is exported, and the graph has no cycle.
  for (const declared of ir.classes.filter((candidate) => candidate.kind === "module"))
    if (
      Object.keys(declared.options).length === 0 &&
      declared.deps.length === 0 &&
      declared.methods.length === 0 &&
      declared.facets.length === 0 &&
      Object.keys(declared.statics).length === 0
    )
      errors.push(
        error(
          "empty_module",
          declared.file,
          declared.name,
          `${declared.name} states nothing gen cannot derive: the module is its folder`,
          `delete ${declared.file}`,
        ),
      );
  const modules = manifest.modules ?? [];
  const exportsOf = new Map(modules.map((module) => [module.key, module.exports ?? []]));
  const byName = new Map(ir.classes.map((declared) => [declared.name, declared]));
  for (const declared of ir.classes)
    for (const dep of declared.deps) {
      const target = byName.get(dep.class.name);
      if (
        dep.of !== undefined ||
        !dep.class.from.startsWith("#") ||
        target === undefined ||
        target.kind !== "service" ||
        target.module === declared.module ||
        (exportsOf.get(target.module) ?? []).includes(target.name)
      )
        continue;
      errors.push(
        error(
          "sibling_not_exported",
          declared.file,
          `${declared.name}.constructor`,
          `${declared.name} (module ${declared.module}) injects ${target.name}, which module ${target.module} does not export`,
          `add ${target.name} to \`exports\` of the ${target.module} module's \`Module({ exports })\`, or inject something it exports`,
        ),
      );
    }
  for (const cycle of cycles(new Map(modules.map((module) => [module.key, module.dependsOn]))))
    errors.push(
      error(
        "module_cycle",
        "stackra.manifest.json",
        cycle.join(" -> "),
        `the modules depend on each other in a cycle: ${[...cycle, cycle[0]].join(" -> ")}`,
        "move the shared part into one module (or a third one both import), so the dependencies point one way",
      ),
    );

  // Migrations: `NNNN-<name>.migration.ts`, numbered per folder from 0001 without gaps or repeats.
  const folders = new Map<string, string[]>();
  for (const { file } of ir.files) {
    const at = /^(.*\/database\/migrations)\/([^/]+\.ts)$/.exec(file);
    if (at !== null) folders.set(at[1] ?? "", [...(folders.get(at[1] ?? "") ?? []), at[2] ?? ""]);
  }
  for (const [folder, names] of [...folders].sort(([left], [right]) => left.localeCompare(right))) {
    const sorted = [...names].sort();
    sorted.forEach((name, index) => {
      const expected = String(index + 1).padStart(4, "0");
      const match = MIGRATION_FILE.exec(name);
      const stem = (match?.[2] ?? name.replace(/\.migration\.ts$|\.ts$/, "")).replace(/^\d+-?/, "");
      if (match?.[1] === expected) return;
      errors.push(
        error(
          "migration_numbering",
          `${folder}/${name}`,
          name,
          match === null
            ? `${name} is not named NNNN-<name>.migration.ts`
            : `${name} is number ${match[1]}, but the migrations of ${folder} are numbered from 0001 without gaps, so it is ${expected}`,
          `rename it to ${folder}/${expected}-${stem}.migration.ts (only a migration no environment has run yet; a run one is frozen, so add a new one instead)`,
        ),
      );
    });
  }

  // Integration event names: `<aggregate>.<verb>` (ADR 0141). A prefixed name is `event_name_prefixed` already.
  for (const declared of ir.classes.filter((candidate) => candidate.kind === "integration_event")) {
    const written = declared.options["name"];
    const first = typeof written === "string" ? written.split(".")[0] : undefined;
    if (
      typeof written === "string" &&
      (EVENT_NAME.test(written) || [declared.module, ir.member].includes(first ?? ""))
    )
      continue;
    errors.push(
      error(
        "event_name_shape",
        declared.file,
        declared.name,
        typeof written === "string"
          ? `the event name "${written}" is not <aggregate>.<verb> in snake_case, so the wire name is not <module>.<aggregate>.<verb>.v<n>`
          : `${declared.name} writes no \`name\`, so its wire name is not <module>.<aggregate>.<verb>.v<n>`,
        'write `IntegrationEvent({ name: "<aggregate>.<verb>" })`, such as `name: "order.paid"`; a renamed event keeps its old wire name with `@Renamed(old)`',
      ),
    );
  }

  // Overrides keep the plain name of what they override (ADR 0305 rule 1): no `<Host><Base>`.
  for (const declared of ir.classes)
    if (
      declared.file.startsWith("src/overrides/") &&
      declared.base !== undefined &&
      !declared.base.own &&
      declared.name !== declared.base.name
    )
      errors.push(
        error(
          "override_legacy_name",
          declared.file,
          declared.name,
          `the override ${declared.name} does not keep the plain name of ${declared.base.name} (${declared.base.from})`,
          `rename the class to ${declared.base.name} and import its base as \`Base${declared.base.name}\`: \`import { ${declared.base.name} as Base${declared.base.name} } from "${declared.base.from}"\``,
        ),
      );
  return errors;
}
