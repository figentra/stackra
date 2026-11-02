/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: `usePermission`, which the template's generated navigation
 *          imports, and the IAM kit's `Can`, `RolePicker` and `RolesPage` are its only exports.
 * Boundary: test only; imports the stand-in barrel through its `#react` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15); ADR 0504.
 */
import { describe, expect, it } from "@stackra/testing";

import { Can } from "#react/can/can";
import * as react from "#react/index";
import { usePermission } from "#react/permission/use-permission";
import { RolePicker } from "#react/role-picker/role-picker";
import { RolesPage } from "#react/roles-page/roles-page";

describe("@stackra/iam/react", () => {
  it("exports exactly usePermission and the kit", () => {
    expect(Object.keys(react).sort()).toEqual(["Can", "RolePicker", "RolesPage", "usePermission"]);
    expect(react.Can).toBe(Can);
    expect(react.RolePicker).toBe(RolePicker);
    expect(react.RolesPage).toBe(RolesPage);
    expect(react.usePermission).toBe(usePermission);
  });
});
