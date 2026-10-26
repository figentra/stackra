/**
 * Stackra file contract:
 * Purpose: `AUTOMATION_DOCUMENT_SCHEMA`, the zod schema of `AutomationDocument` (its `X$`): the automation document
 *          kind, a tenant's "when event, if condition, then action, wait" flow as data, and the shape of an agent's
 *          plan (a document without a trigger). It names its key, its version, the trigger block that starts it, a
 *          run timeout, and its steps: each calls an action block with an input, may first wait for a trigger block,
 *          may run only when a condition over the trigger's facts holds, and may call its block once per item of a
 *          list (`forEach`, OS-232).
 * Boundary: shape only: `checkAutomation` checks what needs the registry (each block is registered and of the right
 *           kind, each reference points backwards, each condition fits the trigger's facts). An input value may be a
 *           reference `{ "$ref": "input.orderId" }`, `results.<step>.<path>`, in a waiting step `event.<path>`, and in
 *           a for-each step `item` or `item.<path>` (the current item): data that points at data, never an
 *           expression. How many items a for-each step takes is configuration (`workflow.forEachLimit`), read when it
 *           runs. Durations are text (`"15m"`). At most 50 steps with distinct camelCase names; a waiting step's
 *           timeout is its wait's.
 * Runtime: isomorphic
 * Governing contract: ADR 0122 (decision 3: an automation is versioned data that references code); ADR 0270 (decision
 *                     6: the automation document kind); ADR 0245 (decision 8: a plan runs as an ephemeral workflow);
 *                     ADR 0154 (no code in tenant data); ADR 0294 (decision 26); OS-232 (for-each, its count
 *                     configured).
 */
import { Enum } from "@stackra/contracts";
import { Backoff } from "@stackra/queue";
import { duration } from "@stackra/validation";
import { z } from "zod";

/** A block key. */
const BLOCK = z
  .string()
  .regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/, "Expected a building block key");

/** A reference path: a root, then dotted names; `item` alone is the current item of a for-each step. */
const REF = z
  .string()
  .regex(
    /^((input|results|event)(\.[A-Za-z0-9_]+)+|item(\.[A-Za-z0-9_]+)*)$/,
    "Expected input.*, results.*, event.* or item",
  );

/** The list a for-each step walks: a reference to the run's input, an earlier result or the received occurrence. */
const LIST = z
  .string()
  .regex(/^(input|results|event)(\.[A-Za-z0-9_]+)+$/, "Expected input.*, results.* or event.*");

/** A duration such as `"15m"`. */
const DURATION = z.string().refine(
  (text) => {
    try {
      duration(text);
      return true;
    } catch {
      return false;
    }
  },
  { message: 'Expected a duration such as "15m"' },
);

/** The shipped `AutomationDocument$`. */
export const AUTOMATION_DOCUMENT_SCHEMA = z
  .object({
    key: z
      .string()
      .regex(
        /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/,
        "Expected a key such as commerce.cod_confirmation",
      ),
    version: z.int().min(1).default(1),
    trigger: z.object({ block: BLOCK }).exactOptional(),
    timeout: DURATION.exactOptional(),
    steps: z
      .array(
        z
          .object({
            name: z.string().regex(/^[a-z][a-zA-Z0-9]{0,62}$/, "Expected a camelCase step name"),
            block: BLOCK.exactOptional(),
            input: z.record(z.string(), z.json()).default({}),
            when: z.json().exactOptional(),
            waitFor: z
              .object({ block: BLOCK, correlate: REF, timeout: DURATION.exactOptional() })
              .exactOptional(),
            retry: z
              .object({
                attempts: z.int().min(1).max(10),
                backoff: z.enum(Enum.values(Backoff)).exactOptional(),
              })
              .exactOptional(),
            timeout: DURATION.exactOptional(),
            forEach: z.object({ items: LIST }).exactOptional(),
          })
          .refine((step) => step.block !== undefined || step.waitFor !== undefined, {
            message: "A step calls a block, waits, or both",
            path: ["block"],
          })
          .refine((step) => step.waitFor === undefined || step.timeout === undefined, {
            message: "A waiting step's timeout is its wait's",
            path: ["timeout"],
          })
          .refine((step) => step.forEach === undefined || step.block !== undefined, {
            message: "A for-each step calls a block",
            path: ["forEach"],
          }),
      )
      .min(1)
      .max(50),
  })
  .refine(
    (document) => new Set(document.steps.map((step) => step.name)).size === document.steps.length,
    { message: "Two steps share a name", path: ["steps"] },
  );
