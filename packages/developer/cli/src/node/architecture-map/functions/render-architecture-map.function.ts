/**
 * Stackra file contract:
 * Purpose: `renderArchitectureMap(inputs)`, the archify architecture candidate of the workspace, deterministically: one
 *          box per app, service and worker member, one box per category for the library and config tiers, one region
 *          per tier, and the client call edges (moved from `tools/scripts/architecture-map.mjs`). archify only draws:
 *          every rule stays in validate, oxlint, turbo boundaries and gen.
 * Boundary: pure; the same inputs in any order give the same object.
 * Runtime: node
 * Governing contract: ADR 0003 (tiers); ADR 0452 (system graph); STA-1373.
 */
import { MAP_COMMAND } from "#node/architecture-map/constants/map-command.constant";
import { MAP_OUTPUT } from "#node/architecture-map/constants/map-output.constant";
import type { ArchitectureInputs } from "#node/architecture-map/types/architecture-inputs.type";
import { sorted } from "#node/functions/sorted.function";

/** One member of the inputs. */
type Member = ArchitectureInputs["members"][number];

/** One box of the candidate. */
type Component = {
  readonly id: string;
  readonly type: string;
  readonly label: string;
  readonly sublabel: string;
  readonly tag: string;
  readonly row: number;
  readonly col: number;
  readonly size: readonly number[];
};

/** One call arrow of the candidate. */
type Connection = {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly label: string;
};

/** The archify architecture candidate. */
type ArchitectureMap = {
  readonly schema_version: number;
  readonly diagram_type: string;
  readonly meta: Readonly<Record<string, unknown>>;
  readonly layout: Readonly<Record<string, unknown>>;
  readonly components: readonly Component[];
  readonly boundaries: readonly {
    readonly kind: string;
    readonly label: string;
    readonly wraps: readonly string[];
  }[];
  readonly connections: readonly Connection[];
  readonly cards: readonly {
    readonly dot: string;
    readonly title: string;
    readonly items: readonly string[];
  }[];
};

/** The tiers in drawing order: region label, and whether each member gets its own box (else one per category). */
const TIERS = [
  { tier: "app", label: "tier:app (apps and workers)", perMember: true },
  { tier: "service", label: "tier:service", perMember: true },
  { tier: "lib", label: "tier:lib (one box per category)", perMember: false },
  { tier: "config", label: "tier:config (one box per category)", perMember: false },
];

/** Grid columns and cell width: 4 cells of 220px stay under archify's 1240px readable width; a 200px box keeps ~180px of
 *  sublabel, enough for the longest runtime list ("browser, isomorphic, node, react-native, worker" needs ~170px). */
const COLS = 4;
const CELL_W = 220;
/** The box size: its cell less a 20px gutter (archify's default box is 130px wide, ~112px of sublabel). */
const BOX_SIZE = [200, 64];

/** The checks that hold each rule; archify draws, these refuse. */
const ENFORCEMENT = [
  "Package cycles: pnpm validate (stackra cycles)",
  "Tier direction: turbo boundaries and the tier tags pnpm validate checks",
  "File cycles: oxlint import/no-cycle",
  "Deep imports, service-to-service and app-to-service imports: oxlint boundaries.jsonc",
  "Kind grammar: stackra gen refusals",
  "Map drift: pnpm validate (this map against its generator)",
];

