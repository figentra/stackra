/**
 * Stackra file contract:
 * Purpose: `ManifestCommand`, the `manifest` tool of the local MCP: the committed `stackra.manifest.json` of every
 *          member, or of one (`member`), whole or narrowed to one top-level section (`section`). The sections are the
 *          ones the manifests hold, never a fixed list: an unknown section is refused with the sections there are.
 * Boundary: reads committed manifests only; never runs gen, so it shows what is committed. Fails with the fix
 *           `stackra gen` when there is no manifest.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: inspect the manifest); ADR 0294 (rule R10); STA-2873.
 */
import { Command, CommandError, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { readMembers } from "#node/functions/read-members.function";
import { resolveMember } from "#node/functions/resolve-member.function";

/** Reads the committed manifests. */
export class ManifestCommand extends Command({
  name: "manifest",
  description:
    "Read the committed stackra.manifest.json of every member or one member, whole or one top-level section " +
    "(actions, events, schemas, … as the manifests hold them)",
  bin: true,
  tool: { readOnly: true },
}) {
  /** The member to read; every member when absent. */
  @Option({
    description: "A member: its key (`commerce`), package name or folder; every member when absent",
  })
  @Str
  member?: string;

  /** The one section to return. */
  @Option({
    description:
      "One top-level section, such as `actions`; the whole manifest when absent. A section no manifest has is " +
      "refused with the ones they have",
  })
  @Str
  section?: string;

  /** The manifests, or the one section of each. */
  handle(io: CommandIo): unknown {
    const members =
      this.member === undefined ? readMembers(io.cwd) : [resolveMember(io.cwd, this.member)];
    const manifests = members.flatMap((member) =>
      member.manifest === undefined ? [] : [member.manifest],
    );
    if (manifests.length === 0)
      throw new CommandError(
        this.member === undefined
          ? "No member has a stackra.manifest.json yet"
          : `${this.member} has no stackra.manifest.json yet`,
        { fix: "stackra gen" },
      );
    const section = this.section;
    if (section === undefined) return manifests;
    // `$comment` is gen's notice, not a section.
    const keys = manifests
      .flatMap((manifest) => Object.keys(manifest))
      .filter((key) => !key.startsWith("$"));
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    const present = [...new Set(keys)].sort();
    if (!present.includes(section))
      throw new CommandError(`No manifest has a "${section}" section`, {
        fix: `name one of: ${present.join(", ")}`,
      });
    return manifests.map((manifest) => ({
      member: manifest.member,
      [section]: (manifest as Record<string, unknown>)[section] ?? null,
    }));
  }
}
