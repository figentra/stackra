/**
 * Stackra file contract:
 * Purpose: the `stackra/no-backdrop-filter` rule: a backdrop blur is the material layer's alone (ADR 0320 as amended
 *          2026-10-31, the owner's rule 4). Components name a material class or role (`material-glass`,
 *          `material-role-toast`, the native `GlassSurface`); they never write a backdrop filter, a Tailwind
 *          `backdrop-blur`, `backdrop-saturate` or `backdrop-brightness` utility, or import expo-blur or
 *          expo-glass-effect.
 * Boundary: syntax only; reads string literals, template text, object property keys and import sources. The material
 *           layer itself (the token renderers, `@stackra/ui`'s native glass folder) and tests are exempt in
 *           `base.jsonc`. A plain `blur-*` filter on an image (a blur-up placeholder) is not a material and passes.
 *           No autofix.
 * Runtime: isomorphic
 * Governing contract: ADR 0320 (decision 4 and the review rule, as amended 2026-10-31); ADR 0129 (house rules).
 */
import { reportFirstMatch } from "../functions/report-first-match.function.ts";
import { stringVisitors } from "../functions/string-visitors.function.ts";
import type { Rule } from "#core/types/rule.type";

/** A Tailwind backdrop utility, with any variant prefixes and the `!` modifier, or CSS's own property. */
const BACKDROP =
  /(?:^|[\s;{"'`])(?:(?:[\w-]|\[[^\]]*\])+:)*!?(backdrop-(?:blur|saturate|brightness|contrast|filter)(?:-[\w./[\]()-]+)?)(?=[\s:;"'`]|$)/;

/** A style object key that sets a backdrop filter. */
const BACKDROP_KEY = /^(?:WebkitBackdropFilter|backdropFilter)$/;

/** The native modules that draw a backdrop material. */
const MATERIAL_MODULES = new Set(["expo-blur", "expo-glass-effect"]);

/** Refuses backdrop filters and material imports outside the material layer. */
export const NO_BACKDROP_FILTER_RULE: Rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow backdrop filters, backdrop-blur utilities and expo-blur or expo-glass-effect imports outside the material layer (ADR 0320).",
    },
    messages: {
      backdrop:
        "`{{token}}` blurs the backdrop by hand; use a material class or role (`material-glass`, " +
        "`material-role-<role>`) so the theme and its fallbacks decide (ADR 0320).",
      module:
        "`{{module}}` draws a material; use `GlassSurface` or `GlassGroup` from the native glass layer (ADR 0320).",
    },
    schema: [],
  },
  create(context) {
    return {
      ...stringVisitors(reportFirstMatch(context, BACKDROP, "backdrop")),
      Property(node) {
        const key = node.key?.type === "Identifier" ? node.key.name : node.key?.value;
        if (typeof key === "string" && BACKDROP_KEY.test(key))
          context.report({ node, messageId: "backdrop", data: { token: key } });
      },
      ImportDeclaration(node) {
        const module = String(node.source?.value ?? "");
        if (MATERIAL_MODULES.has(module))
          context.report({ node, messageId: "module", data: { module } });
      },
    };
  },
};
