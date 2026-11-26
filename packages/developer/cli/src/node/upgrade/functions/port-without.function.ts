/**
 * Stackra file contract:
 * Purpose: `portWithout(port, method)`, the ast-grep rule of a report codemod for a driver port that changed shape: a
 *          class (declared, abstract or an expression) that extends or implements `port` and has no `method` in its
 *          body, so a driver already ported is never reported again.
 * Boundary: pure; builds ast-grep's own rule object, run by `reportCodemodFindings`.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); STA-145.
 */
import type { NapiConfig } from "@ast-grep/napi";

/**
 * The rule matching a class that extends or implements `port` without declaring `method`.
 *
 * @param port - the port's exported class name, such as `QueueDriver`.
 * @param method - a method only the new shape has, such as `load`.
 * @example
 * portWithout("QueueDriver", "load"); // matches `class SqsQueue extends QueueDriver { reserve() {} }`
 */
export function portWithout(port: string, method: string): NapiConfig["rule"] {
  return {
    any: [{ kind: "class_declaration" }, { kind: "abstract_class_declaration" }, { kind: "class" }],
    has: {
      kind: "class_heritage",
      has: {
        any: [{ kind: "identifier" }, { kind: "type_identifier" }],
        regex: `^${port}$`,
        stopBy: "end",
      },
    },
    not: {
      has: {
        field: "body",
        has: { kind: "method_definition", has: { field: "name", regex: `^${method}$` } },
      },
    },
  };
}
