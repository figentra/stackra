/**
 * Stackra file contract:
 * Purpose: `syncDevEncoreApp(request)`, the local monolith app of a product's service members: the one Encore app
 *          root `stackra dev` runs (`encore run` once, ADR 0296 decision 3), built under `.stackra/dev/encore` the way
 *          the deploy tree is (`encoreDeployTree`): every member synced at its repository path
 *          (`syncDevEncoreMember`), a member no longer in the product removed, and at the app root `encore.app` (the
 *          members' one app id), a package.json naming the members' `encore.dev`, a tsconfig.json and a
 *          `node_modules` link.
 * Boundary: writes only under `.stackra/dev/encore` (gitignored with `.stackra/`); reads the members. Refuses two app
 *           ids and a `#` import that resolves through no map, as the deploy tree does. Starts nothing and watches
 *           nothing: the caller runs `encore run` in `root` and re-syncs a member on change.
 * Runtime: node
 * Governing contract: ADR 0296 (decisions 2 and 3: a monolith is one process allocation of the one app); ADR 0091
 *                     (decision 2 and its 2026-11-09 open point: several service members in one app); ADR 0289
 *                     (decision 5); STA-2155 (the deploy tree this mirrors); STA-2840.
 */
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join, relative } from "node:path";

import { DEV_ENCORE_APP_PATH } from "#core/constants/dev-encore-app-path.constant";
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { linkFolder } from "#node/functions/link-folder.function";
import { syncDevEncoreMember } from "#node/functions/sync-dev-encore-member.function";
import { writeIfChanged } from "#node/functions/write-if-changed.function";
import type { DevEncoreApp } from "#node/types/dev-encore-app.type";
import type { DevEncoreAppRequest } from "#node/types/dev-encore-app-request.type";

/** The generated Encore app file of a service member, at the member root (ADR 0091, as amended 2026-11-09). */
const GENERATED_APP = "encore.app";

/** The app root's tsconfig: the members' own tsconfig files configure their code; this one only has to parse. */
const ROOT_TSCONFIG = {
  compilerOptions: {
    target: "ES2022",
    module: "ESNext",
    moduleResolution: "Bundler",
    experimentalDecorators: true,
    useDefineForClassFields: false,
    skipLibCheck: true,
  },
};

/** The Encore app id of the members' generated `encore.app` files; "" (a local-only app) when none has one. */
function appId(members: readonly string[]): string {
  const ids = new Set(
    members
      .filter((member) => existsSync(join(member, GENERATED_APP)))
      .map((member) => {
        const id = (
          JSON.parse(readFileSync(join(member, GENERATED_APP), "utf8")) as { id?: unknown }
        ).id;
        return typeof id === "string" ? id : "";
      }),
  );
  if (ids.size > 1)
    throw new RunwayInvalidError("runway.yaml", [
      {
        path: "providers.encore.app",
        message: `The service members' generated apps name different Encore app ids (${[...ids].join(", ")}): run stackra gen`,
      },
    ]);
  return [...ids][0] ?? "";
}

/** The `encore.dev` version the first member that names one depends on. */
function encoreVersion(members: readonly string[]): string | undefined {
  for (const member of members) {
    const manifest = JSON.parse(readFileSync(join(member, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
    };
    const version = manifest.dependencies?.["encore.dev"];
    if (version !== undefined) return version;
  }
  return undefined;
}

/**
 * Builds or refreshes the local monolith app of every service member.
 *
 * @param request - the repository root and the absolute roots of its service members.
 * @returns the app root `encore run` runs in, the members it holds and how many files it wrote and removed.
 * @throws RunwayInvalidError when the members' generated apps name different Encore app ids.
 * @throws RunwayUnresolvedError when a member's `#` import resolves through no `imports` entry.
 * @example
 * const { root } = syncDevEncoreApp({ repository, members: [billing, usage] });
 * spawn("encore", ["run", "--port=4000", "--browser=never"], { cwd: root });
 */
export function syncDevEncoreApp(request: DevEncoreAppRequest): DevEncoreApp {
  const members = [...request.members].toSorted();
  if (members.length === 0)
    throw new RunwayUnresolvedError("the local Encore app needs at least one service member");
  const root = join(request.repository, DEV_ENCORE_APP_PATH);
  const id = appId(members);
  let written = 0;
  let removed = 0;
  for (const member of members) {
    const synced = syncDevEncoreMember(request, member);
    written += synced.written;
    removed += synced.removed;
  }
  // A member no longer in the product leaves the app.
  const held = new Set(members.map((member) => relative(request.repository, member)));
  for (const group of existsSync(root) ? readdirSync(root, { withFileTypes: true }) : [])
    if (group.isDirectory() && !group.name.startsWith(".") && group.name !== "node_modules")
      for (const entry of readdirSync(join(root, group.name), { withFileTypes: true }))
        if (entry.isDirectory() && !held.has(`${group.name}/${entry.name}`)) {
          rmSync(join(root, group.name, entry.name), { recursive: true, force: true });
          removed += 1;
        }

  const version = encoreVersion(members);
  const files: Record<string, string> = {
    [GENERATED_APP]: `${JSON.stringify({ id, lang: "typescript" }, null, 2)}\n`,
    "package.json": `${JSON.stringify(
      {
        name: "stackra-dev-encore",
        private: true,
        type: "module",
        ...(version === undefined ? {} : { dependencies: { "encore.dev": version } }),
      },
      null,
      2,
    )}\n`,
    "tsconfig.json": `${JSON.stringify(ROOT_TSCONFIG, null, 2)}\n`,
  };
  for (const [name, content] of Object.entries(files))
    if (writeIfChanged(join(root, name), content)) written += 1;
  // `encore.dev` resolves from the app root through the first member's dependencies.
  linkFolder(join(root, "node_modules"), join(members[0] as string, "node_modules"));
  return {
    root,
    members: members.map((member) => relative(request.repository, member)),
    written,
    removed,
  };
}
