/**
 * Stackra file contract:
 * Purpose: `LOCAL_PROMPTS`, the prompts the local `stackra mcp` server offers: `add-feature`, `fix-gen-drift` and
 *          `explain-refusal`, each a recipe over the open CLI commands that ends with `stackra gen --check` and the
 *          tests. Each `input` is the zod object of its string arguments; `prompts/list` derives the argument list
 *          (name, description, required) from it.
 * Boundary: data only; `getLocalPrompt` writes the messages. Layer 1 (ADR 0282 decision 6): the recipes order the open
 *           commands and point to the open skills; layer-2 fix playbooks stay with the hosted server.
 * Runtime: node
 * Governing contract: ADR 0282 (decisions 5, 6 and 7); STA-2919.
 */
import { z } from "zod";

/** The longest argument text a prompt takes. */
const LONG = 100_000;

/** A member key, as `stackra.manifest.json` holds it. */
const MEMBER = z
  .string()
  .regex(/^[a-z][a-z0-9_-]*$/, "A member key, such as `commerce` or `loyalty_kit`");

/** Every local prompt, by name. */
export const LOCAL_PROMPTS = {
  "add-feature": {
    title: "Add a feature",
    description:
      "A recipe to add a feature to a Stackra repository the Stackra way: read the guidelines and the skills that " +
      "apply, find or create the member, scaffold with `stackra new`, write actions and tests, and end with " +
      "`stackra gen --check` and the tests.",
    input: z.strictObject({
      feature: z
        .string()
        .trim()
        .min(1, "Say what to build")
        .max(LONG)
        .describe("What to build, in plain words"),
      member: MEMBER.optional().describe(
        "The member it belongs in, such as `commerce`; leave it out to choose or create one",
      ),
    }),
  },
  "fix-gen-drift": {
    title: "Fix gen drift",
    description:
      "A recipe for a failing `stackra gen --check`: tell a stale generated file from a refusal, fix the source or " +
      "regenerate, never hand-edit generated output, and end with `stackra gen --check` and the tests.",
    input: z.strictObject({
      output: z
        .string()
        .max(LONG)
        .optional()
        .describe("What `stackra gen --check` printed; leave it out to have the check run first"),
    }),
  },
  "explain-refusal": {
    title: "Explain a refusal",
    description:
      "A recipe to explain a refusal code and fix its cause: the members whose manifests declare the code, the " +
      "error conventions, which side is wrong, a test, and `stackra gen --check` and the tests.",
    input: z.strictObject({
      code: z
        .string()
        .trim()
        .regex(/^[a-z][a-z0-9_]*$/, "A snake_case refusal code, such as `order_not_payable`")
        .describe("The refusal code, such as `order_not_payable`"),
      message: z
        .string()
        .max(LONG)
        .optional()
        .describe("The message or envelope that came with it"),
    }),
  },
};
