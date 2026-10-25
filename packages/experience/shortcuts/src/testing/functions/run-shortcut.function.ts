/**
 * Stackra file contract:
 * Purpose: `runShortcut(Class, input?)`, the one test helper of a shortcut: it builds the class, assembles the context
 *          from the registered testing parts and the test's input, runs it once and resolves to the context members,
 *          the parts' extra members (`stores`, `router`, `navigations`) and the instance, for the test to assert on.
 * Boundary: test code only. The instance comes from the first part that builds one (gen's test setup, over the
 *           member's wiring); without such a part the class is constructed with no arguments, which suits a shortcut
 *           that injects nothing. An input member no part claims is passed to `run(ctx)` as given, so a test can hand
 *           a plain fake. Rejects with whatever `run` throws.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); the template's `shortcuts/__tests__/*.shortcut.test.ts`.
 */
import type { RunnableShortcut, ShortcutContext } from "#core/index";
import { SHORTCUT_TESTING_PARTS } from "#testing/constants/shortcut-testing-parts.constant";
import type { ShortcutRun } from "#testing/types/shortcut-run.type";
import type { ShortcutRunInput } from "#testing/types/shortcut-run-input.type";

/**
 * Runs `type` once and returns what it ran with.
 *
 * @example
 * const fromLight = await runShortcut(CycleThemeShortcut, { theme: { scheme: ColorScheme.Light } });
 * expect(fromLight.theme.scheme).toBe(ColorScheme.Dark);
 *
 * const { navigations } = await runShortcut(SignOutShortcut);
 * expect(navigations).toEqual([{ to: "/api/auth/logout", external: true }]);
 */
export async function runShortcut<S extends RunnableShortcut>(
  type: new (...args: never[]) => S,
  input: ShortcutRunInput = {},
): Promise<ShortcutRun & ShortcutContext & { readonly shortcut: S }> {
  const context: Record<string, unknown> = {};
  let shortcut: S | undefined;
  for (const part of SHORTCUT_TESTING_PARTS.values()) {
    const contribution = await part({ type, input });
    shortcut ??= contribution.shortcut as S | undefined;
    Object.assign(context, contribution.context);
  }
  for (const [member, value] of Object.entries(input))
    if (!Object.hasOwn(context, member)) context[member] = value;
  // oxlint-disable-next-line eslint/new-cap -- reason: the shortcut class arrives as a parameter
  shortcut ??= new type();
  await shortcut.run(context as ShortcutContext);
  return { ...context, shortcut } as ShortcutRun & ShortcutContext & { readonly shortcut: S };
}
