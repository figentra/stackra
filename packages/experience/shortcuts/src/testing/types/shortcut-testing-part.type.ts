/**
 * Stackra file contract:
 * Purpose: `ShortcutTestingPart`, how another package's testing setup takes part in `runShortcut` without this package
 *          importing it: navigation fakes `navigate` and records navigations, theming fakes `theme`, gen's test setup
 *          builds the shortcut from the member's wiring and hands out its stores.
 * Boundary: a type only; called once per `runShortcut`, so each run starts from fresh fakes. Registered with
 *           `registerShortcutTestingPart` from the part's own testing setup, which gen's vitest config loads.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3: a package never reaches into another package's `./testing`).
 */
import type { AnyClass } from "@stackra/container";

import type { RunnableShortcut } from "#core/index";
import type { ShortcutRunInput } from "#testing/types/shortcut-run-input.type";
import type { ShortcutTestingContribution } from "#testing/types/shortcut-testing-contribution.type";

/** One package's share of every test run. */
export type ShortcutTestingPart = (run: {
  /** The shortcut class under test. */
  readonly type: AnyClass<RunnableShortcut>;
  /** The test's starting state. */
  readonly input: ShortcutRunInput;
}) => ShortcutTestingContribution | Promise<ShortcutTestingContribution>;
