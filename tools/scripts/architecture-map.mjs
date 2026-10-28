#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the architecture map generator (STA-1373 part 2): reads every workspace member's package.json `stackra`
 *          field and turbo.jsonc tags (tier, category, runtimes) and the service client call edges of the repo's
 *          `stackra.graph.json` (gen's system graph, ADR 0452), and writes the archify architecture candidate
 *          `apps/docs/scripts/architecture-map/architecture-map.yaml`, deterministically. Run with no flag it writes the candidate and
 *          renders it with the vendored archify skill into `apps/docs/src/assets/architecture-map.html`; `--check` (and
 *          `architectureMapFindings`, run by `pnpm validate`) fails when the committed candidate differs from what
 *          this script would write now. archify only draws: every rule stays in validate, oxlint, turbo boundaries
 *          and gen.
 * Boundary: reads the workspace, writes only `architecture-map.yaml`, a JSON copy and archify's delivery receipt under
 *           node_modules/.cache, and (through archify) the HTML asset. One box per
 *           app, service and worker member; one box per category for library and config tiers; one region per tier.
 * Runtime: node
 * Governing contract: ADR 0003 (tiers); ADR 0452 (system graph); STA-1373.
 * Owner: release-operations · Secrets: forbidden
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";

import { parse, stringify } from "yaml";

import { stripJsonc } from "./jsonc.mjs";
import { readWorkspaceMembers } from "./package-cycles.mjs";

// oxlint-disable stackra/one-declaration-per-file -- reason: a plain-node script module run by pnpm validate, not member source (like spec-parse.mjs); its tests import these names

/** The committed candidate, repository-relative: YAML, the repo's config format; archify gets a JSON copy. */
export const MAP_SOURCE = "apps/docs/scripts/architecture-map/architecture-map.yaml";

/** The header of the committed candidate. */
const MAP_HEADER = `# Stackra file contract:
# Purpose: the archify architecture candidate of the Stackra architecture map (STA-1373), GENERATED.
# Boundary: never edit it; run \`node tools/scripts/architecture-map.mjs\` and commit it with
#           apps/docs/src/assets/architecture-map.html. pnpm validate fails when it drifts.
# Runtime: none
# Governing contract: ADR 0452; STA-1373.
`;

/** The rendered map, repository-relative; the docs page embeds it as /assets/architecture-map.html. */
export const MAP_OUTPUT = "apps/docs/src/assets/architecture-map.html";

/** The vendored archify CLI, repository-relative. */
const ARCHIFY = ".agents/skills/archify/bin/archify.mjs";

/** The command that regenerates the map, for findings and docs. */
export const MAP_COMMAND = "node tools/scripts/architecture-map.mjs";

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
  "Package cycles: pnpm validate (tools/scripts/package-cycles.mjs)",
  "Tier direction: turbo boundaries and the tier tags pnpm validate checks",
  "File cycles: oxlint import/no-cycle",
  "Deep imports, service-to-service and app-to-service imports: oxlint boundaries.jsonc",
  "Kind grammar: stackra gen refusals",
  "Map drift: pnpm validate (this map against its generator)",
];

