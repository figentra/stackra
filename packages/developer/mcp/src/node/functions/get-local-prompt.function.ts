/**
 * Stackra file contract:
 * Purpose: `getLocalPrompt(knowledge, name, args)`, the local MCP's `prompts/get`: the recipe of `add-feature`,
 *          `fix-gen-drift` or `explain-refusal` as user messages, filled from this repository (its members, the
 *          members that declare a refusal code, the skills that apply) and with the manifest or skill it needs
 *          attached as an embedded resource. Every recipe ends with `finishSteps`: `stackra gen --check` and the tests.
 * Boundary: reads the manifests under the root; never writes and never runs a command: the recipe tells the assistant
 *           which tool to call. Arguments are checked by the prompt's zod object first; an unknown prompt or an
 *           invalid argument answers invalid params (-32602).
 * Runtime: node
 * Governing contract: ADR 0282 (decisions 5, 6 and 7); STA-2919.
 */
import type { StackraManifest } from "@stackra/contracts";
import type { SkillDocument } from "@stackra/skills";
import type { z } from "zod";

import { LOCAL_PROMPTS } from "#node/constants/local-prompts.constant";
import { LOCAL_RESOURCE_URI } from "#node/constants/local-resource-uri.constant";
import { McpProtocolError } from "#node/errors/mcp-protocol.error";
import { argumentsOf } from "#node/functions/arguments-of.function";
import { finishSteps } from "#node/functions/finish-steps.function";
import { readLocalResource } from "#node/functions/read-local-resource.function";
import type { LocalKnowledge } from "#node/types/local-knowledge.type";
import type { PromptMessage } from "#node/types/prompt-message.type";

/** The skill that holds the error and refusal conventions. */
const ERRORS_SKILL = "backend-errors";

/** The most of a pasted output a recipe quotes; the tail is kept, where failures are. */
const OUTPUT_LIMIT = 20_000;

/** A text message. */
const text = (body: string): PromptMessage => ({
  role: "user",
  content: { type: "text", text: body },
});

/** The resource at `uri` as an embedded-resource message. */
const attach = (knowledge: LocalKnowledge, uri: string): PromptMessage => ({
  role: "user",
  content: { type: "resource", resource: readLocalResource(knowledge, uri) },
});

/** The manifests under `root`, through the resource reader's error when one is not JSON. */
const manifestsOf = (knowledge: LocalKnowledge): StackraManifest[] =>
  JSON.parse(readLocalResource(knowledge, LOCAL_RESOURCE_URI.manifest).text) as StackraManifest[];

