/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryGoogleCloudDriver`: a project is ours, taken or missing; creating a taken project
 *          answers false and records nothing; a service account is recorded only when it is new; a key answers the
 *          fixed `key` and the record never holds it.
 * Boundary: test only; in memory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0482 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { GoogleProjectState } from "#core/enums/google-project-state.enum";
import { MemoryGoogleCloudDriver } from "#node/drivers/memory-google-cloud.driver";

describe("MemoryGoogleCloudDriver", () => {
  it("creates a missing project and refuses a taken one", async () => {
    const google = new MemoryGoogleCloudDriver();
    google.taken.add("taken-id");

    expect(await google.projectState("acme")).toBe(GoogleProjectState.Missing);
    expect(await google.projectState("taken-id")).toBe(GoogleProjectState.Taken);
    expect(await google.createProject("acme", "Acme")).toBe(true);
    expect(await google.createProject("taken-id", "Taken")).toBe(false);
    expect(await google.projectState("acme")).toBe(GoogleProjectState.Ours);
    expect(google.calls).toEqual(["createProject acme Acme"]);
  });

  it("records a service account once and a key without its value", async () => {
    const google = new MemoryGoogleCloudDriver();

    const email = await google.ensureServiceAccount("acme", "runway", "roles/firebase.admin");
    expect(await google.ensureServiceAccount("acme", "runway", "roles/firebase.admin")).toBe(email);
    expect(email).toBe("runway@acme.iam.gserviceaccount.com");
    expect(await google.createKey("acme", email)).toBe(google.key);

    expect(google.calls).toEqual([
      "ensureServiceAccount acme runway roles/firebase.admin",
      `createKey acme ${email}`,
    ]);
    expect(google.calls.join("\n")).not.toContain("memory-canary");
  });
});
