/**
 * Stackra file contract:
 * Purpose: `navigationOfMeta`, a docs member's navigation from the Fumadocs `meta.json` of each folder under
 *          `content/`, as the `DocsTab` list `emitDocsSite` renders. The rules:
 *          - A folder whose meta sets `root: true` is a tab, titled by its meta's `title` (else the folder name), with
 *            its meta's `icon`. Only a folder directly under `content/` may be one (`docs_meta_root_nested`).
 *          - The root-level entries that are not root folders form the first tab, titled by the root meta's `title`
 *            (else the site name), with its `icon`; it is left out when it lists nothing.
 *          - A folder lists its entries in its meta's `pages` order; without `pages`, `index` first, then every page
 *            and subfolder by path (`byIndexThenPath`, the emitter's `{ folder }` order). An entry is a page name (its
 *            file without the extension), a subfolder name, `---Label---` (a separator) or `...` (every page and
 *            subfolder of the folder that the same `pages` names nowhere else, in the default order).
 *          - In a tab, the entries before the first separator form a group titled by the folder meta's `title` (else
 *            the tab title); each separator starts a group named by its label. A subfolder is a nested group titled
 *            by its meta's `title` (else its name), with its `icon` and its own entries; a separator inside it starts
 *            a further nested group. A group or folder that lists nothing is left out.
 *          - The root folders the root meta's `pages` names are tabs in that order; the rest follow, by name.
 *          - `defaultOpen` is accepted and has no effect: every generated folder opens by default.
 *          Refused: a meta.json that is not an object, sets a field gen does not read or has a field of the wrong type
 *          (`docs_meta_invalid`), and an entry Fumadocs supports but gen does not (`!name`, `z...a`, `a...z`, a
 *          `[text](url)` link) or one that names nothing (`docs_meta_entry_invalid`).
 * Boundary: pure. It never refuses a page no entry reaches: the emitter's `docs_page_unlisted` does that, naming
 *           `content/**\/meta.json`. Translations (`<page>.<code>`) are left out by the caller.
 * Runtime: isomorphic
 * Governing contract: ADR 0514 (amendment of 2026-11-09: the docs member and its meta.json navigation).
 */
import { byIndexThenPath } from "#core/functions/by-index-then-path.function";
import type { DocsGroup } from "#core/types/docs-group.type";
import type { DocsMetaInput } from "#core/types/docs-meta-input.type";
import type { DocsTab } from "#core/types/docs-tab.type";
import type { GenError } from "#core/types/gen-error.type";

/** A folder's meta.json once checked. */
type Meta = {
  readonly title?: string;
  readonly icon?: string;
  readonly pages?: readonly string[];
  readonly root?: boolean;
  readonly defaultOpen?: boolean;
};

/** One resolved entry of a folder: a page, a subfolder or a separator. */
type Item =
  | { readonly kind: "page"; readonly path: string }
  | { readonly kind: "folder"; readonly path: string }
  | { readonly kind: "separator"; readonly label: string };

/** A group under construction. */
type Draft = { group: string; icon?: string; pages: (string | DocsGroup)[] };

/** The fields gen reads from a meta.json, by the type each must have. */
const META_FIELDS: ReadonlyMap<string, "string" | "boolean" | "strings"> = new Map<
  string,
  "string" | "boolean" | "strings"
>([
  ["title", "string"],
  ["icon", "string"],
  ["pages", "strings"],
  ["root", "boolean"],
  ["defaultOpen", "boolean"],
]);

/** A separator entry, `---Label---`. */
const SEPARATOR = /^---(.+)---$/;

/** The meta.json of `folder`, relative to the member root. */
const metaFile = (folder: string): string =>
  folder === "" ? "content/meta.json" : `content/${folder}/meta.json`;

/** The folder of a path (`adr` for `adr/0001-x`, `` for `index`). */
const parentOf = (path: string): string => path.slice(0, Math.max(0, path.lastIndexOf("/")));

/** The last segment of a path. */
const nameOf = (path: string): string => path.slice(path.lastIndexOf("/") + 1);

/** `name` inside `folder`. */
const inside = (folder: string, name: string): string =>
  folder === "" ? name : `${folder}/${name}`;

/** `icon` as an optional field. */
const iconOf = (meta: Meta | undefined): { readonly icon?: string } =>
  meta?.icon === undefined ? {} : { icon: meta.icon };

