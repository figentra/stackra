/**
 * Stackra file contract:
 * Purpose: the `stackra/no-literal-duration` rule: motion comes from the theme's motion family (ADR 0501), never from a
 *          literal, so one theme edit retimes every component on web and native. It refuses a Tailwind `duration-<n>`,
 *          `delay-<n>`, `duration-[<literal>]` or `ease-[<literal>]` class; a number above 0 in a timing name (`duration`,
 *          `delay`, `*Duration`, `*Delay`, `*Ms`) as a property, a parameter default or a `.duration(n)` call, or a
 *          `*_MS` constant; a numeric `stiffness`, `damping` or `mass`
 *          property (a literal spring); and a literal easing: a `cubic-bezier(` in text, a string or number-list
 *          `easing` / `ease` property, or `Easing.bezier(<numbers>)`.
 * Boundary: syntax only. Passes Tailwind's keyword easings (they read the theme's `--ease-in`, `--ease-out`,
 *           `--ease-in-out`), `duration-0`, `duration-(--*)`, `duration-[var(--*)]`, `ease-(--*)`,
 *           `ease-[var(--*)]`, 0 and anything computed (`motionTiming(...)`, `motionSpring(...)`, `motionEasing(...)`).
 *           Where it runs is the preset's choice (base.jsonc: apps/ and packages/design-system/, bar the tokens package
 *           that defines the values, and tests). A wait that is not motion (a toast's dwell, a debounce) says so in an
 *           `oxlint-disable-next-line` with its reason. No autofix: the right step is a design choice.
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2, decision 6 and the motion family); ADR 0329 (motion layer); ADR 0129
 *                     (house rules as an oxlint jsPlugin).
 */
import type { AstNode } from "#core/types/ast-node.type";
import type { Rule } from "#core/types/rule.type";

