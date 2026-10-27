/**
 * Stackra file contract:
 * Purpose: unit tests of `surfacesOf`, `checkSurfaces` and the manifest's `surfaces` section: a shell dependency's
 *          slot surfaces become `<surface>@<major>` targets, a dependency without slots and the member's own slots add
 *          none, two shells on one surface at different majors are refused (`surface_targets_conflict`), and
 *          `buildManifest` writes the section only when there is a surface.
 * Boundary: test only; the IR is built by hand.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0436; ADR 0438.
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { buildManifest } from "#core/functions/build-manifest.function";
import { checkSurfaces } from "#core/functions/check-surfaces.function";
import { surfacesOf } from "#core/functions/surfaces-of.function";
import type { MemberIR } from "#core/types/member-ir.type";

/** A shell package's manifest at `version` with slots on `surfaces`. */
function shell(pkg: string, version: string, surfaces: readonly string[]): StackraManifest {
  return {
    member: "shell",
    package: pkg,
    version,
    slots: surfaces.map((surface, index) => ({
      name: `Slot${index}`,
      key: `${surface}.slot_${index}`,
      surface,
      cardinality: "many",
      props: {},
    })),
  } as unknown as StackraManifest;
}

/** A product UI package depending on `dependencies`. */
function member(dependencies: MemberIR["dependencies"], extra: Partial<MemberIR> = {}): MemberIR {
  return {
    member: "console_ui",
    package: "@mezzora/console-ui",
    version: "1.4.0",
    layout: "package",
    modules: [],
    classes: [],
    shapes: [],
    enums: [],
    files: [],
    dependencies,
    errors: [],
    ...extra,
  };
}

describe("surfacesOf", () => {
  it("targets each surface a shell dependency's slots sit on, at the shell's major", () => {
    const ir = member([
      { package: "@os/console-shell", manifest: shell("@os/console-shell", "3.2.1", ["console"]) },
      { package: "@os/till-shell", manifest: shell("@os/till-shell", "0.4.0", ["till", "kiosk"]) },
      {
        package: "@stackra/ui",
        manifest: { member: "ui", package: "@stackra/ui", version: "2.0.0" },
      },
    ]);
    expect(surfacesOf(ir)).toEqual([
      { surface: "console", targets: "console@3", shell: "@os/console-shell" },
      { surface: "kiosk", targets: "kiosk@0", shell: "@os/till-shell" },
      { surface: "till", targets: "till@0", shell: "@os/till-shell" },
    ]);
    expect(checkSurfaces(ir)).toEqual([]);
  });

  it("reads no target from the member's own slots", () => {
    const ir = member([], {
      slots: [
        {
          name: "SignInBrandPanel",
          file: "src/core/slots/sign-in.slot.ts",
          importPath: "#core/slots/sign-in.slot",
          key: "auth.sign_in.brand_panel",
          surface: "console",
          cardinality: "one",
          props: {},
        },
      ],
    });
    expect(surfacesOf(ir)).toEqual([]);
  });

  it("refuses one surface on two shell lines", () => {
    const ir = member([
      { package: "@os/console-shell", manifest: shell("@os/console-shell", "3.0.0", ["console"]) },
      { package: "@os/portal-shell", manifest: shell("@os/portal-shell", "2.1.0", ["console"]) },
    ]);
    const errors = checkSurfaces(ir);
    expect(errors.map((error) => [error.code, error.subject])).toEqual([
      ["surface_targets_conflict", "console"],
    ]);
    expect(errors[0]?.message).toContain("console@2 (@os/portal-shell)");
    expect(errors[0]?.message).toContain("console@3 (@os/console-shell)");
  });

  it("writes the surfaces section to the manifest only when there is one", () => {
    const targeted = buildManifest(
      member([
        {
          package: "@os/console-shell",
          manifest: shell("@os/console-shell", "3.0.0", ["console"]),
        },
      ]),
    ).manifest;
    expect(targeted["surfaces"]).toEqual([
      { surface: "console", targets: "console@3", shell: "@os/console-shell" },
    ]);
    expect(buildManifest(member([])).manifest["surfaces"]).toBeUndefined();
  });
});
