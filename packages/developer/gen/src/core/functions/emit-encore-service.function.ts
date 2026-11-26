/**
 * Stackra file contract:
 * Purpose: `emitEncoreService`, a service's Encore service declaration (`stackra-encore/<member>/encore.service.ts`):
 *          `export default new Service("<member>")`, which makes the folder one Encore service, so the CronJobs,
 *          topics, subscriptions and endpoints gen writes beside it belong to it.
 * Boundary: pure; written for every service and for no other layout. It names no member code, only `encore.dev`.
 * Runtime: isomorphic
 * Governing contract: ADR 0091 (decision 2: the generated Encore app) and 0124 (no Encore in a service); STA-2063.
 */
import { encoreServiceFolder } from "#core/functions/encore-service-folder.function";
import { generatedHeader } from "#core/functions/generated-header.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The Encore service declaration of a service, or undefined for a package or an app.
 *
 * @param ir - the member read by discovery.
 * @example
 * emitEncoreService(ir)?.path; // "stackra-encore/shop/encore.service.ts"
 */
export function emitEncoreService(ir: MemberIR): GeneratedFile | undefined {
  if (ir.layout !== "service") return undefined;
  const header = generatedHeader({
    from: "the service layout",
    purpose: `the Encore service of ${ir.package}: every generated file in this folder belongs to it.`,
    boundary:
      "declares the service only; its endpoints, CronJobs and topics are the other files here.",
    runtime: "node",
  });
  return {
    path: `${encoreServiceFolder(ir.member)}/encore.service.ts`,
    content: [
      header,
      'import { Service } from "encore.dev/service";',
      "",
      `export default new Service(${JSON.stringify(ir.member)});`,
      "",
    ].join("\n"),
  };
}
