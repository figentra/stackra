/**
 * Stackra file contract:
 * Purpose: `checkMemberMetadata(member)`, the metadata findings of one member of the Stackra repository (ADR 0453
 *          decision 11, amendment of 2026-10-27): `keywords` with "stackra" and the category, the `repository`,
 *          `homepage`, `bugs`, `author` and `engines` of `npmMetadataFor`, a `stackra` field with `"kind": "package"`
 *          that the shared `STACKRA_MANIFEST_SCHEMA` accepts, whose `tier` and `category` match the folder, with
 *          `runtimes` and a `summary` that is not the description, and turbo tags equal to `turboTagsFor` of it.
 * Boundary: pure: the caller passes the parsed package.json and turbo.jsonc, and the schema (from the built
 *           `@stackra/skills/contracts`; skipped when undefined, the other rules still run).
 * Runtime: node
 * Governing contract: ADR 0453 (decision 11, amendment of 2026-10-27); ADR 0003 (tiers); ADR 0127 (categories).
 */
import { categoryOf } from "#node/functions/category-of.function";
import { npmMetadataFor } from "#node/functions/npm-metadata-for.function";
import { tierFor } from "#node/functions/tier-for.function";
import { turboTagsFor } from "#node/functions/turbo-tags-for.function";
import type { PackageManifest } from "#node/types/package-manifest.type";

/** The part of a zod schema this check calls: `STACKRA_MANIFEST_SCHEMA` of `@stackra/skills/contracts`. */
type ManifestSchema = {
  readonly safeParse: (value: unknown) => {
    readonly success: boolean;
    readonly error?:
      | {
          readonly issues: readonly {
            readonly path: readonly PropertyKey[];
            readonly message: string;
          }[];
        }
      | undefined;
  };
};

/**
 * The metadata findings of one member; the root and an unplaced directory have none.
 *
 * @param member - `dir` (repository-relative), `pkg`, `turbo` when present, and `schema` when it could be loaded.
 * @example
 * checkMemberMetadata({ dir: "packages/data/storage", pkg, turbo, schema: STACKRA_MANIFEST_SCHEMA }); // []
 */
export function checkMemberMetadata(member: {
  readonly dir: string;
  readonly pkg: PackageManifest;
  readonly turbo?: { readonly tags?: readonly string[] } | undefined;
  readonly schema?: ManifestSchema | undefined;
}): string[] {
  const { dir, pkg, turbo, schema } = member;
  const tierTag = tierFor(dir);
  if (tierTag === null || tierTag === "unknown") return [];
  const out: string[] = [];
  const tier = tierTag.slice("tier:".length);
  const category = categoryOf(dir);
  const want = npmMetadataFor(dir);

  const keywords = Array.isArray(pkg.keywords) ? pkg.keywords : [];
  const needed = ["stackra", ...(category ? [category] : [])];
  if (!needed.every((keyword) => keywords.includes(keyword)))
    out.push(
      `keywords must list ${needed.map((k) => `"${k}"`).join(" and ")}, then the member's domain terms`,
    );
  if (pkg.repository?.url !== want.repository.url || pkg.repository?.directory !== dir)
    out.push(`repository must be ${JSON.stringify(want.repository)}`);
  if (pkg.homepage !== want.homepage) out.push(`homepage must be "${want.homepage}"`);
  if (pkg.bugs?.url !== want.bugs.url) out.push(`bugs must be ${JSON.stringify(want.bugs)}`);
  if (pkg.author !== want.author) out.push(`author must be "${want.author}"`);
  if (pkg.engines?.node !== want.engines.node)
    out.push(`engines.node must be "${want.engines.node}", as the root package.json`);

  const field = pkg.stackra;
  if (field?.kind !== "package") {
    out.push('stackra.kind must be written out as "package" (ADR 0453 decision 11)');
    return out;
  }
  const parsed = schema?.safeParse(field);
  if (parsed && !parsed.success)
    for (const issue of parsed.error?.issues ?? [])
      out.push(`stackra.${issue.path.join(".")}: ${issue.message} (STACKRA_MANIFEST_SCHEMA)`);
  if (field.tier !== tier) out.push(`stackra.tier must be "${tier}", the tier of ${dir}`);
  if ((field.category ?? null) !== category)
    out.push(
      category
        ? `stackra.category must be "${category}", its packages/<category> folder`
        : "stackra.category is for packages only; remove it",
    );
  const runtimes = Array.isArray(field.runtimes) ? field.runtimes : [];
  if (runtimes.length === 0)
    out.push("stackra.runtimes must list where its entries run, from their Runtime: headers");
  const summary = typeof field.summary === "string" ? field.summary.trim() : "";
  if (summary === "")
    out.push("stackra.summary missing: one sentence for agents on when to reach for this member");
  else if (summary === pkg.description?.trim())
    out.push("stackra.summary copies description: say when to reach for this member instead");

  const tags = turboTagsFor({ tier, category, runtimes });
  if (JSON.stringify(turbo?.tags ?? []) !== JSON.stringify(tags))
    out.push(`turbo.jsonc tags must be ${JSON.stringify(tags)}, from the stackra field`);
  return out;
}
