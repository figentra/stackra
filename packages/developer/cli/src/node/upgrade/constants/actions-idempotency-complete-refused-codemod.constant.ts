/**
 * Stackra file contract:
 * Purpose: `ACTIONS_IDEMPOTENCY_COMPLETE_REFUSED_CODEMOD`, 0.30.0: `IdempotencyStore` gains
 *          `completeRefused(key, fingerprint, refusal, ttl)`; the codemod reports every custom store without it.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); STA-145; changeset 0394e56.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** A refusal kept under its idempotency key. */
export const ACTIONS_IDEMPOTENCY_COMPLETE_REFUSED_CODEMOD: UpgradeCodemod = {
  id: "actions-idempotency-complete-refused",
  version: "0.30.0",
  title: "IdempotencyStore gains completeRefused",
  note: "A call refused for a reason no retry can change keeps its refusal under its Idempotency-Key, so a retry gets the same refusal. IdempotencyStore gains completeRefused(key, fingerprint, refusal, ttl) and IdempotencyRecord a refusal form; the memory, Valkey and Postgres drivers implement it. A custom store must implement it too: the codemod lists each one.",
  source: "0394e56",
  report: {
    modules: ["@stackra/actions", "@stackra/actions/contracts"],
    rule: {
      any: [
        { kind: "class_declaration" },
        { kind: "abstract_class_declaration" },
        { kind: "class" },
      ],
      has: {
        kind: "class_heritage",
        has: {
          any: [{ kind: "identifier" }, { kind: "type_identifier" }],
          regex: "^IdempotencyStore$",
          stopBy: "end",
        },
      },
      not: {
        has: {
          field: "body",
          has: { kind: "method_definition", has: { field: "name", regex: "^completeRefused$" } },
        },
      },
    },
    message:
      "implement completeRefused(key, fingerprint, refusal, ttl): keep the refusal under the key, as the memory driver does",
  },
};
