/**
 * Stackra file contract:
 * Purpose: `planConsumerGateSteps({ root, services, steps })`, the ordered step plan read from the scratch copy
 *          (service package names, `test:int` and `validate` scripts): install, build-deps, gen per service,
 *          typecheck, test, test:int per service, validate. A step the product has no script for is planned with a
 *          skip reason.
 * Boundary: reads `package.json` files under `root`; starts nothing.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { CONSUMER_GATE_INSTALL_FLAGS } from "#node/consumer-gate/constants/consumer-gate-install-flags.constant";
import type { ConsumerGateStepPlan } from "#node/consumer-gate/types/consumer-gate-step-plan.type";

type PackageJson = { readonly name?: string; readonly scripts?: Record<string, string> };

/**
 * Plans the steps.
 *
 * @param input - the scratch copy root, the services to gate and the step names to include.
 * @example
 * planConsumerGateSteps({ root, services: ["billing"], steps: ["typecheck"] }); // [{ id: "typecheck", ... }]
 */
export function planConsumerGateSteps(input: {
  readonly root: string;
  readonly services: readonly string[];
  readonly steps: readonly string[];
}): ConsumerGateStepPlan[] {
  const { root, services, steps } = input;
  const read = (dir: string): PackageJson =>
    JSON.parse(readFileSync(join(root, dir, "package.json"), "utf8")) as PackageJson;
  const names = services.map((service) => read(`services/${service}`).name ?? service);
  const own = names.map((name) => `--filter=${name}`);
  const turbo = (task: string): string[] => [
    "pnpm",
    "exec",
    "turbo",
    "run",
    task,
    "--continue",
    "--concurrency=1",
    ...own,
  ];
  const plan: ConsumerGateStepPlan[] = [];
  const add = (id: string, argv: string[], cwd = ".", skip?: string): void => {
    if (steps.includes(id.split("/")[0] as string)) {
      plan.push(skip === undefined ? { id, argv, cwd } : { id, argv, cwd, skip });
    }
  };
  add("install", ["pnpm", ...CONSUMER_GATE_INSTALL_FLAGS]);
  add("build-deps", [
    "pnpm",
    "exec",
    "turbo",
    "run",
    "build",
    ...names.map((name) => `--filter=${name}^...`),
  ]);
  for (const service of services) {
    add(
      `gen/${service}`,
      ["sh", "-c", "pnpm exec stackra gen --manifests && pnpm exec stackra gen"],
      `services/${service}`,
    );
  }
  add("typecheck", turbo("typecheck"));
  add("test", turbo("test"));
  for (const service of services) {
    const has = Boolean(read(`services/${service}`).scripts?.["test:int"]);
    add(
      `test:int/${service}`,
      ["pnpm", "run", "test:int"],
      `services/${service}`,
      has ? undefined : "no test:int script",
    );
  }
  const hasValidate = Boolean(read(".").scripts?.["validate"]);
  add("validate", ["pnpm", "run", "validate"], ".", hasValidate ? undefined : "no validate script");
  return plan;
}