/** A timing utility class, with any variant prefixes (`md:`, `data-[entering]:`) and the `!` modifier. */
const CLASS = /(?:^|\s)(?:[^\s:]+:)*!?((?:duration|delay|ease)-[^\s"'`]+)/g;

/** A timing class that hard-codes nothing: zero, or a value read from a custom property. */
const TOKEN_DRIVEN =
  /^(?:duration|delay)-0$|^(?:duration|delay|ease)-(?:\(--[\w-]+\)|\[var\(--[^\]]*\])$/;

/** The timing classes that hard-code a value (`duration-200`, `ease-[cubic-bezier(...)]`). */
// Tailwind's keyword easings (`ease-in`, `ease-out`, `ease-in-out`) read `--ease-in`, `--ease-out` and `--ease-in-out`,
// which the theme renders from its named easings, so they pass.
const LITERAL_CLASS = /^(?:(?:duration|delay)-(?:\d|\[)|ease-\[)/;

/** The first timing class in `text` that hard-codes a value. */
const literalClass = (text: string): string | undefined =>
  [...text.matchAll(CLASS)]
    .map((match) => match[1] ?? "")
    .find((token) => LITERAL_CLASS.test(token) && !TOKEN_DRIVEN.test(token));

/** A name that holds a timing: `duration`, `delay`, `closeDelay`, `enterDuration`, `durationMs`. */
const TIMING_NAME = /^(?:duration|delay)(?:Ms)?$|(?:Duration|Delay)(?:Ms)?$/;
const SPRING_KEYS = new Set(["stiffness", "damping", "mass"]);
const EASING_KEYS = new Set(["easing", "ease"]);
const DURATION_CONSTANT = /(?:_MS|Ms)$/;

/** The number a node holds, through a unary minus, or `undefined`. */
const numberOf = (node: AstNode | undefined): number | undefined => {
  const literal = node?.type === "UnaryExpression" ? node.argument : node;
  return literal?.type === "Literal" && typeof literal.value === "number"
    ? literal.value
    : undefined;
};

/** The name of a property key, identifier or string. */
const keyOf = (node: AstNode): string | undefined => {
  const key = node.key as AstNode | undefined;
  if (key?.type === "Identifier") return key.name;
  return typeof key?.value === "string" ? key.value : undefined;
};

/** Refuses literal durations, easings and springs. */
export const NO_LITERAL_DURATION_RULE: Rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow literal durations, easings and springs; motion comes from the theme's motion family (ADR 0501).",
    },
    messages: {
      durationClass:
        "`{{token}}` hard-codes motion; use `duration-(--duration-<step>)` or `ease-(--ease-<name>)` (ADR 0501).",
      numericDuration:
        "`{{name}}: {{value}}` hard-codes a duration; read a step with `motionTiming(theme, step)` (ADR 0501).",
      literalSpring:
        "`{{name}}: {{value}}` hard-codes a spring; use `motionSpring(theme, preset)` (ADR 0501).",
      literalEasing:
        "`{{name}}` hard-codes an easing; use `motionEasing(theme, name)` or `var(--ease-<name>)` (ADR 0501).",
    },
    schema: [],
  },
  create(context) {
    const text = (node: AstNode, value: string): void => {
      const token = literalClass(value);
      if (token !== undefined)
        context.report({ node, messageId: "durationClass", data: { token } });
      else if (value.includes("cubic-bezier("))
        context.report({ node, messageId: "literalEasing", data: { name: "cubic-bezier()" } });
    };
    return {
      Literal(node) {
        // A property's string value is judged by the Property visitor (an `easing` key), not as a class list.
        const parent = node.parent;
        if (parent?.type === "Property" && EASING_KEYS.has(keyOf(parent) ?? "")) return;
        if (typeof node.value === "string") text(node, node.value);
      },
      TemplateElement(node) {
        const cooked = (node.value as { cooked?: string | null } | undefined)?.cooked;
        if (typeof cooked === "string") text(node, cooked);
      },
      Property(node) {
        const name = keyOf(node);
        if (name === undefined) return;
        const value = node.value as AstNode | undefined;
        const number = numberOf(value);
        if (TIMING_NAME.test(name) && number !== undefined && number > 0)
          context.report({
            node,
            messageId: "numericDuration",
            data: { name, value: String(number) },
          });
        else if (SPRING_KEYS.has(name) && number !== undefined)
          context.report({
            node,
            messageId: "literalSpring",
            data: { name, value: String(number) },
          });
        else if (
          EASING_KEYS.has(name) &&
          ((value?.type === "Literal" &&
            typeof value.value === "string" &&
            !value.value.trim().startsWith("var(")) ||
            (value?.type === "ArrayExpression" &&
              value.elements?.every((element) => numberOf(element ?? undefined) !== undefined)))
        )
          context.report({ node, messageId: "literalEasing", data: { name } });
      },
      VariableDeclarator(node) {
        const id = node.id as AstNode | undefined;
        const number = numberOf(node.init as AstNode | undefined);
        if (
          id?.type === "Identifier" &&
          DURATION_CONSTANT.test(id.name ?? "") &&
          number !== undefined &&
          number > 0
        )
          context.report({
            node,
            messageId: "numericDuration",
            data: { name: id.name ?? "", value: String(number) },
          });
      },
      AssignmentPattern(node) {
        const left = node.left as AstNode | undefined;
        const number = numberOf(node.right as AstNode | undefined);
        if (
          left?.type === "Identifier" &&
          TIMING_NAME.test(left.name ?? "") &&
          number !== undefined &&
          number > 0
        )
          context.report({
            node,
            messageId: "numericDuration",
            data: { name: left.name ?? "", value: String(number) },
          });
      },
      CallExpression(node) {
        const callee = node.callee as AstNode | undefined;
        if (callee?.type !== "MemberExpression") return;
        const property = (callee.property as AstNode | undefined)?.name;
        const args = (node.arguments as AstNode[] | undefined) ?? [];
        const first = numberOf(args[0]);
        if (
          property !== undefined &&
          TIMING_NAME.test(property) &&
          first !== undefined &&
          first > 0
        )
          context.report({
            node,
            messageId: "numericDuration",
            data: { name: property, value: String(first) },
          });
        else if (
          property === "bezier" &&
          (callee.object as AstNode | undefined)?.name === "Easing" &&
          args.length > 0 &&
          args.every((arg) => numberOf(arg) !== undefined)
        )
          context.report({ node, messageId: "literalEasing", data: { name: "Easing.bezier()" } });
      },
    };
  },
};
