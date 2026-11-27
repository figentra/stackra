/**
 * Stackra file contract:
 * Purpose: unit tests of `getLocalPrompt` and `promptArguments`: each recipe ends with `stackra gen --check` and the
 *          tests; `add-feature` names the repository's members, attaches the chosen member's manifest and sends an
 *          unknown member to `new`; `fix-gen-drift` quotes the given output (tail kept, fence unbreakable) or runs the
 *          check first; `explain-refusal` names the members that declare the code, or the other places a code comes
 *          from, and attaches the errors skill; an unknown prompt, an unknown or missing argument and a malformed
 *          code answer -32602; the argument list follows the zod objects.
 * Boundary: test only; in-memory documents and a throwaway repository in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 5); STA-2919.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import type { AgentDocument } from "@stackra/skills";

import { LOCAL_PROMPTS } from "#node/constants/local-prompts.constant";
import { getLocalPrompt } from "#node/functions/get-local-prompt.function";
import { promptArguments } from "#node/functions/prompt-arguments.function";
import type { LocalKnowledge } from "#node/types/local-knowledge.type";
import type { PromptMessage } from "#node/types/prompt-message.type";

const ERRORS_SKILL: AgentDocument = {
  kind: "skill",
  name: "backend-errors",
  description: "Raise errors the Stackra way.",
  body: "# Errors\n\nRefusal codes are snake_case.\n",
  source: "skills/backend-errors/SKILL.md",
};

const ACTION_SKILL: AgentDocument = {
  kind: "skill",
  name: "backend-author-an-action",
  description: "Write an action or query.",
  body: "# Author an action\n",
  source: "skills/backend-author-an-action/SKILL.md",
};

let root: string;
let knowledge: LocalKnowledge;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-mcp-prompts-"));
  for (const [member, errors] of [
    ["commerce", [{ code: "order_not_payable", kind: "conflict", class: "OrderNotPayableError" }]],
    [
      "billing",
      [
        { code: "order_not_payable", kind: "conflict" },
        { code: "card_declined", kind: "conflict" },
      ],
    ],
  ] as const) {
    mkdirSync(join(root, "services", member), { recursive: true });
    writeFileSync(
      join(root, "services", member, "stackra.manifest.json"),
      JSON.stringify({ member, package: `@acme/${member}`, version: "1", errors }),
    );
  }
  knowledge = {
    root,
    documents: [ACTION_SKILL, ERRORS_SKILL],
    tools: new Set(["manifest", "new", "gen", "validate", "verify"]),
  };
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

/** The text of the first message. */
const recipeOf = (messages: readonly PromptMessage[]): string => {
  const first = messages[0]?.content;
  return first?.type === "text" ? first.text : "";
};

/** The URIs of the attached resources. */
const attached = (messages: readonly PromptMessage[]): string[] =>
  messages.flatMap((message) =>
    message.content.type === "resource" ? [message.content.resource.uri] : [],
  );

