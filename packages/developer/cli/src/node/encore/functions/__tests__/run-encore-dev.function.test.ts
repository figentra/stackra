/**
 * Stackra file contract:
 * Purpose: unit tests of `runEncoreDev`: a workstation that cannot reach the service's Encore Cloud app runs Encore
 *          with the id `""` in `encore.app` and gets gen's file back afterwards (and on a stop signal, before the
 *          signal's default action); a linked one runs with the real id untouched; an empty id or a missing or non-JSON
 *          file is not probed; a file something else rewrote during the run is left alone.
 * Boundary: test only; `encoreCloudLink` and `runProcess` are replaced by fakes, so no `encore` starts.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0091 (amendment of 2026-11-09, rule 1); STA-2794.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { encoreCloudLink } from "#node/encore/functions/encore-cloud-link.function";
import { runEncoreDev } from "#node/encore/functions/run-encore-dev.function";
import { captureIo } from "#node/functions/capture-io.function";
import { runProcess } from "#node/functions/run-process.function";

vi.mock("#node/encore/functions/encore-cloud-link.function", () => ({ encoreCloudLink: vi.fn() }));
vi.mock("#node/functions/run-process.function", () => ({ runProcess: vi.fn() }));

const link = vi.mocked(encoreCloudLink);
const spawn = vi.mocked(runProcess);

/** The `encore.app` gen writes for `providers.encore.app: acme-platform` (`emitEncoreApp`). */
const GENERATED = '{\n  "id": "acme-platform",\n  "lang": "typescript"\n}\n';

let root: string;
let seen: string[];

const app = (): string => readFileSync(join(root, "encore.app"), "utf8");
const tool = () => ({ command: "encore", args: ["run"], cwd: root });

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-encore-dev-"));
  writeFileSync(join(root, "encore.app"), GENERATED);
  seen = [];
  link.mockReset();
  // Records the encore.app `encore run` would read when it starts.
  spawn.mockReset().mockImplementation(async () => {
    seen.push(app());
    return 0;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(root, { recursive: true, force: true });
});

describe("runEncoreDev", () => {
  it('runs local-only with id "" when Encore Cloud is out of reach, then puts gen\'s file back', async () => {
    link.mockResolvedValue({
      linked: false,
      reason: "not logged in: run 'encore auth login' first",
    });
    const { io, output } = captureIo();
    expect(await runEncoreDev(tool(), io)).toBe(0);
    expect(spawn).toHaveBeenCalledWith(tool(), io);
    expect(seen).toEqual(['{\n  "id": "",\n  "lang": "typescript"\n}\n']);
    expect(app()).toBe(GENERATED);
    expect(output()).toContain("Encore Cloud app acme-platform is out of reach (not logged in");
    expect(output()).toContain("running local-only");
  });

  it("returns Encore's exit code and restores the file when the run fails", async () => {
    link.mockResolvedValue({ linked: false, reason: "offline" });
    spawn.mockResolvedValue(3);
    expect(await runEncoreDev(tool(), captureIo().io)).toBe(3);
    expect(app()).toBe(GENERATED);
  });

  it("keeps the real id when the app is linked", async () => {
    link.mockResolvedValue({ linked: true });
    const { io, output } = captureIo();
    expect(await runEncoreDev(tool(), io)).toBe(0);
    expect(seen).toEqual([GENERATED]);
    expect(output()).toContain("linked to Encore Cloud app acme-platform");
  });

  it("does not probe an app that is already local-only, missing or not JSON", async () => {
    spawn.mockResolvedValue(0);
    writeFileSync(join(root, "encore.app"), '{ "id": "", "lang": "typescript" }\n');
    await runEncoreDev(tool(), captureIo().io);
    rmSync(join(root, "encore.app"));
    await runEncoreDev(tool(), captureIo().io);
    writeFileSync(join(root, "encore.app"), "// hujson\n{ id: 'x' }\n");
    await runEncoreDev(tool(), captureIo().io);
    expect(link).not.toHaveBeenCalled();
    expect(spawn).toHaveBeenCalledTimes(3);
  });

  it("leaves a file something else rewrote during the run", async () => {
    link.mockResolvedValue({ linked: false, reason: "offline" });
    const regenerated = '{\n  "id": "acme-next",\n  "lang": "typescript"\n}\n';
    spawn.mockImplementation(async () => {
      writeFileSync(join(root, "encore.app"), regenerated);
      return 0;
    });
    await runEncoreDev(tool(), captureIo().io);
    expect(app()).toBe(regenerated);
  });

  it("puts gen's file back on a stop signal, then lets the signal end the process", async () => {
    link.mockResolvedValue({ linked: false, reason: "offline" });
    const kill = vi.spyOn(process, "kill").mockImplementation(() => true);
    const before = process.listenerCount("SIGINT");
    spawn.mockImplementation(async () => {
      seen.push(app());
      process.emit("SIGINT", "SIGINT");
      seen.push(app());
      return 130;
    });
    expect(await runEncoreDev(tool(), captureIo().io)).toBe(130);
    expect(seen).toEqual(['{\n  "id": "",\n  "lang": "typescript"\n}\n', GENERATED]);
    expect(kill).toHaveBeenCalledWith(process.pid, "SIGINT");
    expect(process.listenerCount("SIGINT")).toBe(before);
  });
});