const byText = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
const idOf = (text) => text.replace(/[^a-zA-Z0-9_-]+/g, "-");
const shortName = (name) => name.replace(/^@[^/]+\//, "");

/** The turbo.jsonc tags of a member folder, or none. */
function tagsOf(root, dir) {
  const path = join(root, dir, "turbo.jsonc");
  if (!existsSync(path)) return [];
  return JSON.parse(stripJsonc(readFileSync(path, "utf8"))).tags ?? [];
}

/** The value of a `<key>:` tag, every one of them. */
const tagValues = (tags, key) =>
  tags.filter((tag) => tag.startsWith(`${key}:`)).map((tag) => tag.slice(key.length + 1));

/**
 * What the map is drawn from: each member's place (the `stackra` field first, the turbo.jsonc tags where it is
 * silent; runtimes are the union of both) and the client call edges between member packages.
 *
 * @example
 * readArchitectureInputs(root); // { members: [{ dir, name, tier, category, runtimes }], calls: [{ from, to }] }
 */
export function readArchitectureInputs(root) {
  const members = readWorkspaceMembers(root).map(({ dir, name, manifest }) => {
    const tags = tagsOf(root, dir);
    const stackra = manifest.stackra ?? {};
    return {
      dir,
      name,
      tier: stackra.tier ?? tagValues(tags, "tier")[0] ?? "untiered",
      category: stackra.category ?? tagValues(tags, "category")[0],
      runtimes: [...new Set([...(stackra.runtimes ?? []), ...tagValues(tags, "runtime")])].sort(
        byText,
      ),
    };
  });
  const graphPath = join(root, "stackra.graph.json");
  const calls = [];
  if (existsSync(graphPath)) {
    const graph = JSON.parse(readFileSync(graphPath, "utf8"));
    const packageOf = new Map((graph.nodes ?? []).map((node) => [node.id, node.package]));
    for (const edge of graph.edges ?? [])
      if (edge.kind === "call")
        calls.push({ from: packageOf.get(edge.from), to: packageOf.get(edge.to) });
  }
  return { members, calls };
}

/**
 * The archify architecture candidate for `inputs`; the same inputs in any order give the same object.
 *
 * @example
 * renderArchitectureMap({ members, calls }); // { schema_version: 1, diagram_type: "architecture", ... }
 */
export function renderArchitectureMap({ members, calls }) {
  const known = TIERS.map((entry) => entry.tier);
  const extra = [...new Set(members.map((member) => member.tier))]
    .filter((tier) => !known.includes(tier))
    .sort(byText);
  const tiers = [
    ...TIERS,
    ...extra.map((tier) => ({ tier, label: `tier:${tier}`, perMember: true })),
  ];
  const components = [];
  const boundaries = [];
  const cards = [];
  const boxOf = new Map();
  const dots = ["cyan", "emerald", "violet", "amber", "rose", "orange"];
  let row = 0;
  for (const [index, { tier, label, perMember }] of tiers.entries()) {
    const inTier = members
      .filter((member) => member.tier === tier)
      .sort((a, b) => byText(a.dir, b.dir));
    if (!inTier.length) continue;
    const groups = new Map();
    for (const member of inTier) {
      const key = perMember ? member.dir : (member.category ?? "uncategorised");
      groups.set(key, [...(groups.get(key) ?? []), member]);
    }
    const keys = [...groups.keys()].sort(byText);
    const ids = [];
    for (const [position, key] of keys.entries()) {
      const group = groups.get(key);
      const worker = perMember && group[0].dir.startsWith("workers/");
      const id = idOf(perMember ? group[0].dir : `${tier}-${key}`);
      const runtimes = [...new Set(group.flatMap((member) => member.runtimes))].sort(byText);
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
        label: perMember ? shortName(group[0].name) : key,
        sublabel: runtimes.join(", ") || "no runtime",
        tag: perMember ? group[0].name : `${group.length} package${group.length === 1 ? "" : "s"}`,
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
      dot: dots[index % dots.length],
      title: label,
      items: perMember
        ? keys.map((key) => groups.get(key)[0].name)
        : keys.map(
            (key) =>
              `${key}: ${groups
                .get(key)
                .map((member) => shortName(member.name))
                .join(", ")}`,
          ),
    });
  }
  const connections = new Map();
  for (const { from, to } of calls) {
    const source = boxOf.get(from);
    const target = boxOf.get(to);
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
    connections: [...connections.keys()].sort(byText).map((id) => ({ id, ...connections.get(id) })),
    cards,
  };
}

/**
 * The validate findings (`{ dir, text }`): one when the committed candidate is missing, is the placeholder, or
 * differs from what the generator writes now. Compares the parsed YAML, so oxfmt's layout of the file never counts.
 */
export function architectureMapFindings(root) {
  const path = join(root, MAP_SOURCE);
  const expected = renderArchitectureMap(readArchitectureInputs(root));
  let committed;
  try {
    committed = parse(readFileSync(path, "utf8"));
  } catch {
    committed = undefined;
  }
  if (isDeepStrictEqual(committed, expected)) return [];
  return [
    {
      dir: "apps/docs",
      text: `${MAP_SOURCE} is out of date (or the placeholder): run \`${MAP_COMMAND}\` and commit the map and ${MAP_OUTPUT}`,
    },
  ];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL("../../", import.meta.url));
  if (process.argv.includes("--check")) {
    const findings = architectureMapFindings(root);
    for (const { dir, text } of findings) console.error(`${dir}: ${text}`);
    process.exit(findings.length ? 1 : 0);
  }
  const map = renderArchitectureMap(readArchitectureInputs(root));
  writeFileSync(join(root, MAP_SOURCE), `${MAP_HEADER}${stringify(map, { lineWidth: 0 })}`);
  const outDir = join(root, "node_modules", ".cache", "archify-architecture-map");
  mkdirSync(outDir, { recursive: true });
  const candidate = join(outDir, "architecture-map.json");
  writeFileSync(candidate, `${JSON.stringify(map, null, 2)}\n`);
  const run = spawnSync(
    process.execPath,
    [
      ARCHIFY,
      "finalize",
      "architecture",
      candidate,
      MAP_OUTPUT,
      "--quality",
      "standard",
      "--out-dir",
      outDir,
      "--json",
    ],
    { cwd: root, stdio: "inherit" },
  );
  // archify writes its delivery receipt (absolute paths, a random id) beside the HTML; keep it out of the served assets.
  const receipt = join(root, MAP_OUTPUT.replace(/\.html$/, ".delivery.json"));
  if (existsSync(receipt)) renameSync(receipt, join(outDir, "architecture-map.delivery.json"));
  process.exit(run.status ?? 1);
}
