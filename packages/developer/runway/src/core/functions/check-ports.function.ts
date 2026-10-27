/**
 * Stackra file contract:
 * Purpose: `checkPorts(root, members)`, the duplicate effective dev port check: every dev port of the root's dev infra
 *          (gateway, Encore dashboard, Postgres, otel UI, …) and of each member's dev environment (service, docs, web
 *          and Metro ports, the dev console and Electron ports) is shifted by `lane × portStep` for every lane the
 *          repository index table yields (`lanes.repos`, `lanes.worktrees` per repository), and two owners on one
 *          effective port fail, both named.
 * Boundary: pure; returns every failure instead of throwing, for `stackra validate` to print. The members are the
 *           caller's parsed member runways; runway does not read the workspace. The table is the root runway's
 *           `environments.dev.lanes` (one place, STA-863): with no table, lanes off or no `portStep`, only lane 0 is
 *           checked. An infra block with `perLane: false` is one shared port for every lane.
 * Runtime: isomorphic
 * Governing contract: STA-863; redundancy challenge item 5 (lane = repository index × worktrees + worktree, not
 *                     collision-free); ADR 0296 (decision 1: a dev port is written once, in the member runway).
 */
import type { AppRunway } from "#core/types/app-runway.type";
import type { PortIssue } from "#core/types/port-issue.type";
import type { RootRunway } from "#core/types/root-runway.type";
import type { ServiceRunway } from "#core/types/service-runway.type";

/** The dev port fields a member runway's dev environment may hold. */
type MemberDevPorts = {
  port?: number;
  devConsolePort?: number;
  desktop?: { remoteDebugPort?: number; pkceLoopbackPort?: number };
  mobile?: { metroPort?: number };
};

/** An infra field that holds a port: `port`, `grpcPort`, `uiPort`, …, and the Encore `dashboard`. */
const INFRA_PORT_FIELD = /port$/i;

/** The highest TCP port. */
const MAX_PORT = 65_535;

/** Worktrees per repository when the table does not say (the template's `repo × 10 + worktree`). */
const DEFAULT_WORKTREES = 10;

/**
 * Every dev port failure across the lanes of the repository index table; `[]` when every effective port has one owner.
 *
 * @param root - the parsed root runway.
 * @param members - each member key to its parsed member runway.
 * @example
 * checkPorts(root, { console: consoleRunway, commerce: commerceRunway });
 * // [{ code: "duplicate_port", port: 4000, owners: ["os worktree 0 (lane 0) infra.gateway.port",
 * //   "commerce worktree 0 (lane 10) infra.otel-lgtm.uiPort"], message: "…" }]
 */
export function checkPorts(
  root: RootRunway,
  members: Readonly<Record<string, AppRunway | ServiceRunway>>,
): PortIssue[] {
  const dev = root.environments.dev;
  const lanes = dev?.lanes;
  const step = lanes?.enabled === false ? 0 : (lanes?.portStep ?? 0);
  const worktrees = lanes?.worktrees ?? DEFAULT_WORKTREES;
  const table = step === 0 ? [] : Object.entries(lanes?.repos ?? {});
  const laneList =
    table.length === 0
      ? [{ lane: 0, label: "lane 0" }]
      : table.flatMap(([repo, index]) =>
          Array.from({ length: worktrees }, (_, worktree) => {
            const lane = index * worktrees + worktree;
            return { lane, label: `${repo} worktree ${worktree} (lane ${lane})` };
          }),
        );

  const shifted: [string, number][] = [];
  const shared: [string, number][] = [];
  for (const [name, block] of Object.entries(dev?.infra ?? {})) {
    const into = block["perLane"] === false ? shared : shifted;
    for (const [field, value] of Object.entries(block)) {
      if (typeof value === "number" && (INFRA_PORT_FIELD.test(field) || field === "dashboard")) {
        into.push([`infra.${name}.${field}`, value]);
      }
    }
  }
  for (const [member, runway] of Object.entries(members)) {
    const env: MemberDevPorts | undefined = runway.environments.dev;
    const ports: [string, number | undefined][] = [
      ["port", env?.port],
      ["devConsolePort", env?.devConsolePort],
      ["desktop.remoteDebugPort", env?.desktop?.remoteDebugPort],
      ["desktop.pkceLoopbackPort", env?.desktop?.pkceLoopbackPort],
      ["mobile.metroPort", env?.mobile?.metroPort],
    ];
    for (const [field, port] of ports)
      if (port !== undefined) shifted.push([`${member}.${field}`, port]);
  }

  const owners = new Map<number, string>();
  const issues: PortIssue[] = [];
  const claim = (port: number, owner: string): void => {
    if (port > MAX_PORT) {
      issues.push({
        code: "port_out_of_range",
        port,
        owners: [owner],
        message: `${owner} lands on ${port}, above ${MAX_PORT}: lower the port, the portStep or the repository index`,
      });
      return;
    }
    const first = owners.get(port);
    if (first === undefined) {
      owners.set(port, owner);
      return;
    }
    issues.push({
      code: "duplicate_port",
      port,
      owners: [first, owner],
      message: `${first} and ${owner} both use port ${port}`,
    });
  };
  for (const [source, port] of shared) claim(port, `${source} (shared by every lane)`);
  for (const { lane, label } of laneList) {
    for (const [source, port] of shifted) claim(port + lane * step, `${label} ${source}`);
  }
  return issues;
}
