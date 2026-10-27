/**
 * Stackra file contract:
 * Purpose: `conditionProblems`, the one check of a condition tree from untrusted input: the shape (`all`, `any`, `not`
 *          and leaves of `field`, `operator` and `value`, at most 200 nodes and 8 levels), and, given the registered
 *          fields, that each leaf names a registered field, an operator of its type's set and a value that operator
 *          takes. Without fields it checks the shape, the field path's form and the operator code only.
 * Boundary: pure; internal to the package. `Rules.problems` passes its registry; `Condition$` passes none, so a service
 *           that only stores a tree (Access) checks its shape with the same walk. Field errors are snake_case codes by
 *           node path (`(root)` for the root) and never echo a value; a node reports its first problem only.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 2, 3, 4 and 10); ADR 0140 (field errors by path); ADR 0425 (decision 4).
 */
import { Enum } from "@stackra/contracts";
import type { FieldErrors } from "@stackra/errors";
import { isRecord } from "@stackra/support";

import { type FactField, FieldType, Operator } from "#contracts/index";
import { fitsOperand } from "#core/functions/fits-operand.function";

/** The deepest a tree may nest, the root counting as 1. */
const MAX_DEPTH = 8;

/** The most nodes a tree may hold. */
const MAX_NODES = 200;

/** The keys a leaf may carry. */
const LEAF_KEYS = ["field", "operator", "value"] as const;

/** A field path: a camelCase source key, a dot, a camelCase field key. */
const PATH = /^[a-z][a-zA-Z0-9]{0,62}\.[a-z][a-zA-Z0-9]{0,62}$/;

/** The path of a child: the parent's path, a dot and the child's segment. */
const join = (path: string, segment: string): string =>
  path === "" ? segment : `${path}.${segment}`;

/**
 * What is wrong with `input` as a condition, by node path; `{}` when nothing is.
 *
 * @param fieldOf - the registered field at a path, or `undefined` for an unknown one; left out to check shape only.
 * @example
 * conditionProblems({ all: [{ field: "cart.total", operator: "at_least" }] }); // {}
 * conditionProblems(tree, (path) => rules.fieldOf(path)); // { "all.0": "value_invalid" }
 */
export function conditionProblems(
  input: unknown,
  fieldOf?: (path: string) => FactField | undefined,
): FieldErrors {
  const errors: Record<string, string> = {};
  let count = 0;
  const visit = (node: unknown, path: string, depth: number): void => {
    const at = path === "" ? "(root)" : path;
    count += 1;
    if (count > MAX_NODES) {
      errors["(root)"] = "too_many_nodes";
      return;
    }
    if (depth > MAX_DEPTH) {
      errors[at] = "too_deep";
      return;
    }
    const keys =
      typeof node === "object" && node !== null && !Array.isArray(node) ? Object.keys(node) : [];
    const [only] = keys;
    const group = node as Readonly<Record<string, unknown>>;
    if (keys.length === 1 && (only === "all" || only === "any")) {
      const children = group[only];
      if (!Array.isArray(children)) errors[at] = "node_invalid";
      else
        (children as readonly unknown[]).forEach((child, index) =>
          visit(child, join(path, `${only}.${index}`), depth + 1),
        );
      return;
    }
    if (keys.length === 1 && only === "not") {
      visit(group["not"], join(path, "not"), depth + 1);
      return;
    }
    if (
      !isRecord(node, LEAF_KEYS) ||
      typeof node["field"] !== "string" ||
      typeof node["operator"] !== "string"
    ) {
      errors[at] = "node_invalid";
      return;
    }
    const operator = node["operator"];
    if (fieldOf === undefined) {
      if (!PATH.test(node["field"])) errors[at] = "field_unknown";
      else if (!(Enum.values(Operator) as readonly string[]).includes(operator))
        errors[at] = "operator_not_allowed";
      return;
    }
    const field = fieldOf(node["field"]);
    if (field === undefined) errors[at] = "field_unknown";
    else if (!(Enum.meta(FieldType, field.type).operators as readonly string[]).includes(operator))
      errors[at] = "operator_not_allowed";
    // reason: the line above proved `operator` is a code of the field type's operator set
    else if (!fitsOperand(field, operator as Operator, node["value"])) errors[at] = "value_invalid";
  };
  visit(input, "", 1);
  return errors;
}
