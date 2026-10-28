/**
 * Stackra file contract:
 * Purpose: `webhookIntegrations`, the Integrations a service receives provider webhooks for: its own that declare
 *          `webhooks`, and its hosted packages' (read from their committed manifests), each with the `<module>/<name>`
 *          segment of its webhook path and where the generated route imports the class from.
 * Boundary: pure. A package receives nothing itself (its host does), so it gets an empty list; so does an app.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 15, 16 and 19); ADR 0224 as amended (one inbound route per service).
 */
import { packageSpecifier } from "#core/functions/package-specifier.function";
import { webhookPath } from "#core/functions/webhook-path.function";
import type { ClassRef } from "#core/types/class-ref.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** The `<module>/<name>` segment of a webhook path. */
function segment(path: string): string {
  return path.replace(/^\/webhooks\//, "").replace(/\/:connectionId$/, "");
}

/**
 * The webhook Integrations of `ir`, sorted by route.
 *
 * @example
 * webhookIntegrations(ir); // [{ route: "messages/resend", integration: { name: "ResendIntegration", from: "#modules/..." } }]
 */
export function webhookIntegrations(
  ir: MemberIR,
): { readonly route: string; readonly integration: ClassRef }[] {
  if (ir.layout !== "service") return [];
  const found = new Map<string, ClassRef>();
  for (const declared of ir.classes)
    if (declared.kind === "integration" && declared.options["webhooks"] !== undefined)
      found.set(segment(webhookPath(declared.module, declared.name)), {
        name: declared.name,
        from: declared.importPath,
      });
  for (const { package: name, manifest } of ir.dependencies) {
    const integrations = manifest["integrations"];
    if (manifest.kind === "app" || !Array.isArray(integrations)) continue;
    for (const entry of integrations as readonly Record<string, unknown>[]) {
      const path = entry["webhookPath"];
      const className = entry["class"];
      if (typeof path !== "string" || typeof className !== "string") continue;
      const from = typeof entry["from"] === "string" ? entry["from"] : name;
      if (!found.has(segment(path)))
        found.set(segment(path), { name: className, from: packageSpecifier(from, entry["file"]) });
    }
  }
  return (
    [...found]
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([route, integration]) => ({ route, integration }))
  );
}
