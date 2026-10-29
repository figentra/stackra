/**
 * Stackra file contract:
 * Purpose: `emitReports`, the `#stackra/reports` file (`.stackra/gen/reports.ts`): one generated query class per
 *          `Report` class of the member, `<Report>Query extends Query({ key: "report.<key>", permission })`, whose
 *          `handle` passes the `ReportRequest` to the injected `ReportRunner` with its report, so REST, MCP, the panel
 *          and agents read every report through one contract (ADR 0470 decision 1).
 * Boundary: pure; reads `ir.classes`. Undefined when the member has no report with a written key, or does not declare
 *           `@stackra/reports`. The file imports `@stackra/actions` and `@stackra/reports`, so a member that lacks
 *           either is refused by `generated_dependency_missing`. The permission is the report's own `Permissions`
 *           static, imported where gen read it; without one the query reads its default. `reportQueriesOf` picks the
 *           reports and declares their queries, which `generateMember` registers like authored ones (STA-1459).
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decisions 1 and 3); ADR 0294 (decisions 16 and 20); ADR 0155 (queries are MCP tools).
 */
import { generatedHeader } from "#core/functions/generated-header.function";
import { importLines } from "#core/functions/import-lines.function";
import { reportQueriesOf } from "#core/functions/report-queries-of.function";
import type { ClassValue } from "#core/types/class-value.type";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The `#stackra/reports` file of `ir`, or undefined when there is nothing to write.
 *
 * @param ir - the member read by discovery.
 * @example
 * emitReports(ir); // '... export class OrderSalesReportQuery extends Query({ key: "report.order_sales", ... }) { ... }'
 */
export function emitReports(ir: MemberIR): string | undefined {
  const reports = reportQueriesOf(ir);
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
  const classes = reports.map(({ report: declared, query }) => {
    use(declared.importPath, declared.name);
    const written = String(declared.options["key"]);
    // `reportQueriesOf` keeps the permission only when it names a Permissions static.
    const permission = query.options["permission"] as
      | (ClassValue & { readonly member: string })
      | undefined;
    if (permission !== undefined) use(permission.from, permission.$class);
    const options = [
      `key: ${JSON.stringify(query.options["key"])}`,
      ...(permission !== undefined
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
