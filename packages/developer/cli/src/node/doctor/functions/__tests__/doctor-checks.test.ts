/**
 * Stackra file contract:
 * Purpose: hold `doctorChecks`' dev-ports wiring to STA-2794: a workspace with a service checks Encore's ports (4000 and
 *          the dashboard's 9400) and the members' dev ports; 9400 held by the current user's own Encore daemon is
 *          reused (the line is ok), while a busy 4000 still fails it, and the daemon is asked about 9400 only.
 * Boundary: the port reads are fakes (`options.ports`); the quick checklist's status reads (`which mise`, `mise ls`,
 *           `docker info`) run as they are and are not asserted. Binds no port.
 * Runtime: node (vitest)
 * Governing contract: ADR 0182 (testing strategy); STA-1952 spec FR-019; STA-2794.
 */
import assert from "node:assert/strict";
import { tmpdir } from "node:os";

import { test } from "@stackra/testing";

import { doctorChecks } from "#node/doctor/functions/doctor-checks.function";
import type { DoctorWorkspace } from "#node/doctor/types/doctor-workspace.type";

/** An app with one service and a console on 3710: what `stackra create` writes. */
const APP: DoctorWorkspace = {
  manifests: [{ name: "app" }, { name: "@acme/example", stackra: { tier: "service" } }],
  scripts: {},
  devPorts: [3710],
};

/** Fake port reads: `busy` ports are taken; `daemon` ports are held by the user's own Encore daemon. */
function ports(busy: readonly number[], daemon: readonly number[]) {
  const freeAsked: number[] = [];
  const daemonAsked: number[] = [];
  return {
    freeAsked,
    daemonAsked,
    probe: {
      portFree: async (port: number) => {
        freeAsked.push(port);
        return !busy.includes(port);
      },
      ownEncoreDaemon: async (port: number) => {
        daemonAsked.push(port);
        return daemon.includes(port);
      },
    },
  };
}

const portsLine = async (probe: ReturnType<typeof ports>["probe"]) =>
  (await doctorChecks(tmpdir(), APP, { quick: true, ports: probe })).find(
    (result) => result.name === "dev ports free",
  );

test("doctorChecks reuses 9400 when the user's own Encore daemon holds it", async () => {
  const fake = ports([9400], [9400]);
  const line = await portsLine(fake.probe);
  assert.equal(line?.status, "ok");
  assert.equal(line?.detail, "your Encore daemon holds 9400 (reused)");
  assert.deepEqual(fake.freeAsked, [4000, 9400, 3710]);
  assert.deepEqual(fake.daemonAsked, [9400]);
});

test("doctorChecks still fails a busy 4000 while reusing the user's daemon on 9400", async () => {
  const fake = ports([4000, 9400], [4000, 9400]);
  const line = await portsLine(fake.probe);
  assert.equal(line?.status, "fail");
  assert.equal(line?.detail, "in use: 4000; your Encore daemon holds 9400 (reused)");
  assert.match(line?.fix ?? "", /lsof -nP -iTCP:4000 -sTCP:LISTEN/);
  assert.deepEqual(fake.daemonAsked, [9400]);
});

test("doctorChecks fails 9400 held by anything but the user's own daemon", async () => {
  const fake = ports([9400], []);
  const line = await portsLine(fake.probe);
  assert.equal(line?.status, "fail");
  assert.equal(line?.detail, "in use: 9400");
});
