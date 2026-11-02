/**
 * Stackra file contract:
 * Purpose: `CommandStructure`, everything the kernel knows about a command without running it: its kind options and
 *          its fields in declaration order.
 * Boundary: a type only; serialisable and frozen.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-001 and FR-014.
 */
import type { CommandField } from "#contracts/types/command-field.type";

/** A command as the kernel sees it. */
export interface CommandStructure {
  /** The command's name. */
  readonly name: string;

  /** Its one-line description. */
  readonly description: string;

  /** Whether the list leaves it out. */
  readonly hidden: boolean;

  /** Its other names. */
  readonly aliases: readonly string[];

  /** Each run is audited. */
  readonly audit: boolean;

  /** A package's own bin command, never contributed to a host. */
  readonly bin: boolean;

  /** The heading of the command list it sits under, when the command names one. */
  readonly group?: string;

  /** Its docs link, when it has one. */
  readonly docs?: string;

  /** Its local developer MCP tool, when it is one. */
  readonly tool?: { readonly readOnly: boolean };

  /** Complete invocations its help shows. */
  readonly examples: readonly string[];

  /** Its positional fields, in order. */
  readonly arguments: readonly CommandField[];

  /** Its named fields, in order. */
  readonly options: readonly CommandField[];
}
