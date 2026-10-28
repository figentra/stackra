/**
 * Stackra file contract:
 * Purpose: `emitReports`, the `#stackra/reports` file (`.stackra/gen/reports.ts`): one generated query class per
 *          `Report` class of the member, `<Report>Query extends Query({ key: "report.<key>", permission })`, whose
 *          `handle` passes the `ReportRequest` to the injected `ReportRunner` with its report, so REST, MCP, the panel
 *          and agents read every report through one contract (ADR 0470 decision 1).
 * Boundary: pure; reads `ir.classes`. Undefined when the member has no report with a written key, or does not declare
 *           `@stackra/reports`. The file imports `@stackra/actions` and `@stackra/reports`, so a member that lacks
 *           either is refused by `generated_dependency_missing`. The permission is the report's own `Permissions`
 *           static, imported where gen read it; without one the query reads its default. Registering these classes as
 *           actions (endpoint, tool, wiring) is not done here yet.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decisions 1 and 3); ADR 0294 (decisions 16 and 20); ADR 0155 (queries are MCP tools).
 */
import { generatedHeader } from "#core/functions/generated-header.function";
import { importLines } from "#core/functions/import-lines.function";
import type { ClassValue } from "#core/types/class-value.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** Whether `value` is a static member of a class written as a value. */
function isMemberValue(value: unknown): value is ClassValue & { readonly member: string } {
  return typeof value === "object" && value !== null && "$class" in value && "member" in value;
}

/**
 * The `#stackra/reports` file of `ir`, or undefined when there is nothing to write.
 *
 * @param ir - the member read by discovery.
 * @example
 * emitReports(ir); // '... export class OrderSalesReportQuery extends Query({ key: "report.order_sales", ... }) { ... }'
 */
export function emitReports(ir: MemberIR): string | undefined {
  if (ir.packages !== undefined && !ir.packages.includes("@stackra/reports")) return undefined;
  const reports = ir.classes.filter(
    (declared) => declared.kind === "report" && typeof declared.options["key"] === "string",
  );
  if (reports.length === 0) return undefined;
  const imports = new Map<string, Map<string, boolean>>([
    ["@stackra/actions", new Map([["Query", false]])],
    [
      "@stackra/reports",
      new Map([
        ["ReportRunner", false],
        ["ReportRequest", true],
        ["ReportResult", true],
      ]),
    ],
  ]);
  const use = (from: string, name: string): void => {
    imports.set(from, (imports.get(from) ?? new Map<string, boolean>()).set(name, false));
  };
  const classes = reports.map((declared) => {
    use(declared.importPath, declared.name);
    const written = String(declared.options["key"]);
    const permission = declared.options["permission"];
    if (isMemberValue(permission)) use(permission.from, permission.$class);
    const options = [
      `key: ${JSON.stringify(`report.${written}`)}`,
      ...(isMemberValue(permission)
        ? [`permission: ${permission.$class}.${permission.member}`]
        : []),
    ];
    return [
      `/** The generated query of report \`${declared.module}.${written}\` (${declared.name}). */`,
      `export class ${declared.name}Query extends Query({ ${options.join(", ")} }) {`,
      "  private readonly runner: ReportRunner;",
      "",
      "  constructor(runner: ReportRunner) {",
      "    super();",
      "    this.runner = runner;",
      "  }",
      "",
      "  handle(input: ReportRequest): Promise<ReportResult> {",
      `    return this.runner.run(${declared.name}, input);`,
      "  }",
      "}",
    ].join("\n");
  });
  return [
    generatedHeader({
      from: "the report classes (`extends Report<Source>({ key, dimensions, measures })`)",
      purpose: `one query per report of ${ir.package}, keyed \`report.<key>\`, which runs it through \`ReportRunner\`.`,
      boundary:
        "reached as `#stackra/reports`; the runner (the report compiler) checks the request against the report's " +
        "declared dimensions and measures. Change a report class and run `stackra gen`.",
      runtime: "isomorphic",
    }),
    ...importLines(imports),
    "",
    classes.join("\n\n"),
    "",
  ].join("\n");
}
