/**
 * Stackra file contract:
 * Purpose: `reportQueriesOf`, the query class gen writes for each `Report` of the member (`<Report>Query`, key
 *          `report.<key>`, in `#stackra/reports`), as a declared query beside its report, so the manifest, the endpoint
 *          convention, the MCP tool and the wiring treat it like an authored query (ADR 0470 decision 1, STA-1459).
 * Boundary: pure; reads `ir.classes`. Empty when the member does not declare `@stackra/reports` or has no report with
 *           a written key. The query injects `ReportRunner` and reads the report's own `Permissions` static when it
 *           names one; without one it reads the query default, `<module>.report.read`. Its input and output are
 *           `ReportRequest` and `ReportResult` of `@stackra/reports`, written from `GENERATED_QUERY_SCHEMAS`.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decision 1); ADR 0294 (decisions 16, 20 and 21); ADR 0155 (queries are MCP tools).
 */
import type { ClassValue } from "#core/types/class-value.type";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** Whether `value` is a static member of a class written as a value. */
function isMemberValue(value: unknown): value is ClassValue & { readonly member: string } {
  return typeof value === "object" && value !== null && "$class" in value && "member" in value;
}

/**
 * Each report of `ir` with the query gen writes for it.
 *
 * @param ir - the member read by discovery.
 * @returns the reports in class order, each with its generated query as a declared class.
 * @example
 * reportQueriesOf(ir)[0]?.query.name; // "OrderSalesReportQuery"
 */
export function reportQueriesOf(
  ir: MemberIR,
): readonly { readonly report: DeclaredClass; readonly query: DeclaredClass }[] {
  if (ir.packages !== undefined && !ir.packages.includes("@stackra/reports")) return [];
  return ir.classes
    .filter((declared) => declared.kind === "report" && typeof declared.options["key"] === "string")
    .map((report) => {
      const permission = report.options["permission"];
      return {
        report,
        query: {
          name: `${report.name}Query`,
          kind: "query",
          module: report.module,
          file: ".stackra/gen/reports.ts",
          importPath: "#stackra/reports",
          options: {
            key: `report.${String(report.options["key"])}`,
            ...(isMemberValue(permission) ? { permission } : {}),
          },
          deps: [{ class: { name: "ReportRunner", from: "@stackra/reports" } }],
          facets: [],
          methods: ["handle"],
          handle: { input: "ReportRequest", output: "ReportResult" },
          refusals: [],
          statics: {},
          traits: [],
        },
      };
    });
}
