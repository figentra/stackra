/**
 * Stackra file contract:
 * Purpose: `checkPublicIdPrefixes`, repository-wide public id prefix uniqueness across member manifests, allowing
 *          several members to host the same package model and leaving same-member clashes to gen. Each finding names
 *          every model and suggests a prefix no member of the repository uses.
 * Boundary: pure; reads parsed manifests only. Invalid manifests and entries without a prefix or identity are ignored.
 * Runtime: node
 * Governing contract: ADR 0135 (public id prefixes and hosted models); ADR 0305 (one declaration per file).
 */

/**
 * A 3-letter prefix from the letters of `identity`'s model name, in order, that `used` does not hold; else 4 letters.
 *
 * @example
 * freePrefix("gadgets.gadget", new Set(["gad"])); // "gag"
 */
const freePrefix = (identity: string, used: ReadonlySet<string>): string | undefined => {
  const letters = (identity.split(".").at(-1) ?? identity).replaceAll(/[^a-z]/g, "");
  for (const size of [3, 4]) {
    const pick = (from: number, taken: string): string | undefined => {
      if (taken.length === size) return used.has(taken) ? undefined : taken;
      for (let index = from; index < letters.length; index += 1) {
        const found = pick(index + 1, taken + letters[index]);
        if (found !== undefined) return found;
      }
      return undefined;
    };
    const found = letters.length > 0 ? pick(1, letters[0] ?? "") : undefined;
    if (found !== undefined) return found;
  }
  return undefined;
};

/**
 * The public id prefixes shared by different model identities across different members, sorted by prefix.
 *
 * @param members - repository-relative member folders and their parsed committed `stackra.manifest.json` files.
 * @returns One finding per clashing prefix, naming every model identity and its source path.
 * @example
 * checkPublicIdPrefixes([{ dir: "services/orders", manifest: { models: [] } }]); // []
 */
export function checkPublicIdPrefixes(
  members: readonly { readonly dir: string; readonly manifest: unknown }[],
): string[] {
  const prefixes = new Map<string, { identity: string; dir: string; file: string }[]>();
  for (const { dir, manifest } of members) {
    if (
      typeof manifest !== "object" ||
      manifest === null ||
      !("models" in manifest) ||
      !Array.isArray(manifest.models)
    )
      continue;
    for (const entry of manifest.models as readonly unknown[]) {
      if (typeof entry !== "object" || entry === null) continue;
      const model = entry as Record<string, unknown>;
      const publicId = model["publicId"];
      const identity = model["hosts"] ?? model["key"];
      if (typeof publicId !== "string" || typeof identity !== "string") continue;
      const file = model["file"];
      const entries = prefixes.get(publicId) ?? [];
      entries.push({ identity, dir, file: typeof file === "string" ? file : "" });
      prefixes.set(publicId, entries);
    }
  }
  const findings: string[] = [];
  for (const prefix of [...prefixes.keys()].toSorted()) {
    const entries = prefixes.get(prefix) ?? [];
    if (
      new Set(entries.map(({ identity }) => identity)).size < 2 ||
      new Set(entries.map(({ dir }) => dir)).size < 2
    )
      continue;
    const models = entries.map(
      ({ identity, dir, file }) => `${identity} (${file ? `${dir}/${file}` : dir})`,
    );
    const last = entries.at(-1)?.identity ?? "";
    const suggestion = freePrefix(last, new Set(prefixes.keys()));
    findings.push(
      `public id prefix \`${prefix}\` is used by ${models.join(" and ")}: give one of them another prefix${
        suggestion === undefined ? "" : `, for example \`${suggestion}\` for ${last}`
      } (ADR 0135)`,
    );
  }
  return findings;
}
