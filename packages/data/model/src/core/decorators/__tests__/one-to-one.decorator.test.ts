/**
 * Stackra file contract:
 * Purpose: unit tests of `@OneToOne`: the owning side records the target and the delete rule, the inverse side the
 *          target and the inverse property thunk; tsc refuses it on a field that is not a reference; refused on a
 *          class that is not a model.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 6, 11 and 27).
 */
import type { Ref } from "@mikro-orm/core";
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { OneToOne } from "#core/decorators/one-to-one.decorator";
import { OnDelete } from "#core/enums/on-delete.enum";
import { HasPublicId } from "#core/traits/has-public-id.trait";

class User extends Model.with(HasPublicId("usr")) {
  @OneToOne(() => Profile, (profile) => profile.user)
  profile!: Ref<Profile> | null;
}

class Profile extends Model.with(HasPublicId("prf")) {
  @OneToOne(() => User, { onDelete: OnDelete.Cascade })
  user!: Ref<User>;
}

describe(OneToOne, () => {
  it("records the owning side's target and delete rule", () => {
    const relation = OneToOne.members(Profile).get("user");
    expect(relation?.target()).toBe(User);
    expect(relation?.onDelete).toBe("cascade");
    expect(relation?.inverse).toBeUndefined();
  });

  it("records the inverse side's target and property", () => {
    const relation = OneToOne.members(User).get("profile");
    expect(relation?.target()).toBe(Profile);
    expect(typeof relation?.inverse).toBe("function");
  });

  it("is typed against its field", () => {
    class Wrong extends Model.with() {
      // @ts-expect-error: a number field is not a reference
      @OneToOne(() => User)
      user = 1;
    }
    expect(OneToOne.members(Wrong).has("user")).toBe(true);
  });

  it("refuses a class that is not a model", () => {
    class Plain {
      user!: Ref<User>;
    }
    const decorate = OneToOne(() => User) as (target: object, property: string) => void;
    expect(() => decorate(Plain.prototype, "user")).toThrow(TypeError);
  });
});
