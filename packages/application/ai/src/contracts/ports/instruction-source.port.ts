/**
 * Stackra file contract:
 * Purpose: the `InstructionSource` port: the instructions an agent runs with, read from its versioned prompt
 *          document, never from code.
 * Boundary: an abstract class that is its own token, keyed `ai.InstructionSource`. The ai service reads the agent's
 *           published prompt document (a module asset `<module>::ai/<key>.md` or a tenant's revision) for the locale;
 *           this package never holds prompt text.
 * Runtime: isomorphic
 * Governing contract: ADR 0245 (decision 6: prompts are versioned documents); config-model (prompts are data); STA-781.
 */
import { Port } from "@stackra/contracts";

/**
 * Reads agent instructions.
 *
 * @example
 * const text = await instructions.instructions("matter_assistant", "ar-SA");
 */
export abstract class InstructionSource extends Port {
  /** Type-only port key, so `DriverName<InstructionSource>` narrows to this port's drivers. */
  declare readonly "~key": "ai.InstructionSource";

  /** The published instructions of the agent `agent` in `locale` (the document's default when absent). */
  abstract instructions(agent: string, locale?: string): Promise<string>;
}
