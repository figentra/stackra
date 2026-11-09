/**
 * Stackra file contract:
 * Purpose: the `stackra/no-raw-env` rule: a named read of the environment (`process.env.X`, `process.env["X"]`,
 *          `process.env[name]`, `import.meta.env.X`, `const { X } = process.env`) is reported; the name belongs in a
 *          configuration class (`Config({ schema, env })` or `@Secret`), where gen collects it and runway checks it.
 * Boundary: reads member expressions and destructures of `process.env` and `import.meta.env`; passing the whole object
 *           (`hydrateEnv(process.env)`) is allowed, because that is how a configuration gets its values. Exempt by
 *           path: configuration classes and tool configs (`*.config.*`), generated code (`.stackra/`, `*.generated.*`,
 *           `generated/`), tooling (`tools/`, `scripts/`, `.agents/`, `.github/`) and tests (`__tests__/`, `*.test.*`,
 *           `*.spec.*`, `e2e/`). No autofix: the declaration is the author's.
 * Runtime: isomorphic
 * Governing contract: ADR 0173 (amendment 2026-11-04, decision 1); ADR 0146 as amended; STA-2104.
 */
import type { AstNode } from "#core/types/ast-node.type";
import type { Rule } from "#core/types/rule.type";

/** The paths where a raw read is allowed (ADR 0173 amendment 2026-11-04, decision 1). */
const EXEMPT = [
  /\.config\.[cm]?[jt]sx?$/,
  /(?:^|[\\/])\.stackra[\\/]/,
  /\.generated\./,
  /(?:^|[\\/])generated[\\/]/,
  /(?:^|[\\/])(?:tools|scripts|\.agents|\.github)[\\/]/,
  /(?:^|[\\/])(?:__tests__|e2e)[\\/]/,
  /\.(?:test|spec)\.[cm]?[jt]sx?$/,
];

/** Whether `node` is `process.env` or `import.meta.env`. */
const isEnvObject = (node: AstNode | null | undefined): boolean =>
  node?.type === "MemberExpression" &&
  node.computed !== true &&
  node.property?.name === "env" &&
  ((node.object?.type === "Identifier" && node.object.name === "process") ||
    node.object?.type === "MetaProperty");

/** The source spelling of the object, for the message. */
const objectName = (node: AstNode): string =>
  node.object?.type === "MetaProperty" ? "import.meta.env" : "process.env";

/** The read name: an identifier, a string key, or `[computed]`. */
const readName = (member: AstNode): string => {
  const property = member.property;
  if (member.computed !== true && property?.type === "Identifier") return property.name ?? "";
  if (property?.type === "Literal" && typeof property.value === "string") return property.value;
  return "[computed]";
};

/** Refuses named environment reads outside configuration classes, generated code, tooling and tests. */
export const NO_RAW_ENV_RULE: Rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow named reads of process.env and import.meta.env outside configuration classes (ADR 0173, STA-2104).",
    },
    messages: {
      rawEnv:
        "Read {{name}} through a configuration class (`Config({ schema, env })` or `@Secret`), not {{object}} (ADR 0173 amendment 2026-11-04).",
    },
    schema: [],
  },
  create(context) {
    if (EXEMPT.some((pattern) => pattern.test(context.filename))) return {};
    return {
      MemberExpression(node) {
        if (!isEnvObject(node.object)) return;
        context.report({
          node,
          messageId: "rawEnv",
          data: { name: readName(node), object: objectName(node.object as AstNode) },
        });
      },
      VariableDeclarator(node) {
        if (node.id?.type !== "ObjectPattern" || !isEnvObject(node.init)) return;
        for (const property of node.id.properties ?? []) {
          const key = property.key;
          context.report({
            node: property,
            messageId: "rawEnv",
            data: {
              name: key?.type === "Identifier" ? (key.name ?? "") : "[computed]",
              object: objectName(node.init as AstNode),
            },
          });
        }
      },
    };
  },
};
