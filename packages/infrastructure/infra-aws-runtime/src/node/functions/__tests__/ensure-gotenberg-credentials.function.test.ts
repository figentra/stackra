/**
 * Stackra file contract:
 * Purpose: unit tests of `ensureGotenbergCredentials`: the first time it writes the engine's password to
 *          `/workloads/<resource>`, and the consumers' `DOCUMENTS_GOTENBERG_URL` (the engine's private name, port 3000)
 *          and `DOCUMENTS_GOTENBERG_AUTHORIZATION` (Basic over `stackra:<password>`) to `/runtime/<resource>`; a job that
 *          has the password writes nothing; a plan without an engine writes nothing.
 * Boundary: test only; a recording vault stands in for the vault writer. No value is printed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0493 (as amended: the gotenberg resource); ADR 0173.
 */
import { VaultWriter } from "@stackra/runway";
import { describe, expect, it } from "@stackra/testing";

import { gotenbergWorkload } from "#core/functions/gotenberg-workload.function";
import type { RuntimePlan } from "#core/types/runtime-plan.type";
import { ensureGotenbergCredentials } from "#node/functions/ensure-gotenberg-credentials.function";

/** A vault that records each write. */
class RecordingVault extends VaultWriter {
  readonly writes: { path: string; name: string; value: string }[] = [];

  override async write(path: string, name: string, value: string): Promise<void> {
    this.writes.push({ path, name, value });
  }
}

/** Tamo's staging plan with the engine `pdf`, or with none. */
function plan(withEngine: boolean): RuntimePlan {
  return {
    project: "tamo",
    environment: "staging",
    queues: [],
    caches: [],
    buckets: [],
    databases: [],
    workloads: withEngine ? [gotenbergWorkload("pdf", "tamo-staging-pdf", "small", "staging")] : [],
    cost: { items: [], monthlyUsd: 0 },
  };
}

describe("ensureGotenbergCredentials", () => {
  it("writes the engine's password and the consumers' URL and authorization once", async () => {
    const vault = new RecordingVault();

    const written = await ensureGotenbergCredentials(plan(true), {
      vault,
      env: {},
      vaultEnvironment: "staging",
    });

    const password = vault.writes.find(
      (write) => write.name === "GOTENBERG_API_BASIC_AUTH_PASSWORD",
    );
    expect(password?.path).toBe("staging:/workloads/pdf");
    expect(password?.value).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(vault.writes).toContainEqual({
      path: "staging:/runtime/pdf",
      name: "DOCUMENTS_GOTENBERG_URL",
      value: "http://pdf.staging.workloads.tamo.internal:3000",
    });
    expect(vault.writes).toContainEqual({
      path: "staging:/runtime/pdf",
      name: "DOCUMENTS_GOTENBERG_AUTHORIZATION",
      value: `Basic ${Buffer.from(`stackra:${password?.value}`).toString("base64")}`,
    });
    expect(written).toEqual({
      pdf: [
        "GOTENBERG_API_BASIC_AUTH_PASSWORD",
        "DOCUMENTS_GOTENBERG_URL",
        "DOCUMENTS_GOTENBERG_AUTHORIZATION",
      ],
    });
  });

  it("keeps the password the job already has, and writes nothing without an engine", async () => {
    const vault = new RecordingVault();

    await ensureGotenbergCredentials(plan(true), {
      vault,
      env: { GOTENBERG_API_BASIC_AUTH_PASSWORD: "kept" },
      vaultEnvironment: "staging",
    });
    await ensureGotenbergCredentials(plan(false), { vault, env: {}, vaultEnvironment: "staging" });

    expect(vault.writes).toEqual([]);
  });
});
