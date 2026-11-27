/**
 * Stackra file contract:
 * Purpose: `starterFiles(files, options)`, the files of a new app from a starter's files: the chosen profile's
 *          included paths with its overlays, the rename list applied to every text file, catalog `stackra` pinned to
 *          the CLI's exact version (and packed tarballs as pnpm overrides), the Stackra registry line in `.npmrc`
 *          (with `options.registry`, every scope line the starter maps to the default host moves to that registry).
 *          `stackra.starter.yaml`, `starter/` and `pnpm-lock.yaml` are never written: the install resolves fresh.
 *          Nor is `.infisical.yaml`: it binds the template's own Infisical project, never the app's (STA-2027).
 * Boundary: pure; returns the files and writes nothing. Refuses a manifest that does not match `StarterManifest`, an
 *           unknown profile, and an overlay whose source is missing.
 * Runtime: node
 * Governing contract: ADR 0515 (decisions 3 to 5); ADR 0453 (decision 10); STA-1952 spec FR-006 and FR-007.
 */
import { matchesGlob } from "node:path";

import { isMap, parse, parseDocument } from "yaml";

import { REGISTRY_ORIGIN_DEFAULT } from "#node/constants/registry-origin-default.constant";
import { STACKRA_REGISTRY_NPMRC } from "#node/constants/stackra-registry-npmrc.constant";
import type { StarterManifest } from "#node/create/types/starter-manifest.type";
import type { StarterOptions } from "#node/create/types/starter-options.type";

/** The starter manifest's path. */
const MANIFEST = "stackra.starter.yaml";

/** The path with each segment's leading dot dropped: `path.matchesGlob` never matches dotfiles with `*` or `**`. */
const undot = (path: string): string => path.replaceAll(/(^|\/)\./g, "$1");

/** A file of the starter, or of its own tooling or vault binding, that an app never gets. */
const NEVER = (path: string) =>
  path === MANIFEST ||
  path === "pnpm-lock.yaml" ||
  path === ".infisical.yaml" ||
  path.startsWith("starter/");

const decoder = new TextDecoder("utf-8", { fatal: true });
const encoder = new TextEncoder();

/** The bytes as text, or undefined for a binary file. */
function text(bytes: Uint8Array): string | undefined {
  if (bytes.includes(0)) return undefined;
  try {
    return decoder.decode(bytes);
  } catch {
    return undefined;
  }
}

/** Whether the value is a list of strings. */
const strings = (list: unknown): boolean =>
  Array.isArray(list) && list.every((item) => typeof item === "string");

/** The manifest, checked. */
function readManifest(files: ReadonlyMap<string, Uint8Array>): StarterManifest {
  const bytes = files.get(MANIFEST);
  if (bytes === undefined) throw new Error(`the starter has no ${MANIFEST}`);
  const value = parse(text(bytes) ?? "") as Partial<StarterManifest> | null;
  if (
    value?.version !== 1 ||
    !Array.isArray(value.rename) ||
    !value.rename.every((row) => typeof row?.from === "string" && typeof row.to === "string") ||
    typeof value.profiles !== "object" ||
    value.profiles === null ||
    !Object.values(value.profiles).every(
      (profile) =>
        strings(profile?.include) &&
        (profile.overlay === undefined ||
          Object.values(profile.overlay).every((source) => typeof source === "string")),
    )
  )
    throw new Error(
      `${MANIFEST} is not a version 1 starter manifest (rename, profiles.<name>.include)`,
    );
  return value as StarterManifest;
}

/** `pnpm-workspace.yaml` with catalog `stackra` pinned and the tarball overrides, comments kept. */
function pinWorkspace(source: string, options: StarterOptions): string {
  const document = parseDocument(source);
  const catalog = document.getIn(["catalogs", "stackra"]);
  if (isMap(catalog))
    for (const pair of catalog.items) pair.value = document.createNode(options.stackraVersion);
  for (const [name, spec] of Object.entries(options.tarballs ?? {}))
    document.setIn(["overrides", name], spec);
  return document.toString();
}

/** The default registry origin as a pattern, with or without its final `/`. */
const DEFAULT_ORIGIN = `${REGISTRY_ORIGIN_DEFAULT.replace(/\/$/, "").replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&")}/?`;

/** A scope line of `.npmrc` that maps a scope to the default Stackra registry. */
const DEFAULT_SCOPE_LINE = new RegExp(
  `^([ \\t]*@[^:\\s]+:registry[ \\t]*=[ \\t]*)${DEFAULT_ORIGIN}[ \\t]*$`,
  "gm",
);

/** `.npmrc` with every scope the starter maps to the default Stackra registry mapped to `registry` instead. */
const moveRegistry = (npmrc: string, registry: string): string =>
  npmrc.replace(DEFAULT_SCOPE_LINE, (_, head: string) => `${head}${registry}`);

/**
 * The files of the app.
 *
 * @param files - the starter's files by POSIX path.
 * @param options - the profile, the names and the `@stackra/*` version.
 * @throws Error when the manifest is malformed, the profile unknown or an overlay source missing.
 * @example
 * starterFiles(readStarter("./template"), { profile: "minimal", name: "acme", scope: "@acme", stackraVersion: "0.5.1" });
 */
export function starterFiles(
  files: ReadonlyMap<string, Uint8Array>,
  options: StarterOptions,
): Map<string, Uint8Array> {
  const manifest = readManifest(files);
  const profile = manifest.profiles[options.profile];
  if (profile === undefined)
    throw new Error(
      `the starter has no profile ${options.profile}; it has ${Object.keys(manifest.profiles).join(", ")}`,
    );
  const key = options.name.replaceAll(/[^a-z0-9]/g, "");
  const values: Record<string, string> = { name: options.name, scope: options.scope, key };
  const renames = manifest.rename.map(({ from, to }) => ({
    from,
    to: to.replaceAll(/\{(name|scope|key)\}/g, (_, token: string) => values[token] ?? ""),
  }));

  const picked = new Map<string, Uint8Array>();
  for (const [path, bytes] of files)
    if (!NEVER(path) && profile.include.some((glob) => matchesGlob(undot(path), undot(glob))))
      picked.set(path, bytes);
  for (const [target, source] of Object.entries(profile.overlay ?? {})) {
    const bytes = files.get(source);
    if (bytes === undefined) throw new Error(`overlay ${target}: the starter has no ${source}`);
    picked.set(target, bytes);
  }

  const out = new Map<string, Uint8Array>();
  for (const [path, bytes] of picked) {
    let body = text(bytes);
    if (body === undefined) {
      out.set(path, bytes);
      continue;
    }
    for (const { from, to } of renames) body = body.replaceAll(from, to);
    if (path === "pnpm-workspace.yaml") body = pinWorkspace(body, options);
    out.set(path, encoder.encode(body));
  }
  const own = out.has(".npmrc") ? (text(out.get(".npmrc") ?? new Uint8Array()) ?? "") : "";
  const npmrc = options.registry === undefined ? own : moveRegistry(own, options.registry);
  const line =
    options.registry === undefined
      ? STACKRA_REGISTRY_NPMRC
      : `@stackra:registry=${options.registry}\n`;
  const mapped = npmrc.includes("@stackra:registry=")
    ? npmrc
    : `${npmrc}${npmrc === "" || npmrc.endsWith("\n") ? "" : "\n"}${line}`;
  if (mapped !== own) out.set(".npmrc", encoder.encode(mapped));
  return out;
}
