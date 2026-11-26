/**
 * Stackra file contract:
 * Purpose: unit tests of `presetTemplateKey`: a preset name is its own key; a preset folder is its `preset.yml` id when
 *          that id is a template; a folder with an unknown id or no `preset.yml` keeps its path, which
 *          `checkRepositoryLayout` refuses as having no template.
 * Boundary: test only; writes small preset folders under the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0528 (decision 1); ADR 0022 (test placement).
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { checkRepositoryLayout } from "#node/functions/check-repository-layout.function";
import { presetTemplateKey } from "#node/functions/preset-template-key.function";

/** A repository root with a preset folder at `preset/` whose preset.yml declares `id`, or none when undefined. */
const repository = (id: string | undefined): string => {
  const root = mkdtempSync(join(tmpdir(), "preset-key-"));
  mkdirSync(join(root, "preset"), { recursive: true });
  if (id !== undefined)
    writeFileSync(join(root, "preset", "preset.yml"), `preset:\n  id: "${id}"\n  name: "x"\n`);
  return root;
};

describe("presetTemplateKey", () => {
  it("keeps a preset name as its own key", () => {
    expect(presetTemplateKey(repository(undefined), "stackra")).toBe("stackra");
    expect(presetTemplateKey(repository(undefined), "@stackra/flow-preset")).toBe(
      "@stackra/flow-preset",
    );
  });

  it("resolves a preset folder to the template its preset.yml id names", () => {
    expect(presetTemplateKey(repository("stackra"), "./preset")).toBe("stackra");
  });

  it("keeps the path of a folder with an unknown id or no preset.yml, which the layout check refuses", () => {
    for (const root of [repository("custom"), repository(undefined)]) {
      const key = presetTemplateKey(root, "./preset");
      expect(key).toBe("./preset");
      expect(
        checkRepositoryLayout({
          entries: [],
          paths: [],
          preset: key,
          members: [],
          allow: {},
          banned: [],
          toolsReadme: false,
        }),
      ).toEqual(['flow.config.json: preset "./preset" has no template (ADR 0528)']);
    }
  });
});