/** `output` cut to its last `OUTPUT_LIMIT` characters, in a fence that its own backticks cannot close. */
const quoted = (output: string): string => {
  const cut = output.length - OUTPUT_LIMIT;
  const shown =
    cut > 0 ? `… (${cut} earlier characters cut)\n${output.slice(-OUTPUT_LIMIT)}` : output;
  const fence = "`".repeat(Math.max(3, ...[...shown.matchAll(/`+/g)].map((m) => m[0].length + 1)));
  return `${fence}\n${shown.trimEnd()}\n${fence}`;
};

/** The skills the documents hold, one bullet each, with their URIs. */
const skillList = (knowledge: LocalKnowledge): string[] =>
  knowledge.documents
    .filter((document): document is SkillDocument => document.kind === "skill")
    .map((skill) => `   - \`${LOCAL_RESOURCE_URI.skill}${skill.name}\`: ${skill.description}`);

/** Whether the documents hold the skill `name`. */
const hasSkill = (knowledge: LocalKnowledge, name: string): boolean =>
  knowledge.documents.some((document) => document.kind === "skill" && document.name === name);

/** The `add-feature` messages. */
const addFeature = (
  knowledge: LocalKnowledge,
  input: z.infer<(typeof LOCAL_PROMPTS)["add-feature"]["input"]>,
): PromptMessage[] => {
  const manifests = manifestsOf(knowledge);
  const owner = manifests.find((manifest) => manifest.member === input.member);
  let where: string;
  if (input.member === undefined) {
    where =
      manifests.length === 0
        ? "This repository has no member with a committed manifest yet. Create the member that owns the feature " +
          "with the `new` tool (`stackra new service <name>` or `stackra new package <name>`) first."
        : `The members of this repository: ${manifests.map((manifest) => `\`${manifest.member}\``).join(", ")}. ` +
          "Put the feature in the member that owns its data, or create one with the `new` tool when none does.";
  } else if (owner === undefined) {
    where =
      `There is no member \`${input.member}\` with a committed manifest. Create it with the \`new\` tool ` +
      `(\`stackra new service ${input.member}\` or \`stackra new package ${input.member}\`) first, or choose an ` +
      "existing member.";
  } else {
    where =
      `It belongs in the member \`${owner.member}\` (\`${owner.package}\`). Its committed manifest is attached: ` +
      "keep its existing keys, permissions and events stable, and add to them.";
  }
  const recipe = [
    `Add this feature to the Stackra repository: ${input.feature}`,
    "",
    where,
    "",
    "Work in this order:",
    "",
    `1. Read \`${LOCAL_RESOURCE_URI.guidelines}\`. Then read each skill below whose description matches the work:`,
    ...skillList(knowledge),
    "2. Create a member only with the `new` tool, never by hand. Inside a member, write the module, its actions, " +
      "queries and models in the shape the skills show; gen derives the endpoints, permissions, manifest and wiring.",
    "3. Write each write as an action and each read as a query, with a typed refusal for every expected failure. " +
      "Put a test for each behaviour in `__tests__/` beside the code.",
    "4. After `stackra gen`, read the member's manifest with the `manifest` tool: the new actions, permissions, " +
      "events and errors appear as intended, and nothing existing changed its key.",
    "",
    "Finish:",
    "",
    finishSteps(knowledge.tools),
  ].join("\n");
  return [
    text(recipe),
    ...(owner === undefined
      ? []
      : [attach(knowledge, `${LOCAL_RESOURCE_URI.manifestOf}${encodeURIComponent(owner.member)}`)]),
  ];
};

/** The `fix-gen-drift` messages. */
const fixGenDrift = (
  knowledge: LocalKnowledge,
  input: z.infer<(typeof LOCAL_PROMPTS)["fix-gen-drift"]["input"]>,
): PromptMessage[] => {
  const output = input.output?.trim();
  const recipe = [
    "`stackra gen --check` fails in this repository. Bring the generated files back in line with the source.",
    "",
    ...(output
      ? ["It printed:", "", quoted(output), ""]
      : [
          "First run the `gen` tool with `check: true` and read what it prints: each line names a member, a file " +
            "or a refusal code.",
          "",
        ]),
    "Then, for each finding:",
    "",
    "- **A stale file** (a manifest, a schema, the wiring, an entry barrel, a launch file): gen writes it. Run the " +
      "`gen` tool without `check` to rewrite it. Never edit a generated file by hand to make the check pass.",
    "- **A refusal** (a snake_case code with the source file it judges): the source is wrong, not the generated " +
      "file. Fix the source it names, then run `gen` again. The `explain-refusal` prompt explains a code.",
    "- **A changed identity** in a committed manifest (a renamed action, event, permission or model key): other " +
      "members generate clients from it. Rename it back, or mark the class with `@Renamed(old)` as gen says; never " +
      "delete the old entry from the manifest by hand.",
    "",
    "Review the regenerated diff and keep it in the same change as the source edit that caused it.",
    "",
    "Finish:",
    "",
    finishSteps(knowledge.tools),
  ].join("\n");
  return [text(recipe)];
};

/** The `explain-refusal` messages. */
const explainRefusal = (
  knowledge: LocalKnowledge,
  input: z.infer<(typeof LOCAL_PROMPTS)["explain-refusal"]["input"]>,
): PromptMessage[] => {
  const declared = manifestsOf(knowledge).flatMap((manifest) =>
    (manifest.errors ?? [])
      .filter((error) => error.code === input.code)
      .map((error) => ({ member: manifest.member, package: manifest.package, ...error })),
  );
  const message = input.message?.trim();
  const recipe = [
    `Explain the refusal \`${input.code}\` and fix its cause.`,
    "",
    ...(message ? ["It came with:", "", quoted(message), ""] : []),
    ...(declared.length > 0
      ? [
          "These committed manifests declare it:",
          "",
          quoted(JSON.stringify(declared, null, 2)),
          "",
          "Its class sits in the declaring member's `errors/` folder; its code is derived from the class name.",
        ]
      : [
          "No committed manifest in this repository declares it. It is then a refusal of the action pipeline " +
            `(\`${LOCAL_RESOURCE_URI.skill}${ERRORS_SKILL}\` lists them), a finding of \`stackra gen\`, ` +
            "`stackra validate` or `stackra new` (printed with the file it judges), or a code of a member whose " +
            "manifest is not generated here.",
        ]),
    "",
    "Then:",
    "",
    "1. Say in plain words what it means and which input or state raises it: read where it is thrown.",
    "2. Decide which side is wrong. A wrong caller (the call, its data, its permission or the state it assumed) is " +
      "fixed at the caller; a wrong refusal is fixed in the action, its precondition or the source gen named. Never " +
      "catch and hide a refusal to make it pass.",
    "3. Add or update a test that expects the refusal for the bad case and none for the good case.",
    "",
    "Finish:",
    "",
    finishSteps(knowledge.tools),
  ].join("\n");
  return [
    text(recipe),
    ...(hasSkill(knowledge, ERRORS_SKILL)
      ? [attach(knowledge, `${LOCAL_RESOURCE_URI.skill}${ERRORS_SKILL}`)]
      : []),
  ];
};

/**
 * One local prompt, filled.
 *
 * @param knowledge - the root, the documents and the tool names.
 * @param name - a name from `LOCAL_PROMPTS`.
 * @param args - the prompt's arguments, all strings.
 * @throws McpProtocolError (-32602) for an unknown prompt or an invalid argument; (-32603) when a manifest is not
 *         JSON.
 * @example
 * getLocalPrompt(knowledge, "explain-refusal", { code: "order_not_payable" }).messages;
 */
export function getLocalPrompt(
  knowledge: LocalKnowledge,
  name: string,
  args: unknown,
): { description: string; messages: PromptMessage[] } {
  switch (name) {
    case "add-feature": {
      const prompt = LOCAL_PROMPTS[name];
      return {
        description: prompt.description,
        messages: addFeature(knowledge, argumentsOf(prompt.input, args)),
      };
    }
    case "fix-gen-drift": {
      const prompt = LOCAL_PROMPTS[name];
      return {
        description: prompt.description,
        messages: fixGenDrift(knowledge, argumentsOf(prompt.input, args)),
      };
    }
    case "explain-refusal": {
      const prompt = LOCAL_PROMPTS[name];
      return {
        description: prompt.description,
        messages: explainRefusal(knowledge, argumentsOf(prompt.input, args)),
      };
    }
    default: {
      throw new McpProtocolError(-32_602, `Unknown prompt: ${name}`);
    }
  }
}
