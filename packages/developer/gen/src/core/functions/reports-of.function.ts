/**
 * Stackra file contract:
 * Purpose: `reportsOf`, the `reports` manifest section of a member's `Report` classes (ADR 0470): for each one, its key
 *          (`<module>.<key>`), class, module and file, its source (an own model's key, or the partner's name), its
 *          dimensions, measures and default filter as written, its permission key and the key of its generated query
 *          (`<module>.report.<key>@1`); and the refusals gen can see: `identity_missing` (no written key),
 *          `identity_collision` (two reports with one key), `report_misplaced` (not in the module's `reports/` group),
 *          `report_vocabulary_invalid` (a grain, measure kind or metric outside the closed set, or one gen could not
 *          read as a constant), and `report_dimension_unknown` / `report_measure_unknown` (a path whose first segment
 *          the source model does not declare, followed through an own model's relations).
 * Boundary: pure. A path is judged only against an own model of the member: fields, relations, trait and initialised
 *           fields (`entity.optional`) and `id`, through its own base models; a segment after a non-relation field
 *           (a money or JSON field's part) and a path on a projection row or a package model are not judged. The
 *           option checks `Report({...})` makes when the class loads (names, formulas) are not repeated here.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decisions 1 and 2; Enforcement); ADR 0294 (decisions 20 and 22: identities, a refusal
 *                     carries its fix).
 */
import type { Json } from "@stackra/contracts";

import { REPORT_VOCABULARY } from "#core/constants/report-vocabulary.constant";
import { actionKey } from "#core/functions/action-key.function";
import { modelKey } from "#core/functions/model-key.function";
import { permissionKey } from "#core/functions/permission-key.function";
import type { ClassValue } from "#core/types/class-value.type";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** A report's one home: `reports/<kebab-name>.report.ts`. */
const HOME = /(^|\/)reports\/[a-z0-9]+(?:-[a-z0-9]+)*\.report\.ts$/;

/** A manifest entry. */
type Entry = { [key: string]: Json };

/** `value` as a plain object, or an empty one. */
function objectOf(value: unknown): Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : {};
}

/** Whether `value` is a class written as a value. */
function isClassValue(value: unknown): value is ClassValue {
  return typeof value === "object" && value !== null && "$class" in value;
}

/**
 * The reports of `ir`, and what is wrong with them.
 *
 * @param ir - the member read by discovery.
 * @returns the manifest entries in class order, and the refusals.
 * @example
 * reportsOf(ir).reports[0];
 * // { key: "orders.order_sales", source: "orders.order", query: "orders.report.order_sales@1", dimensions: {...}, ... }
 */
