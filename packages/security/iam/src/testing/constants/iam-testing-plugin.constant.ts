/**
 * Stackra file contract:
 * Purpose: `IAM_TESTING_PLUGIN`, the testing-module plugin of @stackra/iam: on every compiled testing app it connects
 *          the policies to the app, hands the memory `AccessControl` the record-policy check (`connectRecordPolicies`,
 *          the same decision `IamAccessControlDriver.authorize` makes before the decision point), and, when the
 *          app's `PolicySource` is the memory driver, loads a policy where every principal is owner at the root, so a
 *          module's tests exercise its policies and handlers while IAM's own rules are tested here.
 * Boundary: registered on import of `./testing`. Holds no state. A test that needs exact grants replaces the policy
 *           with `app.get(PolicySource).load({...})` after compiling. A system permission still needs a platform
 *           actor (`actors.job()`, `actors.system()`), because no role grants one. Imports `.`, `./contracts`,
 *           `@stackra/actions` and `@stackra/container/testing` only; no other package's `./testing` (ADR 0269
 *           decision 3).
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0263 (decision 12: the testing module); ADR 0132 (decision 5:
 *                     the owner's wildcard is a system role's).
 */
import { connectRecordPolicies } from "@stackra/actions";
import { registerTestingPlugin } from "@stackra/container/testing";
import type { TestingApp, TestingPlugin } from "@stackra/container/testing";

import { PolicySource } from "#contracts/index";
import { Decision } from "#core/enums/decision.enum";
import { decidePolicy } from "#core/functions/decide-policy.function";
import { isAnonymousCall } from "#core/functions/is-anonymous-call.function";
import { policyRowOf } from "#core/functions/policy-row-of.function";
import { connectPolicies, MemoryPolicySourceDriver, SystemRole } from "#core/index";

/** The root node a test acts at (`ScopeConfig.root` by default). */
const ROOT = Object.freeze({ id: "scp_01j9z3k4m5n6p7q8r9s0t1v2r1", path: "platform" } as const);

/** The iam testing-module plugin. */
export const IAM_TESTING_PLUGIN: TestingPlugin = {
  name: "@stackra/iam",
  app(app: TestingApp) {
    connectPolicies(app);
    connectRecordPolicies(async (call, record) => {
      if (call.permission === undefined || isAnonymousCall(call)) return true;
      const row = policyRowOf(record);
      if (row === undefined) return true;
      return (await decidePolicy(row, call.permission, call.actor, record)) !== Decision.Deny;
    });
    if (app.has(PolicySource)) {
      const source = app.get(PolicySource);
      if (source instanceof MemoryPolicySourceDriver)
        source.load({
          grants: [{ role: SystemRole.Owner, scope: ROOT }],
          roles: { [SystemRole.Owner]: ["*"] },
        });
    }
    return {};
  },
};

registerTestingPlugin(IAM_TESTING_PLUGIN);
