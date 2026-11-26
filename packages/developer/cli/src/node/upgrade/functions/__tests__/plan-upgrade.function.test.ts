/**
 * Stackra file contract:
 * Purpose: unit tests of `planUpgrade` over a throwaway workspace: `from` is the oldest pin (a service's own `^0.8.2`
 *          below the catalog's 0.29.0), every pin file is edited, the services are found; `--from`, `--only`; and the
 *          refusals: no pin, a pin newer than the target, a version that is not exact.
 * Boundary: test only; writes a workspace under the OS temp folder and removes it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0199 (decision 2); STA-145.
 */
import { afterEach, describe, expect, it } from "@stackra/testing";

import { UPGRADE_CODEMODS } from "#node/upgrade/constants/upgrade-codemods.constant";
import { CONSUMER_FILES } from "#node/upgrade/functions/__tests__/consumer-files";
import { fixtureWorkspace } from "#node/upgrade/functions/__tests__/fixture-workspace";
import { planUpgrade } from "#node/upgrade/functions/plan-upgrade.function";

let cleanup: (() => void) | undefined;
const workspace = (files: Readonly<Record<string, string>>) => {
  const made = fixtureWorkspace(files);
  cleanup = made.remove;
  return made.root;
};

afterEach(() => cleanup?.());

describe("planUpgrade", () => {
  it("starts from the oldest pin, edits every pin file, and finds the services", () => {
    const root = workspace(CONSUMER_FILES);
    const plan = planUpgrade(root, { to: "0.33.1", codemods: UPGRADE_CODEMODS });
    expect(plan.from).toBe("0.8.2");
    expect(plan.to).toBe("0.33.1");
    expect(plan.codemods.map((codemod) => codemod.id)).toEqual([
      "identity-account-session",
      "config-infisical-store-removed",
      "actions-idempotency-complete-refused",
      "gen-area-routes",
      "services-encore-app-root",
      "services-tsconfig-no-base-url",
    ]);
    expect(plan.manifests.map((edit) => edit.file)).toEqual([
      "pnpm-workspace.yaml",
      "services/orders/package.json",
    ]);
    expect(plan.manifests[0]?.after).toContain('"@stackra/ui": 0.33.1');
    expect(plan.manifests[1]?.after).toContain('"@stackra/identity": "^0.33.1"');
    expect(plan.services).toEqual(["services/orders"]);
  });

  it("takes --from and --only", () => {
    const root = workspace(CONSUMER_FILES);
    const plan = planUpgrade(root, {
      to: "0.33.1",
      from: "0.29.0",
      only: ["services-tsconfig-no-base-url"],
      codemods: UPGRADE_CODEMODS,
    });
    expect(plan.from).toBe("0.29.0");
    expect(plan.codemods.map((codemod) => codemod.id)).toEqual(["services-tsconfig-no-base-url"]);
  });

  it("refuses: no pin and no --from, a pin newer than the target, a version that is not exact", () => {
    const empty = workspace({ "package.json": '{ "name": "x" }\n' });
    expect(() => planUpgrade(empty, { to: "0.33.1", codemods: UPGRADE_CODEMODS })).toThrow(
      /no @stackra\/\* version is pinned/,
    );
    cleanup?.();
    const root = workspace(CONSUMER_FILES);
    expect(() => planUpgrade(root, { to: "0.20.0", codemods: UPGRADE_CODEMODS })).toThrow(
      /pnpm-workspace.yaml pins @stackra\/actions 0.29.0, newer than 0.20.0/,
    );
    expect(() => planUpgrade(root, { to: "latest", codemods: UPGRADE_CODEMODS })).toThrow(
      "--to must be an exact version such as 0.33.1, not latest",
    );
    expect(() =>
      planUpgrade(root, { to: "0.33.1", from: "0.34.0", codemods: UPGRADE_CODEMODS }),
    ).toThrow("--from 0.34.0 is newer than the target 0.33.1");
  });
});