export function reportsOf(ir: MemberIR): {
  readonly reports: readonly Entry[];
  readonly errors: readonly GenError[];
} {
  const reports: Entry[] = [];
  const errors: GenError[] = [];
  const models = new Map(
    ir.classes
      .filter((declared) => declared.kind === "model")
      .map((declared) => [declared.name, declared]),
  );
  const shapes = new Map(ir.shapes.map((shape) => [shape.name, shape]));

  /** The names a model declares, through its own bases, and its relations' own target models. */
  const namesOf = (
    model: DeclaredClass,
  ): { names: Set<string>; relations: Map<string, string | undefined> } => {
    const names = new Set(["id"]);
    const relations = new Map<string, string | undefined>();
    const seen = new Set<DeclaredClass>();
    for (let at: DeclaredClass | undefined = model; at !== undefined && !seen.has(at);) {
      seen.add(at);
      const shape = shapes.get(at.name);
      for (const field of shape?.fields ?? []) names.add(field.name);
      for (const name of shape?.entity?.optional ?? []) names.add(name);
      for (const relation of shape?.entity?.relations ?? []) {
        names.add(relation.name);
        relations.set(
          relation.name,
          relation.targetModule === undefined ? undefined : relation.target.name,
        );
      }
      at = at.base?.own === true ? models.get(at.base.name) : undefined;
    }
    return { names, relations };
  };

  /** The first segment of `path` the model chain does not declare, or undefined when every judged one is known. */
  const unknownSegment = (model: DeclaredClass, path: string): string | undefined => {
    const [head = "", ...rest] = path.split(".");
    const { names, relations } = namesOf(model);
    if (!names.has(head)) return head;
    const target = relations.get(head);
    const next = target === undefined ? undefined : models.get(target);
    return next === undefined || rest.length === 0
      ? undefined
      : unknownSegment(next, rest.join("."));
  };

  const keys = new Map<string, DeclaredClass>();
  for (const declared of ir.classes.filter((candidate) => candidate.kind === "report")) {
    const fail = (code: string, message: string, fix: string): void => {
      errors.push({
        code,
        file: declared.file,
        line: 0,
        column: 0,
        subject: declared.name,
        message,
        fix,
      });
    };
    const written = declared.options["key"];
    if (typeof written !== "string") {
      fail(
        "identity_missing",
        "report has no written `key`",
        'write `Report<Order>({ key: "order_sales", ... })`',
      );
      continue;
    }
    const key = `${declared.module}.${written}`;
    const other = keys.get(key);
    if (other !== undefined)
      fail(
        "identity_collision",
        `\`${key}\` is also declared by ${other.name} (${other.file})`,
        "give one report a different written key",
      );
    keys.set(key, declared);
    if (!HOME.test(declared.file))
      fail(
        "report_misplaced",
        `a report lives in its module's \`reports/\` group, not ${declared.file}`,
        "move it to `src/modules/<module>/reports/<name>.report.ts` (a package: `src/node/reports/`)",
      );

    const source = declared.partner === undefined ? undefined : models.get(declared.partner.name);
    const judge = (
      code: "report_dimension_unknown" | "report_measure_unknown",
      name: string,
      path: unknown,
    ): void => {
      if (source === undefined || typeof path !== "string") return;
      const missing = unknownSegment(source, path);
      if (missing !== undefined)
        fail(
          code,
          `${code === "report_dimension_unknown" ? "dimension" : "measure"} "${name}" reads ${path}, but "${missing}" is no field or relation of its source ${source.name}`,
          `name a declared field of ${source.name} (or one reached through a relation), or declare the field`,
        );
    };

    const dimensions: Entry = {};
    for (const [name, raw] of Object.entries(objectOf(declared.options["dimensions"]))) {
      const dimension = objectOf(raw);
      const grains = dimension["grains"];
      if (
        grains !== undefined &&
        (!Array.isArray(grains) ||
          grains.some((grain) => !REPORT_VOCABULARY.grains.has(grain as string)))
      )
        fail(
          "report_vocabulary_invalid",
          `dimension "${name}" grains are outside the closed set, or not constant`,
          `write TimeGrain values (${[...REPORT_VOCABULARY.grains].join(", ")})`,
        );
      judge("report_dimension_unknown", name, dimension["path"]);
      dimensions[name] = {
        path: String(dimension["path"]),
        ...(Array.isArray(grains) ? { grains: grains.map(String) } : {}),
      };
    }

    const measures: Entry = {};
    for (const [name, raw] of Object.entries(objectOf(declared.options["measures"]))) {
      const measure = objectOf(raw);
      const kind = measure["kind"];
      const metric = measure["metric"];
      if (
        !REPORT_VOCABULARY.kinds.has(kind as string) ||
        !REPORT_VOCABULARY.metrics.has(metric as string)
      )
        fail(
          "report_vocabulary_invalid",
          `measure "${name}" has kind ${JSON.stringify(kind)} and metric ${JSON.stringify(metric)}, outside the closed set or not constant`,
          `write a MeasureKind (${[...REPORT_VOCABULARY.kinds].join(", ")}) and a ReportMetric (${[...REPORT_VOCABULARY.metrics].join(", ")})`,
        );
      if (!REPORT_VOCABULARY.fieldless.has(kind as string))
        judge("report_measure_unknown", name, measure["field"]);
      measures[name] = {
        kind: String(kind),
        metric: String(metric),
        ...(typeof measure["field"] === "string" ? { field: measure["field"] } : {}),
        ...(typeof measure["formula"] === "string" ? { formula: measure["formula"] } : {}),
      };
    }

    const permission = declared.options["permission"];
    const owner = isClassValue(permission)
      ? ir.classes.find((each) => each.name === permission.$class)
      : undefined;
    reports.push({
      key,
      class: declared.name,
      module: declared.module,
      file: declared.file,
      ...(declared.partner !== undefined
        ? {
            source:
              source === undefined ? declared.partner.name : modelKey(source.module, source.name),
          }
        : {}),
      query: actionKey(declared.module, `report.${written}`),
      dimensions,
      measures,
      ...(declared.options["defaultFilter"] !== undefined
        ? { defaultFilter: declared.options["defaultFilter"] as Json }
        : {}),
      ...(isClassValue(permission) && permission.member !== undefined
        ? {
            permission: permissionKey(
              owner?.module ?? declared.module,
              permission.$class,
              permission.member,
            ),
          }
        : {}),
    });
  }
  return { reports, errors };
}
