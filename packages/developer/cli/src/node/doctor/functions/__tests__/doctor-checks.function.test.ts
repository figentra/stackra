/**
 * Stackra file contract:
 * Purpose: proves `doctorChecks` opens with the supported-system line, so `stackra doctor`, `stackra dev`'s quick
 *          check and `stackra create`'s machine check all name WSL 2 on native Windows before anything else runs.
 * Boundary: test only; `node:child_process` is replaced, so no command runs, and the platform is set for one test and
 *           put back. The quick checklist of an empty workspace probes no port and no host.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-1952 spec FR-014; STA-2899 (supported systems).
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { doctorChecks } from "#node/doctor/functions/doctor-checks.function";
import type { DoctorWorkspace } from "#node/doctor/types/doctor-workspace.type";

// Every probe answers "not found", so the only other line is "mise installed".
vi.mock("node:child_process", () => ({
  spawnSync: vi.fn(() => ({ status: 1, stdout: "", stderr: "", error: undefined })),
}));

const EMPTY: DoctorWorkspace = { manifests: [], scripts: {}, devPorts: [] };
const PLATFORM = Object.getOwnPropertyDescriptor(process, "platform") as PropertyDescriptor;

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-doctor-"));
});

afterEach(() => {
  Object.defineProperty(process, "platform", PLATFORM);
  rmSync(root, { recursive: true, force: true });
});

describe("doctorChecks", () => {
  it("opens with a warning naming WSL 2 on native Windows", async () => {
    Object.defineProperty(process, "platform", { ...PLATFORM, value: "win32" });
    const [first] = await doctorChecks(root, EMPTY, { quick: true });
    expect(first).toMatchObject({ name: "supported system", status: "warn" });
    expect(first?.fix).toContain("wsl --install");
  });

  it("opens with the supported-system line on this machine too", async () => {
    const results = await doctorChecks(root, EMPTY, { quick: true });
    expect(results.map((result) => result.name)).toEqual(["supported system", "mise installed"]);
  });
});
