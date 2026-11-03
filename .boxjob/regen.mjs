// Untracked, never committed: regenerates every checked member's imports map with importsMap (STA-2072 T006).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const cli = join(root, "packages/developer/cli/src/node/");
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("#node/"))
      return next(pathToFileURL(`${cli}${specifier.slice(6)}.ts`).href, context);
    return next(specifier, context);
  },
});
const load = async (file) => import(pathToFileURL(`${cli}functions/${file}.ts`).href);
const { importsMap } = await load("imports-map.function");
const { readManifestMembers } = await load("read-workspace-members.function");
const { importsMapFindings } = await load("imports-map-findings.function");

const mode = process.argv[2];
if (mode === "write") {
  let changed = 0;
  const problems = [];
  for (const { dir, manifest } of readManifestMembers(root)) {
    if (manifest.stackra?.tier === "config") continue;
    const file = join(root, dir, "package.json");
    const pkg = JSON.parse(readFileSync(file, "utf8"));
    const before = pkg.imports ?? {};
    const after = importsMap(join(root, dir));
    for (const [key, value] of Object.entries(before)) {
      const first = (v) => (Array.isArray(v) ? v[0] : v);
      if (!(key in after)) problems.push(`${dir}: removes ${key}`);
      else if (first(value) !== first(after[key])) problems.push(`${dir}: first target of ${key}`);
    }
    if (JSON.stringify(before) === JSON.stringify(after)) continue;
    mkdirSync(join(root, ".boxjob/orig", dir), { recursive: true });
    writeFileSync(join(root, ".boxjob/orig", dir, "package.json"), readFileSync(file));
    console.log(`CHANGED ${dir}/package.json`);
    pkg.imports = after;
    writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
    changed++;
  }
  console.log(`REGEN changed=${changed} problems=${problems.length}`);
  for (const p of problems) console.log(`PROBLEM ${p}`);
} else {
  const findings = importsMapFindings(root);
  console.log(`FINDINGS ${findings.length}`);
  for (const f of findings) console.log(`FINDING ${f.dir}: ${f.text}`);
}
