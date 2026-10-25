/**
 * Stackra file contract:
 * Purpose: `seedPackTemplate(options)`, the files of a new `seed-pack:<product>`: `seed-pack.yaml` (key, product,
 *          version 0.1.0) and a README in each profile folder (`minimal`, `demo`, `test`) saying what goes there and
 *          the document shape every record follows.
 * Boundary: pure; it writes no record: every default is the product's data, added with the answer id it encodes.
 * Runtime: node
 * Governing contract: config-model section 6; ADR 0190 (decision 1); ADR 0325 (decision 7).
 */
import { SEED_RECORD_KINDS } from "#node/constants/seed-record-kinds.constant";
import type { TemplateFile } from "#node/types/template-file.type";
import type { TemplateOptions } from "#node/types/template-options.type";

/** What each profile folder holds. */
const PURPOSE: Readonly<Record<string, string>> = {
  minimal: "the defaults a new tenant of the product receives",
  demo: "the synthetic demo tenant a sandbox or a trial holds, loaded after `minimal`",
  test: "the fixtures the end-to-end tier runs on, loaded after `minimal`",
};

/**
 * The files of a new seed pack.
 *
 * @param options - the checked product key and description.
 * @example
 * seedPackTemplate({ name: "commerce", pascal: "Commerce", description: "Commerce defaults." });
 */
export function seedPackTemplate(options: TemplateOptions): readonly TemplateFile[] {
  const { name, description } = options;
  return [
    {
      path: "seed-pack.yaml",
      content: [
        `# seed-pack:${name}: ${description}`,
        "# Versioned with the product; a new version changes product defaults only, never a tenant's values.",
        `key: seed-pack:${name}`,
        `product: ${name}`,
        "version: 0.1.0",
        "",
      ].join("\n"),
    },
    ...Object.entries(PURPOSE).map(([profile, purpose]) => ({
      path: `profiles/${profile}/README.md`,
      content: [
        `# ${profile}`,
        "",
        `One YAML document per record: ${purpose}.`,
        "",
        "```yaml",
        "kind: settings",
        "key: settings:product-default:<area>",
        "rows:",
        "  - id: <row id, unique in the record>",
        "    answer: <the owner answer or default id, such as COM-160>",
        "    value: <the value>",
        "```",
        "",
        `\`kind\` is one of ${SEED_RECORD_KINDS.map((kind) => `\`${kind}\``).join(", ")}. Check the pack with`,
        `\`stackra seed-pack ${name} --check\`.`,
        "",
      ].join("\n"),
    })),
  ];
}
