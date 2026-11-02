/**
 * Stackra file contract:
 * Purpose: `hostResourcesOf(ir)`, the panel resources a host composes: every `ui.resources` entry its declared
 *          packages and consumed services record, by `<module>.<model>`, sorted, with `resource_duplicate` for one key
 *          that two different classes record.
 * Boundary: pure. An entry is manifest JSON, the recorded tree with `module`, `class` and `from` (a bare tree from an
 *           older gen still reads); one key reached twice with the same module and class is one resource. A manifest
 *           with no `ui` contributes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0164 (decision 2: the panel draws them on web and native); ADR 0307 (rule 5); ADR 0111
 *                     (decision 3); STA-1947.
 */
import type { Json } from "@stackra/contracts";

import { contributionsOf } from "#core/functions/contributions-of.function";
import type { Contribution } from "#core/types/contribution.type";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** A JSON object. */
type JsonObject = { readonly [key: string]: Json };

/** Whether `value` is a JSON object. */
const isObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * The resources `ir`'s dependencies record, and the duplicates refused.
 *
 * @example
 * hostResourcesOf(appIr).resources.map((resource) => resource.key); // ["loyalty_kit.loyalty_account"]
 */
export function hostResourcesOf(ir: MemberIR): {
  readonly resources: readonly Contribution<JsonObject>[];
  readonly errors: readonly GenError[];
} {
  const { entries, duplicates } = contributionsOf<JsonObject>(
    ir,
    (manifest) => {
      const ui = manifest["ui"];
      const resources = isObject(ui) ? ui["resources"] : undefined;
      return isObject(resources)
        ? Object.entries(resources).filter((pair): pair is [string, JsonObject] =>
            isObject(pair[1]),
          )
        : [];
    },
    (left, right) => left["module"] === right["module"] && left["class"] === right["class"],
  );
  return {
    resources: entries,
    errors: duplicates.map(({ first, second }) => ({
      code: "resource_duplicate",
      file: "package.json",
      line: 0,
      column: 0,
      subject: first.key,
      message: `the resource \`${first.key}\` is recorded by ${String(first.entry["class"])} (${first.from}) and by ${String(second.entry["class"])} (${second.from})`,
      fix: "depend on only one of the two, or rename one resource's model in its owner",
    })),
  };
}
