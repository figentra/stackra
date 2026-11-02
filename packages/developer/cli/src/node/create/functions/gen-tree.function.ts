/**
 * Stackra file contract:
 * Purpose: `genTree(paths, verbose?)`, what `stackra gen` wrote, as the lines `stackra create` prints: one branch per
 *          member, one line per generated kind (the manifest, OpenAPI, `.stackra/gen`, the Encore app, each entry,
 *          the tool configs) with a file count and what it is; `verbose` lists every file under its line.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0515 (decision 9); STA-1952 spec FR-010; plan D5.
 */
import { sorted } from "#node/functions/sorted.function";

/** A generated kind: where its files sit under the member and how its line reads. */
const KINDS: readonly {
  readonly match: RegExp;
  readonly label: (path: string) => string;
  readonly note: string;
}[] = [
  {
    match: /^stackra\.manifest\.json$/,
    label: () => "stackra.manifest.json",
    note: "the contract",
  },
  { match: /^openapi\.json$/, label: () => "openapi.json", note: "the HTTP contract" },
  {
    match: /^src\/node\/entities\.gen\.ts$/,
    label: () => "src/node/entities.gen.ts",
    note: "the entity list",
  },
  { match: /^\.stackra\/gen\//, label: () => ".stackra/gen/", note: "" },
  { match: /^\.stackra\/encore\//, label: () => ".stackra/encore/", note: "the Encore app" },
  { match: /^\.stackra\/entry\//, label: (path) => path, note: "an entry" },
  { match: /^\.stackra\//, label: () => ".stackra/ (tool configs)", note: "configs, tests, graph" },
  // Tool configs gen writes at the member root (vitest.config.ts, tsdown.config.ts, tsconfig.build.json).
  { match: /^[^/]+$/, label: () => "member root", note: "" },
];

/** The labels whose note names their files instead: the parts of `.stackra/gen/`, the member-root configs. */
const NAMED: Readonly<Record<string, (file: string) => string>> = {
  ".stackra/gen/": (file) => file.slice(".stackra/gen/".length).split(/[/.]/)[0] ?? file,
  "member root": (file) => file,
};

/** The member root of a path that holds `.stackra/` or a member-root contract, or undefined. */
function memberOf(path: string): string | undefined {
  const at = path.indexOf(".stackra/");
  if (at >= 0) return path.slice(0, at).replace(/\/$/, "");
  return /^(.*?)\/?(stackra\.manifest\.json|openapi\.json|src\/node\/entities\.gen\.ts)$/.exec(
    path,
  )?.[1];
}

/**
 * The tree of generated files.
 *
 * @param paths - the paths gen reported, relative to the workspace root.
 * @param verbose - list every file.
 * @example
 * genTree(["services/example/stackra.manifest.json", "services/example/.stackra/gen/wiring.ts"]);
 */
export function genTree(paths: readonly string[], verbose = false): string[] {
  // Every member root a path names, longest first, so a member-root config finds its member.
  const roots = sorted(
    new Set(paths.map(memberOf).filter((root): root is string => root !== undefined)),
    (left, right) => right.length - left.length,
  );
  const members = new Map<string, Map<string, { note: string; files: string[] }>>();
  for (const path of paths) {
    const root = roots.find((candidate) => candidate === "" || path.startsWith(`${candidate}/`));
    const member = root === undefined || root === "" ? "." : root;
    const rest = root === undefined || root === "" ? path : path.slice(root.length + 1);
    const kind = KINDS.find((candidate) => candidate.match.test(rest));
    const label = kind?.label(rest) ?? rest;
    const lines = members.get(member) ?? new Map<string, { note: string; files: string[] }>();
    const line = lines.get(label) ?? { note: kind?.note ?? "", files: [] };
    line.files.push(rest);
    lines.set(label, line);
    members.set(member, lines);
  }
  const out: string[] = [];
  const memberNames = sorted([...members.keys()]);
  const width = Math.max(
    ...[...members.values()].flatMap((lines) => [...lines.keys()].map((label) => label.length)),
  );
  for (const [m, member] of memberNames.entries()) {
    const lastMember = m === memberNames.length - 1;
    out.push(`${lastMember ? "└─" : "├─"} ${member}`);
    const lines = [...(members.get(member) ?? new Map()).entries()];
    for (const [l, [label, { note, files }]] of lines.entries()) {
      const stem = lastMember ? "   " : "│  ";
      const lastLine = l === lines.length - 1;
      const name = NAMED[label];
      const parts = name === undefined ? note : [...new Set(files.map(name))].join(", ");
      const count = files.length > 1 ? ` (${files.length} files)` : "";
      out.push(
        `${stem}${lastLine ? "└─" : "├─"} ${label.padEnd(width)}  ${parts}${count}`.trimEnd(),
      );
      if (verbose && files.length > 1)
        for (const file of sorted(files)) out.push(`${stem}${lastLine ? "   " : "│  "}   ${file}`);
    }
  }
  return out;
}