/** Why `entry` is not an entry gen supports, with the fix; undefined when it is a plain name. */
function unsupported(entry: string): readonly [string, string] | undefined {
  if (entry.startsWith("!"))
    return [
      "hides an entry with `!`, which gen does not support",
      "list the entries to show instead of `...`, or move the page out of the site",
    ];
  if (entry === "z...a" || entry === "a...z")
    return [
      "sorts the rest with a direction, which gen does not support",
      "write `...` (index first, then by path), or list the entries in order",
    ];
  if (/^(?:external:)?\[[^\]]*\]\([^)]*\)$/.test(entry))
    return [
      "is a link, which gen does not support in the navigation",
      "put the link in docs.yaml `navbar.links` or `footer.links`",
    ];
  return undefined;
}

/**
 * The tabs of a docs member's navigation, from its folders' meta.json files.
 *
 * @param input - the site name, the page ids, the folders and each folder's parsed meta.json.
 * @returns the tabs, and the refusals of the meta.json files (the tabs are not to be used when there is one).
 * @example
 * navigationOfMeta({ name: "Pay", pages: ["index", "guides/setup"], folders: ["guides"], metas: {} }).navigation;
 * // [{ tab: "Pay", groups: [{ group: "Pay", pages: ["index", { group: "guides", pages: ["guides/setup"] }] }] }]
 */