describe("getLocalPrompt", () => {
  it("ends every recipe with gen --check and the tests", () => {
    for (const [name, args] of [
      ["add-feature", { feature: "Refund an order" }],
      ["fix-gen-drift", {}],
      ["explain-refusal", { code: "order_not_payable" }],
    ] as const) {
      const recipe = recipeOf(getLocalPrompt(knowledge, name, args).messages);
      expect(recipe).toMatch(
        /Finish:\n\n1\. Run `stackra gen`.*\n2\. Run `stackra gen --check`.*\n3\. Run the tests with the `verify` tool/,
      );
    }
    expect(
      recipeOf(
        getLocalPrompt({ ...knowledge, tools: new Set(["gen", "test"]) }, "fix-gen-drift", {})
          .messages,
      ),
    ).toContain("3. Run the tests with the `test` tool.");
  });

  it("add-feature: names the members and the skills, and attaches the chosen member's manifest", () => {
    const open = getLocalPrompt(knowledge, "add-feature", { feature: "  Refund an order  " });
    expect(open.description).toBe(LOCAL_PROMPTS["add-feature"].description);
    expect(recipeOf(open.messages)).toContain(
      "Add this feature to the Stackra repository: Refund an order\n",
    );
    expect(recipeOf(open.messages)).toContain(
      "The members of this repository: `billing`, `commerce`.",
    );
    expect(recipeOf(open.messages)).toContain(
      "   - `stackra://skills/backend-author-an-action`: Write an action or query.",
    );
    expect(attached(open.messages)).toEqual([]);

    const owned = getLocalPrompt(knowledge, "add-feature", {
      feature: "Refund an order",
      member: "commerce",
    });
    expect(recipeOf(owned.messages)).toContain(
      "It belongs in the member `commerce` (`@acme/commerce`).",
    );
    expect(owned.messages[1]).toMatchObject({
      role: "user",
      content: {
        type: "resource",
        resource: { uri: "stackra://manifest/commerce", mimeType: "application/json" },
      },
    });
  });

  it("add-feature: sends an unknown member, or an empty repository, to the new tool", () => {
    const unknown = getLocalPrompt(knowledge, "add-feature", {
      feature: "Loyalty points",
      member: "loyalty",
    });
    expect(recipeOf(unknown.messages)).toContain(
      "There is no member `loyalty` with a committed manifest. Create it with the `new` tool (`stackra new service loyalty`",
    );
    expect(attached(unknown.messages)).toEqual([]);

    rmSync(join(root, "services"), { recursive: true });
    expect(recipeOf(getLocalPrompt(knowledge, "add-feature", { feature: "x" }).messages)).toContain(
      "This repository has no member with a committed manifest yet.",
    );
  });

  it("fix-gen-drift: quotes the given output, keeping its tail, in a fence it cannot close", () => {
    const quoted = recipeOf(
      getLocalPrompt(knowledge, "fix-gen-drift", {
        output:
          "stale: services/commerce/stackra.manifest.json\n```\nrefused: endpoint_param_unbound\n",
      }).messages,
    );
    expect(quoted).toContain(
      "It printed:\n\n````\nstale: services/commerce/stackra.manifest.json\n```\nrefused: endpoint_param_unbound\n````",
    );
    expect(quoted).not.toContain("First run the `gen` tool");
    expect(quoted).toContain("Never edit a generated file by hand");
    expect(quoted).toContain("`@Renamed(old)`");

    const long = recipeOf(
      getLocalPrompt(knowledge, "fix-gen-drift", { output: `${"a".repeat(25_000)}LAST` }).messages,
    );
    expect(long).toContain("… (5004 earlier characters cut)");
    expect(long).toContain("LAST\n```");

    expect(
      recipeOf(getLocalPrompt(knowledge, "fix-gen-drift", { output: "  " }).messages),
    ).toContain("First run the `gen` tool with `check: true`");
  });

  it("explain-refusal: names the declaring members and attaches the errors skill", () => {
    const found = getLocalPrompt(knowledge, "explain-refusal", {
      code: "order_not_payable",
      message: "Order ord_1 is not payable",
    });
    const recipe = recipeOf(found.messages);
    expect(recipe).toContain("Explain the refusal `order_not_payable` and fix its cause.");
    expect(recipe).toContain("It came with:\n\n```\nOrder ord_1 is not payable\n```");
    expect(recipe).toContain('"member": "billing"');
    expect(recipe).toContain('"class": "OrderNotPayableError"');
    expect(recipe).not.toContain("card_declined");
    expect(recipe).toContain("Never catch and hide a refusal");
    expect(attached(found.messages)).toEqual(["stackra://skills/backend-errors"]);
  });

  it("explain-refusal: names where an undeclared code comes from, without a missing skill", () => {
    const recipe = recipeOf(
      getLocalPrompt({ ...knowledge, documents: [] }, "explain-refusal", {
        code: "step_up_required",
      }).messages,
    );
    expect(recipe).toContain("No committed manifest in this repository declares it.");
    expect(
      attached(
        getLocalPrompt({ ...knowledge, documents: [] }, "explain-refusal", {
          code: "step_up_required",
        }).messages,
      ),
    ).toEqual([]);
  });

  it.each([
    ["deploy", {}],
    ["add-feature", {}],
    ["add-feature", { feature: "   " }],
    ["add-feature", { feature: "x", member: "../etc" }],
    ["fix-gen-drift", { extra: "1" }],
    ["explain-refusal", undefined],
    ["explain-refusal", { code: "Order Not Payable" }],
  ] as const)("refuses %s with %o as invalid params", (name, args) => {
    expect(() => getLocalPrompt(knowledge, name, args)).toThrow(
      expect.objectContaining({ code: -32_602 }),
    );
  });
  // P-007: every invalid request of every prompt answers -32602 before a manifest is read. One manifest here is not
  // JSON, so a request that reached the manifests would answer -32603 instead.
  it("refuses every invalid request of every prompt as invalid params before reading a manifest", () => {
    writeFileSync(join(root, "services", "billing", "stackra.manifest.json"), "{ not json");
    const valid: Record<keyof typeof LOCAL_PROMPTS, Record<string, string>> = {
      "add-feature": { feature: "Refund an order", member: "commerce" },
      "fix-gen-drift": { output: "stale" },
      "explain-refusal": { code: "order_not_payable", message: "Not payable" },
    };
    // The control: a valid request that reads the manifests meets the broken one.
    expect(() => getLocalPrompt(knowledge, "add-feature", valid["add-feature"])).toThrow(
      expect.objectContaining({ code: -32_603 }),
    );

    const invalid: [string, unknown][] = [
      ["deploy", {}],
      ["", {}],
      ["explain-refusal", { code: "Order Not Payable" }],
      ["explain-refusal", { code: "order-not-payable" }],
    ];
    for (const [name, args] of Object.entries(valid)) {
      const prompt = LOCAL_PROMPTS[name as keyof typeof LOCAL_PROMPTS];
      invalid.push([name, { ...args, extra: "1" }]);
      for (const argument of promptArguments(prompt.input)) {
        invalid.push([name, { ...args, [argument.name]: 42 }]);
        if (argument.required)
          invalid.push([
            name,
            Object.fromEntries(Object.entries(args).filter(([key]) => key !== argument.name)),
          ]);
      }
    }
    const known = knowledge;
    for (const [name, args] of invalid) {
      expect(() => getLocalPrompt(known, name, args), `${name} ${JSON.stringify(args)}`).toThrow(
        expect.objectContaining({ code: -32_602 }),
      );
    }
  });
});

describe("promptArguments", () => {
  it("lists each argument with its description and whether it is required", () => {
    expect(promptArguments(LOCAL_PROMPTS["add-feature"].input)).toEqual([
      { name: "feature", description: "What to build, in plain words", required: true },
      {
        name: "member",
        description: expect.stringContaining("The member it belongs in"),
        required: false,
      },
    ]);
    expect(promptArguments(LOCAL_PROMPTS["fix-gen-drift"].input)).toEqual([
      { name: "output", description: expect.any(String), required: false },
    ]);
    expect(
      promptArguments(LOCAL_PROMPTS["explain-refusal"].input).map((argument) => [
        argument.name,
        argument.required,
      ]),
    ).toEqual([
      ["code", true],
      ["message", false],
    ]);
  });
});
