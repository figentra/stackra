/**
 * Stackra file contract:
 * Purpose: `checkSkillTech(skills)`: one finding for each skill that teaches a rejected technology (ADR 0227) it has
 *          no reasoned allowance for (`SKILL_TECH_ALLOWED`). Moved from core's agents-sync script (STA-2098 H6).
 * Boundary: pure: each skill's name and the Markdown text under its folder; `agentSourceFindings` reads the disk.
 * Runtime: node
 * Governing contract: ADR 0227; ADR 0258 (decision 6).
 */
import { REJECTED_IN_SKILLS } from "#node/constants/rejected-in-skills.constant";
import { SKILL_TECH_ALLOWED } from "#node/constants/skill-tech-allowed.constant";

/**
 * The skills that teach a rejected technology without an allowance.
 *
 * @param skills - each skill's name and the Markdown under its folder.
 * @example
 * checkSkillTech(new Map([["orm", "Use drizzle."]])); // ["…/orm: teaches 'drizzle', which is rejected …"]
 */
export function checkSkillTech(skills: ReadonlyMap<string, string>): string[] {
  const findings: string[] = [];
  for (const [skill, text] of skills) {
    const allowed = SKILL_TECH_ALLOWED[skill] ?? {};
    for (const [tech, pattern] of Object.entries(REJECTED_IN_SKILLS))
      if (pattern.test(text) && !(tech in allowed))
        findings.push(
          `.agents/skills/${skill}: teaches '${tech}', which is rejected (ADR 0227); fence it, drop it, or add a reasoned SKILL_TECH_ALLOWED entry (ADR 0258)`,
        );
  }
  return findings;
}
