/**
 * Stackra file contract:
 * Purpose: `readDocsYaml`, the site settings of a docs member from its `docs.yaml`: every `DocsConfig` field but
 *          `navigation` (each folder's `content/**\/meta.json`) and `theme` (a docs member is always a Fumadocs
 *          site): `name` and `colors` (required), `description`, `logo` and `favicon` (paths under
 *          `content/assets`), `navbar`, `footer`, `apiReference`, `locales`, `redirects` and `raw`, plus an optional
 *          `$schema`. `apiReference` and `redirects` default to `[]` and `raw` to `{}`, as for a docs app.
 * Boundary: reads one file. A missing file, YAML that does not parse, a document that is not a mapping, a key gen does
 *           not read (`theme` and `navigation` with their own fix) and a value of the wrong shape are each one
 *           `docs_config_invalid` with `file: "docs.yaml"`; every one is reported. The shape is the one
 *           `schema/docs.json` (a byte copy of `tools/schemas/docs.schema.json`) describes for editors.
 * Runtime: node
 * Governing contract: ADR 0514 (amendment of 2026-11-09: the docs member and its docs.yaml).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { parse } from "yaml";

import { DOCS_MEMBER_SOURCE } from "#core/constants/docs-member-source.constant";
import type { DocsSiteInput } from "#core/types/docs-site-input.type";
import type { GenError } from "#core/types/gen-error.type";

/** The settings `docs.yaml` holds. */
type DocsYaml = Omit<DocsSiteInput["config"], "navigation" | "theme">;

/** The shape of a value: a scalar type, any JSON, one of some strings, a list, a string-keyed map or an object. */
type Shape =
  | "string"
  | "boolean"
  | "json"
  | { readonly oneOf: readonly string[] }
  | { readonly list: Shape }
  | { readonly map: Shape }
  | { readonly fields: Readonly<Record<string, Shape>>; readonly required?: readonly string[] };

/** A link: its text and its URL or site path. */
const LINK: Shape = { fields: { label: "string", href: "string" }, required: ["label", "href"] };

/** The whole of `docs.yaml`. */
const DOCS_YAML: Shape = {
  fields: {
    $schema: "string",
    name: "string",
    description: "string",
    colors: {
      fields: { primary: "string", light: "string", dark: "string" },
      required: ["primary"],
    },
    logo: {
      fields: { light: "string", dark: "string", href: "string" },
      required: ["light", "dark"],
    },
    favicon: "string",
    navbar: { fields: { links: { list: LINK }, primary: LINK } },
    footer: {
      fields: {
        socials: { map: "string" },
        links: {
          list: {
            fields: { header: "string", items: { list: LINK } },
            required: ["header", "items"],
          },
        },
      },
    },
    apiReference: { list: "string" },
    locales: {
      list: {
        fields: {
          code: "string",
          label: "string",
          dir: { oneOf: ["ltr", "rtl"] },
          default: "boolean",
          labels: { map: "string" },
        },
        required: ["code", "label"],
      },
    },
    redirects: { list: { fields: { from: "string", to: "string" }, required: ["from", "to"] } },
    raw: { map: "json" },
  },
  required: ["name", "colors"],
};

/** The keys a docs app's `DocsConfig` has and `docs.yaml` refuses, each with the fix. */
const ELSEWHERE: ReadonlyMap<string, string> = new Map([
  [
    "navigation",
    "remove it: navigation is content/**/meta.json, one meta.json per folder (title, icon, pages, root)",
  ],
  ["theme", "remove it: a docs member is always a Fumadocs site, which takes no Mintlify theme"],
]);

/** Whether `value` is a plain object. */
const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The key path of `key` under `at` (`colors.primary`, `locales[0].code`). */
const under = (at: string, key: string): string => (at === "" ? key : `${at}.${key}`);

/** What a value of `shape` is, for a message. */
function described(shape: Shape): string {
  if (shape === "string") return "a string";
  if (shape === "boolean") return "true or false";
  if (shape === "json") return "any value";
  if ("oneOf" in shape) return `one of ${shape.oneOf.join(", ")}`;
  if ("list" in shape) return "a list";
  return "a mapping";
}