export function navigationOfMeta(input: DocsMetaInput): {
  navigation: DocsTab[];
  errors: GenError[];
} {
  const errors: GenError[] = [];
  const refuse = (code: string, folder: string, subject: string, message: string, fix: string) =>
    errors.push({ code, file: metaFile(folder), line: 0, column: 0, subject, message, fix });

  // Folders: the given ones, every page's, and all their parents; the pages and subfolders of each.
  const folders = new Set<string>([""]);
  const addFolder = (path: string): void => {
    for (let at = path; at !== "" && !folders.has(at); at = parentOf(at)) folders.add(at);
  };
  for (const folder of input.folders) addFolder(folder);
  for (const id of input.pages) addFolder(parentOf(id));
  const pages = new Set(input.pages);
  const pagesIn = new Map<string, string[]>();
  for (const id of pages) pagesIn.set(parentOf(id), [...(pagesIn.get(parentOf(id)) ?? []), id]);
  const foldersIn = new Map<string, string[]>();
  for (const path of folders)
    if (path !== "")
      foldersIn.set(parentOf(path), [...(foldersIn.get(parentOf(path)) ?? []), path]);

  // Each meta.json: an object whose fields gen reads, each of its type.
  const metas = new Map<string, Meta>();
  for (const [folder, raw] of Object.entries(input.metas)) {
    const file = metaFile(folder);
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      refuse(
        "docs_meta_invalid",
        folder,
        file,
        `${file} is not a JSON object`,
        'write an object such as { "title": "Guides", "pages": ["index", "..."] }',
      );
      continue;
    }
    let valid = true;
    for (const [key, value] of Object.entries(raw)) {
      const type = META_FIELDS.get(key);
      const ok =
        type === "strings"
          ? Array.isArray(value) && value.every((item) => typeof item === "string")
          : type !== undefined && typeof value === type;
      if (ok) continue;
      valid = false;
      refuse(
        "docs_meta_invalid",
        folder,
        `${file}#${key}`,
        type === undefined
          ? `${file} sets \`${key}\`, which gen does not read`
          : `${file} sets \`${key}\` to a value that is not ${type === "strings" ? "a list of strings" : `a ${type}`}`,
        type === undefined
          ? "remove it: gen reads `title`, `icon`, `pages`, `root` and `defaultOpen`"
          : `write \`${key}\` as ${type === "strings" ? "a list of strings" : `a ${type}`}`,
      );
    }
    if (!valid) continue;
    const meta = raw as Meta;
    metas.set(folder, meta);
    if (meta.root === true && folder === "")
      refuse(
        "docs_meta_invalid",
        folder,
        `${file}#root`,
        `${file} sets \`root\`, but content/ is the whole site, not a tab`,
        "remove `root` here, and set it in the meta.json of each folder directly under content/ that is a tab",
      );
    else if (meta.root === true && folder.includes("/"))
      refuse(
        "docs_meta_root_nested",
        folder,
        `${file}#root`,
        `${file} sets \`root\`, but only a folder directly under content/ can be a tab`,
        `remove \`root\` from ${file}, or move the folder directly under content/`,
      );
  }
  const isTab = (path: string): boolean =>
    path !== "" && !path.includes("/") && metas.get(path)?.root === true;

  // A folder's entries, resolved: its meta's `pages` with `...` expanded, or the default order. `skip` leaves out the
  // tabs at the top level: naming one there orders the tabs instead.
  const itemsOf = (folder: string, skip: (path: string) => boolean): Item[] => {
    const own = pagesIn.get(folder) ?? [];
    const subs = (foldersIn.get(folder) ?? []).filter((path) => !skip(path));
    const rest = (named: ReadonlySet<string>): Item[] =>
      [
        ...own.map((path) => ({ kind: "page", path }) as const),
        ...subs.map((path) => ({ kind: "folder", path }) as const),
      ]
        .filter((item) => !named.has(item.path))
        // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
        .sort((a, b) => byIndexThenPath(a.path, b.path));
    const listed = metas.get(folder)?.pages;
    if (listed === undefined) return rest(new Set());
    const named = new Set<string>();
    const resolved: (Item | "...")[] = [];
    for (const entry of listed) {
      const label = SEPARATOR.exec(entry)?.[1]?.trim();
      const path = inside(folder, entry);
      const why = unsupported(entry);
      // A plain name: a page or subfolder directly in the folder (`""` would name the folder itself).
      const plain = entry !== "" && !entry.includes("/");
      if (label !== undefined && label !== "") resolved.push({ kind: "separator", label });
      else if (entry === "...") resolved.push("...");
      else if (why !== undefined)
        refuse(
          "docs_meta_entry_invalid",
          folder,
          entry,
          `${metaFile(folder)} lists "${entry}", which ${why[0]}`,
          why[1],
        );
      else if (plain && pages.has(path)) {
        named.add(path);
        resolved.push({ kind: "page", path });
      } else if (plain && folders.has(path)) {
        named.add(path);
        if (!skip(path)) resolved.push({ kind: "folder", path });
      } else
        refuse(
          "docs_meta_entry_invalid",
          folder,
          entry,
          `${metaFile(folder)} lists "${entry}", which names no page or folder in ${folder === "" ? "content/" : `content/${folder}/`}`,
          "name a page (its file name without .mdx) or a subfolder directly in the folder, a `---Label---` separator or `...`",
        );
    }
    return resolved.flatMap((item) => (item === "..." ? rest(named) : [item]));
  };

  // A page id, or a subfolder as a nested group (left out when it lists nothing).
  const entryOf = (item: Item): string | DocsGroup | undefined => {
    if (item.kind === "separator") return undefined;
    if (item.kind === "page") return item.path;
    const meta = metas.get(item.path);
    const top: Draft = { group: meta?.title ?? nameOf(item.path), ...iconOf(meta), pages: [] };
    let current = top;
    for (const sub of itemsOf(item.path, () => false)) {
      if (sub.kind === "separator") {
        current = { group: sub.label, pages: [] };
        top.pages.push(current);
        continue;
      }
      const entry = entryOf(sub);
      if (entry !== undefined) current.pages.push(entry);
    }
    // A separator that nothing followed leaves an empty nested group; drop it.
    top.pages = top.pages.filter((entry) => typeof entry === "string" || entry.pages.length > 0);
    return top.pages.length === 0 ? undefined : top;
  };

  // A tab's groups: the leading one, then one per separator, the empty ones left out.
  const groupsOf = (items: readonly Item[], leading: string): DocsGroup[] => {
    const groups: Draft[] = [{ group: leading, pages: [] }];
    for (const item of items) {
      if (item.kind === "separator") {
        groups.push({ group: item.label, pages: [] });
        continue;
      }
      const entry = entryOf(item);
      if (entry !== undefined) groups.at(-1)?.pages.push(entry);
    }
    return groups.filter((group) => group.pages.length > 0);
  };

  const root = metas.get("");
  const title = root?.title ?? input.name;
  const navigation: DocsTab[] = [];
  const first = groupsOf(itemsOf("", isTab), title);
  if (first.length > 0) navigation.push({ tab: title, ...iconOf(root), groups: first });
  const named = (root?.pages ?? []).filter((entry) => isTab(entry));
  const tabs = [
    ...new Set([
      ...named,
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      ...[...folders].filter((path) => isTab(path)).sort(),
    ]),
  ];
  for (const path of tabs) {
    const meta = metas.get(path);
    const tab = meta?.title ?? path;
    const groups = groupsOf(
      itemsOf(path, () => false),
      tab,
    );
    if (groups.length > 0) navigation.push({ tab, ...iconOf(meta), groups });
  }
  // A folder listed twice is resolved twice; report each refusal once.
  const seen = new Set<string>();
  return {
    navigation,
    errors: errors.filter((error) => {
      const key = `${error.file}\n${error.subject}\n${error.message}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
  };
}
