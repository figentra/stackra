/**
 * Stackra file contract:
 * Purpose: `checkDevPorts(root, members)`, the dev port check: every effective dev port (a member's port, dev console,
 *          Metro and Electron ports, each dev infra container's ports, the dev proxy) on every lane, and a failure for
 *          two owners that land on one port or a port a lane pushes past 65535. With `lanes.repoIndex` the lanes are
 *          those of every indexed repository (lane = index × worktrees + worktree), so a collision across repositories
 *          fails here instead of at `stackra dev`.
 * Boundary: pure; returns every failure instead of throwing, for `stackra validate` to print, and names each pair of
 *           owners once (with the first lanes they meet on). Each indexed repository is counted with this
 *           repository's ports, as the product template gives every repository the same layout; a repository whose
 *           own ports differ runs this check itself. Runway does not read the workspace: the caller passes the parsed
 *           member runways, keyed by member path.
 * Runtime: isomorphic
 * Governing contract: STA-863 (duplicate effective dev ports fail, naming both owners), ADR 0296 (decisions 1 and 2:
 *                     member ports, lanes).
 */
import type { AppRunway } from "#core/types/app-runway.type";
import type { DevPortIssue } from "#core/types/dev-port-issue.type";
import type { RootRunway } from "#core/types/root-runway.type";
import type { ServiceRunway } from "#core/types/service-runway.type";

/** The highest port. */
const MAX_PORT = 65_535;

/** The member dev fields that hold a port, as dotted paths under `environments.dev`. */
const MEMBER_PORT_FIELDS = [
  "port",
  "devConsolePort",
  "desktop.remoteDebugPort",
  "desktop.pkceLoopbackPort",
  "mobile.metroPort",
];

/** One port before its lane offset, with who owns it. */
type BasePort = { readonly owner: string; readonly port: number };

/** The value at dotted `path` inside `value`, or undefined. */
function valueAt(value: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (at, key) =>
        typeof at === "object" && at !== null ? (at as Record<string, unknown>)[key] : undefined,
      value,
    );
}

/** An infra field holds a port when it is `port`, `dashboard` or ends in `Port` (`uiPort`, `grpcPort`). */
function isPortField(key: string): boolean {
  return key === "port" || key === "dashboard" || key.endsWith("Port");
}

/** Every port the root and the members declare for dev, before lane offsets, in a stable order. */
function basePorts(
  root: RootRunway,
  members: Readonly<Record<string, AppRunway | ServiceRunway>>,
): BasePort[] {
  const ports: BasePort[] = [];
  const dev = root.environments.dev;
  for (const [name, container] of Object.entries(dev?.infra ?? {})) {
    for (const [key, port] of Object.entries(container)) {
      if (isPortField(key) && Number.isInteger(port))
        ports.push({ owner: `runway.yaml infra.${name}.${key}`, port: port as number });
    }
  }
  const proxyPort = valueAt(dev?.proxy, "port");
  if (Number.isInteger(proxyPort))
    ports.push({ owner: "runway.yaml proxy.port", port: proxyPort as number });
  for (const [member, runway] of Object.entries(members)) {
    const environment = runway.environments.dev;
    for (const field of MEMBER_PORT_FIELDS) {
      const port = valueAt(environment, field);
      if (Number.isInteger(port))
        ports.push({ owner: `${member} environments.dev.${field}`, port: port as number });
    }
  }
  return ports;
}

/** Every lane number, ascending: each indexed repository's worktrees, this repository's alone, or lane 0. */
function lanesOf(root: RootRunway): { lanes: number[]; step: number } {
  const lanes = root.environments.dev?.lanes;
  if (lanes?.enabled !== true || lanes.portStep === undefined) return { lanes: [0], step: 0 };
  const worktrees = lanes.worktrees ?? 1;
  const indexes = lanes.repoIndex === undefined ? [0] : Object.values(lanes.repoIndex);
  const all = indexes.flatMap((index) =>
    Array.from({ length: worktrees }, (_, worktree) => index * worktrees + worktree),
  );
  return { lanes: [...new Set(all)].sort((a, b) => a - b), step: lanes.portStep };
}

/**
 * Every dev port failure of `root` and `members`; `[]` when every effective port is distinct.
 *
 * @param root - the parsed root runway.
 * @param members - each parsed member runway, keyed by its member path (`apps/docs`, `services/commerce`).
 * @example
 * checkDevPorts(root, { "apps/docs": docs, "services/commerce": commerce });
 * // [{ code: "dev_port_duplicate", port: 4000, owners: ["runway.yaml infra.gateway.port on lane 0",
 * //   "runway.yaml infra.otel-lgtm.uiPort on lane 10"], message: "…" }]
 */
export function checkDevPorts(
  root: RootRunway,
  members: Readonly<Record<string, AppRunway | ServiceRunway>>,
): DevPortIssue[] {
  const { lanes, step } = lanesOf(root);
  const taken = new Map<number, string>();
  const reported = new Set<string>();
  const issues: DevPortIssue[] = [];
  for (const { owner, port } of basePorts(root, members)) {
    for (const lane of lanes) {
      const effective = port + lane * step;
      const here = `${owner} on lane ${lane}`;
      if (effective > MAX_PORT) {
        issues.push({
          code: "dev_port_out_of_range",
          port: effective,
          owners: [here],
          message: `${here} is dev port ${effective}, above ${MAX_PORT}: lower the port, portStep or worktrees`,
        });
        break;
      }
      const first = taken.get(effective);
      if (first === undefined) {
        taken.set(effective, here);
        continue;
      }
      const pair = [first.replace(/ on lane \d+$/, ""), owner].sort().join("\n");
      if (reported.has(pair)) continue;
      reported.add(pair);
      issues.push({
        code: "dev_port_duplicate",
        port: effective,
        owners: [first, here],
        message: `dev port ${effective} is taken twice: ${first} and ${here}`,
      });
    }
  }
  return issues;
}
