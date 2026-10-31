/**
 * Stackra file contract:
 * Purpose: `ConsoleContainer`, the two things the kernel needs of a DI container: build a command with its
 *          collaborators, and close. `Container` of `@stackra/container` satisfies it.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-008 and FR-013; ADR 0263.
 */

/** A container the kernel resolves commands from. */
export interface ConsoleContainer {
  /** The instance of a command class, built with its collaborators. */
  readonly get: <T extends object>(type: abstract new (...args: never[]) => T) => T;

  /** Shuts the container down. */
  readonly close: () => Promise<void>;
}
