/**
 * Stackra file contract:
 * Purpose: `enumChoicesOf(node, kind, label)`, the codes a form field offers with their labels: the node's own enum's
 *          codes, else the input's enum codes, else none.
 * Boundary: internal: pure; the web and native form fields draw them as a select, `label` names each code.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 decision 22 (derived enum labels); ADR 0307.
 */
import { Enum } from "@stackra/contracts";

import type { InputKind } from "#core/types/input-kind.type";

/**
 * The labelled codes of a field.
 *
 * @example
 * enumChoicesOf(node, inputKind(schema, node.key), (code) => code); // [{ value: "paid", label: "paid" }]
 */
export function enumChoicesOf(
  node: { readonly enum?: Enum.Any },
  kind: InputKind,
  label: (code: string) => string,
): { readonly value: string; readonly label: string }[] | undefined {
  const codes =
    node.enum === undefined
      ? kind.kind === "enum"
        ? kind.options
        : undefined
      : Enum.values(node.enum).map(String);
  return codes?.map((code) => ({ value: code, label: label(code) }));
}