const byText = (left: string, right: string): number => (left < right ? -1 : left > right ? 1 : 0);
const idOf = (text: string): string => text.replaceAll(/[^a-zA-Z0-9_-]+/g, "-");
const shortName = (name: string): string => name.replace(/^@[^/]+\//, "");

/**
 * The archify architecture candidate for `inputs`.
 *
 * @param inputs - the members and calls, as `readArchitectureInputs` reads them.
 * @example
 * renderArchitectureMap({ members, calls }); // { schema_version: 1, diagram_type: "architecture", ... }
 */
export function renderArchitectureMap({ members, calls }: ArchitectureInputs): ArchitectureMap {
  const known = new Set(TIERS.map((entry) => entry.tier));
  const extra = sorted(
    [...new Set(members.map((member) => member.tier))].filter((tier) => !known.has(tier)),
    byText,
  );
  const tiers = [
    ...TIERS,
    ...extra.map((tier) => ({ tier, label: `tier:${tier}`, perMember: true })),
  ];
  const components: Component[] = [];
  const boundaries: ArchitectureMap["boundaries"][number][] = [];
  const cards: ArchitectureMap["cards"][number][] = [];
  const boxOf = new Map<string, string>();
  const dots = ["cyan", "emerald", "violet", "amber", "rose", "orange"];
  let row = 0;
  for (const [index, { tier, label, perMember }] of tiers.entries()) {
    const inTier = sorted(
      members.filter((member) => member.tier === tier),
      (a, b) => byText(a.dir, b.dir),
    );
    if (inTier.length === 0) continue;
    const groups = new Map<string, Member[]>();
    for (const member of inTier) {
      const key = perMember ? member.dir : (member.category ?? "uncategorised");
      groups.set(key, [...(groups.get(key) ?? []), member]);
    }
    const keys = sorted(groups.keys(), byText);
    const groupOf = (key: string): Member[] => groups.get(key) ?? [];
    const ids: string[] = [];
    for (const [position, key] of keys.entries()) {
      const group = groupOf(key);
      const first = group[0] as Member;
      const worker = perMember && first.dir.startsWith("workers/");
      const id = idOf(perMember ? first.dir : `${tier}-${key}`);
      const runtimes = sorted(new Set(group.flatMap((member) => member.runtimes)), byText);
      components.push({
        id,
        type:
          tier === "service"
            ? "backend"
            : tier === "app"
              ? worker
                ? "cloud"
                : "frontend"
              : "database",
        label: perMember ? shortName(first.name) : key,
        sublabel: runtimes.join(", ") || "no runtime",
        tag: perMember ? first.name : `${group.length} package${group.length === 1 ? "" : "s"}`,
        row: row + Math.floor(position / COLS),
        col: position % COLS,
        size: BOX_SIZE,
      });
      ids.push(id);
      for (const member of group) boxOf.set(member.name, id);
    }
    row += Math.ceil(keys.length / COLS);
    boundaries.push({ kind: "region", label, wraps: ids });
    cards.push({
      dot: dots[index % dots.length] ?? "slate",
      title: label,
      items: perMember
        ? keys.map((key) => (groupOf(key)[0] as Member).name)
        : keys.map(
            (key) =>
              `${key}: ${groupOf(key)
                .map((member) => shortName(member.name))
                .join(", ")}`,
          ),
    });
  }
  const connections = new Map<string, Omit<Connection, "id">>();
  for (const { from, to } of calls) {
    const source = from === undefined ? undefined : boxOf.get(from);
    const target = to === undefined ? undefined : boxOf.get(to);
    // shortcut: a call to a package outside this workspace (another repo's service) is left out; draw it as an external box when the system graph spans repos.
    if (!source || !target || source === target) continue;
    connections.set(`call-${source}-${target}`, { from: source, to: target, label: "client call" });
  }
  cards.push({ dot: "slate", title: "What enforces the architecture", items: ENFORCEMENT });
  return {
    schema_version: 1,
    diagram_type: "architecture",
    meta: {
      title: "Stackra architecture map",
      subtitle: `Generated by ${MAP_COMMAND}; never edit it by hand. pnpm validate fails when it drifts.`,
      output: MAP_OUTPUT,
      locale: "en",
      quality_profile: "standard",
      legend: {
        mode: "all",
        entries: {
          frontend: { label: "App member" },
          cloud: { label: "Worker member" },
          backend: { label: "Service member" },
          database: { label: "Package category" },
        },
      },
    },
    layout: {
      mode: "grid",
      origin: [40, 80],
      cols: COLS,
      cellW: CELL_W,
      cellH: 64,
      gapX: 30,
      gapY: 80,
    },
    components,
    boundaries,
    connections: sorted(connections.keys(), byText).map((id) => ({
      id,
      ...(connections.get(id) as Omit<Connection, "id">),
    })),
    cards,
  };
}
