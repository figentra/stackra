/**
 * Stackra file contract:
 * Purpose: unit tests of `emitResources`, `hostResourcesOf` and `dependencyContributionsOf`: an app hosting the panel gets
 *          `Resources` with each composed resource's base path and the operation refs its consumed services' clients
 *          export (`true` reads the standard `list` or `get`), an operation no client owns left out, two models of one
 *          name told apart by module, a page no client serves left out (a list too) and recorded in `unboundOperations`;
 *          one key from two classes is `resource_duplicate`, the same resource reached
 *          twice is kept once; an app without the panel or without resources gets no file.
 * Boundary: test only; runs on the web app IR fixture with hand-written dependency and service manifests.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0164 (decision 2); ADR 0307 (rule 5); STA-1947.
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";
import { emitResources } from "#core/functions/emit-resources.function";
import { hostResourcesOf } from "#core/functions/host-resources-of.function";
import type { MemberIR } from "#core/types/member-ir.type";

/** A manifest that records `resources` under `ui`. */
const manifestOf = (pkg: string, resources: Record<string, unknown>): StackraManifest => ({
  member: pkg.split("/").pop() ?? pkg,
  package: pkg,
  version: "0.1.0",
  ui: { resources },
});

const ACCOUNT = {
  module: "loyalty_kit",
  class: "LoyaltyAccountResource",
  from: "@acme/loyalty-kit/node",
  options: {
    area: "admin",
    operations: { list: true, get: true, create: "loyalty_kit.account.enroll@1" },
  },
};

/** The loyalty service the app consumes: it owns the list read and the enrol action, not the get read. */
const LOYALTY: NonNullable<MemberIR["services"]>[number] = {
  member: "loyalty",
  manifest: {
    member: "loyalty",
    package: "@acme/service-loyalty",
    version: "0.1.0",
    actions: [
      {
        key: "loyalty_kit.loyalty_account.list@1",
        kind: "query",
        module: "loyalty_kit",
        class: "ListLoyaltyAccountsQuery",
        permission: "loyalty_kit.loyalty_account.read",
        risk: "L0",
      },
      {
        key: "loyalty_kit.account.enroll@1",
        kind: "action",
        module: "loyalty_kit",
        class: "EnrollMemberAction",
        permission: "loyalty_kit.account.enroll",
        risk: "L1",
      },
    ],
  },
};

const APP: MemberIR = {
  ...WEB_APP_IR,
  dependencies: [
    {
      package: "@acme/loyalty-kit",
      manifest: manifestOf("@acme/loyalty-kit", { "loyalty_kit.loyalty_account": ACCOUNT }),
    },
  ],
  services: [LOYALTY],
};

describe("emitResources", () => {
  const content = emitResources(APP)?.content ?? "";

  it("writes each resource's route constants with the operations its clients export", () => {
    expect(emitResources(APP)?.path).toBe(".stackra/gen/resources.ts");
    expect(content).toContain('import { resource } from "@stackra/panel";');
    expect(content).toContain(
      'import { EnrollMemberAction, ListLoyaltyAccountsQuery } from "#stackra/clients/loyalty";',
    );
    // `get: true` reads loyalty_kit.loyalty_account.get@1, which no consumed service owns, so View is left out.
    expect(content).toContain(
      '  LoyaltyAccount: resource("loyalty_kit.loyalty_account", { base: "/loyalty-kit/loyalty-accounts", permission: "loyalty_kit.loyalty_account.read", list: ListLoyaltyAccountsQuery, create: EnrollMemberAction }),',
    );
    expect(content).toContain("export const resourceList = Object.values(Resources);");
    expect(content).toContain(
      'export const unboundOperations = {\n  "loyalty_kit.loyalty_account": {"view":"STA-1971: gen does not write the standard get read yet"},\n} as const;',
    );
  });

  it("carries the bound list action's recorded permission, and none for an unbound list (STA-2058)", () => {
    expect(content).toContain('permission: "loyalty_kit.loyalty_account.read"');
    const alone = emitResources({ ...APP, services: [] })?.content ?? "";
    expect(alone).not.toContain("permission");
  });

  it("tells two models of one name apart by their module", () => {
    const twin = emitResources({
      ...APP,
      dependencies: [
        ...APP.dependencies,
        {
          package: "@acme/rewards",
          manifest: manifestOf("@acme/rewards", {
            "rewards.loyalty_account": {
              ...ACCOUNT,
              module: "rewards",
              class: "RewardsAccountResource",
              options: {
                area: "admin",
                operations: { list: "loyalty_kit.loyalty_account.list@1" },
              },
            },
          }),
        },
      ],
    })?.content;
    expect(twin).toContain('  LoyaltyKitLoyaltyAccount: resource("loyalty_kit.loyalty_account"');
    expect(twin).toContain(
      '  RewardsLoyaltyAccount: resource("rewards.loyalty_account", { base: "/rewards/loyalty-accounts", permission: "loyalty_kit.loyalty_account.read", list: ListLoyaltyAccountsQuery }),',
    );
  });

  it("writes nothing for an app without the panel or without resources", () => {
    expect(emitResources({ ...APP, packages: [] })).toBeUndefined();
    expect(emitResources({ ...APP, dependencies: [] })).toBeUndefined();
  });

  it("composes a resource whose list no client serves, with no list route and the reason recorded", () => {
    const alone = emitResources({ ...APP, services: [] })?.content ?? "";
    expect(alone).toContain(
      '  LoyaltyAccount: { ...resource("loyalty_kit.loyalty_account", { base: "/loyalty-kit/loyalty-accounts" }), list: undefined },',
    );
    expect(alone).not.toContain("#stackra/clients");
    expect(alone).toContain(
      '  "loyalty_kit.loyalty_account": {"list":"STA-1971: gen does not write the standard list read yet","view":"STA-1971: gen does not write the standard get read yet","create":"no consumed service\'s client exports loyalty_kit.account.enroll@1"},',
    );
  });
});

describe("hostResourcesOf", () => {
  it("keeps one resource reached twice and refuses one key from two classes", () => {
    const again = {
      package: "@acme/again",
      manifest: manifestOf("@acme/again", { "loyalty_kit.loyalty_account": ACCOUNT }),
    };
    expect(hostResourcesOf({ ...APP, dependencies: [...APP.dependencies, again] })).toEqual({
      resources: [
        { key: "loyalty_kit.loyalty_account", entry: ACCOUNT, from: "@acme/loyalty-kit" },
      ],
      errors: [],
    });
    const other = {
      package: "@acme/other",
      manifest: manifestOf("@acme/other", {
        "loyalty_kit.loyalty_account": { ...ACCOUNT, class: "OtherAccountResource" },
      }),
    };
    const { errors } = hostResourcesOf({ ...APP, dependencies: [...APP.dependencies, other] });
    expect(errors.map((error) => [error.code, error.subject])).toEqual([
      ["resource_duplicate", "loyalty_kit.loyalty_account"],
    ]);
    expect(errors[0]?.message).toContain("@acme/other");
  });

  it("reads nothing from a manifest without ui", () => {
    expect(
      hostResourcesOf({
        ...APP,
        dependencies: [
          {
            package: "@acme/plain",
            manifest: { member: "plain", package: "@acme/plain", version: "1.0.0" },
          },
        ],
        services: [],
      }).resources,
    ).toEqual([]);
  });
});
