/**
 * Stackra file contract:
 * Purpose: `checkLicences(root)`, the licence findings for agent skills and plugins (STA-272): every skill folder
 *          under `.agents/skills` and `.agents/reference` and every plugin enabled in `.claude/settings.json` must
 *          have a licence recorded in `.agents/skills/.licences.yaml` that is on the allowlist, and a licence file in
 *          a skill folder that reads as noncommercial fails even when the record says otherwise (moved from
 *          `tools/scripts/skill-licences.mjs`).
 * Boundary: reads the checkout; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0174 (licence allow-list); ADR 0258 (agent skills); STA-272.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { parse } from "yaml";

import { ALLOWED_LICENCES } from "#node/skill-licences/constants/allowed-licences.constant";

const RECORD = ".agents/skills/.licences.yaml";
const SKILL_ROOTS = [".agents/skills", ".agents/reference"];
const NONCOMMERCIAL = /noncommercial|non-commercial|polyform/i;

/** Skill folders (holding a SKILL.md) under `dir`, as paths relative to `.agents`. */
function skillFolders(root: string, dir: string): string[] {
  const abs = join(root, dir);
  if (!existsSync(abs)) return [];
  if (existsSync(join(abs, "SKILL.md"))) return [dir.replace(/^\.agents\//, "")];
  return readdirSync(abs, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .flatMap((d) => skillFolders(root, `${dir}/${d.name}`));
}

/**
 * The findings for the checkout at `root`; empty when every skill and plugin carries an allowed licence.
 *
 * @param root - the checkout root.
 * @example
 * checkLicences(root); // ["skill skills/x: no licence recorded in .agents/skills/.licences.yaml"]
 */
export function checkLicences(root: string): string[] {
  const recordPath = join(root, RECORD);
  if (!existsSync(recordPath)) return [`${RECORD} is missing`];
  const record = (parse(readFileSync(recordPath, "utf8")) ?? {}) as {
    skills?: Record<string, string>;
    plugins?: Record<string, string>;
  };
  const settingsPath = join(root, ".claude/settings.json");
  const enabled = existsSync(settingsPath)
    ? Object.entries(
        (
          JSON.parse(readFileSync(settingsPath, "utf8")) as {
            enabledPlugins?: Record<string, boolean>;
          }
        ).enabledPlugins ?? {},
      )
        .filter(([, on]) => on)
        .map(([id]) => id)
    : [];
  const findings: string[] = [];
  const judge = (kind: string, name: string, licence: string | undefined): void => {
    if (!licence) findings.push(`${kind} ${name}: no licence recorded in ${RECORD}`);
    else if (!ALLOWED_LICENCES.includes(licence))
      findings.push(
        `${kind} ${name}: licence ${licence} is not allowed (${ALLOWED_LICENCES.join(", ")})`,
      );
  };

  const skills = SKILL_ROOTS.flatMap((dir) => skillFolders(root, dir));
  for (const skill of skills) {
    judge("skill", skill, record.skills?.[skill]);
    for (const file of readdirSync(join(root, ".agents", skill)).filter((f) =>
      /^(licen[cs]e|copying)/i.test(f),
    ))
      if (NONCOMMERCIAL.test(readFileSync(join(root, ".agents", skill, file), "utf8")))
        findings.push(`skill ${skill}: ${file} reads as a noncommercial licence`);
  }
  for (const plugin of enabled) judge("plugin", plugin, record.plugins?.[plugin]);

  for (const stale of Object.keys(record.skills ?? {}).filter((s) => !skills.includes(s)))
    findings.push(`skill ${stale}: recorded in ${RECORD} but no such skill folder`);
  for (const stale of Object.keys(record.plugins ?? {}).filter((p) => !enabled.includes(p)))
    findings.push(`plugin ${stale}: recorded in ${RECORD} but not enabled`);
  return findings;
}