/** Each place `value` does not have `shape`, as `[key path, message, fix]`. */
function problems(value: unknown, shape: Shape, at: string): (readonly [string, string, string])[] {
  const wrong = (): (readonly [string, string, string])[] => [
    [at, `\`${at}\` is not ${described(shape)}`, `write \`${at}\` as ${described(shape)}`],
  ];
  if (shape === "json") return [];
  if (shape === "string") return typeof value === "string" ? [] : wrong();
  if (shape === "boolean") return typeof value === "boolean" ? [] : wrong();
  if ("oneOf" in shape)
    return typeof value === "string" && shape.oneOf.includes(value) ? [] : wrong();
  if ("list" in shape)
    return Array.isArray(value)
      ? value.flatMap((item: unknown, index) => problems(item, shape.list, `${at}[${index}]`))
      : wrong();
  if (!isRecord(value)) return wrong();
  if ("map" in shape)
    return Object.entries(value).flatMap(([key, item]) =>
      problems(item, shape.map, under(at, key)),
    );
  const found: (readonly [string, string, string])[] = [];
  for (const key of shape.required ?? [])
    if (value[key] === undefined)
      found.push([
        under(at, key),
        `\`${under(at, key)}\` is missing`,
        `add \`${under(at, key)}\` (${described(shape.fields[key] ?? "json")})`,
      ]);
  for (const [key, item] of Object.entries(value)) {
    const field = shape.fields[key];
    const elsewhere = at === "" ? ELSEWHERE.get(key) : undefined;
    if (elsewhere !== undefined)
      found.push([
        key,
        `\`${key}\` is a docs app setting, which a docs member does not take`,
        elsewhere,
      ]);
    else if (field === undefined)
      found.push([
        under(at, key),
        `\`${under(at, key)}\` is not a docs.yaml setting`,
        `remove it, or use one of ${Object.keys(shape.fields).join(", ")}`,
      ]);
    else found.push(...problems(item, field, under(at, key)));
  }
  return found;
}

/**
 * The settings of the docs member at `root`, or the refusals of its `docs.yaml`.
 *
 * @param root - the member root.
 * @example
 * const { config, errors } = readDocsYaml("/repo/docs");
 * config?.name; // "Stackra"
 */
export function readDocsYaml(root: string): {
  readonly config?: DocsYaml;
  readonly errors: GenError[];
} {
  const file = DOCS_MEMBER_SOURCE.config;
  const refusal = (subject: string, message: string, fix: string): GenError => ({
    code: "docs_config_invalid",
    file,
    line: 0,
    column: 0,
    subject,
    message,
    fix,
  });
  const path = join(root, file);
  if (!existsSync(path))
    return {
      errors: [
        refusal(
          file,
          `a docs member has no ${file}`,
          `add ${file} at the member root with at least \`name\` and \`colors.primary\``,
        ),
      ],
    };
  let document: unknown;
  try {
    document = parse(readFileSync(path, "utf8"));
  } catch (error) {
    return {
      errors: [
        refusal(
          file,
          `${file} is not valid YAML: ${error instanceof Error ? error.message : String(error)}`,
          "fix the YAML at the line the message names",
        ),
      ],
    };
  }
  if (!isRecord(document))
    return {
      errors: [
        refusal(
          file,
          `${file} is not a mapping of settings`,
          "write the settings as `key: value` lines, starting with `name:` and `colors:`",
        ),
      ],
    };
  const found = problems(document, DOCS_YAML, "");
  if (found.length > 0)
    return {
      errors: found.map(([subject, message, fix]) => refusal(subject, `${file}: ${message}`, fix)),
    };
  // Checked against DOCS_YAML above; the three lists default as a docs app's do.
  const { $schema: _schema, ...settings } = document as Omit<
    DocsYaml,
    "apiReference" | "redirects" | "raw"
  > &
    Partial<Pick<DocsYaml, "apiReference" | "redirects" | "raw">> & { readonly $schema?: string };
  return {
    config: {
      ...settings,
      apiReference: settings.apiReference ?? [],
      redirects: settings.redirects ?? [],
      raw: settings.raw ?? {},
    },
    errors: [],
  };
}
