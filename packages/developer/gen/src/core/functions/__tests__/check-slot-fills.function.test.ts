/**
 * Stackra file contract:
 * Purpose: unit tests of `checkSlotFills` and `slotOf`: a fill of a dependency's slot (from its committed manifest) or
 *          of an own slot passes; an undeclared slot, another surface, other props, two fills of a `one` slot and two
 *          own slots with one key are refused with their codes; and `buildManifest` lists the slots and the resolved
 *          fills.
 * Boundary: test only; the IR is built by hand.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0438.
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { buildManifest } from "#core/functions/build-manifest.function";
import { checkSlotFills } from "#core/functions/check-slot-fills.function";
import { slotOf } from "#core/functions/slot-of.function";
import type { MemberIR } from "#core/types/member-ir.type";
import type { SlotFillIR } from "#core/types/slot-fill-ir.type";

const PROPS = { brand: "string", "tagline?": "string" };

const SHELL = {
  member: "console_shell",
  package: "@os/console-shell",
  version: "1.0.0",
  slots: [
    {
      name: "SignInBrandPanel",
      key: "auth.sign_in.brand_panel",
      surface: "console",
      cardinality: "one",
      props: PROPS,
    },
    {
      name: "SignInFooter",
      key: "auth.sign_in.footer",
      surface: "console",
      cardinality: "many",
      props: {},
    },
  ],
} as unknown as StackraManifest;

/** A fill of `slot` on `surface` with `props`. */
function fill(
  name: string,
  slot: string,
  surface = "console",
  props: Record<string, string> = PROPS,
): SlotFillIR {
  return {
    name,
    file: `src/core/fills/${name}.fill.ts`,
    line: 3,
    column: 1,
    slot: { name: slot, from: "@os/console-shell" },
    surface,
    props,
  };
}

/** A product UI package with `fills`. */
function member(fills: readonly SlotFillIR[], extra: Partial<MemberIR> = {}): MemberIR {
  return {
    member: "console_ui",
    package: "@mezzora/console-ui",
    version: "1.0.0",
    layout: "package",
    modules: [],
    classes: [],
    shapes: [],
    enums: [],
    files: [],
    dependencies: [{ package: "@os/console-shell", manifest: SHELL }],
    errors: [],
    fills,
    ...extra,
  };
}

describe("slotOf", () => {
  it("resolves a dependency's slot from its manifest, an entry subpath included", () => {
    expect(
      slotOf(member([]), { name: "SignInBrandPanel", from: "@os/console-shell/react" })?.key,
    ).toBe("auth.sign_in.brand_panel");
    expect(slotOf(member([]), { name: "Nope", from: "@os/console-shell" })).toBeUndefined();
    expect(slotOf(member([]), { name: "SignInBrandPanel", from: "@os/other" })).toBeUndefined();
  });
});

describe("checkSlotFills", () => {
  it("passes matching fills, many fills of a many slot included", () => {
    expect(
      checkSlotFills(
        member([
          fill("brand", "SignInBrandPanel"),
          fill("a", "SignInFooter", "console", {}),
          fill("b", "SignInFooter", "console", {}),
        ]),
      ),
    ).toEqual([]);
  });

  it("refuses an undeclared slot, another surface and other props", () => {
    const codes = checkSlotFills(
      member([
        fill("ghost", "SignInGhost"),
        fill("ops", "SignInBrandPanel", "ops"),
        fill("stale", "SignInBrandPanel", "console", { brand: "number" }),
      ]),
    ).map((error) => [error.subject, error.code]);
    expect(codes).toEqual([
      ["ghost", "slot_undeclared"],
      ["ops", "slot_surface_mismatch"],
      ["stale", "slot_props_mismatch"],
      ["auth.sign_in.brand_panel", "slot_fill_duplicate"],
    ]);
  });

  it("names the differing props in the message", () => {
    const [error] = checkSlotFills(
      member([fill("stale", "SignInBrandPanel", "console", { brand: "number" })]),
    );
    expect(error?.message).toContain("brand: string ≠ number");
    expect(error?.message).toContain("tagline?: string ≠ (absent)");
  });

  it("checks an own slot and refuses two own slots with one key", () => {
    const own = {
      name: "Header",
      file: "src/core/slots/header.slot.ts",
      importPath: "#core/slots/header.slot",
      key: "shell.header",
      surface: "console",
      cardinality: "one",
      props: {},
    };
    const ir = member(
      [
        {
          ...fill("header", "Header", "console", {}),
          slot: { name: "Header", from: "#core/slots/header.slot" },
        },
      ],
      { slots: [own, { ...own, name: "Header2", file: "src/core/slots/header2.slot.ts" }] },
    );
    expect(checkSlotFills(ir).map((error) => error.code)).toEqual(["slot_key_duplicate"]);
  });
});

describe("buildManifest slot sections", () => {
  it("lists the declared slots and the resolved fills", () => {
    const { manifest } = buildManifest(
      member([fill("brand", "SignInBrandPanel"), fill("ghost", "SignInGhost")], {
        slots: [
          {
            name: "Header",
            file: "src/core/slots/header.slot.ts",
            importPath: "#core/slots/header.slot",
            key: "shell.header",
            surface: "console",
            cardinality: "one",
            props: {},
          },
        ],
      }),
    );
    expect(manifest["slots"]).toEqual([
      {
        key: "shell.header",
        name: "Header",
        from: "@mezzora/console-ui",
        surface: "console",
        cardinality: "one",
        props: {},
      },
    ]);
    expect(manifest["fills"]).toEqual([
      {
        slot: "auth.sign_in.brand_panel",
        name: "brand",
        from: "@mezzora/console-ui",
        surface: "console",
        props: PROPS,
      },
    ]);
  });
});
