/**
 * Stackra file contract:
 * Purpose: unit tests of `doctorChecks` on a machine with nothing on `PATH` (not even `which`): a missing tool reads
 *          as missing rather than present, and no row's name, detail or fix sends a user to one organisation's
 *          repositories, scripts, secret paths or VPN product.
 * Boundary: test only; `PATH` points at an empty temporary folder for the test's length, so every status command
 *           fails to start and nothing is installed or changed; the network probe is injected, so no host is
 *           contacted; the workspace needs no Docker, Encore or ports.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-1952 spec FR-014 to FR-017; STA-2859.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { doctorChecks } from "#node/doctor/functions/doctor-checks.function";
import type { DoctorWorkspace } from "#node/doctor/types/doctor-workspace.type";
import type { HostProbe } from "#node/doctor/types/host-probe.type";

/** Text a user outside Figentra could not act on. */
const INTERNAL =
  /figentra\/secrets|figentra\/infra|\bwarp\b|one\.one\.one\.one|secrets-exec|owner's google/i;

/** A network on which no host answers. */
const probe = async (hosts: readonly string[]): Promise<HostProbe[]> =>
  hosts.map((host) => ({ host, address: "", ok: false }));

let root: string;
let empty: string;
let savedPath: string | undefined;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-doctor-root-"));
  empty = mkdtempSync(join(tmpdir(), "stackra-doctor-path-"));
  savedPath = process.env["PATH"];
  process.env["PATH"] = empty;
});

afterEach(() => {
  if (savedPath === undefined) delete process.env["PATH"];
  else process.env["PATH"] = savedPath;
  rmSync(root, { recursive: true, force: true });
  rmSync(empty, { recursive: true, force: true });
});

describe("doctorChecks", () => {
  it("reports mise as not installed when it is not on PATH, without needing which", async () => {
    const workspace: DoctorWorkspace = { manifests: [], scripts: {}, devPorts: [] };
    const results = await doctorChecks(root, workspace, { quick: true });
    expect(results[0]).toMatchObject({
      name: "mise installed",
      status: "fail",
      detail: "not on PATH",
    });
  });

  it("gives advice any user can follow: no internal repository, script, secret path or VPN product", async () => {
    const workspace: DoctorWorkspace = {
      manifests: [{ dependencies: { "@figentra/os-console": "^3.0.0", "@stackra/cli": "^1.0.0" } }],
      scripts: { "agents:check": "stackra agents check", secrets: "node secrets-exec.mjs" },
      devPorts: [],
    };
    const results = await doctorChecks(root, workspace, { fresh: true }, { probe });
    const names = results.map((result) => result.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "network",
        "@figentra registry readable",
        "sops CLI",
        "Google login for sops",
        "secrets checkout",
      ]),
    );
    expect(results.find((result) => result.name === "network")?.status).toBe("fail");
    for (const result of results)
      expect(`${result.name} ${result.detail ?? ""} ${result.fix ?? ""}`).not.toMatch(INTERNAL);
  });
});
