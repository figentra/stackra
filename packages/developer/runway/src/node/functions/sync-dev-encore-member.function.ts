/**
 * Stackra file contract:
 * Purpose: `syncDevEncoreMember(request, member)`, one service member's part of the local monolith app
 *          (`syncDevEncoreApp`): its sources (`src`, `.stackra`, `stackra-encore` with its migrations, `assets`) at its
 *          repository path under `.stackra/dev/encore`, every `#` import rewritten to a relative path through the
 *          member's own map, its `__tests__` folders left out, its package.json and tsconfig.json, and a `node_modules`
 *          link to the member's own. A file is written only when its content changed and a source gone from the member
 *          is removed, so `encore run` reloads only on a real edit; `stackra dev` calls it again after an edit.
 * Boundary: writes only under the app folder; reads the member. A TypeScript file with a `#` import that resolves
 *           through no `imports` entry is not written, and the member is refused naming it, as the deploy tree does.
 * Runtime: node
 * Governing contract: ADR 0296 (decision 3); ADR 0091 (decision 2); STA-2155 (the deploy tree this mirrors);
 *                     STA-2840.
 */
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join, relative } from "node:path";

import { DEV_ENCORE_APP_PATH } from "#core/constants/dev-encore-app-path.constant";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { linkFolder } from "#node/functions/link-folder.function";
import { memberImports } from "#node/functions/member-imports.function";
import { rewriteMemberAliases } from "#node/functions/rewrite-member-aliases.function";
import { writeIfChanged } from "#node/functions/write-if-changed.function";
import type { DevEncoreAppRequest } from "#node/types/dev-encore-app-request.type";

/**
 * The folders of a service member the app carries: its code, gen's outputs, the Encore services (with their
 * migrations) and the assets `#assets/*` names. Their TypeScript files may import through `#` aliases.
 */
const SOURCES = ["src", ".stackra", "stackra-encore", "assets"] as const;

/** The member files the app carries beside its sources. */
const MEMBER_FILES = ["package.json", "tsconfig.json"] as const;

/** Every file under `folder`, relative to it, leaving out `__tests__` and `node_modules` folders. */
function filesUnder(folder: string, prefix = ""): string[] {
  if (!existsSync(folder)) return [];
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const rel = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory())
      return entry.name === "__tests__" || entry.name === "node_modules"
        ? []
        : filesUnder(join(folder, entry.name), rel);
    return entry.isFile() ? [rel] : [];
  });
}

/**
 * Syncs one member into the app at `request.repository`'s `.stackra/dev/encore`.
 *
 * @param request - the repository and its service members.
 * @param member - the absolute root of the member to sync (one of `request.members`).
 * @returns how many files it wrote and removed.
 * @throws RunwayUnresolvedError when a `#` import resolves through no `imports` entry of the member.
 * @example
 * syncDevEncoreMember({ repository, members }, join(repository, "services/billing")); // { written: 1, removed: 0 }
 */
export function syncDevEncoreMember(
  request: DevEncoreAppRequest,
  member: string,
): { readonly written: number; readonly removed: number } {
  const into = join(request.repository, DEV_ENCORE_APP_PATH, relative(request.repository, member));
  const imports = memberImports(member);
  const unresolved: string[] = [];
  const kept = new Set<string>();
  let written = 0;
  for (const source of SOURCES)
    for (const rel of filesUnder(join(member, source))) {
      const from = join(member, source, rel);
      const path = `${source}/${rel}`;
      kept.add(path);
      let content: string | Buffer = readFileSync(from);
      if (/\.tsx?$/.test(rel)) {
        const next = rewriteMemberAliases(content.toString("utf8"), from, member, imports);
        if (next.unresolved.length > 0) {
          for (const spec of next.unresolved) unresolved.push(`${path}: ${spec}`);
          continue;
        }
        content = next.text;
      }
      if (writeIfChanged(join(into, path), content)) written += 1;
    }
  for (const file of MEMBER_FILES)
    if (
      existsSync(join(member, file)) &&
      writeIfChanged(join(into, file), readFileSync(join(member, file)))
    )
      written += 1;
  let removed = 0;
  for (const source of SOURCES)
    for (const rel of filesUnder(join(into, source))) {
      if (kept.has(`${source}/${rel}`)) continue;
      rmSync(join(into, source, rel), { force: true });
      removed += 1;
    }
  linkFolder(join(into, "node_modules"), join(member, "node_modules"));
  if (unresolved.length > 0)
    throw new RunwayUnresolvedError(
      `${relative(request.repository, member)}: ${unresolved.length} \`#\` import(s) resolve through no package.json imports entry: ${unresolved.slice(0, 5).join("; ")}`,
    );
  return { written, removed };
}
