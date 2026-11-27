/**
 * Stackra file contract:
 * Purpose: `guidelinesOf(knowledge)`, the Markdown of `stackra://guidelines`: every always-on rule of `@stackra/skills`
 *          in full (its headings one level down), then the rules and skills to read on request with their URIs and
 *          descriptions, then the steps every change ends with. A client with no skills support gets the same layer-1
 *          conventions an assistant with the rendered skills has.
 * Boundary: pure; reads only the given documents. Layer 1 only (ADR 0282 decisions 6 and 7): it serves the open
 *           documents as written and adds no know-how of its own.
 * Runtime: node
 * Governing contract: ADR 0282 (decisions 2, 5, 6 and 7); STA-2919.
 */
import type { RuleDocument, SkillDocument } from "@stackra/skills";

import { LOCAL_RESOURCE_URI } from "#node/constants/local-resource-uri.constant";
import { finishSteps } from "#node/functions/finish-steps.function";
import type { LocalKnowledge } from "#node/types/local-knowledge.type";

/** A fence line in Markdown. */
const FENCE = /^\s*(```|~~~)/;

/** A heading of level 1 to 5. */
const HEADING = /^#{1,5} /;

/** `markdown` with every heading outside a code fence one level down, so a rule nests under its section. */
const demote = (markdown: string): string => {
  let fenced = false;
  return markdown
    .split("\n")
    .map((line) => {
      if (FENCE.test(line)) fenced = !fenced;
      return !fenced && HEADING.test(line) ? `#${line}` : line;
    })
    .join("\n");
};

/**
 * The guidelines text.
 *
 * @param knowledge - the documents and the tool names.
 * @example
 * guidelinesOf({ root, documents: loadSkillSet(), tools: new Set(["gen", "verify"]) });
 */
export function guidelinesOf(knowledge: LocalKnowledge): string {
  const rules = knowledge.documents.filter(
    (document): document is RuleDocument => document.kind === "rule",
  );
  const skills = knowledge.documents.filter(
    (document): document is SkillDocument => document.kind === "skill",
  );
  const always = rules.filter((rule) => rule.always);
  const onRequest = rules.filter((rule) => !rule.always);
  const sections = [
    "# Stackra guidelines",
    "",
    "The conventions every change in a Stackra repository follows, from `@stackra/skills`. The rules under " +
      "“Always” apply to every change. Read a rule or skill under “On request” when its description matches the " +
      "work, through `resources/read` with its URI.",
    "",
    "## Always",
    "",
    always.length === 0
      ? "No rule is always on."
      : always.map((rule) => demote(rule.body.trim())).join("\n\n"),
    "",
    "## On request",
    "",
    ...(onRequest.length === 0 && skills.length === 0 ? ["Nothing else is served."] : []),
    ...onRequest.map(
      (rule) => `- \`${LOCAL_RESOURCE_URI.rule}${rule.name}\` (rule): ${rule.description}`,
    ),
    ...skills.map(
      (skill) => `- \`${LOCAL_RESOURCE_URI.skill}${skill.name}\` (skill): ${skill.description}`,
    ),
    "",
    "## The facts of this repository",
    "",
    `Read \`${LOCAL_RESOURCE_URI.manifest}\` (or one member's \`${LOCAL_RESOURCE_URI.manifestOf}<member>\`) for ` +
      "the committed manifests: actions, events, routes, permissions, errors and models. Generated files and " +
      "manifests are written by `stackra gen`, never by hand.",
    "",
    "## Every change ends the same way",
    "",
    finishSteps(knowledge.tools),
  ];
  return `${sections.join("\n")}\n`;
}
