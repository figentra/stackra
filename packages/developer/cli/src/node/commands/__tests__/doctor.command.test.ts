/**
 * Stackra file contract:
 * Purpose: unit tests of `DoctorCommand` on the console: the checklist rows are the `--json` data unchanged (`run`
 *          included, each under its group), a failed row exits 1, a warning does not, and `--fix` runs an accepted
 *          fix through `io.process` once and nothing else.
 * Boundary: test only; the checks are replaced by rows, so no machine is probed and nothing is installed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-1952 spec User Story 0; STA-1966.
 */
import { MemoryProcessRunnerDriver, runCommandForTest } from "@stackra/console/testing";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DoctorCommand } from "#node/commands/doctor.command";
import { doctorChecks } from "#node/doctor/functions/doctor-checks.function";
import type { DoctorResult } from "#node/doctor/types/doctor-result.type";

vi.mock("#node/doctor/functions/doctor-checks.function", () => ({ doctorChecks: vi.fn() }));
vi.mock("#node/doctor/functions/read-doctor-workspace.function", () => ({
  readDoctorWorkspace: () => ({ manifests: [], scripts: {}, infisical: false, devPorts: [] }),
}));

const ok: DoctorResult = { name: "mise installed", status: "ok" };
const warn: DoctorResult = { name: "disk space", status: "warn", detail: "low", fix: "free space" };
const fail: DoctorResult = {
  name: "mise tools",
  status: "fail",
  detail: "node missing",
  fix: "mise install",
  run: ["mise", "install"],
};

beforeEach(() => {
  vi.mocked(doctorChecks).mockReset();
});

describe("DoctorCommand", () => {
  it("emits the rows unchanged under --json, with their group and run, and exits 1 on a failed row", async () => {
    vi.mocked(doctorChecks).mockResolvedValue([ok, warn, fail]);
    const result = await runCommandForTest([DoctorCommand], ["doctor", "--json"]);
    expect(result.exitCode).toBe(1);
    const document = result.json as { ok: boolean; data: unknown };
    expect(document.data).toEqual([
      { name: "mise installed", status: "ok", group: "Machine" },
      { name: "disk space", status: "warn", detail: "low", fix: "free space", group: "Machine" },
      {
        name: "mise tools",
        status: "fail",
        detail: "node missing",
        fix: "mise install",
        run: ["mise", "install"],
        group: "Machine",
      },
    ]);
  });

  it("draws a grouped checklist, and a warning alone exits 0", async () => {
    vi.mocked(doctorChecks).mockResolvedValue([ok, { ...warn, name: "encore CLI" }]);
    const result = await runCommandForTest([DoctorCommand], ["doctor"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Machine");
    expect(result.stdout).toContain("Tools");
    expect(result.stdout).toContain("encore CLI");
  });

  it("runs an accepted fix once through the process port, in the workspace root", async () => {
    vi.mocked(doctorChecks).mockResolvedValue([fail, { ...fail, name: "mise tools again" }]);
    const process = new MemoryProcessRunnerDriver().on("mise install", { code: 0 });
    const result = await runCommandForTest([DoctorCommand], ["doctor", "--fix"], {
      answers: [true],
      process,
    });
    expect(result.asked).toHaveLength(1);
    expect(process.calls.map((call) => call.line)).toEqual(["mise install"]);
    expect(process.calls[0]?.interactive).toBe(true);
    expect(process.calls[0]?.cwd).toBe("/work");
  });
});
