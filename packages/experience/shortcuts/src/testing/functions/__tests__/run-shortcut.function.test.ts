/**
 * Stackra file contract:
 * Purpose: unit and type tests of `runShortcut`: a shortcut with no dependencies is built and run with the test's
 *          input; parts fake members, record what the run did and build an instance with its dependencies; an input
 *          member no part claims is passed as given; a failing `run` rejects. The fakes restate the template's tests
 *          (theme cycling, a recorded sign-out navigation, a store the shortcut opens).
 * Boundary: test only; resets the parts before each test; local fakes stand in for the theming, navigation and gen
 *           parts, which live in their own packages.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); the template's `shortcuts/__tests__/*.shortcut.test.ts`.
 */
import { beforeEach, describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Shortcut } from "#core/bases/shortcut.base";
import type { ShortcutContext } from "#core/types/shortcut-context.type";
import { SHORTCUT_TESTING_PARTS } from "#testing/constants/shortcut-testing-parts.constant";
import { registerShortcutTestingPart } from "#testing/functions/register-shortcut-testing-part.function";
import { runShortcut } from "#testing/functions/run-shortcut.function";

/** The context members the template's shortcuts use, as the theming and navigation packages would add them. */
type TemplateContext = {
  theme: { scheme: string; setScheme: (scheme: string) => void };
  navigate: (to: string, options?: { external?: boolean }) => void;
};

/** A stand-in for the console's palette store. */
class PaletteStore {
  isOpen = false;

  open(): void {
    this.isOpen = true;
  }
}

class CycleThemeShortcut extends Shortcut({
  keys: "mod+shift+l",
  group: "console::palette.group_app",
}) {
  run(ctx: ShortcutContext): void {
    const { theme } = ctx as TemplateContext;
    const schemes = ["light", "dark", "system"];
    theme.setScheme(schemes[(schemes.indexOf(theme.scheme) + 1) % schemes.length] ?? "light");
  }
}

class SignOutShortcut extends Shortcut({ group: "console::palette.group_account" }) {
  run(ctx: ShortcutContext): void {
    (ctx as TemplateContext).navigate("/api/auth/logout", { external: true });
  }
}

class OpenPaletteShortcut extends Shortcut({
  keys: "mod+k",
  group: "console::palette.group_app",
}) {
  private readonly palette: PaletteStore;

  constructor(palette: PaletteStore) {
    super();
    this.palette = palette;
  }

  run(): void {
    this.palette.open();
  }
}

class FailingShortcut extends Shortcut({ group: "console::palette.group_app" }) {
  run(): void {
    throw new Error("nope");
  }
}

beforeEach(() => {
  SHORTCUT_TESTING_PARTS.clear();
});

describe("runShortcut", () => {
  it("fakes a member from the input and returns the changed fake", async () => {
    registerShortcutTestingPart("theming", ({ input }) => {
      const theme = {
        scheme: "system",
        ...(input as { theme?: { scheme?: string } }).theme,
        setScheme(scheme: string) {
          theme.scheme = scheme;
        },
      };
      return { context: { theme } };
    });
    const fromLight = await runShortcut(CycleThemeShortcut, {
      theme: { scheme: "light" },
    } as never);
    expect((fromLight as unknown as TemplateContext).theme.scheme).toBe("dark");
    const fromSystem = await runShortcut(CycleThemeShortcut, {
      theme: { scheme: "system" },
    } as never);
    expect((fromSystem as unknown as TemplateContext).theme.scheme).toBe("light");
  });

  it("returns what a part recorded", async () => {
    registerShortcutTestingPart("navigation", () => {
      const navigations: { to: string; external?: boolean }[] = [];
      return {
        context: {
          navigate: (to: string, options: { external?: boolean } = {}) =>
            navigations.push({ to, ...options }),
          navigations,
        },
      };
    });
    const run = (await runShortcut(SignOutShortcut)) as unknown as {
      navigations: { to: string; external?: boolean }[];
    };
    expect(run.navigations).toEqual([{ to: "/api/auth/logout", external: true }]);
  });

  it("takes the instance a part builds with its dependencies", async () => {
    registerShortcutTestingPart("wiring", ({ type }) => {
      const palette = new PaletteStore();
      return {
        ...(type === OpenPaletteShortcut ? { shortcut: new OpenPaletteShortcut(palette) } : {}),
        context: { stores: { get: () => palette } },
      };
    });
    const run = await runShortcut(OpenPaletteShortcut);
    const { stores } = run as unknown as { stores: { get: (type: unknown) => PaletteStore } };
    expect(stores.get(PaletteStore).isOpen).toBe(true);
    expect(run.shortcut).toBeInstanceOf(OpenPaletteShortcut);
    expectTypeOf(run.shortcut).toEqualTypeOf<OpenPaletteShortcut>();
  });

  it("passes an unclaimed input member as given", async () => {
    const navigations: string[] = [];
    await runShortcut(SignOutShortcut, {
      navigate: (to: string) => navigations.push(to),
    } as never);
    expect(navigations).toEqual(["/api/auth/logout"]);
  });

  it("rejects with what run throws", async () => {
    await expect(runShortcut(FailingShortcut)).rejects.toThrow("nope");
  });
});
