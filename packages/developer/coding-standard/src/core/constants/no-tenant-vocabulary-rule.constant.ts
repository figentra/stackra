/**
 * Stackra file contract:
 * Purpose: the `stackra/no-tenant-vocabulary` rule: the word `tenant` does not appear in an identifier outside
 *          `@stackra/tenancy`; code names the scope with `ScopeRef` (`scope`, `ScopeId`), not a tenant.
 * Boundary: reads identifier names only (declarations, references, property names), case-insensitively; strings and
 *           comments are not read. A file under a `tenancy` folder is exempt. No autofix: a rename is not a lint fix.
 * Runtime: isomorphic
 * Governing contract: owner decisions H and R-59 (2026-10-24 final review, tenant vocabulary); ADR 0129 (decision 1).
 */
import type { Rule } from "#core/types/rule.type";

const TENANT = /tenant/i;
const TENANCY_FILE = /(?:^|[\\/])tenancy[\\/]/;

/** Refuses the word tenant in identifiers outside the tenancy package. */
export const NO_TENANT_VOCABULARY_RULE: Rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow the word tenant in identifiers outside @stackra/tenancy; use ScopeRef (owner H, R-59).",
    },
    messages: {
      noTenant:
        "`{{name}}` says tenant outside @stackra/tenancy; name the scope with `ScopeRef` (owner decision R-59).",
    },
    schema: [],
  },
  create(context) {
    if (TENANCY_FILE.test(context.filename)) return {};
    return {
      Identifier(node) {
        if (node.name !== undefined && TENANT.test(node.name)) {
          context.report({ node, messageId: "noTenant", data: { name: node.name } });
        }
      },
    };
  },
};
