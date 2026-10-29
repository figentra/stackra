/**
 * Stackra file contract:
 * Purpose: unit tests of `deployFact` and the deploy's missing-fact refusal: a flag wins over the environment, values
 *          are trimmed, and an empty or blank flag or variable (an unset GitHub repository variable) counts as missing,
 *          so `stackra deploy --product` names it instead of deploying with "".
 * Boundary: test only; sets and restores the deploy variables, writes a root runway into a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0436 (decision 4).
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "@stackra/testing";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { deployFact } from "#node/product/functions/deploy-fact.function";
import { runDeployProduct } from "#node/product/functions/run-deploy-product.function";
import type { CliContext } from "#node/types/cli-context.type";

const VARIABLES = [
  "STACKRA_ASSETS_BUCKET",
  "STACKRA_ASSETS_ORIGIN",
  "STACKRA_EDGE_KV_NAMESPACE",
  "STACKRA_SERVED_SHELLS",
  "STACKRA_REGION",
];

afterEach(() => {
  for (const name of VARIABLES) Reflect.deleteProperty(process.env, name);
});

describe("deployFact", () => {
  it("takes the trimmed flag, then the variable, and treats empty or blank as missing", () => {
    process.env["STACKRA_ASSETS_BUCKET"] = " env-bucket ";
    expect(
      deployFact({ "assets-bucket": " flag " }, "assets-bucket", "STACKRA_ASSETS_BUCKET"),
    ).toBe("flag");
    expect(deployFact({ "assets-bucket": "  " }, "assets-bucket", "STACKRA_ASSETS_BUCKET")).toBe(
      "env-bucket",
    );
    process.env["STACKRA_ASSETS_BUCKET"] = "";
    expect(deployFact({}, "assets-bucket", "STACKRA_ASSETS_BUCKET")).toBeUndefined();
    process.env["STACKRA_ASSETS_BUCKET"] = "   ";
    expect(
      deployFact({ "assets-bucket": "" }, "assets-bucket", "STACKRA_ASSETS_BUCKET"),
    ).toBeUndefined();
  });
});

describe("runDeployProduct", () => {
  it("names every fact an unset (empty) repository variable left missing", async () => {
    const root = mkdtempSync(join(tmpdir(), "stackra-deploy-facts-"));
    try {
      writeFileSync(
        join(root, "runway.yaml"),
        "version: 3\nproject: acme\nproduct:\n  key: acme\nenvironments: {}\n",
      );
      for (const name of VARIABLES) process.env[name] = "";
      const context = {
        cwd: root,
        io: { out: () => undefined, err: () => undefined },
        values: { product: true, env: "staging", region: "" },
        positionals: [],
        rest: [],
        cli: async () => 0,
      } as unknown as CliContext;
      const refusal = runDeployProduct(context);
      await expect(refusal).rejects.toThrow(CliUsageError);
      await expect(refusal).rejects.toThrow(
        /--assets-bucket, --assets-origin, --kv-namespace, --served/,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
